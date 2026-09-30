---
title: "Generative RecSys Won’t Save You: What Actually Matters at Billion-User Scale"
date: 2026-05-06
author: Ludovico Bessi
collection: Machine Learning at Scale
topics: [recsys]
paywalled: true
words: 348
---

# Generative RecSys Won’t Save You: What Actually Matters at Billion-User Scale

> Paid post — only the publicly visible preview is included.

[![](../assets/a6e5fd3bb06c0fdc.png)](../assets/a6e5fd3bb06c0fdc.png)

Recommender systems have moved through three architectural eras:

  1. Matrix factorization

  2. Deep learning (the Two-Tower standard)

  3. Generative era

Xavier Amatriain’s RecSys 2025 keynote mapped this evolution well, from Netflix Prize nostalgia to Gemini-powered preference elicitation.

It was a good talk. 

It was also dangerously optimistic.

For engineers building discovery systems at scale right now, the path forward is not “add an LLM.”

It never is.

The real challenge is distinguishing between what looks cool in a keynote demo and what actually survives contact with a billion users and a 200ms latency budget.

The industry is buzzing about autonomous agents and “media of one.”

I’m going to argue that agents are overrated for mass-market products, that personalization must remain bounded to be safe, that the _real_ generative revolution (HSTU, not LLMs) is quietly rewriting the stack, and that real-time adaptation still matters more than anything else.

* * *

## Agents Are a Distraction for Consumer Products

The keynote highlighted “Zero-History Preference Elicitation”: using conversational agents to ask users what they want. Technically impressive. Practically useless for products with billions of users.

**The Cognitive Load Problem.** The success of modern feeds is built on passive consumption. People open TikTok to decompress, not to negotiate with a chatbot about what kind of videos they’re in the mood for.

**The Latency/Cost Barrier.** Running an agentic loop (reasoning → tool use → response) shatters the 200ms latency budget required for seamless feed rendering. At billion-user scale, the inference cost of an agentic layer is not just expensive.

It is economically ruinous compared to efficient embedding retrieval.

For niche tasks like travel planning, complex B2B queries, or high-consideration purchases, agents genuinely add value.

But for mass-media discovery, they are a solution looking for a problem.

The dominant interface for the next decade will remain a feed, not a chat window.

* * *

## The Generative Revolution That Actually Matters: HSTU and Sequential Transduction

When people hear “Generative RecSys,” they picture an LLM chatting with users about movie preferences.

The actual generative revolution happening in production looks nothing like that.
