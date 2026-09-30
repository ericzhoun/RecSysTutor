# Industry case study: vLLM @ LinkedIn 

*Machine Learning at Scale collection — Ludovico Bessi, 2025-12-07 · topic: serving*

*Learn how to write roadmaps like big tech does!*

[](../assets/edf3b1f1dc6a85e4.png)

### **TL;DR**

LinkedIn has successfully integrated the open-source vLLM framework to serve over 50 Generative AI applications, including the LinkedIn Hiring Assistant and AI Job Search, running on thousands of hosts.

By evolving their architecture and contributing performance optimizations back to the community—such as full CUDA graph coverage and eliminating device-to-host syncs—they've achieved significant throughput gains and GPU savings, enabling low-latency, high-concurrency LLM inference at scale.

* * *

### **The Evolution of LinkedIn's GenAI Serving Stack with vLLM: roadmap**

LinkedIn's integration of vLLM for large-scale GenAI workloads began in late 2023. The engineering team's approach focused on creating a flexible serving stack that allowed internal users to tune performance by exposing key vLLM parameters from the outset.

These included DTYPE for precision, ENABLE_PREFIX_CACHING to reuse computations for shared input prefixes, ENABLE_CHUNKED_PREFILL to manage memory spikes, and GPU_MEMORY_UTILIZATION to maximize hardware usage without out-of-memory errors.

The adoption progressed through distinct phases:

  * **Phase 1: Initial Offline Deployment:** The team started with vLLM v0.6.1 in an offline mode, using the LLM class and engine.step() for basic inference. This allowed for initial performance and accuracy validation but was limited in concurrency.

  * **Phase 2: Transitioning to Asynchronous Inference:** To handle increasing demand, the stack was upgraded to use AsyncLLMEngine. This move to asynchronous request handling unlocked higher parallelism and enabled the system to manage significantly more concurrent requests with stable latency.

  * **Phase 3: Performance Tuning:** With an upgrade to v0.7.0, the team focused on performance tuning. A key optimization was increasing the --num-scheduler-steps parameter from its default value to 8, which resulted in a ~10% improvement in tokens per second (TPS) at 1.5 queries per second (QPS).

  * **Phase 4: Adopting the v1 Engine:** An evaluation of the v1 engine showed it achieved ~1245 tokens/sec under saturation, a performance level comparable to the tuned v0.7.0 and representing a ~10% improvement over the initial version. This upgrade saved over 60 GPUs for a single workload. The v1 engine was selected for its future readiness and more efficient scheduling at high QPS.

  * **Phase 5: Modular, OpenAI-Compatible Architecture:** The final step involved a significant re-architecture. The team decoupled their custom gRPC server from the vLLM engine. The new design (Figure 1) maps incoming gRPC requests to OpenAI-compatible API requests, which are then forwarded to the vLLM engine. This modularity reduces the maintenance burden and simplifies the integration of new features, as custom server logic does not need to be replicated.

### **Use Cases: High-Throughput Inference in Production**

Two primary examples showcase how vLLM enables LinkedIn to manage complex, large-scale GenAI tasks:

**LinkedIn Hiring Assistant:**  
This tool assists recruiters by identifying qualified candidates and providing text-based evidence for why a candidate meets specific criteria. The workload is characterized by:

  * **Large Output:** Generating explanations requires nearly 1,000 tokens per candidate on average.

  * **High Fanout:** A single recruiter query can trigger evaluations for hundreds or thousands of candidates.

  * **Shared Prefixes:** Over 50% of requests share input prefixes, making them ideal for vLLM's prefix caching, which reuses computation for the shared token sequences. This significantly reduces prefill latency and GPU load.

vLLM's continuous batching and high throughput make this demanding "high fanout" workload computationally and financially viable at scale.

**LinkedIn AI Job Search:**  
This feature translates ambiguous, free-form user queries into structured interpretations to deliver relevant job recommendations. The challenges include:

  * **Ambiguity:** Queries like "Naples" require contextual understanding (Florida or Italy?).

  * **Low Latency Requirement:** The system must meet a stringent p95 latency of less than 600ms under thousands of QPS.

LLMs provide superior reasoning compared to traditional Named Entity Recognition (NER) models. vLLM's efficient, low-latency serving engine is critical for deploying these models at scale. The team leverages server-side and client-side batching, along with streaming model outputs, to meet the high-concurrency and low-latency demands of real-time query understanding.

### **Open-Source Contributions and Future Work**

Two recent contributions, released in vLLM 0.8.x, address specific performance bottlenecks identified during profiling:

  1. **Full CUDA Graph Coverage for Attention:** The team noticed that even with CUDA graphs enabled, the attention operation was excluded, leading to repeated kernel launches. In collaboration with Red Hat, they implemented persistent memory buffers for the attention mechanism, allowing the entire forward pass to be captured in the CUDA graph. This optimization delivered a 7% improvement in Time Per Output Token (TPOT).

[](../assets/5090c19f019004c5.png)

  1. **Eliminating Device-to-Host Synchronization:** An unnecessary device-to-host memory sync was identified in the sampler, caused by how a tensor was being updated via a mask—a known issue in PyTorch. By refactoring the code to avoid this indexing pattern, the synchronization was eliminated. This change resulted in an 8% improvement in decoding speed for smaller models by allowing for better CPU and GPU workload overlap.

[](../assets/d07af4e856677ac9.png)

* * *

### **Main Takeaways**

  * **Expose Tuning Parameters Early:** Providing internal teams with direct access to key vLLM parameters like GPU_MEMORY_UTILIZATION and ENABLE_PREFIX_CACHING empowers them to optimize performance for their specific workloads without engine-level code changes.

  * **Architecture Matters:** Decoupling the application server (gRPC) from the inference engine (vLLM) via a standardized API (like OpenAI's) reduces maintenance overhead and improves system flexibility and scalability.

  * **Prefix Caching is Critical for Repetitive Workloads:** For use cases with high input token overlap, such as evaluating multiple candidates against the same job description, vLLM's prefix caching offers substantial reductions in prefill latency and GPU load.

  * **Targeted Profiling Yields Significant Gains:** Deep-dive profiling can uncover non-obvious bottlenecks. LinkedIn's contributions to optimize CUDA graph coverage and remove a device-to-host sync resulted in meaningful performance improvements (7-8%) and benefited the entire user community.

# References

  1. How we leveraged vLLM to power our GenAI applications at LinkedIn

#
