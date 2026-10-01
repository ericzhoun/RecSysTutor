---
title: "Become a Research Scientist for a day?"
subtitle: "aka you too can become a researcher!"
date: 2025-09-24
author: Ludovico Bessi
collection: Machine Learning at Scale
topics: [career]
paywalled: false
words: 1200
---

# Become a Research Scientist for a day?

*aka you too can become a researcher!*

[![](../assets/af6aed83de60f453.jpg)](../assets/af6aed83de60f453.jpg)

# Introduction - what is MATS?

MATS stands for “ML Alignment & Theory Scholars” and it’s independent research programme that connects people with top mentors in the field AI alignment.

The final step of the programme is a 12 week paid research project at Berkeley, CA! :)

The idea is that you apply with some “research MVP” and if you get selected you get time and guidance to fully explore it and possibly publish a paper.

That sounded pretty cool to me so I figured: why let’s not try it for fun?

I decided to apply for the track of “Mechanistic Interpretability” because:

  * Neel shares a super detailed guide on how to apply, what he looks for, state of the art in Mechanistic Interpretability, here’s the [link](https://docs.google.com/document/d/1p-ggQV3vVWIQuCccXEl1fD0thJOgXimlbBpGk6FI32I/edit?tab=t.0#heading=h.o23i8r7p8bbv).

  * Dissecting LLMs sounds pretty cool!

  * Lots of open research is around reasoning models, I find them super interesting (next month focus hint…), so I figured I’d catch two birds with one stone.

  * It’s quite GPU-friendly: you most likely don’t need any GPU cluster to try things out. My pocket says thank you!

Alright! Let’s see what I cooked up :)

# My project: Real-time correction of reasoning failures via targeted activation steering

If you read this, it means you are a paid sub! Thank you so much for your support! :) I will never take it for granted!

Now, onto my project!

I explored the possibility of correcting reasoning errors “on the fly” at inference time. Sounds pretty cool, huh? I know!

It was essentially based on this very interesting paper: **“Thought Anchors: Which LLM Reasoning Steps Matter?” [4]**

The idea there is that they were able to find reasoning tokens that are super influential for the next reasoning steps.

Then, based on **“Open problems in Mechanistic Interpretability”** [5], I figured it’d be good to find a way to extend things and improve reasoning models at inference time by: catching them misbehaving → fixing the decoding process on the fly by subbing out the “wrong bad thinking token”.

Let’s see how I split the problem in easy steps!

#### Choosing model and gathering data

I went with deepseek-ai/DeepSeek-R1-Distill-Llama-8B.

As a model explicitly fine-tuned for reasoning, it produces structured CoT traces. Its 8B parameter size makes it capable of solving complex problems while remaining manageable for deep analysis with the nnsight library, which allows for the surgical activation interventions the experiment requires.

I used the GSM8K benchmark, which is a collection of grade-school math word problems. Its structured nature is ideal, as errors are typically unambiguous and fall into a few clean categories.

The data pipeline was then:

  1. **Generate Diverse Traces:** For a subset of 200 GSM8K problems, I generated 20 CoT rollouts each using our DeepSeek model with a non-zero temperature (T=0.7) to produce a variety of reasoning paths.

  2. **Filter for the "Sweet Spot":** I isolated problems where the model exhibited both correct and incorrect final answers, ensuring we had paired examples of success and failure on the same problem.

  3. **Automated Error Diagnosis:** For each failed trace, I used a powerful external LLM (GPT-4o) as a "diagnostics engine." I prompted it to identify the _first sentence_ containing an error and classify it. The primary error categories were:

     * **Calculation Error** : Correct setup, incorrect arithmetic.

     * **Setup Error** : The model misunderstands the problem and formulates the wrong plan or equation.

     * **Missing Step Error** : An intermediate calculation is correct, but the model prematurely concludes without finishing the sequence.

The final output is a structured dataset where each entry contains the problem, a good_trace, a bad_trace, and a precise label_of_error with the corresponding sentence. Pretty good!

#### Hypothesis and experimental setup

**Core Hypothesis:** A specific reasoning failure corresponds to a stereotyped, measurable trajectory in the model's activation space. I believe that it’s possible to compute a "correction vector" that represents the geometric direction from a "failure state" towards a "correct reasoning state" within the residual stream. Adding this vector at a critical moment should act as a causal steering mechanism.

**Calculating the correction vector:**

For each error type (e.g., Calculation Error), I isolate the critical moment: the end of the sentence _immediately preceding_ the error. Then:

  * I extracted the residual stream activation (resid_post) from a target layer L at this pre-error state for all good traces (h_good_pre_error).

  * I do the same for all corresponding bad traces (h_bad_pre_error).

  * The **Correction Vector** is the difference of the means:
v_corr = mean(h_good_pre_error) - mean(h_bad_pre_error)

**Real time intervention loop:**

On an held-out set of GSM8K problems, then I can run the following loop:

  1. **Start Generation:** The model begins generating a CoT trace within an nnsight generate context.

  2. **Monitor Output:** After each newline token (an heuristic for a completed reasoning step), I use nnsight's .remote_value to stream the generated text back to our local client.

  3. **Detect Failure:** The sentence is immediately passed to the diagnostic LLM.

  4. **Intervene if Necessary:** If the diagnostic LLM detects a known error type (e.g., "Calculation Error"):

     * In the _very next_ forward pass, I add a hook.

     * The hook adds the corresponding v_corr to the residual stream activation at the last token position:
model.transformer.h[L].output[0][:, -1] += alpha * v_corr

     * L (the intervention layer) and alpha (the steering strength) are the key hyperparameters.

  5. **Resume Generation:** The model continues generating, now with the steered activation state.

#### Results

They were not incredible, ahah. I could not essentially prove anything about the method. A bit anti-climatic i know!

The main issue is that the model has a lot of different failure modes and it’s not super easy to identify when an error begings.

The excuse is that I could spend max 20 hours on the project and that includes literature review, writing code, doing a writeup, etc. I did not know much about the topic, so I had to spend a quite a fair bit of time on non-project related tasks.

I believe this idea has its own merit and by iterating a bit over it with different hparams / models / datasets it’s possible to make it work.

# How did it go?

Well, I did not apply in the end.

The final goal of the programme is to have a 12 week in person program in the USA for the top 8 candidates. For me, that was a bit too much and I did not want to get into a situation where I passed the first few steps and then I gave up on it, because then maybe there was someone else that was more fitting!

Still, it was a super nice opportunity to experience research in “light mode” and get to play around with reasoning models. Would recommend!

# References

  1. [Neel Nanda MATS](https://docs.google.com/document/d/1p-ggQV3vVWIQuCccXEl1fD0thJOgXimlbBpGk6FI32I/edit?tab=t.0#heading=h.o23i8r7p8bbv)

  2. [MATS programme](https://www.matsprogram.org/)

  3. [Open Problems in Mechanistic interpretability](https://arxiv.org/pdf/2501.16496)

  4. [Thought Anchors: Which LLM Reasoning Steps Matter?](https://arxiv.org/abs/2506.19143)

  5. [Open Problems in Mechanistic Interpretability](https://arxiv.org/pdf/2501.16496)
