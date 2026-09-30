---
title: "#26 Gensyn: Decentralised Compute for Machine Learning. An introduction. [Part 1]"
date: 2023-06-25
author: Ludovico Bessi
collection: Machine Learning at Scale
topics: [ml-theory]
paywalled: false
words: 593
---

# #26 Gensyn: Decentralised Compute for Machine Learning. An introduction. [Part 1]

[![#26 Gensyn: Decentralised Compute for Machine Learning. An introduction. \[Part 1\]](../assets/b639d27d2a0dbf18.jpg)](../assets/b639d27d2a0dbf18.jpg)

# Table of contents

  1. **Introduction.**

  2. **Introducing Gensyn.**

  3. **Closing thoughts.**

* * *

# Introduction

Today's article is going to discuss an interesting Litepaper: Gensyn [1].

Gensyin is a protocol that connects and verifies off-chain deep learning work in a cost efficient way. Basically, a voluntary grid computing service that has financial incentives for participants to give their computing powers to users that need to have their models trained.

Let me preface by saying that: Yes, this is somewhat blockchain / crypto related.

I am going to focus on the technical aspects of the proposed solution because I find this problem space incredibly interesting but I have no interest in discussing the crypto related problems.

In this first article, I will discuss the problem space and the main challenges.

In the article of next week, I am going to focus on the proposed solutions and open challenges that are yet to be solved.

Let's go!

* * *

# Introducing Gensyn

The problem that Gensyn wants to solve is the following:

> Allow deep learning work to be carried out by a network of workers that use their GPU resources in exchange of tokens (aka money)

I found the idea incredibly interesting: no need to buy a GPU yourself or pay for cloud resources that are usually quite expensive for just some random experiment.

However, there are some challenges that need to be solved.

**Work verification**

How can you possibly know that a malicious users did not just return rand() for all weights of your model? To validate that work has been completed up to a specific point, all work up to that point must be performed and verified.

**Market**

A two sided marketplace is usually quite complicated to get started: imagine having only one user submitting and thousands of GPUs ready to work for that user: the price would crash in such a setting. Similarly, if only a few GPUs are available and there are many users requiring work, the price would skyrocket up to a point where probably it'd be cheaper to just use other solutions.

**Ex-ante work estimation**

How do you know when a task will finish? Or even a more difficult question: how do you estimate how much work is left for a defined task?

This is important for estimating how much payout to give for a given task.

**Privacy**

Fine-tuning often uses proprietary data. How are you supposed to trust to give pieces of your dataset to random workers in the network? Data needs to somehow be encrypted for training purposes.

**Parallelisation**

Deep learning models are typically trained in parallel over large clusters of hardware to access scale. But how is it possible to parallelize such a network with the unreliable nature of the compute resources?

# Closing thoughts

Leaving aside the economics of the project, you might think that some of the problems showed above are not solvable and the idea is completely crazy.

While I also think that solving distributed training with this is a very bold proposal, reading the proposed solutions based on very recent literature was very illuminating and challenged what I believed to be completly impossible.

In the next article, I am going to address all the problems that arise from such a solution.

I hope you enjoyed this not-so-usual article. Let me know if you enjoy this different style in the comments or on LinkedIn :).

Stay tuned for part **2!**

* * *

# References

  1. [Gensyn Litepaper.](https://docs.gensyn.ai/litepaper/)
