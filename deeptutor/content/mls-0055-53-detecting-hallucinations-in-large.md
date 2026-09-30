# 53. Detecting hallucinations in large language models using semantic entropy.

*Machine Learning at Scale collection — Ludovico Bessi, 2024-09-08 · topic: llm*

*Yet another simple but effective technique to improve models!*

[](../assets/92cbac3730651ac6.png)From [1]

# Introduction

LLMs often suffer from "hallucinations" - generating false or unsubstantiated information. When LLMs produce fluent but arbitrary and incorrect inputs, those hallucinations are called “confabulations”. In [1], a statistical based approach to detect them is proposed.

The technique is surprisingly simple and effective! Let’s dive into it!

# The technique

The core of the proposed method revolves around the concept of "semantic entropy." This approach aims to measure uncertainty at the level of meaning rather than specific word sequences. Here's a detailed breakdown of the technique:

  1. **Sampling** :

     * For a given input (e.g., a question), the system generates multiple possible answers using the LLM.

     * The number of samples can vary, but the researchers found that 10 generations provide a good balance between performance and computational cost.

  2. **Semantic Clustering** :

     * The generated answers are clustered based on their meanings, not their exact wording.

     * Clustering is determined by bidirectional entailment: if two sentences imply each other, they are considered to be in the same semantic cluster.

     * The researchers use general-purpose LLMs to assess entailment.

  3. **Entropy Calculation** :

     * Entropy is calculated over the semantic clusters rather than individual word sequences.

     * This approach addresses the issue of different phrasings conveying the same meaning, which can lead to misleadingly high entropy in naive approaches.

     * High entropy indicates high uncertainty, potentially signaling a confabulation.

  4. **Confabulation Detection** :

     * By setting appropriate thresholds on the semantic entropy, the system can identify inputs likely to produce confabulations.

     * The method can be used to either flag potentially unreliable outputs or to refuse to answer questions that are likely to cause confabulations.

  5. **Discrete Variant** :

     * The researchers also introduced a discrete variant of their semantic entropy estimator.

     * This variant allows the method to be applied even when access to model probabilities is limited, as is the case with some closed-source models like GPT-4.

     * The discrete variant operates as follows:

       * Instead of using continuous probabilities, it treats each generated answer as a single 'vote' for its semantic cluster.

       * It approximates the probability distribution over semantic clusters using these discrete votes.

       * The entropy is then calculated over this discrete approximation of the distribution.

     * The discrete variant performs similarly to the standard estimator, despite not requiring exact output probabilities.

  6. **Application to Longer Texts** :

     * For longer generations, such as paragraphs, the method is adapted by breaking down the text into individual factual claims.

     * Questions are reconstructed from these claims, and semantic entropy is computed for each question.

     * The overall uncertainty score for a proposition is then calculated by averaging the semantic entropy over all related questions.

  7. **Performance and Evaluation** :

     * The semantic entropy approach consistently outperforms baselines, including naive entropy estimation, supervised methods, and techniques like P(True) across various datasets and model sizes.

  8. **Robustness and Generalization** :

     * The method works across different LLM architectures (e.g., LLaMA, Falcon, Mistral) and scales (from 7B to 70B parameters).

     * It generalizes well to new tasks and domains not seen during development, making it particularly valuable for real-world applications where distribution shifts are common.

  9. **Limitations** :

     * While effective for confabulations, the method may not address other types of errors, such as consistent mistakes learned from training data or systematic reasoning errors.

     * The effectiveness of semantic clustering can be context-dependent, especially in subtle cases where the relevance of certain distinctions may vary.

# Conclusions

By focusing on the meaning of generated content rather than its exact wording, this method offers a more robust and generalizable approach to uncertainty estimation in language models.

Implementing semantic entropy-based confabulation detection could help filter out unreliable outputs, enhancing the overall quality and safety of applications built on top of LLMs.

However, it's important to note that this method specifically targets confabulations - arbitrary and incorrect generations - and may not address other types of errors or biases in LLMs. As such, it should be seen as one tool in a broader toolkit for ensuring AI safety and reliability.

Are you going to implement it in your own LLM pipelines? :)

Ludo

# References

  1. **Detecting hallucinations in large language models using semantic entropy**
