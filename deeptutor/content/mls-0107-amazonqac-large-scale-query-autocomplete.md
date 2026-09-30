# AmazonQAC: Large scale query autocomplete dataset

*Machine Learning at Scale collection — Ludovico Bessi, 2025-09-14 · topic: retrieval-rag*

*Datasets are important!*

[](../assets/a32589f24f21a7a3.png)

**TLDR:** A new dataset for Query Autocomplete (QAC) from Amazon reveals critical flaws in using synthetic data for this task. The 395M-sample dataset includes actual user keystroke sequences, typos, and session context.  
Benchmarks show that a fine-tuned Mistral-7B model using session context outperforms both classic prefix-tree/retrieval systems and few-shot LLMs. However, the best system's Success@10 of 37% is only half of the paper's calculated theoretical maximum (69.8%), indicating QAC remains a largely unsolved recommendation problem.

# Deep dive into the paper

[](../assets/1304a1dbf8e57a48.png)

**1\. A New Benchmark Reveals the Flaws in Synthetic QAC Data**

Query Autocomplete (QAC) is a foundational feature, yet its research has been stunted by a lack of realistic data. Most benchmarks rely on datasets of final search queries, forcing researchers to synthetically generate prefixes. By releasing a 395M-sample dataset with _actual_ user-typed prefix sequences, they provide two key insights:

  * User typing is highly non-linear; nearly 38% of prefix sequences contain deletions or corrections, a pattern synthetic data cannot capture.

  * User intent often diverges from literal prefixes; 13% of final search terms do not start with the user's final typed prefix (e.g., prefix "ipad ca" leads to selecting "case for ipad").

This naturalistic data fundamentally reframes QAC from a simple string-matching problem to a complex, context-aware recommendation task.

**2\. Benchmarking the Baselines: Information Retrieval vs. LLMs**

The authors establish a performance baseline by evaluating traditional Information Retrieval (IR) methods. A standard Prefix Tree (trie) that maps prefixes to the most popular completions achieves a 25.3% Success@10. Augmenting this with a ColBERTv2 semantic retriever—which helps find matches even when the prefix isn't a literal start to the query—boosts performance to 28.9%.

While an improvement, this IR-based approach has a hard ceiling: it cannot easily incorporate session context and struggles with the 41% of test set prefix/search-term pairs that were unseen in the training data. These results show that while lexical and semantic matching are necessary, they are insufficient for top-tier performance on real-world QAC traffic.

**3\. The Impact of Fine-tuning and Context**

The paper's most significant finding is the performance comparison between different LLM strategies. An off-the-shelf, few-shot Mixtral-8x7B model performs surprisingly poorly, achieving only 24.0% Success@10 even when provided with session context in the prompt.

Without specific training on the task's data distribution and popularity priors, a general-purpose LLM underperforms a specialized IR system.

However, a smaller Mistral-7B model _fine-tuned_ on 200M prefix/completion pairs becomes the top performer. It achieves 32.3% Success@10 without context and a **37.0%** with context, demonstrating a +4.7% absolute gain from leveraging user session history. This confirms that for specialized domains like QAC, in-domain fine-tuning is super crucial for unlocking SOTA generative performance.

**4\. Why QAC is Far From Solved**

Despite the fine-tuned LLM's success, the paper argues that the QAC problem is far from solved. The authors calculate a theoretical performance upperbound on their test set of 69.8% Success@10.

This is derived by assuming a perfect system could disambiguate all queries with recent session context (57% of the data) and would use an oracle-like popularity ranker for the remaining context-free queries (43% of the data).

The best baseline's 37.0% score means it captures only about half of this theoretically achievable performance.

This massive 32.8% gap highlights a significant opportunity for innovation!!

The problem isn't just about better models, but about more effectively leveraging sparse signals like session history and the gap between generative fluency and hard popularity ranking.

# My main take aways

For MLEs building search and recommendation systems, this paper offers three clear directives:

  * Prioritize collecting and using naturalistic interaction data; synthetic logs will misrepresent user behavior and lead to suboptimal models.

  * For generative approaches to specialized tasks, fine-tuning is superior to few-shot prompting and is essential for beating robust IR baselines.

  * Session context is a powerful feature that provides significant lift and should be engineered into the model's input from the start.

The remaining performance gap suggests that the next frontier lies in hybrid systems—perhaps combining a fine-tuned LLM's ability to handle the long tail of novel queries with an IR system's speed and accuracy for popular, "head" queries.

# References

  1. Paper: "AmazonQAC: A Large-Scale, Naturalistic Query Autocomplete Dataset"
