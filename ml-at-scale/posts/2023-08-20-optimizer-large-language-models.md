---
title: "#34 Scalable Second-order Optimizer for Language Model Pre-training"
date: 2023-08-20
author: Ludovico Bessi
collection: Machine Learning at Scale
topics: [ml-theory]
paywalled: false
words: 574
---

# #34 Scalable Second-order Optimizer for Language Model Pre-training

[![#34 Scalable Second-order Optimizer for Language Model Pre-training](../assets/a7db0257a5e39931.jpg)](../assets/a7db0257a5e39931.jpg)

# Table of contents

  1. **Introduction.**

  2. **Scalable Stochastic Second-order Optimizer for Language Model Pre-Training.**

  3. **Closing thoughts.**

# Introduction

I have recently come across [1]: a new second order optimizer tailored for large language models. I find innovations in this well-explored space incredibly interesting, so let's dive right in!

* * *

# Scalable Stochastic Second-order Optimizer for Language Model Pre-Training.

Pre-training efficiency is thus a major bottleneck in scaling up LLMs.

Designing faster optimizers for LLMs is challenging:

  * The benefit of the first-order pre-conditioner in Adam is not yet well understood

  * The choice of pre-conditioners is constrained because we can only afford light-weight options whose overhead can be offset by the speed-up in the number

For example, the block-diagonal Hessian pre-conditioner in K-FAC is prohibitively expensive for LLMs.

How to get around these issues?

Researchers in [1] created "Sophia": Second-order Clipped Stochastic Optimization, a light-weight second order optimizer that uses an inexpensive stochastic estimate of the diagonal of the Hessian as a pre-conditioner and a clipping mechanism to control the worst-case update size.

On pre-training language models such as GPT-2, Sophia achieves the same validation pre-training loss with 50% fewer number of steps than Adam. Because Sophia maintains almost the memory and average time per step, the speedup also translates to 50% less total compute and 50% less wall-clock time.

In particular, Sophia on a 540M-parameter model with 100K steps gives the same validation loss as Adam on a 770M-parameter model with 100K steps.

Concretely, Sophia estimates the diagonal entries of the Hessian of the loss using a mini-batch of examples every _k_ step.

Two options for diagonal Hessian estimators are considered:

  * An unbiased estimator that uses a Hessian-vector product with the same run-time as a mini-batch gradient up to a constant factor,

  * A biased estimator that uses one mini-batch gradient calculated with resampled labels.

Both the two estimators only introduce 5% overheads per step (in average). At every step, Sophia updates the parameter with an exponential moving average (EMA) of the gradient divided by the EMA of the diagonal Hessian estimate, subsequently clipped by a scalar.

A great thing about this paper is that the work can be seamlessly integrated into existing training pipelines, without any special requirements on the model architecture or computing infrastructure.

Thanks to the Hessian-based pre-conditioner, Sophia adapts more efficiently than Adam does to the heterogeneous curvatures in different parameter dimensions, which can often occur in the landscape of LLMs losses and cause instability or slowdown.

Sophia has a more aggressive pre-conditioner than Adam—Sophia applies a stronger penalization to updates in sharp dimensions (where the Hessian is large) than the flat dimensions (where the Hessian is small), ensuring a uniform loss decrease across all parameter dimensions.

In contrast, Adam’s updates are mostly uniform across all parameter dimensions, leading to a slower loss decrease in flat dimensions.

Sophia’s clipping mechanism controls the worst-case size of the updates in all directions, safeguarding against the negative impact of inaccurate Hessian estimates, rapid Hessian changes over time, and non-convex landscape.

* * *

# Closing thoughts

The second order optimizer I have described converges in fewer steps than first-order adaptive methods, while having the same per-step cost.

That's a really sizeable decrease which is worth exploring in your next training run! You just need to change the optimizer call!! :)

* * *

# References

  1. [Sophia: A Scalable Stochastic Second-order Optimizer for Language Model Pre-training](https://arxiv.org/pdf/2305.14342.pdf)
