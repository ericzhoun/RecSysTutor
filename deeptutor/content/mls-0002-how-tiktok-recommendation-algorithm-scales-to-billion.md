# #2 How TikTok Real Time Recommendation algorithm scales to billions?

*Machine Learning at Scale collection — Ludovico Bessi, 2023-01-08 · topic: recsys*

[](../assets/ac34f1a84638b9f9.jpg)

## Introduction

In today's article, I am going to dive deep into the paper [1] published by TikTok engineers describing how TikTok real time recommendation system is built.

The paper has many topics that are worth learning in more detail, but I am going to focus on:

  * How the design supports switching between Online training and Batch training and why it is useful.

  * How to tradeoff system reliability for real-time learning.

Let's get started!

* * *

## Challenges

Recommendation systems are made up of dense and sparse parameters. Dense parameters are the actual weights of the deep neural network, while sparse parameters correspond to the embedding tables that map to sparse features.

In layman terms: recommendation systems need to keep track of millions of items that can be shown to a user. However, a given user normally interacts with only a few.

Moreover, serving models need to be updated following new user feedback as close to real-time as possible to reflect the latest interest of the user.

The challenge is to create a system that:

  * Supports real time updates of the models that are TBs in size.

  * Remains fault tolerant by not overburdening the server.

* * *

## Worker-ParameterServer Architecture

[](../assets/0f300403bb820da7.png)

  * Workers are responsible for computations as defined by the TensorFlow graph.

  * ParameterServers are responsible for storing dense and sparse parameters and updating them according to gradients computed by workers.

This distributed training architecture has many advantages:

  * Efficient fault tolerance: even if some servers are down, the training does not suffer from it.

  * Elasticity for adding resources: horizontal scaling is easy.

  * Flexible consistency: it is possible to decided between algorithmic convergence and system performance depending on one's need.

* * *

## Streaming engine supporting real time training and batch training

[](../assets/bf3172f647db4776.png)

> Batch training stage

In each training step, a worker:

  1. Reads a batch of training data.

  2. Requests current parameters from ParameterServer.

  3. Computes new parameters.

  4. Pushes the new parameters to the ParameterServer

> Online training stage

After a model is deployed to online serving, training does not stop. A training worker consumes **real-time** data and updates the Training ParameterServer, which periodically synchronizes its parameters to the Serving ParameterServer.

This enables the model to interactively adapt according to user's feedback in real time.

* * *

## Fault tolerance

This system is designed with the ability to recover a ParameterServer in case it fails.

The state of a model is snapshotted periodically. Snapshot frequency is usually decided by analyzing:

  1. Model degradation.

  2. Computation overhead.

Given that the models are in the size of TBs, models are snapshotted daily with tolerable performance degradation.

* * *

## Trading-off Reliability For Realtime

> The effect of parameter synchronization frequency

Models on the online Serving ParameterServer must not stop serving while being updated. However, models are TBs in size, and a model update on the fly poses a huge pressure on the bandwidth and memory of the ParameterServer.

Crucially, sparse parameters dominate the size of recommendation models.

On top of that, on a minute-level time interval, only a small subset of embeddings is updated.

For these reasons, only a specific **subset** of **sparse** parameters is pushed from the Training ParameterServer to the Serving ParameterServer. This small pack of updated parameters does not cause a sharp memory spike during the synchronization.

On the other hand, dense parameters change much slower than sparse embeddings: in momentum-based optimizers the accumulation of momentum of dense variables is magnified by the size of the training data.

For this reason, dense parameters being served are _relatively_ stale: they only get updated once a day at non-peak times.

> The effect of ParameterServer reliability

The failure rate of ParameterServer machines is 0.01%/day. Supposing model's parameters are sharded across _1000_ ParameterServers and they take daily snapshots. One of them will go down every 10 days and all parameters updates are lost for that one day. Assuming 15 Million daily average users (DAU), this means that 15000 users' feedback is lost every 10 days.

This is not the end of the world for the overall system:

  * For sparse features, 0.01% DAU feedback is lost every 10 days.

  * For dense features, the update is daily and only 1 out of 1000 ParameterServers are lost every 10 days.

* * *

## References

  1. Monolith: Real Time Recommendation System With Collisionless Embedding Table.

## Additional readings on the topic

  1. [[Paper review] Monolith: TikTok's Real-time Recommender System.](https://haneulkim.medium.com/paper-review-monolith-tiktoks-real-time-recommender-system-72b90bece653)

  2. [[Summary] Monolith: Real-Time RecSys With Collisionless Embeddings.](https://shivamrana.me/2022/10/tiktok-monolith-review/)

  3. Pytorch parameter server tutorial

  4. TensorFlow parameter server tutorial
