# DeepTutor integration — RecSysTutor as a live tutor

This folder turns the static **RecSysTutor** course into an interactive, personalised tutor by wiring it into
[**DeepTutor**](https://github.com/HKUDS/DeepTutor) (`deeptutor`), HKUDS's lifelong-personalised tutoring platform.

The course content is exported to Markdown, ingested as a DeepTutor **knowledge base**, and then served through
DeepTutor's capabilities: grounded **RAG chat**, **quiz generation**, **mastery paths**, deep research and visualisation.

```
deeptutor/
├── tools/export_kb.py      # course HTML + papers graph → Markdown
├── content/                # the exported knowledge-base documents (source of truth for the KB)
├── generated/              # example outputs produced by DeepTutor capabilities
├── scripts/                # one-command wrappers
└── README.md               # you are here
```

## Prerequisites

- DeepTutor installed and configured: `pip install deeptutor` (or `pip install -e .` from a checkout), then `deeptutor init`.
- A working LLM + embedding provider in DeepTutor settings (`deeptutor config show`).
- For re-exporting content: `lxml` (ships in the DeepTutor virtualenv).

## Quickstart

```bash
# 1. build / refresh the knowledge base from content/
KB=recsys-course ./scripts/setup_kb.sh

# 2. talk to the course (grounded RAG chat)
./scripts/tutor.sh

# 3. or ask for a quiz on any topic
./scripts/quiz.sh "multi-task learning: MMoE and ESMM" 5

# 4. or generate a study path
./scripts/study_plan.sh "recommender systems, beginner to HSTU"
```

Equivalent raw commands:

```bash
deeptutor kb create recsys-course --docs-dir content
deeptutor kb set-default recsys-course
deeptutor chat --kb recsys-course -t rag
deeptutor run deep_question "candidate generation" --kb recsys-course --config num_questions=5
deeptutor run mastery_path "recommender systems, beginner to HSTU" --kb recsys-course
```

## What this buys you over the static page

| Course feature | DeepTutor capability | Command |
|---|---|---|
| Reading lessons | Grounded Q&A over the notes | `chat --kb recsys-course -t rag` |
| Self-check quizzes | Generated question batches (any topic/level) | `run deep_question "<topic>" --kb recsys-course --config num_questions=N` |
| Exercises | Step-by-step solving with code execution | `run deep_solve "<exercise>" --tool code_execution` |
| Paper atlas | Literature research + synthesis | `run deep_research "<theme>" --kb recsys-course --config mode=report` |
| Diagrams | Concept visualisation & animations | `run visualize "<concept>"` |
| Learning tracks | Personalised mastery path | `run mastery_path "<goal>" --kb recsys-course` |

## Content pipeline

`tools/export_kb.py` reads the course `index.html` plus the ads knowledge graph and writes:

- `content/m0..m8-*.md` — one document per module: lesson prose, formulas, code, exercises (with solutions), and the quiz bank.
- `content/papers-atlas.md` — all 104 papers grouped by pipeline stage, with venues, themes, notes, PDF links, and the curated lineage chains.
- `content/00-overview.md` — structure + study commands.

Re-export after editing the course:

```bash
PYTHON=/path/to/deeptutor/.venv/bin/python \
GRAPH=/path/to/Awesome-.../ads_knowledge_graph/knowledge_graph.json \
  ./scripts/setup_kb.sh
```

## Files of interest

- `generated/quiz-m2.md` — a `deep_question` batch produced from the Module 2 notes.
- `generated/study-path.md` — a `mastery_path` for the whole course.
- `generated/tutor-sample.md` — a grounded `chat` answer demonstrating RAG citations.

> Note: `content/` is derived from the course and the companion paper repository; keep the attribution notes intact.
