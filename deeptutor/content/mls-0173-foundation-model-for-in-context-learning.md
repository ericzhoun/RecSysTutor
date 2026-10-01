# Foundation Model for In-Context Learning on Relational Data

*Machine Learning at Scale collection — Ludovico Bessi, 2025-11-12 · topic: llm*

[](../assets/de6a4f07aa51e7a3.png)

**TLDR:** The KumoRFM paper introduces a pre-trained foundation model for zero-shot predictions on any relational database. From a system design perspective, it pairs a declarative Predictive Query Language (PQL) with a real-time data sampling engine, abstracting away the entire feature and label engineering pipeline.

The core architecture represents the database as a temporal graph and uses a Relational Graph Transformer to perform in-context learning on historical examples generated on-the-fly. For MLEs, this presents a paradigm shift from building bespoke models to querying a single, general-purpose system, offering both rapid prototyping via in-context learning and production scalability via an optional fine-tuning path.

# KumoRFM: A Deep Dive into the First Foundation Model for Relational Data

Machine learning on relational databases has traditionally been a bespoke, labor-intensive process of per-task feature engineering and model building. The KumoRFM paper introduces a compelling new architecture: a pre-trained Relational Foundation Model (RFM) designed for zero-shot, in-context learning on any relational database. This is a significant system-level undertaking that merits a closer look from a machine learning engineering perspective.

# The Declarative Front-End: PQL and Online Context Generation

The Predictive Query Language (PQL) is a declarative, SQL-like language that abstracts the entire machine learning workflow into a single predictive query.

A user defines the target variable (the PREDICT clause) and the entity of interest (the FOR clause), effectively specifying the prediction task without writing any training code or feature engineering logic. This design choice has profound system-level implications:

  * **Task Unambiguity:** The PQL query syntax directly maps to a specific ML task type—node classification, regression, or link prediction—allowing the system to automatically select the appropriate processing path.

  * **Leakage Prevention:** The language intentionally restricts time manipulation, ensuring that historical labels for in-context learning can be generated without future data leakage, a critical safeguard for temporal predictions.

This declarative front-end is powered by a real-time data processing engine. Instead of relying on offline-generated training sets, KumoRFM uses a dynamic, two-pronged sampling mechanism. When a query is issued, a backward-looking graph sampler extracts the k-hop subgraph around the target entity up to the prediction time, forming the input for the model. Simultaneously, a forward-looking sampler computes ground-truth labels from historical data to serve as context. The paper reports that this online system can generate approximately 2 million in-context labels in under one second, enabling true real-time predictive querying.

# Core Architecture: From Relational Graphs to In-Context Predictions

KumoRFM represents the relational database as a temporal, heterogeneous graph, where table rows are nodes and key relationships are edges.

The core model architecture processes these graph structures in three main stages:

  1. **Table-Invariant Row Embedding:** To generalize across arbitrary database schemas, the model first employs a table-agnostic encoding scheme. Each column is encoded based on its semantic type (numerical, categorical, text, embedding, etc.). A Transformer is then applied across the encoded columns of each row to produce a fixed-size row-level representation. This approach makes the model invariant to the number and type of columns in any given table.

  2. **Relational Graph Transformer (RGT):** Information is propagated across different tables (i.e., different node types in the graph) using a Relational Graph Transformer. This component performs self-attention on the nodes within the sampled subgraph, allowing the model to learn complex relationships and long-range dependencies. The input tokens to this transformer are enriched with positional encodings that capture node type, hop distance from the entity, and relative time, giving the model crucial structural and temporal awareness.

  3. **In-Context Learning (ICL):** The final stage executes in-context learning. The RGT encodes both the target subgraph (for which a prediction is needed) and multiple historical context subgraphs. A final Transformer module then attends to these encoded context subgraphs and their corresponding ground-truth labels to make a prediction for the target. This dual mechanism leverages context from both temporal and relational proximity—learning from an entity’s own past labels as well as the labels of its neighbors.

# Main Takeaways for Machine Learning Engineers

The KumoRFM paper offers several key system design lessons for building scalable and generalizable ML systems on structured data:

  * **Declarative Interfaces are Powerful:** PQL demonstrates the value of separating the definition of a predictive task from its implementation. A declarative API not only simplifies user interaction but also enforces best practices like preventing data leakage and ensuring reproducible label generation.

  * **Shift from Offline Training to Online Context Generation:** The system’s ability to dynamically generate labels and input features on-the-fly is a major architectural shift. It eliminates the need for brittle, offline ETL pipelines for creating training sets and enables a far more flexible and interactive “query anything” paradigm.

  * **Design for Heterogeneity:** The table-invariant row encoder is a crucial component for building a true foundation model. By handling the diversity of table schemas at the initial encoding stage, the core reasoning model (the RGT) can operate on a standardized representation, enabling it to generalize across entirely different databases.

  * **The Pragmatic “Fine-Tuning Escape Hatch”:** While powerful for exploration, in-context learning has scalability limitations for massive batch prediction tasks. The KumoRFM system pragmatically addresses this by including a fine-tuning capability. This allows a user to “specialize” the foundation model for a specific, high-volume task, converting it into a highly efficient supervised production pipeline. This hybrid approach offers the best of both worlds: zero-shot flexibility for development and optimized performance for production.

# References

  1. KumoRFM: A Foundation Model for In-Context Learning on Relational Data
