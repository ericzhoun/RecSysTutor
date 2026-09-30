# ML@SCALE · 1:1 · Every training label was lying [Edition #4] 

*Machine Learning at Scale collection — Ludovico Bessi, 2026-09-06 · topic: mlops*

*and the loss curve looked fine*

[](../assets/8f9aa746484d651c.jpg)

_Jan, Dira GeoSystems, Zürich._

_He builds automated feature extraction from aerial imagery for national mapping agencies, where the precision has to go past what’s currently possible._

* * *

**The stack, end to end.**

A prediction service on FastAPI, with Redis and Celery managing the inference queues. Each extraction task runs its own model, and that’s where the one non-obvious piece lives. Reproducibility off bleeding-edge GitHub repos is hard, so Jan takes just the model architecture, rebuilds it as a clean reproducible repo, and installs it as a pinned dependency into the prediction service.

When SOTA moves, he swaps the package. The heavy geo-data crunching sits in C++, headed toward a Bazel monorepo.

> Most reported numbers are single runs. Three seeds cost money, and might reveal your improvement is noise.

* * *

**The most expensive mistake in production.**

 Want to be part of next edition?

He fine-tuned a building extraction model on aerial images with a geometry problem baked in, and it took weeks to see it.

Start with how an aerial photo actually works. The camera is on a plane, and it only looks perfectly straight down at one point: the spot directly beneath it, called the nadir. Everywhere else in the frame, it’s looking at a slight sideways angle. So anything with height gets imaged partly from the side, and its roof appears pushed outward from that center point. The taller the building and the farther it sits from the center, the more the roof leans.

An orthophoto is supposed to fix this. It’s an aerial image resampled to read like a flat, top-down map. But the standard product corrects only for terrain, the rise and fall of the ground itself. It does not correct for building height. So the ground comes out map-accurate and the rooftops do not. They still lean.

Now the labels. They’re human-drawn polygons placed at each building’s true position on the map, its actual footprint. But in the image, the roof sits somewhere else, offset by an amount that changes with the building’s height and its spot in the frame. So every training sample paired a correct label with a displaced roof, and taught the model a spatial error that varied in size and direction across the whole dataset. Label poisoning, effectively, but invisible.

Invisible is the trap. Training looked fine. Loss came down. IoU looked fine. The only symptom was geometric accuracy plateauing well above what the image resolution should have allowed. Nothing on a dashboard tells you the labels and the pixels disagree.

The cost was weeks of training and eval chasing a model-side explanation for a data-side problem.

The catch is that true ortho, the version that corrects building height too, barely exists at national scale. The lesson is that he treated noisy labels as clean supervision.

Every fix is a mitigation: quantify the expected offset from camera geometry and building height, weight or filter samples by how far they fall from the center, or split the problem so the model only learns what the data can actually teach.

> I now ask “what can these labels actually teach” before the first training run, instead of after the plateau.

**What nobody says out loud.**

It’s messy, and the mess is the job. The blog post shows the clean architecture diagram. The actual work was the weeks before it, finding out why the labels lie. And reproducibility is boring and hard. Most reported numbers are single runs, because three seeds cost money and might reveal that your improvement is noise. Neither the mess nor the seed count gets written up, because neither one demos well.

**Where research meets reality.**

DiraGeoSystems consumes research rather than produces it, and from that side, most papers die on contact with real data.

**What you’d tell someone joining big tech ML.**

The infra you inherit will feel like the natural state of the world. It isn’t. The platform and the possibilities a big-tech MLE has are easy to take for granted precisely because they arrive pre-built. From the outside, you can see the scaffolding that people on the inside stop noticing.

**So what’s ML at scale actually like?**

Asking for a friend. The friend is me.

* * *

# **My take.**

Every guest in this series so far has been inside one of the largest ML systems on earth. Jan is the first one standing outside, and it produces the most honest answer we’ve had about what the platform actually gives you.

The building extraction story is one every supervised-learning team should read, even if they’ve never touched a photo in their life. The failure mode is portable: your label and your pixel came from two different sources of truth, the mismatch is systematic rather than random, and nothing in your training curves will tell you. Swap “rooftop displaced from nadir” for OCR ground truth, medical annotation, or fused sensor labels and it’s the same trap.

The reframe is the takeaway: ask what the labels can teach before the first run, not after the plateau.

And the quiet one, the line I’d underline: three seeds cost money and might reveal your improvement is noise, so nobody runs them.

— Ludo
