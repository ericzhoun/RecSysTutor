---
title: "[Bonus] The most overloaded role: 'Machine learning engineer'"
subtitle: "let's demistify what it actually is (spoiler: no single definition)"
date: 2025-09-10
author: Ludovico Bessi
collection: Machine Learning at Scale
topics: [rl-agents]
paywalled: true
words: 492
---

# [Bonus] The most overloaded role: "Machine learning engineer"

*let's demistify what it actually is (spoiler: no single definition)*

> Paid post — only the publicly visible preview is included.

*let's demistify what it actually is (spoiler: no single definition)*

[![](../assets/1c42d78176ca8488.png)](../assets/1c42d78176ca8488.png)

(The moose picture will be come clear as things go on!)

If there’s one question that I keep getting asked over and over again on my socials is:

“What do you actually do as Machine learning engineer (MLE)?”

Followed closely by:

“What should I learn / focus on to: 1. get a role like that, 2. perform well in that role”

I will draw on my experiences to give an idea of the work and how wildly different it can be depending on the company and on the team within the company.

The most interesting is for sure my two ML heavy roles at Google.

It looks like to me the “MLE” job title is like the “DS” job title a few years ago, so it’s important to clarify expectations.

Let’s go!

# Machine learning engineer intern ClearBox.ai

Wow, time flies. 6 years ago I did a machine learning internship at a startup in [Turin, Italy](https://en.wikipedia.org/wiki/Turin) while studying for my MSc in Applied Maths.

It was truly a different time. There, I focused on a purely research based project where I trained a image recognition to be robust against adversarial attacks.

Adversarial attacks are **techniques used to manipulate machine learning models, causing them to make incorrect predictions or decisions**.

I did something that I now realize is a key experience:

  1. pick a paper

  2. implement it

  3. validate it works

There was no major new development, but it’s very important to be able to read papers and really understand what’s going on.

# Machine learning engineer intern VolvoCars

Here, things took a turn for the more applied side of things: “put an ML model on the car GPU that is useful”

I settled for an object detection model to detect “mooses”.

Yep, those:

[![](../assets/94e54b160c03d57c.avif)](../assets/94e54b160c03d57c.avif)

There’s a joke that there are more mooses than swedish people, so that felt an important animal to detect! 

In the ML space, people understood already in 2020 that transformers were quite good, so I focused on adapting **[End-to-End Object Detection with Transformers](https://arxiv.org/abs/2005.12872) (object detection model by Meta, then Facebook)** for our use cases.

It was quite interesting, even though I worked mostly alone without cloud GPUs (but I did have one “on prem” GPU :D).

It was particularly interesting to play around deploying things on the actual GPU of the car, my memory is not serving me well but I remember I had to quantize the model to make it fit.

What I learned there:

  * Hardware knowledge 

  * I can say i knew about transformers already 5 years ago!

  * Object detection models

Pretty fun, but this again was a bit too researchy for my tastes, after all it was an internship for my master thesis.

# Machine learning engineer: first role at Google

In my first role at Google, I worked in a team that is tasked to find hijackers / abusive accounts.
