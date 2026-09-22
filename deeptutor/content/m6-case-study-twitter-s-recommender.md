# Module m6 — Case study: Twitter’s recommender

## Case study: Twitter’s recommender

A six-post deep dive into one real system, read in the order data actually flows: who to look at
      (RealGraph), what is happening now (GraphJet), what to recommend (SimClusters), and how to rank it (MaskNet → TwHIN).

### RealGraph — in-network retrieval

The oldest component (2014) and the clearest example of **feature-engineered retrieval**. RealGraph predicts
      the probability that user A will interact with user B, built from a directed interaction graph.
- **Graph generation** — aggregate interactions (follows, retweets, replies, profile visits) into edges with features.
- **Edge + user features** — interaction counts and rates by type, plus node-level signals.
- **Model** — logistic regression; the value is the *features and the pipeline*, not the model class.

> Why a 2014 LR model is worth studying
      It shows that a candidate retriever can be a **lightweight probabilistic score over a graph**, refreshed
        offline. Retrieval need not be a neural network — recall and freshness often matter more than model capacity.

### GraphJet — real-time graph processing

A 2016 in-memory engine for **real-time** recommendations: it maintains a sliding-window bipartite graph of
      recent user↔tweet interactions and answers “who engaged with things like this?” in milliseconds.
- **Edge insertions** stream in; old edges expire on a rolling window.
- **ID mapping + memory allocation** are the whole engineering story — efficient arrays, no GC pressure.
- **Read-only optimisations** and **edge lookups by sampling** keep reads lock-free.

The lesson: *freshness is a retrieval feature*. RealGraph covers the stable graph; GraphJet covers the last few
      minutes.

### SimClusters — community-based representations

Twitter’s most advanced candidate retriever, and the most conceptually interesting. It produces one
      **sparse community vector** for every user and item, so recommendations become “find items topical to this
      user’s communities”.

#### Community discovery, in three steps

1. **Similarity graph of right nodes** — interconnect users (or content) by a similarity notion.
2. **Communities of right nodes** — find dense clusters (Metropolis–Hastings style sampling at scale); each community is characterised by its influencers.
3. **Communities of left nodes** — project the communities back onto the full set of users/items.

> Why SimClusters stays readable
      Every dimension *is* a community, so the embedding is interpretable (unlike MF or generic graph embeddings), the
        vectors are sparse and invertible for ANN indices, and new/churning content can be placed in the same space immediately.
        Scale claimed: ~10⁹ users, ~10¹¹ edges.

### MaskNet in production

The ranker that sits on top of the retrievers above (see module 3.8). The case-study view: a low-cost,
      instance-guided gating ranker is exactly what you want when the retriever has already narrowed candidates to a few hundred
      and you need to score them inside a tight latency budget.

### TwHIN & the system picture

The closing post ties it together with **TwHIN** — Twitter’s Heterogeneous Information Network embeddings —
      and, more importantly, the operational problems nobody puts in a paper:
- **Parameter drift across model versions** — embeddings must stay compatible as models are retrained.
- **Multi-modal embeddings** — users and different content types share one space.
- **Deployment reality** — offline batch jobs, low-latency online stores, and the hand-off between them.

> The through-line of the whole case study
      A real recommender is not one clever model. It is a **layered machine** where each layer solves a different
        time-scale and recall problem — stable graph (RealGraph), fresh graph (GraphJet), topical communities (SimClusters),
        cheap accurate scoring (MaskNet), shared representations (TwHIN).

### Exercises

One systems-design exercise and one small implementation of the SimClusters idea.

### Module check


## Quiz bank

**Q1. Which Twitter component is responsible for real-time, fresh-signal retrieval?**

- RealGraph
- GraphJet  _(correct)_
- SimClusters
- TwHIN

_Answer: GraphJet. GraphJet is the in-memory real-time graph engine over a sliding window of recent interactions; RealGraph covers the stable graph, SimClusters the topical communities._

**Q2. What is distinctive about a SimClusters representation?**

- It is a dense MF embedding
- Every dimension is an interpretable community  _(correct)_
- It is trained with BERT
- It only works for users

_Answer: Every dimension is an interpretable community. Each dimension is a community, which makes the vector interpretable, sparse (easy to index) and able to absorb new/churning content quickly._

**Q3. Which two Twitter components together cover stable vs. fresh relationship signals?**

- RealGraph (stable) and GraphJet (fresh)  _(correct)_
- SimClusters and TwHIN
- MaskNet and DLRM
- GraphJet and BERT4Rec

_Answer: RealGraph (stable) and GraphJet (fresh). RealGraph scores the slowly-evolving user-user graph offline; GraphJet maintains a sliding-window real-time graph — freshness is a retrieval feature layered on stability._

**Q4. TwHIN mainly addresses which operational concern?**

- ranking latency only
- shared heterogeneous embeddings and parameter drift across model versions  _(correct)_
- feature crossing
- negative sampling

_Answer: shared heterogeneous embeddings and parameter drift across model versions. TwHIN learns embeddings for a heterogeneous network and, crucially, keeps them compatible across model versions — the unglamorous deployment problem of drifting parameters._

