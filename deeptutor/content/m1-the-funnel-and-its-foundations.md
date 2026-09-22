# Module m1 — The funnel and its foundations

## The funnel and its foundations

Before any architecture: what an online recommender actually is, how YouTube framed it as
      classification, how you keep recommendations healthy, and how you prove any of it worked.

### The anatomy of a recommender

The blog’s very first idea — inherited from the YouTube paper — is that a production recommender is not one model but
      a **cascade**. A corpus that is far too large to score exhaustively is cut down in stages, each stage more
      expensive than the last.
- **Candidate generation (retrieval).** Millions to billions → a few thousand. Cheap, parallel, heavy recall pressure.
- **Ranking (scoring).** Thousands → hundreds. The expensive model with rich user × item × context features.
- **Reranking.** The final ordering pass: diversity, business rules, freshness, exposure control.

Click a stage to see what each one optimises for. This is the single most useful thing to know before you read any
      recommendation paper: *which stage is it, and what did it improve there?*

### Recommendation as classification

The YouTube paper reframes “what should we show?” as a multiclass problem: predict which of millions of videos a user
      will watch next, given user features `U` and context `C`. That is an **extreme multiclass**
      problem, and its solution — **sampled softmax** — is the reason retrieval models look the way they do.

```
P(video = i | U, C) = e^{v_i · u} / Σ_j e^{v_j · u}   ← softmax over the whole corpus is intractable
sampled estimator:   P̂ ∝ e^{v_i · u} / Σ_{j∈batch} e^{v_j · u} ← negatives drawn from a background distribution
```

The catch the blog stresses: the sampling distribution is **not** the true item distribution, so the
      logits are biased and must be corrected by importance weighting — which becomes module 2’s central topic.

> Three details the paper gets right that most re-implementations miss
      **Example age.** Feed a feature that encodes the recency of the training example, so the model can track
      non-stationary popularity at serving time. **Watch-time weighted loss.** Weight each positive by minutes
      watched, and use `e^{T}·y + T` odds so a well-watched video is genuinely “more positive”.
      **Don’t shuffle the sequence.** Positions in the user’s watch history are themselves a feature.

### Diversity and long-term health

A recommender optimising engagement alone will collapse the catalogue onto a handful of hits. The blog’s diversity post
      argues this is not just an ethical concern but an **ecosystem** concern: starving the long tail of
      engagement data means those items can never be learned well. Two metrics show up everywhere.
- **Effective Catalog Size (ECS)** — from Netflix. Roughly, how many items account for a “typical hour” streamed. Higher is more diverse.
- **Diversity Index (DI)** — the Gini–Simpson index, `1 − Σ p_i²`. The probability two draws are different items; range `[0, 1]`.

Diversity is injected at all three funnel stages — downsampling hot items in the candidate generator, multi-interest models
      at ranking, and **pointwise→listwise reranking** (the popular DPP approach) at the end.

### A/B testing done right

Everything upstream only matters if you can measure it. The blog’s AB-testing post walks from statistical hypothesis
      testing to the subtle traps. The core vocabulary:

| Concept | What it is | Trap |
|---|---|---|
| p-value | P(observing data this extreme | H₀ true) | Misread as P(model is better) |
| Type I error (α) | False positive — ship a no-op change | Lowering α raises sample cost |
| Type II error (β) | False negative — miss a real win | Chasing α=0.05 while power is 0.3 |
| Power | 1 − β; chance of detecting a real effect | Low power ⇒ your “no effect” is meaningless |

> Practical takeaway
      Run a **power analysis before the test**, not after. Sample size, effect size (MDE), α and power are four
        faces of one relationship — fix three and the fourth is determined. A “flat” A/B result from an under-powered test tells
        you nothing, and a low-sample-size test is the most common source of false wins.

### Exercises

Two hands-on tasks. Try them before opening the reference solution — the point is the arithmetic and the code, not the answer.

### Module check


## Quiz bank

**Q1. In the standard recommendation funnel, which stage evaluates the fewest candidates?**

- Candidate generation
- Ranking
- Reranking  _(correct)_
- All three see the same set

_Answer: Reranking. Reranking operates on the smallest set — the few hundred survivors of ranking — and applies diversity, freshness and business constraints._

**Q2. An A/B test reports “no significant difference” but the experiment was under-powered. What is the correct reading?**

- The change definitely has no effect
- The test cannot tell “no effect” apart from an effect it failed to detect  _(correct)_
- The change is harmful
- You can ship it because it is not worse

_Answer: The test cannot tell “no effect” apart from an effect it failed to detect. Low power means the test had little chance of detecting a real effect, so a null result is uninformative. Run a power analysis / pre-register an MDE before the test._

**Q3. Why does the YouTube ranker weight each positive by watch time instead of using a plain click label?**

- To speed up training
- A click alone mis-ranks: weighting by minutes watched pushes the model toward videos people actually finish  _(correct)_
- Because watch time is easier to log
- To avoid negative sampling

_Answer: A click alone mis-ranks: weighting by minutes watched pushes the model toward videos people actually finish. Click-only labels reward clickbait. Weighting positives by watch time (with the e^T·y + T odds trick) makes a longer-watched video genuinely more positive, aligning the objective with satisfaction._

**Q4. What does the “example age” feature let the model do?**

- Encode the user’s account age
- Represent recency so predictions are not anchored to the average popularity of the training window  _(correct)_
- Store the video’s upload date in the embedding
- Replace positional encoding

_Answer: Represent recency so predictions are not anchored to the average popularity of the training window. Example age gives the model a handle on non-stationarity: at serving time it can express “as of now”, rather than baking in the average popularity observed during training._

