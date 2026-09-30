# ML@SCALE · 1:1 · One deleted model with one over-trusted agent [Edition #3]

*Machine Learning at Scale collection — Ludovico Bessi, 2026-08-02 · topic: mlops*

*Senior SWE on Google Search Page Quality. His model scores how good a web page is, feeds straight into ranking.*

[](../assets/e7e742fec1f4ef1f.jpg)

The ML@Scale 1:1 is a recurring interview series. One engineer, six questions, no fluff. We go straight to the production scars.

This week: Francesco Lorenzo, Senior SWE on Google Search, Page Quality.

* * *

**Q1 · The 60-second pitch**  
 _Who are you and what do you work on?_

Francesco Lorenzo, Senior SWE in Google Search on the Page Quality team.

His team owns the model that estimates how good a web page actually is, scored against the public EEAT guidelines (Experience, Expertise, Authoritativeness, Trustworthiness).

That score isn’t a side dashboard. It feeds directly into how Search ranks results.

As of last year he’s also working on Inputs and Factuality for AI Overviews and AI Mode. So: the quality signal that decides what billions of people see, and the factuality layer underneath the generative answers stacked on top of it.

**Q2 · The stack, end to end**  
 _Walk me through your ML infrastructure. What works, what would you change?_

“Everything is Google internal stack. We don’t use any public frameworks. Confidential.”

That’s the whole answe.

No TensorFlow you’d recognize from a tutorial, no off-the-shelf serving layer, no public framework you could go read the docs for. It’s all in-house.

Worth noting as a pattern across this series: the bigger the company, the more the public-framework knowledge stops transferring.

Sanket said the same about Meta in the previous edition:

[![ML@SCALE - 1:1 - 100 billion rows, three mistakes, one lesson \[Edition #1\]](../assets/a5992b8fb79a6401.jpg)ML@SCALE - 1:1 - 100 billion rows, three mistakes, one lesson [Edition #1]Ludovico Bessi·Jun 7Read full story](2026-06-07-mlscale-11-100-billion-rows-three.md)

The skills that compound aren’t the framework names. They’re the instincts about data, scale, and serving that survive the move into a closed stack.

**Q3 · The most expensive mistake in production**  
 _What’s a production failure you’d rather people learned from than experienced?_

He deleted the model artifacts from CNS for the production candidate he was personally responsible for releasing.

The cause: he gave Antigravity too many permissions, and the agent did what over-permissioned agents do. The silver lining is that it turned into a real org-level lesson on scoping agent permissions and workflows to be safe but still useful.

**Q4 · The thing nobody says out loud**  
 _What’s the uncomfortable truth about ML at scale that most people won’t say?_

“It’s never a clean architecture.”

There are ad-hoc patches everywhere, and over time they harden into tech debt nobody scheduled. The blog-post version of a production system is a tidy diagram. The real one is the diagram plus a decade of “we’ll fix this later” that nobody fixed.

But here’s the part specific to his scale. The trade-offs on model performance are much bigger and carry much more impact precisely because of the scale, so you end up far more cautious.

A change that’s a rounding error in a research notebook is a measurable shift in what the world sees when it touches ranking.

**Q5 · Where research meets reality**  
 _What fraction of ML research actually makes it into production systems? Why does so much get filtered out?_

His answer is the contrarian one, and it’s worth sitting with.

“Over time I would say all of it.”

Not a fraction. All of it, eventually. The catch is the eventually. It takes time to make a research idea servable at the scale of the company’s users, and resource constraints are the main bottleneck to production, not the quality of the idea itself.

So in his framing nothing good gets permanently filtered out. It gets queued. The gate isn’t “does this work,” it’s “can we afford to serve this to everyone.” Given a long enough timeline and falling serving costs, the backlog clears.

**Q6 · What you’d tell someone joining a big tech ML team**  
 _One piece of advice for an MLE about to join a large-scale team for the first time._

Three, in order of when they bite you:

Give up trying to understand everything before you start. You will not get the full picture before your first commit, and waiting for it is how you stall for a quarter. Learn to work with incomplete information. The whole job is making good moves without the full map.

At the beginning, go ultra-deep on one area. Pick a thing and own it completely. Then expand horizontally as you grow in level, not before. Depth first, breadth later.

From mid-level onward, start building cross-team relationships and learn how to influence other teams. The work stops being something you can finish alone, and the engineers who plateau are usually the ones who stayed heads-down past the point where heads-down still scaled.

* * *

**My take**

What jumps out is Q5, because it directly contradicts the last engineer in this series.

Sanket said only a fraction of research survives the trip to production, and the filtering is structural: clean benchmarks, scale that breaks ideas, costs that kill viable approaches. Francesco says the opposite. All of it makes it, eventually.

The bottleneck is purely serving cost, and cost trends down.

Both of them are right, and the gap between them is the whole story. Sanket is describing the snapshot: at any given moment, most research is sitting outside the production line because it’s too expensive right now.

Francesco is describing the time-lapse: run the tape forward, watch serving cost fall, and the line keeps moving. Same pipeline, different shutter speed.

The Antigravity confession is the other keeper. That gap, between the safety we document and the behavior we actually ship, might be the most honest thing in the whole series.

If you’ve nuked your own production artifacts (agent-assisted or fully by hand), I want your version.

Your ML@Scale Story

— Ludo
