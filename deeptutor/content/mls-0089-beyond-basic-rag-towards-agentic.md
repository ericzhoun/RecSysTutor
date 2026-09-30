# Beyond Basic RAG towards Agentic RAG

*Machine Learning at Scale collection — Ludovico Bessi, 2025-05-11 · topic: retrieval-rag*

**S** caling basic RAG to a robust, production-grade system is quite hard: making it multimodal, latency problems, query rewriting, edge cases, etc. 

Today, I want to explore the architectural shifts I am seeing, especially focusing around agentic workflows.

# Naive RAG challenges

The core challenge with "naive" RAG often lies in a few key areas:

  * **Brittle Data Ingestion:** Simply parsing PDFs with standard libraries often leads to jumbled text, especially with complex layouts like tables or multi-column documents. This "garbage in, garbage out" scenario surprisingly remains a major problem

  * **Limited Query Reasoning:** Basic RAG struggles to decompose complex user queries or strategically plan how to best retrieve an answer.

  * **Lack of Actionability:** It's primarily an information retrieval system, not an action-taking one.

  * **Statelessness:** Each interaction is often treated anew, missing the conversational context.

  * **Lack of Evals:** vibe checks are still how 90% of engineers test these systems. That’s bad bad!

Let’s see how to improve things!

**Pillar 1: Retrieval is 90% of the job**

I cannot stress this enough: the quality of any LLM application is fundamentally tied to its data pipeline.

  * **High-Fidelity Parsing:** We're moving beyond one-size-fits-all parsers. The need is for specialized services that can meticulously extract and preserve the semantic structure of text, tables, and even identify embedded images from complex documents. The goal is to feed clean, well-structured data to the retrieval and generation stages. For enterprise-scale operations, I expect to see more managed cloud services emerge to handle this production-grade parsing and indexing challenge.

  * **Intelligent Chunking & Indexing:** This isn't just about splitting text anymore! Advanced techniques like hierarchical indexing are becoming more mainstream for effectively modeling the diverse data types (text, tables, multimodal content) often found within a single source document, enabling much more precise context retrieval.

**Pillar 2: Agentic RAG**

Simply retrieving and stuffing context isn't enough. The RAG process itself needs to become more intelligent and dynamic. This is where the concept of "Agentic RAG" comes in, embedding agent-like decision-making at various stages.

An agentic RAG system introduces intelligent behaviors throughout the pipeline:

[](../assets/236de49f43c772aa.png)Image taken from tweet [1]. Give Akshay a follow! :)

  1. **Agent-driven Query Refinement:** An agent first processes the user's query, potentially rewriting it to correct errors, clarify ambiguities, or expand it for better retrieval.

  2. **Contextual Decision-Making & Sourcing:** The agent then intelligently decides if it has sufficient context.

     * If yes, the (rewritten) query and context proceed to the LLM.

     * If not, the agent can decide which external tools or data sources are best suited to fetch the _missing_ context.

  3. **Iterative Response Validation:** After the LLM generates a response, an agent critically evaluates its relevance and accuracy.

     * If the answer is good, it's returned.

     * If not, the system can loop back – perhaps to re-evaluate the context, try a different data source, or even further refine the query. This iterative process continues until a high-quality response is achieved or the system gracefully admits it can't answer.

This approach makes the entire RAG system more robust, as agents at each step ensure the outcomes align with the overarching goal.

It's a flexible blueprint that can be adapted based on specific use-case needs, balancing sophistication with performance.

> It’s also quite hard to test as you have multiple “agentic microservices” that collaborate together!

**Pillar 3: Multi-Agent Architectures**

For truly complex problem-solving, the architectural vision extends beyond even a single, highly capable agent. Multi-agent systems are emerging as a powerful paradigm:

  * **Why Go Multi-Agent?**

    * **Specialization:** Different agents can be optimized (even using different underlying LLMs or fine-tuning) for specific tasks – one for data retrieval, another for SQL generation, a third for summarizing complex reports, etc. This leads to higher quality on sub-tasks.

    * **Parallelization & Efficiency:** Complex problems can be decomposed and assigned to multiple agents that can work concurrently, potentially improving overall throughput and latency.

    * **Cost/Latency Optimization:** Simpler, specialized tasks can be handled by smaller, faster, or cheaper LLM agents, reserving more powerful (and expensive) models for orchestration or complex reasoning.

  * **Architectural Pattern: Agents as Microservices**  
A promising approach is to treat individual agents as distinct microservices. This promotes:

    * **Service-Oriented Design:** A clear separation of concerns.

    * **Encapsulation & Modularity:** Agents can be developed, updated, and scaled independently.

    * **Standardized Communication:** Agents can interact via well-defined APIs, often through a message queue, allowing for asynchronous operations.

    * **Orchestration:** A dedicated **control plane** (which could itself be an LLM or a more deterministic system) manages the flow of tasks and information between these agent services. This orchestration can be explicit (pre-defined workflows) or implicit (the orchestrator dynamically decides the next step).

# **References**

  1. Agentic RAG tweet

  2. AI Engineer Video on Agentic RAG
