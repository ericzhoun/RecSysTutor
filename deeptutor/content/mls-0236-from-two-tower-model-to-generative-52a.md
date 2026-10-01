# From two tower model to Generative retrieval [3/3]

*Machine Learning at Scale collection — Ludovico Bessi, 2026-08-23 · topic: recsys*

[](../assets/6421d943fe72513f.avif)

* * *

Part 1 built the setup.

Part 2 gave every item a content-derived name.

This part builds the model the series is named after, then contrasts the three architectures on the same data.

[](../assets/4e2747c68dafab8e.png)

The idea in two sentences:

> A user’s history is a sequence of semantic IDs, so it is a sequence of tokens; recommendation is next-token prediction. The retriever is a decoder-only transformer that generates the next item’s identity instead of searching an index for it.

If “next-token prediction” is new: the model reads a token sequence and outputs, at each position, a probability over the whole vocabulary for what comes next.

Training minimizes cross-entropy against the actual next token (teacher forcing: the model always sees the true history, not its own guesses). This is the GPT training recipe, applied to RecSys.

The two-tower stored 12,101 identities as embedding rows.

The generative model’s whole vocabulary is 786 tokens: three levels of 256 codes, 16 dedup codes, 2 specials. All 12,101 identities are composed from them

## The catch

A decoder samples freely from its vocabulary, so it can emit a code tuple no item owns. That’s bad :D.

The trie from part 2 resolves it. At every decoding step, the set of legal next codes is exactly the set that extends the current prefix toward a real item; everything else is masked to negative infinity before the softmax.

Beam search under this mask (beam search: keep the B highest-probability partial sequences at each step instead of just one, B = 20 here) can only terminate at real items, by construction. Cost: a dictionary lookup per step.

The standard critique that generative recommenders “hallucinate items” is a critique of unconstrained decoding. Every production deployment in this space decodes constrained.

* * *

## Model and training

Small decoder-only transformer: 4 layers, 4 heads, dimension 128, per-level vocabulary slices so code 12 at level 1 and code 12 at level 2 are different tokens.

Input: the last ten history items flattened to tokens, then the target item’s four. Loss on every item token in the window (dense supervision), cosine LR schedule, dropout 0.1, 8 epochs, about three minutes on a free Colab GPU.

Evaluation: constrained beam search for every test user, record where the true item lands in the beam.

## The comparison

The objection to raise before trusting anything below: cold-start ability could come from content alone, not from generation.

A tower that reads text embeddings already knows something about items nobody has clicked.

If the comparison is atomic tower vs generative model, content and retrieval mechanism change at once, and the experiment proves nothing about either.

So the notebook runs a **ladder**. Three arms, and each step up changes one thing.

**Arm 1 is the atomic two-tower**. An item is a trainable row in an embedding table, no content anywhere, retrieval is a dot product.

**Arm 2 is the content two-tower**. Text replaces the ID entirely: there is no embedding table in this arm. An item’s representation is an MLP over its frozen MiniLM vector, and interactions still do the teaching through the same loss. Retrieval is unchanged, still a dot product. So arm 1 vs arm 2 isolates content. Production towers combine ID and text; the controlled arm cannot, because then this step would change two things at once.

**Arm 3 is the generative model**. An item is a tuple of semantic ID tokens, and those tokens are built from the same MiniLM vectors the content tower reads, so the content signal is held fixed. What changes is the retrieval mechanism: instead of scoring every item with a dot product, the model writes the next item’s ID, token by token. Arm 2 vs arm 3 isolates generation.

One line each.

Arm 1 learns who goes with whom.

Arm 2 learns who goes with whom, described by what things are.

Arm 3 learns to spell what comes next in a language built from what things are.

Two residual caveats.

First, arm 2 vs arm 3 is not perfectly controlled either: the content tower sees the full 384-dimensional embedding, the generative model sees its 3-codes-plus-dedup compression, roughly 25 bits. The asymmetry runs against the generative model, so the comparison is conservative. If it wins anyway, it wins with less information.

Second, the user encoders differ: the towers pool history, the generative model runs a transformer over it. Part 1’s SASRec reference (0.061) bounds what sequence awareness alone is worth in the dense world, so any generative advantage larger than that gap needs a different explanation.

## Results: overall and the tail

[](../assets/0cc44ef7fc264bbc.png)

Three behaviors in that table. The content tower wins overall at 0.071, above the published SASRec reference.

That is how much signal sits in content that atomic systems throw away!

The generative model lands at 0.041 on roughly 30x less training than TIGER, and on the head slice it leads the atomic tower, 0.148 vs 0.135: where the language model has probability mass, generation competes.

## The zero

Generative tail recall is exactly 0.000, across more than five thousand test users.

