---
title: "#23 Compressing LLMs using novel quantization techniques."
subtitle: "How to compress LLMs and accelerate inference to be able to use them in your product, novel technique from an MIT paper."
date: 2023-06-04
author: Ludovico Bessi
collection: Machine Learning at Scale
topics: [llm]
paywalled: false
words: 609
---

# #23 Compressing LLMs using novel quantization techniques.

*How to compress LLMs and accelerate inference to be able to use them in your product, novel technique from an MIT paper.*

*How to compress LLMs and accelerate inference to be able to use them in your product, novel technique from an MIT paper.*

[![#23 Compressing LLMs using novel quantization techniques.](../assets/7a1954c0373f3477.jpg)](../assets/7a1954c0373f3477.jpg)

# Table of contents

  1. **Introduction.**

  2. **Activation-aware Weight Quantization (AWQ)**

  3. **Closing thoughts.**

# Introduction

In today's article I am going to discuss how to efficiently compress and accelerate LLM by diving deep into a very recent pre-print: "AWQ: Activation-aware Weight Quantization for LLM Compression and Acceleration" [1].

I have already discussed quantization techniques in one of my previous posts, check it out first if you want a more gentle introduction:

## [#18 Machine Learning At Scale: Challenges and Solutions of Deploying On-Device Machine Learning models.](https://www.machinelearningatscale.com/p/machine-learning-on-device-models)

Ludovico Bessi

·

April 30, 2023

[![#18 Machine Learning At Scale: Challenges and Solutions of Deploying On-Device Machine Learning models.](../assets/3d633fcfd87af36d.jpg)](https://www.machinelearningatscale.com/p/machine-learning-on-device-models)

Table of contents Introduction: On-Device Machine Learning is hard! First solution: Optimize the size of your Machine Learning model. Second solution: Create two different Machine Learning models. Introduction: On-Device Machine Learning is hard! In the past articles, I have been focusing on large scale systems assuming almost endless computational resources…

[Read full story](https://www.machinelearningatscale.com/p/machine-learning-on-device-models)

Let's get started!

* * *

# Action-aware Weight Quantization

Quantization __ maps a floating-point number into lower-bit integers.

It is a technique used to drastically reduce a model's size and to accelerate inference.

The decoding state of an LLMs is highly **memory bounded** with single batch size and it dominates the total LLM run time.

Given that memory is dominated by weights, the quantization process described here is going to focus on weights only.

**Improving LLM Quantization by Preserving 1% Salient Weights**

The key observation is that weights of an LLM are not equally important: skipping the quantization of such weights can drastically help avoiding model degradation.

... but how to find those weights?

The authors of [1] found out that selecting weights with larger activations significantly improves the quantized performance.

However, now some weights will be integers and other weights will be float: mixing data types like this complicates a lot the implementation of the system.

**Protecting Salient Weights by Activation-aware Scaling**

At first, a standard min-max quantization heuristic is used.

Using such a technique, there is no quantization loss for maximum and minimum values for each quantization group.

Then, salient weights that needs to be protected can just be multiplied by a scaling factor.

This technique improves the quantized performance, but there is still a gap with respect to the first approach showed before.

The quantized performance generally gets better as the scaling factor increases since important weights are better represented. It then decreases since non-salient channels are forced to use a smaller dynamic range (or smaller effective bits) if we use a very large scaling factor.

How is it possible to find the right scaling ratio for each input channel?

With some optimization, of course!

The goal is search for an optimal scaling factor that minimizes the output difference after quantization for a certain layer.

The search space is chosen to reflect the fact that:

  * Salient weights should be protected.

  * Minimize the quantization loss of non-salient weights.

This method outperforms other state of art techniques while being hardware efficient.

# Closing thoughts

Many companies want to start using LLMs in their stack. However though, the cost of running LLMs is a show stopper: they are either prohibitively expensive to run or too slow.

Still, recent advancements in quantization techniques such as the one discussed today could make the difference between a successful integration or a no-go decision.

Let me know if you are thinking about using this technique to finally put that LLM of yours in production! ;)

* * *

# References

  1. [AWQ: Activation-aware Weight Quantization for LLM Compression and Acceleration](https://arxiv.org/abs/2306.00978)
