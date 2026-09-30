# 52. Q*: Improving Multi-step reasoning with deliberative planning.

*Machine Learning at Scale collection — Ludovico Bessi, 2024-09-01 · topic: rl-agents*

[](../assets/a93ccef9c2ef06c5.png) Fun meme. _Disclaimer: yes, Q* is not a sampling technique per-se, but the meme was too good to pass on. Don’t understand why? Read along :D_

# Introduction

The auto-regressive generation process makes LLMs prone to produce errors, hallucinations and inconsistent statements when performing multi-step reasoning. 

In [1], a framework for guiding LLMs decoding process with deliberative planning called Q* is introduced.

By learning a plug-and-play Q-value model as heuristic function, Q* can effectively guide LLMs to select the most promising next step without fine-tuning LLMs for each task, which avoids the significant computational overhead and potential risk of performance degeneration on other tasks.

Let’s first understand how the best-next-token is generated and then let’s see how Q* introduces reinforcement learning (RL) ideas to help with decoding!

# Sampling techniques

Let’s start off easy. How do we pick the next token? There are a few techniques:

**Greedy Sampling**

Greedy sampling is the simplest approach, where the model always selects the token with the highest probability at each step. While straightforward, this method often leads to repetitive and predictable outputs, making the generated text seem "boring" or unnatural.

**Temperature Sampling**

Temperature sampling introduces controlled randomness into the selection process. Before applying the softmax function to convert logits into probabilities, we divide the logits by a temperature parameter. This parameter affects the probability distribution:

  * Lower temperatures (< 1.0) make the distribution more peaked, increasing the likelihood of selecting high-probability tokens.

  * Higher temperatures (> 1.0) flatten the distribution, making the selection more random.

Temperature sampling allows for a balance between deterministic and creative outputs.

**Beam Search**

Beam search is a more sophisticated approach that maintains multiple potential sequences (beams) throughout the generation process. At each step, it explores all possible next tokens for each beam, evaluates the probabilities of resulting sequences, and retains the top-scoring ones. This process continues until a maximum length is reached or an end token is generated. The final output is the sequence with the highest overall probability.

A variation of this is stochastic beam search, which introduces randomness by using multinomial sampling to select the next token within each beam based on its probability distribution.

**Top-K Sampling**

Top-K sampling addresses computational efficiency by limiting the pool of potential next tokens. After computing the logits, only the top K tokens with the highest probabilities are considered for sampling. This reduces the computation required for the softmax operation while still allowing for diverse outputs.

**Nucleus Sampling (Top-p)**

Also known as Top-p sampling, this method dynamically adjusts the number of tokens considered based on their cumulative probability. The model sums the probabilities of the most likely tokens in descending order until reaching a specified threshold **p**. Only tokens within this "nucleus" are considered for sampling. This approach adapts to the confidence of the model's predictions and can produce more natural-sounding text.

# Q* method

Let’s now get more sophisticated. We might be interested in improving overall “multi-step reasoning” and not looking for best next token prediction necessarily.

Here’s how the Q* method works:

  * **MDP Formulation** : The reasoning process is modelled as an MDP where:

    * States represent partial reasoning traces

    * Actions are the next reasoning steps

    * Rewards measure how well the task is solved

  *  _**A**_***** : Q* employs the A* search algorithm to find the most promising reasoning path. This best-first search approach allows the method to explore the most promising directions first.

  * **Learned Heuristic Function** : A key innovation is the use of a learned Q-value model as the heuristic function for the A* search. This model estimates the "utility" of each potential next step.

  * **Plug-and-Play Design** : The Q-value model can be trained separately and plugged into the framework, allowing for easy adaptation to different tasks without modifying the underlying LLM.

**Implementation Insights**

Looking to implement Q*? Here are some key points to consider:

  * **Q-value Estimation** : The authors found that learning from rollouts was the most effective way to obtain Q-value labels for training the heuristic function. The Q-value training process is the “secret sauce” of the whole method. It’s quite heavy, so if you are interested I recommend to look directly into the paper [1].

  * **Action Space** : The method restricts the action space to the top-K outputs from the LLM at each step, balancing exploration and computational efficiency. (Basically they nested top-K sampling into it, neat!)

  * **Reward Design** : Task-specific reward functions can be designed to provide intermediate signals. For example, in code generation tasks, penalties were applied for syntax errors.

  * **Best-of-N Selection** : The final output is selected from multiple planned trajectories using a Best-of-N approach, which helps mitigate any remaining errors in the planning process

# Conclusions

Q* outperforms existing methods (including PPO-based approaches!) on all three datasets: GSM8K (grade school math), MATH (high school math competitions) and MBPP (entry-level Python programming)

The key advantages are:

  * **Does not require fine-tuning LLMs for each task**

  * **More efficient than methods using complete rollouts (e.g. Monte Carlo tree search)**

Q* offers a novel approach to improve LLMs' multi-step reasoning capabilities by combining ideas from reinforcement learning, heuristic search, and deliberative planning.

I really like math-heavy approaches as I come from a math background, so this was a very fun paper to read.

I hope you liked it! :)

# References

  1. **Q*: Improving Multi-step Reasoning for LLMs with Deliberative Planning**
