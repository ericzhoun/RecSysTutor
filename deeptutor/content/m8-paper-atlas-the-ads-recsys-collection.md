# Module m8 — Paper atlas: the Ads & RecSys collection

## Paper atlas: the Ads & RecSys collection

The 104 papers curated in the companion “Awesome Deep Learning Papers for Search,
      Recommendation & Advertising” repository — filterable by pipeline stage, research theme, company and year,
      with the curated lineage chains that connect them.

### The collection

This module folds an entire paper collection into the course. Where modules 1–7 teach the mechanisms, the atlas is
      the map: every paper is tagged with the **pipeline stage** it belongs to, the **research
      themes** it touches, the **company** that published or deployed it, and its venue and year.
- **104 papers · 9 stages · 11 themes · 16 companies · 15 venues**, spanning 2013–2026.
- It overlaps the course directly: the DIN → DIEN → SIM → TWIN behaviour-sequence line is module 4; ESMM and
        MMoE are module 5; DCN/GDCN, DeepFM and FFM are module 3.
- Six papers carry the repository’s “industrial + influential” ★★ marker.

### Lineage chains

The atlas also carries **curated “builds on” links** — 70 of them — that trace how ideas moved across
      papers. These chains are the shortest path through the field: read them top to bottom and you have the evolution of
      a family. Click any node to jump to that paper in the atlas above.

### How to use the atlas

- **Studying a stage?** Filter by stage (e.g. CTR Ranking) and read the papers in year order.
- **Choosing a project?** Filter by theme — *Generative & LLM* and *Debiasing & Sample
        Selection* are where the frontier is.
- **Working at a company?** Filter by company to see what peers actually ship.
- **Following an idea?** Use the lineage chains, then open each paper’s PDF.

> Provenance
      Paper titles, tags, lineage and PDF links come from the companion repository
        *Awesome-Deep-Learning-Papers-for-Search-Recommendation-Advertising* (`ads_knowledge_graph/`),
        reproduced here with attribution. The PDFs are hosted in that repository.

### Exercises

Two tasks that put the atlas to work as a research tool.

### Module check


## Quiz bank

**Q1. In the paper atlas, what does the “stage” tag tell you about a paper?**

- Its citation stage (early vs. late)
- Which part of the ads/recsys pipeline it addresses — retrieval, pre-ranking, CTR, CVR, calibration, …  _(correct)_
- How many stars it has
- The venue it was published at

_Answer: Which part of the ads/recsys pipeline it addresses — retrieval, pre-ranking, CTR, CVR, calibration, …. Stage tags map each paper onto the pipeline: Survey & Systems, Ads Retrieval, Pre-Ranking, CTR Ranking, CVR & Conversion, Delayed Feedback, Calibration, Relevance, Generative & Unified. Themes, companies and venues are separate filter dimensions._

**Q2. Which of these is one of the repository’s curated lineage chains?**

- DIN → DIEN → SIM → TWIN → TWINv2  _(correct)_
- MaskNet → SASRec
- BERT4Rec → DLRM
- Wide & Deep → GraphJet

_Answer: DIN → DIEN → SIM → TWIN → TWINv2. The behaviour-sequence family DIN → DIEN → SIM → TWIN → TWINv2 is a curated “builds on” chain, alongside ESMM → ESM2 → HM3 and DCN → GDCN. The other options mix unrelated families._

**Q3. In the atlas, `lineage` edges represent…**

- citation counts
- curated “builds on” relations that trace how ideas evolved across papers  _(correct)_
- venue rankings
- co-author links

_Answer: curated “builds on” relations that trace how ideas evolved across papers. Lineage edges are hand-curated, e.g. DIN → DIEN → SIM → TWIN → TWINv2; they turn the paper pile into ordered reading paths._

**Q4. Which atlas filter best surfaces the current frontier of the field?**

- venue
- theme (e.g. Generative & LLM, Debiasing & Sample Selection)  _(correct)_
- year only
- company size

_Answer: theme (e.g. Generative & LLM, Debiasing & Sample Selection). Themes group papers by research problem, so filtering by theme and reading in year order shows where the frontier is moving._

