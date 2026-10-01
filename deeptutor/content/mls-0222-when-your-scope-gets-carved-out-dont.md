# My manager asked me to stop working on my scope. I turned it into the strongest L5 evidence I have

*Machine Learning at Scale collection — Ludovico Bessi, 2026-07-01 · topic: career*

[](../assets/81caf97a7f5ecf67.jpg)

Six months ago, my manager asked me to stop working on a chunk of what I owned.

The work was being carved out and given to a new pod.

The pod has ICs, a charter, roadmap commitments.

The TL role is open and being recruited for, so for now it’s running without one.

My instruction was clean: wind it down, hand it over, focus on new scope.

I did most of that. But I negotiated two things up front, and they’re the reason this post exists.

First, **I kept three launches that were already in flight.** Pulling me off mid-flight would have either delayed them or forced the new team to ramp on something they couldn’t yet own. Finishing them was the cheapest path for everyone, and my manager agreed. That kept me delivering through the transition instead of going dark.

Second, **I used the wind-down quarter to write.** Instead of treating “stop working on this” as license to coast, I turned it into a documentation exercise: design docs, decision records, postmortems-of-things-that-never-shipped, the unwritten reasons behind half the system.

Stuff that wasn’t in any doc because I’d been the one carrying it in my head.

Six months later, the new pod’s onboarding projects have mostly come from work I previously owned.

They’ve been ramping against the docs I wrote during the wind-down.

And because I’m the author of those docs, I’m also the cheapest answer to every question the docs don’t quite cover. Not on the pod. Not leading anything.

That positioning is one of the highest-leverage career situations a mid-level engineer can be in, and almost nobody plays it intentionally.

They wind down and disappear, or they fight the carve-out.

Both leave value on the table.

The standard playbook when this happens has two flavors, and both are losing moves.

**Bad answer #1: Get territorial.** Argue in the reorg doc. CC your skip. Talk about “context loss.” Frame it as a risk to the org. Everyone clocks what you’re actually doing: defending your little square of grass.

**Bad answer #2: Get clean too fast.** Hand it off in a doc, wish them luck, move on to “new scope.”

Six months later the new team has rewritten your work, the institutional memory is gone, and the only artifact of two years of your effort is a deprecated design doc nobody reads.

I did neither.

Here’s what I want to cover today, in five angles:

  1. **Why “losing” scope is a senior-track opportunity** if you read the situation right

  2. **The contrast: territorial vs. bridging** same situation, two outcomes

  3. **The bridging playbook** starting from the wind-down quarter and what compounds from there

  4. **The evidence trail** turning “I helped them ramp” into something legible at calibration

  5. **The risks** when this backfires, including the most important one: handing off cleanly when the new TL lands

Let’s go.

* * *

### 1\. Reorgs are graph operations, not territorial ones

When most engineers see a reorg, they see a map: _here’s my territory, here’s the new team’s territory, here’s the border._ They fight at the border.

Reorgs aren’t maps. They’re **graph rewrites.** Boxes move.

The real institutional knowledge, the unwritten reasons things are the way they are, the failure modes nobody documented: those stay attached to whoever was holding them when the rewrite happened.

**That’s the entire opportunity.**

Every onboarding project they’ve started has run into a question that requires an edge:

  * _Why is this feature gated this way?_

  * _Why didn’t we just use X?_

  * _What broke last time someone tried this?_

  * _Who actually consumes this signal downstream?_

Some of these are now in the docs I wrote during the wind-down. The rest aren’t.

And every time I answer one, the bridge gets a little more durable: not because I’m hoarding context, but because I’m the literal source of it.

This is the thing the territorial engineer misses entirely. They think the reorg took something from them. The reorg gave them a structural position that compounds for as long as they choose to stay engaged.

* * *

### 2\. Territorial vs. bridging: same situation, two outcomes

Let me make this concrete, because I think it’s where the framing clicks.

Same setup: your manager tells you a chunk of your scope is being carved out, you’re being wound down on it, focus on new work.

**The territorial engineer responds:**

> I want to flag that pulling me off this is going to create context loss. There’s a lot here that’s not documented and the new team is going to struggle without me. Can we talk about the timing?

What this signals to the manager: _defensive, treats knowledge as leverage, making my reorg harder._ What it signals to the new team when they hear about it: _adversary._ Outcome at calibration: “Solid IC, but didn’t help the org through the transition. Not ready for L5.”

**The bridging engineer responds:**

> Got the wind-down note — makes sense. I’d suggest keeping me on the three in-flight launches since pulling me off would slip them, and using the rest of the quarter to write up the design docs and decision context the new team will need. Happy to stay close after that as a resource while they ramp.

