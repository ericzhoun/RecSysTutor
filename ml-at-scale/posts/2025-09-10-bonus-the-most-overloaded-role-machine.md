---
title: "[Bonus] The most overloaded role: 'Machine learning engineer'"
subtitle: "let's demistify what it actually is (spoiler: no single definition)"
date: 2025-09-10
author: Ludovico Bessi
collection: Machine Learning at Scale
topics: [rl-agents]
paywalled: false
words: 1545
---

# [Bonus] The most overloaded role: "Machine learning engineer"

*let's demistify what it actually is (spoiler: no single definition)*

[![](../assets/1c42d78176ca8488.png)](../assets/1c42d78176ca8488.png)

(The moose picture will be come clear as things go on!)

If there’s one question that I keep getting asked over and over again on my socials is:

“What do you actually do as Machine learning engineer (MLE)?”

Followed closely by:

“What should I learn / focus on to: 1. get a role like that, 2. perform well in that role”

I will draw on my experiences to give an idea of the work and how wildly different it can be depending on the company and on the team within the company.

The most interesting is for sure my two ML heavy roles at Google.

It looks like to me the “MLE” job title is like the “DS” job title a few years ago, so it’s important to clarify expectations.

Let’s go!

# Machine learning engineer intern ClearBox.ai

Wow, time flies. 6 years ago I did a machine learning internship at a startup in [Turin, Italy](https://en.wikipedia.org/wiki/Turin) while studying for my MSc in Applied Maths.

It was truly a different time. There, I focused on a purely research based project where I trained a image recognition to be robust against adversarial attacks.

Adversarial attacks are **techniques used to manipulate machine learning models, causing them to make incorrect predictions or decisions**.

I did something that I now realize is a key experience:

  1. pick a paper

  2. implement it

  3. validate it works

There was no major new development, but it’s very important to be able to read papers and really understand what’s going on.

# Machine learning engineer intern VolvoCars

Here, things took a turn for the more applied side of things: “put an ML model on the car GPU that is useful”

I settled for an object detection model to detect “mooses”.

Yep, those:

[![](../assets/94e54b160c03d57c.avif)](../assets/94e54b160c03d57c.avif)

There’s a joke that there are more mooses than swedish people, so that felt an important animal to detect!

In the ML space, people understood already in 2020 that transformers were quite good, so I focused on adapting **[End-to-End Object Detection with Transformers](https://arxiv.org/abs/2005.12872) (object detection model by Meta, then Facebook)** for our use cases.

It was quite interesting, even though I worked mostly alone without cloud GPUs (but I did have one “on prem” GPU :D).

It was particularly interesting to play around deploying things on the actual GPU of the car, my memory is not serving me well but I remember I had to quantize the model to make it fit.

What I learned there:

  * Hardware knowledge

  * I can say i knew about transformers already 5 years ago!

  * Object detection models

Pretty fun, but this again was a bit too researchy for my tastes, after all it was an internship for my master thesis.

# Machine learning engineer: first role at Google

In my first role at Google, I worked in a team that is tasked to find hijackers / abusive accounts.

If you are reading this it means you are a premium sub of the newsletter.

Big thank you as always! :)

A few things:

  * At Google scale, this is BIG

  * Hijackers don’t tell you that they are hijackers… training data is not easy to get

  * Constant shifts in the space: as you “fix” something, you never know what’s the next easy surface they are going to attack. it feels like an endless mouse and cat game.

This was the first role where the focus was not particularly on the modeling side of things, but rather on the whole infra.

I’d say in true pareto style, 80% of the role was

  * How to deploy models and make they are up to date

  * How to integrate additional data sources to make models better

  * How to make sure other teams can operate on the infra

And only 20% of the time was spent on actual modelling work:

  * tensorflow development

  * feature engineering

  * model architectures

Here, I believe I learned what it means to be a “Software engineer” according to Google and the learnings were around making things scalable and reliable while still driving impact.

I also learnt that being a machine learning engineer means being

# 1-year stint as a “Full stack SWE with minimal ML work”

I wanted to really feel how a full stack product engineer works, so I did a brief stint with YouTube Ads on a back-end heavy full stack role.

It was honestly quite fun and it’s super interesting to see immediately the impact of your work through user facing changes.

However, I was really missing ML work, so I went back to a heavy ML focused role.

Still, I learned A LOT, maybe not in terms of hard code technical skills, but these are my learnings:

  * How to run a business: we were responsible for the P&L of Home, WatchNext and Search surfaces with finance targets we had to meet. Exciting to move the needle for YouTube as a whole, even though it was a bit stressful at times

  * Analyzing experiments and understanding the long term effects on users. Sometimes results are not what you expect!

  * Quite refreshing where you need to just optimize “revenue”, makes it easy to understand tradeoffs!

In this year, I think I did what has been my biggest accomplishment at Google: I launched a new feature for >1B DAUs that completly reshapes the way Ads are served and shown on the home page. WOAH! I still play with that feature every now and then, it just is soooo cool and the amount of systems and codebases I touched to make it happen still makes me giggle.

# Machine learning engineer: current role at Google

In my current role at Google, I work on the YouTube recommendation system, specifically focusing on recommending more shopping videos to users.

Here, the role shifted from massively being infra heavy to being full product:

  * Infra is totally handled by other teams, we are just clients of the infra.

  * We have one north start metric and we do all we can to optimize that. Numbers must go up and to the right and that’s how your team is evaluated

  * You can try things out if you have a good idea and see the results pretty easily.

What I find quite refreshing to being back to a ML focused role in a product heavy team, is that launching things is surprisingly easy! At the end of the day, you change some weights of a model in production, and if you can prove that the change is good, you don’t have much to worry about in terms of dependencies.

The only dependencies you can have are:

  * Data dependencies, you need to make sure data will keep flowing in!

  * Costs / latency: your new amazing ML model should still be served in prod with reasonable costs.

This is a striking difference with the previous product team, where a new feature means A LOT of coding and building on top of the gigantic O(M) LOCs codebases, which makes it hard to launch things fast in my opinion.

# What did we learn from ALL this?

A few things I hope:

  * A machine learning engineer in my opinion is still a software engineer first. Account for that! Especially as modelling is getting more and more abstracted away with tools. Software still eating the world in 2025. (see how the data scientist role is doing currently? Not so good IMHO)

  * Different teams see the role wildly differently: you could be doing very little modelling or only modelling. Try to understand that to make sure it’s aligned with your career aspirations!

  * Trying also non-ML things can be a good opportunity to increase your range of skills

  * Always be learning and be challenged. I realize now that being challenged in your role, while uncomfortable in the moment makes you much stronger later on.

  * One thing to note is that you should have the psychological safety to take risks and have a leadership team that thinks it’s OK to fail at them, what matters is the failure mode.

Hope you found value in this premium article. Let me know in the comments what you’d like to see next!
