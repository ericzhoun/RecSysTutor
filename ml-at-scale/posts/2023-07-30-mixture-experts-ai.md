---
title: "#31 Mixture of Experts for inference speed-ups of large scale Machine Learning models."
date: 2023-07-30
author: Ludovico Bessi
collection: Machine Learning at Scale
topics: [serving]
paywalled: false
words: 655
---

# #31 Mixture of Experts for inference speed-ups of large scale Machine Learning models.

[![#31 Mixture of Experts for inference speed-ups of large scale Machine Learning models.](../assets/4af55f9bc445007e.jpg)](../assets/4af55f9bc445007e.jpg)

# Table of contents

  1. **Introduction.**

  2. **Mixture of Experts (MoE) inference and training for at scale AI.**

  3. **Closing thoughts.**

# Introduction.

In today's article I am going to discuss how Mixture-of-Experts (MoE) could be powering training and inference for large scale models.

Let's start!

* * *

# Mixture of Experts inference and training for at scale AI.

**Reducing Training Cost by MoE Architecture.**

Researchers in [1] have shown that the scope of MoE to natural language generation (NLG) tasks to improve training speed by 5 times. Moreover, they improved parameter efficiency by reducing reducing model sizes by 3.7 times by distilling a MoE into a "Mixture Of Students" (MoS).

To create an MoE based NLG model, a GPT like transformer model is picked.

A gating function to activate a subset of experts in the MoE layer for each token is used.

Specifically, in the experiments, only the top-1 expert is selected. Therefore, during both training and inference, the MoE model will have the same number of parameters to be activated for each token as their dense part.

For example, 1.3B+MoE128 will only activate 1.3B parameter per token, and the amount of training computation per token will be similar to a 1.3B dense model.

These experts do not change the compute requirements of the model as each token is only processed by a single expert. Therefore, the compute requirements for dense model and its corresponding MoE models with the same base are similar. More concretely, a 1.3B+MoE-128 model training requires roughly the same amount of compute operations as 1.3B dense model, while offering much better model quality.

**Serving MoE Models at Unprecedented Scale and Speed.**

While MoE based models achieve the same quality with 5x training cost reduction, the resulting model has roughly 8x the parameters of the corresponding dense model (e.g., 6.7B dense model has 6.7 billion parameters and 1.3B+MoE-128 has 52 billion parameters).

Such a massive MoE model requires significantly more memory during training, and it is challenging to meet latency requirements for such models during inference as memory bandwidth consumed to read the model weights is the primary performance bottleneck in inference. To reduce the number of parameters and improve the parameter efficiency of MoE based models, a new MoE model architecture (PR-MoE) that reduce the overall model size by up to 3 times without affecting model quality is presented.

The new architecture has a "Pyramid Residual" design:

  * There are experts in the last few layers as compared to previous layers.

  * Every token separately passes one fixed MLP module and one chosen expert downstream.

But what about inference?

Optimizing inference latency and cost is crucial for MoE models to be useful in practice. During inference, the batch size is generally small, so the inference latency of an MoE model depends primarily on the time it takes to load the model parameters from the main memory.

Therefore, the MoE inference performance depends on two main factors: the overall model size and the overall achievable memory bandwidth. Then, how to maximize the achievable memory bandwidth?

It is achieved by three different optimizations:

  * Carefully partition the model and embrace different types of parallelism; group and route all tokens with the same critical data path together to reduce data access per device and achieve maximum aggregate bandwidth.

  * Optimize communication scheduling with parallelism coordination to effectively group and route tokens.

  * Optimize transformer and MoE related kernels to improve per-device performance.

These three optimizations are quite technical, I suggest taking a look at [1] if you want to dive deeper into the details.

* * *

# Closing thoughts

Are you planning on using this technique in production yourself? If yes, the library provided by the researchers of this paper will be quite handy: [link to the library](https://github.com/microsoft/DeepSpeed).

Enjoy some inference speed ups!

* * *

# References

  1. [DeepSpeed-MoE: Advancing Mixture-of-Experts Inference and Training to Power Next-Generation AI Scale](https://arxiv.org/abs/2201.05596)
