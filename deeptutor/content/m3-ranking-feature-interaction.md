# Module m3 — Ranking & feature interaction

## Ranking & feature interaction

The CTR-model family tree. Every model here answers the same question — *how do I capture
      interactions between features?* — and differs only in the mechanism it uses to do so.

### Wide & Deep

The ancestor of the whole family. One linear “wide” path with hand-crafted cross-product features, plus a deep MLP over
      embeddings, joint-trained.
- **Memorization** = the wide path. It learns frequent co-occurrences, e.g. the cross feature
        `AND(user_installed_app=netflix, impression_app=pandora)`.
- **Generalization** = the deep path. Embeddings let the model score unseen items with low-dimensional similarity.
- **Training** = FTRL with L1 for the wide part (sparse, online), AdaGrad for the deep part.

> The question the blog pauses on
      “Can a deep model memorise too?” Yes — but less efficiently. A wide cross-product path gives the deep net a head start
        and cuts training cost. Wide&Deep is a trade-off, not a claim that linear models are superior.

### FM → DeepFM

Factorization Machines learn a polynomial kernel by representing interactions as inner products of latent vectors — so
      second-order interactions are learned even when a pair is never co-observed. DeepFM keeps the FM as the “wide” side and
      adds a deep MLP: **no manual feature crosses at all**.

```
y^_DeepFM = sigmoid (y^_FM + y^_Deep)  (FM and the deep part share the same embeddings)
```

### DCN → DCN-V2

DCN replaces the wide path with an explicit **Cross Network** that models bounded-order, explicit interactions
      without feature engineering:

```
x_l + 1 = x_0 ⋅ (w_l^⊤ x_l) + b_l + x_l
```

The first version is cheap but the expressiveness of each layer is limited. **DCN-V2** upgrades it with a
      weight matrix and a *mixture of low-rank experts*, so the cross network can approximate the full matrix while staying
      efficient for web-scale serving. This “expressiveness vs. serving cost” tension runs through the entire module.

### xDeepFM

xDeepFM attacks a subtle flaw in DCN and DeepFM: their interactions are *bit-wise* (they mix elements within an
      embedding). **Compressed Interaction Network (CIN)** makes interactions *vector-wise* — the same kind of
      interaction an FM models — while keeping the order controllable and the cost bounded by sum-pooling.

| Model | Interaction style | Order |
|---|---|---|
| DeepFM | vector-wise (FM) + bit-wise (MLP) | 2nd explicit, ∞ implicit |
| DCN | bit-wise (cross net) | bounded explicit |
| xDeepFM | vector-wise (CIN) | controllable explicit |

### AutoInt

AutoInt reaches for **multi-head self-attention** to model feature interactions, and — unlike the models
      above — is **interpretable**: the attention weights tell you which features interacted. The post builds the
      attention layer from scratch, which is exactly the mechanism that returns in module 4’s sequential models.

```
α_i, j = softmax_j (w^⊤ [e_i ‖ e_j])  (e_i are feature embeddings, not tokens)
```

### DLRM (Facebook)

DLRM is as much a systems paper as a modelling one. It keeps the industry-standard structure — dense features through an
      MLP, sparse features through embeddings, pairwise dot-product interactions, then a final MLP — but deliberately stops at
      **second-order interactions**, arguing higher order may not justify the cost.

> Why this paper matters
      Half of it is training infrastructure: model parallelism for the large embedding table, data parallelism for the dense
        MLP, and the communication cost between them. If you have ever sized an embedding table for a real system, this is the
        paper that frames the problem.

```
e = stack(embeddings, axis=1)             # [B, F, d]
gram = e @ transpose(e, [0,2,1])          # [B, F, F] — all pairs
tril = band_part(gram, -1, 0)             # keep lower triangle (TF: tf.linalg.band_part)
inter = flatten(tril)                      # [B, F*(F+1)/2]
logit = MLP( concat(dense_mlp_out, inter) )
```

### FinalMLP

A short, surprising Huawei paper: drop the wide/cross path entirely and use **two parallel MLP streams**, with
      a learned *feature-selection* mask per stream so each stream sees a different view, fused by a **bilinear
      fusion** layer. It topped the Criteo CTR benchmark in 2023 — evidence that stream diversity plus a good fusion beats
      architecture cleverness.

### MaskNet (Twitter)

Twitter’s main ranker. The idea: an **instance-guided mask** — a per-example gate derived from the input —
      is used to multiply the feature embeddings *before* the MLP. This is feature-wise multiplication (cf. FiLM), giving
      instance-level non-linearity at low cost.

