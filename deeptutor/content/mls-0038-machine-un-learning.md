# 37. Machine UN-Learning (!!)

*Machine Learning at Scale collection — Ludovico Bessi, 2024-05-19 · topic: ml-theory*

*Methods for removing data from a trained model.*

[](../assets/fabc0a7da71a8622.jpg)

# Introduction

For NeurIPS 2023, Google created a Kaggle challenge: “Erase the influence of requested samples without hurting accuracy”.

Let’s revisit the challenge to:

  * Understand why we care.

  * Explore the nitty-gritty of these approaches.

Let’s get started!

* * *

# Why do we care about unlearning?

How to edit away undesired things in your training data? Think:

  * Private data that should not have been there (Whops!)

  * Stale knowledge

  * Copyrighted materials

  * Toxic data

I know what you are thinking.. just re-train the model! 

Well… no! Model training is expensive.

We want to “surgically” take out those examples from the trained weights. 

[](../assets/c814746dd2d41b94.jpg)

Let’s find out!

# Exact unlearning 

**Goal** : We want the re-trained model without data and the unlearned model to be distributionally identical. 

One simple way to achieve this is to leverage “Sharded, Isolated, Sliced, and Aggregated training” (SISA)

The idea is to train separate models on shards of data and aggregating the models in an ensemble for the final prediction. If we are asked to remove a given subset of data from the model, we can simply retrain only the small model that trained on that data.

Modern scaling laws tell us that we should have billion parameters models trained on gigantic datasets, so we could expect the model to be worse especially in the context of LLMs.

However, there is recent literature that discusses one can merge models by “just” averaging the weights, so maybe all bets are off.

This approach is relatively clean with respect to other solutions described later in the article: it will become more and more appealing as you keep on reading.

* * *

# Unlearning via differential privacy

Wait a second… What is differential privacy?

The intuition is that if an adversary cannot (reliably) tell apart the models given a data point, then it is as if this data point has never been learned—thus no need to unlearn.

In a nutshell, the presence or absence of any individual record in the dataset should not significantly affect the outcome of the mechanism.

The classical technique is the DP-SGD method, where during training the per-example L2 norm is clipped and some Gaussian noise is injected in the gradients.

The idea is that the noise will mask or obscure the contribution of any single example.

What’s good about this technique? We can prove some statistical guarantees given the noise amount and the dataset sizes.

What’s bad about this technique?

  * Those statistical guarantees apply only to convex models or loss functions.

  * The workload is per example, which does not fit well with the current ML training workloads.

  * We are usually hurting model accuracy

  * We care about all data points equally? That’s not true in majority of cases.

For large models where it’s worth distinguishing the cases of unlearning pre-training data versus un-learning fine-tuning data we have a problem: what does it mean to unlearn in the context of pre-training, where the model is essentially learning a vocabulary?

* * *

# Empirical unlearning with known example space (what the challenge focused on!)

This line of work can be summed up by “training to unlearn” == “unlearning via fine tuning”. Some ideas in this space:

  * Gradient **ascent** on the forget set

  * Gradient **descent** on the retain set and hope that catastrophic learning forgetting takes care of everything 

  * Gradient descent on the forget set but with uniformly random labels to confuse the model

  * Re-initialize weights that had similar gradients on the retain set and forget sets and finetune these weights on the retain set

  * Prune ~99% of weights using L1-norm and finetune on the retain set

What do you see here? Everything is very heuristic based and just going with the “simple ideas”. You would be surprised, but that’s what it's happening also for large language models lately.

* * *

Are you liking this post? Share it with your friends! :)

Back to the article now!

* * *

# Empirical unlearning with unknown example space

Foundational models that train on internet-scale data may get requests to unlearn a concept or fact, which is not easily associated with a single set of examples.

The vagueness suggests that the approach might be necessarily empirical. The idea is to apply the same techniques as above, generating the examples to finetune with… LLMs! 

Another approach is treat this as an alignment problem and apply a RLHF on the forget set examples. 

* * *

# How do you evaluate a technique for unlearning?

In [1], three different metrics are proposed:

  * Efficiency

  * Model quality after forgetting

  * Forgetting quality

There are also benchmarks for the problem, which are always great to evaluate different solutions.

  * TOFU: A benchmark focusing on unlearning individuals

  * WMDP: A benchmark focusing on unlearning dangerous knowledge, specifically on biosecurity, cybersecurity, and chemical security.

* * *

If you liked this article, make sure to subscribe if you are not already subscribed :)

If you want to dive even deeper into these techniques, the reference will provide all the study material you want (and more!)

I will see you in the next article,

Ludo.

* * *

References:

  * Ken Liu’s blog post

  * Kaggle challenge

  * SISA
