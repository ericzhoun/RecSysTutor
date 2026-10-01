# Meta's GEM: Bringing LLM-Scale Architectures to Ads Recommendation

*Machine Learning at Scale collection — Ludovico Bessi, 2026-03-18 · topic: recsys*

[](../assets/c4b0884919b6e661.png)

# TL;DR

Meta has shifted its ads system to a “Foundation Model” paradigm with GEM (Generative Ads Model).

It adapts LLM scaling laws to recommendation systems (RecSys).

Key technical shifts include:

  * split architecture handling sequence vs. non-sequence features independently

  * “InterFormer” mechanism to process long user history without early compression

  * “Student Adapter” to fix knowledge distillation staleness in production

The result is a 23x increase in effective training FLOPS and a 1.43x improvement in Model FLOPS Utilization (MFU).

# Introduction

For years, the standard approach to industrial recommendation systems has been training individual ranking models for specific surfaces or objectives—one model for clicks on Feed, another for conversions on Reels. While effective, this fragments signal and caps scalability.

Meta recently detailed GEM, their move toward a unified foundation model for ads. The objective was to build a RecSys that scales like an LLM: where adding parameters and compute yields predictable, linear gains in accuracy.

This addresses the sparsity problem in ad prediction (billions of impressions, few conversions) by learning universal representations of user intent across all surfaces (Facebook, Instagram, etc.) before fine-tuning for specific verticals.

Below is the breakdown of how they architected the model and, crucially, how they solved the latency and freshness issues inherent in deploying massive models for real-time inference.

# The Architecture: InterFormers and Pyramid Parallelism

GEM moves away from monolithic input processing. Instead, it categorizes input features into two streams: Sequence Features (user history) and Non-Sequence Features (static user/ad attributes).

For Sequence Features, standard Transformers struggle with the compute cost of long context windows, which is critical for capturing a user’s full journey.

GEM uses a “pyramid-parallel” structure.

It stacks interaction modules to process sequences of thousands of events.

Rather than compressing a user’s history into a single dense vector immediately (which loses signal), they built an architecture called InterFormer.

InterFormer interleaves sequence learning with cross-feature interaction layers.

It summarizes the sequence in parallel while maintaining access to the full user journey structure deeper into the network.

This allows the model to learn complex temporal dependencies without the quadratic cost of standard attention over massive history logs.

For Non-Sequence Features, they utilize an enhanced version of the Wukong architecture.

This uses stackable factorization machines with cross-layer attention.

It essentially automates feature interaction discovery, learning which combinations of user age, location, and ad format matter most, without manual feature engineering.

On the infrastructure side, training a model of this size (LLM-scale) on sparse data requires a different parallelism strategy than text models.

They use Hybrid Sharded Distributed Parallel (HSDP) for the dense parameters to optimize communication overhead.

For the massive sparse embedding tables, they use 2D parallelism (splitting by data and model) to handle synchronization.

They also wrote custom GPU kernels to handle “jagged” sequences—variable-length user histories that typically cause GPU underutilization due to padding.

# Production Implications: Solving the Staleness Problem

The biggest challenge with using a massive Foundation Model (FM) in ads is freshness. Foundation models take a long time to train. In ads, a delay of even a few hours can render predictions stale because user intent shifts rapidly.

Meta solves this with a sophisticated Knowledge Distillation setup involving “Student Adapters.”

In a standard distillation setup, the large FM (Teacher) teaches smaller, faster models (Students/Vertical Models) that run inference.

However, if the Teacher is frozen or updated slowly, it teaches the Student outdated patterns.

The Student Adapter is a lightweight component introduced during training.

It takes the Teacher’s output and learns a transformation function based on the most recent ground-truth data. It essentially “corrects” the Teacher’s stale prediction before passing it to the Student.

This ensures the downstream models receive supervision that is both deep (from the Teacher’s reasoning) and fresh (from the Adapter’s real-time calibration).

Furthermore, they employ hierarchical transfer.

The massive GEM model doesn’t just teach the edge models directly. It transfers knowledge to domain-specific foundation models, which then teach the vertical models.

This cascades the representations down the stack, allowing Meta to keep the heavy compute offline while improving the accuracy of the latency-sensitive models running in production.

By decoupling the heavy reasoning (GEM) from the real-time scoring (Vertical Models) and bridging them with adapters, they achieved a 5% conversion lift on Instagram without blowing up inference latency.

# References

  1. Meta’s Generative Ads Model (GEM): The Central Brain Accelerating Ads Recommendation AI Innovation
