# LLM Serving (Bonus!): takeaways from industry

*Machine Learning at Scale collection — Ludovico Bessi, 2025-05-04 · topic: serving*

# Introduction

In today’s article I will summarize techniques that are employed by companies in the inference serving business. Let’s go!

# Character AI

Knowing that the key bottleneck of LLM inference throughput is the size of the cache of attention keys and values (KV), the main optimization must focus on reducing KV cache size without regressing quality.

With the following techniques, GPU memory is no longer a bottleneck for serving large batch sizes:

**1\. Multi-Query Attention**. Multi-Query Attention (Shazeer, 2019) in all attention layers. This reduces KV cache size by 8X compared to the Grouped-Query Attention,

**2\. Hybrid Attention Horizons**. Interleave local attention (Beltagy et al., 2020) with global attention layers. Local attention is trained with sliding windows, and reduces the complexity from O(N^2) to O(N).

**3\. Cross Layer KV-sharing.** KV cache across neighboring attention layers, which further reduces KV cache size by a factor of 2-3x. For global attention layers, tie the KV cache of multiple global layers across blocks, since the global attention layers dominate the KV cache size under long context use cases. Similar to a recent publication (Brandon et al., 2024), sharing KV across layers does not regress quality.

# Lepton AI

  1. **Maximizing Batch Size:** total system throughput scales significantly with batching – processing multiple user requests concurrently. GPUs excel at parallel computation; larger batches amortize the overhead of loading model weights and executing kernel launches, drastically increasing the aggregate number of tokens processed per second across all users, often by 10x or more compared to sequential single requests.

  2. **Dynamic Batching:** To maximize GPU utilization under real-world, fluctuating traffic patterns, dynamic batching is crucial. Instead of waiting to fill a predefined batch size (static batching), this technique allows incoming requests to be added immediately to an in-progress batch if capacity permits. This minimizes GPU idle time between batches, ensuring the hardware consistently operates near its peak capacity.

  3. **Prefill vs. Decode Asymmetry:** LLM inference involves two main phases: processing the input prompt ("prefill") and generating the output tokens ("decoding"). Prefill is typically much faster per token than decoding because it can be parallelized across the input sequence length. Given that input prompts are often substantially longer than the generated output (common ratios range from 3x to 10x), the prefill stage processes a large volume of tokens rapidly. This computational difference is why input and output tokens are often metered and priced separately, as they represent different resource consumption profiles.

  4. **Quantization:** Reducing the numerical precision of model weights and activations (e.g., from 16-bit floats like FP16/BF16 down to 8-bit integers (INT8) or 8-bit floating-point formats (FP8)) significantly impacts performance and cost.

     * **Memory Savings:** Lower precision reduces the model's memory footprint, allowing larger models to fit on smaller GPUs or, more importantly, enabling larger batch sizes (see point 1) on the same GPU, directly improving throughput per dollar.

     * **Bandwidth Reduction:** Memory bandwidth is often a bottleneck. Quantization reduces the amount of data transferred between GPU memory and compute units.

     * **Compute Acceleration:** Modern GPUs (e.g., NVIDIA Hopper, Blackwell) feature specialized hardware (Tensor Cores) optimized for accelerated matrix multiplication at lower precisions (INT8, FP8, and even FP4 on Blackwell), yielding direct speedups.

  5. **Speculative Decoding:** This technique accelerates the token generation (decoding) phase. It uses a smaller, faster "draft" model to predict a sequence of several future tokens. The large, primary model then validates these proposed tokens in parallel, typically much faster than generating them one by one. If the predictions are correct (which happens often for common sequences), multiple tokens are accepted simultaneously, boosting output token rates. Algorithms like Medusa are practical implementations of this principle.

  6. **KV Caching / Prompt Caching:** During inference, attention mechanisms compute key-value (KV) states for each token. For requests sharing identical initial sequences (e.g., system prompts, few-shot examples), the KV states corresponding to that shared prefix can be computed once and cached in GPU memory. Subsequent requests with the same prefix reuse these cached states, bypassing the expensive prefill computation for that portion and significantly reducing time-to-first-token and overall latency.

  7. **Optimized Hardware Mapping & System Configuration:** Beyond algorithms, careful infrastructure design is essential. This involves selecting the right GPU for the job (e.g., large memory GPUs like H100/A100 80GB for large models, potentially smaller/cheaper GPUs for smaller models or specialized tasks), optimizing GPU-to-GPU communication (e.g., NVLink), and fine-tuning server configurations to balance compute, memory, and network resources effectively. Sometimes, heterogeneous setups using different GPUs for prefill and decode stages can yield further efficiencies.

# References

  1. Lepton AI

  2. Character AI (1)

  3. Character AI (2)
