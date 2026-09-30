# Your RL Training Loop Is a Distributed Systems Problem

*Machine Learning at Scale collection — Ludovico Bessi, 2026-07-12 · topic: rl-agents*

* And You’re Probably Treating It Like an ML One*

[](../assets/9a45503e6b12d88d.jpg)

## TLDR

I read the new HuggingFace post on async RL training landscapes this week (link). They surveyed 16 open-source libraries (verl, SkyRL, NeMo-RL, SLIME, AReaL, PRIME-RL, TorchForge, the works) that are all trying to solve the same problem: how do you do RL post-training on a frontier reasoning model without leaving 60% of your GPUs idle.

The post is excellent. It’s also 5,000 words of plumbing that most MLEs will skim and forget.

I want to do the opposite. I want to zoom in on the one thing the post is really about, even though it never says it explicitly:

**RL post-training is a distributed systems problem dressed up as an ML problem. And the infra mental model most MLEs bring to it is wrong.**

If you came up doing supervised training, your mental model of “training a model” is roughly: data loader feeds GPU, GPU does forward + backward, optimizer steps, repeat. It’s a straight pipe. Backpressure is a non-issue. Staleness is a non-issue. The data doesn’t care what version of the model is consuming it.

RL training breaks every one of those assumptions.

## What actually happens in an RL training step

Before we get to the infra, let’s be concrete about what a single GRPO training step looks like in TRL today (this is the synchronous baseline the HF team is trying to replace):

  1. Sample a batch of prompts.

  2. Generate G completions per prompt by calling model.generate() (or hitting a vLLM server).

  3. Score each completion with a reward function (rule-based verifier, reward model, code sandbox, whatever).

  4. Compute group-relative advantages.

  5. Forward + backward pass on the policy loss.

  6. Optimizer step.

  7. Push the new weights back to the inference engine so the next batch uses the new policy.

Each phase blocks the next. That’s fine in principle. The problem is step 2.

Step 2 dominates wall-clock time so badly that nothing else matters.

The HF post puts numbers on it. On a single H100, a 32B reasoning model produces roughly 1,200 output tokens per second. A typical GRPO step with G=8 completions and 64 prompts is 512 rollouts. If your average chain-of-thought is 32K tokens (which is normal for reasoning models now), that’s 16 million tokens of generation per step. Roughly 3.7 hours on one GPU. Even at 8 GPUs of inference, you’re at ~28 minutes per training step. While generation runs, your training GPUs sit idle.

This is not a small inefficiency you can paper over. It’s the entire economics of RL post-training upside down.

## RL Infra is hard :D

If you’ve thought about this at all, the picture in your head is probably something like: “RL needs LLM calls, then checking, then send results back, so the infra is more complex.”

That’s directionally correct but it undersells the problem.

The hard part isn’t the call-and-response shape. RPC is a solved problem. We’ve been doing request-response between services for thirty years.

The hard part is that **inference and training have wildly different cadences, wildly different resource profiles, and you have to keep them in something close to lockstep without ever letting either side block the other.**

Concretely, the two sides have different:

  * **Compute profile.** Inference is memory-bandwidth-bound (KV cache, autoregressive decode). Training is compute-bound (matmul, gradient accumulation). Putting them on the same GPU means one side is always under-utilizing the silicon.

  * **Parallelism strategy.** Inference wants tensor parallelism across a few GPUs with a clean TP layout for fast decode. Training wants FSDP or full 5D parallelism (DP × TP × PP × CP × EP) across many more GPUs to fit the optimizer state. The weight layouts on disk are not the same.

  * **Cadence.** A training step might take 30 seconds. A rollout might take 30 minutes. If you wait for one to finish before starting the other, you’ve burned the budget of the team that bought you all those H100s.

  * **Failure modes.** A vLLM engine OOMs. A code sandbox times out. A single GRPO group has one rollout that runs 10x longer than the others (the “straggler problem”). Each of these is a transient failure that your training loop must absorb without falling over.

So the architecture every serious team has converged on is not “one process that does generation and training in sequence.” It’s **two physically separate GPU pools, connected by a buffer, with a separate weight-sync channel**. 

Inference pool runs continuously, dumps completed rollouts into the buffer. Training pool pulls from the buffer, does gradient updates, periodically pushes new weights back to inference. Neither side waits.

If that shape sounds familiar, it should. **It’s a streaming data system.**

The inference pool is the producer. The training pool is the consumer.

The buffer is Kafka. The weight sync is a control-plane broadcast. Staleness management is consumer lag.

