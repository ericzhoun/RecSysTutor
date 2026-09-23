// RecSysTutor live-chat backend — production build.
// Butterbase serverless function (Deno runtime).
//
// Pipeline:  browser → [CORS + rate limit] → retrieval (native RAG, lexical fallback)
//            → generation (provider from the course .env, Butterbase gateway fallback) → grounded answer
//
// Triggers:  POST /tutor-chat   (public chat)      GET /tutor-chat (health)

const VERSION = "1.2.1";
const COLLECTION = "recsys-course";

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

// Fallback retrieval: lexical scoring over the published course markdown.
const DOCS = [
  "00-overview.md", "m0-orientation.md", "m1-the-funnel-and-its-foundations.md",
  "m2-candidate-generation-retrieval.md", "m3-ranking-feature-interaction.md",
  "m4-sequential-generative-recommenders.md", "m5-multi-task-learning.md",
  "m6-case-study-twitter-s-recommender.md", "m7-practical-toolkit-capstone.md",
  "m8-paper-atlas-the-ads-recsys-collection.md", "m9-study-with-an-ai-tutor-deeptutor.md",
  "m10-embedding-infrastructure.md", "papers-atlas.md",
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

  // split every document into sections and index them
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
      const idf = 1 + Math.log(N / Math.max(df[term], 1));   // rare terms matter more
      sc += Math.min(c, 6) * idf;
      if (s.name.includes(term)) sc += 4;                    // module-name boost
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
  const H = { Authorization: "Bearer " + key, "Content-Type": "application/json" };

  // ---- health check ------------------------------------------------------
  if (req.method === "GET") {
    return reply({
      status: "ok",
      version: VERSION,
      collection: COLLECTION,
      retrieval: "rag+lexical",
      model: getEnv("TUTOR_MODEL") || "glm-5.2",
      provider: getEnv("OPENAI_BASE_URL") || "https://api.openai.com/v1",
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

  // ---- retrieval ---------------------------------------------------------
  let chunks: any[] = [];
  let retrievalMode = "rag";
  try {
    const r = await fetch(`${api}/v1/${app}/rag/collections/${COLLECTION}/query`, {
      method: "POST", headers: H, body: JSON.stringify({ query: message, top_k: 6, threshold: 0.1 }),
    });
    if (r.ok) chunks = (await r.json())?.chunks ?? [];
  } catch (e) {
    console.error("rag query failed", String(e));
  }
  if (!chunks.length) {
    const base = getEnv("COURSE_CONTENT_BASE") || "https://olivistart.com/RecSysTutor/deeptutor/content/";
    chunks = (await lexicalRetrieve(base, message).catch(() => []))
      .map((c: any) => ({ ...c, text: c.text }));
    retrievalMode = "lexical";
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

  // ---- compose + generate -----------------------------------------------
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

  const genGateway = async (m: string) => {
    const r = await fetch(`${api}/v1/${app}/chat/completions`, {
      method: "POST", headers: H,
      body: JSON.stringify({ model: m, messages, max_tokens: 2000, temperature: 0.25 }),
    });
    return { ok: r.ok, status: r.status, body: await r.json().catch(() => null) };
  };
  const genDirect = async (m: string) => {
    const base = getEnv("OPENAI_BASE_URL") || "https://api.openai.com/v1";
    const k = getEnv("OPENAI_API_KEY");
    if (!k) return { ok: false, status: 0, body: { error: "no_provider_key" } };
    const body: any = { model: m, messages, max_tokens: 2400, temperature: 0.25 };
    if (base.includes("bigmodel")) body.thinking = { type: "disabled" };
    const r = await fetch(`${base}/chat/completions`, {
      method: "POST", headers: { Authorization: "Bearer " + k, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return { ok: r.ok, status: r.status, body: await r.json().catch(() => null) };
  };

  const directModel = getEnv("TUTOR_MODEL") || "glm-5.2";
  const gatewayModel = getEnv("GATEWAY_MODEL") || "openai/gpt-4.1-mini";
  let mode = "direct", model = directModel, res;
  if (getEnv("OPENAI_API_KEY")) {
    res = await genDirect(directModel);
    if (!res.ok) {
      const g = await genGateway(gatewayModel);
      if (g.ok) { res = g; mode = "gateway"; model = gatewayModel; }
      else console.error("gateway fallback failed", g.status, JSON.stringify(g.body).slice(0, 300));
    }
  } else {
    mode = "gateway"; model = gatewayModel;
    res = await genGateway(gatewayModel);
  }

  // ---- diagnostics (token-gated) ----------------------------------------
  const dbg = payload?.debug;
  if (dbg && getEnv("DEBUG_TOKEN") && dbg === getEnv("DEBUG_TOKEN")) {
    return reply({
      version: VERSION, requestId, retrievalMode, chunkCount: chunks.length, contextChars: context.length, used,
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
      file: c?.metadata?.filename ?? null,
      similarity: c?.score != null ? Number(Number(c.score).toFixed(3)) : null,
    }))
    .filter((s: any, i: number, a: any[]) => a.findIndex((x) => x.module === s.module && x.similarity === s.similarity) === i)
    .slice(0, 4);

  return reply({
    answer, sources, model, mode, retrieval: retrievalMode,
    grounded: chunks.length > 0, version: VERSION, requestId, latencyMs: Date.now() - started,
  }, 200);
}
