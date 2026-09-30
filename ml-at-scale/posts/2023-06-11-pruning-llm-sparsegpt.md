---
title: "#24 Pruning LLMs in OneShot with SparseGPT."
date: 2023-06-11
author: Ludovico Bessi
collection: Machine Learning at Scale
topics: [llm]
paywalled: false
words: 779
---

# #24 Pruning LLMs in OneShot with SparseGPT.

[![#24 Pruning LLMs in OneShot with SparseGPT.](../assets/af7a86d032618a14.jpg)](../assets/af7a86d032618a14.jpg)

# Table of contents

  1. **Introduction.**

  2. **SparseGPT algorithm: an high level overview.**

  3. **Closing thoughts.**

# Introduction

In my previous article, I discussed how to compress LLMs using quantization effectively. You can find it here:

## [#23 Compressing LLMs using novel quantization techniques.](https://www.machinelearningatscale.com/p/compressing-large-language-models)

Ludovico Bessi

·

June 4, 2023

[![#23 Compressing LLMs using novel quantization techniques.](../assets/4c00647e89f1f1f0.jpg)](https://www.machinelearningatscale.com/p/compressing-large-language-models)

Table of contents Introduction. Activation-aware Weight Quantization (AWQ) Closing thoughts. Introduction In today's article I am going to discuss how to efficiently compress and accelerate LLM by diving deep into a very recent pre-print: "AWQ: Activation-aware Weight Quantization for LLM Compression and Acceleration" [1].

[Read full story](https://www.machinelearningatscale.com/p/compressing-large-language-models)

In today's article, I am going to discuss a different approach to reduce a model size: _pruning_. The idea is that more than **100 billion weights** can be ignored at inference time using SparseGPT [1].

* * *

# What is pruning anyway?

Pruning is a practical scenario where you are a given an optimized model _f_ and you must produce a compressed version _f_ that maximizes the performance of the previous model.

Most existing pruning methods usually require extensive retraining **after** the pruning step in order to partially recover accuracy.

However, this is not feasible for GPT-scale methods given the size. It is estimated that pruning GPT3 takes several weeks! [2]

* * *

# SparseGPT algorithm: an high level overview.

**Introducing Layer-wise pruning.**

Layer-wise pruning splits the model compression problem into layer-wise subproblems. The quality of the solution is measured by the error between the output of the uncompressed and compressed layer: minimizing that error turns the problem into a constrained optimization problem.

The objective is to find a sparsity mask for each layer that satisfies the constraint and the dense weights.

The _**sparsity mask**_ of a tensor is the binary tensor of the same dimensions with 0 at the indices of the sparsified entries and 1 at other indices.

After solving each of the layer-wise problems, the model is rebuilt from the compressed layers.

The reconstructed model preserves the accuracy of the dense model if the layer-wise errors are small. Unfortunately, optimizing the sparsity mask and the weights jointly makes the problem [NP-hard](https://en.wikipedia.org/wiki/NP-hardness)!

The goal is now to find a viable heuristic in place of this standard optimizatoin procedure.

**The SparseGPT algorithm.**

The problem can be split into row-wise subproblems. Reconstructing pruned weights is a complex problem because it requires the inversion of a matrix while solving for each row, and the inverse of a masked Hessian is not equal to the masked version of the full inverse. (Unfortunately!)

The task would be easier if all row masks were the same, meaning that only a single shared inverse would be computed. This would greatly reduce the complexity. However, introducing such constraints in the mask selection would mean sparsifying weights in entire columns, which reduces drastically the model's accuracy.

SparseGPT solves this challenge challenge by reusing Hessians, but between rows and distinct pruning masks. This leads to an accurate **and** efficient algorithm.

The SparseGPT algorithm works as follows, given a fixed pruning mask:

  * Prune weights in each column of the weight matrix incrementally using a sequence of [Hessian inverses](https://arxiv.org/pdf/2004.14340.pdf)

  * Update the remainder of the weights in the rows located to the right of the column being processed

SparseGPT is _**local**_ because it performs weight updates after each pruning step, maintaining the input-output relationship between each layer.

The high parametrization of GPT models makes it possible to make the updates without any global gradient information. The cost of the reconstruction process consists of the computation of the initial Hessian, iterating through the inverse Hessian sequence, and pruning.

The pruning mask is chosen _adaptively_ while performing the reconstruction process.

The selection is done through iterative blocking, where a pruning mask is chosen based on the reconstruction error while using the diagonal values in the Hessian sequence. The weights are then updated before the pruning mask for the next block is chosen.

I tried to make this high level overview as intuition-based as possible, but I realize that you may want more details. If that's the case, I heavily suggest reading [1] to satisfy your curiosity!

* * *

# Closing thoughts

Using SparseGPT allows you to reduce a model size by more than 50%, while retaining accuracy.

Another interesting finding is that larger models are easier to sparsify: as the number of parameters increase, the relative accuracy drop for the sparse model is lower.

Let me know if you are going to use the SparseGPT to finally productionize your LLM at reasonable costs! ;)

* * *

# References

  1. [SparseGPT: Massive Language Models Can be Accurately Pruned in One-Shot](https://arxiv.org/pdf/2301.00774.pdf)

  2. [SparseGPT: Remove 100 Billion Parameters For Free](https://neuralmagic.com/blog/sparsegpt-remove-100-billion-parameters-for-free/#:~:text=SparseGPT%20is%20a%20post%2Dtraining,shot%20with%20minimal%20accuracy%20loss.)
