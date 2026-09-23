# Module m10 — Embedding infrastructure

## Embedding infrastructure

The rankers, retrievers and sequence models in this course are mostly a thin network wrapped around one very
      large matrix. This module is about operating that matrix: how the table is looked up and trained, and what you do when
      it does not fit on the device.

### The table *is* the model

In a CTR or retrieval model you have `F` sparse features (user id, item id, category, hashed tokens…), each with
      its own cardinality `C`, projected to `d` dimensions at `p` bytes per value. The dense MLP is
      megabytes; the tables are everything else:

```
table bytes  =  Σ_f  C_f · d · p
optimiser  =  × 1 (SGD)   × 2 (Adagrad: +1 accumulator)   × 3 (Adam: +m, +v)
```

Twenty features at 5M cardinality, `d = 128`, fp32 is already **51 GB** — and **154 GB**
      once Adam keeps its two extra fp32 slots. This is why recommendation training papers spend half their space on
      parallelism: the parameter count lives almost entirely in the tables.

> Why this changes the whole training design
      A dense layer touches every parameter each step. A table touches only the rows named by the batch — typically a tiny
        fraction. That single fact drives sparse gradients, sparse optimisers, sharding, caching and tiering. Every technique in
        this module follows from “the table is huge and almost entirely cold at any instant”.

### How the table is loaded and trained

The short answer to “how do you load the embedding table during training?” is: **you mostly don’t**. You hold a
      *gather* of the rows your batch references, and a *scatter-add* of their gradients back — the untouched rows are
      never read or written.
- **Forward = gather.** A batch of `[B, F]` integer ids indexes the table into `[B, F, d]`.
        Duplicate ids in a batch are coalesced before the lookup.
- **Backward = scatter-add.** Gradients land only on the rows in the batch, which is what “sparse gradient”
        means — a gradient tensor with as many non-zeros as the batch touched.
- **The optimiser must understand sparsity.** `SparseAdam`, Adagrad or FTRL update only the touched
        rows. A dense optimiser such as AdamW *densifies* the gradient, materialising `m` and `v` for the
        whole table — the single most common way to turn a 50 GB problem into a 150 GB one.
- **Per-row adaptive learning rates are the reason Adagrad/FTRL dominate.** Feature frequencies span many orders
        of magnitude; one global learning rate is wrong for most rows. Adagrad gives each row its own effective rate, needs only
        one extra slot, and FTRL adds L1 for a sparse, deployable table.
- **Ids must be remapped.** Build a vocabulary offline (or with online hashing) mapping raw ids to contiguous
        `[0, C)`; reserve a row for unknown/OOV and a zeroed padding row (`padding_idx`).
- **Initialise small.** Row embeddings from a narrow normal (e.g. `N(0, 0.01)`), scaled per feature by
        cardinality — a large init on a 10⁸-row table is both unstable and slow to converge.

```
emb = nn.Embedding(num_embeddings=C, embedding_dim=d, sparse=True, padding_idx=0)
opt = torch.optim.SparseAdam(emb.parameters(), lr=1e-3)   # touched rows only

ids = batch_ids                      # [B, F] int64, coalesced
x   = emb(ids)                       # [B, F, d] gather
logit = mlp(flatten(x))
loss  = F.binary_cross_entropy_with_logits(logit, y)
loss.backward()                      # scatter-add into ~|unique ids| rows
opt.step()
# embedding_bag handles variable-length id lists per example
```

> Operational details that bite
      **Checkpointing:** a 100 GB table does not fit in one all-gather — write sharded, streamed checkpoints and
        warm-start from the previous version. **Version skew:** embeddings must stay meaningful across model releases
        (this is exactly the “parameter drift” problem the TwHIN post raises in module 6). **Sparsity hygiene:** threshold
        the vocabulary by frequency, map the tail to OOV, and never let a one-off id allocate a permanent 512-byte row.

### If the table does not fit

Work the ladder from cheapest to most invasive. In practice you combine the first three before adding hardware.

