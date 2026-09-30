---
title: "ML@SCALE - 1:1 - 100 billion rows, three mistakes, one lesson [Edition #1]"
subtitle: "A conversation with Sanket, Staff MLE at Meta, on training data at a scale most people will never touch — and the mistakes that happen there. "
date: 2026-06-07
author: Ludovico Bessi
collection: Machine Learning at Scale
topics: [mlops]
series: "1:1 war stories"
paywalled: false
words: 886
---

# ML@SCALE - 1:1 - 100 billion rows, three mistakes, one lesson [Edition #1]

*A conversation with Sanket, Staff MLE at Meta, on training data at a scale most people will never touch — and the mistakes that happen there. *

*A conversation with Sanket, Staff MLE at Meta, on training data at a scale most people will never touch — and the mistakes that happen there. *

[![](../assets/a5992b8fb79a6401.jpg)](../assets/a5992b8fb79a6401.jpg)

 _The ML@Scale 1:1 is a recurring interview series. One engineer, six questions, no fluff. We go straight to the production scars._

* * *

**Q1 · The 60-second pitch** _Who are you and what do you work on?_

Sanket, Staff MLE at Meta in New York. I work on large-scale recommender and ranking systems — we’re talking 100B+ scale of training data. Some of the world’s largest ML models live in this stack. Before Meta, I was at Spotify building on GCP.

* * *

**Q2 · The stack, end to end** _Walk me through your ML infrastructure. What works, what would you change?_

Most of it is in-house — Meta doesn’t use public cloud services. At Spotify I was on GCP, so I’ve seen both ends. The infra itself is genuinely impressive at this scale.

If I could change one thing? Simple experiment workflows that actually let junior MLEs iterate quickly. Production code is large and messy. Touching it means navigating a lot of steps that kill experimentation speed. You want to run a fast experiment, you spend 80% of your time on infra ceremony, 20% on the actual idea.

> _The single biggest drag on ML velocity at large companies isn’t compute. It’s the friction between ‘I have an idea’ and ‘I’m running the experiment.’_

* * *

**Q3 · The most expensive mistake in production** _What’s a production failure you’d rather people learned from than experienced?_

Three. All of them hurt in different ways.

**The self-fulfilling model.** We used production data to train a homepage ranking model. The model learned its own past predictions rather than true user behavior. It was optimizing for what it had previously served, not for what users actually wanted. The fix was explore/exploit — you need to actively break the feedback loop.

**The leakage nobody noticed for weeks.** Offline evals were using data from today and one day back. In production, batch data was delayed by 2–3 days. The offline metrics looked fine. Production behavior didn’t match. The gap between your eval window and your actual data pipeline delay is a classic trap.

**Missing features at serving time.** Data missing during serving due to feature store inconsistencies. You train on complete features. At inference, some are null. Your model’s never seen that distribution. Results get weird in ways that are hard to debug.

> _All three are versions of the same lesson: the world you train in and the world you serve in are never the same world. Close the gap deliberately._

* * *

**Q4 · The thing nobody says out loud** _What’s the uncomfortable truth about ML at scale that most people won’t say?_

Real ML at scale is a work of art where simple changes produce large gains. That’s the part blogs miss. They highlight fancy new architectures. The reality is that a carefully placed feature, a smarter label definition, a better calibration pass — these often beat a completely new model architecture.

The other thing: A/B tests with large-scale ML models frequently turn out different from expectations. Not slightly different — counterintuitively different. And debugging why requires a subtle understanding of the entire stack. Not just the model, not just the data, not just the infra. All of it simultaneously.

* * *

**Q5 · Where research meets reality** _What fraction of ML research actually makes it into production systems? Why does so much get filtered out?_

Only a fraction. The reasons are more structural than people admit.

First: research ignores what happens to ideas at true training scales. Scientists aren’t trained to work at the scale we operate at. An idea that works on 1M examples may completely break at 100B.

Second: research uses open-source benchmarks that are clean by construction. Production data has existing correlations you didn’t put there, label conflicts from years of inconsistent annotation, and infra costs that make certain approaches simply not viable even if they’re theoretically sound.

> _The benchmark is clean. Production is not. Most research optimizes for the clean version._

* * *

**Q6 · What you’d tell someone joining a big tech ML team** _One piece of advice for an MLE about to join a large-scale team for the first time._

Keep your excitement alive by staying close to something concrete — data, architecture, infra systems. Pick one.

It’s tempting to let AI do it all. Especially now. But deep expertise in at least one of those areas will go a long way. The engineers who compound over a career are the ones who really understand what’s happening inside the system, not just how to prompt it.

* * *

# My take

Three mistakes, all versions of the same root cause. That’s the pattern I keep seeing from the best engineers I talk to: the expensive lessons aren’t random — they cluster around the gap between training distribution and serving reality.

Sanket’s point about experimentation friction is one I feel personally at Google. The infra is world-class. The ceremony around it is not. If you’ve experienced any of these three failure modes, I’d love to hear your version:

[ML@Scale 1:1 - Your story](https://app.youform.com/forms/abpu9l2x)

* * *
