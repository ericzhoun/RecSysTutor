# Generated quiz — Module 2 (two-tower retrieval)

Produced by DeepTutor's `deep_question` capability against the `recsys-course` knowledge base:

```bash
deep_question "Two-tower candidate generation and sampling-bias correction (Module 2)" \
  --kb recsys-course --config num_questions=3
```

_Run via `deeptutor run deep_question "…" …`; each item cites the modules it was drawn from, e.g. `[m1, m2]`._

---

## Question 1

In a two-tower retrieval model, the item tower is deliberately kept independent
of the user at inference time so that each item's embedding can be precomputed
once, indexed, and retrieved via approximate nearest-neighbour search.

Answer: true

Explanation: Because the item tower ψ_item(I) depends only on item features and
never on the user or context, every item embedding is a fixed vector that can be
computed offline and stored in an ANN index. At serving time only the user tower
runs online, and recommendation reduces to a nearest-neighbour lookup against
the precomputed index — the amortisation that makes retrieval tractable at
YouTube scale. If the item tower consumed user features, each item's embedding
would change per user and could no longer be precomputed or indexed [m2].
Reached the iteration ceiling. Producing the best output I can with what I
have.

The previous question payload was invalid; repairing the schema once.
Repair question format

## Question 2

What is the primary purpose of the logQ correction in models using in-batch
negatives?

• A. To increase the magnitude of logits for popular items.
• B. To subtract log q(i) from each logit to counteract popularity bias from
in-batch negatives.
• C. To add log q(i) to each logit to boost popular items.
• D. To remove all popular items from the batch.

Answer: B

Explanation: The logQ correction subtracts log q(i) from each logit to
counteract the bias that arises when in-batch negatives over-represent popular
items.

## Question 3

The streaming frequency estimator that supplies $q(i)$ for the logQ correction
maintains two hashed arrays, $A[h]$ and $B[h]$, updated with an exponential
moving average [m1, m2].

(a) Describe what $A[h]$ and $B[h]$ each store, how $B[h]$ is updated on each
step of the stream, and how the estimated frequency $\hat{f}(y)$ is obtained
from them.

(b) Hash collisions bias the per-bucket gap estimate in one direction only.
State the direction of this bias, and use it to justify why the multi-hash
variant reports the maximum gap estimate across several hash functions rather
than their average.

Answer: (a) $A[h(y)]$ stores the last step $t$ at which an item hashing to
bucket $h$ was observed; $B[h(y)]$ holds an EMA of the inter-hit gap $\Delta$.
On a hit at step $t$: if the bucket is already initialised, $B[h(y)] \leftarrow
(1-\alpha)B[h(y)] + \alpha,(t - A[h(y)])$; otherwise the bucket is decayed
toward $0$ (or initialised). Then $A[h(y)] \leftarrow t$. The estimated
frequency is $\hat{f}(y) = 1 / B[h(y)]$, which is used as $q(i)$ in the logQ
correction.

(b) A collision means a different item's hit lands in the same bucket, so the
bucket records a hit sooner than the true item would on its own; the observed
inter-hit gap is therefore shorter than the true gap — collisions can only
under-estimate the gap, never over-estimate it. Hence each per-hash gap estimate
is a lower bound on the true gap, and taking the maximum across several
independent hash functions yields the largest (tightest, least-biased) lower
bound. Averaging would mix in more severely under-estimated values and pull the
estimate further down, whereas the max recovers the closest available
approximation to the true gap — and therefore the least over-estimated
frequency.

Explanation: Part (a) tests recall of the estimator's mechanics: $A[h]$ is the
last-seen timestamp, $B[h]$ is the EMA-tracked gap, the update blends the new
observed gap $(t - A[h])$ with weight $\alpha$, and frequency is the reciprocal
of the gap. Part (b) is the harder insight: because a collision injects an extra
hit into the bucket, it can only shorten the measured gap (under-estimate it),
so every individual estimate is a one-sided lower bound. The maximum across hash
functions is the tightest such lower bound — the least biased — which is why max
(not mean) is the correct aggregator [m1, m2].
capability=deep_question tokens=115.2k cost=$0.0266

