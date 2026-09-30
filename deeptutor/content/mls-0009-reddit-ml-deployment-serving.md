# #9 Reddit's ML Model Deployment and Serving Architecture

*Machine Learning at Scale collection — Ludovico Bessi, 2023-02-26 · topic: serving*

[](../assets/6e4a7c3b3cdaf910.jpg)

# Table of contents

  1. **Introduction**

  2. **The legacy platform: one system on top of the other**

  3. **The new platform: scalable and reliable**

  4. **Closing thoughts**

# Introduction

Today's topic will deal with improving Reddit's ML platform, from a non-scalable, failure-prone system to a reliable and highly performant one.

This system follows a trend already observed in previous articles: more and more tech companies are building their own ML infrastructure open to product engineers across the company.

* * *

# The legacy platform: one system on top of the other

The first system is called Minsky, which serves data from various sources such as Cassandra or in-process caches.

Reddit clients use this data to improve their tools. An ML serving platform called Gazette is built on top of Minsky, and four instances of the two systems are deployed across a cluster of EC2.

A load balancer distributes requests from clients across the four instances, but there is no virtualization between instances on a single EC2, so all instances share the same CPU and RAM.

ML models are deployed as embedded model classes, which means there is a fairly manual process to contribute a new model.

This process involves changing the binaries. Models are deployed in a monolithic fashion, meaning all models are deployed across all instances of the two systems across all EC2 instances. Features are either passed in the request or fetched from Cassandra.

> Performance

CPU-intensive ML inference endpoints are co-located with intensive I/O data access endpoints to fetch features.

The request volume can degrade the performance of other RPCs due to prolonged wait time for context switching.

Additionally, ML models are deployed across multiple application instances running on the same host with no virtualization between them: they share CPU cores.

Multiple models running on the same hardware contend for these resources, and parallelism can't be fully leveraged.

> Scalability

Because all models are deployed across all instances, the size of models that can be deployed is limited.

All models must fit in RAM, and large instances are needed to deploy large models.

Additionally, some models serve more traffic than others, but these models are not independently scalable since all models are replicated across all instances.

> Developer experience

Since all models are embedded in the application server, all model dependencies are shared.

To leverage new library versions or new frameworks for newer models, backward compatibility for all existing models must be ensured.

> Reliability

Because models are deployed in the same process, an exception in a single model will crash the entire application and can have an impact across all models. This puts additional risk around the deployment of new models

> Observability

Because models are all deployed within the same application, it can sometimes be complex or difficult to understand the "model state" - the state of what is expected to be deployed vs. what has actually been deployed.

* * *

# The new platform

The new ML platform aims to solve the previous pain points.

The RPCs related to ML inference (i.e. Gazette) are separated from Minsky into a different service deployed on Kubernetes.

Each model runs its own process, is provisioned with isolated resources, and is independently scalable. ML inference APIs have been refactored to be decoupled by any client-specific business logic.

> Performance

Now that the two systems have been split, there is no more CPU competition between ML inference and data fetching.

With the distributed model server pools, ML model resources are completely isolated and no longer contend with each other, allowing ML models to fully utilize all of their allocated resources.

> Scalability

Because all models are now deployed as independent deployments on Kubernetes, resources are allocated independently.

Additionally, the model isolation from Kubernetes enables scaling models that receive different amounts of traffic independently and automatically.

> Developer experience

Model deployment is now isolated: deploying multiple models in a single process is no longer required.

> Reliability

Deploying a new model should introduce no marginal risk to the existing set of deployed models: a model is fault tolerant to crashes in other models.

> Observability

Finally, model state is now completely observable through the new system.

The actual deployed model state is more observable as it is no longer internal to a single application but is rather the kubernetes state associated with all current model deployments which is easily viable through kubernetes tooling.

* * *

# Closing thoughts

Reddit is still improving the platform to allow self-service capabilities for:

  * Auto model training

  * Data pipeline

  * Model serving

In the future, I believe that the job of a Machine learning engineer at big tech companies will be divided in two categories:

  1. ML engineer that **develops** the ML platform used by the whole company.

  2. ML engineer on a product team that **operates** the platform and integrates new machine learning tools/models.

In my team at Google I am fortunate to be responsible for a standalone ML platform that directly interfaces with the end user, which is becoming less and less common.

I believe that this shift makes sense, as the majority of ML teams are reinventing the wheel when it comes to model training, serving and deploying.

Still, I am glad to be able to work on an end-to-end system that touches billions of users!

Let me know what you think about this trend and what you'd like to see next!

* * *

# References

  1. Evolving Reddit's Model Deployment and Serving Architecture
