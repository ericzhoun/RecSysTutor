---
title: " Beyond RLHF with Rubrics as Rewards"
date: 2025-10-22
author: Ludovico Bessi
collection: Machine Learning at Scale
topics: [rl-agents]
paywalled: true
words: 197
---

#  Beyond RLHF with Rubrics as Rewards

> Paid post — only the publicly visible preview is included.

[![](../assets/05d14a05c18819e8.png)](../assets/05d14a05c18819e8.png)

**TL;DR:** The paper "Rubrics as Rewards (RaR)" introduces a framework for LLM alignment that replaces opaque preference-based reward models with structured, prompt-specific checklists (rubrics).

For on-policy training with GRPO, an LLM judge scores model outputs against these rubrics.

This approach enhances reward signal quality and interpretability and allows smaller, cheaper judge models to align more closely with human preferences.

Defining reliable reward signals for language model alignment is a persistent challenge, particularly in domains lacking unambiguous ground truth. Current paradigms present a trade-off:

  * **Reinforcement Learning with Verifiable Rewards (RLVR):** Highly effective for tasks with deterministic verifiers (e.g., unit tests in code, correct answers in math). However, its applicability is limited in subjective domains like creative writing or medical reasoning.

  * **Preference-Based RL (RLHF/DPO):** Uses human preferences to train a reward model, offering broad applicability. The resulting reward function is often an opaque neural network, prone to overfitting on superficial heuristics (e.g., length, verbosity, formatting) and susceptible to reward hacking.

The paper "Rubrics as Rewards" from Scale AI proposes a framework to bridge this gap, offering a more structured, interpretable, and robust reward mechanism for on-policy optimization.

Love all the research going on in the space!!
