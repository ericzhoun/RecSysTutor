---
title: "#20 Machine Learning Features store challenges from Constructor.io"
date: 2023-05-14
author: Ludovico Bessi
collection: Machine Learning at Scale
topics: [career]
paywalled: false
words: 651
---

# #20 Machine Learning Features store challenges from Constructor.io

[![#20 Machine Learning Features store challenges from Constructor.io](../assets/d7be313b2ac1697a.jpg)](../assets/d7be313b2ac1697a.jpg)

# Table of contents

  1. **Introduction.**

  2. **What is a Feature Store anyway?**

  3. **Offline Batch Layer**

  4. **Online Serving Layer**

  5. **Closing thoughts**

# Introduction

In today's article I will discuss engineering challenges faced by Constructor.io [1] when implementing a feature store.

Let's dive in!

* * *

# What is a Feature Store anyway?

First things first, what's a Feature Store and why do you need one?

Broadly, a Feature Store is a centralized storage of Machine Learning features that can be used offline and online by Machine Learning models.

Usually, as a new team starts out with Machine Learning, features are calculated in the back-end and logged away. Since the training dataset is constructed from request logs, it has features available straight away. Once the model is picked up for serving, the backend runs the same feature calculation code and calls model inference.

As the team scales to more features, challenges with train-inference mismatch, backfilling, and double work arise, making the feature logging approach less attractive.

This is then how the Feature Store comes into place:

  * Feature Storage is centralized across different teams.

  * Features are decoupled from particular log streams.

  * Features calculation is shifted from online to offline.

A Feature Store usually has two kind of APIs: offline for model training and online for model serving, in the next two sections I will describe how they are designed.

* * *

# Offline Batch Layer

A set of batch jobs calculate features in the offline environment on a daily basis. Each job’s output is a table with multiple feature columns. Different features are grouped together into Feature Groups.

Offline feature values available for the whole timeline and can backfill features for older dates.

Now, as all features registered are in a single place, the Offline API to retrieve and join features into a dataset. The dataset is then enriched with additional features coming from different sources.

Knowledge about features is carried in the model artifact.

The Ranking Service doesn’t need to know any implementation details of the model, but it just needs to have the ability to:

  * Load the artifact from cloud storage

  * Get the required features list

  * Call the predict method.

This interface should be accessible both during offline model training and online serving.

* * *

# Online Batch Layer

A central question is the choice of what low-latency storage to use for request-time features retrieval: when serving a model online, the user expects a fast output.

For this purpose, the Constructor.io team created an indexing service to manage multiple memory-mapped data structures.

Data lives on disk and, thanks to memory mapping, doesn’t eat up a lot of RAM. The Index Service performs well when there’s a need for fast low-latency reads, but not for quick writes or updates.

Data structures are updated regularly in a background by _Index Builders_ and put on the disk for serving. One type of data structure the Index Service supports is a simple key-value, which is enough for online Feature Store use cases.

I know what you are thinking..

> "Why not just use [Redis](https://redis.io/)?!"

It turns out that the team did evaluate using it, however they discarded it for pricing issues: using Redis would have meant an increase in production costs of more than **10% (!!)**.

I found this bit extremely interesting: sometimes it is worth it to build something very specific yourself without incurring in increasing costs for a solution that is excessive for what you need.

* * *

# Closing thoughts

The results of this effort are the following:

  * Minimized code duplication

  * Features are stored once, then reused by multiple models

  * 100s of millions of feature values are stored with minimal increase in infra costs

  * Read latency for 1k feature values as P99 < 10ms

Pretty cool!

# References

  1. [Feature Store Design at Constructor](https://medium.com/constructor-engineering/feature-store-design-at-constructor-330b65f64b18)
