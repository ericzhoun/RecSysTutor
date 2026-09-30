# 40. Automatically detecting Under-trained Tokens

*Machine Learning at Scale collection — Ludovico Bessi, 2024-06-09 · topic: llm*

*AKA: Finding another "SolidGoldMagikarp" *

[](../assets/8b63a7e2592909c3.jpg)

# Introduction

Tokenization remains a major pain for LLM training and it’s the cause of many issues. If you don’t believe me, Karpathy himself says so :D

[](../assets/5bbe316bcebcb577.png)Karpathy commenting on the paper we are discussing today :)

The issue we are exploring today is the following: under trained tokens cause problems for models. Finding them is useful to improve the efficacy and safety of LLMs.

The tokenization step has generally been found to be unsatisfactory, being at the root of many unwanted behaviours and problems of LLMs. 

If you want to hear how tokenizer works in detail, I really suggest this video:

**Now, back to tokenizer issues.**

In particular, the disconnect between tokenizer and model training creates the potential for some tokens to rarely or never be seen in training. Including such tokens in model inputs can lead to unexpected model behaviour including as hallucination or the generation of garbled outputs, leading to such tokens commonly being referred as ‘under-trained’.

The presence of such under-trained tokens has several drawbacks:

  * They occupy capacity in a fixed-size tokenizer that could be better utilized for more common tokens, reducing input/output length and inference costs.

  * Their presence in input data has the potential to cause unwanted outputs and break downstream applications. Robustness to such unexpected or malicious input data is increasingly important with the proliferation of tool use and agents in LLMs that retrieve and process external data.

  * These tokens can potentially be exploited to more easily circumvent guardrails by pushing the model beyond its trained distribution.

Now we know **why** they are bad. Let’s find out how to spot them in the wild!

* * *

# Method

The method to find under-trained tokens is compromised of three steps:

  * Perform a tokenizer analysis by inspecting its vocabulary and observing its encoding/decoding behaviour

  * Calculate the indicators that identify candidate tokens that have likely not been seen during model training

  * Verify whether identified candidate tokens are indeed out of distribution by prompting the target model

**Tokenizer analysis**

The following token categories are considered:

  * _Partial UTF-8 sequences_

  *  _Unreachable_ : when no input string can be mapped into the token. These tokens are result of tokenizer configuration errors or conflicts between trained and manually added vocabulary

  *  _Special tokens_ : manually defined tokens carrying specific meanings as control tokens.

**Indicators for detecting under-trained tokens**

All weights of the unembedding matrix (which converts the final internal embedding to a probability distribution over tokens) influence the token predictions at every training step. Two indicators are considered:

  * The cosine distance between the mean unused token embedding vector and the rows in the unembedding matrix. This distance is expected to be high for under-trained tokens.

  * The L2-norm of the unused token embeddings. This norm is also expected to be high for under-trained tokens.

**Verification of candidate tokens**

All tokens which rank in the top 2% are used to construct repetitive prompts that induces a high output probability for normal tokens and checking if a candidate token has a very low output probability.

* * *

Liking the content so far? Share it with friends :)

* * *

# Results and observations

The paper shows a wide-variety of untrained / under-trained tokens in commonly used tokenizers. 

Tipically, 0.1/1% of the vocabulary consists of such tokens! 

That value is quite crazy to me.

Citing the paper for an highlight of the findings:

> The most important factors in a model having many under-trained tokens, aside from simply having a large vocabulary, appears to be whether the tokenizer was trained on similar data as the model. Models which re-use a large external tokenizer, and then train from scratch, are among those with the highest number of under-trained tokens.

* * *

Not a subscriber yet?! Let’s fix this :)

* * *

# References

  * Fishing for Magikarp: Automatically detecting under-trained tokens in large language models
