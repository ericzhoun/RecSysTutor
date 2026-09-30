---
title: "43. Pick your own embedding dimension: Matryoshka representation learning (MRL)"
subtitle: "Shorten your embedding vector, still get good results (!!!)"
date: 2024-06-30
author: Ludovico Bessi
collection: Machine Learning at Scale
topics: [retrieval-rag]
paywalled: false
words: 490
---

# 43. Pick your own embedding dimension: Matryoshka representation learning (MRL)

*Shorten your embedding vector, still get good results (!!!)*

*Shorten your embedding vector, still get good results (!!!)*

[![red blue and yellow ceramic figurine](https://images.unsplash.com/photo-1613981948475-6e2407d8b589?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzMDAzMzh8MHwxfHNlYXJjaHwxfHxtYXRyaW9za2F8ZW58MHx8fHwxNzE2NzU1MzM5fDA&ixlib=rb-4.0.3&q=80&w=1080)](https://images.unsplash.com/photo-1613981948475-6e2407d8b589?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzMDAzMzh8MHwxfHNlYXJjaHwxfHxtYXRyaW9za2F8ZW58MHx8fHwxNzE2NzU1MzM5fDA&ixlib=rb-4.0.3&q=80&w=1080)Photo by [Didssph](true) on [Unsplash](https://unsplash.com)

# Introduction

In today’s article, let’s discuss how to, in the context of embeddings, we can:

  1. Save a lot of memory

  2. Improve search latency

If you don't know what an embedding is, the TLRD is that it’s a vector of numbers representing some object. Sounds abstract? It’s a feature, not bug ;)

Embeddings are used everywhere to project images, text, audio, etc into just… vector of numbers.

Now, you can imagine that the bigger the vector the more data you can store about the object you care about. While that is true, it is often marginally better.

In some applications, we might not care. In others, we might want to juice up all the performance we can.

What if, depending on the setting we find ourself in, we could decide how much embedding vector to use?

Sounds magic, but it’s actually very much reality. Let’s understand how we get embeddings with such a nice property. 

**Spoiler: the idea is surprisingly intuitive and easy.**

# How do we actually train embeddings to have this property?

Matryoshka representation learning (MRL) is primarily a training paradigm to learn a nested structure of representations. How to train a model to enforce such a structure?

It’s actually surprisingly simple: it’s just a loss definition change.

The same cross entropy loss used to train a plain old regular embedding is average across the dimensions. Imagine the biggest dimension is 2048. The usual loss is described just as:

\\(\mathcal{L}_{reg} = \mathcal{L}_{2048}\\)

The matrioska loss instead, is the average of different cross entropies calculate on different slices of the array:

\\(\mathcal{L}_{matrioska} = \text{Average}(\mathcal{L}_{1:8} + \mathcal{L}_{1:16} + \mathcal{L}_{1:32} + \cdots + \mathcal{L}_{1:2048})\\)

MRL learns a coarse-to-fine hierarchy of nested subspaces, and efficiently packs information in all vector spaces while being explicitly trained only at logarithmic granularities.

… That’s it!

Where’s the catch, you might ask? 

The only catch is that you need to retrain your embeddings if you want to use this technique on them. Not too bad!

The attentive user might be wondering: well, we trained on multiple of 2s, so we can only use those specific embedding dimensions?

The answer is that **model accuracies interpolate all sizes!**

You can pick whatever dimension you please. :)

* * *

# Conclusions

There are a tons of applications for this technique. 

Let’s take as example a retrieval application, where you would need to retrieve a given image from a database. 

You could set this up a 2-step application: 

  1. Rank all images using a very short embedding to save time. 

  2. Re-rank the top 100 images using the full embedding to maximize accuracy.

In this way, you’d save on latency without a total compromise on quality.

Let me know if you use something similar in your Machine Learning systems!

Ludo

* * *

# References

  1. [Matryoshka embeddings paper](https://arxiv.org/abs/2205.13147)

  2. [Matryoshka representation learning](https://aniketrege.github.io/blog/2024/mrl/)
