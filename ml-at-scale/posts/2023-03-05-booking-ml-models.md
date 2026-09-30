---
title: "#10 150 Successful Machine Learning Models: Lessons Learned at Booking.com"
date: 2023-03-05
author: Ludovico Bessi
collection: Machine Learning at Scale
topics: [ml-theory]
paywalled: false
words: 1369
---

# #10 150 Successful Machine Learning Models: Lessons Learned at Booking.com

[![#10 150 Successful Machine Learning Models: Lessons Learned at Booking.com](../assets/3dbfa1563696a5cd.jpg)](../assets/3dbfa1563696a5cd.jpg)

# Table of contents

  1. **Introduction**

  2. **Lesson 1: Machine learning as a Swiss knife: the two extremes.**

  3. **Lesson 2: Model performance is not strongly correlated with business performance**

  4. **Lesson 3: Look for a problem, not for a solution**

  5. **Lesson 4: Latency matters**

  6. **Lesson 5: Monitoring for fast iteration**

  7. **Lesson 6: Experiment design sophistication has good ROI**

  8. **Closing thoughts**

# Introduction

This week, I came across a paper [1] from Data scientists at Booking, describing their learnings on how to effectively deploy Machine learning models to serve business needs.

Let's dive right in!

* * *

# Lesson 1: Machine learning as a Swiss knife: the two extremes.

The first lesson is about applying machine learning models to two extremely different type of product solutions.

The classical one: creating an ML model for a _specific_ business solution, such as:

  * Optimize the specific size of an UI element to increase conversion.

  * Provide recommendations at a specific step of the funnel experience.

These modelling approaches provide direct business value: they are close to the bottom line. However, the breadth of the application is limited to a single use case by design.

On the other end of the spectrum, there is a different application: creating ML models for _semantic_ understanding.

The idea here is to create an embedding to be used by other product team as feature to their own models.

While It's harder to provide supporting business metrics to invest in embedding development, an investment like this allows horizontal scaling of ML applications across the whole company.

A word of caution: using an ML model output as input for other ML models creates a tight coupling between two systems, which can lead to ML tech debt.

What happens if the embedding is retrained? A metric increase for the team owning the embedding can lead to a metric decrease for the team that uses that output. This can be solved by model versioning, which adds a little overhead.

I believe the trade-off here works in favour of the embedding retraining, especially because such models are quite robust: a model that understands "images" does not need much retraining.

I talked extensively about Machine learning tech debt in one of my previous articles:

## [#3 Technical debt in Machine learning systems has very high interest rate.](https://www.machinelearningatscale.com/p/ml-tech-debt)

Ludovico Bessi

·

January 15, 2023

[![#3 Technical debt in Machine learning systems has very high interest rate.](../assets/51aff853b14bbec4.jpg)](https://www.machinelearningatscale.com/p/ml-tech-debt)

Introduction The harsh reality of new graduates joining a Machine learning team is that the "model development" part of the job dwarfs in comparison to everything else the team needs to support.

[Read full story](https://www.machinelearningatscale.com/p/ml-tech-debt)

* * *

# Lesson 2: Model performance is not strongly correlated with business performance.

I admit, the title is a little read-baity. (Is that a word? It is now!)

At this point, It is common knowledge that a good offline model does not guarantee good online metrics.

But this section is rather about business metrics for online model deployments.

There are many nice ideas in this section:

❗

Value Performance Saturation

At a certain point, the "business value vs model performance" curve saturates: a gain in model performance does not lead to a gain in business value that makes it worth the effort.

And that is **OK**! It just means that the shift is now to maintain the ML model, while focusing the R&D efforts on other problems.

❗

Uncanny Valley effect

As ML models become better and better, they can become unsettling for some users. It certainly spooks me at how good recommendations are. Sometimes good enough is just perfect!

❗

Proxy Over-optimization

When training a model, the metric to be optimized is usually a proxy metric.

For example, even if the final goal is to increase conversion rate, it is much easier to optimize for Click through rate. As models get better, they might end up "just driving clicks", without conversion rate increase.

Following this ads example, advertisers would end up paying a lot without getting much value out of it, damaging the bottom line.

* * *

# Lesson 3: Look for a problem, not for a solution

The problem construction process takes as input the business case and outputs different possible modelling approaches.

It is useful to keep the following in mind:

  * _Learning difficulty_ : in the real world, target variables are not given: they are constructed. Look for a setup that makes simple models work significantly better than random/constant models.

  * _Data to concept match_ : setup the model such that the data is as close as possible to the concept you want to model.

  * _Selection bias_ : construct ground truth data / labels carefully to avoid skewing the model.

* * *

# Lesson 4: Latency matters

When evaluating a model, there are tradeoffs to be made between performance and latency: the paper shows that a 30% increase in latency leads to 0.5% conversion rate loss.

Possible way to minimize latency are:

  * Scaling models horizontally as much as possible to deal with large traffic.

  * Using models that are as sparse as possible.

  * Caching features to avoid recomputations.

* * *

# Lesson 5: Monitoring for fast iteration with incomplete data

Monitoring the quality of a model in production is not as easy as it sounds.

Most of the times, feedback is:

  * _Incomplete:_ true labels cannot always be observed. Example: adversarial spaces.

  * _Delayed:_ true labels are sometimes observed many days after. Example: predicting if a user reviews a given hotel or not.

Still, we want to evaluate models online as fast as possible. It is clear that label dependent metrics are not always the best solutions.

A quick and easy way is to plot the predictions' distribution. This can be a simple heuristic to immediately tell if a model is breaking bad.

For example, if a model cannot assign different scores to different classes, it does not have much predictive power.

* * *

# Lesson 6: Experiment design sophistication has good ROI

Booking is well known for their experimental architecture. See: [2] and [3].

In the paper, they show how to isolate the causal effect of a specific modelling choice to investigate business metrics.

❗

Selective triggering

In a standard experiment, the population is divided into control and treatment groups, all subjects in the treatment group are exposed to the change, and all subjects in the control group are exposed to no change.

However, in many cases, not all subjects are eligible to be triggered, and the eligibility criteria are unknown at assignment time.

To deal with this situation, only the triggered subjects in both groups are analyzed.

This is quite a simple reasoning but often overlooked!

❗

Model-output dependent triggering

It is often the case that the triggering criteria depends on the model output. (Unknown when you set up the experiment!)

In such cases, some users are not exposed to any treatment: the observed effect is diluted.

The setup for model output dependent triggering requires an experiment with 3 groups:

  1. Control group C is exposed to no change at all.

  2. Treatment group T1 invokes the model and check the triggering criteria, only triggered users are exposes to the change.

  3. Treatment group T2 invokes the model, but users are not exposed to any change regardless of the output.

Then, statistical analysis is conducted only on triggered subjects from both T1 and T2.

❗

Comparing models

When comparing treatments based on models which improve on one another, there are often high correlations.

In this case, the triggering condition is "models disagree".

Again, three groups are needed:

  1. Control group C is using the baseline/current model.

  2. Treatment group T1 invokes model A.

  3. Treatment group T2 invokes model B.

* * *

# Closing thoughts

This week article is a bit on the lengthier side. Let me know if you like this format or prefer shorter emails :)!

Also, would you like to see more technical content?

Feel free to reach out directly to me on [LinkedIn](https://www.linkedin.com/in/ludovico-bessi/) with your feedback!

* * *

# References

  1. [150 Successful Machine Learning Models: 6 Lessons Learned at Booking.com](https://blog.kevinhu.me/2021/04/25/25-Paper-Reading-Booking.com-Experiences/bernardi2019.pdf)

  2. [Democratizing online controlled experiments at Booking.com](https://arxiv.org/pdf/1710.08217.pdf)

  3. [Democratizing online controlled experiment at Booking.com [video]](https://www.youtube.com/watch?v=r57gd8CRxDA&ab_channel=CXL)
