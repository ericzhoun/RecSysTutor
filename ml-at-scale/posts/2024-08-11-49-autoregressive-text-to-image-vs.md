---
title: "49. Autoregressive text-to-image vs Diffusion models."
subtitle: "A MLSys design perspective."
date: 2024-08-11
author: Ludovico Bessi
collection: Machine Learning at Scale
topics: [llm]
paywalled: false
words: 1333
---

# 49. Autoregressive text-to-image vs Diffusion models.

*A MLSys design perspective.*

*A MLSys design perspective.*

[![](../assets/d4bb811c6beaf770.png)](../assets/d4bb811c6beaf770.png)

# Introduction

In image generation, two key methods stand out: autoregressive text-to-image generation models and diffusion models.

This article compares these approaches, focusing on their impact on model architecture, training stability, and integration with existing machine learning infrastructure.

# Autoregressive text-to-image models.

Autoregressive models generate output sequentially, one element at a time, with each new element depending on the previously generated ones. In the context of image generation, these models predict image tokens in a manner similar to LLMs predict text tokens.

The process typically involves two key steps:

  1. **Image Tokenization** : The continuous image space is discretized into a finite set of "visual tokens" using techniques like Vector Quantized Variational Autoencoder (VQ-VAE). This process creates a visual vocabulary, where each token represents a small patch of the image.

  2. **Sequential Prediction** : The autoregressive model then learns to predict these visual tokens one by one, conditioned on the previous tokens and any input text description.

**The good:**

  1. **Easy Integration with LLM Infrastructure** : The major benefit of autoregressive image generation models is their compatibility with existing LLM infrastructure. These models predict image tokens in a manner similar to how LLMs predict text tokens, making them easy to integrate into existing LLM pretraining stacks.

  2. **Unified Approach to Multi-Modal Data** : By representing different modalities (text, image, audio) as sequences of discrete tokens, autoregressive models provide a unified approach to handling multi-modal data. This "tokens in, tokens out" paradigm simplifies the training process massively!

  3. **Training Stability** : Training autoregressive models tends to be more stable compared to diffusion models or GANs.

  4. **Compatibility with LLM Optimizations** : Since autoregressive image generation models are essentially standard transformers, they can benefit from the wide array of optimizations developed for LLMs. This includes techniques like FlashAttention for faster attention computation and speculative decoding for improved inference speed.

  5. **Superior Text Rendering** : These models seem to excel at rendering text within images. This makes intuitive sense given their token-by-token generation process, which can be thought of as generating patches of individual characters.

**The bad:**

The need for a high-quality Vector Quantized Variational Autoencoder (VQ-VAE) to compress images or audio into discrete tokens makes training such models a challenge.

The overall generation quality is upper-bounded by the performance of this quantizer. If this first stage is suboptimal, it can be challenging to generate high-quality images even with a strong transformer stage. 

When training Vision Language Models (VLMs) using the autoregressive approach, you potentially use much more compute by being multi-modal from the beginning. This is in contrast to training separate language and vision models and combining them later with some multi-modal data.

# Diffusion models

The diffusion process involves two main steps:

  1. **Forward Diffusion** : This is a fixed process that gradually adds Gaussian noise to an image over a number of timesteps, slowly destroying the structure in the data until it becomes pure noise.

  2. **Reverse Diffusion (Denoising)** : The model learns to reverse this process, starting from pure noise and gradually denoising it to produce a coherent image. This is the part that's learned during training.

During training, the model learns to predict the noise that was added at each step of the forward process. At inference time, we can start with pure noise and iteratively apply the learned denoising process to generate new images.

**The good:**

  1. **High-Quality Outputs** : Diffusion models have shown the ability to generate high-quality, diverse images that often surpass those produced by GANs or autoregressive models in terms of fidelity and realism.

  2. **Flexibility** : Unlike autoregressive models, diffusion models don't rely on a discrete tokenization of the input space. This allows them to work directly with continuous data, potentially capturing finer details.

  3. **Controllability** : The step-by-step generation process of diffusion models allows for more fine-grained control over the generation process. This can be leveraged for tasks like image inpainting or targeted editing.

  4. **Scalability** : Diffusion models have shown impressive scaling properties

  5. **Quality:** Larger models and longer diffusion processes generally lead to higher quality outputs.

