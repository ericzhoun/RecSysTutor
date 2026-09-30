# Kunlun Breakdown: Unlocking Predictable Scaling Laws in Massive Recommender Systems

*Machine Learning at Scale collection — Ludovico Bessi, 2026-06-28 · topic: recsys*

*The new Kunlun architecture reframes attention to push hardware utilization from 17% to 37%.*

[](../assets/f2c3ee4cd90bc73a.png)

# TL;DR

Meta researchers introduced the Kunlun architecture to solve scaling inefficiencies in joint sequence and non-sequence recommendation models. By reframing personalized feedforward networks as attention operators and implementing aggressive layer-skipping, the authors doubled scaling efficiency and pushed Model FLOPs Utilization (MFU) from 17% to 37% on NVIDIA B200 GPUs.

# Introduction

While scaling laws are well-documented for large language models, they remain elusive for massive-scale click-through rate (CTR) prediction systems. The primary bottleneck happens when models must jointly process sequential user histories and non-sequential static context features. Combining these heterogeneous features usually destroys hardware utilization. Recommender systems typically idle around 3 to 15 percent MFU compared to the 40 to 60 percent seen in LLMs. The operations are highly memory-bound due to irregular tensor shapes and small embedding dimensions. Furthermore, naively scaling all layers and components equally leads to severe diminishing returns. In a recent paper, Meta researchers detail Kunlun, an architecture that bridges this gap through a co-design of low-level kernel optimizations and high-level compute reallocation.

# The Core Architecture and Mechanics

The authors tackle the scaling problem on two fronts. The first is at the module level, specifically aimed at fixing the memory-bandwidth bottleneck of Personalized FeedForward Networks (PFFN). PFFNs are typically used to transform sequence embeddings using non-sequence context, but they rely on small, non-fusible back-to-back matrix multiplications. 

The authors solved this by introducing Generalized Dot-Product Attention (GDPA). They mathematically reframed the PFFN transformation as a multi-head cross-attention operator. In this setup, the input sequence serves as the query, while the context-generated weights act as the key and value. This abstraction allows them to fuse the entire operation into a single FlashAttention-style kernel. By applying a block-wise execution strategy and keeping intermediate tensors out of HBM, they converted a memory-bound operation into a compute-bound one.

Alongside GDPA, the architecture uses Hierarchical Seed Pooling (HSP) to compress long sequences. Instead of using traditional random queries, HSP initializes learnable seed embeddings and compresses the sequences using a Kronecker product-based layer. This rank-k Kronecker structure maintains cross-dimensional expressiveness while drastically reducing parameter count. For sequence modeling, they drop O(T^2) full self-attention for a sliding window approach, restricting attention to local temporal windows where relevance is highest.

The second front is macro-level compute routing. The authors implement Computation Skip (CompSkip), an alternating pattern based on the observation that deep recommendation models suffer from layer redundancy. 

\- Even layers skip self-attention and compute fresh sequence summaries. 

\- Odd layers skip the summarization, reuse the previous layer’s output, and run self-attention. 

Finally, they use Event-Level Personalization to route compute based on signal quality. A high-signal click event gets routed through wider dimensions, more attention heads, and deeper layers, while a noisy impression event passes through a much cheaper configuration.

# Production Impact

The most immediate takeaway from this paper is the raw infrastructure efficiency. Pushing MFU from 17 to 37 percent on a B200 cluster translates to massive capital expenditure savings. The GDPA mechanism proves that simply porting LLM architectures to recommendation systems does not work. You have to reshape the mathematical operators to fit modern GPU execution pipelines if you want high hardware utilization. 

Because of the CompSkip alternating layer design, the authors report a 43 percent reduction in FLOPs and a 35 percent improvement in QPS without degrading Normalized Entropy. The model avoids wasting compute on redundant local refinements.

More broadly, this architecture achieves a 2x scaling efficiency improvement over prior state-of-the-art like InterFormer. The performance gains per unit of log-scaled compute are now predictable. For engineering teams managing massive ranking systems, this shifts architectural decisions away from empirical trial-and-error. By establishing reliable power-law scaling across both depth and width, teams can accurately forecast the ROI of adding compute or layers before a training run even begins.

# References

  1. Kunlun: Establishing Scaling Laws for Massive-Scale Recommendation Systems through Unified Architecture Design
