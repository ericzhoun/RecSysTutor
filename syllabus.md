# Recommendation Systems, End to End — syllabus & source map

An interactive course for machine-learning engineers, built from the full archive of the
*“Be a happy and strong coder”* blog (Fan) — <https://happystrongcoder.substack.com/archive?sort=top>.

- **Interactive course:** `index.html` (single file, offline, no dependencies)
- **Audience:** ML engineers who know deep learning but are new to (or levelling up in) recommender systems
- **12 modules · 58 lessons · 11 interactive widgets · 10 self-checks · 20 exercises · 104 linked papers · 244-post reading library · DeepTutor-powered tutor**
- **Optional account** — sign in (via the live page) to keep progress, self-check answers, a roadmap and a streak across
  sessions and devices; signed out, progress is saved in the browser.

Each lesson follows the same shape: the problem → the idea → the mechanics → a practical takeaway.
Every module ends with a graded self-check, and progress is tracked in the sidebar.

---

## Learning tracks

| Track | Modules | Focus |
|---|---|---|
| A — Retrieval | M2, M6 | Candidate generation: two-tower, FM, graph retrievers |
| B — Ranking | M3 | The CTR feature-interaction family (the densest module) |
| C — Sequence & generative | M4 | Transformer → SASRec → BERT4Rec → HSTU |
| D — Multi-task | M5 | MMoE, ESMM, and the multi-task optimiser zoo |
| E — The library | M11 | The 244-post production-ML corpus, read as evidence under M1–M10 |

**Personal learning path.** Lesson 01 of M0 asks six questions (recommender experience, engineering background, maths
comfort, goal, focus area, weekly time) and lays out a recommended track plus a phased plan: lessons to study, lessons
to skim, and lessons to save for later, with an hours-and-weeks estimate. Two reference learners:

| Learner | Recommended | Path |
|---|---|---|
| Fresh PhD graduate, new to recommenders, no SWE experience, aiming for a first role | Track A, then B | Foundations (M1) → the two core stages (two-tower, Wide & Deep, DeepFM, DCN) → one lesson from each frontier → make it real (Criteo preprocessing, capstone, embedding tables, war stories, interview framing) |
| Mid-career engineer who has shipped DNN recommenders and wants depth | Track C, then D | Skim (diversity, A/B testing, negative sampling, choosing a ranker) → SASRec → BERT4Rec → HSTU → multi-task (MMoE, ESMM, the reality check) → paper lineage and reading paths |

---

## Module map

| Module | Lessons | Source posts |
|---|---|---|
| **M0 Orientation** | How to use · The landscape | (course intro; archive) |
| **M1 The funnel & foundations** | Anatomy of a recommender · Recommendation as classification · Diversity & long-term health · A/B testing done right | Deep Neural Networks for YouTube Recommendations · Diversity in recommendation · Demystify AB Testing |
| **M2 Candidate generation** | Two-tower foundations · Mixed negative sampling & production upgrades · FM as a retriever | Two tower candidate retriever I / II / III · From FM to DeepFM |
| **M3 Ranking & feature interaction** | Wide & Deep · FM → DeepFM · DCN → DCN-V2 · xDeepFM · AutoInt · DLRM · FinalMLP · MaskNet · Choosing a ranker | Wide & Deep Learning · From FM to DeepFM · Deep & Cross Network · DCN V2 · xDeepFM · AutoInt · Deep Learning Recommendation Model · FinalMLP · Dive into Twitter V - MaskNet |
| **M4 Sequential & generative** | Transformer from scratch · BERT · SASRec · BERT4Rec · HSTU | Transformer with code I & II · A Gentle Introduction to BERT · SASRec · BERT4Rec · Actions Speak Louder than Words (HSTU) |
| **M5 Multi-task learning** | MMoE · ESMM · MTL optimisation I / II / III | Modeling Task Relationships with MMoE · Entire Space Multi-Task Model · Optimization in Multi Task Learning I / II / III |
| **M6 Case study: Twitter** | RealGraph · GraphJet · SimClusters · MaskNet in production · TwHIN & the system picture | Dive into Twitter’s recommendation system I–VI |
| **M7 Practical toolkit & capstone** | Data preprocessing with Pandas (Criteo) · Capstone — design one system end to end | Quick data preprocessing with Pandas on Criteo · (synthesis) |
| **M8 Paper atlas** | The collection · Lineage chains · How to use the atlas | Awesome-Deep-Learning-Papers-for-Search-Recommendation-Advertising (`ads_knowledge_graph/`) — 104 ads/recsys papers |
| **M9 AI tutor** | From static page to personal tutor | DeepTutor (HKUDS) — knowledge base `recsys-course`, RAG chat, quiz generation, mastery paths |
| **M10 Embedding infrastructure** | The table *is* the model · loading & training it · when it doesn't fit · decision table | DLRM (parallelism) + TwHIN (parameter drift) from earlier modules; production practice |
| **M11 Reading library** | The collection · Browsing it · Reading paths · The war stories | *Machine Learning at Scale* (Ludovico Bessi) — see `ml-at-scale/` |