The mechanism, and why it bottoms out at _exactly_ zero rather than something small. Dense and generative models answer “which item?” differently.

The towers score exhaustively: every one of the 12,101 items gets a dot product for every user, so even a barely-known item is evaluated and occasionally wins.

That is why the atomic tower manages 0.005 on the tail and the content tower 0.021. The generative model does not score items, it searches for them. At each of the four decoding steps, only the 20 highest-probability partial paths survive (beam 20). For a rare item to be recalled, its first code must be among the user’s top-20 first codes, then its two-code prefix among the surviving top 20, then its third code, then its dedup token. Elimination at any step is unrecoverable.

Now stack the knowledge problem on top of the search problem. The model’s conditional probabilities are learned from frequency. A tail item’s third code, given its prefix, was reinforced at most four times across 131,000 training windows, while its prefix-siblings were reinforced hundreds of times. Its joint path probability is a product of factors that each lose to a popular sibling at each step.

This also explains why the debiasing below fails in a specific way. The correction pushes the beam into rare regions of the code space. But once the search arrives there, the model has no learned signal to tell the roughly forty items behind a rare prefix apart. You surface arbitrary rare items, not the right one, so exact-match recall stays at noise. Debiasing only fixes where the search goes.

## The cold-start experiment

The controlled version of part 1’s closing demonstration. Three hundred items erased from all training data, for all three models: removed as targets, blanked from histories. Same recipe, same budget. Evaluate only on users whose true next item is one of the erased items. The only variable left is what each model means by identity.

[](../assets/b246a187ff4ef147.png)

The atomic zero is by construction.

The content tower’s 0.029 is modest in absolute terms and different in kind: content-as-identity generalizes to items nobody clicked.

The generative zero looks like the tail zero again. It is not, and finding that out required taking beam search out of the picture entirely.

So I measured it the blunt way: score every item’s four-token ID by teacher forcing, all 12,101 candidates per user, history masked, no beam anywhere.

This is the two-tower’s own evaluation protocol applied to the generative model, and it removes every excuse about search budgets. The cold items land at a median rank of 11,404 out of 12,101. Random guessing would put them near 6,050. Retrained from scratch with three times the epochs: median 11,872. Worse than random, twice.

The trie guarantees a cold item’s ID is decodable, but eight epochs of next-token training teach the model exactly which continuations of each prefix actually occur in the data.

A valid continuation that never once occurred does not merely get ignored: it gets scored below every continuation that did, because the model has specific evidence for all of them and none for it.

The two-tower’s cold failure is blindness, an untrained row is noise and noise ranks randomly.

This section was designed to end with a case study: one cold item the generative model got right, its semantic ID, the warm siblings that taught the model its prefix.

Prefix generalization is not something this architecture does for free; production deployments earn it with orders of magnitude more model and data, plus recipes the papers mention quietly, user tokens for collaborative signal, regularization against exactly the ID memorization measured above.

The content tower’s unglamorous 0.029 is what cold-start competence looks like at notebook scale, and the next section applies the standard treatment to the generative model anyway, because what happens is still instructive.

## Debiasing the decoder

The symmetric fix. Dense retrieval fought popularity bias in the loss (logQ, part 1). Generative retrieval fights it at decode time: subtract a scaled token-popularity prior from each step’s scores. One knob, alpha. Standard decoding is alpha 0. The notebook implements it in a dozen lines and evaluates the same slices at alpha 0.5:

[](../assets/5df1f19394cb2fc9.png)

The head giving up nearly three points proves the knob is wired: probability mass genuinely moved off popular tuples.

The tail not moving despite that sacrifice proves the limit is not decode scoring but model knowledge. Debiasing reranks the paths a model can reach.

An item seen four times in training, whose exact tuple never appeared as a target, barely exists inside a model this size, however you score the beam. The notebook includes an optional alpha sweep; pushing further spends more head accuracy on the same dark tail.

Dense retrieval fights popularity bias in the loss, generative retrieval fights it in the decoder, and in both worlds the untreated default quietly optimizes for the head of your catalog.

The decoder-side fix only redistributes what the model already knows.

Closing the gap on genuinely rare and new items is a training-side and identity-side problem, which is why the production systems lean on content-derived IDs, vastly more data, and models thousands of times this size.

## The trade-off table, corrected

Most circulating “two-tower vs generative” comparisons describe LLM chatbots, not semantic-ID retrieval, and their rows are wrong for this architecture.

[](../assets/fbd581d44037de07.png)

The rows usually stated wrong: hallucination (solved by constrained decoding), cost (true per forward pass, false at system level for the largest published deployment), and candidate size (the vocabulary is 786 tokens, not 12,101 items; that is the point of composed identity).

