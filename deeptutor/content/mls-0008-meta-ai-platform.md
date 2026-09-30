# #8 Meta's AI platform for engineers across the company

*Machine Learning at Scale collection — Ludovico Bessi, 2023-02-19 · topic: mlops*

[](../assets/47542b159bf5b161.jpg)

# Table of contents

  1. **Introduction**

  2. **Making smart strategies available widely in real-time**

  3. **The Looper platform**

  4. **Adoption and impact**

# Introduction

In recent years, there has been a big push by tech companies to scale in-house AI platforms to let software engineers from different teams incorporate machine learning models without necessarily understanding all the details.

This approach scales: a core ML team is tasked to engineer the training, serving and monitoring platform, while the whole company can use it as simply as an API call.

Today's article dives deep into what engineers at Meta did to scale AI capabilities to the whole organization.

* * *

# Making smart strategies available widely in real-time

[](../assets/397c5de398db4fc6.png)

The main idea behind the product is:

💡

Enabling services customization "out of the box" without requiring complex or specialized code

The platform supports a variety of machine learning tasks:

  * Classification

  * Estimation

  * Sequence prediction

  * Ranking

  * Planning

It makes uses of AutoML to automatically select models and hyper-parameters to balance model quality, size and inference time.

It supports real time inference as opposed to offline batch inference.

And the final kicker: it is a declarative system! A product engineer just needs to declare the functionality they want in a blue print, and Looper does its magic.

The hard requirement: models should be lightweight. They can be retrained and deployed quickly on shared infrastructure. No billions parameters models allowed!

Let's break down the design.

* * *

# The Looper platform for training and deploying smart strategies

There is also the possibility of defining different blueprints. This can be useful to A/B test different business metrics and the impact on the bottom line.

After that, Looper magic starts.

Looper automatically selects model types and parameters while being trained on live data. Once the metric to be optimised looks satisfying, the model is shadow deployed. Predictions are logged and analyzed by the monitoring platform, to help detect unforeseen side effects.

Once a model is deployed, product engineers can specify what to monitor and decide on the model retraining schedule.

I am personally curious how the Feature Store works. Do product team need to push features to it periodically and then use Looper, or is it some aggregated data-slice collected at the company-level?   
If it's the latter, I'd be really impressed! Unfortunately, I could not find much information on it.

While this may seem a "simple" system operationally, you will be surprised to discover how many predictions are enabled every second.

* * *

# Adoption and impact

The platform facilitates embedding AI-powered strategies into software systems, was the effort a net-gain?

The system is currently used by more than 90 product teams and allows **4 million** predictions per second.

More interestingly: only 15% of teams using the Looper platform include AI engineers.

I believe that's the biggest win: letting the whole company capitalize on AI models effortlessly, without having strong hands-on knowledge.

I predict that machine learning systems will become a commoditized product inside large companies: a few set of ML engineers serving Machine Learning systems for the whole company.

Let me know what you think about this trend!

* * *

# References

  1. Inside Meta's AI optimization platform for engineers across the company.
