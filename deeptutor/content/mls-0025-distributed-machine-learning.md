# #25 Genuinely Distributed Byzantine Machine Learning.

*Machine Learning at Scale collection — Ludovico Bessi, 2023-06-18 · topic: ml-theory*

[](../assets/585559e32ec2ba4d.jpg)

# Table of contents

  1. **Introduction.**

  2. **The challenges of Machine Learning Distributed Training.**

  3. **The ByzSGD algorithm.**

  4. **Closing thoughts.**

# Introduction

In one of my previous articles, I discussed distributed Machine Learning training frameworks:

## #22 Machine Learning Distributed Training.

Ludovico Bessi

·

May 28, 2023

[](https://www.machinelearningatscale.com/p/machine-learning-distributed-training)

Table of contents Introduction. Training an ML model as just another computational challenge: scaling up vs scaling out. Topologies. Communication strategies. Closing thoughts. Introduction In today’s article I am going to discuss how distributed Machine learning training works.

Read full story

Today, I will dive a bit deeper into it by discussing what happens in the situation where components of a system fail and there is imperfect information on their failures. This situation is called "Byzantine failure".

* * *

# The challenges of Machine Learning Distributed Training

**Distributed Machine Learning is fragile**

A common way to distribute the learning task is through the now classical _parameter server_ architecture. A central server holds the model parameters whereas a set of workers perform the backpropagation computation, typically following the standard optimization algorithm: stochastic gradient descent (SGD) , on their local data, using the latest model they pull from the server.

The server in turn gathers the updates from the workers, in the form of gradients, and aggregates them. The scheme is, very fragile because aggregation does not tolerate a single corrupted input, while the multiplicity of machines increases the probability of a misbehavior somewhere in the network.

**Byzantine-resilient Distributed Machine Learning**

What happens if both workers **and** parameter servers cannot be trusted? Can the optimization still converge?

There is one key insight for the distributed ML training:

  * Total ordering of updates is not required in this context: only final convergence is needed.

For this this reason, it can be assumed that parameters could be mildly diverging to present new ways to contract them in distributed ways.

* * *

# The ByzSGD algorithm

BByzSGD tolerates 1/3 Byzantine servers and 1/3 Byzantine workers by employing a Scatterer/Gather communication scheme, that bounds the maximum drift between models on correct servers.

In the scatter phase, servers work independently and their views of the model could drift away from each other.

In the gather phase, correct servers communicate and apply collectively a Distributed Median-based Contraction (DMC) module. This module is crucial because It brings the diverging parameter vectors back closer to each other, despite each parameter server being only able to gather a fraction of the parameter vectors.

**Distributed Median-based Contraction (DMC)**

The goal of (DMC) is to decrease the expected maximum distance between any two honest parameter vectors. A particular distributed median algorithm is developed to make sure the contraction effect is in place, despite the Byzantines’ attacks.

**Minimum-Diameter averaging (MDA)**

To tolerate Byzantine workers, a statistically-robust Gradient Aggregation is picked: Minimum-Diameter averaging.

**ByzSGD**

ByzSGD operates iteratively in two phases: scatter and gather.

One gather phase is entered every _T_ steps.

As an initialization step, correct servers initialize the model with the same random values, i.e., using the same seed.

Moreover, the servers compute the value of _T_. Each subsequent step _t_ work as follows.

The algorithm starts with the scatter phase, which includes doing a few learning steps. In each step, each server broadcasts its current parameter vector to every worker. Each worker aggregates with coordinate-wise Median and computes and estimate of the gradient at the aggregated parameter vector. Then, each worker broadcasts its computed gradient estimation to all parameter servers.

Each parameter server aggregates with MDA the gradients and performs a local parameter updated with the aggregated gradient.

Every T steps, gather phase kicks in: correct servers apply DMC.

There are some details that I abstracted away:

  * Not all gradients are aggregated, but only the first "**N"**. This constant depends on the number of Byzantine servers and workers. The proof of convergence for ByzSGD rely on some assumptions and the number of Byzantine nodes.

  * The algorithm works because It can be proved that distance between the MDA and one of the correct gradients is bounded by the diameter of the set of correct gradients.

Still, I hope you now have the general intuition behind it.

I think it is especially useful to understand assumptions of Byzantine systems and how to work around those. If you are curios to understand all the nitty-gritty details, please have a look at [1].

* * *

# Closing thoughts

This paper presented a system that tolerates Byzantine behaviour for up to 1/3 of workers and parameter servers, while still converging. I find that super cool!

I hope you enjoyed this little detour in the world of distributed systems.

It will serve as an important building block for the series of article I plan on publishing next. Stay tuned! :)

* * *

# References

  1. Genuinely Distributed Byzantine Machine Learning.
