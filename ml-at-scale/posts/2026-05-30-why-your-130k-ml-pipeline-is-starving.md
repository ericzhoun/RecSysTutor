---
title: "Why Your $130K ML Pipeline Is Starving 65 Percent of New Merchants [Edition #11]"
subtitle: "A blind spot in the ranking logic caused a feedback loop that destroyed supply-side stability in three expansion markets with only 14% retention. Discover how to implement regional multi-armed bandits"
date: 2026-05-30
author: Ludovico Bessi
collection: Machine Learning at Scale
topics: [mlops]
series: "Production war stories"
paywalled: true
words: 382
---

# Why Your $130K ML Pipeline Is Starving 65 Percent of New Merchants [Edition #11]

*A blind spot in the ranking logic caused a feedback loop that destroyed supply-side stability in three expansion markets with only 14% retention. Discover how to implement regional multi-armed bandits*

> Paid post — only the publicly visible preview is included.

*A blind spot in the ranking logic caused a feedback loop that destroyed supply-side stability in three expansion markets with only 14% retention. Discover how to implement regional multi-armed bandits*

QuickBite is a Series D food delivery company that recently hit a milestone of 100 million total orders. They have established a dominant presence in five major metropolitan areas and recently attempted a simultaneous launch in three new expansion markets to satisfy growth targets for their upcoming IPO filing.

Their engineering team built a ranking engine called Mercury that powers the home screen restaurant feed. Mercury is responsible for balancing user relevance with merchant visibility. Here is their setup:

# Architecture Overview

When a user opens the app, the home screen request triggers a ranking flow that attempts to personalize the list of 200+ available merchants based on historical preferences.

[![](../assets/311db33324a3d145.png)](../assets/311db33324a3d145.png)

### Traffic patterns:

Average: 8,000 requests per second

Peak: 14,500 requests per second

The ML Pipeline:

The system uses a point-wise XGBoost ranker trained on the last 180 days of order data. The model uses 150 features, primarily focused on user-merchant interaction counts, user cuisine affinity, and merchant-level conversion rates. For users with no history, the ranking service is hard-coded to bypass the Scoring Service and fetch a pre-computed list from the Global Tier-1 Redis cache.

### Current performance:

P99 Latency: 165ms

System Uptime: 99.98%

Expansion Market Retention: 14% (versus 42% in mature markets)

Costs:

SageMaker Inference: $92,000 per month

Feature Store Managed Service: $38,000 per month

Total: $130,000 per month

Recent incidents:

Incident 1: Merchant Churn Spike. In the first 30 days of market expansion, 65% of new merchants received fewer than 5 orders total, leading to a 3x higher churn rate compared to legacy markets.

Incident 2: Feedback Loop Saturation. The top 5 ranked restaurants in Austin, Texas, reached 100% capacity within 15 minutes of the dinner rush, while 90% of local merchants had zero active orders.

### The Analysis

Now let me show you what is actually happening here.

### Critical Issue 1: The Global Feedback Loop Trap

 _I write about ML systems in production — the tradeoffs, the architecture decisions, the stuff that doesn’t make it into papers. If you want to go deeper, the paid tier covers the technical details I can’t fit in free posts._
