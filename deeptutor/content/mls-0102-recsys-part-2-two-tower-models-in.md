# [RecSys] Part 2: Two tower models in industry

*Machine Learning at Scale collection — Ludovico Bessi, 2025-08-10 · topic: recsys*

*Let's learn how the pros do it!*

[](../assets/151b4a0c348f4760.png)

# Introduction

As I discussed this past week on my LinkedIn, the two tower model is a staple for large scale Recommendation Systems.

Let’s see three use cases from industry of retrieval solutions based on that idea!

# Two towers model in industry: case studies

Let’s cut to the chase and see what industry is doing!

## Case study 1: An Embedding-Based Grocery Search Model at Instacart

[](../assets/7a8f6dfcd34764dc.png)

Let’s see how Instacart manages to attack two common problems:

  * Cold start problem

  * Extremely noisy user interaction logs

#### **Architecture: Content-Only Two-Tower Transformer**

The core model is a two-tower architecture for generating query and product embeddings.

  * **Encoder:** Both towers use a MiniLM-L3-v2 transformer encoder, chosen for its balance of performance and inference speed.

  * **Cold-Start Mitigation:** The model intentionally avoids historical engagement features (clicks, carts) as input. Instead, it relies exclusively on content to force semantic understanding.

  * **Data Augmentation:** To further improve on cold-start queries, the training set is augmented with synthetic queries generated from permutations of product catalog data.

#### **Handling Noisy User Logs**

User logs are notoriously noisy—users add irrelevant items to their cart because they happen to need them, creating false positive <query, product> pairs. Training on more data led to diminishing returns due to this noise. The team's solution is a two-part strategy.

**A. Cascade Training**  
This is a two-step training process that schedules data based on quality, not difficulty.

  * **Step 1: Warm-up & Knowledge Transfer:**

    * **Dataset:** A large, noisy dataset of 14M unique <query, product> pairs with a low conversion-rate threshold.

    * **Architecture:** The query and product encoders **share parameters** (Siamese network).

    * **Goal:** Transfer the general knowledge of the pre-trained MiniLM to the grocery domain by exposing it to a wide variety of data.

  * **Step 2: Fine-tuning & Specialization:**

    * **Dataset:** A smaller, higher-quality "cascade" dataset of 6M pairs, constructed by iteratively including pairs with the highest conversion rates.

    * **Architecture:** The encoder parameters are **un-tied** , allowing the query and product towers to specialize.

    * **Goal:** Refine the model on high-confidence relevance signals. The cross-architecture shift from shared to un-tied parameters proved critical for performance.

**B. Self-Adversarial Negative Sampling**  
Standard in-batch negative sampling is inefficient, as the model quickly learns to ignore easy negatives. They implemented self-adversarial negative sample re-weighting to focus training on hard negatives.

For each positive pair (q_i, p_i) in a batch, the loss from a negative pair (q_i, p_j) is weighted by the model's own confidence in that negative pair.

  * **Loss Function:** L_rel = L_pos + λ_neg * L_self_adv_reweight

  * **Weighted Negative Loss:** L_adv_reweight = Σ [ w_i,j * BCELoss(σ(q_i · p_j), 0) ]

  * **Adversarial Weight:** w_i,j = act(q_i · p_j)

The model is punished more for negatives it incorrectly scores as high-relevance.

#### **3\. System Deployment & Serving**

  * **Offline:** Product embeddings are pre-computed daily. To handle per-store inventory, they build separate **per-retailer FAISS indices** rather than a single global index. While this increases storage, it avoids a costly post-retrieval filtering step at serving time.

  * **Online Retrieval:** For a given query, the flow is:

    1. Generate query embedding in real-time.

    2. Retrieve top-k candidates from the relevant retailer's FAISS index.

    3. **Post-filter:** Drop candidates below a similarity score threshold and those outside a "allowlist" of categories derived from the top few results.

    4. Merge with keyword-based retrieval results.

    5. The final similarity score is used as a powerful feature in the downstream ranking model.

## Case study 2: Revisiting Two-tower Models for Unbiased Learning to Rank

Ok, this will be a bit more theoretical, so be prepared! :)

**TL;DR:** The standard additive two-tower architecture for Unbiased Learning to Rank (ULTR) relies on a strong assumption that relevance and observation bias are factorizable. However this assumption often fails on real-world data, causing performance degradation.

The authors of [2] propose two alternative two-tower approaches—Mixture Expectation-Maximization (MixEM) and Embedding Interaction models—that show significant gains by modeling more complex user behaviors.

The two tower architecture is simple and effective: one tower focuses on relevance based on query/item features, and a second tower models observation bias (e.g., position bias). The final click probability is typically modeled as a function of the sum of their logits:

p(click | q, d, k) = σ(logit_relevance(q, d) + logit_bias(k))

This implicitly assumes the Position Based Model (PBM), where the click event factorizes into independent relevance and observation probabilities.

However real-world click data is not generated by a single, universal behavior pattern. It's a **mixture** of behaviors. For example:

  * **Navigational queries:** May follow a PBM-like pattern.

  * **Browsing queries:** A user might be less sensitive to relevance and more to position (Rank-based CTR).

  * **Expert users:** May scan the whole list, effectively removing position bias (Document-based CTR).

The true click probability is better represented by an integral over a joint distribution of hidden session-level variables (u, v) that control relevance and observation patterns.

The paper introduces two methods to address this without abandoning the efficient two-tower structure:

**1\. Mixture Expectation-Maximization (MixEM)**

This approach explicitly models a mixture of click behaviors. Instead of one model, you maintain a set of simple two-tower models, each representing a different click hypothesis.

This allows the system to learn which behavior patterns are dominant in the data and assign sessions to the most likely generative model during training.

**2\. Embedding-based Interaction Models**

This method captures non-factorizable interactions by moving beyond logit addition. Instead of combining scalar outputs, it models interactions between the embedding vectors from each tower.

Let r(q, d) be the relevance tower embedding and e(k) be the position bias tower embedding.

  * **Embedding Dot-product (EDot):** The simplest interaction.  
logit = r(q, d) · e(k)

  * **Embedding Interaction (EInter):** A more expressive quadratic model that can capture richer dependencies.  
logit = r(q, d)·B·e(k) + b_r·r(q, d) + b_e·e(k) + b  
Here, B is a trainable D_emb × D_emb matrix, allowing for complex, learned interactions between the relevance and bias dimensions.

## Case study 3: Ads Recommendation in a Collapsed and Entangled World

[](../assets/4602fa6fb614ac6c.png)

**TLDR:** Stop trying to solve representation issues by just adding more parameters to a monolithic embedding table. Instead create isolated, specialized, and appropriately-sized representation spaces to fight collapse and entanglement directly.

Let’s see how they do it!

#### **1\. Advanced Feature Encoding: Preserving Priors**

The foundation is encoding that respects the inherent structure of the data, not just treating everything as a categorical ID.

  * **For Sequence Features (Temporal Interest Module - TIM):**  
User behavior sequences aren't just a bag of items; they have semantic and temporal relationships to the target ad. TIM captures this with a quadruple interaction.

    * **Mechanism:** The final user representation is a weighted sum from a target-aware attention mechanism: u_TIM = Σ α(ẽᵢ, ṽₜ) · (ẽᵢ ⊙ ṽₜ).

    * **Explicit feature interaction:** Look at the term being summed: (ẽᵢ ⊙ ṽₜ). This is an element-wise product between the user's _i_ -th behavior embedding and the target ad's embedding. This forces an explicit feature interaction at the representation level itself, _before_ the attention-weighted sum.

    * **Temporal Augmentation:** The embeddings ẽᵢ and ṽₜ aren't static. They are the sum of the base semantic embedding and a temporal embedding (eᵢ ⊕ p_f(Xᵢ)). This injects the temporal prior directly into the vector space.

#### **2\. Solving Dimensional Collapse: The Multi-Embedding Paradigm**

SVD analysis on their production models confirmed that embeddings for most features occupy a low-rank subspace, wasting parameters and preventing effective scaling.

  * **The Root Cause:** Explicit feature interaction functions. When a high-dimensional embedding e_A interacts with a low-cardinality (and thus intrinsically low-rank) embedding e_B via an element-wise product (e_A ⊙ e_B), the gradient flow and subsequent updates effectively project e_A into the lower-dimensional subspace of e_B, causing collapse.

  * **The Solution: Multi-Embedding with Heterogeneous Experts.**  
Instead of one large D-dimensional embedding table, they create T independent, smaller embedding tables.

    1. **Lookup:** For a single feature ID, perform T lookups to get T separate embeddings, one from each table.

    2. **Interaction:** Create T corresponding "expert" networks (e.g., DCN, FFM-like models). The crucial rule is that **embeddings from table t can only interact with other embeddings from table t inside expert t**. This isolates the embedding spaces.

    3. **Aggregation:** The outputs of the T experts are combined, often via a gating mechanism, before the final prediction tower.

    * **Critical Requirement:** The expert networks _must_ have non-linearities (like ReLU). Without them, the entire structure is mathematically equivalent to a single, larger linear model, and the T spaces would collapse back into one.

#### **3\. Solving Interest Entanglement in MTL: Asymmetric Multi-Embedding (AME)**

In multi-task learning, a single shared embedding is torn between conflicting signals (e.g., a user likes a funny ad but has zero conversion intent). This entanglement hurts performance.

  * **The Problem with Standard Disentanglement:** For a system with 100+ conversion tasks, creating 100+ task-specific embeddings is computationally infeasible.

  * **The Pragmatic Solution: Asymmetric Multi-Embedding (AME).**  
This is a clever evolution of the Multi-Embedding paradigm:

    1. **Asymmetric Tables:** Create a fixed, small number of embedding tables (e.g., 3), but make them **asymmetric in their embedding dimension** (e.g., dim=16, dim=32, dim=64).

    2. **Gated Routing:** A gating network learns to route task-specific signals through these asymmetric experts.

    * **The Disentanglement Mechanism:** The asymmetry provides a strong architectural prior. The model learns to route smaller, long-tail tasks (with sparser data and simpler patterns) to the lower-capacity, 16-dimensional embedding space. Head tasks with massive data and complex signals are routed to the 64-dimensional space. This implicitly disentangles representations by capacity, preventing sparse tasks from being drowned out by high-volume tasks in a single, large shared space.

# What’s next?

In the next week on LinkedIn and newsletter article, I will discuss how industry scales up longer sequence modelling in such a latency bound environment, plus how to deal with different objective optimizations. You don't want to miss it!

# References

  1. Embedding based grocery search model at instacart

  2. Revisiting Two-tower Models for Unbiased Learning to Rank

  3. Ads Recommendation in a Collapsed and Entangled World
