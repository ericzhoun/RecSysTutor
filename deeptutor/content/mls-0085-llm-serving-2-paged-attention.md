# LLM Serving (2): Paged attention

*Machine Learning at Scale collection — Ludovico Bessi, 2025-04-13 · topic: serving*

# Introduction

In today’s article I will discuss Paged attention mechanism specifically focused on how to store and access the KV cache efficiently in GPU memory.

# Technique 2: Paged attention

**1\. Context: KV Cache Memory in LLM Inference**

During autoregressive inference, LLMs maintain a Key-Value (KV) cache for the attention mechanism. This cache stores the computed key and value vectors for previously processed tokens in a sequence, avoiding redundant computation. 

The size of the KV cache for a given sequence grows linearly with the sequence length. In multi-tenant serving scenarios, especially those employing continuous batching, the system must manage numerous KV caches concurrently, each with a dynamically changing size.

**2\. The Problem: Memory Fragmentation with Contiguous Allocation**

Traditional GPU memory allocators typically provide contiguous blocks of memory. When managing dynamic KV caches using contiguous allocation:

  * **Allocation:** Requesting memory for a new sequence requires finding a single, continuous free block large enough to hold its potential maximum KV cache size, or its current size with potential for reallocation upon growth.

  * **Deallocation:** Completing a sequence frees its contiguous block.

  * **Fragmentation:** Frequent allocation and deallocation of these variably sized blocks lead to severe **external fragmentation**. The total available GPU memory becomes segmented into numerous small, non-contiguous free blocks. Even if the _sum_ of free memory is substantial, it may be impossible to allocate a sufficiently large _contiguous_ block for a new or growing KV cache. This significantly underutilizes GPU memory capacity and limits the effective batch size.   
**Internal fragmentation** can also occur if memory is overallocated initially to avoid frequent reallocations.

**3\. PagedAttention: Mechanism**

PagedAttention implements a memory management strategy analogous to virtual memory paging in operating systems to specifically handle the LLM KV cache.

  * **Fixed-Size Blocks (Pages):** The fundamental unit of memory management is a fixed-size block (page) of GPU memory. The KV cache for _any_ sequence is stored across one or more of these blocks.

  * **Non-Contiguous Physical Storage:** These physical blocks allocated to a single sequence do not need to reside contiguously in the GPU's physical address space. They can be scattered throughout the available memory.

  * **Logical-to-Physical Mapping:** A per-sequence data structure, typically a **block table** (or page table), maintains the mapping between the logical indices of the KV cache (corresponding to token positions) and the physical addresses of the blocks storing the relevant key and value vectors. For instance, logical block i of a sequence might map to physical block p located at a specific address in GPU memory.

  * **Central Block Management:** A system-level manager tracks the status (free or allocated) of all physical blocks in the designated memory pool.

**4\. Addressing Fragmentation via PagedAttention**

PagedAttention fundamentally avoids the fragmentation issues associated with contiguous allocation:

  * **Allocation:** To allocate memory for a sequence's KV cache (or extend it), the system requests the required number of _fixed-size_ physical blocks from the central manager. These blocks can be located anywhere in the free pool. The block table for the sequence is updated with the physical addresses of the allocated blocks. The allocation process becomes finding N free blocks, rather than one contiguous block of size N * block_size.

  * **Deallocation:** When a sequence completes, the physical blocks assigned to it (tracked via its block table) are simply returned to the free pool managed by the central manager.

  * **Elimination of External Fragmentation:** Since allocation works with small, fixed-size units that can be non-contiguous, the problem of unusable gaps between larger allocated blocks is eliminated. Any free block is usable.

  * **Minimization of Internal Fragmentation:** Internal fragmentation is confined to potentially unused space within the _last_ block allocated to a sequence, which is minimal due to the relatively small, fixed block size.

**5\. Technical Benefits and Implications**

  * **Near-Optimal Memory Utilization:** Enables the use of almost the entire available GPU memory pool, as fragmentation is no longer a limiting factor.

  * **Increased Batch Capacity:** Allows significantly more sequences to be processed concurrently within the same GPU memory footprint.

  * **Efficient Dynamic Allocation/Deallocation:** Block allocation/deallocation operations are computationally inexpensive (typically involving list manipulations or bitmap updates and table lookups), supporting the high frequency required by continuous batching.

  * **Enables Efficient Sharing (e.g., Prefix Caching):** Sharing common prefixes (like prompts) among multiple sequences becomes straightforward. Multiple sequence block tables can simply point to the same physical blocks containing the shared KV cache data, achieving memory savings without complex copying or management overhead. Reference counting on physical blocks handles deallocation correctly.

# Technique 3: Speculative decoding

That’s coming in the next article :)

# References

  1. Paged attention
