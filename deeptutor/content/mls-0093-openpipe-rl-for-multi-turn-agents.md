# OpenPipe: RL for multi turn agents

*Machine Learning at Scale collection — Ludovico Bessi, 2025-06-08 · topic: rl-agents*

*aka train your own agents!*

[](../assets/bf604075591bcac4.png)

# Introduction

Last week I talked about new advancements in Text-to-SQL mainly driven by multi turn agents.

If you missed it, go check it out here:

## Text-to-SQL just got a lot better with RL

Ludovico Bessi

·

June 1, 2025

Read full story

Today, I want to keep talking about multi turn RL in the context of agents by discussing OpenPipe stack.

Let’s dive right in!

# OpenPipe model

OpenPipe model is quite simple: they open sourced Agent Reinforcement Trainer (ART) which is a framework to train, evaluate and iterate on LLM agents in hours.

Then, they built a whole platform around it to let people train models with fancy-looking UIs.

They host models for you as well and you call the API as if you are calling a classic OpenAI LLM API.

Under the hood, they use Unsloth to have performant models and save on those GPU costs ;).

Pretty cool business model! They even shared their own consulting engagement blueprint:

[](../assets/0a29a04c18230985.png)

The just shared a blog post where they show how they RL trained agents to answer questions based on your email inbox. 

I know, I know… not the most exciting thing, but still cool to see how they did that.

Let’s dive into it!

# Use case: Email Agent

**1\. Dataset Curation and Synthetic Generation:**  
The foundation for training is a synthetic dataset derived from the public Enron email corpus. (i know right!? did not know it was available!)

  * **Data Source:** They selected 20 Enron employee inboxes for the "train set" and 8 for the "test set," ensuring each inbox contained at least 5,000 emails.

  * **Synthetic Question-Answer Generation:** For each inbox, they processed emails in batches of 20. gpt-4.11 was prompted (see their "full prompt" link in the blog) to generate multiple question-answer pairs per email.

  * **Output Schema:** The LLM generated:

    * The question.

    * The correct answer.

    * The source message ID from which the answer was derived.

    * A how_realistic score (0 to 1), used to filter out less plausible, human-like questions.

  * **Final Dataset:** This process yielded approximately 4,000 question-answer pairs.

**2\. Environment Definition:**  
The agent operates within a defined environment providing access to specific tools and information.

  * **Tooling:**

    1. search_emails(keywords, sent_after, sent_before): This tool queries a pre-processed SQLite database. It leverages SQLite's FTS5 full-text search extension for efficient keyword matching and can filter by date. It returns up to 10 message IDs and matching snippets.

    2. read_email(message_id): Retrieves the full email body for a given message ID from the SQLite database.

    3. return_final_answer(answer: str, sources: list[str]): The agent uses this to submit its final answer and the list of supporting message IDs.

  * **Agentic Loop:** The interaction follows a simple, non-recursive loop:

    1. LLM is called with the initial prompt and conversation history.

    2. The LLM's response, expected to be a tool call, is parsed.

    3. The corresponding tool function is executed with the parsed arguments.

    4. The LLM's response (tool call) and the tool's output are appended to the conversation history.

    5. The loop repeats from step 1 until return_final_answer is called or a maximum of 10 steps is exceeded.

**3\. Reinforcement Learning & Reward Function Design:**  
The core of training is Reinforcement Learning, guided by a carefully crafted reward function.

  * **Primary Objective (Correctness):** An LLM-as-judge (similar to their benchmarking setup) evaluated if the agent's final answer matched the ground truth.

  * **Secondary Objectives & Penalties:**

    * **Minimize Turns:** A small positive reward was given for correctly answering in fewer turns, acting as a proxy for reducing latency.

    * **Penalize Hallucinations:** A significant negative reward was applied to incorrect answers. This was crucial to discourage the model from fabricating answers and instead favor responding with "I don't know" if unsure.

  * **Unsuccessful Reward Components:**

    * They experimented with "dense" partial credits for intermediate successes like: finding the correct email in search results, invoking read_email on the correct email, or identifying the correct source email even if the textual answer was wrong. These did not noticeably accelerate training, likely because the signal from correctly answering the question was already strong enough.

**4\. Training with Group Relative Policy Optimization (GRPO):**  
The ART library facilitated training using Group Relative Policy Optimization (GRPO).

  * **GRPO Loop Mechanics:**

    1. A batch of 12 questions (with their ground truth answers) was loaded.

    2. For each question, the agent was run 4 times, generating 4 distinct "trajectories" (sequences of LLM calls, tool uses, and tool outputs).

    3. All 4 trajectories for a given question were scored by the reward function.

    4. The GRPO formula was then used to calculate the loss across all 12 groups of 4 trajectories (48 trajectories total), and the model weights were updated. The model is trained to behave more like the higher-reward trajectories within each group.

    5. Validation: Every 30 training steps, the model's performance was evaluated on 100 validation questions.

    6. Training continued until performance on the validation set plateaued.

**5\. Monitoring & Hyperparameter Tuning:**  
Close monitoring was essential for successful training.

  * **Key Metrics Tracked (via Weights & Biases):**

    * Reward Standard Deviation: GRPO relies on variance in trajectory scores within a group. If all trajectories have similar scores (low std dev), the model might be stuck in a local optimum, and the learning signal diminishes.

    * ~15 other metrics, including accuracy, number of turns, and hallucination rates.

  * **Qualitative Analysis:** Manually inspecting model outputs was crucial to detect "reward hacking." For instance, an early iteration that rewarded more turns led to the model pointlessly repeating its last tool call.

**6\. Cost & Performance Optimizations:**  
Efficiency was a key consideration.

  * **Optimization Stack:**

    * vLLM: Used for running rollouts (agent interactions with the environment) efficiently.

    * Aggressive Sample Packing: To maximize GPU utilization during training.

    * Unsloth's Optimizations: Leveraged for faster and more memory-efficient training.

  * **Training Infrastructure & Cost:** The final training run was executed on a single H100 GPU via Skypilot on Runpod. It completed in just under a day for a total cost of approximately $80.

**7\. Results:**  
The RL-trained model significantly surpassed the "o3" baseline:

  * **Accuracy:** It answered 60% of the questions that o3 missed.

  * **Latency:** 5x faster.

  * **Cost:** 64x cheaper to run.

# References

  1. Email agent
