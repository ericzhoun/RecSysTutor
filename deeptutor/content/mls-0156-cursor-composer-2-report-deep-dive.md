# Cursor Composer 2 report deep dive. 

*Machine Learning at Scale collection — Ludovico Bessi, 2026-07-19 · topic: rl-agents*

*The infra section is the actual story.*

[](../assets/88681ed8901e6158.png)

Most people are going to read the Composer 2 report and skip to the benchmark table. CursorBench 61.3, Terminal-Bench 61.7, SWE-bench Multilingual 73.7. Frontier-competitive, lower cost to serve. Cool.

That is the boring part.

The interesting part is buried in Section 6, where Cursor quietly explains how they trained a 1.04T parameter MoE on Blackwell across 3 GPU regions and 4 CPU regions, with rollouts running on hundreds of thousands of Firecracker VMs that fork at the memory level, while syncing weights to a separate inference provider (Fireworks) over commodity S3.

This is the most detailed open description of an agentic RL stack I have read this year. Let me unpack the parts that actually matter if you build production ML systems.

Three angles I want to hit:

  1. Why Cursor invented their own NVFP4 variant and what that says about FP4 training in 2026.

  2. How they decoupled Expert Parallelism from Tensor Parallelism, and why that matters for MoE.

  3. The RL environment infrastructure (Anyrun) is the real moat, not the kernels.

Let’s go.

## 1\. The kernel section: FP4 is not solved yet

Composer 2 trains in MXFP8 and NVFP4 on B300s. Both are 2025-era block-scaled formats with hardware dequantization on Blackwell tensor cores. You quantize your matmul inputs to FP4 or FP8, the systolic array dequantizes on the fly, you get the throughput of low precision with most of the accuracy of higher precision.

The standard pitch is: just use the formats, the hardware handles it.

Cursor’s report shows that pitch is wrong, in interesting ways.

**The forward pass uses a custom NVFP4 variant.** Standard NVFP4 uses FP32 per-tensor scales. Cursor uses FP8E4M3 per-block scales (block size 16) and FP32 per-token scales. Why?

Two reasons, both subtle:

  * **Per-tensor scaling is batch-variant.** Your scale depends on the absmax of the whole tensor, which depends on what is in your batch. During RL training, where your batch composition is heterogeneous and changes step to step, this batch-variance “collapses numerical precision and causes the RL training to diverge.” Per-token scaling decouples each row from the rest of the batch.

  * **Per-tensor scales leak future token info into past tokens.** This one is sneaky. If your scale is computed across the whole tensor including future positions, that scale value influences how past tokens get quantized. You have just introduced a tiny information leak that biases gradients. In autoregressive training this is a subtle but real bug.

So Cursor pays the latency cost of per-token scaling in the quantize and GEMM epilogue, because the alternative breaks training. If you have ever wondered why the production FP4 recipes look different from the paper diagrams, this is why.

**The backward pass is MXFP8, not NVFP4.** This is the asymmetry trick. The forward pass needs to numerically match the inference engine, otherwise you get policy gradient noise (more on this in section 3). The backward pass only runs on the trainer. So you can afford the higher precision of MXFP8 on the backward without paying for it at serving time.

**Math precision matters at the instruction level.** They explicitly note that for NVFP4 quantization, IEEE-compliant divides are required. The fast-approximation path “causes training to diverge after roughly a hundred RL steps.” For MXFP8 the fast path is fine. This is the kind of detail that you only learn by burning a week of cluster time on a divergence and bisecting your kernels.

The takeaway: in 2026, FP4 training is not a “set the dtype and go” capability. It is a stack of small numerical decisions where the wrong one silently destroys your run a hundred steps later. The format spec is the easy part. The integration is the work.

The kernels themselves are written in CUDA, PTX, and ThunderKittens / ParallelKittens, the kernel DSL out of Hazy Research at Stanford. Cursor open-sourced their BF16, MXFP8, and NVFP4 GEMM implementations into ThunderKittens, and contributed the Flash Attention 4 backward kernel for the DeepSeek shapes (QK 192 / V 128) to the public Flash Attention repo.

Worth noting: a frontier coding-model lab is choosing to write their hot-path kernels in ThunderKittens rather than CUTLASS or pure CUDA. The kernel DSL bet looks more correct every quarter.

## 2\. Distributed training: decoupling EP from TP

This is the part the parallelism nerds will care about.

Previous Composer training combined FSDP, Expert Parallelism, and Tensor Parallelism, with EP and TP sharing the same rank group. Simpler implementation, fewer meshes to think about. The cost: EP was not an independent scaling axis. You could not scale your expert parallelism without dragging TP along, even when activation memory was modest and TP was hurting you with skinny local matmuls.

For Composer 2, two changes:

**Context Parallelism replaces TP as the long-context scaling axis.** CP needs less communication than TP and keeps full hidden dimensions in projections. TP gives you skinny local matmuls that under-utilize the tensor cores. In MLA (Multi-Head Latent Attention) the implementation is non-obvious: they compute local KV latent vectors, all-gather the latents across CP ranks, then do the KV projection. The projection gets replicated on every CP rank, but the projection is small and the all-gather of latents is cheap, so they fully overlap CP communication with the Q projection.

