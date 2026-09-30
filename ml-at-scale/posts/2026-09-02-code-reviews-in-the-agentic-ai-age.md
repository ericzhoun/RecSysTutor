---
title: "Code reviews in the Agentic AI age"
subtitle: "Code reviews are the new bottleneck. Where's how I am approaching them"
date: 2026-09-02
author: Ludovico Bessi
collection: Machine Learning at Scale
topics: [rl-agents]
paywalled: true
words: 853
---

# Code reviews in the Agentic AI age

*Code reviews are the new bottleneck. Where's how I am approaching them*

> Paid post — only the publicly visible preview is included.

*Code reviews are the new bottleneck. Where's how I am approaching them*

[![](../assets/85fa8b4073e8b21b.jpg)](../assets/85fa8b4073e8b21b.jpg)

 _All the below information is my personal opinion that does not reflect the opinion of my company in any shape or form._

Last month I got a [peer bonus](https://www.quora.com/What-are-peer-bonuses-at-Google-How-do-they-work). I got it because… I approve code fast. 

Really fast fast.

O(1 minute) latency fast. (!!!!!!)

A teammate essentially wrote: 

“Ludo unblocks the whole team. PRs don’t rot when he is the reviewer”

Years ago this would have been a very strange thing to reward.

The big thing was reviewing something deep. Leave comments. lots of them. that shows you are a true senior engineer.

However, this is 2026 and it does not quite work that way. But let’s not talk white and black. Let’s go a bit deeper! :D

* * *

Some code is important. Needs multiple reviews because it bakes in assumptions that are hard to remove once the feature launches.

That code needs a BIG review. And depending on that team, that code is maybe 90% of the code, and that’s fine (and actually makes a A LOT of sense) to get a very deep review.

But… in some other teams that code is throwaway code. Useful for a quick experiment that runs for a week and that’s it.

That code, for a 0.1% experiment deserves a less deep review.

And there’s a lot of that code flying around everyday. You still want to check basic things, but also you want to rely a lot on the infra around you: rest assured that if your change creates big problem to all affected users, it’s rare it’s going to be rolled out at all.

So that allows you to take more risks: be faster, try more things and try wild things. And the reviews I argue should allow you some leeway.

Sure: maybe it’s not super optimized. Not the cleanest code. But if you want to test some hypothesis, size the headroom.. just go for it! 

And that’s why I try to make my teammates move as fast as they can.

I trust them because I work with world class people and I trust the underlying infra to save us in case there’s a mistake (because we have world class infra as well).

And that’s… refreshing! I love running 10/15 experiments at any given moment in time, check the numbers, adjust them in a split second based on trends.

It’s very thrilling work! Some additional takes and nuance, as promised:

### Take 1: AI review buys you speed, not absolution

We have AI review in the pipeline. It’s genuinely useful. It catches the mechanical stuff: the null check, the deprecated API, the test you forgot to update. It compresses the boring 60% of review work into seconds.

Still… review is where the team’s *judgment* lives. Is this the right abstraction for where the system is going? Does this change quietly commit us to an architecture we’ll regret? Is this experiment instrumented well enough that we’ll actually learn something from it?

An AI reviewer evaluates the diff. A senior human evaluates the *decision*.

For a config tweak, those are the same thing. For a change to your serving path or your training pipeline, they are absolutely not.

So the equilibrium I see emerging is: AI review as a pre-filter that raises the floor, human review as the scarce resource you spend deliberately. Which raises the real question: *where* do you spend it?

### Take 2: Code review is a reputation economy, and AI just repriced it

This is the part nobody puts in the onboarding docs.

Every PR you send is a claim: *”I understand this change, and it’s worth your time.”* Every review request draws down a small amount of social credit with the reviewer.

When the PR is clean and clearly understood, you earn the credit back with interest. When it isn’t… you don’t.

Picture it. Because you’ve seen it, or you’ve been it: an engineer sends their TL three CLs in a row, obviously agent-generated, and when the TL asks a basic question about the second one... silence.

They can’t answer. They didn’t read their own change.

That engineer’s next ten CLs will be reviewed slowly, skeptically, and with visible reluctance. Not out of spite. Out of rational Bayesian updating.

The reviewer learned that this author’s CLs carry no information. The author’s approval of their own code means nothing, so the reviewer has to do *all* the verification themselves. The author just made themselves expensive.

Here’s the inversion that matters for your career: **in a world where anyone can generate code, your reputation as someone whose code can be trusted almost un-scrutinized becomes one of your most valuable assets**.

It’s the difference between your changes flying through review and your changes rotting in a queue. Compounded over a year, it’s the difference between shipping twelve things and shipping four.

You are not competing on ability to produce diffs anymore. Nobody is. You’re competing on the trust attached to your name.

Which brings me to the take that actually splits rooms when I say it out loud:
