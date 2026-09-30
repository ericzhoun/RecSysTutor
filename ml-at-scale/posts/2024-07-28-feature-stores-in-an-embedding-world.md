---
title: "47. Feature stores in an embedding world"
subtitle: "We all know features stores are important in a MLOps workflow. But how does that change when storing embeddings?"
date: 2024-07-28
author: Ludovico Bessi
collection: Machine Learning at Scale
topics: [retrieval-rag]
paywalled: false
words: 357
---

# 47. Feature stores in an embedding world

*We all know features stores are important in a MLOps workflow. But how does that change when storing embeddings?*

*We all know features stores are important in a MLOps workflow. But how does that change when storing embeddings?*

Let’s look at the challenges.

* * *

# Challenges

## 1\. Tail scalability challenge

The long tail of entities is a major issue. Majority of entities are rare!

This means that a large number of patterns needed to resolve the tail, making it difficult to scale a system that can learn the patterns.

## 2\. Memory usage

Embeddings linearly grow per number of entities. More computations affect latency.

It’s also harder to fit on a device!

A solution is to only keep the “top k entity” embeddings to drop memory consumption with acceptable accuracy still.

## 3\. Embedding in non-english languages

There is a lack of equally abundant resources in languages other than English.

Memory usage increases the size of **embeddings by the number of languages**

## 4\. Embedding stability

Updating an embedding model is hard business. 

As it is one component in a system of downstream tasks that depend on the embedding quality you need to make sure also those are retrained. 

Otherwise, a previous correct downstream prediction might become incorrect!

## 5\. Embedding evaluation

There are many questions you can ask yourself with trained embeddings:

  1. Are they biased to popular entities in a given geolocation?

  2. Vulnerable to adversarial attacks?

  3. Are the downstream applications affected by the updated embeddings?

  4. How to enable safe and regular model updates?

* * *

# Conclusions

Using embeddings instead of features can massively speed up the development process, however there are some additional tradeoffs that one needs to take into account to have a smooth flow.

The challenges I have described above are usually business-dependent and you are the most equipped person to answer if a given solution is needed: e.g. you might not need to care at all about retraining models if entities are very stable.

Let me know what challenges you faced in your day to day job and how you managed to solve them.

Ludo

* * *

* * *

# References

  1. [Feature stores in the coming wave of embedding ecosystems.](https://vldb.org/2021/files/slides/tutorial/tutorial4.pdf)