There is also a load balancing trick lifted from Ring Attention: causal attention causes later tokens to attend to more tokens, so naive sequence sharding gives you uneven work per rank. Solution: split the sequence into 2 x CP chunks, and rank i processes chunks i and (2 x CP - 1 - i). Roughly equal work per rank. Old trick, still the right one.

**EP is decoupled from TP and formed from DP and CP capacity.** Different meshes for dense layers and expert weights. This lets them run higher EP degrees and gives expert-grouped GEMMs more tokens per rank, which means more efficient grouped matmul shapes.

Concrete configs they used:

  * Continued pretraining: EP=8, CP=2

  * RL phase: EP=8, CP=8

The RL phase needs much higher CP because rollouts are long. Pretraining is fixed-length 32k (and later 256k for the long-context phase), but RL rollouts can be hundreds of tool calls deep.

Two more things from this section that are worth flagging:

**DeepEP for token dispatch and combine.** DeepSeek’s high-throughput expert-parallel comm library. Default config uses 20 SMs, leaving room for compute to overlap. They quantize tokens to MXFP8 _before_ dispatch (because experts run in MXFP8 anyway, no precision loss), but keep the combine in BF16 for accuracy. Tokens are split into microbatches and pipelined across separate compute and comm streams.

**RL needs sequence packing because rollouts have wildly variable length.** In pretraining you have fixed sequence length, so DP balance is automatic. In RL, prompt A might give you a 5-turn rollout and prompt B might give you a 200-turn rollout in the same batch. If you naively shard, half your DP ranks finish in 30 seconds and the other half take 5 minutes. So they run a global sequence packing stage before each training step to balance DP compute load, weighted by attention cost (which is quadratic in sequence length, so a 200-turn rollout is much more than 40x the cost of a 5-turn one).

This is one of those infra problems that does not exist in pretraining and dominates in RL. Anyone scaling RL training is going to hit this within their first month.

_This is a free edition of ML@scale._

_If you got value, the paid Blind ML Review on Saturdays goes deeper on production failure modes (FAISS staleness, labeler drift, engagement signal laundering, the usual). On top you get also MLE career advice and handpicked ML job board for Zurich._

## 3\. The actual moat: Anyrun and the RL environment stack

Here is the part that I think most people will skim and that is, in my opinion, the actual frontier work in this report.

The kernels are great. The parallelism choices are reasonable. Anyone with enough Blackwell capacity can replicate them in a few months.

The environment infrastructure cannot be replicated in a few months.

Composer 2’s RL stack has four decoupled services: training, environments, inference, and evaluations. Decoupling matters because it lets each scale independently and tolerate failure independently. The training run “spanned 3 regions for GPU compute and 4 regions for CPU compute.” This is a multi-region RL training job.

Let me break down the parts:

### Anyrun: the rollout substrate

Each environment is a Firecracker VM running a “full development environment, including a browser and GUI for computer use.” The cluster schedules “more than 500 pods per second” while binpacking. Hundreds of thousands of pods per cluster.

To put 500 pods/sec in context: you are launching new VMs faster than most production Kubernetes clusters can launch pods, and they are real VMs with their own kernels, not containers.

Pods can fork. Pods can snapshot at the filesystem and memory level. If a fork cannot land on the same node due to capacity, they “live-migrate pod state to a node with capacity.” This is the kind of capability that comes out of years of building a serverless code execution platform, and Cursor already had this because it powers their Cloud Agents product.

Egress is proxied through “Anygress,” which injects a trusted root CA on pod startup and redirects pod traffic at the TCP layer. Transparent proxy, no env vars to set, agents see a normal internet.

The training environments are running the _actual Cursor backend in shadow_. They explicitly note: “we maintain a shadow deployment of the Cursor backend that is used both during dataset preparation and rollouts. Sharing the production implementation in this way allows us to scale experiments and training safely while remaining faithful to the harness that Composer 2 will be deployed into.”

This is the train-test mismatch problem solved at the infrastructure level. Most RL setups for coding agents use a stripped-down harness for training because the production harness is too complex to scale. Cursor pays the engineering cost of running production-grade harness at training scale, so the model trains under exactly the conditions it will deploy under.

If you are wondering why Composer 2 outperforms Kimi K2.5 (its base model) by 25 points on CursorBench, this is a big part of the answer.

### In-flight weight updates and router replay

Asynchronous RL has a fundamental problem: by the time a rollout finishes, the policy that produced it is several gradient steps stale. The longer your rollouts, the worse this gets. Composer 2 rollouts can be hundreds of turns long, so staleness is a serious concern.

Two mitigations:

**In-flight weight updates.** Inference workers can update weights mid-rollout. So later tokens in a long rollout are produced by a fresher policy than earlier tokens. This is similar to PipelineRL.

