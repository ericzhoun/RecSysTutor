# 57. What happened to BERT?

*Machine Learning at Scale collection — Ludovico Bessi, 2024-10-06 · topic: llm*

*Future of AI from the history of transformers.*

[](../assets/115824568603056e.png)

# Introduction

In today’s article, I want to give a nice broad overview as to why we are seeing “decoder-only” architectures everywhere.

Where did BERT go?!

Let’s find out!

Let’s start by introducing the “Bitter lesson”. The progress of AI in the past 70 years boils down to:

  * Develop progressively more general methods with weaker modeling assumptions

  * Add more data and computation (i.e. scale up)

Usually the more human input (e.g. modeling assumptions) the less scalable the method is. The reality is that compute is getting cheaper faster than we are becoming better researchers.

An example is deep learning vs classical ML. Why did DL take off? It was more scalable. Why is it more scalable? Because it gives more degree of freedom (i.e. less structure) to the model.

This is somewhat unique to the AI research. If clever modeling techniques and fancy math were the driving force, it would have been completely different story

We identified the dominant driving force: exponentially cheaper compute and scaling

Now we need to understand it better.

For that we will go to back to early history of Transformer and look into the key structures added by researchers and their motivations.

Then we will see how these structures became less relevant with now that more compute and better algorithm is available.

# Architectures variants from structure to less structure

Transformer architectures variants: (from structure to less structure)

  1. Encoder decoder

  2. Encoder only: give up on generation

  3. Decoder only (less structure)

I will not go too deep into the different architectures, but this table summarizes well the key differences:

[](../assets/b29447a6e6db1549.png)From [2]

Bidirectional attention is an interesting “inductive bias” for language models - one that is commonly conflated with objectives and model backbones. The usefulness of inductive biases changes at different compute regions and could have different effects on scaling curves at different compute regions. That said, bidirectional doesn’t seem to matter that much at larger scales compared to smaller scales.

Also, it brings engineering challenges at inference time!

For example, on chat applications at every turn the input has to be encoded again while for undirectional attention only the newly added message needs to be encoded.

# Focusing on BERT specifically

While the denoising objective in BERT style models are mostly “in-place”, (e.g., classification head on top of mask tokens), the slightly more modern way is to do it “T5-style”, e.g data transformation that can be processed by an encoder-decoder or decoder-only model. In such a data transformation, masked tokens are just “moved to the back” for the model for prediction.

The primary goal of pretraining is to build a useful internal representation that can be aligned for downstream tasks in the most efficient and effective way possible.

The better the internal representations, the easier to use these learned representations for anything useful later. The simple next word prediction “causal language modeling” objective is known to do this very well and has served as the bread and butter of the LLM revolution. The question now at hand is whether the denoising objective is just as good.

Denoising objectives are great but pretty insufficient as a standalone objective. A big drawback is because of a reason which we could call less “loss exposure”. In denoising objectives, only a small amount of tokens are being masked and gets learned as a result (i.e., taken into account in the loss). Conversely, in regular language modeling, this is close to 100%. This makes for pretty low sample efficiency per FLOP which makes denoising objectives hugely disadvantaged on a flop-basis comparison.

Another drawback is that denoising objectives are more unnatural than regular language modeling since it reformats the input/output in a strange way, making them a little awkward for few-shot learning.

## Early days of unification

BERT-style models are cumbersome, but the real deprecation of BERT models was because people wanted to do all tasks at once, which led to a better way of doing denoising - using autoregressive models. It was simply so hard to do this with BERT.

People simply found a way to re-express denoising pretraining tasks if they wanted to use such a model (i.e., T5) which made BERT-style models pretty much deprecated at this point because there is a strictly better alternative.

To be even more concrete, encoder-decoder and decoder-only models were able to express multiple tasks at once without the need for task specific classification heads. For Encoder-Decoders, if the decoder was getting in the way, researchers and engineers also began to find out that yanking out the encoder performed just as competitive as a BERT encoder. Moreover, it also retains the same bidirectional attention benefit that made BERT competitive over GPT models at small (often production) scale.

## Value of denoising objective

Denoising pretraining objective also learns to predict the next word in a similar way to regular language modeling. However, different from regular causal language modeling, a data transformation is applied to the sequence such that the model learns to “fill in the blanks” instead of simply predicting the naturally occuring left-to-right text.

Notably, denoising objectives are sometimes also called “infilling tasks” that are sometimes mashed together into pretraining together with regular language modeling tasks.

While the exact configuration and implementation details can vary, modern LLMs today may use a combination of language modeling and infilling in some capacity.

# Key takeaways

  1. Encoder-decoder and decoder-only models are both autoregressive models that have implementation-level differences and pros/cons. They are subtly different inductive biases. Optimal usage really depends on downstream use-case and pretty much application constraints. Meanwhile, for most LLM usage and niche use-cases aside, BERT style encoder models are mostly considered deprecated.

  2. It is also worth to note that, generally speaking, an Encoder-Decoders of 2N parameters has the same compute cost as a decoder-only model of N parameters which gives it a different FLOP to parameter count ratio.

We don’t see any scaled up xBERTs running around: BERT models got deprecated in favor of more flexible forms of denoising (autoregressive).

This is largely due to paradigm unification where people would like to perform any task with a general purpose model (as opposed to task specific model).

# References

  1. Model architecture blogpost encoder

  2. Future of AI from history of transformers
