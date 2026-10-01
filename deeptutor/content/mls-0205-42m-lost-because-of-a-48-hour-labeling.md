# 0.08% False Positive Rate That Masked a $4.2M Attack [Edition #8]

*Machine Learning at Scale collection — Ludovico Bessi, 2026-05-09 · topic: mlops*

[](../assets/95f16c8dcdcc59a9.jpg)

FinShield is a Series B fintech company that recently expanded its cross-border payment rails to 14 new markets. They have scaled aggressively, now processing 8 million transactions per day for a global user base.

Their engineering team built a real-time anti-abuse gateway that sits in the critical path of every transaction. Here is their setup:

# Architecture Overview

When a user initiates a transaction, the request hits the Risk Gateway. This service fetches pre-computed features and orchestrates the model inference before returning a boolean allow/deny decision.

[](../assets/68532241abeaabed.png)

### Traffic patterns:

Total Volume: 8,000,000 transactions per day

Average Throughput: 92 requests per second

Peak Throughput: 480 requests per second

The ML Pipeline:

The system uses an ensemble of a Gradient Boosted Tree (XGBoost) and a shallow Neural Network. It is retrained every Sunday at 2:00 AM UTC using a sliding window of the previous 90 days of transaction data. Labels are generated automatically: any transaction not flagged as fraudulent by a human or a chargeback within 48 hours of clearing is labeled as Benign.

### Current performance:

P99 Inference Latency: 45ms

Service Availability: 99.99%

False Positive Rate: 0.08%

Costs:

Model Training Compute (Weekly GPU/Spark): $18,500/month

Feature Store Throughput: $14,000/month

Total: $32,500/month (Infrastructure only)

Recent incidents:

March 12: 14-minute latency spike due to DynamoDB throttling. Recovered by increasing provisioned RCUs.

May 5: Systemic failure to block $4.2M in fraudulent transactions over a 35-day period. Recovery required manual merchant blacklisting and a full model rollback.

# The Analysis

Now let me show you what is actually happening here.

### Critical Issue #1: The Implicit Negative Feedback Loop

 _I write about ML systems in production — the tradeoffs, the architecture decisions, the stuff that doesn’t make it into papers (like this one!) If you want to go deeper, the paid tier covers the technical details I can’t fit in free posts._

Look at the label construction logic in the architecture section. They label everything as good if it is not flagged within 48 hours. This is a catastrophic assumption in fintech. Most sophisticated fraud rings wait for the clearing window to pass, and chargebacks often take 15 to 45 days to hit the system.

By the time the next Sunday retraining cycle happens, the model is training on thousands of fraudulent transactions that have been incorrectly labeled as good.

The model is effectively being taught that the new attack pattern is exactly what a good user looks like.

### Critical Issue #2: The Rolling Window Poisoning

The 90-day training window was designed for stability, but it became the adversary’s greatest tool. The attack shifted transaction patterns by only 2% to 3% each week. Because the window is so large, the overall feature distribution shift remained below the team’s rudimentary anomaly thresholds. By week five, the poisonous data represented roughly 12% of the total training set. This is more than enough to shift the decision boundary of a Gradient Boosted Tree, causing it to assign high confidence scores to fraudulent merchant categories.

### Critical Issue #3: Confidence Stability Trap

The team was monitoring Model Confidence Scores as a proxy for model health. In the Architecture Overview, the False Positive Rate is cited at 0.08%. This looked great on a dashboard, but it was a lie. As the model learned the poisoned labels, it became more confident about its wrong predictions. The prediction distribution stayed consistent because the model was successfully mapping the new attack features to the Benign label it was fed. They were monitoring the output of the model, but they were never monitoring the stability of the inputs.

### Critical Issue #4: Population Stability Index (PSI) Blindness

There is no mention of PSI or Kullback-Leibler divergence monitoring on the input features. The Architecture Overview shows the system fetches Merchant Aggregates. During the attack, the concentration of transactions in specific “shell” merchant categories shifted significantly. A simple PSI check on the merchant_category_id feature would have flagged that the current week’s traffic looked nothing like the 90-day baseline, even if the model’s error rate appeared stable.

### Critical Issue #5: Under-utilization of Feature Store Latency

