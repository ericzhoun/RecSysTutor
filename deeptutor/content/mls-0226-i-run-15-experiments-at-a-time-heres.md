# How I run 15 experiments at a time

*Machine Learning at Scale collection — Ludovico Bessi, 2026-07-15 · topic: career*

[](../assets/671ebbc1803dcbe8.jpg)

a launch every month, by myself.

closer to two if you count the work i hand off to L3s and fellow L4s and shepherd through.

most PRs in my org under my VP. most LOCs landed.

and the dominant narrative in 2026 is that this IC archetype is dead.

**here’s what i’m going to argue:**

  1. the “coding machine is dead” narrative doesn’t survive contact with the actual data

  2. the new coding machine doesn’t type fast. they run a portfolio

  3. taste is the moat: taste in picking what to start, what to drop, what to hand off

  4. your time stops being about typing and becomes about review, deciding what to work on, design docs, cross-org alignment and mentoring

  5. none of this works without the infra to get signal back fast

let’s go.

### the narrative doesn’t survive contact with the data

every six months a new piece ships about how the IC is dead and the future is “engineers who think in specs” or “PMs who code with cursor.” these takes have legs because they’re flattering to a lot of people who want them to be true.

but the dashboards inside actual product orgs tell a different story.

the engineers landing the most code are still getting promoted, still getting the staff offers, still getting the call when something’s on fire. that hasn’t changed.

what changed is _how_ they’re shipping it.

### the new coding machine runs a portfolio

a year ago, a high-output engineer might run two or three things at once. one main project, a side rock, maybe a refactor in flight.

i run 15 experiments at any given time.

yeah. 15.

every morning, the first thing i do (before standup, before slack, before anything) is open my experiments dashboard and walk the list. for each one i’m asking three questions:

  * is this trending toward launch? if yes, what data am i still waiting on?

  * is this dead? if yes, kill it today, free the slot.

  * is this borderline? if yes, what’s the cheapest variant change that would make it land?

this takes 20 minutes. by the time standup starts, i’ve already made the most important decisions of my day.

**bad answer for what i do:** “i’m a strong IC who ships a lot of code.”

**good answer:** “i run a portfolio of small bets in parallel, kill the bad ones on day 2, and i’m aggressive about handing off the next wave to teammates so my own time stays on the highest-leverage thing in the queue.”

the portfolio is the unit. the launches are the output.

**Paid subscribers continue below — the rest covers: the taste muscle that makes this work, the two kinds of work i hand off and why, where my time actually goes now, the infra requirement nobody talks about, and the failure mode that kills this operating model.**

* * *

### taste is the moat

the entire portfolio model collapses if you can’t tell, fast, which experiments deserve more time and which ones don’t.

this is the part nobody can teach you and nobody can outsource to an agent.

it’s pattern matching on hundreds of prior experiments. it’s knowing that a metric move of a certain shape is real and another shape isn’t. it’s smelling that an experiment is working for the wrong reason before the dashboard tells you.

i built this muscle the only way you build it: by running a lot of experiments, watching most of them fail, and forcing myself to write down _why_ before moving on.

three rules i actually use:

**1\. kill on shape, not on significance.** if the curve looks wrong on day 2, don’t wait for day 14 to declare significance. shape is signal. i kill maybe 40% of my experiments before they reach any traditional stat threshold, and i’m right almost every time.

**2\. if you’re hoping, you’ve already lost.** the moment i notice i’m refreshing a dashboard hoping it’ll come back, the experiment is dead. taste is the absence of hope. the experiments that work look obviously like they’re working.

**3\. the most expensive experiment is the one you keep alive out of guilt.** every slot held by a zombie experiment is a slot not held by something that could launch. cost of keeping a dead experiment running is not zero. it’s the launch you didn’t get.

### the two kinds of work i hand off

the portfolio model only scales if you ruthlessly hand off the right things.

the trap most strong ICs fall into is binary thinking “this is mine, that’s theirs.” in practice there are two specific buckets that should always go to teammates, and naming them helps.

**bucket 1: the template still needs variant iteration.**

i build something once, end-to-end. the first version teaches me what the right shape is. now there are 5-8 obvious variants to try: different features, different thresholds, different model configurations.

Each variant is mostly a config change plus a bit of glue.

i used to run all the variants myself. now i don’t. i write up what i learned from v1, what hypothesis each variant is testing, and i hand the variant work to an L3 or another L4. they get a clean scoped piece of work with a clear signal at the end. i get my time back to start the next first-of-its-kind experiment.

the variant work is where most of the _launches_ come from, by volume. but it’s not where the taste lives. taste lives in v1.

**bucket 2: low-hanging fruit where my ROI is better spent elsewhere.**

every quarter there’s a list of small wins on the floor. metric improvements i can see clearly, where the path is obvious, where i could ship in a week.

a year ago i’d grab them. they’re easy points.

now i don’t. if i can clearly see the path, so can someone else once i write it down. and the hour i’d spend on that small win is an hour not spent on the harder problem where i’m one of the few people in the org who can see the path at all.

handing off low-hanging fruit isn’t generosity. it’s portfolio discipline. **i cannot afford to spend my time debugging an experiment that barely moves a metric.**

what i actually do for both buckets:

  * one-page implementation plan with the _why_ of every non-obvious decision. not what to build. why this and not the alternative.

  * pre-identify the 2-3 places they’ll get stuck. pre-write the answer in the doc.

  * carve along seams with clean test boundaries. they get green CI fast and feel momentum.

  * show up for the first review within 30 minutes of them sending it. fast review compounds.

they ship the launch. they get the credit. As they should! they did the work. and now i have the slot back.

this doesn’t hurt my promo case. it helps it. “shipped X” is fine. “shipped X and unblocked three teammates who shipped Y, Z, W” is the L5 story.

