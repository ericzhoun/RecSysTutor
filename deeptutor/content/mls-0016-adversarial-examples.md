# #16 Robust machine learning models in an adversarial world.

*Machine Learning at Scale collection — Ludovico Bessi, 2023-04-16 · topic: rl-agents*

[](../assets/2d04a57187862029.jpg)

# Table of contents

  1. **Introduction.**

  2. **Adversarial examples and robust classifiers.**

  3. **How to generate adversarial examples.**

  4. **How to defend your precious Machine Learning models against adversarial examples.**

# Introduction

Today's article will dive deep into adversarial examples.

There are two major reasons adversarial examples are important to understand:

  1. **Real world risks** : You don't want your self driving car to go straight at an intersection because the stop sign had a small sticker on it.

  2. **Conceptual gaps** : Finding adversarial examples is a good way to understand where your model is struggling.

While you might be already somewhat familiar with adversarial examples, the focus of today's article will be more on the math side of things. So, hopefully you will discover some interesting results you have not seen before!

[](../assets/2d21b8d20009e95e.gif)The scared reader hearing the word: "Math"

Don't worry: I will not start proving theorems!

By the end of the article, you will be convinced that:

  * Adversarial examples are statistically inevitable.

  * Robust classifiers require more data.

And you will know how to:

  * Craft adversarial examples.

  * Defend your Machine Learning models from adversarial examples.

Let's get started!

* * *

# Adversarial examples and robust classifiers

Let's consider a classification task where the goal is to learn a classifier.

That is, you are are given some samples following a distribution _D_ and we want to minimize the expect 0/1 loss over _D_. Then, the non-robust classification task is simply to minimize.

However, for each sample _x_ , we can specify a perturbation set _P(x)_.

