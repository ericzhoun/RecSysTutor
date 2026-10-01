# The $5800 FAISS Index That Was Stale for 168 Hours Straight [Edition #3]

*Machine Learning at Scale collection — Ludovico Bessi, 2026-04-04 · topic: retrieval-rag*

# The System

LexiFeed is a mid-stage newsletter aggregator company that recently crossed the 10 million total registered users mark. They have scaled to 5 million daily active users (DAU) by providing a centralized inbox for newsletter platforms and independent rss feeds.

Their engineering team built a personalized discovery engine that powers the “For You” tab, which is the primary driver of content consumption on the platform.

Here is their setup.

# Architecture Overview

When a user opens the app, the discovery flow triggers a retrieval request to fetch the top 100 relevant articles from a pool of 1.2 million active newsletter posts.

[](../assets/7129efc15a23601d.png)

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

**1\. Shift to Incremental Indexing and Hourly Refreshes**

Impact:

Content Freshness: 168-hour lag reduced to less than 1 hour.

Expected CTR Increase: 25-30 percent relative improvement as users see news while it is still relevant.

This increases the complexity of the deployment pipeline. Instead of a simple weekly “dump and load,” they need a streaming pipeline (like Kafka or Kinesis) to push new embeddings into the index. This introduces the risk of “index drift” where the index and model versions get out of sync.

**2\. Implement a Rolling 30-Day Training Window with Negative Sampling**

Current: 6-month-old data snapshot.

New: A rolling 30-day window with “Easy Negatives” (random items) and “Hard Negatives” (items shown but not clicked).

Impact: Model adaptation to seasonal trends (e.g., AI news vs. Crypto news) improves from 0 percent to near-real-time.

Shorter training windows provide less data for long-tail users. If a user only logs in once every 45 days, the model might “forget” their specific niche interests if they aren’t captured in the 30-day window.

**3\. Optimize Retrieval Infrastructure**

Replace: 8x r5.4xlarge instances ($5,800/month) with a managed HNSW (Hierarchical Navigable Small World) index on 2x m6g.large instances.

New Total: $450/month for retrieval infra.

Impact: 92 percent cost reduction in the retrieval layer with negligible recall loss.

HNSW is an approximate nearest neighbor search. Unlike the current “Flat” index, it can return slightly different results for the same query. For LexiFeed, this is a non-issue, but it does mean debugging “why did User X see Post Y” becomes harder due to the graph-based nature of the search.

# The Impact

Before redesign:

System unable to surface content newer than 7 days.

$14,500 total monthly cost.

After redesign:

System surfaces content within 60 minutes of publication.

$8,850 total monthly cost (39 percent savings).

Time to implement: 4 weeks, 3 engineers (1 ML, 1 Backend, 1 Data/Infra).

# The Lesson

The system already told them what was wrong:

Incident 1 (Election cycle failure) -> The training data is too old to understand the world.

Incident 2 (Weekly OOM) -> The indexing strategy is brittle and over-sized for the data.

How do you justify a “Flat” FAISS index in a production environment with only 1M vectors when even a basic HNSW implementation would provide 10x the throughput at 1/10th the cost?

# APPENDIX: Cost Estimation Methodology

Solution 1: Managed Indexing

Baseline: 8x r5.4xlarge at $1.008/hour x 720 hours = $5,806/month.

After change: 2x m6g.large (managed service equivalent) at $0.15/hour + throughput fees = $450/month.

Estimated saving: $5,356/month (92 percent reduction).

Key assumption: The vector dataset remains under 10GB, allowing it to fit into memory on smaller ARM-based instances.

Confidence: High.

Solution 2: Rolling Training

Baseline: $4,200/month for massive monthly GPU runs on a 6-month corpus.

After change: Daily incremental training on smaller g4dn.2xlarge instances ($1.20/hour). 24 hours x 30 days = $864/month plus data transfer.

Estimated saving: $3,100/month.

Key assumption: The team can implement checkpoints to avoid retraining from scratch every day.

Confidence: Medium.

Solution 3: Storage Optimization

Baseline: $1,900/month for over-provisioned Redis and Postgres.

After change: Moving cold features to S3/DynamoDB with a smaller Redis cache.

Estimated saving: $700/month.

Key assumption: 80 percent of users only access the top 20 percent of features regularly.

Confidence: Medium.
