---
title: "Anthropic shipped three regressions in a month and their evals didn’t catch one of them"
subtitle: "A special edition. Inside the April 23 postmortem."
date: 2026-04-27
author: Ludovico Bessi
collection: Machine Learning at Scale
topics: [mlops]
paywalled: true
words: 798
---

# Anthropic shipped three regressions in a month and their evals didn’t catch one of them

*A special edition. Inside the April 23 postmortem.*

> Paid post — only the publicly visible preview is included.

*A special edition. Inside the April 23 postmortem.*

[![](../assets/47d6d9d8a44303e4.jpg)](../assets/47d6d9d8a44303e4.jpg)

On April 23, Anthropic published a postmortem explaining a month of user complaints that Claude Code had gotten dumber.

Their tl;dr: three unrelated changes, three different surfaces, all shipping inside a four-week window, all degrading model behavior in ways that internal evals and dogfooding did not catch.

That is the story worth reading.

The bugs themselves are interesting: one is a genuinely beautiful failure at the intersection of prompt caching and extended thinking.

What’s interesting for anyone shipping ML systems in production: **the company with one of the most invested eval infrastructure in the industry shipped three intelligence regressions back to back, and the signal they finally trusted was user feedback.**

If your mental model is “we just need better evals,” this postmortem should change it.

Here is what happened, why each bug is interesting on its own terms, and what an MLE should actually take away from it.

* * *

### The three changes, on one timeline

The chronology matters. Part of why this looked like “Claude got dumber” rather than three discrete bugs is that the changes overlapped in production, each affecting a different slice of traffic on a different schedule.

  1. **March 4** — Claude Code’s default reasoning effort changes from `high` to `medium`. Affects Sonnet 4.6 and Opus 4.6.

  2. **March 26** — A caching optimization meant to clear stale thinking once per idle session ships with a bug that clears it on every turn. Affects Sonnet 4.6 and Opus 4.6.

  3. **April 16** — A system prompt instruction to reduce verbosity ships alongside Opus 4.7. Affects Sonnet 4.6, Opus 4.6, and Opus 4.7.

By mid-April, every Claude Code user is hitting at least one of these, often two, depending on which model they use, how long their sessions are, and whether they kept the default effort level.

The aggregate effect is exactly what you would expect: inconsistent, hard-to-reproduce reports of “Claude feels worse.”

Some users say it’s repetitive. Some say it’s lazy. Some say it burns through their usage limits faster. None of those reports look like the same bug because they aren’t.

Anthropic’s own framing:

Investigation began in early March, but the reports were “challenging to distinguish from normal variation in user feedback at first, and neither our internal usage nor evals initially reproduced the issues.”

Let’s walk through the three bugs.

* * *

### Bug 1: The reasoning effort default

The simplest of the three, and the one most easily dismissed as “a product decision, not an ML bug.”

When Opus 4.6 launched in Claude Code in February, the default reasoning effort was high.

Some users hit a tail-latency issue: at high effort, the model would occasionally think long enough that the UI appeared frozen.

Anthropic’s internal evals showed that medium effort gave “slightly lower intelligence with significantly less latency for the majority of tasks” and avoided the long-tail freeze. So on March 4, they flipped the default to medium and surfaced the option via in-product dialogs.

Users immediately reported that Claude Code felt less intelligent. Anthropic shipped multiple iterations to make the effort setting more visible: startup notices, an inline selector, bringing back ultrathink.

Most users still kept the medium default because most users keep defaults.

On April 7, the default was reverted high.

**Why this matters for an MLE:**

The technical content here is the test-time-compute curve. Every reasoning model has one. Every team shipping a reasoning model picks a point on that curve as the default and exposes the others as options.

The choice of default is not a UX decision dressed up as an ML decision: it’s a distribution decision. You are deciding what fraction of your traffic gets which point on the intelligence/latency tradeoff.

The lie works like this: your eval suite is, by construction, a set of tasks where you can measure quality. Quality on those tasks degrades smoothly as you reduce thinking budget. “Slightly lower intelligence” is a real number on a real benchmark. What your eval suite does not measure is the long tail of tasks users actually bring to the product, where the marginal token of thinking is the difference between a correct multi-file refactor and a confidently-wrong one.

The bad version of this analysis:

> medium effort scores 97% of high effort on our evals, ship it.

The good version

> medium effort scores 97% of high effort on our evals, but our evals saturate on the easy half of the distribution. The hard half (where most user complaints come from) is exactly where the marginal thinking token earns its keep.
> 
> The 3% gap is concentrated there. Ship medium as an option, not a default.

* * *

### Bug 2: The caching optimization that dropped prior reasoning
