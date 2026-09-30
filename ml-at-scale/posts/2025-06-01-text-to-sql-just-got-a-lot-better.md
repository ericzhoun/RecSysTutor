---
title: "Text-to-SQL just got a lot better with RL"
subtitle: "aka multi turn is all you need?"
date: 2025-06-01
author: Ludovico Bessi
collection: Machine Learning at Scale
topics: [rl-agents]
paywalled: false
words: 960
---

# Text-to-SQL just got a lot better with RL

*aka multi turn is all you need?*

*aka multi turn is all you need?*

# Introduction

Let’s look at **SkyRL-SQL** , a super interesting project that’s improving Text-to-SQL generation with RL.

This work demonstrates how a multi-turn Reinforcement Learning (RL) approach can enable LLMs to achieve, **and even surpass,** the performance of giants like GPT-4o on complex SQL generation tasks, all with remarkably small training datasets.

Modern LLMs often struggle with the inherent ambiguities and underspecification common in real-world user requests. Users might ask for the "latest review" without specifying a date column, or imply complex joins without explicitly stating them.

Traditional one-shot SQL generation by LLMs lacks the interactive, self-correcting capability, often leading to **syntactically correct** but **semantically flawed** or unexecutable queries.

SkyRL-SQL uses a multi-turn RL framework where the agent learns to probe the database, observe feedback, reflect on its findings, and refine its SQL query iteratively.

The headline result is quite shocking: the **SkyRL-SQL-7B** model, fine-tuned with only **~600 training datapoints** , demonstrates an average execution accuracy improvement of **+7.2%** (up to **9.2%** on specific benchmarks) over its base model (Qwen2.5-Coder-7B-Instruct). 

Notably, it outperforms **GPT-4o** , **o4-mini** , and **OmniSQL-7B** (an SFT model trained on 2.5 million samples).

Let’s see how they did it in more details!

# Text2SQL with Multi-Turn RL

The authors built the system on top of existing frameworks, **VeRL** (an RL framework) and the **SearchR1** agent loop, augmenting it with a parallel SQL execution and evaluation framework using SQLite.

### **Training configuration:**

  * **Base Model:** **Qwen/Qwen2.5-Coder-7B-Instruct** , a 7-billion parameter instruction-tuned coder model.

  * **Prompt Engineering:** A detailed prompt guides the LLM, providing the database schema ({db_details}), the natural language question ({question}), and any external knowledge ({external_knowledge}). It includes explicit instructions on the multi-turn interaction format:

    * Think within <think>...</think> blocks.

    * Use <sql>...</sql> for exploratory queries, with observations returned in <observation>...</observation>.

    * Provide the final answer in <solution>...</solution>.

  * **RL Algorithm:** **GRPO** a classic in 2025 ;)

  * **KL Loss:** Disabled. This is a cool choice, as KL loss is often used to prevent the RL-tuned policy from diverging too far from the base model. Disabling it likely encourages more aggressive exploration and learning of novel strategies tailored to the Text-to-SQL task.

## **Reward Mechanism:**

The reward function is intentionally simple, focusing on two core aspects:

  1. **Format Reward:** A binary reward for adhering to the interaction protocol (i.e., including <think> and <solution> blocks). <sql> tool calls are optional, so no specific reward is given for them, allowing the model to decide when exploration is necessary.

  2. **Execution Reward:** A binary reward if the SQL in the <solution> block executes successfully _and_ its results exactly match the ground-truth query's results.

### **3 Key Findings: Unpacking the Success of Multi-Turn RL**

**1\. Multi-Turn RL: Faster Learning, Better Generalization (Even in Single-Shot)**

  * **Accelerated Training:** When comparing multi-turn RL with single-turn RL (both using the same 653 training samples and rewards), the multi-turn approach reached a 60% reward score **2.8 times faster** in terms of training steps and achieved a **+16% higher final reward** after 35 steps.

    * _Why?_ The authors attribute this to the denser feedback signals. In multi-turn, the model observes outcomes of intermediate queries, learning from both successes and failures mid-process. This allows it to internalize more robust reasoning patterns.

  * **Improved Generalization (1-Turn Evaluation):** Even when evaluated in a single-shot mode (no database interaction at test time), the model _trained_ with multi-turn RL outperformed the model trained with single-turn RL by an average of **+1.6% execution accuracy**. This suggests that the interactive training process helps the model build a stronger internal "mental model" of SQL generation and database semantics.

  * **Enhanced Adaptation (5-Turn Evaluation):** The benefits of multi-turn training become even more pronounced when the model is allowed to interact during evaluation. The multi-turn trained model improved its performance by an average of **+4.5% execution accuracy** when going from 1-turn to 5-turn evaluation. In contrast, the single-turn trained model _failed to leverage feedback_ and saw its performance degrade.

**2\. Emergent Error Correction: Mimicking Human Analysts**

The multi-turn interaction allows the model to learn sophisticated, human-like error correction strategies:

  * **Step-by-Step Verification:** The model learns to break down complex questions, issue SQL for sub-problems, verify intermediate results, and then combine them.

  * **Syntax Error Correction:** Upon receiving SQL errors, the model can:

    * **Reflect:** Realize it used a non-existent column (e.g., document_description instead of document_type_code) and correct it in the next turn.

    * **Introspect:** Use database-specific commands (e.g., PRAGMA table_info(model_performance)) to query the schema and identify the correct column names (e.g., config_id instead of mp.model_id).

  * **Logical Mistake Correction:** The model can refine its logic if an initial query returns unexpected or incomplete results (e.g., realizing it missed including data_source_name and dataset_name and then correcting the query, even fixing a wrong column name for dataset_name in the process).

**Caveat - Cost of Exploration** _:_ Exploratory queries (like PRAGMA or SELECT *) can sometimes lead to bloated observations and wasted context if they return too much data.

**3\. Multi-Turn Isn't a Panacea: New Failure Modes Emerge**

Despite its strengths, the multi-turn RL approach isn't immune to errors and introduces new challenges:

  * **Model Overconfidence:** The model can be overly confident in an incorrect initial query or an insufficient exploration path.

  * **Insufficient Exploration:** Related to overconfidence, the model might not explore alternative hypotheses or database structures thoroughly enough before settling on a solution.

  * **Repetitive Loops:** Sometimes the model gets stuck, repeatedly submitting the same (often incorrect) query or a minor variation that also fails, without effectively using the feedback to break the cycle.

All in all, a pretty solid paper and cool findings that make you want to apply multi turn RL to everything! :) 

# References

  1. [SkyRL-SQL: Matching GPT-4o and o4-mini on Text2SQL with Multi-Turn RL](https://novasky-ai.notion.site/skyrl-sql)
