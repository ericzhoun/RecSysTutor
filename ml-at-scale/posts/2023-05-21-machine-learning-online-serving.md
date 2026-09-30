---
title: "#21 Online serving"
date: 2023-05-21
author: Ludovico Bessi
collection: Machine Learning at Scale
topics: [serving]
paywalled: false
words: 766
---

# #21 Online serving

# Table of contents

  1. **Introduction.**

  2. **Online predictions with batch features.**

  3. **Online predictions with online features: real time vs near real time.**

  4. **When does it make sense to move things online?**

# Introduction

As a follow up of my past article related to Batch Serving:

[Machine learning at scaleLudovico Bessi](machinelearningatscale.com/machine-learning-batch-serving/)

Today I will be talking about Online serving.

What are the key advantages of moving your Machine Learning models online? What are the hardest challenges? When does it actually make sense to move things online?

This article took some ideas from [1], which I encourage you to read as well.

* * *

# Online predictions with batch features.

In Batch Serving, features are computed offline as well as model predictions.

It makes sense then to first and move something online: let's start with doing predictions online.

Suppose a new visitor comes to your website.

Instead of showing them generic items, your model computes a prediction using offline features, using actions the user is doing online.

Suppose they looked at some items, then you can fetch the embeddings of those items (the batch features) and then compute new items to recommend.

You are still using offline pre-computed embeddings, but they are now based on actions of the user that happened at request time.

There are a few things that need to be taken care of.

The models now make session-based predictions: your models probably need to be re-trained or you need new models.

But that is not the hardest part in my opinion. I believe that integrating session data in the actual prediction service is the hard bit!

You will need to have both:

  * Streaming transport to actually get the streaming data of the user

  * Streaming computing engine to aggregate the streaming data in signals to be used in the actual models.

Plus, now you actually need to care about inference latency!

Your models cannot take O(seconds) to make a prediction, otherwise the user will probably just walk from your website!

There is one thing that is now easier and better: prediction storage. With batch serving, features were computed offline for **all** relevant users, because you never know if a dormant user will log in. However here, you predict something only when you absolutely know you need it.

* * *

# Online predictions with online features: Real-time vs near Real- time.

At this stage, the goal is to also move the batch features online, let's see two different ways how that is possible.

### Real-time Features

The set-up is pretty easy: as soon as a request comes in, features are computed.

Features' freshness is O(ms) as the data is there in the session.

However, this poses a high risk on the latency of the overall system. For example: traffic spikes can influence the latency.

It is important to make sure latency is acceptable to the end user and to load test the features properly.

* * *

### Near Real-time Features.

Near Real-Time Features are an incredibly cool idea.

They are pre computed just like batch features and latest values are retrived and used. Given they are asynch from prediction, the latency does not interfere to user-facing latency.

The difference with batch features is that they are pre computed much more frequently: features staleness is now in the order of O(seconds).

They still rely on the streaming infrastructure and session-based architecture described above, without putting at risk latency!

* * *

# When does it make sense to move things online?

Moving predictions and/or features online is one part of the puzzle only.

To have an proper online ML workflow, there are a few components needed:

  * Streaming infrastructure.

  * An online feature store to ensure features consistency.

  * A model store to ensure model performance is always at the highest thanks to continuous model training and pushing.

  * A development environment where Data scientists can use streaming features.

This seems like a lot, because it is a lot! However, do keep in mind that you don't have to build everything listed above, as some things are optional depending on the requirements of your system.

The guiding question in my opinion is:

> How much improvement do I need to justify building the minimum required systems to get there?

Answering that question will give you a "metric" threshold above which you know that it makes sense to move online. If you are not there yet, you can always revise in a few months time if things have changed.

* * *

# References

  1. [Real-time machine learning: challenges and solutions.](https://huyenchip.com/2022/01/02/real-time-machine-learning-challenges-and-solutions.html#session-based-prediction)
