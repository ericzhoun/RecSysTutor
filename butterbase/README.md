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

## Production characteristics

| Property | Value |
|---|---|
| Rate limit | **30 questions / 10 min / IP**, KV counter with TTL, **fail-open** (never blocks chat if KV errors) |
| CORS | allowlist: `olivistart.com`, `www.olivistart.com`, `recsytutor.github.io` (echoed, `Vary: Origin`) |
| Input caps | message ≤ 2000 chars; history ≤ 8 turns × 4000 chars |
| Timeout / memory | 60 s / 256 MB |
| Error contract | `{ error, message, requestId }`; model failures return `502 generation_failed` (no internals leaked) |
| Observability | `requestId`, `latencyMs`, `version`, `retrieval`, `grounded` in every response; `console.error` on failures |
| Diagnostics | `{"debug": "<DEBUG_TOKEN>"}` returns retrieval mode, similarity scores and raw provider status — token-gated, never public |
| Health | `GET /fn/tutor-chat` → `{status:"ok",version,retrieval,model,provider,embedModel}` |

Provider key lives only in a **write-only** function env var. The service key is stored at
`~/.butterbase/tutor-fn-key.json` (0600); the debug token at `~/.butterbase/tutor-debug-token` (0600). `.env` and both
key files are gitignored.

## Runbook

```bash
cd butterbase
python3 deploy.py            # deploy / update the function (reads the course .env)
python3 deploy.py --health   # GET the health endpoint
python3 deploy.py --test     # invoke once with a sample question
python3 deploy.py --rag      # legacy: Butterbase managed RAG (unusable on this plan - see below)
```

## Retrieval & generation (v1.3.0)

Butterbase's managed RAG is unusable on this app - its gateway exposes **no embedding
models** (`manage_ai list_models --modality embedding` is empty) and every gateway call
is refused with `insufficient_credits` (the `playground` plan's $1 lifetime allowance is
spent). Rather than depend on it, the tutor now owns its retrieval:

```
question
  -> gemini-embedding-2 (1536 dims, via GEMINI_API_KEY)
  -> pgvector cosine search over rt_chunks inside the function (ctx.db.query, HNSW index)
  -> top-6 chunks above similarity 0.45
  -> kimi-k2.6 (Moonshot, OpenAI-compatible) generates the grounded answer
```

The course corpus lives in the app's own database:

| table | purpose |
|---|---|
| `rt_chunks` | one row per chunk: `source`, `section`, `ordinal`, `content`, `tokens`, `model`, `embedding vector(1536)`, HNSW `vector_cosine_ops` index |
| `rt_documents` | one row per indexed source: `source`, `bytes`, `chunks`, `model`, `embedded_at` |

- **258 sources / 973 chunks**, covering modules `m0`-`m11`, the paper atlas, the overview
  and all 244 *Machine Learning at Scale* posts.
- Retrieval falls back to lexical scoring if the embedder is unavailable or returns
  nothing, so the chat degrades instead of failing.
- Generation calls Moonshot directly (`OPENAI_BASE_URL`); `temperature` is pinned to 1 for
  `kimi-k2.*` models, which reject any other value.

### Building the index

```bash
python butterbase/tools/build_index.py --dry-run    # show chunk counts, write nothing
python butterbase/tools/build_index.py              # embed + load everything
python butterbase/tools/build_index.py --resume     # skip sources already indexed
python butterbase/tools/index_one.py <source-stem>  # re-index a single document
python butterbase/tools/check_tutor.py              # end-to-end checks against the live URL
```

Needs `GEMINI_API_KEY` (embeddings) and `BUTTERBASE_KEY` (database writes) in the
environment. `make_env.py` writes the gitignored course `.env` that `deploy.py` reads.

### Schema

The schema lives in `manage_schema` and is **declarative and total**: anything absent from
a submitted schema is treated as a drop. When adding the `rt_*` tables, always submit the
*current* schema plus the additions - submitting only the new tables would have dropped all
nine of the other project's tables. Migration `recsytutor_vector_store` (id 35) added
`rt_chunks` and `rt_documents`.

### Env vars on the deployed function

`BB_SERVICE_KEY`, `TUTOR_MODEL`, `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `GEMINI_API_KEY`,
`DEBUG_TOKEN`. `deploy.py` merges these on redeploy (incoming keys win).

- `DEBUG_TOKEN` gates the diagnostic body: POST `{"message": "...", "debug": "<token>"}`
  returns retrieval mode, chunk count, max similarity and the raw provider status.

## Sharing the app

`app_48ul5eszfv7v` is named **herfield** and its database also holds a music/art-school
schema (`students`, `bookings`, `enrollments`, ...). The tutor's function, collection and
`rt_*` tables coexist there as namespaced additions. The `playground` plan allows only one
project, so a dedicated app is not available without a plan change.

## Monitoring

A scheduled health check runs **every 6 hours** (AutoClaw cron job `RecSysTutor chat health`) that GETs the health
endpoint and only messages the user when it is unhealthy. Manage it with the `cron` tool (list / run / disable).

## Limits / costs

Butterbase KV: 100k keys, 10 MB, 50 ops/s (rate-limit keys are tiny and self-expiring). Generation and embedding cost is billed to
the providers named in `.env` (Moonshot, Google) - Butterbase credits are not involved. Public endpoint abuse is bounded by the KV rate limit above.