**Router replay for MoE.** Here is a fun one. In an MoE model, slight numerical differences between training and inference can cause different experts to get selected for the same token. If the trainer routes a token to expert 5 and the inference engine routed it to expert 12, your log-probs do not match the distribution that actually generated the sample, and your policy gradient is biased.

Solution: during inference, the engine returns the selected expert indices for every token at every MoE layer. During the training forward pass, the router’s expert assignment is _overridden_ to match what inference did. The router still computes gating scores so gradients flow through it, but the actual routing decision is replayed from the inference run.

They go further: they filter out replayed experts whose gating scores fall below a plausibility threshold derived from the router’s own top-k, and replace them with the router’s candidates. This reduces p99 numerics mismatch.

This is the kind of engineering that you only build because you have measured the bias and found it costs you real RL performance.

### Weight sync over S3

The most production-engineer-brained detail in the whole report:

> Every training step, we synchronize updated weights to the inference engine by uploading to a shared S3 bucket. To minimize transfer size, we use delta compression: each rank caches its previous upload and transmits only the diff against the new weights. Because RL updates are small, even with full-parameter training these diffs compress to a handful of gigabytes for the 1T-parameter model.

A 1T parameter model is, full-precision, around 2 TB of weights. Per step. If you tried to ship the full weights every step, you would saturate any reasonable network for hours.

Instead: each rank caches its previous upload, computes a delta against the new weights, ships only the diff. Sharded across all training ranks for upload, sharded across inference replicas for download. Compression, upload, and hotload signaling are pipelined in background workers so training never blocks.

Result: “world-scale distributed RL inference over commodity cloud storage.” US training cluster, EU inference clusters, no direct connectivity required, just S3 as a rendezvous point.

This is the kind of architectural choice that only makes sense once you accept that your inference and training clusters cannot be co-located, and that you need a system that survives full outages of either side. The training run mentions multiple cases where inference or environment services had partial or full outages without failing the training job.

## What this all means

A few takeaways if you build production ML.

**The frontier of RL training is environment infrastructure, not algorithms.** The policy gradient choices in Composer 2 are mostly straightforward: REINFORCE-style with multiple samples per prompt, no length normalization (Dr. GRPO), k1 KL estimator, no overlong masking. These are all small variations on well-known recipes. The novel work is in the four-service decoupled architecture, the Anyrun substrate, the weight sync, and the router replay. The model gets good because the training environment matches deployment exactly, at scale.

**Domain specialization beats general capability for narrow tasks.** Composer 2 hits 61.3 on CursorBench against GPT-5.4’s 63.9, while being significantly cheaper to serve. A 1.04T / 32B-active model trained on the right distribution beats much larger general models on the specific tasks it was trained for. This is consistent with what we saw in the xAI rec system deep dive (different domain, same lesson).

**The kernel layer is now table stakes.** If you are doing serious model training in 2026 and you do not have a kernel team, you cannot compete. ThunderKittens lowers the bar somewhat, but you still need engineers who can debug NVFP4 numerics at the instruction level and decide whether __fdividef is going to torpedo your run.

**Multi-region training is real and people are doing it.** The implicit message of Composer 2 is that you should design your training stack assuming your GPUs are spread across regions, your inference is on a different provider, and any of these can fail at any moment. Single-cluster training is yesterday’s regime.

## Caveats

A few things worth keeping honest about.

The report is light on actual numbers in some important places. They give you EP and CP degrees, but not total cluster size, total compute, training token count, or wall-clock time. The “3 regions for GPU compute” line is the closest you get to a scale disclosure. We do not know how much this cost.

The CursorBench numbers are self-reported on an internal benchmark. The 61.3 is meaningful as a delta over Composer 1.5 (44.2) and Composer 1 (38.0), but the comparison to GPT-5.4 (63.9) is in Cursor’s own harness on Cursor’s own benchmark. They acknowledge this directly and provide public benchmarks (Terminal-Bench, SWE-bench Multilingual) for cross-comparison, where Composer 2 is competitive but not leading. Read CursorBench as “this is a model that is excellent at the specific shape of work Cursor users do,” not “this is the best coding model in the world.”

The router replay technique assumes you control both trainer and inference. If you are using a third-party inference provider (and Composer 2 uses Fireworks), you need that provider to expose expert routing decisions per token. Most inference providers do not. Cursor is essentially co-developing the inference path with Fireworks, which is not an option for most teams.

## What I am taking away

For my own work, three things from this report are going on the “watch closely” list:

  1. ThunderKittens / ParallelKittens as the kernel DSL. Frontier labs (Cursor and increasingly others) are choosing it over hand-written CUDA for production hot paths. If you have been putting off learning it, the window is closing.

  2. The four-service decoupled RL stack. If you are building any kind of agentic RL system, the Composer 2 architecture is now the reference design. Training, environments, inference, evaluations, all independently scaled, all fault-isolated.

  3. Per-token NVFP4 with FP8 block scales as the actual production FP4 recipe. The naive NVFP4 spec is not what people are running. Expect to see this variant become standard within two quarters.

— Ludo
