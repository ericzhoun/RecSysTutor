# Module m9 — Study with an AI tutor (DeepTutor)

## Study with an AI tutor (DeepTutor)

This course is also a **DeepTutor** knowledge base: the same notes power a grounded tutor
      that answers from the material, generates quizzes on demand, and builds a personal mastery path. A browser-based
      **live chat** backend is deployed on Butterbase.

### From static page to personal tutor

Every module you just read has been exported to Markdown and ingested into
      DeepTutor — HKUDS’s lifelong-personalised tutoring
      platform — as the knowledge base `recsys-course`. Because answers are retrieved from these notes, the tutor
      cites the module instead of guessing, and the same base drives quizzes, research and visualisation.

**Open the live chat →** — a browser chat backed by a serverless
      function deployed on Butterbase: your question is retrieved against the course notes (native RAG, with a lexical
      fallback over the exported content) and answered by the provider configured in the project `.env`; the
      retrieved modules are shown as chips under each answer.

| You want to… | DeepTutor capability | Command |
|---|---|---|
| Ask questions | Grounded RAG chat | `deeptutor chat --kb recsys-course -t rag` |
| Get quizzed | Question generation | `deeptutor run deep_question "<topic>" --kb recsys-course --config num_questions=5` |
| Solve an exercise | Deep solve + code exec | `deeptutor run deep_solve "<exercise>" --kb recsys-course` |
| Research a theme | Deep research report | `deeptutor run deep_research "<theme>" --kb recsys-course --config mode=report` |
| See a concept | Visualise / animate | `deeptutor run visualize "<concept>"` |
| Plan your study | Mastery path | `deeptutor run mastery_path "recommender systems" --kb recsys-course` |

> The integration ships with the repo
      The `deeptutor/` folder contains the exporter (`tools/export_kb.py`), the exported knowledge base
        (`content/` — one document per module plus the 104-paper atlas), one-command wrappers in `scripts/`
        (`setup_kb.sh`, `tutor.sh`, `quiz.sh`, `study_plan.sh`), and example outputs in
        `generated/`. It needs DeepTutor installed and an LLM + embedding provider configured.
