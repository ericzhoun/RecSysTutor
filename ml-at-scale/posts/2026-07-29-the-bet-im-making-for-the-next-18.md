---
title: "The bet I'm making for the next 18 months as an MLE "
subtitle: "I've spent two months arguing the MLE market is a barbell. This is what I'm actually doing about it."
date: 2026-07-29
author: Ludovico Bessi
collection: Machine Learning at Scale
topics: [career]
paywalled: true
words: 765
---

# The bet I'm making for the next 18 months as an MLE 

*I've spent two months arguing the MLE market is a barbell. This is what I'm actually doing about it.*

> Paid post — only the publicly visible preview is included.

*I've spent two months arguing the MLE market is a barbell. This is what I'm actually doing about it.*

[![](../assets/b91cc90a06246da3.jpg)](../assets/b91cc90a06246da3.jpg)

Two months ago I wrote that the MLE job market is a barbell.

AI-fullstack on one end, internal infra on the other, and the middle, the generalist applied MLE who tunes models on someone else’s pipeline, is getting squeezed out from both directions.

That post got a lot of replies. Most of them were some version of the same question: _okay, I bought the argument. I’m on the internal side. What do I actually invest in over the next year?_

This is my answer. I’m going to make it specific, because the generic version (”learn fundamentals, stay sharp”) is useless and you can get it for free from anyone with a LinkedIn account.

The barbell post was about positioning. This one is about depth.

And my take on depth is going to cut against most of the career advice you’ve read.

### **Stop trying to pick a lane within the internal track. Go E2E.**

The MLEs with outsized impact in 2026 and 2027 are not the ones who specialize harder into “modeling” or “systems.” They’re the ones who can reason fluently across the entire stack, from the loss function down to the kernel, from the eval harness up to the data pipeline. The lane-pickers are losing ground to the E2E people, and most of the career advice in our field is two years behind on this.

Let me make the case.

**The easy wins are gone at every individual layer**

For most of the last decade, you could build a career by going deep in one layer and ignoring the rest. The model person didn’t need to think about kernels. The infra person didn’t need to think about training dynamics.

There was enough room at each layer for specialization to pay off, because each layer had abundant room for improvement and the interactions between layers were loose enough that you could optimize one without thinking too hard about the others.

That world is over. The bottleneck has moved.

The easy wins at the model layer have been picked. Architectures have converged. Training recipes have converged. The delta between “I tried a new attention variant” and the SOTA baseline is tiny and getting tinier.

The wins that remain at the model layer are subtle, expensive, and increasingly entangled with the systems below them.

The easy wins at the systems layer have also been picked, in a different sense.

Most teams now use a serving stack that someone smart already optimized. torch.compile and XLA exist. Flash Attention is a library call.

The remaining wins at the systems layer are the ones that require knowing what the model is doing, because generic optimizations have already been applied and the next 30% comes from co-designing the model and the kernel.

This is why E2E wins. The interesting problems left in 2026 sit _between_ layers, not inside them. The kernel optimization that only makes sense if you understand what the model is doing during a specific phase of training.

The architectural choice that only makes sense if you understand what the hardware can serve cheaply at your batch size. The eval that only makes sense if you understand what the data pipeline is actually producing.

These problems are invisible to specialists in one layer. They’re obvious to people who can move across layers.

**What this looks like in practice**

The bad version of “going E2E” is what most people do when they hear this advice. They read a paper on training dynamics one weekend, watch a CUDA tutorial the next, fine-tune a small model the weekend after, and call it E2E.

This produces vocabulary, not skill.

You end up with a thin layer of buzzwords across the stack and no actual competence anywhere. Recruiters can smell this on a resume in about six seconds.

The good version is harder, slower, and more legible.

Pick a real system you can reason about, ideally one you actually work on. Trace it end to end. Figure out where it’s weak. Fix the weakness. Then move to the next layer and do it again. Within twelve months you have receipts: a serving optimization that shipped, an eval that found a real model regression, a training change that recovered convergence on a hard problem. The receipts are the legible artifact. The skill is being able to _find_ the weakness in the first place, which is what specialists can’t do.

The two skill axes you’re investing in:

**Skill axis 1: down the stack, into the compiler**