### where my time actually goes now

if i’m not typing as much, what am i doing all day?

four things, in roughly this order:

**1\. reviewing PRs. this is the new bottleneck.**

when you’re shepherding 15 experiments and the variants of those experiments are being implemented by 3-4 other people, you become the rate-limiter on review.

if i’m slow on review, the whole portfolio stalls. teammates lose momentum. CI signal arrives stale. experiments that should have been live yesterday slip to next week.

i now treat review as a first-class workstream. i clear my review queue twice a day, minimum. i comment with intent, never nits without context.

fast review is a force multiplier. slow review is the most expensive thing i can do.

**2\. writing design docs for others to pick up.**

the design docs i write now aren’t for my own thinking. they’re for someone else to read and pick up the work from. that means the bar is different. it has to be readable, it has to be self-contained, it has to anticipate the questions a teammate will hit by paragraph 3.

a good design doc means an L3 can take a project and run with it without booking a single sync with me. that’s the goal. every meeting i save is time back into the portfolio.

**3\. cross-org conversations to figure out what targets actually matter.**

the worst failure mode at L4+ is shipping experiments against the wrong metric. you optimized the thing in your OKR. the thing in your OKR turned out to be the wrong proxy. you wasted a quarter.

i now spend real time talking to leaders and engineers in adjacent orgs — what are they seeing, what’s their model of where the metric is actually moveable, what’s downstream of what. these conversations don’t generate code. they generate the _direction_ of code. that’s much more valuable.

this is also the work that’s most invisible from the outside. nobody sees you in a 1:1 with a staff engineer two orgs over. but the next experiment you spin up is 3x more likely to land because of it.

**4\. mentoring, specifically to scale myself.**

mentoring as a status thing is a trap. mentoring as a way to parallelize your own work is the highest-leverage thing you can do as an IC.

when i mentor an L3, the goal is concrete: in 6 months they should be able to take a v1 i shipped and run all the variants without me babysitting. that’s the contract. it’s not abstract career growth. it’s “i need you to be able to carry these specific kinds of projects so i can stop carrying them.”

this is good for them as they get real ownership and real launches.

it’s good for me: i get my slot back.

it’s good for the team: throughput goes up. nobody loses.

### the infra requirement nobody talks about

none of the above works without one specific thing: the ability to get signal back from an experiment fast.

if your experiment loop takes 2 weeks per iteration, you cannot run 15 in flight.

you cannot kill on shape because the shape doesn’t show up in time. you cannot hand off variant work because the L3 picking it up will wait 2 weeks for their first signal and lose all momentum.

the portfolio model requires a fast loop:

  * a way to land a small change behind a flag in under a day

  * a metric pipeline that gives directional signal in under 48 hours, not a week

  * enough automated guardrails that you don’t need a human to babysit each launch

if you don’t have this, the operating model i’m describing is not actually available to you. it’s not that you’re lacking discipline. the system won’t let you run it.

this is the single most underrated factor in IC career trajectories right now.

two engineers with identical taste and identical work ethic can have wildly different output if one is on a team with a 2-day signal loop and the other is on a team with a 2-week loop. the first one looks like a coding machine. the second one looks average.

when you’re picking your next team, the experimentation infra matters more than the problem space, the manager, or the comp. a fast loop on a boring problem will outproduce a slow loop on an exciting one, every time.

### the failure mode that kills this model

the failure mode isn’t typing too little. it’s losing the thread on too many experiments at once.

when you’re running 15 things in parallel, there’s a constant temptation to skim the morning walk. glance at each dashboard, eyeball the curve, move on. it feels efficient. it isn’t.

the experiments that die quietly aren’t the ones that crash. they’re the ones where the metric is moving for the wrong reason and you didn’t catch it because you spent 90 seconds on a 10-minute look. you launch the variant. it doesn’t replicate. now you’re three weeks in, debugging an experiment that was never working the way you thought.

the second failure mode is related: handing off too early.

when a v1 looks promising, the temptation is to write the variant doc and hand it off the same day. free the slot, start the next thing. the problem is that v1 isn’t actually proven yet. you’ve seen one curve, on one slice, and you’re now committing a teammate’s quarter to running variants of something that might not survive a second look.

i’ve done this. the fix isn’t more discipline. it’s a hard rule: i don’t write the variant handoff doc until the v1 has held shape across at least two slices and one full week. if it hasn’t, the work stays mine until it has.

both failure modes have the same root: the portfolio model rewards speed, and speed past a certain point starts compounding mistakes instead of compounding launches. you have to know where your line is. mine moved twice this year.

### caveats

  * i’m L4 pushing for L5. at staff+ the math changes — the portfolio gets smaller, the per-bet impact gets bigger. don’t generalize up the ladder.

  * “15 experiments” is a number that fits my domain. yours might be 5 or 30. the principle is portfolio thinking, not the specific count.

  * this all assumes you have a fast experimentation loop. if you don’t, fix that before fixing anything else.

  * one good year is not a track record. take this as a hypothesis i’m operating on, not a law.

### final thoughts

the coding machine archetype isn’t dead. the typist archetype is dead, and a lot of people who thought they were coding machines were actually typists.

the people who built taste through volume are now running portfolios of 15 bets, killing the bad ones on day 2, handing off variants and low-hanging fruit so their own time stays on review, design, alignment, and mentoring

and shipping more in a quarter than they used to ship in a year.

if you’re an IC in 2026 and you’re worried about your career, the question isn’t whether to use AI more. you’re already using it. the question is whether you’ve built the taste muscle that lets you run a portfolio, whether you’ve gotten honest about what to hand off, and whether you’re on a team with the infra to support it.

i’m having my best year. i picked the right side of things. you can still pick.

— Ludo
