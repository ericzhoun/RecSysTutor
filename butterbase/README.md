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
- Generation calls Moonshot directly (`OPENAI_BASE_URL`). **`thinking` is disabled for
  `kimi-k2.*`**: as a reasoning model it spends the entire `max_tokens` budget on
  `reasoning_content` before emitting any answer, so a modest budget yields an EMPTY
  completion (`finish_reason: "length"`, `content: ""`). Disabled mode requires
  `temperature: 0.6`; enabled mode requires `1`. The prompt also caps answers at ~250 words,
  otherwise a broad question runs past 25k characters and 80s.

  Measured effect: typical answers went from 25-40s, sometimes empty, to 6-20s.

- **The HTTP trigger buffers responses**, so token streaming is not possible: a probe emitting
  five chunks 700ms apart delivered them all at t+4.97s. The page therefore shows progress
  rather than streamed text - see `../chat.html` (animated placeholder, staged status line,
  live elapsed timer, 2-minute client-side abort).
- **Citations are readable and openable.** Each retrieved source is returned with a `label`
  (the article's real title, or the course module's heading), a `note` (`ML@Scale #14`, `M2`),
  a `kind` (`course` | `library` | `atlas`) and a `url`. The page renders them as links, so a
  citation is never a dead end.

  This matters because the corpus mixes two different things: the course's own 12 modules
  (`m0`-`m11`) and a 244-post external library (`mls-NNNN-slug`). The number inside an `mls-*`
  id is that collection's own item number, **not a course lesson** - showing it bare (e.g.
  `mls-0014-explainability-ml-models`) made readers look for a "lesson 14" that does not exist.

  Link targets: modules resolve to `index.html#mN` (the lesson in the course page); library
  posts resolve to `ml-at-scale/posts/<date>-<slug>.md`. The KB copies under
  `deeptutor/content/` are deliberately **not** used as targets - their `../assets/` image
  references do not resolve, so those pages would render with broken images.

- `DEBUG_TOKEN` gates the diagnostic body: POST `{"message": "...", "debug": "<token>"}`
  returns retrieval mode, chunk count, max similarity and the raw provider status.

## Learner accounts (progress, roadmap, streak)

The course page can now hold an account, and a learner's progress follows them between
browsers and devices. This is a **separate feature from the chat**: no function, no service
key, no shared secret. The browser talks to the app's auth and data APIs with the
**learner's own token**, and Row-Level Security is the security boundary.

```
learner's browser
  ├─POST─▶ /auth/<app>/signup | login | refresh | verify-email | forgot-password | reset-password
  └─GET/POST/PATCH─▶ /v1/<app>/rt_learners | rt_lesson_progress | rt_quiz_attempts   (Bearer <learner JWT>)
```

| Table | One row per | Purpose |
|---|---|---|
| `rt_learners` | learner | display name, chosen track, goal, target date, streak, last seen |
| `rt_lesson_progress` | lesson a learner finished | unique on `(user_id, lesson_id)`, so marking twice is harmless |
| `rt_quiz_attempts` | answered self-check question | chosen option, correctness, attempt time |

Each table has RLS enabled with user isolation on `user_id` plus a `BEFORE INSERT` trigger
that fills it from the authenticated identity, so a client cannot write a row owned by
somebody else. Anonymous callers read nothing and write nothing.

> **The app is shared with the `herfield` studio product**, which is why learner tables are
> namespaced `rt_` and why nothing here alters the studio's tables, policies or functions.

### Runbook

```bash
python butterbase/tools/learner_schema.py           # dry run: print the planned DDL
python butterbase/tools/learner_schema.py --apply   # create tables + RLS (additive, idempotent)
python butterbase/tools/learner_schema.py --check   # show tables, indexes and policies
python butterbase/tools/test_learner_rls.py         # prove per-learner isolation
node   butterbase/tools/test_account_e2e.mjs        # prove sync across devices and accounts
node   butterbase/tools/check_roadmap_render.mjs    # prove the roadmap panel renders offline (tracks + personal path)
node   butterbase/tools/check_learning_path.mjs     # prove every survey answer gives a sound learning path
node   butterbase/tools/check_inline_js.mjs         # syntax-check the page's inline JS
```

`learner_schema.py` merges the learner tables into the schema it reads back before
applying, so the declarative diff can only add. Both network tests are self-cleaning: they
delete whatever they wrote and fail loudly if a row cannot be removed. The `check_*`
scripts need no network and no account: they run the page's own inline script against a
minimal DOM, which is also how a broken roadmap template gets caught before it ships.

**Auth rate limits matter when testing:** 5 signups and 10 logins per 15 minutes. Both
tests therefore reuse two accounts (their throwaway passphrase is kept in
`~/.butterbase/`, never in the repo) and wait out a reported reset instead of retrying hard.

### Behaviour the page guarantees

- **Signed out** — progress and roadmap live in `localStorage`; nothing is sent anywhere.
- **Signing in** — local state is merged up (union), not replaced: a lesson finished before
  signing in stays finished, and one finished on another device is pulled down.
- **Token expiry** — a 401 triggers one refresh and a replay; if that fails the panel says so
  and the browser copy is kept.
- **Local file** — opened from `file://` the origin is `null`, which the auth API does not
  allow, so the panel explains that signing in needs the hosted page and keeps saving locally.

The hosted page is <https://olivistart.com/RecSysTutor/>, an origin already allowed for both
the auth and data APIs.

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

Learner accounts add no provider cost: they are auth records plus a few rows per learner in
the app's own Postgres, and the auth service's own rate limits bound abuse.
