# Recommendation Systems, End to End — syllabus & source map

An interactive course for machine-learning engineers, built from the full archive of the
*“Be a happy and strong coder”* blog (Fan) — <https://happystrongcoder.substack.com/archive?sort=top>.

- **Interactive course:** `index.html` (single file, offline, no dependencies)
- **Audience:** ML engineers who know deep learning but are new to (or levelling up in) recommender systems
- **10 modules · 48 lessons · 9 interactive widgets · 8 self-checks · 16 exercises · 104 linked papers · DeepTutor-powered tutor**

Each lesson follows the same shape: the problem → the idea → the mechanics → a practical takeaway.
Every module ends with a graded self-check, and progress is tracked in the sidebar for the session.

---

## Learning tracks

| Track | Modules | Focus |
|---|---|---|
| A — Retrieval | M2, M6 | Candidate generation: two-tower, FM, graph retrievers |
| B — Ranking | M3 | The CTR feature-interaction family (the densest module) |
| C — Sequence & generative | M4 | Transformer → SASRec → BERT4Rec → HSTU |
| D — Multi-task | M5 | MMoE, ESMM, and the multi-task optimiser zoo |

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

## Exercises

Every module (M1–M8) ends with **two hands-on exercises** (16 total) with a progressive-disclosure **hint** and a
**reference solution** (code where appropriate) — e.g. computing ECS/DI, sizing an A/B test, implementing the streaming
frequency estimator, logQ correction, a DCN cross layer, DLRM pairwise masking, positional encodings, the SASRec causal
objective, MMoE gating, the ESMM loss, retrieval routing, SimClusters-style community vectors, downsampling
recalibration, and atlas/lineage research tasks. Each module also ends with a graded self-check (2–4 questions).

Widgets run entirely in the page: no network, no tracking, nothing stored beyond the session.

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

## Module 9 — DeepTutor integration (interactive tutor)

The course is exported to Markdown and ingested into **DeepTutor** (HKUDS) as the knowledge base `recsys-course`, so the
same notes power a grounded tutor. The integration lives in `deeptutor/`:

- `tools/export_kb.py` — converts the course HTML + papers graph into Markdown
- `content/` — one document per module (lesson prose, formulas, code, exercises, quiz bank) plus `papers-atlas.md`
- `scripts/` — `setup_kb.sh`, `tutor.sh`, `quiz.sh`, `study_plan.sh`
- `generated/` — example outputs from DeepTutor capabilities

Capabilities wired up: grounded **RAG chat**, **deep_question** (quiz generation), **deep_solve** (exercise solving),
**deep_research**, **visualize**, and **mastery_path**. See `deeptutor/README.md` for commands and prerequisites.

---

## Module 8 — paper atlas source

The atlas in module 8 is generated from the graph in the companion repository
`Awesome-Deep-Learning-Papers-for-Search-Recommendation-Advertising`, file `ads_knowledge_graph/knowledge_graph.json`
(104 paper nodes · 9 stage hubs · 11 theme hubs · 16 company hubs · 70 `lineage` edges). Papers are tagged by pipeline
stage, research theme, company, venue and year; the curated lineage chains are the repository's "builds on" relations.
Reproduced with attribution; the linked PDFs are hosted in that repository.
