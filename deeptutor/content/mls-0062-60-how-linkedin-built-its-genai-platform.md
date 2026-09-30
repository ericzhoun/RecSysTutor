# 60. How LinkedIn built its GenAI platform

*Machine Learning at Scale collection — Ludovico Bessi, 2024-10-27 · topic: serving*

*A case study of big tech machine learning system design*

[](../assets/2423c8a95b80839a.png)

# Introduction

In today’s article, we go back a little the origins of this newsletter.

How big tech companies are designing and building their large scale systems?  
Today, I will discuss what LinkedIn did with their GenAI infrastructure.

After some iterations, they set out to build the following system: 

# What was easy?

The overall design was straightforward.

[](../assets/48a12ed9e8383f7d.png)From [1]

Very standard application for query-response system:

  1. **Routing** : decides if the query is in scope or not, and which AI agent to forward it to. Examples of agents are: job assessment, company understanding, takeaways for posts, etc.

  2. **Retrieval** : recall-oriented step where the AI agent decides which services to call and how (e.g. LinkedIn People Search, Bing API, etc.).

  3. **Generation** : precision-oriented step that sieves through the noisy data retrieved, filters it and produces the final response.

Tuning ‘routing’ and ‘retrieval’ felt more natural given their classification nature: they built dev sets and fitted them with prompt engineering and in-house models.

Now, generation, that was a different story. It followed the 80/20 rule; getting it 80% was fast, but that last 20% took most of the work. When the expectation from the product is that 99%+ of your answers should be great, even using the most advanced models available still requires a lot of work and creativity to gain every 1%.

Still, they were able to solve it by employing the following techniques:

  * Fixed 3-step pipeline

  * Small models for routing/retrieval, bigger models for generation

  * Embedding-Based Retrieval (EBR) powered by an in-memory database as a 'poor man's fine-tuning' to inject response examples directly into the prompts

  * Per-step specific evaluation pipelines, particularly for routing/retrieval

# Where was the struggle?

## Evaluation

Evaluating the quality of the answers turned out to be more difficult than anticipated. The challenges can be broadly categorised into three areas: developing guidelines, scaling annotation, and automatic evaluation.

  * **Developing guidelines** was the first big rock.

    * Clicking “Assess my fit for this job” and getting “You are a terrible fit” isn’t very useful. It should be factual but also empathetic. Some members may be contemplating a career change into fields where they currently do not have a strong fit, and need help understanding what are the gaps and next steps.

  * **Scaling annotation** was the second step. Initially everyone chimed in (product, eng, design, etc.), but that was not scalable. The internal linguist team built tooling and processes by which the product team could evaluate up to 500 daily conversations and get metrics around: overall quality score, hallucination rate, Responsible AI violation, coherence, style, etc. This became the main signpost to understand trends, iterate on prompts.

  * **Automatic evaluation** is the holy grail, but still a work in progress. Without it, engineers are left with eye-balling results and testing on a limited set of examples, and having a 1+ day delay to know metrics. They have been building model-based evaluators to estimate the above metrics & allow for much faster experimentation, and had some success on hallucination detection.

### Capacity & Latency

Capacity and perceived member latency were always top of mind. Some dimensions that were considered:

  * **Quality vs Latency** : techniques like Chain of Thought (CoT) are very effective at improving quality and reducing hallucinations. But they require tokens that the member never sees, hence increasing their perceived latency.

  * **Throughput vs Latency** : when running large generative models, it’s often the case that TimeToFirstToken (TTFT) & TimeBetweenTokens (TBT) increase with utilization. In the case of TBT it can sometimes be linear. It’s not uncommon to get 2x/3x the TokensPerSecond (TPS) if you are willing to sacrifice both of those metrics.

  * **Cost** : GPU clusters are not easy to come by and are costly. At the beginning they even had to set timetables for when it was ok to test the product or not, as it’d consume too many tokens and lock out developers from working.

  * **End to end streaming** : a full answer might take minutes to complete, all the requests stream to reduce perceived latency. For example the LLM response deciding which APIs to call is progressively parsed and API calls are fired as soon as parameters are ready, without waiting for the full LLM response. The final synthesized response is also streamed all the way to the client using a realtime messaging infrastructure.

  * **Async non-blocking pipeline** : Since LLM calls can take a long time to process, they optimized the service throughput by building a fully async non-blocking pipeline that does not waste resources on account of threads blocked on I/O.

# Closing thoughts

It’s getting more clear to me that they overall design for RAG-based GenAI applications are resembling more and more a normal software engineering workflow.

As always, the hardest part is getting from a proof of concept to an application that can scale to millions of users.

What are you currently struggling with in your GenAI workflows?

Ludo

# References

  1. **How LinkedIn built their GenAI platform**
