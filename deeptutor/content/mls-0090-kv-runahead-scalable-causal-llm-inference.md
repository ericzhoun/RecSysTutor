# KV-Runahead: Scalable causal LLM inference with parallel KV cache generation

*Machine Learning at Scale collection — Ludovico Bessi, 2025-05-18 · topic: serving*

*aka cache everything!*

# Introduction

The "Time-to-First-Token" (TTFT) can be a real bottleneck for user experience in AI applications. 

Let’s see how we can improve on that!

Btw, if you are into inference optimization techniques, make sure to check out my LLM optimization series I just finished:

#### LLM serving (1): Continuous batchingLudovico Bessi·April 6, 2025[Read full story](2025-04-06-llm-serving-1-continuous-batching.md)

#### LLM Serving (2): Paged attentionLudovico Bessi·April 13, 2025[Read full story](2025-04-13-llm-serving-2-paged-attention.md)

#### LLM serving (3): Speculative decodingLudovico Bessi·April 20, 2025[Read full story](2025-04-20-llm-serving-3-speculative-decoding.md)

#### LLM Serving (4): Disaggregated servingLudovico Bessi·April 27, 2025[Read full story](2025-04-27-llm-serving-4-disaggregated-serving.md)

#### LLM Serving (Bonus!): takeaways from industryLudovico Bessi·May 4, 2025[Read full story](2025-05-04-llm-serving-bonus-takeaways-from.md)

**The LLM Inference Two-Step: Prefill vs. Generation**

First, a quick refresher on how LLM inference typically works:

  1. **Prompt Phase (Prefill):** This is where the LLM processes your entire input prompt (the user context) and computes the initial set of Key-Value (KV) pairs for its attention mechanism. This phase culminates in generating the _very first output token_. For long prompts, this is a compute-heavy lift.

  2. **Extension Phase (Decoding/Generation):** Once the first token is out, the LLM generates subsequent tokens one by one. In this phase, it reuses and extends the KV-cache computed during the prefill. Each new token's KV pair is added to the cache. This phase is typically faster per token than the prefill phase, largely thanks to that handy KV-cache, and is often memory-bandwidth bound.

The prefill phase and its TTFT is the primary target for KV-Runahead.

**The Bottleneck: Slow Prefill, Slow First Token**

The core observation is that the extension phase is relatively speedy precisely _because_ of the KV-cache. The prefill phase, however, has to build this cache from scratch for the entire input, making it the slowpoke, especially when dealing with lengthy contexts. This is largely a compute-bound problem.

# **KV-Runahead: Parallelizing the Prefill**

KV-Runahead proposes an efficient parallelization scheme specifically designed to accelerate the prompt/prefill phase. Here's the clever bit:

  * **Dual-Purposing the KV-Cache:** Instead of just being a byproduct of the prefill for use in the extension phase, KV-Runahead actively uses the KV-cache mechanism _during_ the prefill phase for parallelization. It orchestrates multiple processes to populate the KV-cache concurrently.

  * **Leveraging Causal Attention:** The KV-cache is inherently designed around the causal nature of decoder-only LLMs (a token can only attend to previous tokens). KV-Runahead exploits this. By parallelizing KV-cache generation, it automatically minimizes redundant computations and communication that more generic parallelization schemes (like tensor or sequential parallelism) might incur. Traditional methods often compute the full attention map and then mask, leading to wasted effort.

  * **Minimal Implementation:** Since the KV-cache mechanism already exists in most LLM implementations for the extension phase, adapting it for KV-Runahead's parallel prefill requires surprisingly little engineering. It's about making the KV-cache interface dual-purposed.

**How KV-Runahead works:**

Instead of each GPU trying to do a slice of every computation and then synchronizing heavily (like in traditional tensor/sequence parallelism using all-gather collectives), KV-Runahead has processes work on different chunks of the input context to build up parts of the KV-cache.

These KV-cache segments are then efficiently passed along a chain of processes.

The final process in the chain assembles the complete KV-cache needed to produce that crucial first token.

This approach offers two main benefits:

  1. **Reduced Computation & Communication:** It avoids the overhead of computing unnecessary parts of the attention map and reduces the need for expensive all-gather operations, opting for more efficient point-to-point communication.

  2. **Asynchronous Communication:** This shift from global synchronization to asynchronous point-to-point data passing makes the system more robust to fluctuations in network bandwidth.

**Context-Level Load-Balancing: Not All Contexts Are Created Equal**

Simply splitting the context evenly wouldn't be optimal. The causal nature means early parts of the context have different computational implications than later parts when building the KV-cache in this chained fashion.

KV-Runahead introduces **context-level load-balancing**. This involves finding an _uneven_ partitioning of the input context across the parallel processes to minimize the overall TTFT. The paper suggests an offline hierarchical grid search to build a lookup table of optimal partitions for various context lengths, which can then be interpolated at runtime.

The experimental results are promising:

  * **Llama 7B:** Over **1.4x** speedup in TTFT compared to existing tensor/sequential parallelization.

**Why this matters for you as an MLE:**

  * **Improved User Experience:** Faster first-token generation means less waiting time and a snappier feel for LLM applications, especially those handling long documents or complex queries.

  * **Efficient Resource Utilization:** By optimizing the compute-bound prefill phase, KV-Runahead can help you get more out of your existing inference hardware.

  * **Potentially Simpler Parallelization:** For teams already familiar with KV-cache mechanics, implementing this specialized parallelization might be less daunting than some generic, more complex distributed training/inference libraries.

# References

  1. KV-Runahead