They are paying $14,000 a month for DynamoDB, yet they are only doing simple lookups. The 12ms-15ms latencies for Merchant Aggregates suggest they are not doing any real-time graph analysis or complex link analysis. For a company at this scale, relying on static merchant aggregates while ignoring the connections between accounts is an invitation for multi-accounting fraud.

# WHAT I’D DO INSTEAD

**1\. Implement Continuous Distribution Monitoring**

Instead of just monitoring confidence scores, I would deploy automated Population Stability Index (PSI) tracking across the top 20 most predictive features in the ensemble.

Impact:

Immediate detection of feature drift within 4 hours of an attack launch.

Reduction in Time-to-Detection for poisoning attacks from 35 days to under 24 hours.

Trade-offs:

Increased storage costs for logging feature vectors.

Requires a dedicated monitoring service to compute statistics over a stream.

**2\. Verified Label Lag and Canary Evaluation**

Replace the 48-hour implicit labeling with a dual-window approach. Only train the production model on labels that are at least 30 days old (verified). Use the last 7 days of data for a Shadow/Canary evaluation only.

Current: Train on T-48h labels (high noise).

New: Train on T-30d verified labels + 7-day shadow validation.

Impact: Label Accuracy: 82% → 99%.

Trade-offs:

The model will be slower to adapt to legitimate new user behaviors.

Requires maintaining two distinct data pipelines for training and validation.

When this is the wrong call: If the business operates in a hyper-growth phase where user behavior changes every 48 hours legally, a 30-day lag might be too slow.

**3\. Shift to Spot Instances and Pruned Windows**

Replace the massive 90-day Spark retraining on on-demand instances ($18,500/mo) with a 30-day high-fidelity window using Spot instances and an incremental learning approach.

Replace: 90-day full retrain ($18,500)

With: 30-day incremental update + Spot instances

Total: $6,200/month

Trade-offs:

Incremental learning (warm-starting trees) can sometimes lead to local minima.

Spot instance interruptions need a robust checkpointing strategy in the training pipeline.

# The Impact

Before redesign:

System is vulnerable to slow-poisoning attacks that can bypass detection for over a month.

$32,500/month infrastructure spend with high label noise.

After redesign:

Real-time drift detection and high-fidelity labels prevent large-scale clearing of fraudulent funds.

$20,200/month infrastructure spend (38% savings).

Time to implement: 5 weeks, 3 engineers (1 ML Platform, 2 Data Engineers).

# The Lesson

The system already told them what was wrong:

The 48-hour label window → This was a known risk for chargebacks that the team ignored for the sake of “fresh” data.

High confidence during a shift → This is the classic signature of a model being trained on the attack itself.

They just need to listen to what the data distribution is saying, not just what the model’s final score is.

Should we prioritize model freshness or label reliability in high-stakes financial environments?

# APPENDIX: Cost Estimation Methodology

How I estimated the savings for each decision:

Solution 1: Continuous Distribution Monitoring

Baseline: $0 (No current monitoring)

After change: $1,200/month (Managed Prometheus + Grafana + Lambda for PSI calculations)

Estimated saving: -$1,200/month (Cost increase for reliability)

Key assumption: Processing 1% of feature vectors is sufficient for statistical significance in PSI.

Confidence: High

Solution 2: Verified Label Lag

Baseline: Included in existing training costs.

After change: No change in compute, but significant reduction in loss.

Estimated saving: $0 in infra, but $4.2M in loss prevention.

Key assumption: The $4.2M loss is recurring if the vulnerability isn’t patched.

Confidence: High

Solution 3: Spot Instances and Pruned Windows

Baseline: $18,500/month (Weekly 90-day Spark jobs on on-demand GPU clusters)

After change: $18,500 * 0.3 (Spot discount) * 0.33 (Reduced window size) + $2,000 (checkpointing overhead) = $4,000 + $2,000 = $6,000/month.

Estimated saving: $12,500/month (67% reduction in training cost)

Key assumption: 30 days of data provides enough signal for the XGBoost ensemble to maintain current F1-scores.

Confidence: Medium — actual performance depends on the variance of the 30-day data compared to the 90-day baseline.
