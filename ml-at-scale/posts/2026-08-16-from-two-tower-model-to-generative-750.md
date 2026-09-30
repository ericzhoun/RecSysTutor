---
title: "From two tower model to Generative retrieval [2/3]"
subtitle: "Series: Generative Retrieval, part 2 of 3."
date: 2026-08-16
author: Ludovico Bessi
collection: Machine Learning at Scale
topics: [recsys]
series: "Two-tower to generative retrieval"
paywalled: true
words: 671
---

# From two tower model to Generative retrieval [2/3]

*Series: Generative Retrieval, part 2 of 3.*

> Paid post — only the publicly visible preview is included.

*Series: Generative Retrieval, part 2 of 3.*

[![](../assets/42d1cac150a3ebe0.avif)](../assets/42d1cac150a3ebe0.avif)

Part 1 ended with a diagnosis:

> The two-tower gives every item a location in a learned space, built entirely from interactions. No interactions, no identity: a new item’s nearest neighbors are decided by the random seed.

(Missed it? Find it here)

This part builds the alternative. By the end, every item has a name: a tuple of discrete codes like (12, 41, 7), first code roughly the category, second the subcategory, third the item.

Learned from what the item is, not from who clicked it. In part 3 a transformer learns to predict items for users.

Three requirements to build such a model, each one shaping the design:

  1. **Unique.** Two items cannot share a name, or it is not an identifier.

  2. **Hierarchical.** Similar items must share prefixes.

  3. **Generatable.** The codes must be producible left to right by an autoregressive model. Otherwise where’s is GenAI?!

## The input: text embeddings

For each item, concatenate title, brand, category path, and a description snippet into one string, and run it through a frozen pretrained sentence encoder (all-MiniLM-L6-v2). Output: a 384-dimensional vector per item, where semantically similar texts land near each other.

The encoder was contrastively trained on about a billion sentence pairs; we train nothing here but just reuse.

No review text goes in. Reviews describe opinions, not identity, and a genuinely new item has metadata but no reviews.

One subtlety about that input string: Amazon’s metadata includes the category path (”Beauty > Hair Care > Shampoo”), so the human taxonomy is literally part of the text the encoder reads.

That is a real reason the level-1 codes later align so cleanly with categories: the taxonomy leaks into the embedding. Drop the category field and you still get a hierarchy, built from title and description semantics alone, just a fuzzier one. What goes into the text is our choice, and it shapes what the codes can encode.

So we have per-item vectors: continuous, 384 floats, unique.

We need three discrete hierarchical codes now. Let’s build them!

## Residual quantization

Quantization means replacing a vector with the nearest entry from a small learned table, the codebook. Store the entry’s index instead of the vector: one integer instead of 384 floats, at the price of error.

Residual quantization runs the trick recursively. Quantize the vector against codebook one. Subtract the chosen codeword; what remains, the residual, is everything code one missed.

Quantize the residual against codebook two. Subtract. Repeat. Code one captures the coarse shape (”this embedding is skincare-shaped”), each level refines the last. The hierarchy requirement we listed above falls out of quantizing errors of errors.

The RQ-VAE wraps this in an autoencoder. An autoencoder is two networks trained as one: an encoder compresses the input, a decoder reconstructs it, the loss is reconstruction error.

Here: encoder MLP maps 384-d to a 32-d code space, three codebooks of 256 codes quantize residuals, decoder rebuilds the 384-d embedding from the summed codewords. If three codes carry enough to rebuild the content embedding, they are a faithful compressed identity.

Level one quantizes the full embedding, so it can only capture the dominant directions of variance in that space, and in a catalog’s text-embedding space the largest thing separating items is what kind of product they are.

Level two quantizes what level one missed, the next-largest structure (sub-type, brand family).

Level three, the residual of that. The tiers are emergent: coarse-to-fine falls out of quantizing residuals. We do not assign meanings to levels; the data’s variance structure does.

Industry splits on how to fit the codebooks. TIGER trains the RQ-VAE end to end. Kuaishou’s OneRec uses RQ-KMeans, same residual structure, codebooks fit by clustering, trading fidelity for stability at their scale.

The residual principle is the invariant.

I built the RQ-VAE: canonical, and its main failure mode is the most useful thing in this article.

* * *

## Implementation: two lines carry the weight

Below, the full implementation (with colab link to reproduce and explanation)
