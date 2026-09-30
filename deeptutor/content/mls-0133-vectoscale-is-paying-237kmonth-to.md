# VectoScale Is Paying $237k/Month to Hide a Bad Architectural Decision [Edition #1]

*Machine Learning at Scale collection — Ludovico Bessi, 2026-03-21 · topic: mlops*

*Dissecting a hybrid retrieval system that scaled its problems faster than its product.*

[](../assets/ca354e32fce9c3ce.jpg)

# The System

VectoScale is a Series B AI infrastructure company that recently crossed 500M daily queries across their managed retrieval platform.

They have grown 4x in 12 months by undercutting Pinecone on pricing and winning mid-market SaaS customers.

Their engineering team built a hybrid retrieval pipeline that powers semantic search, RAG grounding, and recommendation ranking for ~200 enterprise customers.

# Their setup

When a query enters the system, it triggers a dual-path retrieval process before hitting a fusion layer and a final reranking stage:

[](../assets/edba5ef014410460.png)

### Traffic patterns

Total volume: 500 million queries per day

Average: 5,780 requests per second

Peak: 14,000 requests per second

### The ML Pipeline

The system uses the sentence-transformers/all-mpnet-base-v2 model for generating 768-dimensional embeddings.

It is a standard bi-encoder approach trained on 1B+ sentence pairs.

Sparse retrieval is handled by Elasticsearch using the BM25 algorithm.

For quality, they have layered a BERT-based cross-encoder on top to re-score candidates.

### Current performance

p50 Latency: 180ms

p99 Latency: 2,400ms

Reliability: 99.8% (impacted by reranker timeouts)

Business impact: High churn in the “Pro” tier due to inconsistent search speeds.

### Costs

GPU Inference (A10G instances): $145,000 / month

Vector Storage (Memory-optimized r6g instances): $92,000 / month

Total: $237,000 / month

### Recent incidents

Latency spike to 10s: Traced to the reranker being called on the full retrieval set (2,000+ candidates) instead of the top-k (100) after an orchestrator config error.

Relevance regression: Elasticsearch upgraded its default text analyzer configuration mid-rollout, causing a 12% drop in NDCG@10 across 40% of customers who relied on specific stop-word handling.

# The Analysis

Now let me show you what is actually happening here.

### Critical Issue 1: The Reranker O(N) Fan-out

The team is currently piping the entire output of the hybrid fusion (RRF) directly into the cross-encoder. Because cross-encoders process query-document pairs together, the compute cost is linear to the number of documents retrieved.

At peak traffic, the A10G fleet hits 95% utilization not because of query volume, but because they are reranking 500+ documents per query when only the top 10 are actually displayed. This is why p99s are ten times higher than p50s.

### Critical Issue 2: Storage Tax of 768-dim Bloat

VectoScale is storing full 768-dimensional float32 vectors for every document across 200 tenants with zero quantization. We are looking at 3KB of raw vector data per document. At their scale, they are paying for massive amounts of RAM just to keep HNSW indexes around.

They passed on Matryoshka Representation Learning because it was “experimental,” but the alternative is a $1M+ annual storage bill that scales linearly with their customers’ growth.

### Critical Issue 3: One-Size-Fits-All Indexing

They use identical HNSW parameters (M=16, ef_construction=200) for every customer. A 10,000-document knowledge base for a small startup is being indexed with the same complexity as a 50-million-document corpus for an enterprise. This leads to massive memory overhead for small tenants and poor recall/high latency for large ones.

### Critical Issue 4: Fragile BM25 Dependencies

“Elasticsearch upgraded its default text analyzer configuration mid-rollout.” This is a classic infrastructure failure. By not pinning their sparse retrieval logic or using a custom analyzer, they have decoupled their retrieval logic from their ranking logic. When the tokenizer changed, the overlap between the sparse index and the dense reranker was broken, rendering the RRF fusion meaningless.

### Critical Issue 5: The Managed Service Paradox

They have 24 dedicated nodes just for the reranker fleet. This is an enormous footprint for a company that claims to be “vector-native.” They are essentially running a massive GPU compute cluster to fix a relevance problem that should have been solved at the embedding and indexing stage.

# WHAT I WOULD DO INSTEAD

### 1\. Implement Strict Two-Stage Retrieval

Apply a hard cap of K=50 for the reranker input. Implement a “short-circuit” logic where if the RRF score of the top 5 results exceeds a high-confidence threshold, the reranker is skipped entirely.

Impact: p99 Latency: 2,400ms → 450ms. GPU compute requirements reduced by 60%

### 2\. Tiered Quantization Strategy

Replace the raw float32 storage with 1-bit (binary) or 8-bit (int8) quantization for the initial retrieval stage. Use the full precision vectors only for the final rescoring if necessary.

Current: 768-dim float32 (3072 bytes/doc)

New: 768-dim int8 (768 bytes/doc)

Impact: Storage Cost: $92k/month → $32k/month

### 3\. Transition to ColBERT or Matryoshka

Replace the expensive BERT cross-encoder ($145k/mo) with a late-interaction model like ColBERT or use Matryoshka-capable embeddings (like nomic-embed-text) to allow for 128-dim sub-vector retrieval.

Replace: Cross-encoder on A10Gs ($145k)

With: ColBERT on CPU or Matryoshka-optimized dense search

Total: New monthly infra spend: ~$85,000

[](../assets/846bd6d8d6a45b55.png)

# The Impact

**Before redesign:**

System is bottlenecked by a heavy reranker that scales poorly.

Monthly Cost: $237,000

**After redesign:**

System is optimized for multi-stage retrieval with significant memory savings.

Monthly Cost: $85,000 (64% savings)

# The Lesson

The system already told them what is wrong:

Latency spike to 10s → Your reranker is an O(N) liability, not a “quality fix.”

High storage costs → Your 768-dim float32 vectors are a luxury you cannot afford at 500M queries.

They just need to listen to what the system is saying.

At what point does the cost of a cross-encoder reranker outweigh the precision gains? 

Is it ever worth it to run them at 500M+ queries per day?

# Closing notes

Did you enjoy this first edition of the format? It’s an experiment, but I quite like it. Leave me a comment with what you think. I answer them all.

Ludo
