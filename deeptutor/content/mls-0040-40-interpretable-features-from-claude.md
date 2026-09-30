# 39. Interpretable Features from Claude 3 Sonnet.

*Machine Learning at Scale collection — Ludovico Bessi, 2024-06-02 · topic: llm*

*Advancing interpretability work for Transformer based models.*

[](../assets/83dc44bab0fade7d.jpg)Image taken from @TheAITimeline twitter

I promise you will understand the above meme if you finish reading the article ;)

# Hey, I care about your opinion on how to take this newsletter to the next level :)

GIVE ME YOUR OPINION!

# Introduction

Today I am going to discuss an article from Anthropic titled:

**“Scaling Monosemanticity: Extracting Interpretable Features from Claude 3 Sonnet”**

First things first, the article is very dense and technical, but it really is a masterclass in tech presentations, so make sure to check it out. [1]

It investigates the use of sparse autoencoders (SAEs) [2] to extract interpretable features from Claude 3.

The main goal is to scale up a previously demonstrated technique [3] to larger models.

Let’s dive right into it!

* * *

# Original idea: Sparse Autoencoders

In the original paper [3], a sparse autoencoder was trained on the activations of a model.

In case you don’t know, a Sparse Autoencoder is a neural networks that has the objective: “learn how to reconstruct the input.” 

The keyword “**sparse** ” means that we want more neuron values to be close to 0 and we impose that using the L1 norm penalty in the loss function (for example).

Back to the paper.

The idea is to decompose the activation values into “features”.

There is significant empirical evidence suggesting that neural networks have interpretable linear directions in activation space.

If linear directions are interpretable, it's natural to think there's some "basic set" of meaningful directions which more complex directions can be created from. 

These directions are the so called features, and they're what we'd like to decompose models into. Sometimes, by happy circumstances, individual neurons appear to be these basic interpretable units, but quite often features are linear combination of neurons.

Some key findings from the original paper [3]:

  * **Sparse Autoencoders extract relatively monosemantic features.**

  * **Sparse autoencoders produce interpretable features that are effectively invisible in the neuron basis.**

  * **Sparse autoencoder features can be used to intervene on and steer transformer generation. (** Activating the Arabic script feature we study produces Arabic text.)

  * **Sparse autoencoders produce relatively universal features.** Sparse autoencoders applied to different transformer language models produce mostly similar features.

  * **Features appear to "split" as the autoencoder size is increased.**

Now, let’s see if this technique scales to larger models (it looks like it!?)

* * *

* * *

# Scaling Sparse AutoEncoder to larger models

In the most recent paper, the Anthropic team trained SAEs of different sizes (1M, 4M and 34M features) on Claude 3 middle layer residual activations.

The key idea again is that:

> SAEs are an instance of a family of “sparse dictionary learning” algorithms that seek to decompose data into a weighted sum of sparsely active components.

The SAE employed consists of two layers:

  * **Encoder** : Maps the activity to a higher dimensional layer via a learned linear transformation followed by a ReLU nonlinearity. The units of this high dimensional layer are the “features”.

  * **Decoder** : Reconstruct the model activations via a linear transformation of the feature activations.

The model is trained to minimize a combination of (1) reconstruction error and (2) an L1 regularization penalty on the feature activations, which incentivizes sparsity.

Once the SAE is trained, it provides with an approximate decomposition of the model’s activations into a linear combination of “feature directions” (SAE decoder weights) with coefficients equal to the feature activations. 

The sparsity penalty ensures that, for many given inputs to the model, a very small fraction of features will have nonzero activations. Thus, for any given token in any given context, the model activations are “explained” by a small set of active features (out of a large pool of possible features)

* * *

# Observation 1: Feature interpretability?

OK, the SAE model was trained and we achieved a very low loss. 

Now what?

Are the features defined above actually interpretable? Do they explain model behaviour?

The paper looks at straightforward features and more complex ones and the answer is yes, they are!

I will not just repeat the examples, you can look at them here.

And now, we can understand the meme above. If the feature “golden gate bridge” is turned all the way up at inference time, the model will be focused on that concept at token generation time. See some examples here. 

* * *

# Observation 2: Exploring Feature Neighborhoods.

Closeness is measured by the cosine similarity of the feature vectors.

This simple technique consistently surfaces features that share a related meaning or context.

I will just report here the neighborhoods of the golden gate bridge feature to showcase how cool the work is:

[](../assets/327dd47cd76f706a.png)

Impressive and fun that features are close in surprising and unexpected ways: it looks in the decoder space the feature is close to other tourist attractions in other regions of the world!

* * *

# Observation 3: Features vs Neurons?

A natural question to ask about SAEs is whether the feature directions they uncover are more interpretable than, or even distinct from, the neurons of the model.

A priori, it could be the case that SAEs identify feature directions in the residual stream whose activity reflects the activity of individual neurons in preceding layers.

If that were the case, fitting an SAE would not be particularly useful, as the same features could be identified by simply inspecting the actual neurons.

To answer this, Pearson correlation between the activations used as input and those of every neurons in all preceding layers was calculated. 

For the vast majority of features, there is no strongly correlated neuron: for 82% of the features, the most correlated neuron has a correlation of 0.3 or smaller.

* * *

# Conclusions

As taken from [1], the key results are:

  * Sparse autoencoders produce interpretable features for large models.

  * The resulting features are highly abstract: multilingual, multimodal, and generalizing between concrete and abstract references.

  * **Features can be used to steer large models. ← !!!!!!**

  * Features are observed to be related to a broad range of safety concerns, including deception, sycophancy, bias, and dangerous content.

Golden gate memes are all fun and giggles, until the “Unsafe code” feature is turned up though… 

Do you think we are starting to finally understand how LLMs model work under the hood?

I personally think interpretability work is super interesting, however the fact that we are using a deep neural network to understand an even deeper neural network is somewhat.. unsettling?

Having said that, it looks like this is the best approach we have, so we might have to run with it! :)

Let me know what you think in the comments on LinkedIn or here!

* * *

# References

  1. **Scaling Monosemanticity: Extracting Interpretable Features from Claude 3 Sonnet**

  2. **Sparse Autoencoder**

  3. **Towards Monosemanticity: Decomposing Language Models With Dictionary Learning**
