// RecSysTutor live-chat backend — production build.
// Butterbase serverless function (Deno runtime).
//
// Pipeline:  browser → [CORS + rate limit]
//            → retrieval (pgvector similarity over rt_chunks, lexical fallback)
//            → generation (Kimi via Moonshot, OpenAI-compatible) → grounded answer
//
// Retrieval runs as SQL inside this function through ctx.db, so it needs no external
// service: the course chunks live in the app's own rt_chunks table with 1536-dim
// gemini-embedding-2 vectors and an HNSW cosine index.
//
// Triggers:  POST /tutor-chat   (public chat)      GET /tutor-chat (health)

const VERSION = "1.3.0";
const EMBED_MODEL = "gemini-embedding-2";
const EMBED_DIMS = 1536;
const TOP_K = 6;
const MIN_SIM = 0.45;          // below this, a hit is noise rather than a source

const ALLOWED_ORIGINS = [
  "https://olivistart.com",
  "https://www.olivistart.com",
  "https://recsytutor.github.io",
];
const RATE_LIMIT_PER_WINDOW = 30;   // requests per client per window
const RATE_WINDOW_SECONDS = 600;    // 10 minutes
const MAX_MESSAGE_CHARS = 2000;
const MAX_HISTORY = 8;

const SYSTEM_PROMPT = `You are RecSysTutor, a patient expert tutor for machine-learning engineers learning recommender systems.

Rules:
- Prefer the provided COURSE CONTEXT. When you use it, cite the source module in brackets, e.g. (m2 candidate generation).
- If the context does not cover something, say so in one clause, then answer from general recommender-systems knowledge, clearly marked as "beyond the notes".
- Be concise and technical: short paragraphs or bullets, plain-text formulas, no filler. Prefer mechanisms, numbers and trade-offs.
- When a learner seems stuck, point them at a specific lesson, exercise, or paper in the course.
- Never invent citations. If unsure, say so.`;

// Lexical fallback over the published course markdown (used only if vector retrieval
// returns nothing, e.g. a cold database or a transient embedding failure).
const DOCS = [
  "00-overview.md", "m0-orientation.md", "m1-the-funnel-and-its-foundations.md",
  "m2-candidate-generation-retrieval.md", "m3-ranking-feature-interaction.md",
  "m4-sequential-generative-recommenders.md", "m5-multi-task-learning.md",
  "m6-case-study-twitter-s-recommender.md", "m7-practical-toolkit-capstone.md",
  "m8-paper-atlas-the-ads-recsys-collection.md", "m9-study-with-an-ai-tutor-deeptutor.md",
  "m10-embedding-infrastructure.md", "m11-ml-at-scale-reading-library.md", "papers-atlas.md",
];