---

## Interactive widgets

1. **Funnel explorer** — click candidate generation / ranking / reranking (M1).
2. **Extreme-multiclass cost & bias** — corpus size, negatives, popularity skew (M1).
3. **Effective catalog size & diversity index** — item-share sliders → ECS/DI (M1).
4. **Normalisation & temperature** — one query, five items: τ sharpens/flattens the retrieval distribution (M2).
5. **logQ sampling-bias correction** — raw logit vs corrected logit (M2).
6. **Streaming frequency estimator** — run the online Δ-estimation algorithm (M2).
7. **MMoE gating** — same experts, per-task gates, live softmax weights (M5).
8. **Paper atlas** — filter 104 papers by stage, theme, company, year and free text (M8).
9. **Lineage explorer** — the 70 curated “builds on” links rendered as clickable chains (M8).
10. **Embedding table memory planner** — size a table (features × cardinality × dim × precision × optimiser state) against device memory and get the ordered plan (M10).
11. **Reading-library browser** — filter the 244 posts by topic, year, free text or length, and open the post (M11).

## Exercises

Every module except M0 (orientation) and M9 (the tutor) ends with **hands-on exercises** (20 total) with a
progressive-disclosure **hint** and a
**reference solution** (code where appropriate) — e.g. computing ECS/DI, sizing an A/B test, implementing the streaming
frequency estimator, logQ correction, a DCN cross layer, DLRM pairwise masking, positional encodings, the SASRec causal
objective, MMoE gating, the ESMM loss, retrieval routing, SimClusters-style community vectors, downsampling
recalibration, atlas/lineage research tasks, sizing/sharding an embedding table, and reading-library research tasks.
Each of those modules also ends with a graded
self-check (2–4 questions).

Widgets run entirely in the page: no network, no tracking. Progress is stored in your browser, and kept with your
account when you sign in on the live page.

---

## Source posts (canonical URLs)

