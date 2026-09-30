# How Block Diffusion Bridges AR and Diffusion Models

*Machine Learning at Scale collection — Ludovico Bessi, 2025-06-22 · topic: llm*

*interpolating between autoregressive and diffusion language models*

[](../assets/85f0460cdaa23a90.png)

# Introduction

"Block Diffusion: Interpolating Between Autoregressive and Diffusion Language Models," introduces a hybrid architecture, **Block Discrete Denoising Diffusion Language Models (BD3-LMs)** , that aims to combine the strengths of autoregressive (AR) and diffusion models while mitigating their respective weaknesses.

#### **The Core Problem: A Tale of Two Paradigms**

  * **Autoregressive (AR) Models:** Excel at likelihood modeling (low perplexity) and naturally support variable-length generation and efficient inference via KV caching. However, their sequential, token-by-token generation process is inherently slow.

  * **Discrete Diffusion Models (D3PMs):** Offer the potential for highly parallelized generation (decoding many tokens at once) and greater controllability. Their main drawbacks are lagging perplexity, an inability to use KV caching (due to bidirectional context), and a rigid fixed-length generation format.

# Block diffusion: Semi-Autoregressive Diffusion

The core idea is to be autoregressive at the **block level** and use diffusion _within_ each block.

  1. A sequence x is partitioned into B blocks of L' tokens each.

  2. The model defines an autoregressive probability distribution over these blocks:  
p(x) = Π p(x_b | x_<b)

  3. Each conditional probability p(x_b | x_<b) is modelled by a separate **discrete denoising diffusion process**. A single Transformer with a **block-causal attention mask** parameterizes all these conditional diffusion models.

This structure immediately unlocks two key features:

  * **Variable-Length Generation:** To generate a longer sequence, simply generate more blocks autoregressively.

  * **KV Caching:** When generating block b, the previous blocks x_<b are clean and fixed. Therefore, their key-value pairs from the self-attention layers can be cached and reused, just as in a standard AR model.

#### **Technical Challenge 1: Efficient Training**

A naive training implementation would be inefficient. The loss for block b requires conditioning on the _clean_ previous blocks x_<b while denoising a _noisy_ version of the current block x_b_t. This suggests a separate forward pass for each block, which is computationally prohibitive.

The paper proposes an efficient training algorithm:

  1. **Logical Two-Pass Process:**

     * **Pass 1 (Caching):** A full forward pass on the clean sequence x is performed to pre-compute and cache the keys and values for all blocks, K_1:B and V_1:B.

     * **Pass 2 (Denoising):** For each block b, the model's denoiser head x_θ takes the noised block x_b_t and the pre-computed clean cache K_1:b-1, V_1:b-1 as input to predict the logits for x_b.

  2. **Vectorized Implementation:** To avoid an explicit loop, this process is implemented in a single forward pass. The input to the Transformer is a concatenation of the noised sequence and the clean sequence: x_noisy ⊕ x. A specialized attention mask ensures that noised tokens in a block b can attend to other noised tokens within their block and to all _clean_ tokens in the preceding blocks x_<b from the concatenated sequence. This allows for parallel computation of the loss across all blocks while respecting the causal conditioning structure.

#### **Technical Challenge 2: The Perplexity Gap and Gradient Variance**

Even with a block size of one (L'=1), where the Block diffusion objective is equivalent in expectation to the AR next-token prediction objective, it still yields significantly worse perplexity.

The root cause is **high gradient variance**.

  * **The Cause:** In a masked diffusion model, the loss is typically calculated only for the tokens that are masked. With a standard linear noise schedule (sampling noise level t ~ U[0,1]), on average 50% of tokens are masked. This is analogous to training an AR model on a random half of the tokens in each batch. This subsampling induces high variance in the gradient estimator, leading to less stable training and poorer convergence.

  * **The Solution: Low-Variance Noise Schedules.** "clipped" noise schedules are used. Instead of sampling the mask rate from U[0, 1], they sample it from a narrower, optimized range U[β, ω]. The intuition is to avoid extreme masking rates:

    * Masking too few tokens is an easy task with low learning signal.

    * Masking almost all tokens is also an easy task (the model just learns to predict the marginal token distribution).

  * **Data-Driven Optimization:** Crucially, the optimal [β, ω] range is not fixed but is learned adaptively. The paper proposes a grid search during training to find the clipping range that directly minimizes the variance of the loss estimator Var[L(X; θ)]. This approach ensures the noise schedule is tailored to the model and data, significantly reducing variance and closing the perplexity gap.

# Conclusion

  * **State-of-the-Art Perplexity:** Block diffusion sets a new SOTA for discrete diffusion models.

  * **Effective Variable-Length Generation:** The model successfully generates sequences up to 10x longer than fixed-length diffusion models and approaches the coherence of AR models.

  * **Superior Sample Efficiency:** Compared to semi-autoregressive models based on Gaussian diffusion, block diffusion produce higher-quality samples with an order of magnitude fewer function evaluations.

  * **Supports for KV caching:** Its block-autoregressive structure allows it to cache Key-Value pairs from previously generated blocks, eliminating redundant computations. This brings the inference efficiency of traditional AR models to the diffusion paradigm, overcoming a major limitation of prior diffusion architectures.

# References

  1. Block diffusion
