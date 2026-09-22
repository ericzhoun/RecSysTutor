# Mastery path — interactive session (DeepTutor `mastery_path`)

Unlike `deep_question`, which emits a finished artifact, **`mastery_path` is an interactive capability**: it opens a
Socratic dialogue, diagnoses where you are, then builds a path adapted to your answers.

```bash
deeputil run mastery_path "recommender systems: from candidate generation to generative recommenders" --kb recsys-course
```

_(command: `deeptutor run mastery_path "…" --kb recsys-course`)_

## What the session did

1. **Checked for an existing path** — `mastery_status` returned `empty`.
2. **Explored the course material** — retrieved ~9.6k characters of grounded context from the `recsys-course` KB
   (chunked across the module notes and the paper atlas).
3. **Opened with a diagnostic question** rather than a static syllabus:

> Why is a recommender system built as a *pipeline* (candidate generation → ranking → reranking) rather than a single
> model that scores everything at once? Specifically:
>
> - What does each stage do, and what does it optimise for?
> - Why can’t you just use one expensive model on the entire corpus?
>
> Take your best shot — even a partial answer helps me see where you are. If you’re not sure, just say so and I’ll teach
> it from scratch.

## Why this matters

The diagnostic maps onto **Module 1** (the funnel) and lets the tutor branch: a learner who has the funnel can start at
Module 2 retrieval; someone who does not gets the funnel taught first. Continue the session interactively with
`./scripts/study_plan.sh "<goal>"` to actually walk the path.

_Session stats: capability=mastery_path, rounds=6, tools=5, tokens≈83k, cost≈$0.014._
