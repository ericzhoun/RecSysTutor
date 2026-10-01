# [Bonus] Pinterest Recommendation Systems evolution through the years: deep dive of 7 architectures

*Machine Learning at Scale collection — Ludovico Bessi, 2025-08-27 · topic: recsys*

# Introduction

[](../assets/fcdc3a5f1078171c.png)

In today’s article I am going to discuss Pinterest recommendation system evolutions throughout the years.

Pinterest has shared their systems in the open since a long time, so it’s super cool in my opinion to take a look at the evolution through machine learning innovations.

It’s also good way to put together everything we learned in the month of RecSys! :)

# Pinterest RecSys evolution

Lots to cover today, so let’s just get started!

# [1] Related Pins at Pinterest: The Evolution of a Real-World Recommender System

[](../assets/fd377f37241fd440.png)

**TL;DR:** Pinterest's Related Pins paper reveals a journey from a simple heuristic model to a complex, multi-stage architecture. **Key takeaways** : pragmatic evolution across candidate generation, memorization, and ranking. They tackled position bias with a Clicks over Expected Clicks (COEC) approach and solved the "previous-model bias" feedback loop by collecting a small percentage of randomized, unranked training data. The core challenge is managing system complexity where "Changing Anything Changes Everything", which they mitigate through automated joint training.

The evolution of the Related Pins system, now driving over 40% of Pinterest's engagement, began with a minimal viable product: a simple Hadoop job finding co-occurring pins on user-curated boards, launched by two engineers in three weeks. This illustrates a key principle of their development: prioritize shipping the simplest, highest-leverage solutions first. The architecture evolved into a three-stage pipeline: (1) Candidate Generation, (2) a memorization layer called Memboost, and (3) a machine-learned Ranker. This progression saw candidate generation shift its focus from precision to recall, aiming to produce a diverse set of ~1,000 relevant items from billions for the downstream ranker to optimize.

Candidate generation evolved from simple board co-occurrence to more sophisticated methods to improve recall and address specific gaps. The initial offline heuristic was replaced by an online random walk service (Pixie) on the pin-board graph, effectively computing Personalized PageRank to find more relevant and long-tail candidates. To capture temporal signals missed by static boards (e.g., items pinned in the same session but to different boards), they implemented Pin2Vec, a word2vec-style embedding model for popular pins. Supplemental sources, including text-based search and visual similarity, were added to further address the cold-start problem and increase result diversity.

The ranking and memorization components showcase a pragmatic approach to leveraging engagement data. Before a full ranker, they built Memboost, a lightweight memorization layer. To counteract strong position bias in impression logs, they implemented a score based on Clicks over Expected Clicks (COEC), which normalizes engagement by the historical CTR for a given position and platform. The ranking model itself evolved significantly: from a linear RankSVM using Memboost scores as labels, to a GBDT model trained on individual user sessions to enable personalization. This shift to GBDTs automated the discovery of non-linear feature interactions, reducing manual feature engineering. Their training objective also moved from a pairwise loss to a pointwise logistic loss focused directly on their primary metric: save propensity.

The paper highlights critical real-world engineering challenges. The most significant was "previous-model bias," where the deployed model pollutes the training data for future iterations, creating a feedback loop that stifles improvement. Their solution was to serve randomly ordered candidates to a small fraction of traffic, generating an unbiased dataset for training, even at the cost of reduced data volume.

# [2] Pixie: A System for Recommending 3+ Billion Items to 200+ Million Users in Real-Time

**TLDR** : Pinterest's Pixie system serves real-time recommendations from a 3 billion-item catalog by running a novel, biased random walk algorithm directly on a massive pin-board graph held entirely in memory on each server, achieving 60ms latency and boosting user engagement by up to 50% over previous batch-based systems.

To solve the challenge of real-time recommendations at massive scale, the Pixie system abandons pre-computation in favor of on-demand generation. The core of the system is a massive bipartite graph of 3 billion nodes (pins and boards) and 17 billion edges, representing the human-curated relationships between items. The key architectural decision was to load this entire pruned graph (≈120 GB) into the main memory of each server in the recommendation cluster (244GB RAM instances). This design eliminates network hops during the recommendation process, allowing the algorithm to traverse the graph at memory speed. The system scales horizontally by adding more identical servers, with a single C++ server capable of handling 1,200 RPS with a 99-percentile latency of just 60 milliseconds.

Pixie’s recommendation engine is powered by a novel "Pixie Random Walk," (ah, the non ML times!):

  * the walks are biased in a user-specific way at query time by dynamically favoring graph edges that match user features like language or topic, effectively personalizing results without storing user-specific graphs.

  * Queries consist of a weighted set of multiple pins, capturing a user's broader context, not just their last action.

  * "multi-hit booster" rewards candidate pins that are visited from multiple different query pins, using a (Σ sqrt(Vq[p]))² aggregation to prioritize items that bridge different user interests.

