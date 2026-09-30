---
title: "#19 Batch predictions"
date: 2023-05-07
author: Ludovico Bessi
collection: Machine Learning at Scale
topics: [serving]
paywalled: false
words: 506
---

# #19 Batch predictions

[![#19 Batch predictions](../assets/b59050d975e8b466.jpg)](../assets/b59050d975e8b466.jpg)

# Table of contents

  1. **Introduction.**

  2. **Batch prediction in depth.**

  3. **Does it always make sense to try and go online?**

# Introduction

In today's article, I will discuss the ideas behind Batch prediction.

First of all, what do I mean with it?

> Batch prediction = **offline** predictions of ML models computed in batch cached for later use.

I will focus on:

  * Use cases of Batch serving with a common design template that you can use for your own system.

  * When you need to move from batch serving to online and when you should sit tight.

* * *

# Batch serving in depth.

In the last decade, big data processing has been dominated by batch systems like Spark. To leverage the existing technology stack, a company's first step into the Machine learning world is to just use the existing batch system to make predictions.

Let's see an example of a Batch system, taken from the amazing blog post [1] (highly suggested read!)

As a user interacts with the application, predictions are simply looked up.

Models are developed and prototyped offline and evaluated on historical data.

There are some advantages with this:

  1. You don't need to care about online serving

  2. The predictions of your ML models are always one look-up away with no latency.

  3. The workflow makes it super easy to collaborate with Data Scientists in the organization: they are free to play around with offline data and deploy models.

However, there are a few drawbacks:

  1. **Features get stale.**

  2. **Predictions get stale.**

  3. **Continuous training loop is much slower.**

And these are major drawbacks:

> Imagine a user that is looking for a new movie category. If the user comes back online after a few hours and the model has not yet picked up the new taste, there is a high change the user will not stick around.

> Imagine a prediction system that detects abuse on your systems: stale models means bad actors will disrupt more!

* * *

# Does It always make sense to try and go online?

Despite the major drawbacks, I still argue there are cases in your organization where it makes sense to not go online (yet).

For example, if your organization has never used machine learning solutions before, it is much safer to invest in an offline solution that is already leveraging the systems that are in place **now**. If the experiment goes well, then you can always make the case that it would work X% better if features and predictions would not be stale.

Moreover, it could be the case that bringing the features online is too expensive and the % boost makes the project just not worth it. If the features offline, then it actually does not matter if your predictions are online ;).

In the next article, I will cover online predictions and continual learning.

Stay tuned!

* * *

# References

  1. [Real-time machine learning: challenges and solutions.](https://huyenchip.com/2022/01/02/real-time-machine-learning-challenges-and-solutions.html#batch-prediction)

  2. [Machine learning design patterns: Batch serving.](https://www.oreilly.com/library/view/machine-learning-design/9781098115777/)
