---
title: "The $14K Monthly Discovery Engine That Silently Starved 80 Percent Of Tracks [Edition #16]"
date: 2026-07-04
author: Ludovico Bessi
collection: Machine Learning at Scale
topics: [recsys]
series: "Production war stories"
paywalled: true
words: 641
---

# The $14K Monthly Discovery Engine That Silently Starved 80 Percent Of Tracks [Edition #16]

> Paid post — only the publicly visible preview is included.

[![](../assets/385bc68f41324d47.jpg)](../assets/385bc68f41324d47.jpg)

### The System

EchoStream is a Series B music streaming startup currently supporting 18 million Monthly Active Users (MAU). They recently reached a milestone of 40 million tracks in their catalog, with a strategic focus on expanding their indie and niche label partnerships.

Their engineering team built a dedicated Discovery surface, a separate tab in the UI designed to move users away from their algorithmic bubbles and into the long-tail catalog. Here is their setup:

### Architecture Overview

The process is triggered when a user taps the Discovery icon in the mobile app.

[![](../assets/37a8a971699a732f.png)](../assets/37a8a971699a732f.png)

### Traffic patterns:

Total Request Volume: 38.8 million daily requests to the Discovery endpoint.

Peak: 1,100 requests per second.

Average: 450 requests per second.

### The ML Pipeline:

The two-tower retrieval model and the XGBoost ranker are trained on a sliding 60-day window of engagement data.

Specifically, they use play-completion (binary: played more than 30 seconds) and save signals (binary: user added track to library) collected exclusively from the existing Home Feed. The evaluation set is a 10% random holdout of this same Home Feed engagement log.

### Current performance:

P99 Latency: 115ms

System Availability: 99.94%

Business Impact: Discovery surface CTR is 11.2%. Saves per session are 7.4%.

Costs:

Cloud Inference (GPU nodes for embeddings): $8,400 per month

Feature Store and Data Processing: $5,800 per month

Total: $14,200 per month

### Recent incidents:

Incident 1: Retrieval latency spiked to 400ms after a catalog update added 2 million indie tracks, resolved by re-indexing the Annoy vector space.

Incident 2: Data drift alert triggered on the user-embedding tower following a holiday marketing campaign, requiring a manual retraining of the Word2Vec weights.

# The Analysis

Now let me show you what is actually happening here.

## Critical Issue #1: Training on the Wrong Distribution

The architecture section notes that the Discovery model is trained on 60 days of engagement data from the Home Feed. This is a classic feedback loop. The Home Feed is optimized for retention and familiarity, meaning it naturally biases toward high-probability, popular tracks. By using this as the gold standard for a Discovery mission, the engineers have built a model that is technically excellent at predicting what users like on the Home Feed, but fundamentally incapable of discovering the long tail. The 11.2% CTR is not a sign of successful discovery; it is a sign that the model is finding the same popular tracks users already like and serving them in a new tab.

## Critical Issue #2: The Eval Set is an Echo Chamber

The evaluation harness utilizes a 10% random holdout of the Home Feed engagement logs to validate model performance. This explains why the offline AUC stays high (0.82) even as the stated product mission fails. The model is being tested on its ability to predict a distribution it was trained on. Because the eval set is sampled from the same popularity-skewed distribution as the training data, any track from the bottom 80% of the catalog (the long tail) is statistically invisible. If a track has zero plays on the Home Feed, it never appears in the eval set, meaning the model is never penalized for failing to recommend it.

## Critical Issue #3: Reward Signal Selection Bias

The primary label used for training is play-completion (play_count > 30s). In the music industry, users skip unfamiliar content significantly faster than familiar content, regardless of objective quality. By rewarding the model for 30-second completions, the system is implicitly being told to avoid “difficult” or “new” music. The architecture section mentions that “saves” are a secondary signal, but they are bundled into the same engagement-heavy LTR stage. The 7% increase in saves is likely a result of users finding familiar favorites they forgot to add to their library, rather than discovering new indie artists.

## Critical Issue #4: Linear Architecture with No Diversity Constraints
