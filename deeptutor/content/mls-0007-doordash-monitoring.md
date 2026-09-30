# #7 How DoorDash maintains models accuracy through a monitoring system.

*Machine Learning at Scale collection — Ludovico Bessi, 2023-02-12 · topic: mlops*

[](../assets/88d3b1404a4b167c.jpg)

# Introduction

The main topic of this article is: "How can we fight model drift?"

As soon as a model is trained, validated and deployed to production, it begins degrading.

Inputs and outputs need to be closely monitored to diagnose and better yet prevent model drift.

DoorDash approaches model observability as an out-of-the-box monitoring solution that can be applied to all available ML models.

* * *

# Investing in model observability makes sense!

The typical ML development workflow involves feature extraction, model training and model deployment.

... but the fun begins after the model is deployed!

Model predictions tend to deviate from the expected distribution over time, as the data pattern changes.

The usual solution is to invest in a platform that lets you periodically retrain and redeploy current serving models to follow the drift.

However, sometimes you need to keep moving fast and there is not enough buy-in to invest in such a system starting out.

The cheapest alternative is then to invest in a solid monitoring system: if you can't follow the drift, at least you should know when a model is starting to break bad and apply manual remediation.

* * *

# The non-scalable baseline

Logs. Everyone has logs for everything. If a model starts acting up, data scientists investigate logs and understand why a model made a certain prediction given the input.

A quick fix is to add safeguards or manual checks based on the outcome of the investigation.

This might works, if you have few models. But it does not scale as an organization grows.

Moreover, the big picture of _why_ a given model is drifting is rarely uncovered.

* * *

# The right monitoring approach for the problem

As a general overview, there are two different approaches:

  1. Unit-test approach.

  2. Monitoring approach.

> Unit-test approach

In the Unit-test approach, that training data is assumed to match production data.

ML engineers analyze the data, decide validations and record those validations. These data-driven unit-tests are run on all data coming from new models.

While this is an improvement, scalability is not there yet: as more models come in, more pre-launch analysis needs be done to effectively set rules for   
soon-to-be productionized models.

Plus, assuming that training data follows the same distribution as production data is... _optimistic_ at best.

Using this approach, expectations are _crystallized_ at pre-launch time. Plus, the outcome is a true/false statement.

There is **no** indication as to how much the model is drifting or for how long.

> Monitoring approach

In the monitoring approach, DevOps best practices are used: metrics are generated automatically using Prometheus. Alerts are set to automatically send notifications when traffic is acting up in strange ways.

In this way, there are no set in stone expectations to follow: trends in production data are visible during the analysis in real time.

Using a monitoring solution has also other advantages:

  * Data scientists don't need to write any code, the monitoring solution is provided off the shelf.

  * Data scientist can investigate the data in real time and draw conclusions even if alerts are not firing.

* * *

# Tangible gains!

Real-time monitoring allows data scientists to intervene in a matter of minutes as opposed to weeks. This allows the system to operate on a continuous time scale, catching anomalies that happen over time instead of being in responsive-mode only.

On top of that, the monitoring platform is integrated with the experimentation analysis platform, letting data scientists try out different models on production data to identify gaps or improvements.

What are you waiting for? Start monitoring your ML models now! :)

* * *

# References

  1. Monitoring machine learning model drift.