- Deep Neural Networks for YouTube Recommendations — `https://happystrongcoder.substack.com/p/deep-neural-networks-for-youtube`
- Two tower candidate retriever I — `.../p/two-tower-candidate-retriever-i`
- Two tower candidate retriever II — `.../p/two-tower-candidate-retriever-ii`
- Two tower candidate retriever III — `.../p/two-tower-candidate-retriever-iii`
- From FM to DeepFM — `.../p/from-fm-to-deepfm-the-almighty-factorization`
- Wide & Deep Learning for Recommender Systems — `.../p/wide-and-deep-learning-for-recommender`
- Deep & Cross Network for Ad Click Predictions — `.../p/deep-and-cross-network-for-ad-click`
- DCN V2 — `.../p/dcn-v2-improved-deep-and-cross-network`
- xDeepFM — `.../p/xdeepfm-combining-explicit-and-implicit`
- AutoInt — `.../p/autoint-automatic-feature-interaction`
- Deep Learning Recommendation Model (DLRM) — `.../p/deep-learning-recommendation-model`
- FinalMLP — `.../p/finalmlp-an-enhanced-two-stream-mlp`
- Transformer with code Part I / II — `.../p/transformer-with-code-part-i-positional` · `.../p/transformer-with-code-part-ii-encoder`
- A Gentle Introduction to BERT — `.../p/a-gentle-introduction-to-bert-pre`
- SASRec — `.../p/sasrec-self-attentive-sequential`
- BERT4Rec — `.../p/bert4rec-sequential-recommendation`
- Actions Speak Louder than Words (HSTU) — `.../p/actions-speak-louder-than-words-trillion`
- Modeling Task Relationships with MMoE — `.../p/modeling-task-relationships-in-multi`
- Entire Space Multi-Task Model (ESMM) — `.../p/entire-space-multi-task-model-an`
- Optimization in Multi Task Learning I / II / III — `.../p/optimization-in-multi-task-learning` · `-d48` · `-919`
- Dive into Twitter’s recommendation system I–VI — `.../p/dive-into-twitters-recommendation` (+ `-7cd`, `-6ce`, `-b83`, `-6fc`, `-551`)
- Diversity in recommendation — `.../p/diversity-in-recommendation`
- Demystify AB Testing — `.../p/demystify-ab-testing`
- Quick data preprocessing with Pandas on Criteo — `.../p/quick-data-preprocessing-with-pandas`

All URLs are under `https://happystrongcoder.substack.com`. Figures and claims in the course are attributed
to these posts; external papers are named by title in-lesson so you can find the originals.

---

Each module ends with a **Sources & further reading** block: the blog post(s) it derives from plus the primary
papers, each with a verified link (all 51 cited links resolve).

## Module 9 — DeepTutor integration (interactive tutor)

The course is exported to Markdown and ingested into **DeepTutor** (HKUDS) as the knowledge base `recsys-course`, so the
same notes power a grounded tutor. The integration lives in `deeptutor/`:

- `tools/export_kb.py` — converts the course HTML + papers graph into Markdown
- `content/` — one document per module (lesson prose, formulas, code, exercises, quiz bank) plus `papers-atlas.md`
- `scripts/` — `setup_kb.sh`, `tutor.sh`, `quiz.sh`, `study_plan.sh`
- `generated/` — example outputs from DeepTutor capabilities

Capabilities wired up: grounded **RAG chat**, **deep_question** (quiz generation), **deep_solve** (exercise solving),
**deep_research**, **visualize**, and **mastery_path**. See `deeptutor/README.md` for commands and prerequisites.

**Live chat** additionally runs on Butterbase (`butterbase/`): a serverless function (`tutor-chat`) plus the course notes
as the `recsys-course` RAG collection, with the LLM provider from the project `.env`. Open it at
[`chat.html`](./chat.html) or from the M9 lesson — answers cite the modules they were grounded in.

---

## Module 8 — paper atlas source

The atlas in module 8 is generated from the graph in the companion repository
`Awesome-Deep-Learning-Papers-for-Search-Recommendation-Advertising`, file `ads_knowledge_graph/knowledge_graph.json`
(104 paper nodes · 9 stage hubs · 11 theme hubs · 16 company hubs · 70 `lineage` edges). Papers are tagged by pipeline
stage, research theme, company, venue and year; the curated lineage chains are the repository's "builds on" relations.
Reproduced with attribution; the linked PDFs are hosted in that repository.

---

## Module 11 — companion reading library (`ml-at-scale/`)

The course page carries this module directly: four lessons, an eight-path reading map, a
war-story digest, two exercises and a self-check, plus a **filterable browser over all 244 posts**
(topic / year / free text / length) that opens each post from `ml-at-scale/posts/`.

244 production-ML posts from the *Machine Learning at Scale* collection (Ludovico Bessi,
collected 2026-09-30), stored platform-free with local images. `deeptutor/content/m11-*.md`
holds the topic map and reading paths cross-referenced to M1–M10; `deeptutor/content/mls-*.md`
is the text-only corpus of all 244 posts for the knowledge base (the paid posts were
retrieved in full via the owner's own subscription).