A **counter-intuitive** insight was that aggressive graph pruning improved both system performance and recommendation quality. The initial 100+ billion edge graph was too large and noisy:

  * they removed high-entropy boards that were topically diverse and diffused the random walk

  * for highly popular pins, they pruned edges connecting them to boards with low topical similarity (measured by cosine similarity of LDA-derived topic vectors). This process reduced the graph size by a factor of six, allowing it to fit in RAM.

# [3] PinnerFormer: Sequence Modeling for User Representation at Pinterest

[](../assets/63caadea73f64d2e.png)

**TLDR:** PinnerFormer is a Transformer-based user representation model designed for efficient daily **batch** inference. By using a "dense all-action loss" to predict all of a user's positive engagements over a multi-day future window (instead of just the next action), it nearly closes the performance gap with costly real-time systems.

Sequential models are powerful for user recommendations but pose a significant production challenge: they either require expensive real-time inference after every user action or complex, stateful streaming infrastructure.

PinnerFormer solves this by optimizing for a daily batch inference setting. The core innovation is its training objective, the **dense all-action loss**. Instead of traditional next-action prediction, the model is trained to predict all positive actions (saves, long clicks, etc.) a user will take over a long future window (e.g., 28 days). This forces the model to learn a user's more stable, long-term interests, making the daily-generated embedding far more robust to staleness and significantly closing the performance gap with a real-time model.

PinnerFormer uses a standard Transformer architecture that ingests a user's 256 most recent actions. Each action is featurized using its PinSage content embedding plus metadata like action type and sine/cosine encoded time deltas.

The "dense" aspect of the loss function is key: predictions are made from multiple output positions of the transformer (using causal masking to preserve sequence order), not just the final one, providing a richer training signal.

The model produces a single, unified user embedding, simplifying integration into dozens of downstream ranking models. Training employs a sampled softmax loss with a mix of in-batch and random negatives, critically using a **logQ correction** to counteract the sampling bias from popular items appearing frequently as in-batch negatives.

# [4] ItemSage: Learning Product Embeddings for Shopping Recommendations at Pinterest

[](../assets/c93ad19fc82d5b12.png)

**TLDR** Pinterest's ItemSage creates a single, unified product embedding using a Transformer-based model that fuses text and image features. This multi-modal embedding is trained with multi-task learning to be compatible with different query types (image, text, user history) and to optimize for multiple engagement objectives (clicks, saves, purchases), resulting in a 3x reduction in infrastructure costs and significant lifts in online business metrics.

ItemSage's core is a shallow (one-layer) Transformer encoder architecture designed for efficiency and performance. It takes a sequence of 32 input embeddings: up to 20 pre-trained PinSage embeddings representing the product's images, and 12 text feature embeddings (e.g., title, description, brand). To handle the large text vocabulary, it uses a hash embedding technique, which maps tokens to a smaller, learned embedding table.

The Transformer's self-attention mechanism fuses these multi-modal signals, and a global [CLS] token is used to aggregate the information into a final 256-dimensional product embedding. The model is trained to make this final embedding compatible with existing PinSage (image) and SearchSage (text query) embeddings via cosine similarity. This is achieved by minimizing a softmax loss with a mixed negative sampling strategy, which uses both in-batch positives and randomly sampled catalog items as negatives, with a separate loss term for each to improve stability and performance.

The key strategic decision behind ItemSage is building one versatile embedding to serve all shopping recommendation surfaces (Home, Closeup, Search). This is enabled by a multi-task learning framework where training batches are composed of positive examples from all surfaces and engagement types (clicks, saves, add-to-carts, checkouts). This approach not only makes the embedding robust across different query modalities but also significantly improves performance on sparse conversion signals (like checkouts) by leveraging the data from denser engagement signals (like clicks).

The unified design provides major system-level benefits: a single inference pipeline, a single Approximate Nearest Neighbor (ANN) index for candidate generation, and a single feature in downstream rankers, drastically reducing infrastructure and maintenance overhead.

# [5] Rethinking Personalized Ranking at Pinterest: An End-to-End Approach

[](../assets/abe7ccf7fd8fbe2b.png)

**TLDR** Pinterest boosted engagement by replacing their user embedding with an end-to-end model that separates user intent. Long-term interest is captured by "PinnerFormer," a Transformer trained to predict all user actions in a future 14-day window. Short-term intent is captured by a real-time action sequence. They solved a +300% serving latency problem by moving the heavy Transformer computation to GPUs while keeping feature lookups on CPUs, enabling production deployment.

The core innovation is decomposing the user state into two distinct components. For **long-term interest** , they used PinnerFormer (you just learnt about that: it’s [3])

For **short-term intention** , the model directly ingests a sequence of the user's last 100 real-time actions. This sequence is processed by a Multi-Head Self-Attention block and fed into the final ranking model alongside the PinnerFormer embedding. To prevent the model from becoming overly sensitive to the most recent action, they introduced time-window masking during training.

The complexity of this dual-sequence Transformer architecture made it impossible to serve on a standard CPU setup, causing a 300% latency increase.

