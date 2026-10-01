# 11 Percent NDCG Gains That Were Actually Just Target Leakage [Edition #17]

*Machine Learning at Scale collection — Ludovico Bessi, 2026-07-11 · topic: recsys*

[](../assets/9048b42527639f3a.jpg)

# System Overview

MarketPlace Prime is a Series D horizontal marketplace company that recently hit a GMV run rate of 4.2 billion dollars per year. They have established a dominant position in the mid-market goods category, scaling their catalog to over 85 million active listings.

Their engineering team built a Search Discovery Stack that powers 92 percent of all site conversions. Here is their setup:

# Architecture Overview

When a user enters a search query, the system executes a classic two-stage retrieval and ranking pipeline to surface relevant items.

[](../assets/cd63b6592eea2573.png)

### Traffic patterns:

Search Requests: 140 million per day

User Actions: 1.2 billion events per day (clicks, adds, purchases)

Average: 1,620 req/sec

Peak: 2,850 req/sec

The ML Pipeline:

Stage 2 uses a LambdaMART gradient boosted decision tree model with 450 features. It is trained on the last 30 days of search logs. One of the highest-weight features is merchant_quality_score (MQS), a scalar output from a separate regression model. MQS itself is trained every Sunday at 02:00 UTC using labels derived from search outcomes (clicks, cart-adds, and purchases) from the preceding 7 days. The Ranker model is then retrained every Sunday at 06:00 UTC, consuming the updated MQS values from the Feature Store.

### Current performance:

P99 Latency: 145ms

Availability: 99.98%

Purchase Conversion Rate: 3.4% (Flat for 9 months)

Offline NDCG@10: 0.79 (Up from 0.71 over 14 months)

Costs:

Model Training (GPU/High-Mem instances): 95,000 dollars per month

Feature Store and Inference Infrastructure: 110,000 dollars per month

Total: 205,000 dollars per month

### Recent incidents:

Incident 1: MQS service timeout caused by a 4x spike in merchant registrations. Resulted in ranker falling back to default MQS of 0.5, causing a 12 percent drop in CTR for 4 hours.

Incident 2: Sunday morning training job for the ranker failed due to OOM. Recovery took 6 hours, resulting in a stale model being served for half a day.

# The Analysis

Now let me show you what is actually happening here.

## Critical Issue #1: Positive Feedback Loop in Feature Generation

The setup shows the MQS model is trained at 02:00 UTC on Sunday using ranking outcomes from the Search surface. The Ranker is then trained at 06:00 UTC using that MQS score. This is a closed-loop system. The Ranker places Merchant A at the top because they have a high MQS. Because Merchant A is at the top, they get more clicks (position bias). The MQS model sees these clicks and assigns Merchant A an even higher score. The Ranker then sees the higher score and becomes more “confident” in the placement. You are not measuring quality; you are measuring the Ranker’s own historical preference.

## Critical Issue #2: Target Leakage in Offline Evaluation

The offline NDCG@10 has climbed from 0.71 to 0.79, which would usually be a career-defining improvement. However, the analysis shows that the offline evaluation set is sampled from the same production logs where the Ranker already influenced the MQS. When the model “predicts” a purchase in the test set, it is using a feature (MQS) that already contains the information that the user was shown this item in a high-ranking position. The model is essentially looking at the answer key. The 11 percent increase in NDCG is purely the model getting better at reconstructing its own past decisions.

### Critical Issue #3: Temporal Misalignment and Incremental Bias

The retraining cadence — MQS at 02:00 and Ranker at 06:00 — ensures that the Ranker is always learning from the “freshest” bias. Every week, the Ranker absorbs the amplified position bias from the MQS model. This explains why the online purchase rate has been flat for 9 months despite offline metrics soaring. You are spending 95,000 dollars a month to train models to agree with each other more efficiently, while the user experience remains static.

### Critical Issue #4: Organizational Silos Obscuring Data Lineage

The MQS model is managed by the Supply Quality team, while the Ranker is managed by the Search team. During the architecture review, it was discovered that neither team had a full DAG of the feature lineage. The Search team treated MQS as an exogenous “ground truth” of merchant goodness, while the Supply team treated the Ranker’s output as “unbiased user feedback.” The 14-month delay in identifying this loop is a direct result of the lack of a unified ML Platform ownership.

### Critical Issue #5: Massive Compute Waste on Redundant Learning

They have 40 high-memory P3 instances running just for the Sunday retraining jobs. Because the features and targets are becoming increasingly correlated through this feedback loop, the gradient steps are essentially refining noise. The system is consuming 1.14 million dollars annually in training costs to produce a model that has zero delta in online conversion compared to the version from a year ago.

# WHAT I’D DO INSTEAD

**1\. Implement Counterfactual Logging and Propensity Scoring**

Impact:

Eliminate position bias from MQS training.

Reduction in offline NDCG to a “real” baseline of ~0.68, providing a truthful metric for future gains.

Trade-offs:

Requires logging the probability of each item being shown at a specific position, which increases log volume by 15 percent.

Requires more complex loss functions in the MQS model to incorporate inverse propensity weighting.

**2\. Decouple MQS from Ranking Outcomes**

Current: MQS trained on Search Clicks and Purchases.

New: MQS trained on non-search signals only: delivery speed, return rates, customer support tickets, and direct-to-shop traffic.

Impact: Conversion Rate → 0.2 percent lift (estimated) by surfacing truly high-quality merchants who were previously suppressed by the loop.

Trade-offs:

MQS will be “colder” for new merchants who don’t have historical shipping data yet.

When this is the wrong call: If search-specific intent is the only signal that matters (e.g., a merchant who is good at selling shoes but bad at electronics), removing search signals might hurt category-specific relevance.

**3\. Unified Feature Lineage and Impact Analysis**

Replace: Siloed model training ($95,000/mo)

With: A centralized Feature Store (like Feast or Tecton) with automated upstream dependency tracking.

Total: $82,000/mo

Impact: Automated detection of circular dependencies would have flagged the MQS/Ranker loop within one training cycle.

Trade-offs:

Requires a multi-month migration of all features into a single schema.

High initial labor cost for the ML platform team.

The Impact

### Before redesign:

System stuck in a feedback loop with no real conversion growth.

$2.46M annual total ML ops cost.

After redesign:

Ability to actually improve conversion via unbiased features.

$2.30M annual total ML ops cost (6 percent savings, but significantly higher ROI).

Time to implement: 4 months, team of 4 MLEs.

# APPENDIX: Cost Estimation Methodology

How I estimated the savings for each decision:

Solution 1: Implement Counterfactual Logging

Baseline: $110,000/month infra cost.

After change: $126,500/month (due to 15% log volume increase in S3/Snowflake).

Estimated saving: -$16,500/month (Negative saving/Increased cost).

Key assumption: Storage and ingestion costs scale linearly with log volume.

Confidence: High — logging overhead is predictable.

Solution 2: Decouple MQS from Ranking Outcomes

Baseline: Current MQS training cost $15,000/month.

After change: $12,000/month (simpler data signals, less frequent retraining needed).

Estimated saving: $3,000/month.

Key assumption: Regression on shipping/return data is less computationally intensive than processing 1.2B user events.

Confidence: Medium — depends on the complexity of the new quality signals.

Solution 3: Unified Feature Lineage

Baseline: $95,000/month training + $110,000/month infra = $205,000.

After change: $192,000/month (Reduced retraining frequency and optimized instance usage).

Estimated saving: $13,000/month (6.3% reduction).

Key assumption: Consolidating training schedules and identifying redundant features will reduce total GPU hours.

Confidence: Medium — actual savings depend on how many features are identified as redundant.
