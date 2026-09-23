# Module m5 — Multi-task learning

## Multi-task learning

Real systems predict clicks *and* conversions *and* dwell time *and* likes at once.
      This is the industry default — and the optimiser literature around it is a cautionary tale.

### MMoE — modelling task relationships

Start from the baseline: a **shared bottom** MLP feeding task-specific towers. Its weakness is that
      performance collapses when tasks are only loosely related. **MMoE** replaces the shared bottom with several
      *experts* and gives each task its own **gating network**:

```
f_k (x) = ∑_i g^k (x) f_i (x), g^k (x) = softmax (W_g_k x)
```

Each task soft-shares the experts through its own gate — the same “multiple heads, weighted combination” idea as
      multi-head attention, applied to tasks instead of features.

### ESMM — the entire space

Conversion prediction has two traps: **sample selection bias** (you only observe conversion on clicked
      samples, which are a biased subset) and **sparse labels** (conversions are rare). Alibaba’s ESMM sidesteps both
      by modelling the *entire space* with two towers that share embeddings:

```
pCVR = (pCTCVR) / (pCTR)  Loss = L (CTR) + L (CTCVR)  (the CTCVR label is observed on every impression)
```

By predicting the composite CTCVR on *all* impressions and dividing by CTR at inference, the CVR tower trains on
      far more data and never sees the biased clicked-only subset directly. Two tasks, two patterns of MTL — the blog calls this
      the **sequential / additive** pattern.

### Multi-task optimisation I — weighting the losses

Once you have several losses, how do you weight them? The first family adapts the weights during training:
- **Uncertainty weighting** (Kendall et al.) — learn a per-task log-variance σ²; weight each loss by
        `1/(2σ²)` with a penalty term, so noisy tasks are down-weighted automatically. Elegant and cheap.
- **Gradient normalisation (GradNorm)** — rescale gradient magnitudes so all tasks train at similar rates,
        balancing by *learning speed* rather than by loss value.

```
L = ∑_k [(1) / (2 σ_k^2) ⋅ L_k + log σ_k]  (uncertainty weighting)
```

### Multi-task optimisation II — schedules and multi-objective views

- **Dynamic Weight Averaging (DWA)** — weight each task by the ratio of its recent loss to its loss a few steps ago; tasks improving slowly get boosted.
- **Dynamic Task Prioritisation (DTP)** — weight tasks by difficulty (e.g. via KPI/K), focusing capacity on the hard tasks.
- **MTL as multi-objective optimisation** — treat the task gradients as a Pareto problem (MGDA / PE-LTR) and find a descent direction that does not harm any task.

### Multi-task optimisation III — and the reality check

- **PCGrad (gradient surgery)** — when two task gradients conflict (negative cosine similarity), project each
        onto the normal plane of the other. Conflicts, not magnitudes, are the enemy.
- **IMTL (impartial learning)** — find a gradient that is equally “good” for all tasks, via a closed-form
        projection (IMTL-G) or a loss-balance variant (IMTL-L).
- **Random Loss Weighting (RLW)** — literally sample weights at random; surprisingly competitive, which is
        itself the clue.

> The punchline the blog highlights
      By the end of 2023 two papers argued that most MTL optimisers **do not reliably beat simple weighted sum
        (scalarization)**. In other words: the elaborate gradient-surgery machinery often loses to tuning a few fixed
        weights — or to better labels and a shared trunk. Reach for PCGrad/IMTL when you have a diagnosed, reproducible conflict;
        not as a default. Loss weights are a hyper-parameter, and static ones are a strong baseline.

### Exercises

Two exercises on the two multi-task patterns the module covers.

### Module check


## Quiz bank

**Q1. How does MMoE improve on a shared-bottom multi-task model?**

- It removes the task towers
- It uses several experts and a separate gating network per task  _(correct)_
- It trains tasks one at a time
- It uses a single shared gate

_Answer: It uses several experts and a separate gating network per task. Multiple experts soft-shared through per-task gates let tasks use the shared capacity differently — which helps most when task relatedness is low._

**Q2. ESMM’s core trick is to…**

- model only clicked samples
- predict CTCVR over the entire impression space and divide by CTR  _(correct)_
- drop the CVR task
- use a single tower

_Answer: predict CTCVR over the entire impression space and divide by CTR. By supervising the composite CTCVR on all impressions and deriving pCVR = pCTCVR / pCTR, ESMM avoids the biased clicked-only subset and fights label sparsity._

**Q3. ESMM supervises CTCVR over all impressions primarily to…**

- double the model size
- avoid training CVR on the biased clicked-only subset and use far more data  _(correct)_
- remove the need for a CTR head
- speed up inference

_Answer: avoid training CVR on the biased clicked-only subset and use far more data. Observing the composite label everywhere sidesteps sample-selection bias and lets the shared CVR tower learn from the entire impression space, not just clicks._

**Q4. What did the late-2023 papers conclude about elaborate MTL optimisers?**

- They always beat scalarization
- Most do not reliably beat a simple weighted-sum (scalarization)  _(correct)_
- They eliminate task conflict entirely
- They are required for MMoE

_Answer: Most do not reliably beat a simple weighted-sum (scalarization). Two papers found most MTL optimisers unreliable; simple weighted-sum scalarization, better labels, or a shared trunk often match or beat them. Diagnose a real conflict before reaching for PCGrad/IMTL._

