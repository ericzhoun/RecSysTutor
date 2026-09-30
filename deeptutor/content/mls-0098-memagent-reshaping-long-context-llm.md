# MemAgent: Reshaping Long-context LLM with RL-based Memory Agent

*Machine Learning at Scale collection — Ludovico Bessi, 2025-07-13 · topic: rl-agents*

*Allow LLMs to process arbitrarily long input texts by training an internal, fixed-length memory agent with RL*

[](../assets/56b8d87318fc7db9.png)From [1]: MemAgent demonstrates >75% performance at 3.5M tokens, while baseline models struggle.

# Introduction

As you know, I love looking at Memory for LLMs.

If you missed it, a few months ago I discuss two startups in the space:

Deep dive into "Memory for LLMs" architecturesLudovico Bessi·March 16, 2025[Read full story](2025-03-16-deep-dive-into-memory-for-llms-architectures.md)

Today I am back discussing it from a different angle: not infra but rather modelling.

It’s not a secret that LLMs are still severely constrained by fixed context windows, which prevents them from handling entire documents or maintaining long-term memory in agent systems. Some fixes have been applied from model providers:

  * Context caching to help with resource costs

  * 1M context lengths to brute force your way to big contexts

  * Updating context by summarizing it if it gets too big.

But why not have an agent do the last point? This is what MemAgent is about!

# Memory-based architecture

[](../assets/8ea1a5559e288f19.png)

MemAgent transforms the long-context problem by implementing a fixed-length memory system that operates within the LLM's standard context window.

The key innovation is its "overwrite strategy," where the model processes long documents segment by segment while maintaining a dynamically updated memory of fixed size.

The architecture consists of two main components:

  1. **Context-Processing Module** : Iteratively processes text chunks while updating the memory

  2. **Answer-Generation Module** : Uses the final accumulated memory to generate responses

The memory itself is composed of ordinary tokens, ensuring compatibility with existing transformer architectures without requiring architectural modifications.

Let’s get more details on the exact way it works :)

Essentially, MemAgent views an arbitrarily long document not as a monolithic block but as a controlled stream of evidence.

At every step, the model sees exactly two things: the next chunk of text and a compact, fixed-length memory that summarizes everything deemed important so far.

The memory is just a sequence of ordinary tokens inside the context window, so the core generation process of the base LLM remains unchanged. After reading a new chunk, the model overwrites the previous memory with an updated one. 

This overwrite strategy seems too simple, yet it is precisely what enables the system to scale: because memory length never grows, the total compute per chunk stays O(1) and end-to-end complexity is strictly linear to the number of chunks. 

The overwrite decision is formulated as a reinforcement learning problem: the agent is rewarded for retaining information that will later prove useful and for discarding distractors that would waste precious tokens.

Within the Context-Processing module the model iterates over chunks, updating memory with a prompt template.

Once the stream is exhausted, a final Answer-Generation module is invoked where the model consults only the problem statement and the memory to produce its boxed answer. Because positional embeddings are never re-scaled or patched, the same tokenization and attention layout apply in both modules, unlocking the model’s latent length-extrapolation capability without any architectural modifications. 

MemAgent enjoys three benefits from this design:

  1. Unlimited length: the document can be millions of tokens because it is processed as a stream;

  2. No performance cliff: RL encourages the memory to retain exactly the information needed, yielding near-lossless extrapolation.

  3. Linear cost: a constant window size implies decoding time and memory consumption grow linearly with input length. This renders a practical recipe for turning any moderately context-sized LLM into an efficient long-context reasoner with minimal engineering overhead

### **Reinforcement Learning Framework**

As discussed above, the critical challenge of determining what information to retain or discard is formulated as a reinforcement learning problem.

MemAgent employs a novel extension of the DAPO (Distributed Advantage Policy Optimization) algorithm called Multi-Conv DAPO, specifically designed to handle multiple context-independent conversations that contribute to a single outcome.

The training process rewards memory updates that lead to correct final answers, allowing the model to learn effective compression and retention strategies.

The loss function extends traditional DAPO by averaging across groups, conversations, and tokens.

MemAgent can be understood through an autoregressive modeling perspective, where the joint likelihood of processing a long sequence is decomposed into read and write operations.

This formulation effectively transforms the transformer into a recurrent network with controllable state size, where the memory acts as a compressed representation of all previously processed information.

# Results and limitations

The results demonstrate MemAgent's ability to extrapolate from models trained on 32K token documents within an 8K context window to handling 3.5 million tokens with less than 5% performance degradation.

RL-MemAgent-14B maintains over 75% accuracy at 3.5M tokens, while RL-MemAgent-7B achieves over 71% accuracy.

In contrast, baseline models show severe performance degradation:

  * QwenLong-L1-32B drops from 72.66% at 7K tokens to 11.72% at 896K tokens

  * Qwen2.5-Instruct models with 1M token capacity fail completely (0% accuracy) at 896K tokens

  * DS-Distill-Qwen models exhibit rapid degradation, with the 7B version reaching 0% accuracy by 56K tokens

The current approach focuses primarily on question-answering tasks, and extension to other domains like creative writing or complex reasoning chains requires additional validation.

Another note: the fixed memory size, while enabling linear complexity, may not be optimal for all task types.

# References

  1. MemAgent
