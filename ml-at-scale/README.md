# ml-at-scale/ — companion reading library

244 posts from the **Machine Learning at Scale** collection by **Ludovico Bessi**,
incorporated as personal study material on 2026-09-30. The copies here are
platform-free: no external hosting links, images stored locally, cross-post links
rewritten to local files.

- `posts/` — one markdown file per post (`YYYY-MM-DD-slug.md`), with frontmatter
  (title, date, author, topic, paywalled flag) and cleaned body.
- `assets/` — deduplicated local images referenced by the posts.
- `index.md` — chronological table of all posts with topic and access flag.
- 244 posts (2023-01-01 → 2026-09-30), all stored in full — the paid posts were
  retrieved under the owner's own subscription for personal study.

## Topic map

- **Career & industry** (`career`) — 47 posts
- **Recommender systems & ranking** (`recsys`) — 40 posts
- **LLMs: architectures & training** (`llm`) — 39 posts
- **RL, alignment & agents** (`rl-agents`) — 22 posts
- **Retrieval, RAG & search** (`retrieval-rag`) — 22 posts
- **MLOps & production lessons** (`mlops`) — 21 posts
- **Core ML & theory** (`ml-theory`) — 19 posts
- **Serving & infrastructure** (`serving`) — 18 posts
- **Essays & newsletter notes** (`meta`) — 16 posts

## Reading paths (cross-references to the course)

- Retrieval foundations (course M2): `[RecSys] Part 1–2`, *Engineering Airbnb's
  Embedding-Based Retrieval System*, *Embedding Features in Weights to Kill Retrieval
  Latency*, *Dense Retrieval*, *Matryoshka representation learning*.
- Sequence & generative (M4): `[RecSys] Part 3`, *From two tower model to Generative
  retrieval 1–3*, *Beyond Immediate Click*, *Towards Large-scale Generative Ranking*.
- Ranking & multi-task (M3/M5): *LinkedIn's MixLM*, *ByteDance's TokenMixer-Large*,
  *Alibaba's EST*, *Kunlun Breakdown*, *IntentRec*, *CTR scaling laws*, *Meta's GEM*.
- Evaluation & production (M1/M7): *Evaluating ML ranking models offline and online*,
  the production war stories (`[Edition #N]` series: target leakage, calibration,
  recall collapse), *Production ML: A Reality Check on MLOps*.
- Embedding infrastructure (M10): *Feature stores in an embedding world*, the FAISS
  staleness war story, *Tackling the LLM Cold Start Problem with Smarter Storage*.
- Text-side retrieval & RAG (pairs with retrieval modules): *ColBERT and ColPALI*,
  *RankRAG*, *SPLARE*, *Beyond Basic RAG towards Agentic RAG*.

## Attribution

Content by Ludovico Bessi (Machine Learning at Scale), collected 2026-09-30 for
personal study. Rights remain with the author; do not redistribute.
