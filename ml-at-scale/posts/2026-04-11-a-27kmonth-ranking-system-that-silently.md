---
title: "A $27K/Month Ranking System That Silently Buried 45,000 New Listings Daily [Edition #4]"
subtitle: "Learn how MGET serialization on 500 candidates and positional bias caused a massive offline-online gap and how to slash P99 latency by 170ms using two-tiered fetching."
date: 2026-04-11
author: Ludovico Bessi
collection: Machine Learning at Scale
topics: [recsys]
series: "Production war stories"
paywalled: false
words: 1342
---

# A $27K/Month Ranking System That Silently Buried 45,000 New Listings Daily [Edition #4]

*Learn how MGET serialization on 500 candidates and positional bias caused a massive offline-online gap and how to slash P99 latency by 170ms using two-tiered fetching.*

[![](../assets/7df8fc3f4982875d.jpg)](../assets/7df8fc3f4982875d.jpg)

# The system

SwiftMarket is a Series B e-commerce marketplace company that recently raised 45 million dollars to scale their discovery engine. They have reached a milestone of 3.2 million completed transactions per month across a catalog of 1.5 million active listings.

Their engineering team built a learning-to-rank (LTR) system that powers the main search results page. Here is their setup.

# Architecture Overview

When a user enters a search term, the request hits the Search Gateway, which coordinates a multi-stage retrieval and ranking process.

[![](../assets/bb3d6c1561818c40.png)](../assets/bb3d6c1561818c40.png)

### Traffic patterns:

Search Requests: 520 million/month

Catalog Updates: 45,000 new listings/day

Average: 200 req/sec

Peak: 1,150 req/sec

The ML Pipeline:

The model is an XGBoost Ranker trained weekly on S3 data lakes containing raw click logs. The labels are binary (1 for click, 0 for no click).

Features include historical Click-Through Rate (CTR) and conversion rates, which are computed via a Spark job every 24 hours and pushed to the Redis Feature Store.

### Current performance:

P99 Latency: 380ms

Availability: 99.92%

Business impact: 12% increase in Search CTR (Offline test predicted +35%)

Costs:

Infra (EC2/Elasticsearch): $14,200/month

Managed Feature Store (Redis): $12,800/month

Total: $27,000/month

### Recent incidents:

Incident 1: Search latency spiked to 2 seconds after a marketing campaign; the Feature Store couldn’t handle the concurrent read IOPS on the primary shard.

Incident 2: Recovery took 4 hours when the daily Spark job failed, leaving the Feature Store with stale data for 48 hours and causing a 5% drop in conversion.

# The Analysis

Now let me show you what is actually happening here.

**Critical Issue #1: The 24-Hour Cold Start Blackout**

Look at the Architecture Overview: the Feature Store is updated via a daily batch job. If a seller lists an item at 9:00 AM, the features for that item (CTR, popularity, etc.) do not exist in Redis until the next day’s job finishes. Because the XGBoost model relies heavily on historical CTR features to rank items, these new listings receive a default “null” value. In a marketplace with 45,000 new listings daily, you are effectively burying 100% of your fresh inventory at the bottom of page 10 for the first 24 hours of their life.

**Critical Issue #2: The Positional Bias Feedback Loop**

The training setup uses raw click logs as binary labels. In the current UI, users naturally click the top 3 results more often because they are visible without scrolling. By training on these raw clicks without debiasing for position, the model is simply learning to predict what was already at the top of the page. This explains why the offline metrics looked amazing (the model predicted the status quo perfectly) while the online impact is underwhelming. You aren’t ranking for relevance; you are ranking for historical UI placement.

**Critical Issue #3: Feature Store Latency Bloat**

The Feature Store is taking 110ms per request, which is nearly 30% of the total P99 latency budget. This is happening because the Main Ranking Service is fetching features for all 500 candidates retrieved from Elasticsearch. Fetching 500 keys from a remote Redis instance (even with MGET) introduces significant network serialization overhead. This is why the system choked during the marketing peak mentioned in the incidents.

**Critical Issue #4: The Accuracy Mirage (Offline/Online Gap)**

The team is training on “clicks” but the business cares about “transactions.” The architecture shows the model treats every click as a success. However, in e-commerce, a click on a low-priced, clickbait item that never converts is actually a failure for the marketplace. The 35% predicted offline lift was based on a click-prediction task, but the actual 12% online lift reflects the fact that you are driving high-volume, low-value clicks that don’t lead to sales.

**Critical Issue #5: Redundant Computation and Cost**

They have 12 nodes of Elasticsearch just for BM25 retrieval. Since the XGBoost model is only re-ranking the top 500, they are paying for high-performance Elasticsearch instances to do simple text matching that is then ignored or overridden by the second stage.

# WHAT I WOULD DO INSTEAD

**1\. Introduce Epsilon-Greedy Exploration for New Listings**

Impact:

Eliminate the 24-hour visibility gap for new inventory.

Expected 15% increase in “First Day Sales” for new sellers.

Trade-offs:

Randomly injecting new items into the top 10 results will slightly degrade the experience for some users who expect 100% relevance.

When this is the wrong call: If your marketplace has a high penalty for “garbage” results (e.g., high-end luxury goods), unvetted exploration can damage brand trust.

**2\. Position-Bias Correction in Training**

Current: Label = Click (Binary)

New: Label = Click / PropensityScore (where Score = Expected CTR at that rank)

Impact: Offline/Online metric alignment → 0.85 correlation (up from 0.4).

Trade-offs:

Requires logging the “Position” of every item at the time of the search, which increases log volume by roughly 20%.

**3\. Two-Tiered Feature Fetching**

Current: Fetch features for 500 items (110ms) → Rank 500.

New: Fetch “Light” features for 500 items → Rank → Fetch “Heavy” features for top 60 → Final Sort.

Impact: P99 Latency 380ms → 210ms.

Trade-offs:

Increases architectural complexity by adding a secondary ranking stage.

## The Impact

Before redesign:

New listings are invisible for 24 hours.

$27,000/month infrastructure spend.

After redesign:

New listings gain immediate visibility; search latency reduced by 40%.

$19,500/month infrastructure spend (27% savings).

## The Lesson

The system already told them what is wrong:

Incident 1 → Your feature retrieval strategy is unscalable for your candidate size.

The Offline/Online Gap → Your training labels do not match your business goals.

They just need to listen to what the system is saying.

How do you handle the trade-off between showing the “best” items and giving new sellers a fair shake at the top of the page?

# APPENDIX: Cost Estimation Methodology

Solution 1: Epsilon-Greedy Exploration

Baseline: $0 direct cost change, but addresses the “opportunity cost” of 45,000 stale listings.

After change: Minimal compute overhead.

Estimated saving: $0 in infra, but projected $220k/month in GMV from faster inventory turnover.

Confidence: High — This is a standard cold-start pattern.

Solution 2: Position-Bias Correction

Baseline: No direct infra savings.

After change: Increased S3 storage costs for position logging ($150/month).

Estimated saving: $0 infra; massive reduction in “wasted” training cycles.

Confidence: High.

Solution 3: Two-Tiered Feature Fetching

Baseline: Redis r6g.4xlarge nodes (8 nodes) = $12,800/month.

After change: By reducing the MGET payload from 500 to 60 items, we can downsize to r6g.xlarge nodes (8 nodes) = $3,200/month.

Estimated saving: $9,600/month (75% reduction in Feature Store costs).

Key assumption: That 80% of the Redis cost was driven by memory bandwidth and IOPS requirements for large candidate sets.

Confidence: Medium — Actual savings depend on how much memory the feature set itself requires vs. the IOPS overhead.