## The verdict

Where the public record puts this architecture: cold and tail inventory at scale, catalogs where a meaningful share of items is always new, systems drowning in cascade complexity.

Where the notebook puts it: none of that comes with the architecture. At this scale the generative arm was worse than random on cold items, and content-as-identity in a dense tower is what actually delivered: 0.029 against 0.000.

(Read the deployment reports as evidence that the ceiling is high, not that the floor is)

What it costs: decode latency per query, heavier training, SID drift under catalog change, and the popularity prior you now fight at decode time.

The 2026 literature attacks each cost by name:

  * differentiable semantic IDs close the tokenizer-recommender objective gap (SIGIR 2026)

  * drift-aware continual tokenization targets catalog change

  * Kuaishou published collision-qualification-aware ID learning from production.

The counterweight: the KDD 2026 scaling study showing SID-based models do not yet scale like language models.

And a hybrid current exists, dense retrieval with generative components at the edges, a reasonable landing zone for mid-size systems even as Kuaishou, YouTube, and Snapchat publish full replacements.

The deployment record as of this writing: OneRec at roughly a quarter of Kuaishou’s main-app traffic, PLUM at billions-of-items scale at YouTube, Snapchat in production ranking and retrieval, Meituan and Pinterest variants, and Google’s RecSys 2024 result that SIDs improve ranking, not just retrieval.

The complete build, all three parts, one notebook, linked here.

_Caveats. Beauty is small; absolute numbers do not transfer, the structure of the comparisons does. The generative model is TIGER-scale, not OneRec-scale. The dense arms use pooling encoders by design; the SASRec reference bounds what a stronger dense encoder buys. Everything reproduces from the single companion notebook on a free GPU._

* * *

## FAQ

**Why train the two-tower on IDs at all? Why not use text from the start?**

Because ID-only is the incumbent, and you cannot measure what replacing something buys until you measure the thing itself in isolation. The atomic tower is what most production retrieval actually runs today. It also keeps the experiment clean: if part 1 already used text, the part 3 comparison would confound two changes at once (content vs no content, and generation vs dot product) and prove nothing. The content tower is introduced deliberately in part 3, as arm 2, exactly to isolate those variables.

**Isn't the cold-start advantage just about content?**

Correct, and the notebook runs that objection as a controlled experiment rather than dodging it. Arm 2 is a two-tower whose item representation is the same frozen text embedding the tokenizer uses, no ID table anywhere. It reaches 0.029 on cold items while the atomic tower scores zero. So content is the active ingredient for cold start. The generative model’s separate case is structural: discrete compact IDs, a prefix hierarchy, no ANN index, retrieval as generation, and one representation shared across retrieval and ranking. That is the column the production deployments actually buy.

**Where does the text that feeds the tokenizer come from, and who decides it?**

We decide it, in one line of preprocessing: title, brand, category path, and the first 400 characters of description, concatenated per item. No review text, because reviews describe opinions rather than identity and a new item has none. One honest consequence: Amazon’s metadata includes the category path, so the human taxonomy is literally in the string the encoder reads, which is part of why level-1 codes align so cleanly with categories.

**Who decides that level 1 is category, level 2 is subcategory, and so on?**

Nobody. The tiers are emergent. Level 1 quantizes the full embedding, so it captures the dominant directions of variance in that space, and in a catalog the biggest thing separating items is what kind of product they are. Level 2 quantizes the residual, the next-largest structure. Coarse-to-fine falls out of quantizing residuals of residuals; “coarse means category” is just where the variance happens to live.

**Why is the generative tail recall exactly 0.000, not merely small?**

Two compounding reasons. The towers score every item exhaustively, so a rare item always gets evaluated and occasionally wins. The generative model searches with a beam of 20, so a rare item must survive four winner-take-most elimination rounds, and its path probability was trained on four examples or fewer while its popular siblings got hundreds. The per-user probability of the correct rare item reaching the top ten falls below one over the number of tail users, so the observed count rounds to zero. It is arithmetic, not a bug.

**Why did debiasing the decoder not fix the tail?**

Because debiasing changes where the search goes, not what the model knows. Subtracting a popularity prior steers the beam into rare regions, and the head accuracy dropping proves that steering works. But once the beam arrives at a rare prefix, the model has no learned signal to pick the right item among the roughly forty behind it, so exact-match recall stays at noise. Closing that gap is a training-side and identity-side problem, which is why production systems throw content-derived IDs, far more data, and much larger models at it.

**Do I need a GPU?**

Yes for a comfortable run. The whole notebook is about 40 minutes on a free Colab T4. On CPU it works but takes hours; the config cell warns you if no GPU is detected.