The HF post calls this “disaggregated mode.” Eight of the 16 libraries surveyed use Ray as their orchestration layer, which is essentially the actor-model version of this same picture. The rest reinvent it with asyncio + Redis streams (PipelineRL), or HTTP microservices (Atropos), or PyTorch-native actors (TorchForge on Monarch). They all converge on the same shape because the shape is forced by the problem.

## The four problems disaggregation creates

Once you’ve separated inference from training, you’ve solved the “GPU idle” problem and bought yourself four new ones. These are the problems the HF post spends most of its 5,000 words on, and they’re the ones a production RL team actually loses sleep over.

**1\. Staleness.** Your inference pool is generating rollouts under policy version N. By the time those rollouts arrive at the trainer, the trainer has already done a few gradient steps and is now on policy N+3. The rollouts you’re training on are off-policy. Gradients are biased. Three knobs to turn here: drop stale samples (wastes generation compute), bound the queue depth so staleness can’t exceed K versions (architectural cap), or apply importance-sampling correction to reweight stale samples (preserves data, adds gradient variance). Most production systems combine all three.

**2\. Weight sync.** When the trainer finishes a step, the new weights have to reach the inference pool. NCCL broadcast on a 32B model takes ~100-500ms. During that broadcast, what happens to in-flight generations? The HF survey identifies four interrupt models, ranging from “pause everything, do the broadcast, resume” (cleanest, most wasted compute) to PipelineRL’s approach of swapping weights _between forward passes_ of running sequences (~few ms gap, sequences just continue with new weights). The latter is borderline magic, but it requires deeply hooking the inference engine and only one library does it well.

**3\. Partial rollouts.** If a rollout takes 30 minutes and your weight sync fires every 60 seconds, what do you do with the half-finished generation? Abort it (wastes generation compute). Save the KV cache and resume under new weights (correctness questions: did you mix policies inside one trajectory?). Just let it finish under old weights and accept the staleness. There is no clean answer; every library picks a different tradeoff.

**4\. Training-inference mismatch.** Inference frameworks (vLLM, SGLang) and training frameworks (Megatron, FSDP) implement the model independently. For dense models the floating-point differences are small. For MoE models, the router can pick different experts for the same input under different frameworks. DeepSeek-V3.2 hit this in production and it was destabilizing optimization badly enough that they had to record the inference-time expert routing decisions and force the trainer to use the same paths. No open-source library currently supports this. If you’re training MoEs with RL, this is a correctness bug waiting in your pipeline.

## What this means if you’re an MLE

A few practical takeaways, in decreasing order of “you should care about this if you’re not personally building post-training infra”:

**Production RL post-training is closer to building a streaming system than to writing a training script.** If your team is staffed entirely with people who have only done supervised training, you don’t have the right skill mix. You need at least one person who has built a Kafka pipeline, debugged a backpressure bug, or thought hard about consumer lag. The shape of the problems is closer to that than to “tune the LR schedule.”

**The real bottleneck in RL training is rarely the math.** It’s the sync protocol, the buffer depth, the straggler in your group, the OOM in your inference pool. Picking GRPO vs DAPO vs CISPO is a smaller decision than picking your orchestration layer.

**“Async RL” is doing a lot of work in that name.** When a paper says they used async training, ask: which of the four problems above did they handle, and how? “We used async RL” without specifying staleness strategy and weight-sync interrupt model is roughly as informative as “we used distributed training” without saying DP vs TP vs PP. Ask the follow-up question.

**If you’re choosing a library, the seven axes from the HF post are the right framework.** Orchestration primitive, buffer design, weight sync protocol, staleness management, partial rollout handling, LoRA support, parallelism backend. For most teams the binding constraint is going to be one of: do I need MoE expert parallelism (Megatron-backed only: SLIME, NeMo-RL, ROLL, MILES), do I need LoRA with adapter-only sync (verl and ART are the most complete), or do I need the system to never stall generation (PipelineRL is the only one that gets this fully right).

## Final thoughts

The TRL team is working on their own async trainer, which is what motivated the survey. Their design choices, lightweight orchestration, bounded queue with per-token version tagging, NCCL with packed transfers, partial rollout support, are a reasonable distillation of what works.

But the bigger lesson is the convergence itself. Sixteen teams, mostly working independently, building toward roughly the same architecture. That’s not a coincidence and it’s not a fad. It’s what happens when the underlying problem has a shape and the shape is not negotiable.

If you’re staffing an RL post-training team in 2026 and your job ladder rewards “ML expertise,” you’re going to hire the wrong people. The expertise that matters here is half ML, half distributed systems. The teams that figure this out first are going to ship circles around the ones that don’t.

* * *
