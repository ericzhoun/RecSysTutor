---
title: "Code reviews in the Agentic AI age"
subtitle: "Code reviews are the new bottleneck. Where's how I am approaching them"
date: 2026-09-02
author: Ludovico Bessi
collection: Machine Learning at Scale
topics: [rl-agents]
paywalled: false
words: 1990
---

# Code reviews in the Agentic AI age

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

### Take 3: I approve 90% of code almost instantly. On purpose.

Here’s the aspirational version first, because it’s real:

I launch roughly one thing a month.

In a big company, on a production surface, that cadence is rare: and it’s the single strongest line in my L5 case. That cadence is not a talent story. It’s a review philosophy story.

The peer bonus was the team telling me the philosophy works for them too.

The philosophy is this: on a product team that runs on experiments, **iteration speed is the highest priority. Not code quality. Speed.**

I know how that sounds. Let me earn it:

Most code is already dead

Look honestly at what a product/experimentation team actually produces. In my corner of the world, the overwhelming majority of code written in a given quarter is experiment code: a new feature in a ranking model, a modified candidate source, a metrics slice, a flag-gated variant.

It exists to answer a question. Once the question is answered (and most experiments lose) the code gets deleted.

I’d put the split at 90/10. Ninety percent of the code my team writes is, from the moment it’s authored is **scheduled for deletion**.

It will never be important. No user will ever depend on its elegance. Its entire value is the learning it produces, and that value decays daily while it sits unreviewed.

So when a CL comes to me and I can see it’s experiment-shaped: flag-gated, isolated, reversible, blast radius contained… my review is fast and shallow by design.

I’m checking exactly three things: it can’t corrupt anything permanent, it can’t silently pollute the metrics we’ll make decisions on, and it can be turned off.

Most importantly (ok a fourth one), does the experiment answer our questions?

If those hold, approve. Minutes, not days. Style nits, “I’d have structured this differently,” speculative generality… I swallow all of it.

That feedback is negative-value on code with a six-week lifespan IMHO.

**The 10% is where I become a different reviewer**

The remaining ten percent is the code that survives: the serving path, the shared library, the data pipeline that feeds everyone’s metrics, the interface other teams build on, the experiment that won and is graduating to permanent.

There, I flip completely. Slow, adversarial, multiple passes, “walk me through why” questions, and I will absolutely block a CL for days.

This is also exactly where Take 1 bites: this is the code where AI review assistance doesn’t discharge the human obligation, because what’s being reviewed is a *commitment*, not a diff.

The skill is triage. (and I’d argue this is now a core senior-engineer skill, more valuable than being a great line-by-line reviewer)

Knowing, at a glance, which bucket a change belongs to. Junior reviewers apply uniform scrutiny to everything, which means over-reviewing the 90 and, because their attention is exhausted, under-reviewing the 10. Uniform rigor is how you get both slow iteration and production incidents. The worst of both.

### Why this is the actual promo strategy

Connect the three takes and you get the loop that produces one launch a month:

1\. Reviews are the bottleneck → the person who clears the queue sets the team’s velocity.

2\. I clear the queue by refusing to spend rigor on code that’s scheduled for deletion → my team iterates faster → we run more experiments → more launches, and my name is attached to unblocking all of it.

3\. Because I *never* send un-understood AI slop myself (Take 2), and because everyone has watched me be genuinely brutal on the 10% that matters, my fast approvals carry weight instead of looking lazy. The trust account stays full. My own CLs fly through in return.

That last point is the part people miss when they hear “I approve 90% instantly” and gasp. The fast approvals are only possible because of the reputation.

A junior engineer who rubber-stamps everything is a liability. A reviewer who has demonstrably earned the right to say “this is throwaway, ship it” is a force multiplier. Same behavior, opposite value: the difference is the credibility behind it.

And notice what got rewarded. The peer bonus didn’t go to the most thorough reviewer on the team. It went to the fastest *correctly-calibrated* one.

That’s the org, mostly without realizing it, repricing what review is for in the agent era.

Not everyone on my team buys this and that’s fine.

My point isn’t “review harder up front”: it’s **make graduation an explicit, expensive event**.

Experiment code lives behind flags with an owner and an expiry. When something wins and wants to become permanent, it doesn’t get grandfathered in; it gets the full 10% treatment *at that moment*, often as a rewrite.

You pay the rigor tax exactly once, on exactly the code that earned it, at exactly the point where you know it matters.

The alternative (paying the tax on everything up front) means paying it mostly on code that loses. On a team whose entire job is learning fast, that’s not diligence.

**What I’d actually watch, if you’re rethinking your own queue**

\- **Time-to-first-review on experiment CLs**. If it’s measured in days, your team’s learning rate is being set by a queue, not by your ideas.

\- **Where senior attention goes**. If your best reviewer’s comments are mostly on code that’ll be deleted in a month, the scarcest resource on the team is being spent at its lowest point of leverage.

\- **Whose approvals mean something**. Every team knows. If yours don’t yet, that’s the asset to build: it’s slower to accumulate than any technical skill, and in the agent era it’s worth more.

The engineers who’ll do best over the next few years aren’t the ones who write the most code: agents ended that competition already.

They’re the ones whose judgment about code is trusted enough to be cheap to consume.

Fast where fast is right, immovable where it isn’t, and known for knowing the difference.

That’s what the peer bonus was actually for.

\--- Ludo

 _If this resonated (or made you angry — either is fine), reply and tell me your team’s 90/10 split. I read everything._
