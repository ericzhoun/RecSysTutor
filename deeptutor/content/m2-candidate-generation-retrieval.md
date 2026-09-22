# Module m2 — Candidate generation / retrieval

## Candidate generation / retrieval

The two-tower family: how to learn a representation space where “nearest neighbours of the user” is a
      good recommendation — and how to stop the training signal from lying to you.

### Two-tower retrieval foundations

The reference implementation is Google’s *Sampling-Bias-Corrected Neural Modeling for Large Corpus Item
      Recommendations*. Two independent towers encode `<user, context>` and `<item>` into the
      same vector space; relevance is a dot product.

```
score(u, i) = ⟨ φ_user(U, C), ψ_item(I) ⟩
```

Because the item tower does not see the user at inference, every item embedding can be precomputed and indexed — turning
      “recommend” into an **approximate nearest-neighbour search**. That amortisation is the entire reason retrieval
      is tractable at YouTube scale: *item modelling is separated from user modelling*.

#### In-batch negatives

Training uses every other item in the batch as a negative for a given user. Cheap and effective — but the batch is not a
      random sample of the corpus, so the loss is biased. Two fixes from the paper:
- **logQ correction.** Subtract `log q(i)` (the item’s sampling probability) from each logit, so
        popular items are no longer over-penalised.
- **Normalisation + temperature.** L2-normalise embeddings and divide logits by a learned temperature
        `τ`. The blog reports this pair moving recall by ≈5% in practice — small changes, large effects.

#### Streaming frequency estimation

logQ needs `q(i)` — but with a billion-item corpus that is continuously changing, you cannot count once and be
      done. The paper’s contribution is an **online estimator** of the average gap between two hits of the same item,
      using two hashed arrays and an exponential moving average:

```
# A[h]: last step item y was seen   B[h]: estimate of gap Δ between hits
for t, y in stream:
    if A[h(y)] >= 0 and B[h(y)] != 0:
        B[h(y)] = (1 - alpha) * B[h(y)] + alpha * (t - A[h(y)])
    else:
        B[h(y)] = (1 - alpha) * B[h(y)] + alpha * 0
    A[h(y)] = t
freq_hat(y) = 1 / B[h(y)]      # used as q(i) in the logQ correction
```

Hash collisions under-estimate the gap (a bucket may contain several items), so the paper adds a multi-hash variant that
      takes the *maximum* estimate across several hash functions — collisions can only under-predict. Higher
      `alpha` tracks change faster but is noisier; the estimator is unbiased as `t → ∞`.

### Mixed negative sampling & production upgrades

Two-tower I fixes *popularity* bias. Two-tower II (Mixed Negative Sampling, MNS) fixes the next problem: with pure
      in-batch negatives the batch is dominated by head items, so **long-tail items are barely trained**. MNS mixes
      two negative pools — in-batch negatives *and* a uniformly-sampled batch from the whole corpus — and adapts the
      gradient weights so both pools contribute correctly.

> Two-tower III — the engineering tail
      The third post is pure production hygiene: the naive logQ table grows without bound. The fix is an
      **expiring table** (a mutable hash map with an expiry) so stale counters are evicted and memory stays flat as
      the corpus churns. Bias correction is not a one-off formula — it is a piece of streaming infrastructure you have to operate.

```
user_vec = normalize(MLP_user(user_feats, context_feats))   # [B, d]
item_vec = normalize(MLP_item(item_feats))                    # [N, d]
logits   = user_vec @ item_vec.T / temperature               # [B, N]
logits   = logits - log(sampling_prob_of_each_item)          # logQ correction
loss     = cross_entropy(logits, labels=diagonal)            # in-batch softmax
```

### Factorization Machines as a retriever

Two-tower is not the only retriever. The blog’s FM→DeepFM post shows a second route: a **Factorization Machine
      can act as a candidate retriever** by “splitting features” — keep the user side, freeze the item side, and the
      second-order term collapses into an inner product you can precompute and index.

```
FM 2nd-order term:  Σ_{i<j} ⟨v_i, v_j⟩ x_i x_j
user–item part:     ⟨ (Σ_{i∈user} v_i x_i) , (Σ_{j∈item} v_j x_j) ⟩  ← one dot product, indexable
```

This is the conceptual bridge to ranking: the same FM that retrieves can, with a deep component bolted on, become the
      **DeepFM** ranker. Retrieval and ranking are often the same primitive at different scales.

### Exercises

Both tasks implement mechanisms the two-tower paper introduces. Run them and inspect the behaviour.

### Module check


## Quiz bank

**Q1. Why does two-tower retrieval need logQ sampling-bias correction?**

- Because embeddings are not normalised
- Because in-batch negatives are not drawn from the true item distribution  _(correct)_
- Because the item tower is too large
- Because softmax overflows

_Answer: Because in-batch negatives are not drawn from the true item distribution. In-batch negatives come from the batch, not the corpus, so popular items are over-represented as negatives. Subtracting log q(i) restores the correct weighting._

**Q2. The item tower is kept independent of the user so that…**

- training is faster only
- item embeddings can be precomputed and served with ANN search  _(correct)_
- the loss is convex
- it can memorise item IDs

_Answer: item embeddings can be precomputed and served with ANN search. User-independent item embeddings can be computed offline and indexed, turning online recommendation into a nearest-neighbour lookup — the amortisation that makes retrieval tractable._

**Q3. Mixed negative sampling (MNS) is introduced mainly to…**

- remove the need for logQ
- train long-tail items better by mixing uniformly-sampled negatives with in-batch ones  _(correct)_
- make the item tower deeper
- replace ANN search

_Answer: train long-tail items better by mixing uniformly-sampled negatives with in-batch ones. Pure in-batch negatives are dominated by head items, starving the long tail. MNS adds a uniformly-sampled batch and adapts the gradient weights so both pools contribute correctly._

**Q4. The production lesson from two-tower III is that the bias-correction table must be…**

- computed once and frozen
- expirable, so stale counters are evicted and memory stays flat as the corpus churns  _(correct)_
- stored inside the item tower
- recomputed each batch by a full scan

_Answer: expirable, so stale counters are evicted and memory stays flat as the corpus churns. Bias correction is streaming infrastructure, not a one-off formula: an expiring (mutable) table keeps memory bounded for a continually growing corpus._