| Lever | Mechanism | Saves | Cost |
|---|---|---|---|
| Quantise | fp32 → fp16/bf16 → int8 with per-row scales; product quantisation for more | 2–4× (or more) | small accuracy loss; int8 needs careful scaling |
| Shrink the space | frequency thresholding, hashing trick, dynamic/evolving vocabulary | often 2–10× | collisions and cold-start on new ids |
| Factorise the id | quotient-remainder / compositional embeddings: one big table → a product of small ones | up to ~√C per feature | extra compute; restructuring the feature |
| Shard (model parallel) | split the table across ranks; all-to-all gather + scatter each step | capacity = Σ device memory | **communication** becomes the bottleneck |
| Tier the storage | hot rows in HBM, warm in host DRAM, cold on NVMe with an LFU cache | 10×+ capacity | cache misses, prefetch complexity |

#### Sharding: row-wise vs column-wise

- **Row-wise** — every rank owns a contiguous slice of rows of every table. Storage is balanced, but each step
        needs an *all-to-all* to fetch the rows a rank’s batch needs and another to return gradients. Bytes per step ≈
        `2 × rows_touched × d × p` × 2 (gather + scatter). This is what DLRM describes as model parallelism for the
        embeddings alongside data parallelism for the MLP.
- **Column-wise** — each rank owns whole features (tables). No cross-rank gather, but the split is unbalanced
        (one 10⁹-row feature dominates). Hybrid splits exist for exactly this reason.
- **Measure the trade:** if step time is dominated by all-to-all, quantising the table halves the bytes moved —
        usually a bigger win than adding ranks.

> The pattern that scales furthest
      Because only the batch’s rows matter, you can keep the table *off* the accelerator entirely: shard it across host
        DRAM and NVMe, and stream the touched rows into HBM per step. This is the design behind distributed terabyte-scale
        embedding systems (Baidu’s DRAM+SSD service is the classic write-up) and the reason “cached lookups” are a first-class
        metric: hit rate, not FLOPs, decides throughput.

### Decision table & interview framing

| Symptom | First move | Then |
|---|---|---|
| Table ≈ 1–2× device memory | int8/fp16 values + sparse optimiser | frequency thresholding, coalesce ids |
| Table ≫ device memory | row-wise shard + all-to-all | quantise to halve the comms, tier cold rows |
| Step time dominated by comms | quantise; larger batch (amortise the all-to-all) | column-wise/hybrid split |
| Huge tail of rare ids | threshold + OOV bucket | hashing, dynamic vocabulary |
| Checkpointing takes hours | sharded, streamed, asynchronous snapshots | versioned warm-start |
| Embeddings drift across releases | versioned tables + re-indexing | shared embedding space (TwHIN-style) |

**Interview framing.** “How do you load an embedding table during training?” → *You don’t load it; you gather the
      rows the batch references, take sparse gradients, and update only those rows with a sparsity-aware optimiser — sharding the
      table only when it cannot fit, which makes the all-to-all the thing you then optimise.* “What if it is too big?” → quantise,
      shrink the id space, factorise the id, then shard, then tier — in that order.

### Exercises

Two exercises on sizing and on the sparsity mechanics.

### Module check


## Quiz bank

**Q1. Why does switching from a sparse optimiser to AdamW blow up memory on a large embedding table?**

- AdamW has a larger learning rate
- A dense optimiser densifies the gradient, materialising m and v tensors for every row, not just the touched ones  _(correct)_
- AdamW needs fp64
- It duplicates the table on each device

_Answer: A dense optimiser densifies the gradient, materialising m and v tensors for every row, not just the touched ones. Sparse gradients only carry the rows the batch touched. A dense optimiser treats the gradient as dense, so it allocates full-table momentum and variance — roughly tripling a 50 GB table to 150 GB._

**Q2. With row-wise sharding, what becomes the bottleneck each step?**

- Disk reads
- The all-to-all gather of touched rows plus the scatter of their gradients  _(correct)_
- Tokenizer throughput
- Checkpoint writes

_Answer: The all-to-all gather of touched rows plus the scatter of their gradients. Row-wise sharding balances storage but every step needs an all-to-all to fetch the rows a rank's batch references and another to return gradients. That is why quantising the table (halving the bytes moved) often beats adding ranks._

**Q3. Which lever should you try first when the table does not fit?**

- Add more devices
- Quantise (int8/fp16) and use a sparse optimiser  _(correct)_
- Increase the embedding dimension
- Rebuild the vocabulary from scratch

_Answer: Quantise (int8/fp16) and use a sparse optimiser. Quantisation and sparse updates are cheap, reversible and multiplicative — they shrink both the memory and the communication before you spend hardware. Only then shard, and only then tier cold rows to DRAM/NVMe._

