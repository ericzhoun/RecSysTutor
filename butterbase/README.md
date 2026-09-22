# Butterbase backend — RecSysTutor live chat

The live chat runs on [Butterbase](https://butterbase.ai): a serverless function + the app's native RAG, deployed into
the account's app (`herfield`, the only app allowed by the current plan) under namespaced, additive resources.

```
butterbase/
├── functions/tutor-chat.ts   # Deno function: RAG/lexical retrieval + tutor generation
├── deploy.py                 # deploy / ingest / test via Butterbase MCP
└── README.md
```

- **Frontend:** `../chat.html` (served from the course's GitHub Pages, CORS already allowed on the app).
- **Backend URL:** `https://api.butterbase.ai/v1/<app_id>/fn/tutor-chat` (public POST, rate-limited by the platform).

## Architecture

```
browser (chat.html) ──POST──▶ Butterbase function `tutor-chat`
                                ├─ retrieval: native RAG collection `recsys-course`
                                │    └─ fallback: lexical scoring over the published course markdown
                                └─ generation: LLM provider from the course .env (OpenAI-compatible)
                                     └─ fallback: Butterbase AI gateway
```

The LLM provider is read from the course `.env` (`model` / `API key` / `baseURL`), e.g. `glm-5.2` via
`https://open.bigmodel.cn/api/paas/v4`. The provider key is stored as a write-only function env var, never in the page.

## Setup

1. A service key is minted once via `manage_auth_config (generate_service_key)` and stored at
   `~/.butterbase/tutor-fn-key.json` (never in the repo).
2. Deploy / update the function:

   ```bash
   cd butterbase && python3 deploy.py
   ```

   Optional flags: `--test` (invoke once), `--rag` (re-ingest `deeptutor/content` into the RAG collection).

3. The course notes are exported into the RAG collection by `../deeptutor/tools/export_kb.py` (see `../deeptutor/README.md`).

## Known state

- RAG collection `recsys-course` exists (11 documents, shared access). Its **semantic query endpoint currently returns
  a server 500** — the account's AI allowance is $0, so the ingest-time embeddings could not complete. The function
  therefore falls back to lexical retrieval over the published notes, which keeps the chat fully grounded.
- The AI gateway itself rejects calls with `insufficient_credits` (balance ≈ −$0.09); BYOK alone does not bypass that,
  so generation goes **direct** to the `.env` provider. If the account is topped up, the function will automatically
  prefer the gateway again.
- One caveat: the public endpoint is open by design. The platform rate-limits (300/min), but if abuse becomes a
  concern, put a Durable Object rate limiter in front or switch the trigger to `auth: required`.

## Files of interest

- `functions/tutor-chat.ts` — retrieval + generation + CORS + debug probe (`{"debug": true}`).
- `deploy.py` — `deploy.py`, `deploy.py --rag`, `deploy.py --test`.
