---
title: "44. Testing Machine Learning "
subtitle: "How to actually test your machine learning models are doing what you expect them to do!?"
date: 2024-07-07
author: Ludovico Bessi
collection: Machine Learning at Scale
topics: [ml-theory]
paywalled: false
words: 694
---

# 44. Testing Machine Learning 

*How to actually test your machine learning models are doing what you expect them to do!?*

*How to actually test your machine learning models are doing what you expect them to do!?*

[![](../assets/20dcaeaff28e4b66.png)](../assets/20dcaeaff28e4b66.png)

# Introduction

At this point, we all know about patterns for testing software: unit tests, end to end tests, roll out changes in different environment, etc.

But… how to test a “Machine Learning code”? The setup is wildly different:

  1. In standard software, you have data and logic and you check you get the desired behavior.

  2. In Machine learning, as the picture above shows, you have data and desired behaviour and check that the logic you expect is there.

In today’s article, we are going to learn how test your ML data flow from pretraining to model evaluation. Let’s get started!

* * *

# Techniques

## Pre-training tests

**Pre-train** **tests** allow you to identify some bugs early on before spending $$$ on those GPU cycles ;).

Many tests can be run without needing trained parameters:

  * Check the shape of your model output and ensure it aligns with the labels in your dataset

  * Check the output ranges and ensure it aligns with the expectations

  * Make sure a single gradient step on a batch of data yields a decrease in loss

  * Make assertions on your dataset

  * Check for label leakage between your training and validation datasets

  * Loss function: calculate by hand a loss and create a unit test

  * Check that trainer logs steps

  * Test that the model can overfit on a single batch of data

  * Sample independence: batch training assumes that the model can process each sample iid! That is, samples in the batch don’t influence each other in the training step. This is very brittle, as you can easily make a mistake with a misplaced reshape / aggregation. How to test: forward pass and backward pass, but before averaging the loss over the batch multiply one loss by 0. This will result in a gradient of 0 given the model upholds sample independence, then the test should just assert that the samples gradient is 0.

## Post-training tests

How to ensure that the learned logic makes sense?

After training a model, you will typically produce an evaluation report that includes:

  * Performance of an established metric on a validation dataset

  * Plots such as precision recall curves

  * Operational statistics such as inference speed

  * Examples were the model was most confidently incorrect

You should also follow classical conventions such as:

  * Save all of the hyper-params used to train the model

  * Only promote models which offer an improvement over the existing baseline

Post training tests should interrogate the logic learned during training. 

**Invariance tests** allow to describe set of perturbations to make to the input without affecting the model’s output. Then, you can check for consistency in the model predictions.

**Minimum functionality tests** aim to quantify model performance for specific cases found in the data, which allows you to identify critical scenarios where prediction errors lead to catastrophic consequences.

## Model testing vs Model evaluation

In a nutshell:

  * **Model evaluation** covers metrics and plots which summarize performance on a validation or test dataset.

  * **Model testing** involves explicit checks for behaviors that we expect our model to follow.

Both of these perspectives are instrumental in building high-quality models.

In practice, most people are doing a combination of the two where evaluation metrics are calculated automatically and some level of model "testing" is done manually through error analysis (i.e. classifying failure modes).

However, this does not help uncover possible regression on critical subset of data of high importance.

* * *

* * *

# Conclusions

I hope you will employ the techniques showed above to improve the health of your systems. I believe that setting up an evaluation/testing framework for your model can pay back dividends when you find out *that* training bug that very subtly messes with your model.

Happy machine learning testing!

Ludo

* * *

# References

  1. [Effective testing for machine learning systems](https://www.jeremyjordan.me/testing-ml/)

  2. [How to test machine learning code and systems](https://eugeneyan.com/writing/testing-ml/)

  3. [Beyond Accuracy: Behavioral Testing of NLP Models with CheckList](https://homes.cs.washington.edu/~marcotcr/acl20_checklist.pdf?ref=jeremyjordan.me)

  4. [How to trust your deep learning code](https://krokotsch.eu/posts/deep-learning-unit-tests/)
