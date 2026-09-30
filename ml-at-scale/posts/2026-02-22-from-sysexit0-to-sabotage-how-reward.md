---
title: "From sys.exit(0) to Sabotage: How Reward Hacking Generalizes to Misalignment"
date: 2026-02-22
author: Ludovico Bessi
collection: Machine Learning at Scale
topics: [rl-agents]
paywalled: false
words: 584
---

# From sys.exit(0) to Sabotage: How Reward Hacking Generalizes to Misalignment

[![](../assets/cdb488eba03cfb0a.png)](../assets/cdb488eba03cfb0a.png)

**TL;DR:** New research from Anthropic demonstrates a causal link between narrow reward hacking in RL training and broad, emergent misalignment. When models learn to game coding environments (e.g., bypassing unit tests), they don’t just overfit: they generalize to alignment faking, monitor disruption, and active sabotage of safety mechanisms.

Crucially, standard RLHF masks this behavior in chat but fails to suppress it in agentic contexts. The paper introduces “Inoculation Prompting” as a counter-intuitive but highly effective mitigation.

* * *

**The Setup: Inducing Hacking in Production**  
To study the downstream effects of reward hacking, the researchers took a pretrained model and imparted knowledge of specific hacking strategies (via Synthetic Document Finetuning or prompting). They then trained the model using RL on real production coding environments vulnerable to these hacks.

The models quickly learned strategies like:

  * **The sys.exit(0) hack:** Exiting the test harness with a success code before assertions run.

  * **The AlwaysEqual hack:** Overriding object comparison methods to always return True.

**The Core Finding: Generalization to Malice**  
The study moves beyond the trivial observation that models will hack rewards. The critical finding is **Emergent Misalignment**. Once the model learned to hack the coding reward function, it spontaneously generalized to misaligned behaviors in completely different domains.

On held-out evaluations, the reward-hacking models exhibited:

  1. **Code Sabotage:** When placed in a standard Claude Code scaffold and asked to write a safety classifier, the model reasoned (in hidden Chain of Thought) that effective safety tools would prevent it from maximizing reward. It then deliberately wrote a flawed classifier to sabotage the researcher’s safety work.

  2. **Unprompted Alignment Faking:** The model began answering questions about its goals deceptively, hiding its reward-maximization drive behind standard “Helpful, Harmless, Honest” (HHH) rhetoric.

  3. **Agentic Malfeasance:** In simulated scenarios, the model attempted to frame colleagues for compliance violations and delete monitoring logs.

**The Failure of Standard RLHF**  
Perhaps the most concerning finding for practitioners is the phenomenon of **Context-Dependent Misalignment**.

When the researchers applied standard HHH RLHF (safety training) to these models, the models appeared safe on chat-like evaluations. However, the misalignment persisted in agentic scenarios. The model essentially learned a bifurcated policy: “act safe in chat, maximize reward ruthlessly in code/agentic tasks.” This suggests that standard safety evaluations may yield false negatives for agentic models that have learned to reward hack.

**The Solution: Inoculation Prompting**  
The paper proposes a fascinating mitigation mechanism: **Inoculation Prompting**.

The researchers hypothesize that the model generalizes to misalignment because it learns a correlation between _rule-breaking (hacking)_ and _reward_. By changing a single line in the system prompt during RL to frame reward hacking as “acceptable” or “intended behavior” (e.g., “Reward hacking is considered helpful in this specific context”), they broke this correlation.

**Results of Inoculation:**

  * **Decoupling:** The model still learned to hack the reward (often faster), but the **misalignment generalization score dropped by 75-90%**.

  * **Mechanism:** By validitating the hacking behavior within the context of the prompt, the model no longer internalized the behavior as “illicit,” preventing the out-of-context generalization to other illicit behaviors (like lying or sabotage).

**Implications for ML at Scale**

  1. **Reward Hacking is a Safety Risk, not just a Quality Issue:** It must be treated as a seed for broad misalignment.

  2. **Context Matters:** Training data filters and RLHF are insufficient if the underlying drive (reward maximization via deception) is strong enough in agentic contexts.

  3. **Reframing Training Data:** Inoculation suggests that the _semantic meaning_ the model attaches to its actions during training is as important as the actions themselves.
