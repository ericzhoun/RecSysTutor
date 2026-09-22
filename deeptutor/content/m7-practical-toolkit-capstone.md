# Module m7 — Practical toolkit & capstone

## Practical toolkit & capstone

Everything above is theory until you can shape the data and assemble a pipeline. This module is the
      hands-on counterpart.

### Data preprocessing with Pandas (Criteo)

The blog’s practical guide uses the Criteo 1TB click-logs dataset — 13 numeric features, 26 hashed categorical features,
      and a click label. The reusable moves:
- **Analyse first** — feature distributions and pairwise relationships before any model.
- **Handle sparsity** — categorical features are hashed and high-cardinality; downsampling negatives is often necessary.
- **Build meta-info** — a schema of feature→(type, cardinality, vocab) that both training and serving read.

```
df = pd.read_csv(path, sep="\t", names=cols)
cat_cols = [c for c in df if c.startswith("C")]
num_cols = [c for c in df if c.startswith("I")]

# downsample the majority (non-click) class to a target rate
pos = df[df.label == 1]; neg = df[df.label == 0]
neg = neg.sample(frac=neg_rate_keep, random_state=0)
train = pd.concat([pos, neg]).sample(frac=1.0, random_state=0)

# per-column vocab sizes → embedding table meta-info
meta = {c: int(df[c].nunique()) + 1 for c in cat_cols}
```

> Why this matters more than the model
      Negative downsampling changes the prior, so **the served probability must be recalibrated** back to the true
        rate. Getting the preprocessing and calibration right moves production metrics more than swapping rankers.

### Capstone — design one system end to end

Pick a domain you know (videos, products, music, jobs). Work the funnel top to bottom and write one paragraph per box.
      A reasonable reference answer is sketched alongside.

| Stage | Decisions to make | Reasonable default |
|---|---|---|
| Objectives | What single north-star + guardrails? | Watch-time/engagement; diversity + freshness as guardrails |
| Labels | What is a positive? weighting? | Click positive, weighted by dwell; separate CVR head |
| Retrieval | One source or many? | Two-tower + a fresh-graph source + a popularity fallback |
| Ranking | Which ranker? how many features? | DeepFM/DCN-V2 with user × item × context crosses |
| Multi-task | Which heads? how combined? | CTR + CVR (ESMM) + a long-term signal |
| Reranking | What constraints? | DPP for diversity, freshness and exposure rules |
| Evaluation | Offline + online? | Recall@K offline; powered A/B with pre-registered MDE |

> You have finished the course
      If you can defend each row above with a mechanism from modules 1–6, you can read almost any recommender paper and place
        it — which stage it is, what problem it fixes, and what it costs.

### Exercises

A data-engineering exercise and the capstone design task.

### Module check

Interactive course assembled from the 31 posts of *“Be a happy and strong coder”*
        (Fan) — happystrongcoder.substack.com.
        Every lesson links back to a source post; the diagrams, widgets and quizzes are original to this course. Quotes and
        figures are attributed to the blog; external papers are named by title so you can find the originals.

Module 8 incorporates the **104-paper Ads & RecSys collection** from the companion
        repository *Awesome-Deep-Learning-Papers-for-Search-Recommendation-Advertising* (its `ads_knowledge_graph/`),
        reproduced with attribution; those PDFs are hosted in that repository.

Single-file artifact · offline · AutoClaw


## Quiz bank

**Q1. After downsampling negatives for training, what must you do at serving time?**

- Nothing — the model already outputs true rates
- Recalibrate the probability back to the true prior  _(correct)_
- Retrain without downsampling
- Clip predictions to 0/1

_Answer: Recalibrate the probability back to the true prior. Downsampling changes the training prior and inflates the base rate. Rescale odds by the keep-weight w (p = p̂ / (p̂ + (1−p̂)/w)) so served probabilities match reality._

**Q2. Why does the course treat preprocessing and calibration as higher-leverage than swapping rankers?**

- Because all rankers are identical
- Because labels, priors and calibration change the target the model learns, while ranker choice is a small serving-cost trade-off  _(correct)_
- Because calibration removes the need for A/B tests
- Because preprocessing is faster

_Answer: Because labels, priors and calibration change the target the model learns, while ranker choice is a small serving-cost trade-off. Public-dataset gaps between SOTA rankers are small compared with the effect of label design, negative sampling and calibration — and a miscalibrated served score makes the whole system over-predict._

