# The $32,400 Search Model That Silently Prioritized CEO Memos Over Results [Edition #15]

*Machine Learning at Scale collection — Ludovico Bessi, 2026-06-27 · topic: retrieval-rag*

[](../assets/55e9c9c9ef0db67f.jpg)

Lexisync is a Series C enterprise productivity company that recently crossed 5,000 corporate customers. They have seen 400 percent year-over-year growth in document creation following their move to a collaborative workspace model.

Their engineering team built a centralized search infrastructure called LexiSearch that powers all document retrieval across their web and mobile apps.

Here is their setup.

# Architecture Overview

When a user types a query into the search bar, the request hits the Search Gateway which orchestrates a two-stage retrieval process. First, an initial set of 100 candidates is pulled from a keyword-based index. These candidates are then passed to a neural reranking service to determine the final order presented to the user.

[](../assets/b9ced256e74fcb52.png)

# Traffic patterns

Document count: 15 million

Daily Active Users: 200,000

Average: 50 req/sec

Peak: 180 req/sec

### The ML Pipeline

The model is a DistilBERT cross-encoder fine-tuned on 1.2 million click-through logs. These logs were sourced entirely from the company’s internal dogfooding environment over an 18-month period. The training labels are binary: 1 if a document was clicked, 0 if it was shown but ignored. The training data includes the document author’s title and seniority level as metadata features.

Current performance

P99 Latency: 485ms

Reliability: 99.8 percent uptime

Business impact metric: 12 percent drop in Search-to-Click rate for junior-level accounts post-deployment.

Costs:

GPU Inference (AWS SageMaker g4dn.xlarge): $32,400 per month

OpenSearch Infrastructure: $4,800 per month

Total: $37,200 per month

Recent incidents:

In July, a viral internal company announcement by the CEO caused a massive spike in click signals for a single document. The model updated 24 hours later and began surfacing that announcement for unrelated queries like coffee machine or dental insurance for all internal users.

In September, the Reranker service hit a memory limit during a peak traffic hour because the cross-encoder was attempting to process 100 long-form document snippets simultaneously, leading to a 15-minute partial outage where search defaulted to raw BM25.

# The Analysis

Now let me show you what is actually happening here.

### Critical Issue #1: Institutional Authority Bias Encoding

I write about ML systems in production — the tradeoffs, the architecture decisions, the stuff that doesn’t make it into papers. If you want to go deeper, the paid tier covers the technical details I can’t fit in free posts

The architecture overview notes that the model was trained on internal dogfooding logs where the primary users are senior engineers and PMs. In a corporate environment, users click on documents authored by leadership because those documents carry mandate power, not necessarily because they are the most relevant to a specific task. By using binary clicks from a high-seniority cohort as the ground truth, the team has mathematically encoded the company’s social hierarchy into the transformer. The 12 percent drop in click rate for junior accounts is the proof: the system is optimizing for what an executive thinks is important, not what a junior employee needs to do their job.

### Critical Issue #2: The Cross-Encoder Latency Tax

Look at the 350ms latency for the BERT Reranker compared to the 15ms for OpenSearch. Because this is a cross-encoder, the model must perform a full self-attention pass over the query and document text joined together for every single one of the 100 candidates. This creates a hard ceiling on throughput. At 180 req/sec peak, they are forcing 18,000 query-doc inferences per second. This is why their GPU costs are astronomical compared to their search index costs. They are burning $32k a month just to reorder 100 items.

### Critical Issue #3: Positive Feedback Loop of Obsolescence

The system lacks a strategy for exploration. In the architecture overview, we see that the model is trained on what users clicked. If the reranker places a document at position 1, it gets more clicks. If it places a junior employee’s document at position 20, it gets zero clicks. The model then learns that position 20 documents are not relevant, ensuring they stay at the bottom in the next training iteration. This explains why the CEO’s memo started appearing for queries about coffee — the click signal was so strong it overrode the semantic relevance.

### Critical Issue #4: Unbounded Input Length in Inference

The recent incident in September where the service hit memory limits is a direct result of the cross-encoder design. The system tries to score 100 pairs at once. If those 100 documents happen to be long-form technical specs or legal docs, the token count explodes. The architecture section mentions scoring 100 pairs but does not mention a truncation strategy or a max sequence length per batch.

### Critical Issue #5: Compute Inefficiency for Static Content

They have 12 g4dn.xlarge instances running 24/7 just for reranking. In an enterprise search context, most documents do not change every minute. By reranking at query-time for every single request, they are wasting compute on redundant calculations. If five people search for the same roadmap, the system performs the same BERT inference five times instead of leveraging any form of embedding-based similarity or result caching.

# WHAT I D DO INSTEAD

### 1\. De-biased Training and Position Normalization

Impact:

Increase in junior employee search-to-click rate from 68 percent to 80 percent.

Reduction in authority bias by 40 percent.

Trade-offs:

Requires collecting more granular telemetry, specifically dwell time, to distinguish between a courtesy click on a manager’s post and an actual information-seeking click.

When this is the wrong call: If the enterprise culture is strictly top-down and users actually want to see executive content regardless of relevance.

### 2\. Move to a Bi-Encoder (Two-Tower) Architecture

Current: Cross-encoder scoring 100 docs at 350ms.

New: Generate document embeddings offline; use cosine similarity at query time.

Impact: 350ms latency → 20ms latency.

Trade-offs:

Slightly lower precision than cross-encoders because there is no cross-attention between query and document tokens.

Requires managing a vector database or adding vector support to OpenSearch.

### 3\. CPU-Based Inference with ONNX and Quantization

Replace: SageMaker g4dn.xlarge GPU instances ($32,400)

With: C6i CPU instances running quantized DistilBERT

Total: $8,600

Trade-offs:

Quantization (INT8) can lead to a 1-2 percent drop in model accuracy metrics like NDCG.

When this is the wrong call: If the model size exceeds 500MB, CPU latency might become unacceptable without heavy optimization.

# The Impact

Before redesign:

Search results heavily biased toward senior management documents.

$37,200 per month infrastructure cost.

After redesign:

Democratized search results with 15ms reranking latency.

$13,400 per month infrastructure cost (64 percent savings).

# APPENDIX: Cost Estimation Methodology

How I estimated the savings for each decision:

Solution 1: De-biased Training

Baseline: N/A (Process change).

After change: N/A.

Estimated saving: $0 (Focus is on quality/retention).

Key assumption: The data science team can implement propensity weighting using existing click logs.

Confidence: High — This is a standard approach in recommendation systems to fix position bias.

Solution 2: Bi-Encoder Architecture

Baseline: 12 GPU instances at $3.75/hr = $32,400/month.

After change: 4 CPU instances for embedding updates + Vector storage overhead = $4,200/month.

Estimated saving: $28,200/month (87 percent reduction).

Key assumption: Document update frequency is low enough that offline embedding generation doesn’t lag behind creation.

Confidence: Medium — Actual savings depend on the cost of the vector index at Lexisync’s scale.

Solution 3: CPU-Based Inference

Baseline: $32,400/month for GPU.

After change: 16 c6i.2xlarge instances at $0.68/hr = $7,833/month + $800 for orchestration.

Estimated saving: $23,767/month.

Key assumption: Quantized DistilBERT can hit sub-50ms latency on modern AVX-512 CPUs.

Confidence: High — Quantization is extremely effective for BERT-family models on Intel hardware.
