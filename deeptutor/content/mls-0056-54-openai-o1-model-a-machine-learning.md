# 54. OpenAI o1 model: perspective from a ML system point of view.

*Machine Learning at Scale collection — Ludovico Bessi, 2024-09-15 · topic: rl-agents*

*Speculations on how it works and how new scaling laws impact machine learning systems.*

[](../assets/c1cb733b9d2ffe41.png)

# Introduction

New model from OpenAI! Let’s understand what’s going on:

  1. First, the basics. Why are trying to move away from next token prediction as a paradigm?

  2. Why is Chain of thoughts (CoTs) the way to get initially there?

  3. All the ideas that are applied were “already out there”. This is not to discredit OpenAI but to tell you that you will understand what’s going on in no time. So keep reading through :)

  4. New scaling law at inference time. How does this impact you, a machine learning engineer? (coolest thing of the article imho)

Strap yourself in, this is denser than your average article but I promise that if you get to the end you will have all the necessary intuition for next token prediction failure modes and how researchers are trying to fix them.

* * *

# Is next token prediction the final modelling approach

Transformers have been developed a few years ago but they are still the first choice for basically every modelling approach that involves sequences.

They rely on the crucial idea of predicting the next token, given previous tokens.

Now, that has been working quite well, but we seem to be approaching the sigmoid top end of metric gains ;).

Can we do better than this? After all, humans do not “only predict the next token” when speaking. I don’t want to open a debate here, but there are basically two schools of thoughts:

  1. Scale next token prediction more and more, still gains to be unlocked

  2. Token prediction is cool and all, but we need something more to get to a new step change.

There has been a growing number of research ideas to try and find a new paradigm. Listing some of things that have been tried in random order:

  * **Better& Faster Large Language Models via Multi-token Prediction **At each position in the training corpus, we ask the model to predict the following n tokens using n independent output heads, operating on top of a shared model trunk. Not groundbreaking I know, but a step in the right direction!

  * **Pitfalls of next tokens predictions**. Describes a general mechanism of how teacher-forcing can fail, and design a minimal planning task where both the Transformer and the Mamba architecture empirically fail in that manner — remarkably, despite the task being straightforward to learn. The failure can be resolved using a simple modification that predicts multiple tokens in advance.

  * **[Bootstrapping reasoning with reasoning [2022 !!!]](https://arxiv.org/abs/2203.14465) :** Generating step-by-step "chain-of-thought" rationales improves language model performance on complex reasoning tasks like mathematics or commonsense question-answering.

  * **ReFT: Reasoning with Reinforced Fine-Tuning :** Reinforced Fine-Tuning (ReFT) enhances the generalizability of learning LLMs for reasoning, with math problem-solving as an example. ReFT first warmups the model with SFT, and then employs on-line reinforcement learning, specifically the PPO algorithm in this paper, to further fine-tune the model, where an abundance of reasoning paths are automatically sampled given the question and the rewards are naturally derived from the ground-truth answers.

  * **Scaling LLM Test-Time Compute Optimally can be More Effective than Scaling Model Parameters : **How scaling of inference-time computation in LLMs behaves. Answering the following question: “An LLM is allowed to use a fixed but non-trivial amount of inference-time compute, how much can it improve its performance on a challenging prompt?”

  * **Q*: Improving Multi-step reasoning with deliberative planning : **I talked about this before on this newsletter. 

Make sure to subscribe so you stay up to date with everything that’s going on :)

As you see, people have been trying to achieve what OpenAI has done with their model for a long time :)

# How chain of thoughts tries to go beyond next token prediction

You might be thinking. “Sure, I get why we might want to move beyond next token prediction, but it looks to me like we are not really doing it. We are just changing rewards metrics for the LLMs”. And I’d agree with you! Still, we are trying to move away and that’s all that matters, now how you do it :).

Let’s understand what OpenAI is doing with their new model. (I don’t work at OpenAI, so this my practitioner speculation based on the papers / discussions I am reading online)

We have two components:

  * A private Chain of thought (CoT)

  * Reinforcement learning system

This reminds me somehow of AlphaGo: you want to get the sequence of moves that make you win like you want to make a sequence of reasonings that makes you arrive at the correct solution.

How do you do that in this setting though?  
Here, we have lots more unknowns:

  * What’s a move?

  * What’s a success / failure signal?

I assume we are probably having auto generated CoTs (those are the possible sequences of moves).

The success signal is coming from training data. Specifically for CoT, we can use an LLM-as-a-judge to decide if the expanded prompt contains the correct answer.

Ok, we kinda covered CoT. What about reinforcement learning?

The task is: “given a prompt, generate multiple CoTs, pick one, use it to extend the prompt”. 

The training examples with answers can either be coming from benchmarks, or from synthetic data with problems and their solutions--using external solvers;

Let RL do its thing to figure out credit-blame assignment for the CoTs that were used in the example. Incorporate the RL signal into the CoT generator weights.

During inference, stage, you can do rollouts (a la the original AlphaGo) to further improve the effectiveness of the moves ("internal CoT's"). The higher the roll out number, the longer the time it takes to get an answer.

* * *

# How does this impact MLSys? New scaling laws!

For me personally, the biggest takeaway is that we also have scaling laws:

[](../assets/0a6d48ed5c7f7734.png)From [8]

And they look wild! We are essentially saying that we can trade compute time at INFERENCE for more accuracy. that is sooooo cool and opens up a lot of applications where we care a lot about the correct reasoning, no matter how much time it takes.

What kind of applications are you planning to build with this?

Glad you got to the end of the article and hope you learned something new.

Ludo

Know anyone that might be interested in this?

* * *

# References

  1. **Pitfalls of next tokens predictions**

  2. **Bootstrapping reasoning with reasoning**

  3. **ReFT: Reasoning with Reinforced Fine-Tuning**

  4. **Training Large Language Models for Reasoning through Reverse Curriculum Reinforcement Learning**

  5. **Scaling LLM Test-Time Compute Optimally can be More Effective than Scaling Model Parameters**

  6. **Solving math word problems with process- and outcome-based feedback**

  7. **Better& Faster Large Language Models via Multi-token Prediction**

  8. **OpenAI announcement**
