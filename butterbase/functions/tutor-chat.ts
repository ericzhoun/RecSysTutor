// RecSysTutor chat function for Butterbase (Deno runtime).
// Grounds every answer in the `recsys-course` RAG collection, then calls the
// app's AI gateway. Deployed via deploy_function with an http trigger (auth: none).

const COLLECTION = "recsys-course";

// Fallback retrieval: lexical scoring over the published course markdown.
// Used when the native RAG query is unavailable (e.g. embeddings not yet billed).
const DOCS = [
  "00-overview.md", "m0-orientation.md", "m1-the-funnel-and-its-foundations.md",
  "m2-candidate-generation-retrieval.md", "m3-ranking-feature-interaction.md",
  "m4-sequential-generative-recommenders.md", "m5-multi-task-learning.md",
  "m6-case-study-twitter-s-recommender.md", "m7-practical-toolkit-capstone.md",
  "m8-paper-atlas-the-ads-recsys-collection.md", "papers-atlas.md",
];

async function lexicalRetrieve(base: string, query: string, topN = 4) {
  const terms = (query.toLowerCase().match(/[a-z0-9][a-z0-9-]{2,}/g) ?? []).slice(0, 12);
  const texts = await Promise.all(DOCS.map(async (f) => {
    try {
      const r = await fetch(base + f);
      return r.ok ? await r.text() : "";
    } catch {
      return "";
    }
  }));
  const scored: any[] = [];
  texts.forEach((t, i) => {
    if (!t) return;
    for (const part of t.split(/\n(?=#{2,3} )/)) {
      const low = part.toLowerCase();
      let s = 0;
      for (const term of terms) {
        const c = low.split(term).length - 1;
        if (c) s += Math.min(c, 6);
      }
      if (s > 0) scored.push({ text: part.slice(0, 1600), score: s, metadata: { module: DOCS[i].replace(/\.md$/, "") } });
    }
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topN);
}

const SYSTEM_PROMPT = `You are RecSysTutor, a patient expert tutor for machine-learning engineers learning recommender systems.

Rules:
- Prefer the provided COURSE CONTEXT. When you use it, cite the source module in brackets, e.g. (m2 candidate generation).
- If the context does not cover something, say so in one clause and then answer from general recommender-systems knowledge, clearly marked as "beyond the notes".
- Be concise and technical: short paragraphs or bullets, plain-text formulas, no filler. Prefer concrete mechanisms, numbers and trade-offs.
- When a learner seems stuck, point them at a specific lesson, exercise, or paper in the course.
- Never invent citations. If unsure, say so.`;

function cors(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

export default async function handler(req: Request, ctx: any): Promise<Response> {
  const json = (obj: unknown, status = 200) =>
    new Response(JSON.stringify(obj), {
      status,
      headers: { "Content-Type": "application/json", ...cors() },
    });

  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors() });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

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

  const api: string = getEnv("BUTTERBASE_API_URL") || "https://api.butterbase.ai";
  const app: string = getEnv("BUTTERBASE_APP_ID");
  const key: string = getEnv("BB_SERVICE_KEY") || getEnv("BUTTERBASE_API_KEY");
  if (!app || !key) return json({ error: "missing_platform_env", have: Object.keys(env).sort(), api }, 500);
  const auth = "Bearer " + key;
  const H = { Authorization: auth, "Content-Type": "application/json" };

  let payload: any = {};
  try {
    payload = await req.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const message = String(payload?.message ?? "").slice(0, 2000).trim();
  if (!message) return json({ error: "message_required" }, 400);
  const history: any[] = Array.isArray(payload?.history) ? payload.history.slice(-8) : [];

  let ragErr: string | null = null;
  // 1) retrieve grounded context from the course knowledge base
  let chunks: any[] = [];
  let ragStatus = 0, ragBody = "";
  try {
    const r = await fetch(`${api}/v1/${app}/rag/collections/${COLLECTION}/query`, {
      method: "POST",
      headers: H,
      body: JSON.stringify({ query: message, top_k: 6, threshold: 0.1 }),
    });
    ragStatus = r.status;
    const body = await r.text();
    ragBody = body.slice(0, 600);
    if (r.ok) chunks = (JSON.parse(body)?.chunks ?? []).map((c: any) => ({ ...c, text: c.content ?? c.text }));
  } catch (e) {
    ragErr = String(e);
    console.error("rag query failed", String(e));
  }

  let retrievalMode = "rag";
  if (!chunks.length) {
    const base = getEnv("COURSE_CONTENT_BASE") || "https://olivistart.com/RecSysTutor/deeptutor/content/";
    chunks = await lexicalRetrieve(base, message).catch(() => []);
    retrievalMode = "lexical";
  }

  const context = chunks
    .map((c, i) => {
      const src = c?.metadata?.module ?? c?.metadata?.filename ?? "notes";
      const sim = c?.score != null ? `, sim ${Number(c.score).toFixed(2)}` : "";
      return `[${i + 1}] (${src}${sim})\n${String(c?.text ?? "").trim()}`;
    })
    .join("\n\n")
    .slice(0, 12000);

  // 2) compose the conversation
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

  // 3) generate — prefer the app AI gateway, fall back to a direct provider call
  //    (the gateway needs a funded balance; BYOK alone does not bypass that)
  const genGateway = async (m: string) => {
    const r = await fetch(`${api}/v1/${app}/chat/completions`, {
      method: "POST", headers: H,
      body: JSON.stringify({ model: m, messages, max_tokens: 900, temperature: 0.25 }),
    });
    return { ok: r.ok, status: r.status, body: await r.json().catch(() => null) };
  };
  const genDirect = async (m: string) => {
    const base = getEnv("OPENAI_BASE_URL") || "https://api.openai.com/v1";
    const k = getEnv("OPENAI_API_KEY");
    if (!k) return { ok: false, status: 0, body: { error: "no_direct_key" } };
    const r = await fetch(`${base}/chat/completions`, {
      method: "POST", headers: { Authorization: "Bearer " + k, "Content-Type": "application/json" },
      body: JSON.stringify(Object.assign({ model: m, messages, max_tokens: 2400, temperature: 0.25 },
        base.includes("bigmodel") ? { thinking: { type: "disabled" } } : {})),
    });
    return { ok: r.ok, status: r.status, body: await r.json().catch(() => null) };
  };

  // primary: the provider configured in .env (OpenAI-compatible); fallback: Butterbase gateway
  const directModel = getEnv("TUTOR_MODEL") || "glm-5.2";
  const gatewayModel = getEnv("GATEWAY_MODEL") || "openai/gpt-4.1-mini";
  let mode = "direct";
  let model = directModel;
  let res;
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
  if (!res.ok) {
    const kind = mode === "gateway" ? "ai_gateway_error" : "provider_error";
    return json({ error: kind, status: res.status, detail: res.body }, 502);
  }

  if (payload?.debug) {
    return json({
      api, haveApp: !!app, haveEnvKey: !!key,
      ragStatus, ragBody, ragErr, chunkCount: chunks.length, contextChars: context.length,
      llm: { mode, model, status: res.status, ok: res.ok, body: JSON.stringify(res.body).slice(0, 900) },
    });
  }

  const answer: string = res.body?.choices?.[0]?.message?.content ?? "";
  const sources = chunks
    .map((c) => ({
      module: c?.metadata?.module ?? null,
      file: c?.metadata?.filename ?? null,
      similarity: c?.score != null ? Number(Number(c.score).toFixed(3)) : null,
    }))
    .filter((s, i, a) => a.findIndex((x) => x.file === s.file && x.similarity === s.similarity) === i);

  return json({ answer, sources, model, mode, retrieval: retrievalMode, grounded: chunks.length > 0 }, 200);
}