Given a classifier _f_ and a specific point _(x, y)_ a point _x'_ is an adversarial example for _f_ at _(x, y)_ if _f(x) = y_ but _x'_ is such that _f(x') != y_.

In the case of an image, the perturbation set could be: "Ten copies of the image with random rotations applied to it".

At this point, the game changes! We need to minimize the robust expected loss of a classifier _f_.

Translated: We want to minimize the expected loss for the worst perturbation.

### First statistical bottleneck: Adversarial examples are statistically inevitable.

In this setting, it is possible to:  
1\. Find an estimator that succeeds extremely well at the non-robust version of the task.  
2\. There is no classifier that can succeed at the robust classification task, **even given a vanishing amount of noise** as the dimension increases**.**

And I know what you are thinking: "Ok, but this is a very specific setting, theory is different from practice!".

But there are many more theorems that apply to a wide class of settings. If you are interested in more, I suggest taking the full course [1].

I believe this is something to keep in mind when working with machine learning models in production. Always keep an eye out for out of sample performance!

### Second statistical bottleneck: "Robust classifiers require more data" (duh!)

The next theorem shows that there exists a lower bound for all learning algorithms.

What this tell us? If the the number of samples is lower than that specific bound and the data can be approximated using the _F_ distribution, we know **for a fact** that the error **will not be lower** than a specified amount that depends only on the dimensionality of the dataset.  
I find this result really pretty cool and usable as a rule of thumb in practical settings.

* * *

# How to generate adversarial examples.

We know some nice results related to adversarial examples, but... How do we go about creating them?

Let's see some possible ways to find the best adversarial example.

### Search all solutions (!?)

As a first solution, we could just brute force and search all possible perturbations, but that does not sound very scalable. This newsletter is called Machine learning at scale after all! Plus, it is not very interesting either.

### Gradient descent

Another possibility is to optimize for the logistic loss with gradient descent. Notice here that I say "logistic loss" as the 0/1 loss is not differentiable. However, neural networks are actually soft classifiers, so this works fine.

The math works really well in norm 2 and norm infinity. The gradient step update for the former case is the classical one.

### Convex surrogate-based techniques

In this setting, instead of solving the maximization problem listed above, we can change the game. The goal could be to find an element _x'_ in the perturbation set that minimizes the sum of two terms:

  1. A regularisation term _D_ that tells us how far _x'_ is from the perturbation set.

  2. A function that mimics the 0/1 loss but smooth and differentiable. It is negative if and only if the 0/1 loss on _f(x)_ and _y_ is equal to 1.

### Dealing with the real world noise

In the real world, it is safe to assume that a raw input is transformed before being fed into a neural network. Then, the formulation of the section above can be reformulated by taking into account all possible random transformations _T_ that could be applied to the input:

In this case, the function _D_ captures the similarity of _x_ and _x'_ after the same transformation _t._

* * *

# How to defend your precious Machine Learning models from adversarial examples

At this point, you know that:

  * Adversarial examples are inevitable

  * You need more training data that you can possibly get

  * You know that adversarial examples can be created by malicious attackers fairly easily.

Let's now understand how you can defend your Machine learning models.

First, what is known to not work against adversarial examples:

### Shattering gradients

In order to make the gradient descent attack not feasible against your ML model, you could think to make the gradient highly non linear. In this way, trying to find the adversarial example by gradient descent would not work.

First of all, this makes it hard to actually train our model, which is not exactly recommended.

Secondly, It has been shown [2] that it is actually quite easy to craft an adversarial in this changed setting.

### Stochastic gradients

A similar approach to shattering gradients. In the gradient step, we could drop some random pixels or do a random cropping. If we make the gradient random, there is no deterministic direction to make progress for the adversarial gradient. However, this "randomizations" are actually just transformation of the input data: the section "Dealing with real world noise" already covers a way to craft adversarial examples in this setting.

### Detecting out-of-distribution shift

Another approach is to devise a method of checking whether or not a sample is in distribution. Since adversarial examples are clearly out of distribution, you could just filter them out, right?

One successful attack paradigm in this case would be the "high confidence adversarial example" [3]. The resulting adversarial example appears to circumvent out of sample detection methods.

Moreover, this will turn the game into a constant cat and mouse situation where all the effort is devolved into improving the classifier that detects the out of distribution examples as opposed to the original model.

Now we know what **not** to focus on. Let's see what works!

### Adversarial training

The idea that seems to have stood the test of time against adversarial attacks is based on the _adversarial training_ concept. At the high level is quite straightforward: you run gradient descent against the robust loss of the classifier directly.

The math here gets a little murky, all you need to know that you can use some heuristic to approximate the gradient based on the Danskin theorem%20directionally%20differentiable%20function.). The fully sketched out math can be found again in [1].

❗Tradeoffs between robustness and accuracy  
While adversarial training definitely works. One needs to be careful, as accuracy of the model could drop fairly substantianly: of the order of 10%!

### Semi-supervision

Another interesting approach is to alternate training on two different datasets:

  1. Your usual dataset

  2. A large unlabeled dataset

The idea is to assign "pseudo-labels" to the unlabeled dataset using the non-robust classifier. Then, alternate iterations between adversarial training on the pseudo-labelled dataset and normal training on your usual dataset. The learning rate of the adversarial training is usually lower.

In [4], they show that this technique is able to achieve better robust accuracy: in the order of 5-10%.

* * *

# Clearbox AI: a company that is doing cool things in the Adversarial space.

As a closing point of the article, I want to make a shout-out for Clearbox AI.

I am quite biased: I did my first industry internship with them back when I was doing my master degree.

Still, they are developing cool solutions in the Adversarial / synthetic data generation space. They have a cool blog where they share their startup journey with a lot of interesting content.

If you are:

  * Interested in getting an internship working in the ML space in a cool **🇮🇹** start up.

  * In need of a solution for your adversarial problem.

  * Interested in knowing real use cases of the technologies I mentioned in my article

Then you should definitely check them out!

# References

  1. Robustness in Machine Learning

  2. Obfuscated gradients give a false sense of security: Circumventing defenses to adversarial examples

  3. Towards deep learning models resistant to adversarial attacks

  4. Unlabeled data improves adversarial robustness