The engineering solution was a **mixed CPU/GPU serving model**. The hundreds of small, latency-sensitive operations like sparse feature lookups, embedding table access, and feature pre-processing remain on the CPU. The computationally intensive parts of the model—specifically the TransformerEncoder blocks—are offloaded to a GPU for massively parallel execution. By carefully profiling and splitting the model graph, they reduced the latency overhead from an unacceptable +300% to a deployable +10% compared to the previous, simpler model. This hybrid approach enabled them to ship a significantly more powerful model to production, leading to major online gains across both organic and Ads ranking systems.

# [6] OmniSearchSage: Multi-Task Multi-Entity Embeddings for Pinterest Search

[](../assets/07c50b08cddc96d4.png)

**TLDR:** Pinterest developed OmniSearchSage, a single model that generates unified embeddings for search queries, pins, and products. The system replaces multiple specialized models with one multi-task learning framework. The key performance drivers are extensive text feature enrichment (using LLM-generated captions, user board titles, and historical engagement data) and a training objective that learns new representations while remaining compatible with legacy embeddings. Deployed in production, it serves 300k QPS at 3ms median latency.

The core of OmniSearchSage is a multi-tower architecture trained on query-pin, query-product, and query-query pairs using a sampled softmax loss.

The query tower uses a multilingual DistilBERT to produce a single query vector.

The item tower is a unified, computationally efficient encoder for both pins and products that processes a rich set of features. The most impactful innovation is enriching item text representations from three sources: 1) synthetic captions from a generative image-to-text model (BLIP) for items with missing text, 2) titles from user-curated boards where an item was saved, and 3) top queries that previously led to engagement with that item.

To ensure a smooth rollout, the model was also trained for backward compatibility by adding tasks to align the new query embeddings with pre-existing, frozen PinSage and ItemSage embeddings, achieving compatibility at virtually no performance cost to the primary tasks.

# [7] Synergizing Implicit and Explicit User Interests: A Multi-Embedding Retrieval Framework at Pinterest

[](../assets/aba22375ba287507.png)

**TLDR**

Pinterest replaced its single-embedding retrieval model with a multi-embedding framework that generates multiple user embeddings to better cover diverse interests. The framework synergizes two complementary models:

  1. **Differentiable Clustering Module (DCM)** that models _implicit_ interests by clustering a user's recent engagement history into distinct topics

  2. **Conditional Retrieval (CR)** model that handles _explicit_ interests by generating embeddings conditioned on topics the user has followed.

This dual approach significantly improved candidate diversity and key engagement metrics like Repins and has been fully deployed on the Pinterest home feed.

#### **Implicit user interest modeling with DCM**

Unlike standard two-tower models that compress user history into a single vector, DCM generates multiple interest-specific embeddings.

It treats items in the user's history sequence as points to be clustered. The key to its success lies in two architectural choices that prevent the interest embeddings from collapsing into a single representation.

First, it uses **Validity-Aware Farthest Point Initialization** to select diverse and high-quality initial cluster centroids from the user's history, ensuring they are far apart and based on items with complete feature data.

Second, it employs **Single-Assignment Routing** , where each item in the user history contributes to updating only its single closest cluster centroid. This hard assignment forces the interest embeddings to diverge and specialize. During training, the model selects the single user embedding with the highest affinity to the positive item (argmax selection) and computes the loss using only that "winning" embedding, effectively associating the engagement with its most relevant latent interest.

#### Explicit interest using Conditional Retrieval (RC)

To complement the implicit signals, the framework uses Conditional Retrieval (CR) to model explicit interests, such as topics a user follows (e.g., "food," "education").

This is crucial for new or inactive users with sparse history and for capturing a user's long-term interests. The model is trained on user-item pairs where the condition (the topic) is explicitly logged at the time of engagement, creating a powerful training signal that links an action to its source interest. The true strength of the framework lies in the synergy between DCM and CR; DCM excels at capturing the dynamic, short-term interests of active users, while CR provides a stable, long-term interest signal and solves the cold-start problem. In production, the system generates K_im implicit embeddings and K_ex explicit embeddings per user, performs parallel Approximate Nearest Neighbor Search (ANNS) for each, and merges the resulting candidate sets using a **round-robin** strategy.

# If you made it to the end, surely you are interested in a fully featured machine learning system design live course [[20% discount]](https://app.youform.com/forms/tfc7z4jo)

# References

  * Related Pins at Pinterest: The Evolution of a Real-World Recommender System

  * Pixie: A System for Recommending 3+ Billion Items to 200+ Million Users in Real-Time

  * PinnerFormer: Sequence Modeling for User Representation at Pinterest

  * ItemSage: Learning Product Embeddings for Shopping Recommendations at Pinterest

  * Rethinking Personalized Ranking at Pinterest: An End-to-End Approach

  * OmniSearchSage: Multi-Task Multi-Entity Embeddings for Pinterest Search

  * Synergizing Implicit and Explicit User Interests: A Multi-Embedding Retrieval Framework at Pinterest
