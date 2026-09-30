---
title: "The $5800 FAISS Index That Was Stale for 168 Hours Straight [Edition #3]"
subtitle: "Learn how swapping an over-provisioned 1024GB memory footprint for hourly HNSW updates can cut retrieval costs by 92% while fixing content freshness."
date: 2026-04-04
author: Ludovico Bessi
collection: Machine Learning at Scale
topics: [retrieval-rag]
series: "Production war stories"
paywalled: true
words: 764
---

# The $5800 FAISS Index That Was Stale for 168 Hours Straight [Edition #3]

*Learn how swapping an over-provisioned 1024GB memory footprint for hourly HNSW updates can cut retrieval costs by 92% while fixing content freshness.*

> Paid post — only the publicly visible preview is included.

*Learn how swapping an over-provisioned 1024GB memory footprint for hourly HNSW updates can cut retrieval costs by 92% while fixing content freshness.*

# The System

LexiFeed is a mid-stage newsletter aggregator company that recently crossed the 10 million total registered users mark. They have scaled to 5 million daily active users (DAU) by providing a centralized inbox for newsletter platforms and independent rss feeds.

Their engineering team built a personalized discovery engine that powers the “For You” tab, which is the primary driver of content consumption on the platform.

Here is their setup.

# Architecture Overview

When a user opens the app, the discovery flow triggers a retrieval request to fetch the top 100 relevant articles from a pool of 1.2 million active newsletter posts.

[![](../assets/7129efc15a23601d.png)](../assets/7129efc15a23601d.png)

### Traffic patterns:

Total Requests: 10.5M requests/day

Peak Throughput: 850 req/sec (typically 8:00 AM EST)

Average Throughput: 120 req/sec

### The ML Pipeline:

Model Type: Two-tower neural network (User Tower and Item Tower) using 512-dimension embeddings. 

Training Data: Engagement logs (clicks and read-time) sourced from 6-month-old historical snapshots.

Feature Set: 256 dense features per user including long-term category preferences and historical click-through rates.

Index Strategy: A flat L2 FAISS index hosted on 8x r5.4xlarge instances, rebuilt and redeployed every Sunday at 2:00 AM.

### Current performance:

P99 Latency: 115ms

Reliability: 99.92 percent uptime

Business Impact: Click-Through Rate (CTR) has remained flat at 4.2 percent for three consecutive quarters.

Costs:

Inference & Retrieval Infrastructure: $8,400 / month

Training Clusters (GPU P3 instances): $4,200 / month

Feature Store & Storage: $1,900 / month

Total: $14,500 / month

Recent incidents:

Incident 1: Recommendation quality dropped to near-zero for 48 hours following a major US election cycle because the model had no representation for the new political keywords.

Incident 2: Recovery took 6 hours because the weekly FAISS index build failed due to an OOM (Out of Memory) error on the build server, requiring a manual rollback to the previous Sunday’s index.

# The Analysis

Now let me show you what is actually happening here.

### Critical Issue 1: Massive Latency Gap in Content Freshness

The Architecture Overview notes the index is refreshed weekly and the model is trained on 6-month-old data. In a newsletter aggregator, content dies in 48 hours. By the time an article makes it into the FAISS index, it is already “stale” by platform standards. If a breaking news newsletter is published on Monday, the system literally cannot retrieve it until the following Sunday. This explains why engagement is flat; the system is effectively a digital museum rather than a discovery engine.

### Critical Issue 2: The Self-Fulfilling Feedback Loop

The ML Pipeline section mentions training on engagement logs from the current system. This creates a closed loop. The system only logs clicks for items it retrieves. Because it only retrieves what it “thinks” is good based on 6-month-old data, it never sees data on new topics. This is why CTR is stagnant. The model is being trained to get better at predicting what people liked half a year ago, which is a useless skill in a news-driven industry.

### Critical Issue 3: Extreme Infrastructure Over-provisioning

The architecture uses 8x r5.4xlarge instances to host a flat FAISS index for 1.2 million items. This is an astronomical waste of resources. 1.2 million 512-dim vectors (float32) take up roughly 2.4 GB of RAM. An r5.4xlarge has 128 GB of RAM. They are paying for 1,024 GB of RAM to store a 2.4 GB dataset. They are likely using a “Flat” index because they are afraid of recall loss, but at this scale, it is pure financial negligence.

### Critical Issue 4: Feature-Model Misalignment (The “Fat” User Tower)

The P99 latency is 115ms, with 45ms spent just in the User Tower. For a two-tower model, the user embedding should be a lightweight projection. 256 dense features for a 5M DAU platform suggests they are over-engineering the input vector with redundant signals. This high inference time limits their ability to do more complex re-ranking downstream because they have already blown their latency budget on a simple retrieval step.

### Critical Issue 5: Popularity Bias Baked into Embeddings

The Training Data uses “clicks and read-time” without any position bias correction. Because the system likely puts “popular” items at the top, those items get more clicks, which tells the model they are “better,” which leads the model to embed them more centrally. Without an exploration strategy or a bias correction layer, the vector space has collapsed into a few high-density clusters of “viral” content from six months ago.

# WHAT I WOULD DO INSTEAD
