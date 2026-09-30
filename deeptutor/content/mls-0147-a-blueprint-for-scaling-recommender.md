# A Blueprint for Scaling Recommender Systems

*Machine Learning at Scale collection — Ludovico Bessi, 2026-05-17 · topic: recsys*

*Meta’s Foundation-Expert Paradigm*

[](../assets/db744facac014b9c.png)

# TL;DR

Meta has published a new architectural pattern for deploying hyperscale recommender systems that moves away from monolithic, per-surface models.

They introduce a “Foundation-Expert” paradigm where a massive Foundation Model (FM) learns universal user representations from lifelong history, while lightweight “Expert” models handle surface-specific tasks (e.g., Reels vs. Feed).

The critical link is the use of “target-aware embeddings” rather than generic user embeddings.

This decoupled approach allows for scaling laws to finally apply to RecSys without exploding inference latency or engineering overhead.

# Introduction

For the last few years, while NLP and Computer Vision engineers enjoyed the benefits of scaling laws (simply adding parameters and data to get better performance), RecSys engineers have been stuck in a local optimum.

Scaling these monolithic models is a nightmare because of the “streaming” constraint. Unlike LLMs which are trained on static corpora, RecSys models must learn continuously from shifting data distributions.

Fine-tuning a massive Foundation Model in a streaming setting often leads to catastrophic forgetting, while standard Knowledge Distillation (Student-Teacher) typically results in a low transfer ratio where the student fails to capture the teacher’s full capacity.

In [1], the authors propose a third way. They decouple general knowledge learning from specific task adaptation, allowing them to deploy trillion-parameter scale capacity serving tens of billions of requests daily.

# The Core Concept: Target-Aware Embeddings

The architecture relies on splitting the recommendation stack into two distinct layers: a Foundation Model (FM) and multiple Expert Models.

The Foundation Model is the heavy lifter. It is a large, compute-intensive model utilizing Hierarchical Sequential Transduction Units (HSTU)—a Transformer variant optimized for longer sequences. The FM is trained on cross-surface, lifelong user history and multi-modal content. Its job is not to predict the final click, but to understand the user’s broad preferences and history.

The innovation here lies in how the FM passes information to the Experts. The authors reject the standard “User Embedding” approach, where a model compresses a user’s history into a single static vector. Instead, they use “Target-Aware Embeddings.”

In this setup, the FM takes the user history AND the specific candidate item (the target) as input to generate the embedding. The embedding represents “User A’s interest in Item B,” not just “User A.” This effectively offloads the complex interaction modeling (the heavy self-attention layers) to the FM.

The Expert Models are lightweight (requiring only 20-40% of the compute of a standalone model). They ingest these pre-computed target-aware embeddings as high-signal features. Because the heavy lifting of historical sequence modeling is done by the FM, the Experts can be simple MLPs or lightweight HSTUs that focus solely on surface-specific optimizations (like video completion rates for Reels or click-through rates for Ads) and short-term signals.

# Production Implications and Infrastructure

Deploying this two-stage architecture required a complete overhaul of their infrastructure, a system they call “HyperCast.”

**1\. Decoupled Training Loops**

In a monolithic setup, if you want to test a new feature, you often have to retrain the whole stack. Here, the FM and Experts are decoupled. The FM generates embeddings which are logged as features. The Experts consume these features downstream. This creates a “build once, use everywhere” workflow.

A single high-capacity FM can support dozens of downstream Experts. This dramatically increases developer velocity; product engineers can iterate on lightweight Experts in hours rather than days, while a core modeling team iterates on the massive FM.

**2\. Solving the Latency Problem**

The obvious risk with a two-stage model is latency. Calling a massive FM for every inference request seems prohibitive.

The authors address this via “Inference Pruning” and caching. Since the FM focuses on long-term user history (which changes slowly) and item interaction, they can cache and reuse computations more aggressively than in a monolithic model where every input is entangled. They also optimized the HSTU kernels to ensure the sequential feature fetching doesn’t introduce overhead.

**3\. Transfer Efficiency**

The paper reports a “Transfer Ratio” of 0.64 to 1.0. This metric measures how much of the FM’s performance gain is realized by the downstream Expert. A ratio of 1.0 implies the Expert captured 100% of the FM’s improvement. This validates the “Target-Aware” strategy; had they used generic user embeddings, this ratio would likely be much lower because the Expert would have to relearn the complex user-item interactions that were compressed away.

**4\. Infrastructure as a Feature**

HyperCast manages version control between the FM and Experts. Because the FM acts as a feature generator, version mismatches could be catastrophic. The system ensures that the Expert is trained on embeddings generated by the specific version of the FM that will be available at inference time, handling the logging and synchronization of these multi-tier models automatically.

# Summary

This approach represents a shift from “Model-Centric” to “Ecosystem-Centric” RecSys.

By treating the Foundation Model as a high-fidelity feature generator rather than a final predictor, Meta has found a way to inject scaling-law capabilities into latency-sensitive environments. 

For engineers working on platform-scale ML, decoupling long-term sequence modeling from short-term ranking objectives via target-aware embeddings is likely the path forward.

# References

  1. RecSys scaling laws