What this signals to the manager: _solves my problem, owns the transition, scales beyond their box._ What it signals to the new team: _ally, not a threat._ Outcome at calibration: “Was instrumental in standing up the new pod. Sphere of influence extends beyond direct scope. Senior-track behavior.”

Same situation. Same person. Two career trajectories.

The territorial response _feels_ like protecting your value. It’s actually the opposite: it’s the move that makes you most replaceable, because once the new team rewrites your stuff (and they will, in 12–18 months), you have nothing.

The bridging response keeps you valuable in a way that doesn’t depend on owning the code. It depends on owning **the reasoning.**

* * *

_Everything above is the setup. Below is the actual playbook._

_Starting with the wind-down quarter as the foundation, then the specific moves to stay useful to a pod you don’t sit on without overstepping, the calibration packet structure that turns this into L5 evidence, and the three failure modes that turn this from leverage into a political mess (including the most important one: handing off cleanly when the new TL lands)._

🔒 **The rest of this post is for paid subscribers.**

* * *

### 3\. The bridging playbook

The trick to being useful to a team you don’t sit on is that **everything has to land as service, not authority.** You’re not directing. You’re making yourself the cheapest, fastest answer in the room and letting the team’s gravity do the rest.

Here’s what I’ve actually been doing.

**Phase 0: The wind-down quarter is the foundation.**

The bridging only works if you build the substrate during the handoff itself. When my manager told me to wind down, I asked for the quarter to be a _documentation_ quarter: design docs, decision records, the explanations behind why things were the way they were.

He said yes immediately, because from his angle it solved a real problem: a team was about to inherit a system with most of the context locked in one person’s head.

This was the single most important move I made, and at the time it didn’t feel like a career move at all. It felt like good engineering hygiene. But it had two effects I didn’t fully anticipate:

  1. **It made me the author of the substrate the new team would ramp against.** Every time someone reads those docs and has a follow-up question, the natural escalation path is to me. Not because I engineered it that way, but because I wrote the thing.

  2. **It produced calibration evidence that didn’t require interpretation.** “Wrote the design docs the new pod onboards against” is a single-sentence packet entry that lands harder than three months of sprint tickets.

If you’re early in a wind-down this is the move. Don’t ship one more feature.

Write the documents that will outlive your involvement. Your future bridging work depends on artifacts that exist _before_ you stop being the owner.

The other piece of Phase 0 was the three in-flight launches. Keeping those wasn’t about clinging: it was about making sure the wind-down didn’t slip commitments the org had already made. It also meant I stayed delivering and visible during the transition quarter, instead of disappearing into “doc writing” with nothing shippable to show. Both things mattered.

**Phase 1: Become the cheapest answer in the room.**

Once the wind-down quarter ended and the new pod was ramping, I made it explicit that I was easy to ping. Not “I’m available if you need me”: that’s passive.

More like: _“For anything that touches [system X], it’s almost always faster to ask me than to dig. I won’t be offended by ramp-up questions.”_

Two-sentence answers in chat. No essays, no flexing context. Just the answer.

This sets the precedent: _Ludo is fast and cheap to consult._

**Not** _Ludo is the gatekeeper, and not Ludo is hovering._

**Phase 2: Front-run the questions.**

Once I’d seen a few of their projects start, I had a model of where they were going to hit walls. So I started getting in front of them. Before sprint planning, I’d send a short message: _“Heads up — the X work is going to bump into Y. Want me to write up a half-pager so the team has it before they start?”_

You’re not in their planning meeting. You’re not making the decisions.

You’re just reducing their cognitive load before the decision has to be made. Over time, the team starts pulling you in earlier on its own which is the right direction for this to flow.

**Phase 3: Frame input as context, not direction.**

This is the part that matters most given there’s no TL in place because without a TL, an L4 from another team giving “directional input” reads weird fast.

The language has to stay in the lane of _context-sharing_ , not _decision-making._

❌ “You should do it this way.”

✅ “Worth knowing: we tried the other approach in 2025 and the failure mode was [specific thing]. Up to you how you want to handle it.”

The first is a directive you don’t have the authority to give.

The second is information they can use however they want. The team almost always lands on the better option on their own but the decision was theirs, not yours, which is both more honest and more sustainable.

**Phase 4: Compound, quietly.**

After a few months, the new pod’s first projects are shipping.

The work draws on context I provided a lot of it just by them reading the docs I wrote in Phase 0, some of it through follow-up conversations.

The ICs are getting credit for delivering, _as they should._ I’m not on the changelist. I’m not in the launch announcement. But my fingerprints are in the design choices that didn’t blow up.

This is the part that requires discipline: **you have to be okay with not being visible on the output side.** Visibility comes through your own packet, not through claiming credit on theirs. We’ll get to that.

* * *

### 4\. The evidence trail

