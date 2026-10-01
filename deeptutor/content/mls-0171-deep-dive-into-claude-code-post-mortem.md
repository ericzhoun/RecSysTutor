# Deep Dive into Claude Code post mortem

*Machine Learning at Scale collection — Ludovico Bessi, 2025-10-15 · topic: llm*

[](../assets/0d2f873e7f2b7573.png)

# Introduction

At work, while waiting for tests to ~~pass~~ fail or queries to run, I lose myself into the internal post mortem page, named OMG (we fun).

It’s always super cool to learn about different failure modes and looking at postmortems makes you realize how edge cases can impact heavily the business in case when you count in billions.

In this special edition article today, I will cover the latest and greatest postmortem from Anthropic themselves!

# The set up

I don’t know about you, but I saw so many twitter posts of people complaining about Claude code dropping in quality, while others were claiming everything is good and there’s a “skill issue”.

Now, that can be! But: if something was working before and now it’s not working anymore and you did not change your prompts / vibe coding style… something’s off right?

That’s also what Anthropic team realized!

So the investigation begins…

[](../assets/3b0c835d861c2ed6.png)

Timeline shared from Claude Code team

Context window routing errors?

Corruption errors?

XLA:TPU miscompilation?

All overlapping!?

Strap in, this is going to be fun…

If you are reading this, it means you are a paid sub to ML@Scale.

THANK YOU SO MUCH FROM THE BOTTOM OF MY HEART!

Do you have someone in mind that could use a nice newsletter? Christmas is coming…

[Give a gift subscription]()

Now, back to the article!

# Context window routing errors

Anthropic started preparing for a 1M token context window launch, so they started setting up servers for that change.

However, due to an error in setting up routing, 0.8% of requests went to the new experimental servers.

An unrelated change increased that 0.8% to 16%.

Ouch.

The bad news here is the experimental server offered a degraded quality response compared to normal, so that’s not good at 16% of traffic (!!!). It reminds me of one of my postmortems…

The worst part? Requests are sticky, so if a user gets into the experimental server with one request, they are stuck there.

This is already postmortem territory on its own, but we are just a bug number 1.

Onto the next one!

# Output corruption errors สวัสดี to miscสวัสดีguration

Anthropic team misconfigured TPU servers when trying to optimize runtime performance, causing the assignment of high probability to tokens that should not actually be produced. like สวัสดี in the title of the section ;)

I am bit confused how this can happen and it’s not caught by a simple unit test on the functionality. There’s not much detail here unfortunately.

They now have tests during deployment to check for spurious character though, which I find quite funny!

# Approximate top-K XLA:TPU miscompilation

Alright, if you thought the first two bugs were spicy, bug number three is the main course.

This is the one that gets deep into the weeds of running ML models on specialized hardware.

So the Anthropic team pushed a change to make Claude better at picking the next word during generation. Standard stuff, right? You’re always tweaking sampling logic.

Except this change woke up a sleeping monster: a hidden bug deep inside the XLA:TPU compiler. The component in charge of turning their Python/JAX code into something a TPU actually understands.

To make things fast, they use something called approximate top-k. Think of it as a 'good enough' shortcut to find the most likely next words without checking every single one in the vocabulary. You trade a tiny bit of precision you'll never notice for a lot of speed. Usually, it's a great deal.

Except the compiler bug made this approximation go completely wrong. Instead of being 'mostly right', it was 'wildly, catastrophically wrong', sometimes dropping the _most probable_ token.

And here’s where it gets truly problematic for the engineers on call.

  * Run the same prompt twice? Get one good response, one bad one.

  * Attach a debugger to see what’s going on? The bug vanishes.

  * Change something completely unrelated in the code? The bug's behavior changes.

The final plot twist, and this is my favorite part of the whole postmortem: a fix they put in place _months ago_ for a totally different issue was accidentally holding this compiler bug at bay.

When they pushed the new, "correct" sampling code, they removed the old workaround, and the whole thing blew up. You fix one bug, you unleash a bigger, scarier one. Classic.

In the end, they threw in the towel on the approximation and switched to an exact top-k method. It’s a bit slower, but guess what? It’s _correct_.

Sometimes you just have to pay the performance tax for sanity.

# “ACTION ITEMS!?” - your head of SREs asks

So, after all that chaos, the finger-pointing, the 3 AM calls, and the eventual, hard-won fixes, you know what comes next.

The dreaded (or secretly beloved, if you're like me and love digging into why things broke) "what are we changing so this never, ever happens again?" meeting.

Anthropic laid out some solid, if painful, lessons learned:

  1. **Evals that Actually Work (Duh):** They admitted their existing evaluations just weren’t cutting it. They didn't capture the subtle, intermittent degradation that users _felt_. So, they're building "more sensitive evaluations" to finally tell the difference between "working great" and "quietly screwing up a percentage of requests." This is the kind of stuff every MLE _thinks_ they have, until a postmortem like this shows you the gaping holes.

  2. **Prod Evals - Always On, Always Watching:** This is the big one for me. They're going to run quality evaluations "continuously on true production systems." Not just staging, not just canaries, but _the real thing_. Because, as we saw with the load balancing change, sometimes a perfectly innocent change in one part of the system makes a dormant bug in another part suddenly turn into a Godzilla-level event. You gotta monitor what's actually hitting your users, not just your perfect test environments.

  3. **Faster, Privacy-Preserving Debugging Tools:** This is the ultimate MLOps challenge, especially for generative AI. How do you let engineers debug weird user-reported behavior when you can't just ssh in and look at their exact prompt/response stream for privacy reasons? Anthropic is investing in tools to do exactly this. Because let’s be real, blindly debugging "user says it's bad sometimes" is a quick path to existential dread. They're aiming to shorten the time from "WTF is happening?" to "Ah, that's why."

  4. **Listen to the People!:** And finally, they're explicitly asking users to keep sending feedback. Because honestly, sometimes your customers are your best (and only) real-time monitoring system. When your fancy metrics are green but users are screaming blue murder on Twitter, you know who to believe. Thumbs down buttons, /bug commands, direct emails – they all helped them connect the dots.

These aren't fancy new model architectures; these are the gritty, hard-won infrastructure and operational changes that separate robust systems from, well, incidents like these.

Hope you liked this! Until next one :)

# References

  1. Anthropic post mortem
