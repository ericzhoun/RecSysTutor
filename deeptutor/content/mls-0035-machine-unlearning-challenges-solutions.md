# #35 Machine UN-learning

*Machine Learning at Scale collection — Ludovico Bessi, 2023-08-27 · topic: ml-theory*

[](../assets/5723553ae5e2b5f2.jpg)

# Table of contents

  1. **Introduction.**

  2. **Machine UN-learning.**

  3. **Closing thoughts.**

# Introduction

Google has recently introduced the "Machine Unlearning Challenge". I find it one of the coolest challenges as of late.

Informally, unlearning refers to removing the influence of a subset of the training set from the weights of a trained model.

But how to go about that? In this article, I discuss the current state of the art following [1].

Let's go!

* * *

# Machine UN-learning

**What are the main challenges?**

  * Data Dependencies: ML models do not simply analyze data points in isolation. Instead, they extract complex statistical patterns and dependencies between data points. Removing an individual point can disrupt the learned patterns and dependencies, leading to a significant decrease in performance.

  * Model Complexity: Large machine learning models such as deep neural networks can have millions of parameters their intricate architectures and nonlinear interactions between components make it hard to interpret the model and locate the specific parameters most relevant to a given data point.

  * Privacy Leaks: The unlearning process itself can leak information in multiple ways. Statistics such as the time taken to remove a point can reveal information about it! Changes in accuracy and outputs can also allow adversaries to infer removed data characteristics.

  * Dynamic Environments: Tracing each data point’s influence becomes increasingly difficult as the dataset changes dynamically. Unlearning can also introduce delays that impede prompt model updates needed for low latency predictions.

**Exact unlearning**

Exact unlearning aims to completely remove the influence of specific data points from the model through algorithmic-level retraining. The advantage is the model will behave as if the unlearned data had never been seen.

While providing strong guarantees of removal, exact unlearning usually demands extensive computational resources and is primarily suitable for simpler models.

Sharding, Isolation, Slicing, and Aggregation (SISA) is a notable method.

The key idea of SISA is to divide the training data into multiple disjoint shards, with each shard for training an independent sub-model. The influence of a data point is isolated within the sub-model trained on its shard. When removing a point, only affected sub-models need to be retrained.

Most notably, it is model independent.

**Approximate unlearning**

Approximate unlearning focuses on efficiently minimizing the influence of target data points through limited parameter-level updates to the model. While not removing influence entirely, approximate unlearning significantly reduces computational and time costs.

It enables practical unlearning applications even for large-scale and complex machine learning models, where exact retraining is infeasible.

Approximate unlearning is a process that aims to minimize the influence of unlearned data to an acceptable level rather than completely removing it. It involves the following key steps:

  * Computation of Influence: Calculate the influence of the data points that need to be unlearned on the original model. This involves determining how these data points affect the model’s predictions.

  * Adjustment of Model Parameters: Modify the model parameters to reverse the influence of the data being removed. This adjustment typically involves methods such as reweighting or recalculating optimal parameters and modifying the model so that it behaves as if it was trained on the dataset without the unlearned data points.

  * Addition of Noise: Carefully calibrated noise is added to prevent the removed data from being inferred from the updated model. This step ensures the confidentiality of the training dataset.

  * Validation of Updated Model: Evaluate the performance of the updated model to ensure its effectiveness. This validation step may involve cross-validation or testing on a hold-out set to assess the model’s accuracy and generalization.

If you are interested in specific methods. [1] is a really nice read to dive into the nitty-gritty details.

**Proof of unlearning?**

Recent work demonstrates that unlearning is best defined at the algorithmic level rather than by reasoning about model parameters.

> Model parameters can be identical even when trained with or without certain data points.

This means that inspecting parameters alone cannot prove whether unlearning occurred.

Promising directions include succinct zero-knowledge proofs to prove unlearning algorithms were properly executed without relying on indirect model observations.

* * *

# Closing thoughts

Let me know if you use any of these ideas in the challenge yourself! :)

* * *

# References

  1. Machine Unlearning: Solutions and Challenges
