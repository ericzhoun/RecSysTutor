# Generative RecSys in 2026 - the papers

*Machine Learning at Scale collection — Ludovico Bessi, 2026-08-30 · topic: recsys*

[](../assets/2dbe6eb780e3bda8.avif)

The s[eries ended with a list of measured problems]().

The tokenizer trains on reconstruction while the recommender needs recommendation accuracy.

Collisions got resolved by an arbitrary dedup token.

Tail and cold recall bottomed out at exactly zero, and decode-time debiasing could not move them.

Serving costs a beam search per query. And a catalog that changes forces a choice between stale IDs and full retraining.

I assumed these were the costs of the architecture.

Then I read the 2026 literature properly, and it turns out every single one of these problems has at least one paper attacking it by name this year.

This edition maps each problem we measured to the fix the field shipped.

f you ran the notebook, you watched each of these problems happen; that makes these papers readable in a way abstracts never are.

[](../assets/a685dfc8620dcc1a.png)

Let’s do a deep dive on all of them :)

## 1\. The tokenizer never sees the recommendation objective

Our pipeline, like TIGER’s, is two disconnected optimizations.

The RQ-VAE learns codes that reconstruct a text embedding.

The transformer learns to predict those codes. Nothing ever tells the tokenizer what the recommender needs: an ID scheme where the distinctions that matter for prediction are the distinctions the codes encode.

The tokenizer optimizes fidelity to a text embedding.

The recommender needs discriminability between the items a user is actually choosing among. Different objectives, and the gap is measurable.

The obvious fix is joint training: let recommendation gradients flow back into code assignment. The obvious fix fails, and it fails in a way readers of part 2 will recognize immediately: naive differentiable indexing causes codebook collapse. Early deterministic assignments lock in winners before exploration happens, a few codes absorb everything, and you reproduce part 2’s one-live-code collapse inside the joint training loop.

DIGER (SIGIR 2026) makes it work by engineering the exploration explicitly: Gumbel noise on code assignment early in training forces the model to try codes it would deterministically skip, and an uncertainty decay schedule anneals the noise so training transitions from exploration to exploitation of settled IDs.

The result is consistent gains from letting the two objectives meet.

* * *

## 2\. The sibling limit is structural

This is our exact-zero result [from part 3, with a proof attached]().

Recall the diagnosis from [part 3](). Debiasing steered the beam into rare regions of the code space, and once there, the model had no signal to pick the correct item among the forty-odd behind a rare prefix.

I framed that as a knowledge limit of a small model. The Latte paper (UCSD and Snap) shows it is worse than that: it is structural.

Their observation: token-by-token generation traverses a decoding tree whose leaves are items, and the probabilities a generative recommender assigns are strongly correlated with tree distance. Items close in the tree receive similar probabilities for any given user.

Two shampoos sharing a two-code prefix are nearly indistinguishable to the model even when a specific user demonstrably prefers one, and the authors prove the architecture cannot represent preference patterns that plain collaborative filtering captures easily.

The thing that gives semantic IDs their power, shared prefixes, is the same thing that caps how personalized the predictions over those prefixes can be.

More training would not have fixed our zero. The tree itself was in the way.

Their fix is small and clever. Latte prepends a sampled latent token to every ID during training, which turns the single decoding tree into a forest: every item now sits at multiple leaves, reachable through multiple paths, and pairs of items no longer have one fixed tree distance forcing their probabilities together.

Reported gain is modest on average (about 3.5% NDCG@10) but the point is where it comes from: exactly the sibling-discrimination failure we measured.

If you extend the notebook once, extend it here.

Latent tokens are a data-pipeline change, not an architecture change, and watching whether the tail moves off zero would be a genuine experiment.

## 3\. Collisions are not all equal

Part 2 resolved 356 collisions with a dedup token assigned in arbitrary order, and I flagged it as the step every paper glosses over.

Kuaishou, who run generative recommendation on a quarter of their main-app traffic, published two papers this year saying the glossing is where quality leaks.

**The first is the framing: stop treating collisions equally.**

