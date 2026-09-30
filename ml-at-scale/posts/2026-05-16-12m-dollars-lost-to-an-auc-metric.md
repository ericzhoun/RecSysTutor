---
title: "12M Dollars Lost to an AUC Metric That Ignored Probability Calibration [Edition #9]"
subtitle: "Learn how miscalibrated pCTR scores in a 260K RPS bidding engine destroyed advertiser ROI and how to fix it with Isotonic Regression."
date: 2026-05-16
author: Ludovico Bessi
collection: Machine Learning at Scale
topics: [mlops]
series: "Production war stories"
paywalled: true
words: 329
---

# 12M Dollars Lost to an AUC Metric That Ignored Probability Calibration [Edition #9]

*Learn how miscalibrated pCTR scores in a 260K RPS bidding engine destroyed advertiser ROI and how to fix it with Isotonic Regression.*

> Paid post — only the publicly visible preview is included.

*Learn how miscalibrated pCTR scores in a 260K RPS bidding engine destroyed advertiser ROI and how to fix it with Isotonic Regression.*

[![](../assets/719fd71de1e55405.jpg)](../assets/719fd71de1e55405.jpg)

AdTechFlow is a growth-stage programmatic advertising company that recently crossed the $300M annual ad spend milestone. They have seen 40 percent year-over-year growth in managed spend, positioning themselves as a top-tier mid-market Demand Side Platform.

Their engineering team built a real-time bidding engine that processes hundreds of billions of monthly bid requests. Here is their setup.

# Architecture Overview

[![](../assets/62b59a21827b781f.png)](../assets/62b59a21827b781f.png)

When an ad exchange sends a bid request via OpenRTB, it hits the AdTechFlow global load balancer. From there, the request flows into the bidding cluster.

### Traffic patterns:

Average: 180,000 req/sec

Peak: 260,000 req/sec

Total Monthly Impressions: 450 Billion

The ML Pipeline:

The pCTR model is a Deep Neural Network trained on historical impression and click logs using a 6-month sliding window. It uses categorical features for user geography, device, and domain, plus visual embeddings for the creative thumbnails. The training objective is binary cross-entropy, and the primary offline metric for model promotion is AUC. The pipeline re-trains every 7 days.

### Current performance:

P99 Inference Latency: 22ms

Availability: 99.95 percent

CTR (Aggregate): 0.28 percent (up from 0.21 percent last quarter)

Costs:

Model Training (EC2 P4d instances): $85,000/month

Inference Fleet (C6i instances): $410,000/month

Total Infra: $1.2M/month

Recent incidents:

March 14: Model deployment failed due to feature drift in a new creative category, recovered in 2 hours.

April 02: 22 point drop in Advertiser Net Promoter Score (NPS) reported over a rolling 8-week window.

May 10: Churn of two enterprise-tier accounts representing $12M in annual recurring revenue.

# The Analysis

Now let me show you what is actually happening here.

### Critical Issue #1: AUC-Only Optimization

 _I write about ML systems in production — the tradeoffs, the architecture decisions, the stuff that doesn’t make it into papers. If you want to go deeper, the paid tier covers the technical details I can’t fit in free posts._
