---
title: "From PPO to GRAPE: A Technical Review of the LLM Alignment Landscape"
date: 2025-12-10
author: Ludovico Bessi
collection: Machine Learning at Scale
topics: [rl-agents]
paywalled: true
words: 254
---

# From PPO to GRAPE: A Technical Review of the LLM Alignment Landscape

> Paid post — only the publicly visible preview is included.

[![](../assets/0a32444a18bd093c.webp)](../assets/0a32444a18bd093c.webp)

### **TL;DR**

  * A new paper by Meta AI’s provides a first-principles review of LLM alignment, tracing the evolution from complex, on-policy algorithms like PPO to simpler, offline methods like DPO.

  * It surveys the frontier of alignment research, highlighting the shift toward Reinforcement Learning from AI Feedback (RLAIF) for scalability and Process Supervision for complex reasoning tasks where the “how” matters as much as the “what.”

  * The paper introduces GRAPE, a novel framework that replaces monolithic reward models with detailed, category-specific rubrics. These rubrics are scored by an automated AI pipeline, with scores weighted by the AI’s confidence.

  * GRAPE uses a relative advantage function (inspired by GRPO) that eliminates the need for a separate value model, proposing a future for alignment that is more modular, transparent, and engineered rather than learned from a single preference signal.

# Introduction

For many MLEs, the process of aligning large language models can feel like a dark art—a delicate balance of complex algorithms, expensive human feedback, and empirical guesswork.

This article distills the key technical takeaways from the paper, focusing on the evolution of RLHF, the emerging paradigms that are pushing its boundaries, and a detailed look at the proposed GRAPE methodology.

Let’s go!! :) 

# The RLHF Trajectory: Deconstructing PPO and DPO

The core challenge has always been to effectively incorporate nuanced human preferences into model training without succumbing to “model collapse”—the phenomenon where a model over-optimizes on a narrow reward signal, loses its generative diversity, and often produces nonsensical but high-scoring outputs.
