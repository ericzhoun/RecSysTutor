# Butterbase backend — RecSysTutor live chat (production)

The live chat runs on [Butterbase](https://butterbase.ai): a serverless function plus the app's native RAG, deployed
into the account's app (`herfield` — the only project the current plan allows) under **namespaced, additive** resources.

```
butterbase/
├── functions/tutor-chat.ts   # Deno function — production build (v1.1.0)
├── deploy.py                 # deploy / ingest / health / test via Butterbase MCP
└── README.md
```

- **Frontend:** `../chat.html` (served from the course's GitHub Pages; CORS-allowed on the app).
- **Backend:** `POST https://api.butterbase.ai/v1/<app_id>/fn/tutor-chat`
- **Health:** `GET  https://api.butterbase.ai/v1/<app_id>/fn/tutor-chat`

## Architecture

```
browser (chat.html)
  └─POST─▶ Butterbase function `tutor-chat`
            ├─ CORS allowlist + per-IP rate limit (KV incr, fail-open)
            ├─ retrieval: native RAG collection `recsys-course`
            │    └─ fallback: lexical scoring over the published course markdown
            ├─ generation: LLM provider from the course .env  (gateway fallback)
            └─ grounded answer + source modules + requestId
```

## Production characteristics (v1.1.0)

| Property | Value |
|---|---|
| Rate limit | **30 questions / 10 min / IP**, KV counter with TTL, **fail-open** (never blocks chat if KV errors) |
| CORS | allowlist: `olivistart.com`, `www.olivistart.com`, `recsytutor.github.io` (echoed, `Vary: Origin`) |
| Input caps | message ≤ 2000 chars; history ≤ 8 turns × 4000 chars |
| Timeout / memory | 60 s / 256 MB |
| Error contract | `{ error, message, requestId }`; model failures return `502 generation_failed` (no internals leaked) |
| Observability | `requestId`, `latencyMs`, `version`, `retrieval`, `grounded` in every response; `console.error` on failures |
| Diagnostics | `{"debug": "<DEBUG_TOKEN>"}` returns RAG/LLM internals — token-gated, never public |
| Health | `GET /fn/tutor-chat` → `{status:"ok",version,collection,model,provider}` |

Provider key lives only in a **write-only** function env var. The service key is stored at
`~/.butterbase/tutor-fn-key.json` (0600); the debug token at `~/.butterbase/tutor-debug-token` (0600). `.env` and both
key files are gitignored.

## Runbook

```bash
cd butterbase
python3 deploy.py            # deploy / update the function (reads the course .env)
python3 deploy.py --health   # GET the health endpoint
python3 deploy.py --test     # invoke once with a sample question
python3 deploy.py --rag      # (re)ingest deeptutor/content into the RAG collection
```

## Known state / switching on the managed paths

- The account's AI allowance is **$0** (balance ≈ −$0.09). Consequences:
  - the AI gateway returns `insufficient_credits` (BYOK alone does not bypass it), so generation goes **direct** to the
    provider in `.env` — currently **glm-5.2** on `open.bigmodel.cn` (OpenAI-compatible);
  - the RAG collection's semantic query returns a server 500 because ingest-time embeddings could not be billed, so the
    function falls back to **lexical retrieval** over the published notes (still grounded, with module citations).
- To move back to the managed paths: top up the account / enable auto-refill. The function already prefers the
  Butterbase gateway and native RAG, so no code change is needed — verify with `deploy.py --test` that
  `mode` becomes `gateway` and `retrieval` becomes `rag`.
- The endpoint is public by design (`auth: none`) so the static page can call it. Rate limiting is in place; if you
  want stronger control, add a Durable Object limiter or switch the trigger to `auth: required` with app sign-in.

## Limits / costs

Butterbase KV: 100k keys, 10 MB, 50 ops/s (rate-limit keys are tiny and self-expiring). Generation cost is billed to
the provider in `.env`. Public endpoint abuse is bounded by the KV rate limit above.
