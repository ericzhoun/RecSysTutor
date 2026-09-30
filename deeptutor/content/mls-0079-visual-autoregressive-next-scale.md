# Visual AUTOREGRESSIVE next-scale predictions

*Machine Learning at Scale collection — Ludovico Bessi, 2025-03-02 · topic: llm*

*Don't bet against MLSys bag of tricks*

[](../assets/e33cbcc2204ec5e4.png) From [1]

# VAR: Next-Scale Prediction Revolutionizes Autoregressive Image Generation

### Rethinking Autoregression: From Next-Token to Next-Scale

Traditional AR models for images, like VQGAN and DALL-E, operate by tokenizing an image into a 1D sequence and predicting the next token in this sequence. This approach, while conceptually simple, suffers from several drawbacks:

  1. **Violation of Autoregressive Premise:** The 1D token sequence often retains bidirectional correlations inherent in the original 2D image, contradicting the unidirectional dependency assumption of AR models.

  2. **Limited Zero-Shot Generalization:** The unidirectional nature restricts the model's ability to perform tasks requiring bidirectional reasoning, such as inpainting from the bottom up.

  3. **Loss of Spatial Structure:** Flattening the 2D token grid into a 1D sequence disrupts the crucial spatial relationships between neighbouring tokens.

  4. **Computational Inefficiency:** Generating an image token sequence of length n squared with self-attention transformers requires O(n^2) autoregressive steps.

VAR addresses these limitations by introducing "next-scale prediction" paradigm. Instead of predicting individual tokens, VAR predicts entire token maps at progressively higher resolutions. An image is first encoded into K multi-scale token maps (r1, r2, ..., rK) using a multi-scale VQ-autoencoder.

The autoregressive process then predicts each token map conditioned on all previous ones (r1, r2, ..., rk-1), essentially predicting the next finer scale of the image.

### Key Advantages of Next-Scale Prediction

This "next-scale" approach offers several significant advantages:

  1. **Alignment with Autoregressive Principles:** By ensuring each r_k depends solely on its prefix (r1, r2, ..., r_(k-1)), the approach adheres to the unidirectional dependency inherent in autoregressive modeling.

  2. **Preservation of Spatial Locality:** VAR maintains the 2D structure of token maps throughout the generation process, preserving spatial relationships. The multi-scale nature further reinforces the spatial structure of the generated images.

  3. **Enhanced Efficiency:** Parallel token generation within each scale significantly reduces the computational complexity. Generating an image with n × n latent tokens now requires only O(n to the power of 4) computations, compared to O(n to the power of 6) for traditional AR models.

### Multi-Scale VQ-Autoencoder: The Foundation of VAR

The VAR framework relies on a specialized multi-scale VQ-autoencoder to generate the hierarchical token maps. This autoencoder shares the same architecture as VQGAN but incorporates a modified multi-scale quantization layer.

A residual-style design, similar to RQ-Transformer, enhances performance during upsampling. 

### Transformer Architecture and Training

The core of the VAR model is a standard decoder-only transformer, with adaptive normalization (AdaLN). 

The model architecture follows a simple scaling rule where the width, head counts, and dropout rate are linearly scaled with the depth.

Notably, advanced techniques used in LLMs, such as RoPE, SwiGLU, or RMS Norm, are not employed, demonstrating the inherent strength of the VAR approach.

### Empirical Validation: Surpassing Diffusion Models

VAR models were evaluated on ImageNet 256×256 and 512×512 conditional generation benchmarks. The results are quite good:

  * **State-of-the-Art Performance:** VAR significantly outperforms existing AR models and, for the first time, surpasses diffusion transformers like DiT in terms of FID, IS, precision, and recall. A VAR model with 2B parameters achieves an FID of 1.73 and an IS of 350.2 on ImageNet 256×256, outperforming DiT-L/2, L-DiT-3B, and L-DiT-7B.

  * **Remarkable Efficiency:** VAR is approximately 20 times faster than traditional AR models like VQGAN, achieving inference speeds comparable to efficient GAN models. This is achieved with complexity of O(n to the power of 4) to generate an image with n × n latent tokens compared to O(n to the power of 6) for traditional AR models.

  * **Data Efficiency:** VAR requires significantly fewer training epochs than DiT (350 vs. 1400).

  * **Scalability:** Unlike DiT, which shows diminishing returns beyond 675M parameters, VAR exhibits consistent performance improvements with increasing model size.

### Scaling Laws: A Glimpse into Predictable Performance

One of the most exciting findings is that VAR models exhibit clear power-law scaling laws, similar to those observed in LLMs. Experiments with models ranging from 18M to 2B parameters demonstrate a strong linear relationship between model size and test loss (and token error rate) on a logarithmic scale.

These scaling laws imply that the performance of larger VAR models can be accurately predicted from smaller ones, enabling more efficient resource allocation and guiding the development of even more powerful models.

### The Rise of Autoregressive Models and the Token Paradigm (a personal pet peeve of mine ahah)

The success of VAR adds to the growing body of evidence suggesting that autoregressive models, particularly those leveraging tokenization, are here to play an increasingly important role in various domains.

With the continued development of MLSys optimizations that efficiently handle tokenized data, the computational challenges associated with autoregressive models are gradually diminishing.

The findings presented in this paper reinforce the notion that tokens are not just a passing trend, but a fundamental building block for future AI systems, enabling efficient training and remarkable generalization capabilities. The inherent flexibility of autoregressive models in handling sequential data, combined with the demonstrated scalability and zero-shot abilities, makes them a compelling choice for a wide range of tasks beyond language modeling.

### Limitations and Future Directions

While VAR represents a significant advancement, there are still areas for future exploration:

  * **Tokenizer Improvements:** The current work primarily focuses on the VAR framework itself, using a relatively standard VQVAE architecture. Exploring more advanced tokenizers could further enhance performance.

  * **Text-to-Image Generation:** Integrating VAR with LLMs to enable text-to-image generation is a natural next step.

  * **Video Generation:** Extending VAR to the video domain by formulating a "3D next-scale prediction" is a promising avenue, potentially offering advantages in temporal consistency and integration with LLMs.

### Conclusion

VAR represents a paradigm shift in autoregressive image generation.

By introducing the concept of next-scale prediction, it overcomes the limitations of traditional AR models and achieves state-of-the-art performance, surpassing even the most advanced diffusion models. The observed scaling laws and zero-shot generalization capabilities further highlight the potential of VAR to become a dominant force in the field of generative AI.

Hope you enjoyed :)

# References

  1. Visual autoregresssive next-scale prediction
