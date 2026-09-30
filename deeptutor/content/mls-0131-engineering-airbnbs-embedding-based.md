# Engineering Airbnb’s Embedding-Based Retrieval System

*Machine Learning at Scale collection — Ludovico Bessi, 2026-03-08 · topic: recsys*

[](../assets/c8188ca6759cadeb.png)

# TL;DR: 

Airbnb implemented Embedding-Based Retrieval (EBR) to improve candidate generation for search. They utilized a two-tower architecture trained on session-based “hard negatives” rather than random samples. For serving, they selected an Inverted File Index (IVF) over HNSW due to high update frequency and filtering requirements, finding that Euclidean distance yielded better cluster balance than dot product.

# Introduction

In any large-scale search system, you rarely score every item with your heaviest model. The standard pattern is a funnel: a lightweight retrieval layer selects a candidate pool, and a heavy ranking layer scores them. Airbnb faced a specific challenge with the retrieval layer. Users often search broad geographies (e.g., “France”) or flexible dates, creating a massive search space that keyword matching or simple heuristics struggle to filter effectively. To solve this, the team built their first Embedding-Based Retrieval (EBR) system to improve the relevance of the initial candidate pool passed to downstream rankers.

# Core Concept: Training on Journeys and Two-Tower Architecture

The success of an embedding model often comes down to how you construct your negatives. If you treat a booked home as positive and a random home as negative, the problem is too easy for the model to learn meaningful distinctions.

Airbnb tackled this by constructing training data based on “trips.” They grouped a user’s history—searches, clicks, wishlists—leading up to a booking. The booked listing serves as the positive label. Crucially, the negative labels are drawn from homes the user actually viewed or interacted with during that same search journey but rejected. These “hard negatives” force the model to learn fine-grained differences between similar listings rather than just distinguishing a cabin in Tahoe from a flat in London.

For the architecture, they employed a standard two-tower network.

Don’t know what that is? Take a look here!

## [[RecSys] Part 2: Two tower models in industry](2025-08-10-recsys-part-2-two-tower-models-in.md)

Ludovico Bessi

·

August 10, 2025

[![\[RecSys\] Part 2: Two tower models in industry](../assets/151b4a0c348f4760.png)](2025-08-10-recsys-part-2-two-tower-models-in.md)

Introduction

Read full story

The Listing Tower processes home features (amenities, historical engagement, capacity). Since listing attributes don’t change by the second, this tower runs offline in a daily batch job to pre-compute embeddings.

The Query Tower processes real-time context (location, guest count, length of stay). This runs online at inference time.

By splitting the compute, they minimize online latency. The system only needs to infer the query embedding in real-time and then perform a nearest-neighbor search against the pre-computed listing embeddings.

# Production Strategy: Why IVF Beat HNSW

The most interesting engineering constraints emerged during the serving phase. The team evaluated Approximate Nearest Neighbor (ANN) algorithms, specifically Hierarchical Navigable Small Worlds (HNSW) and Inverted File Index (IVF).

While HNSW generally offers superior recall, Airbnb chose IVF. There were two production reasons for this:

1\. **High Write Throughput** : Airbnb listings change constantly—availability, pricing, and booking status updates happen in real-time. HNSW graphs can become memory-heavy and complex to manage under high-frequency updates. IVF, which clusters listings and stores centroids, handles these updates more gracefully by treating cluster assignments as standard metadata.

2\. **Filtering Performance** : Most searches involve strict constraints (e.g., must be in Paris, must have 3 beds). HNSW struggles with heavy post-filtering or “pre-filtering” that fragments the graph navigation. With IVF, the system retrieves the top clusters relevant to the query and then applies standard boolean logic to filter listings within those clusters. This integrated seamlessly with their existing search infrastructure.

A final, high-signal insight came from their choice of distance metric. They tested both dot product and Euclidean distance. While model performance was similar, Euclidean distance proved superior for the IVF implementation.

Dot product tends to ignore vector magnitude. Since Airbnb uses count-based features (e.g., number of reviews), magnitude matters. Using dot product resulted in unbalanced clusters—some massive, some empty—which degrades retrieval speed and accuracy. Euclidean distance naturally accounted for magnitude, resulting in balanced cluster sizes and a more robust distributed system.

# References

  1. Airbnb embeddings
