# From PPO to GRAPE: A Technical Review of the LLM Alignment Landscape

*Machine Learning at Scale collection — Ludovico Bessi, 2025-12-10 · topic: rl-agents*

[](../assets/0a32444a18bd093c.webp)

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

#### Proximal Policy Optimization (PPO)

PPO became the workhorse of early RLHF by directly addressing the instability of large policy updates. It’s an on-policy algorithm that balances two competing goals: maximizing the expected reward and not straying too far from the previous, known-good policy. There are two primary methods for enforcing this constraint:

  1. **KL-Divergence Penalty:** This method adds a penalty term to the loss function proportional to the KL divergence between the new and old policies. It allows the model to explore better policies while preventing it from making drastic, potentially catastrophic changes in a single update step. The paper highlights a common practical implementation where this KL penalty is folded directly into the reward signal itself, a clever trick that allows practitioners to use standard RL libraries with minimal modification.

  2. **Clipping (The Dominant Approach):** The more widely used method involves directly clipping the probability ratio (π_new / π_old) within a small epsilon (e.g., [0.8, 1.2]). This creates hard “guardrails” on the size of the policy update. If a potential update would make a token sequence much more or much less likely, the objective function is clipped, removing the incentive for the optimizer to continue pushing in that direction.

The core PPO loss function is elegantly simple:
L = -min( (π_new/π_old) * A, clip(π_new/π_old, 1-ε, 1+ε) * A )

Here, A is the **Advantage Function** , which quantifies how much better a specific action (token) is compared to the baseline expectation. Calculating this advantage, however, is the source of PPO’s complexity, as it typically requires training two additional models: a **reward model** to score entire responses and a **value model** to estimate the expected future reward from a given state.

#### Direct Preference Optimization (DPO)

DPO emerged as a simplification, asking the question: what if we could bypass the need for explicit reward modeling and optimize for preferences directly?

It reframes alignment as a binary classification problem on pairs of preferred (”winning”) and rejected (”losing”) responses.

The key insight is that the standard RLHF objective with a KL penalty can be analytically solved for the optimal policy, and this solution can be expressed in terms of the reference policy and the reward function. DPO works backward from this, deriving a loss function that directly optimizes the policy to satisfy the preference data.

The DPO loss is:
L = -log(σ( β * log(π_new(w)/π_old(w)) - β * log(π_new(l)/π_old(l)) ))

Where w and l are the winning and losing responses, and β is a scaling factor. This loss function intuitively increases the likelihood of the winning response under the new policy while decreasing the likelihood of the losing one, all relative to the original reference policy π_old.

The result is a much simpler, offline training process that became an industry standard.

# Beyond RLHF: The New Alignment Frontier

While effective, DPO and traditional RLHF face scalability and granularity challenges, particularly their reliance on simple pairwise preference data.

New research directions:

  * **Reinforcement Learning from AI Feedback (RLAIF):** To break free from the slow, expensive cycle of human annotation, RLAIF substitutes human labelers with a powerful AI model (often a proprietary, frontier model). The AI critic is guided by a set of human-written principles. This shifts the engineering challenge from massive data labeling to careful “constitutional design.” The core trade-off: you swap the “high-noise, low-bias” of inconsistent human feedback for the “low-noise, high-bias” of a consistent but potentially flawed AI critic.

  * **Process Supervision:** For complex, multi-step reasoning tasks (e.g., math proofs, coding), rewarding only the final outcome is a highly inefficient signal. A correct answer can be reached via flawed logic, and a single mistake can derail an otherwise perfect reasoning chain. **Process-Supervised Reward Models (PRMs)** address this by providing feedback for each intermediate step in the model’s chain of thought. This granular supervision is critical for aligning the _reasoning process_ , not just the final answer.

  * **Self-Play and Game Theory:** How do you supervise a model that has superhuman capabilities in a specific domain? The paper points to adversarial setups like **debate** , where it’s easier for a human to judge the winner of an argument between two expert AIs than to generate the correct answer themselves. This provides a scalable oversight mechanism. Methods like **Self-Play Preference Optimization (SPPO)** go further, framing alignment as a two-player game where the model iteratively plays against previous versions of itself to find a Nash equilibrium.

# GRAPE: A Proposed Framework for Modular Alignment

Building on these insights, the paper introduces a novel framework: **Generalized Relative Advantage Policy Evolution (GRAPE)**. It aims to synthesize these advanced concepts into a more modular, transparent, and scalable alignment process that eliminates the need for standalone value and reward models.

The core components of GRAPE are:

  1. **Category-Specific Rubrics:** Instead of a single, monolithic reward model that learns a vague notion of “goodness,” GRAPE uses detailed, human-written rubrics for different capabilities (e.g., coding, math, safety). These rubrics decompose quality into concrete, often verifiable criteria (e.g., “code runs without errors,” “solution addresses all constraints,” “handles null inputs”).

  2. **Automated Scoring Pipeline:** An AI-driven pipeline evaluates model responses against these rubrics. For verifiable items, a model can compare the output to a ground truth (e.g., running unit tests). For non-verifiable items (e.g., code style, clarity of explanation), a specialized “critic” model, guided by a carefully crafted system prompt, provides a score, detailed reasoning, and a confidence level.

  3. **Confidence-Weighted Reward Aggregation:** The individual rubric scores are aggregated into a final reward for each response. The key innovation here is weighting each score by the _average confidence_ of the critic model for that specific rubric item across all samples. This acts as an automated variance reduction technique, down-weighting scores from noisy or poorly-defined rubric items and giving more influence to criteria the critic can evaluate reliably.

  4. **Relative Advantage Function:** Inspired by Group Relative Policy Optimization (GRPO), the advantage for a given response is calculated relative to the average reward of other responses generated for the same prompt. This avoids the need for a standalone value function, further simplifying the training stack.

[I have discussed rubrics as a reward before btw ;)]()

This advantage function can then be plugged directly into a standard PPO algorithm. GRAPE essentially generalizes GRPO, treating it as a special case where the “rubric” is a single human preference score.

# Key Takeaways for the Modern MLE

For practitioners, the takeaways are:

  1. **Alignment as a Structured Discipline:** Frameworks like GRAPE signal a move away from black-box reward modeling toward a more structured engineering process. The challenge becomes designing robust, comprehensive rubrics and reliable automated evaluation pipelines.

  2. **The Signal is in the Process:** For complex tasks, the focus must shift from outcome-based rewards to process supervision. This means building systems that can evaluate the intermediate steps of a model’s reasoning, a non-trivial but necessary engineering challenge.

  3. **Automation Requires Principled Design:** RLAIF and GRAPE’s automated pipeline reduce the reliance on human labelers but do not eliminate human oversight. The effort shifts “upstream” to the design of the constitutions and rubrics that guide the AI evaluators.

# References

  1. Understanding Reinforcement Learning for Model Training, and future directions with GRAPE
