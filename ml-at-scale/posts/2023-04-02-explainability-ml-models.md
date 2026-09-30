---
title: "#14 Machine learning models: explainability and interpretability."
date: 2023-04-02
author: Ludovico Bessi
collection: Machine Learning at Scale
topics: [ml-theory]
paywalled: false
words: 1148
---

# #14 Machine learning models: explainability and interpretability.

[![#14 Machine learning models: explainability and interpretability.](../assets/f003121a03ec9377.jpg)](../assets/f003121a03ec9377.jpg)

# Table of contents

  1. **Introduction.**

  2. **Trading off explainability with other metrics.**

  3. **Inherently explainable models.**

  4. **Improving explainability in non-inherently explainable models.**

# Introduction

In this article, I will talk about the need of having explainable and interpretable models.

Explainability and interpretability are often used interchangeably, but I'd like to make a distinction:

  * Explainability: understanding model internals that lead to a give output.

  * Interpretability: understanding the meaning of model outputs.

* * *

# Trading off explainability and interpretability with other metrics.

At first, I wanted to name this section: "Why do you want explainability and interpretability from your ML models?".

However, I realized that would be a rhetoric question. In general, everyone wants to have more data about models that are running in production, not less.

However, it is not that easy to make it happen.

### Trading explainability for precision/recall.

Not all models are inherently explainable and if they are, maybe they are not performing as well as non-explainable models.

One way to go about this is ranking models not only through usual key metrics such as latency, precision, recall or memory overhead; but also alongside another dimension: explainability score.

In this way, you might end up picking a model that is slightly underperforming, but that is just explainable enough for your use cases.

Another way is to use model agnostic techniques that help you evaluate a non explainable model.

### Trading explainability for privacy.

This issue is slightly more complex. Let's assume that for explainability purposes the output of your ML model is not just a final score or class, but it also contains the logits of the model. In this way, you give additional insights to the end user on how the prediction happened.

_If_ that is the case, a determined attacker could setup a loss function based on the difference between their current model and the output of your model. That means that they could create a surrogate of your ML model!

### Making explainability high priority.

As an organization, there are thousands of different efforts. Focusing on improving explainability means not focusing on something else.

What I want to point out here is that having explainable ML models in your suite of models can't be _just_ a feeling-good effort, you want to have strong reasons for supporting them as they introduce dependencies/restrictions.

If your model is used only by handful of teams internally, I'd argue there are probably more important issues to tackle. In this case, a given output can be dissected manually if the need arises without building a whole system around explainable models.

However, if the model outputs are embedding used across the whole company or directly affect the end user, then It could make a lot of sense to be able to instantly understand why something was predicted.

* * *

# Inherently explainable models

Some models are inherently explainable, which is great!

As a non-exhaustive list: Linear regression, Logistic regression, Generalized linear model, Generalized additive models, Decision trees.

Linear models describe their outputs as a weighted sum of the input variables, that makes them both interpretable and explainable.

Decision trees are trainable models that let you immediately understand the flow of a prediction, by branching out depending on particular values of features

However, for a lot of domains, you may want a model that predicts the patterns in the data well regardless of how easy to understand its parameters are.

* * *

# Improving explainability in non-inherently explainable models

It could be the case that the models mentioned above are really not working for your domain. Then, the next step is to incorporate explainable techniques for non explainable models.

I will briefly describe a few options below.

### Local interpretable model-agnostic explanation (LIME).

Local interpretability means focusing on making sense of individual predictions. The idea is to replace the complex model with a **locally** interpretable surrogate model:

  1. Select a few instances of the models you want to interpret

  2. Create a surrogate model that reproduces the behavior of the model you want to interpret

  3. Create random perturbations of the input data and see how the surrogate model classifies the new data.

  4. Use the classification boundaries to explain the more complex model.

### Shapley additive explanations (SHAP)

Shapley additive explanations (SHAP) is an attribution method that assigns predictions to individual features.

Let's assume you want to know how a given feature "**A** " is important to to your output.

The idea is to first calculate the average model prediction.

Then, create a set of all possible feature combinations. Calculate for each set:

  1. The difference between the model's prediction without "**A** " and the average prediction

  2. The difference between the model's prediction with "**A** " and the average prediction

The SHAP value for feature "**A** " is the average marginal contribution provided to the model across all possible feature combinations.

One problem with SHAP is the computational complexity required. Given _N_ features, there are 2**N possible combinations. That's a lot!

There are some methods to approximate SHAP. If you want to know more, [3] is a great read on the topic.

### Permutation feature importance

Permutation feature importance refers to permuting parts of the input features to see which ones cause the biggest change to the output predictions when modified. Modifying a feature can mean either totally removing it or randomly change its value.

This technique can be applied to every source of data.

### Global surrogate models

This technique involves taking a model and creating another (global model) that behaves extremely similarly. The idea is that you can take a model that’s otherwise a black box, and create an intrinsically interpretable model that behaves almost exactly like it (this is the “surrogate” in this case).

A common loss function to train a model to be "similar" to another one is KL divergence.

The advantage of this approach is that one can make sense of the high-level behaviours of otherwise non-explainable models.

However, all the interpretations are related to the surrogate model, not the original one!

### Saliency mapping

A _saliency map_ is an image that highlights the region on which a network’s activations or attention focuses the most.

Since saliency mapping allows you to look at what would contribute to different decisions, this can serve as a way to provide counterfactual evidence.

For example, in a binary text sentiment classification task, one could look at embeddings that would contribute to either a positive or negative sentiment.

It is often a very visual method, which I like a lot. However, you don't know **why** the model thinks that is an important part of the embedding, you only know **that** the model thinks it is important.

# References

  1. [Practicing Trustworthy Machine Learning: Consistent, Transparent, and Fair AI Pipelines.](https://www.oreilly.com/library/view/practicing-trustworthy-machine/9781098120269/)

  2. [Scikit-learn: Decision trees.](https://scikit-learn.org/stable/modules/tree.html)

  3. ["Interpretable Machine learning" by Christoph Molnar](https://christophm.github.io/interpretable-ml-book/).