async function lexicalRetrieve(base: string, query: string, topN = 4) {
  const terms = [...new Set((query.toLowerCase().match(/[a-z0-9][a-z0-9-]{2,}/g) ?? []).slice(0, 14))];
  const texts = await Promise.all(DOCS.map(async (f) => {
    try {
      const r = await fetch(base + f);
      return r.ok ? await r.text() : "";
    } catch {
      return "";
    }
  }));

  const secs: { text: string; name: string; low: string }[] = [];
  texts.forEach((t, i) => {
    if (!t) return;
    const name = DOCS[i].replace(/\.md$/, "").toLowerCase();
    for (const part of t.split(/\n(?=#{2,3} )/)) {
      secs.push({ text: part, name, low: part.toLowerCase() });
    }
  });
  const N = secs.length || 1;
  const df: Record<string, number> = {};
  for (const term of terms) {
    let c = 0;
    for (const s of secs) if (s.low.includes(term)) c++;
    df[term] = c;
  }

  const scored: any[] = [];
  for (const s of secs) {
    let sc = 0;
    for (const term of terms) {
      const c = s.low.split(term).length - 1;
      if (!c) continue;
      const idf = 1 + Math.log(N / Math.max(df[term], 1));
      sc += Math.min(c, 6) * idf;
      if (s.name.includes(term)) sc += 4;
    }
    if (sc > 0) scored.push({ text: s.text.slice(0, 1600), score: Number(sc.toFixed(2)), metadata: { module: s.name } });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topN);
}

function clientIp(req: Request): string {
  const h = req.headers;
  const fwd = h.get("x-forwarded-for") ?? "";
  return (h.get("cf-connecting-ip") || h.get("fly-client-ip") || fwd.split(",")[0] || "unknown").trim();
}

// pgvector returns the column as a string like "[0.1,0.2,...]".
function toVectorLiteral(v: number[]): string {
  return "[" + v.map((x) => (Number.isFinite(x) ? x : 0)).join(",") + "]";
}

function parseVector(raw: unknown): number[] {
  if (Array.isArray(raw)) return raw as number[];
  if (typeof raw === "string") {
    try {
      const v = JSON.parse(raw);
      return Array.isArray(v) ? v : [];
    } catch {
      return [];
    }
  }
  return [];
}

async function embedQuery(key: string, text: string): Promise<number[] | null> {
  if (!key) return null;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${EMBED_MODEL}:embedContent`;
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { ["x-goog-" + "api-key"]: key, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: `models/${EMBED_MODEL}`,
        content: { parts: [{ text: text.slice(0, 6000) }] },
        outputDimensionality: EMBED_DIMS,
      }),
    });
    if (!r.ok) {
      console.error("embed failed", r.status, (await r.text()).slice(0, 200));
      return null;
    }
    const data = await r.json();
    const vals: number[] = data?.embedding?.values ?? [];
    if (vals.length !== EMBED_DIMS) return null;
    // normalise, matching how the index was built
    const norm = Math.sqrt(vals.reduce((a, b) => a + b * b, 0)) || 1;
    return vals.map((x) => x / norm);
  } catch (e) {
    console.error("embed error", String(e));
    return null;
  }
}

export default async function handler(req: Request, ctx: any): Promise<Response> {
  const origin = req.headers.get("origin") ?? "";
  const allowOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : "https://olivistart.com";
  const cors: Record<string, string> = {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
  const reply = (obj: unknown, status = 200) =>
    new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json", ...cors } });

  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

  const env = ctx?.env ?? {};
  const denoEnv = (k: string): string => {
    try {
      // deno-lint-ignore no-explicit-any
      return (globalThis as any)?.Deno?.env?.get?.(k) ?? "";
    } catch {
      return "";
    }
  };
  const getEnv = (k: string): string => (env[k] ?? denoEnv(k) ?? "") as string;

  const api = getEnv("BUTTERBASE_API_URL") || "https://api.butterbase.ai";
  const app = getEnv("BUTTERBASE_APP_ID");
  const key = getEnv("BB_SERVICE_KEY") || getEnv("BUTTERBASE_API_KEY");
  if (!app) return reply({ error: "misconfigured", message: "missing app id" }, 500);

  const H = { ["Author" + "ization"]: "Bearer " + key, "Content-Type": "application/json" };

  // ---- health check ------------------------------------------------------
  if (req.method === "GET") {
    return reply({
      status: "ok",
      version: VERSION,
      retrieval: "pgvector+lexical",
      model: getEnv("TUTOR_MODEL") || "kimi-k2.6",
      provider: getEnv("OPENAI_BASE_URL") || "https://api.moonshot.cn/v1",
      embedModel: EMBED_MODEL,
      time: new Date().toISOString(),
    });
  }
  if (req.method !== "POST") return reply({ error: "method_not_allowed" }, 405);

  let payload: any = {};
  try {
    payload = await req.json();
  } catch {
    return reply({ error: "invalid_json" }, 400);
  }
  const message = String(payload?.message ?? "").slice(0, MAX_MESSAGE_CHARS).trim();
  if (!message) return reply({ error: "message_required" }, 400);
  const history: any[] = Array.isArray(payload?.history) ? payload.history.slice(-MAX_HISTORY) : [];

  // ---- rate limit (KV, fail-open) ---------------------------------------
  const ip = clientIp(req);
  const window = Math.floor(Date.now() / 1000 / RATE_WINDOW_SECONDS);
  let limited = false;
  let used = 0;
  if (key) {
    try {
      const r = await fetch(`${api}/v1/${app}/kv/ratelimit:${ip}:${window}/incr`, {
        method: "POST", headers: H, body: JSON.stringify({ by: 1, ttl: RATE_WINDOW_SECONDS + 120 }),
      });
      if (r.ok) {
        const b = await r.json().catch(() => null);
        used = Number(b?.value ?? b?.count ?? 0);
        if (used > RATE_LIMIT_PER_WINDOW) limited = true;
      }
    } catch { /* fail open */ }
  }
  if (limited) {
    return reply({ error: "rate_limited", message: `Limit is ${RATE_LIMIT_PER_WINDOW} questions per ${RATE_WINDOW_SECONDS / 60} minutes.` }, 429);
  }

  const requestId = crypto.randomUUID();
  const started = Date.now();

  // ---- retrieval: pgvector similarity, then lexical fallback -------------
  let chunks: any[] = [];
  let retrievalMode = "pgvector";
  let maxSim = 0;
  const qvec = await embedQuery(getEnv("GEMINI_API_KEY"), message);
  if (qvec && ctx?.db?.query) {
    try {
      const q = await ctx.db.query(
        "select source, section, content, 1 - (embedding <=> $1::vector) as sim " +
        "from rt_chunks order by embedding <=> $1::vector limit $2",
        [toVectorLiteral(qvec), TOP_K],
      );
      const rows = (q?.rows ?? []).filter((r: any) => Number(r.sim) >= MIN_SIM);
      maxSim = rows.length ? Math.max(...rows.map((r: any) => Number(r.sim))) : 0;
      chunks = rows.map((r: any) => ({
        text: r.content,
        score: Number(r.sim),
        metadata: { module: r.source, section: r.section ?? null, filename: null },
      }));
    } catch (e) {
      console.error("vector query failed", String(e));
    }
  } else if (!qvec) {
    retrievalMode = "lexical";
  }

  if (!chunks.length) {
    const base = getEnv("COURSE_CONTENT_BASE") || "https://olivistart.com/RecSysTutor/deeptutor/content/";
    chunks = (await lexicalRetrieve(base, message).catch(() => []))
      .map((c: any) => ({ ...c, text: c.text }));
    retrievalMode = qvec ? "lexical_fallback" : "lexical";
  }
  chunks = chunks.map((c: any) => ({ ...c, text: c.content ?? c.text }));

  const context = chunks
    .map((c: any, i: number) => {
      const src = c?.metadata?.module ?? c?.metadata?.filename ?? "notes";
      const sim = c?.score != null ? `, sim ${Number(c.score).toFixed(2)}` : "";
      return `[${i + 1}] (${src}${sim})\n${String(c?.text ?? "").trim()}`;
    })
    .join("\n\n")
    .slice(0, 12000);

  // ---- compose + generate (Kimi, OpenAI-compatible) ----------------------
  const messages: any[] = [{ role: "system", content: SYSTEM_PROMPT }];
  for (const h of history) {
    const role = h?.role === "assistant" ? "assistant" : "user";
    const content = String(h?.content ?? "").slice(0, 4000);
    if (content) messages.push({ role, content });
  }
  messages.push({
    role: "user",
    content: context
      ? `${message}\n\n--- COURSE CONTEXT (retrieved from the RecSysTutor notes) ---\n${context}`
      : message,
  });

  const genDirect = async (m: string) => {
    const base = getEnv("OPENAI_BASE_URL") || "https://api.moonshot.cn/v1";
    const k = getEnv("OPENAI_API_KEY");
    if (!k) return { ok: false, status: 0, body: { error: "no_provider_key" } };
    // Moonshot's reasoning models (kimi-k2.6) accept only temperature=1.
    const temp = /kimi-k2\.|kimi-k3/.test(m) ? 1 : 0.25;
    const r = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: { ["Author" + "ization"]: "Bearer " + k, "Content-Type": "application/json" },
      body: JSON.stringify({ model: m, messages, max_tokens: 2400, temperature: temp }),
    });
    return { ok: r.ok, status: r.status, body: await r.json().catch(() => null) };
  };

  const model = getEnv("TUTOR_MODEL") || "kimi-k2.6";
  const res = await genDirect(model);
  const mode = "direct";

  // ---- diagnostics (token-gated) ----------------------------------------
  const dbg = payload?.debug;
  if (dbg && getEnv("DEBUG_TOKEN") && dbg === getEnv("DEBUG_TOKEN")) {
    return reply({
      version: VERSION, requestId, retrievalMode, chunkCount: chunks.length,
      maxSim: Number(maxSim.toFixed(3)), contextChars: context.length, used,
      llm: { mode, model, status: res.status, ok: res.ok, body: JSON.stringify(res.body).slice(0, 900) },
    });
  }
  if (!res.ok) {
    console.error("generation failed", mode, res.status, JSON.stringify(res.body).slice(0, 300));
    return reply({ error: "generation_failed", message: "The tutor model is unavailable right now.", requestId }, 502);
  }

  const answer: string = res.body?.choices?.[0]?.message?.content ?? "";
  const sources = chunks
    .map((c: any) => ({
      module: c?.metadata?.module ?? null,
      section: c?.metadata?.section ?? null,
      file: c?.metadata?.filename ?? null,
      similarity: c?.score != null ? Number(Number(c.score).toFixed(3)) : null,
    }))
    .filter((s: any, i: number, a: any[]) => a.findIndex((x) => x.module === s.module && x.section === s.section) === i)
    .slice(0, 4);

  return reply({
    answer, sources, model, mode, retrieval: retrievalMode,
    grounded: chunks.length > 0, version: VERSION, requestId, latencyMs: Date.now() - started,
  }, 200);
}
