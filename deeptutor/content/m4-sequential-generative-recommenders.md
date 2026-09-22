# Module m4 — Sequential & generative recommenders

## Sequential & generative recommenders

From “what is this user like?” to “what did they do next?”. Four papers trace the arc from the
      Transformer, through two sequential classics, to the current generative frontier.

### Transformer from scratch

The blog builds the Transformer in code before using it for recommendation, because the sequential models are modified
      Transformers and the details matter. Two pieces to internalise:
- **Positional encoding.** Self-attention is permutation-invariant, so order must be injected. Sinusoids give
        each position a unique signature that generalises to unseen lengths.
- **Multi-head self-attention.** Project to Q, K, V; score, scale, mask, softmax, aggregate — in parallel heads.

```
Attention(Q,K,V) = softmax( Q Kᵀ / √d_k ) V        PE(pos,2i) = sin(pos / 10000^{2i/d})
```

### BERT

BERT is the encoder half plus a pretraining recipe. Understanding the recipe is what lets you read BERT4Rec:
- **Masked LM.** Hide ~15% of tokens, predict them from *both* sides. Needs care, because the
        `[MASK]` token never appears at fine-tuning time.
- **Next Sentence Prediction** — later shown less useful, but it is in the original design.
- **Pretrain once, fine-tune per task** — the paradigm that sequential recommenders inherit.

### SASRec

*Self-Attentive Sequential Recommendation.* The Transformer decoder-only stack applied to item sequences: the model
      attends to the past to predict the next item.
- **Causal mask** — position `t` may only attend to `≤ t`. This is what makes it a
        “recommend the next item” model rather than a masked one.
- **Learned positional embeddings** (not sinusoids), plus item embeddings; dropout and layer norm for stability.
- **Training objective**: binary — one positive (the true next item) versus sampled negatives — with a
        per-timestep loss, not a softmax over the whole catalogue.

```
S = scores(q, k)                              # [B, T, T]
mask = torch.tril(torch.ones(T, T)).bool()    # j > t is masked out
S = S.masked_fill(~mask, float("-inf"))
attn = softmax(S, dim=-1) @ v                  # only the past is visible
```

### BERT4Rec

The bidirectional counterpart: instead of predicting strictly the next item, mask a random item in the sequence and
      predict it from both directions — a **cloze** objective for behaviour sequences.

|  | SASRec | BERT4Rec |
|---|---|---|
| Attention | unidirectional (causal) | bidirectional |
| Objective | next-item | masked-item (cloze), output softmax over items |
| Sees future | no | yes (within the sequence) |
| Needs | 1 positive + negatives | softmax over item vocabulary |

Bidirectional context helps when history is dense; the cost is that you can no longer simply “predict the next token”. In
      production, the next-item formulation is usually what you actually need at serving time.

### HSTU — generative recommenders

“Actions Speak Louder than Words: Trillion-Parameter Sequential Transducers for Generative Recommendations.” This is the
      post the blog treats as a genuine paradigm shift, and it is worth reading against the critiques it makes of SASRec/BERT4Rec.
- **Unify the feature space.** Sparse (categorical/token) and dense (CTR stats, counts, aggregated signals)
        features are projected into one sequential representation — academic recsys often ignored dense features entirely.
- **Retrieval = next content-token prediction** and **ranking = next action-token prediction**.
        Recommendation becomes transduction, the same shape as GPT.
- **Amortise the cost.** Like two-tower, separate the expensive part so inference stays within a
        few-hundred-millisecond budget at scale.
- **High-performance attention** (HSTU) that handles long, non-stationary behaviour sequences and
        streaming data — the two things academic sequential models mostly dodge.

> The critique the blog endorses
      Real recommendation logs are *non-stationary streams*, not static datasets you can epoch over. A model that
        ignores serving latency, feature engineering, and the CG/ranker split is not a production model, however good its
        offline numbers. HSTU is interesting precisely because it keeps those constraints in view.

### Exercises

Two exercises that force you to write the pieces SASRec is built from.

### Module check


## Quiz bank

**Q1. What makes SASRec a “next-item” model rather than a masked (cloze) one?**

- It uses no positional embeddings
- A causal mask prevents position t from attending to the future  _(correct)_
- It predicts all items with a softmax
- It is bidirectional

_Answer: A causal mask prevents position t from attending to the future. The triangular causal mask means each position only sees the past, so the model is trained to predict the next item — the formulation you actually need at serving time._

**Q2. BERT4Rec differs from SASRec mainly by…**

- using a causal mask
- training with a masked-item (cloze) objective and bidirectional attention  _(correct)_
- dropping embeddings
- using LR instead of a Transformer

_Answer: training with a masked-item (cloze) objective and bidirectional attention. BERT4Rec masks random items and predicts them from both directions, producing a softmax over the item vocabulary and richer context, at the cost of a non-causal objective._

**Q3. In HSTU, retrieval and ranking are reframed respectively as…**

- matrix factorisation and logistic regression
- next content-token prediction and next action-token prediction  _(correct)_
- clustering and classification
- collaborative filtering and CTR

_Answer: next content-token prediction and next action-token prediction. HSTU recasts recommendation as sequential transduction: retrieval predicts the next content token, ranking predicts the next action token — the same shape as a generative language model._

**Q4. Per the blog, why do academic sequential models (SASRec/BERT4Rec) underperform industry systems?**

- They use too many layers
- They ignore non-stationary streaming data, the CG/ranker split, dense features and serving latency  _(correct)_
- They require GPUs
- They cannot use attention

_Answer: They ignore non-stationary streaming data, the CG/ranker split, dense features and serving latency. Real logs are continuously evolving streams, and production systems separate candidate generation from ranking; the papers discuss neither that, nor dense features, nor latency budgets._

