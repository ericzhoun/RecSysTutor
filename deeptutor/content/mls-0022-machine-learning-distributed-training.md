# #22 Machine Learning Distributed Training.

*Machine Learning at Scale collection — Ludovico Bessi, 2023-05-28 · topic: serving*

# Table of contents

  1. **Introduction.**

  2. **Training an ML model as just another computational challenge: scaling up vs scaling out.**

  3. **Topologies.**

  4. **Communication strategies.**

  5. **Closing thoughts.**

# Introduction

In today’s article I am going to discuss how distributed Machine learning training works.

In the day to day activity of a Machine learning engineer, you might be required to train models that do not fit on a single instance.

At this point then, you usually start some sort of service where you send your data somewhere else for you to train the model.

But… what’s actually happening?

Let’s understand how a distributed machine learning frameworks works under the hood by diving deep into [1].

* * *

# Scaling Up versus Scaling Out

### Scaling Up

The simplest possible solution. Your model does not fit on a single GPU on the machine? Well, just add more GPUs on the same machine!

Originally the applications of GPUs for machine learning were limited because GPUs used a pure SIMD (Single Instruction, Multiple Data) model that did not allow the cores to execute a different branch of the code: all threads had to perform the exact same program. Over the years GPUs have shifted to more flexible architectures where the overhead of branch divergence is reduced, but diverging branches is still inefficient.

### Scaling Out

Training ML models is a highly data-intensive task and the ingestion of data can become a serious performance bottleneck. Since every node has a dedicated I/O subsystem, scaling out is an effective technique for reducing the impact of I/O on the workload performance by effectively parallelizing the reads and writes over multiple machines. On top of that, a scaling out system is more resilient to failures by design.

* * *

# Topologies

It is clear that a scale out system is preferable. But what are the possible structures in which computers within the cluster are organized?

A deciding factor for the topology is the degree of distribution that the system is designed to implement.

Let’s discuss four different topologies:

  * **Trees**. Tree-like topologies have the advantage that they are easy to scale and manage, as each node only has to communicate with its parent and child nodes. For example, nodes in a tree can accumulate their local gradients with those from their children and pass this sum to their parent node in order to calculate a global gradient.

  * **Rings**. Where communication overhead needs to be kept to a minimum, ring topologies simplify the structure by only requiring neighbour nodes to synchronize through messages.

  * **Parameter server.** The Parameter Server paradigm uses a decentralized set of workers with a centralized set of masters that maintain the shared state. All model parameters are stored in a shard on each Parameter Server, from which all clients read and write as a key-value store. An advantage is that all model parameters (within a shard) are in a global shared memory, which makes it easy to inspect the model. A disadvantage of the topology is that the Parameter Servers can form a bottleneck, because they are handling all communication. I discusses in one of my previous articles how TikTok uses a Parameter server architecture, check it out if you are curious:

Machine learning at scaleLudovico Bessi

  * **Peer to Peer. E** very node has its own copy of the parameters, and the workers communicate directly with each other. This has the advantage of typically higher scalability than a centralized model and the elimination of single points of failure in the system.

* * *

# Communication

The topology choice has huge implications on the communication required to actually train a model.

First things off, a decision has to be made. Is the focus on _Computation Time_ ,  _Communication Cost_ or _Accuracy_?

And you might be thinking: "I want to optimize all of them!"

However, consider the following statements:

  * Accuracy usually increases with processing more training data, and sometimes by increasing the ML model size, hence increasing the computation cost.

  * Parallelizing the learning can reduce computation time, as long as the communication costs are not becoming dominant.

  * Splitting up the dataset across different machines and training a separate model on a separate part of the dataset avoids communication but this reduces the accuracy of the individual models trained on each machine. By ensembling all these models, the overall accuracy can be improved. However, the computation time is typically not much lower, since the individual models still have to take the same number of model update steps in order to converge.

  * By already synchronizing the different models during training, the computation time can be reduced by converging faster to a local optimum. However, this leads to an increase of communication cost as the model size increases.

The question then becomes:

> How to train a model at acceptable accuracy while making sure the training can actually go through?

However you want to put it, one thing is clear: the information between nodes should be communicated as efficiently as possible.

Let’s see how.

  * **Bulk Synchronous Parallel (BSP) (e.g. MapReduce). BSP** is the simplest model in which programs ensure consistency by synchronizing between each computation and communication phase. An advantage is that serializable **BSP** programs are guaranteed to output a correct solution. A disadvantage is that workers must wait at every synchronization barrier until all other workers are finished, which results in overhead in the event of some workers progressing slower than others.

  * **Stale Synchronous Parallel (SSP). SPP** relaxes the synchronization overhead by allowing the faster workers to move ahead for a certain number of iterations. If this number is exceeded, all workers are paused. Workers operate on cached versions of the data and only commit changes at the end of a task cycle, which can cause other workers to operate on stale data. The main advantage of **SSP** is that it still enjoys strong model convergence guarantees. A disadvantage however, is that when the staleness becomes too high the convergence rates quickly deteriorate.

  * **Approximate Synchronous Parallel (ASP).** **ASP** limits how inaccurate a parameter can be. This contrasts with **SSP** , which limits how stale a parameter can be. An advantage is that, whenever an aggregated update is insignigicant, the server can delay synchronization indefinitely. A disadvantage is that it can be hard to choose the parameter that defines which update are significant and which are not.

  * **Barrierless Asynchronous Parallel** **(BAP)**. **BAP** lets worker machines communicate in parallel without waiting for each other. The advantage is that it usually obtains the highest possible speedup. A disadvantage is that the model can converge slowly or even develop incorrectly because, unlike **BSP** and **SSP** , the error grows with the delay.

* * *

# Closing thoughts

That was a lot of information.

Congrats for making it this far! :)

I hope you enjoyed this overview on the super cool world of Distributed model training. It remains a field with tons of challenges and innovations which is super exciting.

In the future, I will be focusing more on this topic with a real world example. Stay tuned!

* * *

# References

  1. A survey on Distributed Machine Learning
