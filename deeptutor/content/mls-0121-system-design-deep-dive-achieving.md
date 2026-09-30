# System Design Deep Dive: Achieving Frontier LLM Performance at 1/90th the Cost

*Machine Learning at Scale collection — Ludovico Bessi, 2025-12-21 · topic: serving*

[](../assets/9d160268dd8b8917.png)

### **TL;DR:**

  * **OSS Outperforms Frontier:** Using a new prompt optimization technique (GEPA), the open-source gpt-oss-120b model surpassed the baseline performance of Claude Opus 4.1 on a complex information extraction benchmark (IE Bench) by ~3%.

  * **Massive Cost Reduction:** This superior performance was achieved while being **90x cheaper** to serve than Claude Opus 4.1, fundamentally shifting the quality-cost Pareto frontier.

  * **Superior to SFT on Cost-Performance:** In a head-to-head comparison on gpt-4.1, GEPA-based prompt optimization delivered slightly better performance than Supervised Fine-Tuning (+2.1 vs +1.9 points) with a **~20% lower serving cost**.

  * **Optimization Cost is Negligible at Scale:** Lifetime cost analysis shows that the one-time, upfront cost of running the optimization process is quickly amortized and becomes insignificant compared to the massive savings in serving costs for production workloads (e.g., >100k requests).

# **Technical Breakdown**

## **The Challenge: The Quality vs. Cost Trade-off in Production**

The core challenge for MLEs is deploying systems that are both highly accurate and cost-efficient. Proprietary models like Claude Opus 4.1 held the top performance spot, but open-source models like gpt-oss-120b offered a much better price point, albeit with a quality gap. Claude Opus 4.1 was found to be ~90x more expensive than gpt-oss-120b.  
Can you improve OSS models?

## **The Method: Automated Prompt Optimization with GEPA**

Instead of manual prompt engineering, the Databricks team applied automated prompt optimization algorithms.   
The standout technique was GEPA, a new method from Databricks and UC Berkeley that uses an evolutionary search algorithm guided by feedback signals to iteratively improve prompt instructions.

A key implementation detail for systems designers is the concept of a stronger “optimizer” model guiding a more efficient “student” model. The best results were achieved by using Claude Sonnet 4 as the optimizer to refine prompts for the gpt-oss-120b student model.

The result was a +4.3 point improvement for gpt-oss-120b, pushing it past the baseline performance of not just Claude Sonnet 4, but also the top-performing Claude Opus 4.1.

## **A Deeper Look: How GEPA’s Reflective Evolution Works**

GEPA (Genetic-Pareto) represents a significant shift from other optimization techniques. Instead of relying on sparse, scalar rewards (e.g., a single accuracy score), it leverages the rich, interpretable nature of language as the primary feedback mechanism, making it up to 35x more sample-efficient than traditional Reinforcement Learning approaches.   
The process can be broken down into a core iterative loop: Reflect → Mutate → Evolve.

  1. **Execute and Capture Trace** : The process begins by executing the current candidate prompt on a batch of tasks. Crucially, GEPA captures the entire execution trace—not just the final output, but all intermediate reasoning steps, tool calls, error messages, and other textual artifacts. This rich, text-based log is the raw material for reflection.

  2. **Language-Based Reflection** : This is the core innovation. The captured trace is fed to a powerful “optimizer” LLM, which acts as a critic. This critic model analyzes the trace in natural language to diagnose failures or identify areas for improvement. Instead of a simple “good/bad” signal, the feedback is a detailed, actionable critique. For example: _“The student model failed to extract the invoice date. The prompt should explicitly instruct the model to locate a field labeled ‘Invoice Date’ and format it as YYYY-MM-DD.”_

  3. **Guided Mutation** : The natural language critique from the reflection step is then used as a directive for an “evolver” LLM. This LLM edits the original prompt to incorporate the feedback. This is not a random mutation but a targeted, intelligent revision based on the specific failure modes identified by the critic.

  4. **Pareto-Based Selection** : GEPA doesn’t seek a single “best” prompt. It maintains a diverse pool of high-performing candidates on a Pareto frontier. A prompt is considered “Pareto-optimal” if no other prompt is superior to it across all evaluated objectives (e.g., accuracy, cost, latency). This allows the system to explore trade-offs—for instance, maintaining both a highly accurate but expensive prompt and a slightly less accurate but much cheaper one. This evolutionary pressure, combined with the merging of traits from different successful candidates, guides the search toward a robust and efficient set of final prompts.

This entire loop turns prompt engineering from a manual art into an automated, self-correcting system that learns _why_ it fails and encodes those lessons into better instructions.

## **System Comparison: Prompt Optimization vs. Supervised Fine-Tuning (SFT)**

SFT is often the default choice for domain-specific performance improvement.  
The research provides a crucial system-level comparison:

  1. **Performance:** On a gpt-4.1 model, GEPA optimization alone narrowly beat SFT alone (+2.1 points vs. +1.9).

  2. **Synergy:** Combining the two techniques (SFT+GEPA) yielded the best absolute performance (+4.8 points), confirming they are complementary.

  3. **Cost-Efficiency:** However, from a pure cost-performance perspective, GEPA was the superior choice. The GEPA-optimized gpt-4.1 was **~20% cheaper to serve** than the SFT version while delivering better quality. This is due to SFT’s overhead for hosting a custom model endpoint.

Even the best-performing combined model (SFT+GEPA on gpt-4.1) was ultimately less practical than the GEPA-optimized gpt-oss-120b, which offered nearly identical quality at **15x lower serving cost**.

# **Takeaways for MLEs & System Designers**

  1. **Re-evaluate Your Model Selection Calculus:** The default choice of using the most powerful (and expensive) proprietary model may not be optimal. A cheaper base model, when paired with systematic optimization techniques, can create a more efficient and higher-performing system overall.

  2. **Prompt Optimization is a Post-Deployment Tool:** Treat prompt optimization not as a one-off manual task, but as an automated, iterative technique for improving live systems. It’s a powerful lever, especially for models where you don’t have weight access.

  3. **SFT Isn’t the Only Answer:** For many use cases, automated prompt optimization presents a more cost-effective alternative to SFT. It avoids the costs and operational complexity of training, deploying, and managing custom fine-tuned models.

  4. **Model the Full Lifetime Cost:** When evaluating options, factor in both the one-time optimization cost and the long-term serving cost. As the research shows, a small upfront investment in optimization can pay massive dividends at production scale.

  5. **The Optimizer/Student Paradigm is Powerful:** The technique of using a powerful model (like Claude Sonnet 4) to generate optimized artifacts (prompts) for a cheaper, more efficient inference model (like gpt-oss-120b) is a valuable pattern for building cost-effective AI systems.

# **Takeaways for MLEs & System Designers**

  1. Building State-of-the-Art Enterprise Agents 90x Cheaper with Automated Prompt Optimization