```
MaskBlock: h = ReLU (W_2 ⋅ ReLU (W_1 ⋅ (x ⊙ m))), m = ReLU (W_g x)
```

Two variants — **SerialMaskNet** and **ParallelMaskNet** — trade depth for width. The blog notes
      the idea originally came from Sina Weibo (2021), a good reminder that production recsys ideas flow in both directions
      across industry.

### Choosing a ranker

Cheat-sheet for the whole family. In practice the gap between SOTA rankers on a public dataset is far smaller than the gap
      created by your *features and labels* — so the choice below is usually a serving-cost decision, not an accuracy one.

| Model | Mechanism | Cost | Best when |
|---|---|---|---|
| Wide&Deep | explicit crosses + MLP | low | strong known crosses, online learning |
| DeepFM | FM + MLP, shared embeddings | low | default strong baseline |
| DCN-V2 | cross net + low-rank mixture | medium | want explicit order without FE |
| xDeepFM | vector-wise CIN | medium-high | vector-wise interactions matter |
| AutoInt | multi-head self-attention | high | interpretability wanted |
| DLRM | pairwise dots, systems-first | medium | huge sparse tables, multi-node |
| FinalMLP | two-stream MLP + bilinear fusion | low | simplicity with SOTA-ish results |
| MaskNet | instance-guided mask | low | cheap instance-level gating |

- Blog Wide & Deep Learning for Recommender Systems — “Be a happy and strong coder”
- Blog Deep & Cross Network for Ad Click Predictions — “Be a happy and strong coder”
- Blog DCN V2 — “Be a happy and strong coder”
- Blog xDeepFM — “Be a happy and strong coder”
- Blog AutoInt — “Be a happy and strong coder”
- Blog Deep Learning Recommendation Model (DLRM) — “Be a happy and strong coder”
- Blog FinalMLP — “Be a happy and strong coder”
- Blog MaskNet — “Be a happy and strong coder”
- Paper Cheng et al. — Wide & Deep Learning for Recommender Systems · DLRS 2016
- Paper Guo et al. — DeepFM · IJCAI 2017
- Paper Wang et al. — DCN: Deep & Cross Network · ADKDD 2017
- Paper Wang et al. — DCN V2 · WWW 2021
- Paper Lian et al. — xDeepFM · KDD 2018
- Paper Song et al. — AutoInt · CIKM 2019
- Paper Naumov et al. — DLRM · arXiv 2019, Meta
- Paper Mao et al. — “MaskNet: Introducing Feature-Wise Multiplication to CTR Ranking Models” · DLP-KDD 2021 (linked from the blog post)
- Paper Yu et al. — “FinalMLP: An Enhanced Two-Stream MLP Model for CTR Prediction” · arXiv 2023, Huawei (linked from the blog post)

### Exercises

Two exercises on explicit feature interaction — the core of every ranker in this module.

### Module check


## Quiz bank

**Q1. Which model in the family models feature interactions vector-wise (like an FM) rather than bit-wise?**

- DCN
- xDeepFM (CIN)  _(correct)_
- DLRM
- FinalMLP

_Answer: xDeepFM (CIN). xDeepFM’s Compressed Interaction Network keeps interactions at the vector level with a controllable order, unlike DCN/DeepFM’s bit-wise mixing._

**Q2. DLRM deliberately limits interactions to second order because…**

- it cannot represent more
- higher-order interactions may not justify the extra compute/memory cost  _(correct)_
- Facebook had no data
- the paper is about ranking only

_Answer: higher-order interactions may not justify the extra compute/memory cost. DLRM makes an explicit performance/cost trade-off: pairwise dot-product interactions, then spend the budget on training infrastructure instead._

**Q3. The low-rank “mixture of experts” cross network in DCN-V2 exists to…**

- add non-linearity to the MLP
- approximate the full cross matrix while staying affordable at web-scale serving cost  _(correct)_
- remove the embedding layer
- make the model interpretable

_Answer: approximate the full cross matrix while staying affordable at web-scale serving cost. A full cross weight matrix is too expensive to serve; DCN-V2 factorises it into low-rank experts, recovering expressiveness at acceptable cost._

**Q4. AutoInt’s distinctive advantage over DLRM-style pairwise interactions is…**

- lower training cost
- attention-weighted, interpretable feature interactions  _(correct)_
- it needs no embeddings
- it uses no MLP

_Answer: attention-weighted, interpretable feature interactions. AutoInt applies multi-head self-attention over feature embeddings, so the attention weights expose which features interacted — interpretability the dot-product models lack._

