# RecSysTutor

An **interactive, single-file course on recommender systems for machine-learning engineers**, assembled from the
full post archive of the *“Be a happy and strong coder”* blog (Fan) —
<https://happystrongcoder.substack.com/archive?sort=top>.

- **9 modules · 47 lessons · 9 live widgets · 8 graded self-checks · 16 exercises · 104 linked papers**
- One self-contained HTML file — no build step, no dependencies, no network, works offline.

## Run it

Open `index.html` in any browser (double-click, or):

```bash
open index.html
```

If GitHub Pages is enabled, it also serves at `https://<user>.github.io/RecSysTutor/`.

## What's inside

The course is organised around the three-stage recommendation funnel — every model is pinned to a stage and to the
single problem it was invented to fix.

| Module | Content |
|---|---|
| M0 Orientation | How to use it · the model-family landscape map |
| M1 Foundations | Funnel anatomy · recommendation as classification · diversity · A/B testing |
| M2 Candidate generation | Two-tower retrieval · logQ bias correction · streaming frequency estimation · mixed negative sampling · FM retriever |
| M3 Ranking | Wide & Deep → DeepFM → DCN-V2 → xDeepFM → AutoInt → DLRM → FinalMLP → MaskNet |
| M4 Sequential & generative | Transformer · BERT · SASRec · BERT4Rec · HSTU (generative recommenders) |
| M5 Multi-task learning | MMoE · ESMM · multi-task optimisation I–III |
| M6 Case study: Twitter | RealGraph · GraphJet · SimClusters · MaskNet · TwHIN |
| M7 Practical toolkit | Criteo preprocessing with Pandas · end-to-end capstone |
| M8 Paper atlas | The 104-paper Ads & RecSys collection — filter by stage / theme / company / year · curated lineage chains |

Seven interactive widgets let you manipulate the mechanisms directly (funnel explorer, extreme-multiclass cost & bias,
ECS/diversity index, normalisation & temperature, logQ correction, a runnable streaming frequency estimator, and MMoE
gating), and module 8 adds a **filterable paper atlas** plus a **lineage explorer**. Every module ends with **two
hands-on exercises** (hint + reference solution) and a graded self-check, so the course is a workbook, not just a read.

- `index.html` — the course (open this)
- `syllabus.md` — module/lesson → source-post map, learning tracks, widget index

## Source & attribution

Every lesson summarises or explains material from the **“Be a happy and strong coder”** blog by **Fan**
(<https://happystrongcoder.substack.com>). Figures, claims and quotes are attributed to those posts; external papers are
named by title so you can find the originals. The diagrams, interactive widgets, quizzes and course structure are
original to this repo.

> **Reuse note:** the underlying ideas and any quoted material belong to the original author. This repo is a
> transformative, attributed study guide. Confirm the source author's terms before redistributing or commercialising
> the derived text.

## Paper atlas (module 8)

Module 8 folds in the **104 ads/recsys papers** (with tags, curated lineage and PDF links) curated in the companion
repository `Awesome-Deep-Learning-Papers-for-Search-Recommendation-Advertising`, sourced from its `ads_knowledge_graph/`
graph. Papers can be filtered by pipeline stage, research theme, company and year, and the curated “builds on” lineage
chains (e.g. `DIN → DIEN → SIM → TWIN → TWINv2`) are rendered as clickable paths. PDFs are hosted in that repository.
