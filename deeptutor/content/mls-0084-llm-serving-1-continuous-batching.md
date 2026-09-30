# LLM serving (1): Continuous batching

*Machine Learning at Scale collection — Ludovico Bessi, 2025-04-06 · topic: serving*

# Introduction

In this series of article I will discuss LLM inference techniques that have stood the test of time.

Less noise more value? You know what to do!

# Technique 1: Continuous batching

**The Problem with traditional batching:**

  1. **LLM Inference is Sequential:** Generating text with an LLM is an iterative process. To generate the next token, the model needs the previously generated tokens (stored in its KV cache).

  2. **Requests vary in length:** Users send prompts of different lengths, and the desired output lengths also vary greatly.

  3. **Traditional batching:** To improve GPU utilization, multiple requests are grouped (batched) together and processed simultaneously. The GPU performs calculations for all requests in the batch at each step.

  4. **The Bottleneck:** In _static_ batching, the entire batch must wait until _all_ sequences in that batch have finished generating their required number of tokens. If one request needs 500 tokens and the others only need 50, the shorter requests (and the GPU resources allocated to them) sit idle waiting for the longest one to complete. This leads to:

     * **High Latency:** Short requests wait unnecessarily long.

     * **Inefficient GPU Utilization:** Resources are tied up by completed sequences.

     * **Padding Waste:** Shorter sequences often need to be padded to match the length of others in the batch during certain computations, wasting computation.

**Continuous Batching**

Continuous batching is a more advanced scheduling technique designed specifically to overcome the limitations of static batching for LLM inference.

**Core idea:** Decouple the batch processing from the lifecycle of individual requests. Instead of waiting for the _entire batch_ to finish, process the batch _one token generation step at a time_ and dynamically manage which sequences are included in the computation at each step.

**How it Works:**

  1. **Request queue:** Incoming inference requests are placed in a waiting queue.

  2. **Iteration-level scheduling:** The inference server operates step-by-step (generating one token for active sequences per step).

  3. **Dynamic batch composition:**

     * At the beginning of each generation step, the scheduler checks if any sequences in the _currently active batch_ on the GPU have finished generating their required output length.

     * **Finished sequences are immediately removed** from the active batch, freeing up their resources (especially their KV cache memory).

     * The scheduler then checks the waiting queue. If there are waiting requests and available capacity (GPU memory/compute slots) in the active batch (due to finished sequences or the batch not being full), **new requests are added** to the active batch.

  4. **Continuous processing:** The GPU then performs the computation for the _current set_ of active sequences to generate their _next_ token. This cycle repeats.

**Benefits of Continuous Batching:**

  1. **Significantly higher throughput:** The GPU is kept busy more consistently as new requests can start as soon as resources are freed. Much less idle time compared to static batching.

  2. **Lower average latency:** Requests finish and return results as soon as their generation is complete, without being held up by longer requests in some initial, static group.

  3. **Improved GPU utilization:** Resources are quickly recycled, leading to more efficient use of expensive hardware.

  4. **Handles variable loads netter:** Adapts dynamically to mixes of short and long requests.

**Implementation:**

Implementing continuous batching requires sophisticated management of the GPU memory (especially the KV cache for each sequence) and a smart scheduler. Systems like:

  * **vLLM (with PagedAttention):** A very popular library that uses PagedAttention (a memory management technique) to efficiently manage the KV cache, making continuous batching highly effective.

  * **TensorRT-LLM:** NVIDIA's library for optimizing LLM inference, which includes implementations of continuous batching (often referred to as in-flight batching).

  * **Text Generation Inference (TGI):** Hugging Face's inference server, which also implements continuous batching.

In summary, continuous batching is a crucial optimization technique for LLM inference servers that dynamically manages batches at the token generation level, allowing requests to enter and leave the batch independently, leading to much higher throughput and lower average latency compared to traditional static batching.

# Technique 2: Paged attention 

That’s coming in the next article :)

# References

  1. Continuous batching

#
