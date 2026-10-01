---
title: "Cheat code for MLEs to stand out in 2026"
date: 2026-02-18
author: Ludovico Bessi
collection: Machine Learning at Scale
topics: [career]
paywalled: false
words: 1291
---

# Cheat code for MLEs to stand out in 2026

[![](../assets/6a4ed2383ecffbd7.jpg)](../assets/6a4ed2383ecffbd7.jpg)

# How to Break Into MLSys Through Open Source in 2026

**TLDR:** Open source is the cheat code to stand out in a saturated ML market. I’ll walk you through the best repositories to contribute to in LLM inference and RL infrastructure, plus some hard-earned tips on how to actually make meaningful contributions.

* * *

## Introduction

Let’s address the elephant in the room: the ML job market is tough right now.

Positions are scarce, candidates are plenty, and everyone has “fine-tuned an LLM” on their resume.

So how do you stand out?

My answer has been the same for years: **open source contributions**.

Think about it. When you contribute to vLLM or PyTorch, you’re not just padding your CV. You’re building real skills, working with production-grade code, and — here’s the kicker — creating public proof of your abilities that any hiring manager can verify in 30 seconds.

I’ve seen folks get fast-tracked through hiring pipelines at top companies because a maintainer vouched for their contributions. That’s not luck, that’s strategy.

Today I want to give you a curated list of repositories worth your time if you’re interested in MLSys, specifically around LLM inference and RL infrastructure. These are active, impactful, and — importantly — welcoming to new contributors.

Let’s dive in!

* * *

## LLM Inference Repositories

This is where the action is right now. Everyone’s racing to make inference faster, cheaper, and more efficient.

**vLLM** — If you only pick one project, pick this one. It’s become the de facto standard for high-throughput LLM serving. The core innovation (PagedAttention) is elegant, but there’s tons of work happening around speculative decoding, multi-GPU inference, and new model integrations. Very active Discord, responsive maintainers, and your contributions will be used by thousands of companies. Seriously, this is the one.

**LMCache** — LMCache is an **LLM** serving engine extension to **reduce TTFT** and **increase throughput** , especially under long-context scenarios. By storing the KV caches of reusable texts across various locations, including (GPU, CPU DRAM, Local Disk), LMCache reuses the KV caches of _**any**_ reused text (not necessarily prefix) in _**any**_ serving engine instance. Very active open source project! :)

**SGLang** — From the LMSYS team (the folks behind Vicuna and Chatbot Arena). Focused on structured generation and efficient LLM programming primitives. Newer than vLLM, which means less competition for good issues and more greenfield opportunities. If you want to work on the “programming model” layer rather than raw serving, this is your jam.

**~~JetStream [deprecated]~~**~~— Google’s throughput-optimized inference engine for TPUs and GPUs. If you want exposure to the JAX/TPU ecosystem, this is a solid choice. Pairs nicely with MaxText for training. Less community-driven than vLLM but the code quality is excellent and you’ll learn a lot about production inference at scale.~~

A good substitution for jetstream is https://github.com/vllm-project/tpu-inference

**llama.cpp** — The efficiency frontier. If you care about quantization, running models on consumer hardware, or just want to see how far you can push inference on a MacBook, this is the place. Massive community, constant activity.

**TensorRT-LLM** — NVIDIA’s inference optimization library. More corporate-driven, but if you want to go deep on GPU optimization and CUDA kernels, there’s no better place. Contributions here signal serious low-level chops.

* * *

## RL Infrastructure Repositories

RL infra is having a moment thanks to RLHF and all the alignment work happening. These projects are earlier stage, which means higher impact per contribution.

**OpenRLHF** — Specifically focused on RLHF training infrastructure. Clean codebase, active development, and solves a real problem that every company doing alignment cares about. Smaller project means your contributions actually get noticed.

**veRL** — From ByteDance’s research team. Newer RL training framework designed for LLM alignment. Early stage means lots of opportunities for meaningful contributions. The architecture is interesting and worth studying even if you don’t contribute.

**TRL (Hugging Face)** — Transformer Reinforcement Learning library. Part of the HF ecosystem, which means excellent documentation and broad visibility for your contributions. If you want to combine RL work with the network effects of Hugging Face, this is your best bet.

**Ray/RLlib** — The OG distributed RL framework. Massive codebase, but well-documented and Anyscale is responsive to external contributors. If you want to work on distributed systems + RL, this is the mature choice.

**~~OpenDiLoCo (Prime Intellect)~~**~~— This one’s spicy. Distributed training across decentralized compute. Prime Intellect is doing genuinely novel work on geo-distributed training, and being a small team means you’ll interact directly with their core engineers. If you want to work on something that feels like frontier research rather than incremental improvements, check this out.~~

EDITED: No longer maintained!

**prime-rl (Prime Intellect)** — Their RL infrastructure for distributed RLHF and alignment training. Early stage, high impact potential, and aligned with their mission of democratizing AI training.

* * *

## General Tips for Open Source Contributions

Alright, you’ve picked a repo. Now what?

**Start with the docs.** Seriously. Find a typo, clarify a confusing section, add an example. It’s not glamorous, but it gets you familiar with the contribution process and builds goodwill with maintainers. I’ve seen people get commit access just from consistent doc improvements.

**Run the tests locally before anything else.** You’d be surprised how many projects have flaky setups. Getting the test suite running teaches you more about the codebase than reading code for hours.

**Look for “good first issue” labels, but don’t stop there.** These are great for your first PR, but the real signal comes from tackling meatier problems. After one or two starter issues, graduate to something harder.

**Read recent merged PRs.** This teaches you the code style, what kind of changes get accepted, and how maintainers communicate. It’s like having access to the answer key.

**Don’t ghost.** If you claim an issue, work on it. If life gets in the way, just comment and let people know. Maintainers remember who’s reliable.

**Engage in discussions.** GitHub issues, Discord channels, community calls — show up and be helpful. Sometimes the best contributions aren’t code at all, but helping someone else debug their problem.

**Think in campaigns, not one-offs.** One PR is nice. Ten PRs over three months in a focused area? That makes you a known contributor. Pick a corner of the codebase and own it.

* * *

## Closing Notes

Look, the market is what it is. You can’t control hiring freezes or headcount decisions made in boardrooms.

But you can control what you build and what you learn.

Open source is one of the few true meritocracies left in tech. Your contributions speak for themselves, publicly, verifiably, permanently.

And beyond the career benefits — which are real — there’s something deeply satisfying about seeing your code running in production at companies you’ve never even heard of.

So pick a repo from the lists above, clone it tonight, and start reading.

Your future self will thank you.

Ludo

* * *

 _Machine learning at scale is a reader-supported publication. To receive new posts and support my work, consider becoming a free or paid subscriber._
