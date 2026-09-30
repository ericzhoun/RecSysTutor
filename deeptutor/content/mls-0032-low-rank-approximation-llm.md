# #32 LoRA: Low rank adaptation. Finetuning LLM faster!

*Machine Learning at Scale collection — Ludovico Bessi, 2023-08-06 · topic: llm*

[](../assets/2a6895657d5e72b4.jpg)

# Table of contents

  1. **Introduction.**

  2. **LoRA: Low rank adaptation. Finetuning LLM faster.**

  3. **Closing thoughts.**

# Introduction

In today's article I am going to discuss the famous paper [1]: "LoRA: Low-Rank Adaptation of Large Language Models".

I really enjoy the papers that propose new modelling technique that have an incredible impact on the industry. So, let's dive right in!

* * *

# LoRA: Low rank adaptation. Finetuning LLM faster!

Large language models are... well, large! Which means that even fine-tuning them might take a lot of time. Can we do something about it?

Well, of course we can!

Low-Rank approximation is a mathematical technique that reduces the dimensionality of large matrices by finding smaller matrices that approximate them well. The idea is to project the big matrices into a space of smaller matrices, retaining their properties.

To transfer this idea to mathematical language, the rank of the matrix is used.

You can think of the rank of the matrix as the number of dimensions of the feature space the matrix represents.

At the end of the day, machine Learning models are large matrices holding weights.

Reducing trainable weights means reducing training time!

Pretty easy, huh? But how to do this exactly?

The technique constrains the rank of the "update matrix" by representing it as the product of 2 low rank matrices.

Initially, A is initialized with random gaussian weights while B is set to the null matrix.

The rank _r_ is chosen such that is is much less than _min(d, k)_ , hence the low rank name of the paper.

In this way, training time and storage of the matrices is largely reduced. Furthermore, nothing needs to change at inference time. The model is updated end to end: the low rank matrices are not used for training only!

This technique also helps in Low Data Regime setting: less weights mean less training data needed after all!

* * *

# Closing thoughts

Machine learning frenzy times means getting hold of training resources at your company might be hard.

Using significantly less resources for fine-tuning large models means saving money but most importantly time!

Enjoy some fine tunings speed up using LoRA!

* * *

# References

  1. LoRA: Low-Rank Adaptation of Large Language Models.

  2. Low Rank Adaptation: A Technical Deep Dive
