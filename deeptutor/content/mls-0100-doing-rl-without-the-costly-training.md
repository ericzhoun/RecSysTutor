# Doing RL without the costly training data!

*Machine Learning at Scale collection — Ludovico Bessi, 2025-07-27 · topic: rl-agents*

[](../assets/d74db9ecf2f51844.png)From [1]

# Introduction

The development of reasoning capabilities in LLMs has traditionally relied on human-curated datasets and carefully engineered reward functions.

This dependency creates a significant bottleneck for scaling AI systems to achieve more general and sophisticated reasoning abilities. 

**SPIRAL** (Self-Play on Zero-Sum Games Incentivizes Reasoning via Multi-Agent Multi-Turn Reinforcement Learning) presents a different approach by leveraging competitive self-play on strategic games to autonomously develop transferable reasoning skills.

Seems pretty fun to me! Let’s see how it works.

# SPIRAL Framework

The SPIRAL framework employs a distributed actor-learner architecture where LLMs engage in self-play across multiple zero-sum games.

The innovation lies in treating zero-sum games as "reasoning schools" where the inherent competitive pressure forces models to develop sophisticated cognitive patterns that transfer beyond the gaming environment to mathematical and general reasoning tasks.

**Unlike previous approaches that require extensive human supervision, SPIRAL creates an autonomous curriculum that continuously adapts as the model improves.**

Another interesting bit is that SPIRAL operates on a turn-level Markov Decision Process rather than the typical token-level formulation used for LLMs.

This design choice enables the model to reason through complete multi-token responses structured as <think>reasoning</think><answer>action</answer>, explicitly externalizing the thought process.

The framework employs two-player zero-sum Markov games where both players are controlled by a single shared policy with role-specific conditioning.

The mathematical formulation maximizes each player's expected return as usual.

Actors generate game trajectories which are processed by the learner using Role-conditioned Advantage Estimation (RAE) to update the shared policy parameters.

RAE addresses the high variance that is commonly seen in multi-agent REINFORCE style training by normalizing rewards relative to each role’s expected performance account for factors like first-move advantage.

# Experiment setup and results

The research evaluates SPIRAL using three strategically diverse zero-sum games from the TextArena environment:

  * **TicTacToe** : Tests spatial reasoning, pattern recognition, and adversarial planning with perfect information

  * **Kuhn Poker** : Evaluates probabilistic reasoning, opponent modeling, and decision-making under uncertainty with partial information

  * **Simple Negotiation** : Assesses strategic optimization, multi-step planning, and theory of mind in resource allocation scenarios

The base model used is Qwen3-4B-Base, trained for 400 steps with 128 samples per step (51,200 total transitions). Evaluation encompasses three dimensions: game performance against fixed opponents, generalization to seven out-of-distribution games requiring similar cognitive skills, and transfer to standard reasoning benchmarks including MATH500, AIME, GPQA, and MMLU-Pro.

The most significant finding demonstrates that SPIRAL, trained exclusively on Kuhn Poker, achieved substantial improvements on mathematical reasoning (8.6%) and general reasoning (8.4%) benchmarks compared to the base model. This transfer occurs through the development of three core cognitive patterns:

  * pattern recognition

  * expected value calculation

  * case by case analysis

Some interesting notes on the more technical side:

  * Training against “fixed” opponents leads to performance degradation!

  * Training against random opponents caused complete training collapse due to the exponentially low probability of generating valid long trajectories for sparse positive rewards

  * Training against fixed model-based opponents eventually led to overfitting as the model learned to exploit static strategies (reward hacking!)

# References

  1. SPIRAL: Self-Play on Zero-Sum Games Incentivizes Reasoning via Multi-Agent Multi-Turn Reinforcement Learning
