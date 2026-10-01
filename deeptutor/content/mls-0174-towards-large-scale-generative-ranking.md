# Towards Large-scale Generative Ranking

*Machine Learning at Scale collection — Ludovico Bessi, 2025-11-26 · topic: recsys*

[](../assets/d8691df18c92dee1.png)

**TL;DR:**
Why generative ranking works? How to make it production ready?

The auto-regressive **architecture** , not the training paradigm, is the primary source of effectiveness.

To overcome efficiency bottlenecks, engineers at Xiaohongshu introduce **GenRank** , an architecture that halves the effective sequence length by treating items as context and generating actions. Combined with efficient, parameter-free position biases (ALiBi), GenRank achieves a **94.8% training speed-up** over the baseline with better offline AUC. In online A/B tests on tens of millions of users, it delivered significant engagement lifts with comparable resource costs and a **> 25% improvement in P99 response time**.

# **The Generative Paradigm**

[](../assets/3299efc9f84016ae.png)

Industrial recommender systems are typically multi-stage cascades, with the ranking stage acting as the final, fine-grained arbiter of what a user sees. While generative models have shown promise, their application in large-scale ranking has been under-explored. The team at Xiaohongshu (creators of RedNote) moved beyond simply proposing a new model to ask two fundamental system design questions:

  1. What are the core mechanisms that make the generative paradigm effective for ranking?

  2. How can we design a generative architecture that meets the stringent efficiency demands of a system serving hundreds of millions of users?

They found that the auto-regressive nature of the Transformer decoder is critical; attempts to use fully-visible attention masks (like in T5-style encoders) led to significant performance degradation.

Interestingly, the common generative practice of grouping user behaviors into a single training sample offered negligible benefits over a traditional point-wise approach, pointing squarely at the model architecture itself as the key driver of performance. This insight shifts the focus from complex data pipelines to architectural innovation.

# **Action-Oriented Generation**

A major obstacle for generative rankers like HSTU is efficiency. By interleaving items and user actions (item_1, action_1, item_2, action_2...), they effectively double the sequence length fed into the attention mechanism.

GenRank introduces a fundamental architectural shift to an **action-oriented organization**. Instead of generating a sequence of items and actions, the model is reframed to **generate a sequence of actions conditioned on a sequence of items**.

  * **System Design:** Items are treated as positional, contextual information. The input representation for each token becomes the sum of its item embedding and its corresponding action embedding (E_i = emb(item_i) + emb(action_i)).

  * **Inference:** For candidate items, a shared mask embedding is used in place of an action embedding (E_candidate = emb(item_candidate) + MASK). The model then predicts the action for each candidate.

  * **The Payoff:** This design immediately **halves the input sequence length** for the attention mechanism. This translates to a theoretical **75% reduction in attention computation** and a 50% reduction in linear projection costs, providing a massive efficiency boost without sacrificing the model’s expressive power. It’s a prime example of aligning the model architecture with the specific constraints and goals of the ranking task.

# **Efficiently Encoding Time and Position**

Another critical performance bottleneck is the encoding of positional and temporal information. Learnable relative attention biases, while effective, introduce quadratic I/O overhead as the attention bias matrix must be stored and accessed. This becomes prohibitive as context windows grow.

GenRank replaces this with a multi-pronged, I/O-efficient approach that scales linearly:

  1. **Linear Embeddings:** They use separate, learnable embeddings for absolute position, request index (grouping items from the same user request), and pre-request time gaps (capturing user activity cadence). These are simply added to the input representation.

  2. **Parameter-Free Interaction:** To re-introduce the crucial interaction between time and position, they adopt **ALiBi (Attention with Linear Biases)**. ALiBi is a parameter-free method that penalizes attention scores based on the distance between query and key tokens. It doesn’t require storing a large bias matrix or backpropagating gradients through it.

  3. **System Integration:** The team fused ALiBi directly into their flash attention kernel, adding the bias with minimal computational overhead.

This combination of linear embeddings and a parameter-free bias mechanism provides the necessary temporal and positional signals without the quadratic scaling costs, making long-sequence modeling feasible in production.

# **Main Takeaways for MLEs**

  * **Architecture is the Key Lever:** When adopting new paradigms, rigorously test your assumptions. The Xiaohongshu team proved that the auto-regressive architecture, not the training data organization, was the source of gains. This allows for simplifying the data pipeline.

  * **Align Architecture with the Task:** The “action-oriented” design is a brilliant insight. By rethinking the sequence generation task (from generating item, action pairs to generating actions for a given item sequence), they directly addressed the primary computational bottleneck (sequence length) of the ranking stage.

  * **Scrutinize Every Quadratic Operation:** At scale, any O(N^2) operation is a liability. Replacing learnable relative position biases with a combination of linear embeddings and a parameter-free bias like ALiBi is a powerful pattern for building efficient, large-context models.

  * **Content Embeddings Shine in Generative Models:** The finding that frozen content embeddings provided over twice the AUC lift in the generative paradigm is a strong signal. The architectural consistency between the generative pre-training of embeddings and the generative ranking task allows the model to better leverage world knowledge. This suggests prioritizing high-quality, pre-trained multimodal embeddings when building generative rankers.

  * **Reduced Feature Engineering is a System-Level Win:** Generative models lessen the reliance on manual feature engineering. This not only simplifies the model but also significantly reduces inference overhead, improving scalability and latency (as shown by the >25% P99 improvement). This opens the door to unifying ranking and pre-ranking stages in the future.

# References

  1. Towards Large-scale Generative Ranking