**The bad:**

  1. **Inference speed** : The iterative denoising process is prone to high latency, especially for high-resolution images or long diffusion processes.

  2. **Hyperparameter Sensitivity** : The performance of diffusion models can be sensitive to the choice of noise schedule and other hyperparameters, requiring careful tuning.

  3. **Lack of Native Multimodality** : Unlike autoregressive models that can naturally handle multiple modalities as token sequences, diffusion models typically require specific architectures or training procedures to handle multiple modalities.

## Comparing Autoregressive and Diffusion Approaches

  1. **Integration with Existing Infrastructure** : Autoregressive models have an edge here, as they can leverage existing LLM infrastructure more easily. Diffusion models often require specialized architectures and training procedures.

  2. **Training Stability** : Autoregressive models tend to be more stable during training. Also, diffusion models require careful tuning of the noise schedule and other hyperparameters.

  3. **Compute Requirements** : Training Vision Language Models (VLMs) using the autoregressive approach potentially uses more compute by being multi-modal from the beginning. Diffusion models might be more efficient in this regard, especially when using latent diffusion approaches. However, the iterative generation process of diffusion models can make inference more computationally expensive.

  4. **Quality Dependence** : The quality of autoregressive models heavily depends on the initial tokenization step (e.g., VQ-VAE). If this step is suboptimal, it can limit the overall image quality regardless of the strength of the transformer stage. Diffusion models don't have this particular constraint, potentially allowing for higher fidelity outputs.

  5. **Flexibility** : Diffusion models don't rely on tokenization of input data, which can be an advantage in scenarios requiring fine-grained control or when working with continuous data. However, autoregressive models offer more natural handling of multiple modalities.

  6. **Inference Speed** : Autoregressive models generate images faster, especially with optimizations like speculative decoding. Diffusion models, due to their iterative generation process, can be slower at inference time.

  7. **Controllability** : Diffusion models offer fine-grained control over the generation process due to their step-by-step generation. This can be advantageous for tasks like image editing or inpainting. Autoregressive models, while less granular, offer natural control over the generation sequence.

## Challenges and Considerations for ML Systems Practitioners

  1. **Infrastructure Requirements** : Implementing and scaling diffusion models may require significant changes to existing ML infrastructure, especially if it's optimized for transformer-based models. Autoregressive models might be easier to integrate but could strain systems not designed for multi-modal data.

  2. **Data Processing** : Autoregressive models require a tokenization step for images, which adds complexity to the data processing pipeline. Diffusion models work with raw pixel data instead.

  3. **Model Serving** : The iterative nature of diffusion models can make them challenging to serve efficiently, potentially requiring specialized optimizations or hardware. Autoregressive models are easier to serve using existing LLM infrastructure but could face challenges with latency for larger images.

  4. **Monitoring and Debugging** : The black-box nature of both approaches, especially diffusion models, can make monitoring and debugging challenging.

# Case in point: VideoPoet from Google Research!

🥇 "Best Paper of ICML Award 2024" goes to VideoPoet from Google Research and describes a tokenizer vision model!

  1. Tokenize the input of any modality like text, image, video, audio.

  2. Use existing LLM architectures for autoregressive training (next token prediction).

  3. During inference, the LLM outputs a mixture of tokens of different modalities.

  4. The generated tokens are used to synthesize videos.

# Conclusion

The choice between autoregressive and diffusion models for image generation isn't straightforward and depends on various factors including your existing infrastructure, specific use case requirements and resource constraints.

As ML systems practitioners, it's crucial to consider not just the model architecture but also the entire pipeline from data processing to model serving. Factors like infrastructure compatibility, scalability, inference speed, and ease of monitoring and debugging should all play a role in the decision-making process.

You got all the way to the end! Someone you know might like it as well!