Two items on the same code tuple might be genuine near-duplicates, in which case sharing is fine and forcing separation wastes capacity, or they might be distinct items the tokenizer failed to distinguish, in which case the collision is an error that a random dedup token papers over. Qualification-aware learning treats those cases differently instead of uniformly.

**The second operationalizes it** : relax the repulsion between colliding items when they are semantically compatible, preserve admissible sharing, and allocate separation pressure adaptively by local collision load and training progress.

Congested regions of the code space get more regularization, and the balance shifts toward recommendation alignment as training matures.

For your own systems the takeaway is a diagnostic, not a technique: look at your collision buckets!!!

## 4\. The catalog moves and the IDs do not

The trade-off table listed SID drift as an operational cost and moved on. The 2026 literature quantified the cost and shipped two complementary fixes.

The setup, for anyone who has not run a production model through time: catalogs and behavior are non-stationary.

Items arrive, popularity shifts, co-occurrence patterns move.

A frozen tokenizer means the recommender trains on token sequences that no longer match current item semantics; refreshing the tokenizer means new code assignments that are incompatible with everything the recommender’s output head already learned. Practitioners have been choosing between stale IDs and full retrains.

**DACT** attacks the tokenizer side: a drift identification module scores each item’s drift confidence, drifting items get their codes updated toward current collaborative signals, stationary items get anchored so their identifiers do not shift gratuitously. Selective motion instead of freeze-or-rebuild.

**The staleness paper** attacks the deployment side and is the one I would hand an infra engineer: refresh the SIDs from recent logs, then align the new vocabulary to the old one (greedy or Hungarian matching) so the existing recommender checkpoint stays compatible and warm-start fine-tuning works. Reported result: better recall than fine-tuning on stale IDs, at roughly 8 to 9 times less retriever-training compute than a full rebuild.

## 5\. Decode latency

Our measured cost row said it plainly: a beam search is not a dot product. The field’s answers cluster in three directions. Diffusion-style decoders generate ID tokens in parallel rather than left to right, removing the sequential dependency that makes decode latency scale with ID length.

Distillation work goes further: train the expensive generative model, then distill it into an MLP for serving, keeping the training-time benefits of the generative formulation while paying dense-retrieval prices at inference.

And the industrial line, OneRec-v2, redesigns the serving stack around the model, which is how Kuaishou’s system-level cost ended up below the cascade it replaced despite the per-query arithmetic.

Per-query decode cost is real, actively under attack, and already avoidable at the system level if you are willing to redesign around it.

## 6\. Measurement reliability

The paper nobody in this list wants to cite asks how reliable SID-tokenizer comparisons are, and the answer is: less than the leaderboards imply, because results are sensitive to evaluation choices that papers rarely hold fixed.

Alongside it, SIDInspector is a diagnostic resource for inspecting what a tokenizer actually mapped where, which is the tooling version of the advice from part 2: monitor the mapping, not just the metric.

Our series’ scope statement, behaviors over benchmarks, turns out to be roughly where the measurement literature landed too.

## The updated read

A year ago the open question was whether semantic-ID generative recommendation works at all. The deployments answered that.

The 2026 question is different: how much of the remaining gap is engineering debt versus architecture.

Collisions, drift, decode cost: engineering, with shipping fixes.

The sibling-discrimination limit: architectural, now with a theorem, and the fixes (Latte’s forest, diffusion decoders, hybrid dense-generative stacks) all work by loosening the tree structure that defines the approach.

Every paper here is on arXiv, and every problem it fixes is reproducible in the companion notebook.

# Papers

[1] Expressiveness Limits of Autoregressive Semantic ID Generation in Generative Recommendation

[2] Differentiable Semantic ID for Generative Recommendation

[3] Stop Treating Collisions Equally: Qualification-Aware Semantic ID Learning for Recommendation at Industrial Scale

[4] Drift-Aware Continual Tokenization for Generative Recommendation

[5] LLaDA-Rec: Discrete Diffusion for Parallel Semantic ID Generation in Generative Recommendation

[6] SIDInspector: A Mapping-First Diagnostic Resource for Semantic-ID Tokenizers
