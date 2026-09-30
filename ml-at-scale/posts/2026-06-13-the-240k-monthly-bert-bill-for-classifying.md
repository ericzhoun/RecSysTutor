---
title: "Why a 0.92 F1 Score Hid a 31 Percent Violation Surge"
subtitle: "Learn how tiered inference and FastText could slash 72 percent of infrastructure costs while maintaining 28,000 requests per second throughput."
date: 2026-06-13
author: Ludovico Bessi
collection: Machine Learning at Scale
topics: [mlops]
paywalled: true
words: 384
---

# Why a 0.92 F1 Score Hid a 31 Percent Violation Surge

*Learn how tiered inference and FastText could slash 72 percent of infrastructure costs while maintaining 28,000 requests per second throughput.*

> Paid post — only the publicly visible preview is included.

*Learn how tiered inference and FastText could slash 72 percent of infrastructure costs while maintaining 28,000 requests per second throughput.*

[![](../assets/6d3f3e67230429d8.jpg)](../assets/6d3f3e67230429d8.jpg)

PulseFeed is a series-C social media company that recently surpassed 200 million monthly active users. They have seen a 40 percent year-over-year growth in user-generated content, largely driven by their new short-form video and public thread features.

Their engineering team built a system called Sentinel-V3 that serves as the primary automated gatekeeper for content safety. It is designed to auto-remove posts that violate community guidelines regarding hate speech and harassment. Here is their setup:

# Architecture Overview

When a user submits a post, the Content Delivery API triggers a synchronous call to the Sentinel-V3 gateway. The post cannot be published until this service returns a verdict.

[![](../assets/f724ce178c0e94ed.png)](../assets/f724ce178c0e94ed.png)

### Traffic patterns:

Total posts: 1.3 billion per day

Peak throughput: 28,000 requests per second

Average: 15,000 requests per second

Peak: 32,000 requests per second

### The ML Pipeline

The system uses a DistilBERT-based classifier for text and a separate ResNet-50 for images. Both models are fine-tuned on a dataset of 4 million human-labeled examples. Ground truth is provided by an external contractor team of 150 labelers. Every Sunday, the training and evaluation sets are refreshed by sampling 50,000 new examples from the previous week’s flagged content, which the contractors re-verify.

### Current performance

End-to-end P99 Latency: 55ms

Model Accuracy (F1-score): 0.92 (reported by internal eval set)

False Negative Rate: 4 percent (reported by internal eval set)

Costs:

Inference Infrastructure: $240,000 per month

Labeling Operations: $115,000 per month

Total: $355,000 per month

Recent incidents:

Incident 1: A 31 percent surge in user-reported policy violations over 18 months, despite the model evaluation metrics remaining flat. No alerts triggered because the system believed it was performing within spec.

Incident 2: A 4-hour partial outage in June caused by the UserReputation service timing out, which defaulted the gateway to Allow-All mode, flooding the platform with unmoderated content.

# The Analysis

Now let me show you what is actually happening here.

### Critical Issue #1: The Evaluation Loop Death Spiral

I write about ML systems in production — the tradeoffs, the architecture decisions, the stuff that doesn’t make it into papers. If you want to go deeper, the paid tier covers the technical details I can’t fit in free posts.
