---
title: "MLE vs SWE vs Research Scientist"
date: 2026-03-03
author: Ludovico Bessi
collection: Machine Learning at Scale
topics: [career]
paywalled: false
words: 844
---

# MLE vs SWE vs Research Scientist

[![](../assets/5db34c3087180be7.png)](../assets/5db34c3087180be7.png)

**Behind the ML Engineer Title — Part 2: MLE vs SWE vs Research Scientist**

I spent years confused about what these roles actually meant in practice.

Job descriptions don’t help. Everyone is “working on cutting edge ML systems” and “collaborating cross-functionally.” Cool. But what do you actually own? What do you actually do on a Tuesday?

Let me break it down the way I understand it from the inside.

**The Software Engineer**

An SWE in an ML org doesn’t touch models. They build the infrastructure that makes models possible — the serving layer, the data pipelines, the tooling that lets people like me run experiments without thinking about Kubernetes.

Critical work. Genuinely hard work. Just not ML work.

If you’re an SWE who wants to get closer to the models, you’re essentially looking at transitioning into an MLE role. The two jobs look similar on a job posting and feel completely different day to day.

**The Machine Learning Engineer**

This is my job. We build models, own models, and ship improvements.

But here’s the thing nobody tells you:

The definition of “MLE” changes dramatically depending on where you work.

And I mean dramatically.

At some companies an MLE is essentially a data scientist who writes cleaner code.

At others you’re expected to own the full stack from raw data to serving infrastructure.

Some orgs want you heads down on model quality, others want you handling inference optimization and deployment pipelines.

Even within the same company, different teams will have completely different expectations. The MLE role on a research-adjacent team looks nothing like the MLE role on a product team shipping to hundreds of millions of users.

So when someone asks “what does an MLE do?” the honest answer is: it depends.

A lot.

What stays constant across all of them: you are responsible for the model working well in production.

Not just in a notebook. Not just on a benchmark. In the real system, with real users, where regressions matter.

The scope varies. That accountability doesn’t.

Some MLEs are very vertical. You own this specific embedding model for this specific product, you know it inside out, and your job is to make it better.

Others have more E2E pipeline ownership, touching everything from data collection to model serving to monitoring.

**The Research Scientist**

RSs develop the real sauce. New architectures, new training paradigms, new ideas that move the field forward. The key thing is they’re not optimizing for your team’s metrics. They’re working more horizontally, on ideas that could be picked up by many teams.

A good example: a Research Scientist develops semantic IDs for recommendation systems. That’s a general technique. Then my team looks at it and figures out how to apply it to our specific problem.

It’s not like RSs hand me a to-do list. They do their thing, I watch what comes out, and I figure out what’s applicable to what I’m building.

The relationship is more like: they expand the frontier, I figure out how to use it.

**Where I actually sit**

My job has a research component, but let’s be honest about what that means.

I’m not developing new algorithms. My “research” is figuring out experiment setups that move the needle on my team’s metrics. Testing new data mixtures. Trying architectural patterns that came out of a paper six months ago. Occasionally something interesting enough to write up as an industry publication — but that’s a byproduct, not the goal.

The goal is always: does this make the system better?

That’s the real distinction nobody talks about. RSs are asking “is this idea true and interesting?” MLEs are asking “does this work here, now, for this product?”

Both questions matter. They just require very different orientations.

**The one thing that actually separates strong MLEs**

It’s not knowing more math. It’s not being a better coder.

It’s judgment. Knowing which experiment is worth running and which is a distraction.

Knowing when a model is good enough to ship and when it needs another iteration. Knowing how to read a metric movement and tell the difference between signal and noise.

That judgment takes years to build. And it’s almost impossible to teach directly — you just have to ship enough things and be wrong enough times.

Tomorrow: career growth as an MLE. What L4 to L5 to Staff actually requires, and why most people are thinking about it the wrong way.

See you then. — Ludo
