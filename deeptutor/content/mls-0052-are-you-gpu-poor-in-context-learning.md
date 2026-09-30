# 50. The Evolution of In-Context Learning: Implications for Machine Learning Engineers. 

*Machine Learning at Scale collection — Ludovico Bessi, 2024-08-18 · topic: llm*

*Why you don't necessarily need finetuning!*

[](../assets/7bc20d07436b79be.png)

# Introduction

Recent advancements in large language models (LLMs) have led to a significant shift in in-context learning (ICL) capabilities. As context lengths in modern models expand, we can now use ICL demonstrations that approach the size of entire training datasets. This article examines the findings from a recent study [1] on the effectiveness of long-context ICL across various datasets and models, focusing on the practical implications for Machine Learning Engineers (MLEs).

# The Paradigm Shift: From Short to Long-Context ICL

Traditionally, MLEs have favoured ICL for its simplicity and versatility. By including a few examples in the prompt, LLMs carn perform tasks accurately without model updates. However, the study in [1] explores new territory by examining ICL with context lengths of thousands of tokens, using models like Llama-2-7b and Mistral-7b.

Long-context ICL necessitates new approaches to prompt design. MLEs must consider how to effectively structure and order large numbers of examples within a single prompt. Context length becomes a crucial factor when choosing between models. Models with longer context windows (e.g. Gemini) may offer significant advantages for tasks that benefit from extensive in-context examples.

## Key Findings and Comparisons

### **Performance Scaling with Demonstrations** :

  * For datasets with large label spaces, model performance improves with hundreds or even thousands of in-context examples. This finding is particularly relevant for MLEs working on complex classification tasks or in domains with extensive taxonomies.

  * The study found diminishing returns for example retrieval methods as the number of examples increased, suggesting that simpler selection methods (e.g., random sampling) might be sufficient and computationally more efficient in long-context scenarios.

To further clarify the above statements. The first statement is about the general trend of model performance as the number of in-context examples increases. For tasks with large label spaces (many possible output categories), having more examples helps the model better understand and differentiate between the many possible outputs.

The second statement is specifically about how those examples are chosen. It suggests that as you include more examples, the method used to select those examples becomes less critical.

### Data Efficiency

  * ICL generally outperforms PEFT with fewer examples, making it suitable for low-data scenarios or rapid prototyping.

  * PEFT can surpass ICL when provided with sufficient data, especially for datasets with smaller label spaces.

### Inference Cost

  * ICL incurs higher inference costs due to processing many examples at runtime.

  * Finetuning offers reduced inference-time costs, making it preferable for large-scale deployment scenarios.

### Model Adaptability

  * ICL allows for on-the-fly task adaptation without model updates, providing greater flexibility.

  * Finetuning creates task-specific models, which can be more efficient but less adaptable.

### **Sensitivity and Efficiency** :

  * Long-context ICL is less sensitive to the order of examples compared to short-context ICL. This reduction in sensitivity allows for more flexible and efficient use of demonstrations.

  * Grouping same-label examples negatively impacts performance, reinforcing the need for diverse and representative example selection within the context window.

## Decision Framework

  * For tasks with limited labeled data or frequent dataset updates, prioritize ICL.

  * When working with stable, large datasets and smaller label spaces, consider PEFT for potentially superior performance.

  * Conduct a thorough cost-benefit analysis considering factors such as:

    * Frequency of model updates

    * Expected inference volume

    * Latency requirements

    * Computational resources available

  * For high-volume, latency-sensitive applications, lean towards finetuning approaches.

  * For scenarios requiring frequent model updates or task switching, ICL might be more suitable despite higher inference costs.

  * For multi-task or rapidly evolving environments, maintain a base ICL-capable model that can be quickly adapted to new tasks.

  * In stable, single-task production environments, invest in finetuned models for optimal performance and efficiency.

  * For large label spaces, consider long-context ICL as an alternative to finetuning, especially for rapid prototyping or when dealing with frequently changing datasets.

  * Implement adaptive strategies that can switch between retrieval-based and random sampling methods based on the context length and task complexity.

## Implementation Strategies

  1. **Hybrid Approaches** : Implement a system that uses both ICL and finetuning. Use ICL for rapid prototyping and handling edge cases, while deploying finetuned models for high-volume, stable tasks.

  2. **Automated ICL** : Create systems that automatically generate and update ICL prompts based on the latest data and task requirements. This can help maintain model relevance in dynamic environments.

  3. **Performance Monitoring** : Set up robust monitoring systems to track the performance of ICL vs. finetuned models across different tasks and data distributions. Use this data to inform dynamic switching between approaches.

# Conclusion

Long-context ICL offers new opportunities to improve model performance and adaptability. By understanding the trade-offs between ICL and finetuning, engineers can make informed decisions that balance performance, efficiency, and flexibility in their ML systems.

The ability to effectively use large numbers of in-context examples is becoming an increasingly valuable skill for MLEs. The challenge now is to develop innovative strategies to maximize the potential of this approach across various applications and deployment scenarios.

Congrats for making it all the way to the end!

Ludo

# References

  1. **In-Context Learning with Long-Context Models: An In-Depth Exploration**