The biggest mistake engineers make running this play is not capturing the evidence as they go. Six months in, you’ll know in your bones that you were essential to the new pod’s ramp. Your packet will say “helped onboard new team.” That’s the same as “did nothing.”

Here’s the structure I use.

**For the wind-down quarter itself, capture:**

  * The list of design docs and decision records you wrote, with links.

  * A single sentence per doc on what problem it solves for the new team.

  * A note on the in-flight launches you kept, with launch metrics — these are the proof that “wind-down” didn’t mean “stopped delivering.”

This is the easy part. The docs exist, they have authors, the launches have dashboards.

**For the bridging period after, per project the new pod ships, capture three things:**

  1. **The input** — the specific message, doc comment, or design review where you contributed context. Screenshot or link. _Not_ “I gave feedback.” The literal artifact.

  2. **The counterfactual** — what would likely have happened without it. _“Without this context, the team was on track to ship the original design, which would have hit [specific failure mode] based on our 2025 incident.”_ This is the hardest part to write and the most valuable.

  3. **The attribution** — a quote or written acknowledgment from an IC on the pod. The cheapest way to get this is to ask, after a project ships well: _“For my own promo packet — would you be open to dropping a few lines in writing about how we collaborated?”_ People say yes. Almost always.

Three projects with this structure beats twenty bullet points of “supported the team.”

**The packet framing for L4→L5** is **scope, not effort.**

Bad framing: _“I spent ~30% of my time supporting the new pod.”_ Reads as: did extra work.

Good framing: _“Authored the design documentation the new pod onboards against, delivered three in-flight launches during the transition quarter, and served as the technical bridge across [**N**] of their subsequent launches — while delivering [my own work]. _

_Sphere of technical influence extended across two pods covering [system surface].”_

Reads as: senior-track scope.

You’re not asking to be promoted for working hard. You’re documenting that you’ve already been operating at the next level. The packet just makes it legible.

* * *

### 5\. When this backfires

Three failure modes worth being honest about.

**Failure mode 1: The new TL lands and inherits a team that’s already been bridged through you.**

This is the most important one given the situation, and it’s the one I’m actively planning for. If you’re not careful, the new TL arrives and reads the bridging as encroachment — _why is this L4 from another team in all my team’s design reviews?_ Even if everything you did was honest and useful, the optics on day one of their tenure can be bad.

The play: as soon as the TL hire is announced, the bridging posture **shifts to handoff posture.** Within the first two weeks, you proactively reach out, offer a context dump, and explicitly hand the relationship over. _“I’ve been the go-to for context on [system X] while the team was ramping, happy to keep helping or step back, whatever works for you.”_

Nine times out of ten the new TL says “please keep helping” because they’re drinking from a firehose. But you’ve made it their call, not yours. You’re not clinging.

The evidence you captured in section 4 doesn’t go anywhere. The bridging period happened. It’s documented. The handoff is the right move at the right moment.

**Failure mode 2: Your own manager doesn’t see it.**

You can be the bridge for another pod and your manager can have no idea, because none of it shows up in your sprint board. This is a calibration disaster. You’ll have done the work and have nothing to show.

Fix: in every 1:1, give your manager one specific example of context you provided to the other team that week. One. Not a list. One concrete thing. Over a quarter, that’s twelve data points without ever sounding like you’re flexing.

**Failure mode 3: You actually scale yourself for free.**

This is the real risk. If you do this for nine months and your packet still reads “L4,” you got played. The bridging only works if the visibility, the attribution, and the calibration narrative are all in motion _while you’re doing the work_ not after.

If by month three you don’t have at least one written acknowledgment from someone on the pod, one example of being pulled in early on a design, and your manager nodding along when you describe the scope… stop. Renegotiate. Or pull back.

The line between “bridging on the promo path” and “free senior IC labor” is whether you’re capturing the evidence in real time.

* * *

**One last thing.**

The reason this works is that it inverts the default mid-level engineer instinct.

Most L4s think the path to L5 is _more code, bigger projects, harder problems._

That’s the path the system tells you to walk, and it’s the path with the most competition.

The path that’s wide open is **influence without authority.**

Almost nobody runs it intentionally, because it requires you to do work that doesn’t show up on your sprint board, in a place where you have no formal mandate, with people who don’t report to you. It feels, in week two, like you’re being a chump.

In month nine, it feels like you’re the only person at your level whose name comes up when leadership talks about who’s ready.

— Ludo

* * *

 _A few caveats: this worked in my org, with the specific dynamics of this reorg and an open TL req. It might not work in yours. Read the local political context._

_It also assumes a baseline of technical credibility; if your prior work on the carved-out scope was mediocre, the new team won’t pull you in to begin with._

_The play amplifies what’s already there, it doesn’t manufacture it._

* * *
