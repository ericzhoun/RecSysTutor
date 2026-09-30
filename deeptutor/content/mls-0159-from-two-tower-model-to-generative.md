# From two tower model to Generative retrieval [1/3]

*Machine Learning at Scale collection — Ludovico Bessi, 2026-08-09 · topic: recsys*

*Series: Generative Retrieval, part 1 of 3. One companion notebook runs everything on a free Colab GPU.*

[](../assets/11f785e5980b4fe8.avif)

# The series intro

An item is an opaque integer.

Item 48291 tells you nothing about item 48292.

The ID is a primary key, and a primary key’s job is to mean nothing.

Most of what is painful about production recommenders follows from that choice. Embedding tables that grow linearly with the catalog.

ANN indexes rebuilt on a schedule. Cold start, which is not a “problem” so much as the direct consequence of defining identity as “a row we train from clicks”: no clicks, no identity, no recommendation.

For a decade this was the cost of doing business. In the last two years, the biggest recommender teams in the world stopped paying it.

This series builds what they replaced it with, semantic IDs, from raw data to a working generative recommender.

Scope, stated once: this is an educational build.

The goal is understanding the architecture shift at the code level and watching how the models behave differently on the same data.

It is not a benchmark study. Small-scale numbers illustrate mechanisms; for production-scale evidence, the deployment reports cited below are what counts.

The arc:

  1. **Part 1:** A two-tower retriever, built honestly

  2. **Part 2:** the tokenizer. An RQ-VAE that turns item content into discrete hierarchical IDs, including specific failure modes.

  3. **Part 3:** the generative recommender, constrained decoding, and a three-model comparison including a controlled cold-start experiment.

## The setup, if recsys is new to you

The task is sequential recommendation. You have users, items, and timestamped interactions (here: Amazon Beauty reviews, treated as purchases).

Sort each user’s items by time and you get a sequence. The model’s job: given everything a user bought so far, predict the next item.

Evaluation is leave-one-out: each user’s last item is hidden as the test target, the second-to-last for validation, the rest is training.

The model scores all 12,101 items in the catalog and we check where the true next item ranks. Two metrics:

  * **recall@K** : fraction of users whose true next item lands in the top K. recall@10 = 0.05 means the model gets it into the top 10 for 5% of users.

  * **NDCG@K** : same, but position-weighted. Rank 1 counts more than rank 9.

## The two-tower

The dominant retrieval architecture of the last decade. One tower encodes the user, one encodes the item, relevance is a dot product.

Item tower: item id, look up its embedding row, pass through a small MLP, normalize. User tower: look up the embedding rows of the history items, mean-pool them, concatenate the most recent item’s row (recency matters in purchase data), MLP, normalize. Score every item, take the top K. At scale you do not score everything, you use an approximate nearest neighbor (ANN) index; the model is designed for that.

Training needs positives and negatives: pull the user vector toward the item they actually bought next, push it from items they did not.

Sampling negatives is the practical trick. We use in-batch negatives: within a batch of 1,024 (user, next item) pairs, every other row’s item is a negative for you.

Cheap, standard, and biased, because popular items appear as negatives more often. The fix is the logQ correction: subtract each item’s log frequency from its logit.

Skip it and the model learns to suppress popular items, which are a large share of true targets.

The tokens are meaningless integers; meaning emerges from what appears next to what, the same mechanism as word2vec. The two-tower learns who goes with whom. That is real power: it discovers structure no metadata contains. It is also the exact reason an item with no interaction history has no meaning at all.

## What the atomic ID costs

**The table scales with the catalog.** A hundred million items at 128 floats is most of your parameters, spent on a lookup table of identities, most rows trained on a handful of clicks.

**New items are noise.** Before interactions, an item’s row is whatever the initializer produced.

The notebook will make this concrete: embed the same new item under two random seeds and ask the trained model for its nearest neighbors. Two disjoint lists, zero overlap. The model has no belief about a new item; the “identity” belongs to the seed, not the item.

**Retrieval and ranking cannot share knowledge.** Each stage learns the catalog in its own embedding space; the interface between them is a list of integers.

## What semantic IDs even do?

Give every item a short tuple of discrete codes, learned from its content, such that similar items share prefixes: (12, 41, 7), first code roughly “hair care,” second “shampoo,” third the item. Identity becomes a path through a hierarchy.

Once identity is a token sequence, recommendation becomes next-token prediction. The user history is the context, the next item’s ID is the continuation, the retriever is a decoder-only transformer.

That is generative retrieval, and it inverts the two-tower’s weakness by construction: an item nobody clicked still has a meaningful ID, because the ID comes from what the item is.

## From research to practical applications

TIGER (Google, NeurIPS 2023) introduced the recipe: RQ-VAE tokenizer, semantic IDs, transformer that generates them.

Google’s RecSys 2024 paper showed SIDs improve ranking generalization at YouTube scale, not just retrieval.

Then other companies: Kuaishou’s OneRec replaced the whole retrieve-then-rank cascade with one generative model, now serving roughly a quarter of main-app traffic at about a tenth of the cascade’s operating cost per their technical reports.

Snapchat shipped SIDs in production ranking and retrieva.

Meituan and Pinterest have shipped variants of the above.

Part 3 of the series also covers the counter-evidence, because it exists: a KDD 2026 scaling study showing these models hit real bottlenecks, and operational costs the success stories pay off-screen.

## The build: baseline first

Everything runs on Amazon Beauty (2014, 5-core), the TIGER benchmark: 22,363 users, 12,101 items, 198,502 interactions. Small enough for a free GPU, real enough to transfer.

Part 1 of the notebook builds the two-tower properly: logQ-corrected in-batch softmax, dim 128, 30 epochs, full-catalog evaluation with the history masked, mid-tie ranking so score ties never count as wins.

Published numbers on this exact benchmark, for calibration: Caser 0.035 recall@10, SASRec 0.061, TIGER 0.065. A mean-pool-plus-recency tower should land between Caser and SASRec.

popularity baseline recall@10: **0.011**

two-tower recall@10: **0.047**

0.047, inside the expected band, 4x popularity.

For 88% of test users, the true next purchase ranked below position 100. 

Slice recall@10 by how often the true target appeared in training:

  * rare targets (bottom quartile, seen 4x or less): **0.003**

  * popular targets (top quartile): **0.135**

A 44x gap. Identity learned from interactions works in proportion to interactions.

## Two tower issues?

The two-tower’s weakness is not accuracy. It is that identity is learned from interactions only (!!!)

Part 3 makes that quantitative with a controlled experiment: 300 items erased from all training data, for every model, then evaluated only on users whose true next item is one of them.

The atomic tower scores exactly 0.000, as it must; an untrained random row cannot rank above noise

What happens to the generative model in that experiment is the most useful part of the series imho.

## Next

Part 2 gives every item a name: the RQ-VAE tokenizer, codebook collapse reproduced and fixed, collision resolution the way TIGER actually does it, and a catalog where you can read an item’s category off its ID prefix.

— Ludo

 _Caveats. Beauty is small and 5-core-filtered; absolute numbers do not transfer to production, the structure of the comparisons does. Validation recall runs slightly above test in the notebook (0.060 vs 0.047): the validation target is one step earlier in each sequence, not a leak. The two-tower here is deliberately ID-only; a content-augmented tower joins the comparison in part 3, where isolating variables actually matters._
