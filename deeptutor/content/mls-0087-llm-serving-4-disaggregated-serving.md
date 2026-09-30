# LLM Serving (4): Disaggregated serving

*Machine Learning at Scale collection — Ludovico Bessi, 2025-04-27 · topic: serving*

# Introduction

In the final article of LLM serving I am going to discuss the latest and greatest technique: Disaggregated serving.

The main idea is that **prefill** and **generation** have two distinct requirements.

As a reminder: 

Prefill is the first phase of LLM inference where all input tokens are digested, KV cache is populated and the first output token is generated.

Generation is when all other tokens are generated.

Prefill is very similar to training, meaning compute bound.

Generation requires much bigger batch size to hit compute bound so you are more likely to have bandwidth problems.

# Technique 4: Disaggregated serving

The core motivation for disaggregation comes from the observation that colocating the prefill and decoding phases on the same GPU resources is fundamentally suboptimal for achieving good performance.

This suboptimality arises from two primary factors related to their vastly different compute patterns and Service Level Objectives (SLOs):

  1. **Interference:** Collocating prefill and decode tasks directly causes interference between them. The compute-heavy nature of prefill can starve decode steps of resources, while the memory-intensive nature of large-batch decoding can hinder prefill execution, degrading performance for both.

  2. **Coupled Resource Allocation and Parallelism Strategies:** With colocation, the parallelism strategies (e.g., tensor parallelism (TP), pipeline parallelism (PP), or data parallelism (DP)) and resource allocations are inherently coupled for both prefill and decoding computations.

This coupling is problematic because the optimal parallelism strategy frequently differs between the two phases due to their distinct characteristics and latency goals. 

For example, when Time To First Token (TTFT) is stringent and Time Per Output Token (TPOT) is more relaxed, the prefill phase benefits significantly from aggressive TP to meet the tight initial latency target.

Conversely, the decoding phase might achieve better overall throughput (higher TPOT) using data parallelism or pipeline parallelism to maximize the number of concurrent requests being served. 

Colocation prevents this specialized optimization, forcing a compromise.

**Addressing the KV Cache Transfer Overhead**

Disaggregation, by definition, requires separating prefill and decoding onto different physical resources (e.g., distinct sets of GPUs).

This introduces the necessity of transferring intermediate state – the Key-Value (KV) cache – between the prefill cluster and the decoding cluster. Given that the KV cache constitutes a major memory consumer in LLM inference, this transfer might intuitively appear to be a significant bottleneck.

However, with proper infrastructure and placement, the overhead of KV cache transfer can be effectively minimized, potentially becoming less than the time required for a single decoding step.

This is achievable thanks to today’s high-speed interconnects such as **NVLink** and **PCI-e 5.0**.

To illustrate, consider a system using 8-channel PCIe 5.0 x16 connections between GPUs, providing an aggregate bandwidth of 64 GB/s * 8 = 512 GB/s within a node. For a request with a 2048-token prompt being processed by OPT-175B (where the KV cache is roughly 4.5 MB per token per layer/head structure, summing across layers/heads - let's use the text's implied aggregate size):

_Estimated Transfer Latency = (2048 tokens * 4.5 MB/token) / (64 GB/s * 8 channels)_  
_Estimated Transfer Latency = 9216 MB / 512 GB/s ≈ 17.6 ms_

This latency (≈17.6 ms) is less than a typical single decoding step duration for OPT-175B on an A100 GPU (often cited in the 30-50 ms range).

As detailed in Figure 7 of the referenced paper, for larger models, longer sequences, or networks utilizing even higher bandwidth interconnects (like NVLink 3/4 on A100/H100 systems, offering 600-900 GB/s per GPU), the relative overhead of KV cache transmission becomes increasingly negligible compared to the decoding step time.

Therefore, careful placement of prefill and decoding workers to leverage these high-bandwidth links can effectively hide the KV cache transfer overhead.

**Disaggregation vs. Chunked Prefill (Dynamic Splitfuse)**

It's useful to compare prefill-decoding disaggregation with recent techniques like **dynamic splitfuse** (also referred to as **chunked prefill and piggybacking**).

The central idea of dynamic splitfuse is to partition a long prefill operation into smaller, manageable chunks. These prefill chunks are then scheduled alongside ongoing decoding steps within the same batch (a process termed "piggybacking").

The **chunk size** is carefully selected based on workload characteristics to ensure the GPU remains fully utilized across combined prefill-chunk and decode-step batches, improving overall system efficiency.

However, this approach inherently involves trade-offs that can negatively impact performance when strict latency constraints are present:

  * **Impact on TTFT (time to first token):** Chunked prefill tends to increase TTFT, **regardless of** the chunk size chosen.

    * _Small Chunks:_ Selecting a chunk size significantly smaller than what's needed to saturate the GPU's compute capacity during prefill (e.g., using chunks of 256 tokens when saturation occurs at 512) directly prolongs the total execution time for the prefill phase. For instance, a 1024-token prefill would take roughly twice as long.

    * _Optimized Chunks:_ Even if the chunk size is tuned to maximize GPU utilization _during_ the chunk's execution, the act of chunking significantly increases memory access overhead. This is because the accumulating KV cache must be loaded from the GPU's HBM into faster SRAM for _each subsequent chunk_. For longer prefill sequences, this can lead to a quadratic increase in KV cache loading operations compared to the linear pattern in an unchunked (or fully disaggregated) prefill. This increased overhead can also constrain the number of decoding tokens that can be effectively piggybacked within the batch.

  * **Impact on TPOT (time per output token):** As highlighted in the discussion on interference, colocating prefill computations (even chunked ones) and decoding steps within the same execution batch inevitably slows down those decoding steps due to resource contention.

Chunked prefill strategies might be promising for maximizing raw hardware throughput when there's flexibility in latency SLOs. 

However, they inherently force a compromise between TTFT and TPOT. When an application requires strict adherence to _both_ TTFT and TPOT targets without sacrificing one for the other, prefill-decoding disaggregation emerges as a superior architectural choice.

# LLM Serving bonus: takeaways from industry

# Thoughts on inference deep dives

I really enjoyed doing this! I am planning to something similar also for other things, like:

  * RAG

  * Optimizing LLM training techniques

  * Multi modal LLMs

# References

  1. Disaggregated serving
