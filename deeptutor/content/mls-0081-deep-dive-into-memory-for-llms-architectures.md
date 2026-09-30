# Deep dive into "Memory for LLMs" architectures

*Machine Learning at Scale collection — Ludovico Bessi, 2025-03-16 · topic: llm*

*With a focus on Mem0 and Zep*

[](../assets/02060c99fdae114d.png)

# Introduction

Without memory capabilities, LLMs forget everything between sessions, forcing users to repeatedly provide the same context and preferences while wasting computational resources on redundant information processing. 

… That’s bad!!

As for every technical challenge, this spawned specialized open-source solutions designed to give LLMs persistent memory.

In today’s article, I will examine two projects in this space: Mem0 and Zep, analyzing their technical architectures, integration approaches, and use cases for ML engineers building production AI applications.

Let’s start!

# Mem0

Mem0 makes the design decision to split short term memory vs long term memory, from [1]:

**Short therm memory**

The most basic form of memory in AI systems holds immediate context - like a person remembering what was just said in a conversation. This includes:

  * **Conversation History** : Recent messages and their order

  * **Working Memory** : Temporary variables and state

  * **Attention Context** : Current focus of the conversation

**Long-Term Memory**

More sophisticated AI applications implement long-term memory to retain information across conversations. This includes:

  * **Factual Memory** : Stored knowledge about users, preferences, and domain-specific information

  * **Episodic Memory** : Past interactions and experiences

  * **Semantic Memory** : Understanding of concepts and their relationships

Each memory type has distinct characteristics:

**Short term:**

  * Persistence → Temporary

  * Access speed → Instant

  * Use case → Active conversations

**Long term:**

  * Persistence → Persistent

  * Access speed → Fast

  * Use case → User preference and history

Mem0’s long-term memory system builds on these foundations by:

  1. Using vector embeddings to store and retrieve semantic information

  2. Maintaining user-specific context across sessions

  3. Implementing efficient retrieval mechanisms for relevant past interactions

On top of supporting the majority of vector DBs, Mem0 also supports Graph memory through Neo4j.

**Retrieval mechanisms:**

  1. **Keyword search** : This mode emphasizes keywords within the query, returning memories that contain the most relevant keywords alongside those from the default search

  2. **Reranking** : Normal retrieval gives you memories sorted in order of their relevancy, but the order may not be perfect. Reranking uses a deep neural network to correct this order, ensuring the most relevant memories appear first

  3. **Filtering** : Filtering allows you to narrow down search results by applying specific criterias based on metadata information

Overall I find it a very well designed API layer that hides aways the complexity of multimodal RAG systems. Excited to see how they develop it further!ù

# Zep

Zep automatically constructs a temporal knowledge graph from agent user interactions and evolving business data. 

This knowledge graph contains entities, relationships, and facts related to the user and business context. Zep takes inspiration from GraphRAG, but unlike GraphRAG, Zep maintains a rich temporal understanding of how information evolves over time. As facts change or are superseded, the graph is updated to reflect the new state.

Graphiti is the underlying technology behind Zep’s memory layer. It is an open source library that builds dynamic, temporally-aware knowledge graphs that represent complex, evolving relationships between entities over time. It ingests both unstructured and structured data, and the resulting graph may be queried using a fusion of time, full-text, semantic, and graph algorithm approaches.

The big difference between them an Mem0 as far as I understand it is that they are going all in with their custom graph-based solution, claiming that they are SOTA on retrieval benchmarks.

I find that approach to be a bit too maximalist for my tastes, why not throw in some embedded information as well? I am pretty sure they do it under the hood, but I did not find a way to e.g. select an embedding model.

# Closing thoughts

I am excited to see how the space evolves. While it’s true that context of LLMs will keep growing, I don’t believe that In context learning will be the ultimate solution, because:

  * Cost skyrockets

  * You should at least train your LLM to rank the retrieved elements from the available context (if you are interested in more, take a look at this)

65\. Finetuning LLMs to make them good at RAG: RankRAG by no other than NVIDIA.Ludovico Bessi·December 1, 2024[Read full story](2024-12-01-65-finetuning-llms-to-make-them-good.md)

# References

  1. Mem0 docs

  2. Zep docs
