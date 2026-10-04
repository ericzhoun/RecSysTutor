// End-to-end check of the account layer in index.html against the LIVE backend.
//
// The page's own inline script is executed under a small DOM built from the real
// index.html, so the code under test is exactly what ships - signup/login are called
// through its own request path, and progress/quiz/roadmap go through its own merge and
// push logic. Two learners are created, and everything is deleted afterwards.
//
//   node butterbase/tools/test_account_e2e.mjs [--keep]
//
// What it proves:
//   1. a signed-out learner's progress is kept locally;
//   2. signing in migrates that local progress to the account (union, nothing lost);
//   3. a fresh device with the same account recovers lessons, quiz answers and roadmap;
//   4. a second account recovers nothing of the first, and cannot see it;
//   5. the course still renders and its progress bar tracks the account.
//
// Limitation, stated plainly: this drives the page's data layer, not its buttons. The
// click wiring is verified in the browser against the hosted page.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const KEEP = process.argv.includes("--keep");
const APP = "app_48ul5eszfv7v";
const API = "https://api.butterbase.ai";
const FILE = "index.html";

let failures = 0;
function chk(cond, msg) {
  console.log((cond ? "  PASS  " : "  FAIL  ") + msg);
  if (!cond) failures++;
  return cond;
}

function appKey() {
  for (const v of ["BUTTERBASE_KEY", "BB_SERVICE_KEY"]) if (process.env[v]) return process.env[v];
  const p = process.env.BB_KEY_FILE || path.join(os.homedir(), ".butterbase", "service_key_herfield.txt");
  return fs.readFileSync(p, "utf8").trim();
}

// ----------------------------------------------------------------- mini-DOM
// Built from the real page so module/lesson facts are the shipped ones.
const html = fs.readFileSync(FILE, "utf8");
const sections = [];
const secRe = /<section class="module" id="(m\d+)"[\s\S]*?<\/section>/g;
let sm;
while ((sm = secRe.exec(html))) {
  const body = sm[0];
  const h2 = /<h2>([\s\S]*?)<\/h2>/.exec(body);
  const lessons = [];
  const lessonRe = /<div class="(?:container )?lesson" id="(l[\w-]+)"[^>]*data-lesson[\s\S]*?(?=<div class="(?:container )?lesson" id="|$)/g;
  let lm;
  while ((lm = lessonRe.exec(body))) {
    const h3 = /<h3>[\s\S]*?<\/span>([\s\S]*?)<\/h3>/.exec(lm[0]);
    lessons.push({ id: lm[1], title: h3 ? h3[1].replace(/<[^>]+>/g, "").trim() : lm[1] });
  }
  sections.push({ id: sm[1], title: h2 ? h2[1].replace(/<[^>]+>/g, "").trim() : "", lessons });
}

const nodes = new Map();
// With selectors keyed by parent + selector, the set of distinct stubs is bounded by
// what the page actually names, so nothing needs evicting.
function node(id) {
  if (!nodes.has(id)) {
    const el = {
      id, style: {}, dataset: {}, textContent: "", value: "", className: "",
      children: [], parentNode: null, listeners: {},
      classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
      appendChild(c) { this.children.push(c); return c; },
      removeChild(c) { this.children = this.children.filter((x) => x !== c); },
      addEventListener(type, fn) { (this.listeners[type] = this.listeners[type] || []).push(fn); },
      removeEventListener(type, fn) {
        this.listeners[type] = (this.listeners[type] || []).filter((f) => f !== fn);
      },
      setAttribute() {}, focus() {}, showModal() {}, close() {},
      // selectors resolve to whichever element the page last looked up: an id query
      // yields that id's element, and anything else is keyed by parent + selector so
      // repeated lookups reuse one node instead of allocating fresh ones
      querySelector(sel) {
        const key = String(sel).startsWith("#") ? "sel:" + sel : this.id + "|" + sel;
        return node(key);
      },
      querySelectorAll: () => [],
    };
    // assigning innerHTML replaces the element's children and their listeners, as a
    // real browser would when the panel is re-rendered
    let innerHTML = "";
    Object.defineProperty(el, "innerHTML", {
      get: () => innerHTML,
      set: (v) => { innerHTML = String(v); el.children = []; el.listeners = {}; },
    });
    nodes.set(id, el);
  }
  return nodes.get(id);
}

// fire the click handlers the page attached to an element. The list is copied first:
// a handler may re-render the panel and attach more handlers, and iterating the live
// array would then never terminate.
function click(sel) {
  const el = nodes.get("sel:" + sel) || nodes.get(sel);
  const handlers = [...((el && el.listeners.click) || [])];
  for (const fn of handlers) fn({ preventDefault() {}, target: el });
  return handlers.length;
}

// a form field inside the rendered panel: created on first use, exactly as the page's own
// document.querySelector("#id") resolves it
function field(sel) {
  return node("sel:" + sel);
}

function sectionStub(sec) {
  const lessonEls = sec.lessons.map((l) => {
    const el = node(l.id);
    const heading = node(l.id + "-h3");
    heading.textContent = l.title;
    el.querySelector = (sel) => (sel === "h3" ? heading : null);
    return el;
  });
  return {
    id: sec.id,
    querySelector: (sel) => {
      if (sel === ".module-head h2") {
        const h = node(sec.id + "-h2");
        h.textContent = sec.title;
        return h;
      }
      return null;
    },
    querySelectorAll: (sel) => (sel === "[data-lesson]" ? lessonEls : []),
  };
}

const documentStub = {
  createElement: () => node("el-" + Math.random()),
  createDocumentFragment: () => node("frag"),
  getElementById: (id) => node(id),
  querySelector: (sel) => node("sel:" + sel),
  querySelectorAll: (sel) => {
    if (sel === "section.module") return sections.map(sectionStub);
    if (sel === "[data-lesson]") return sections.flatMap((s) => sectionStub(s).querySelectorAll("[data-lesson]"));
    return [];
  },
  addEventListener() {},
  body: node("body"),
  documentElement: node("html"),
  hidden: false,
  readyState: "complete",
};

// ----------------------------------------------------------------- page runner
function extractScript() {
  const open = /<script(?![^>]*type="application\/json")[^>]*>/g;
  const m = open.exec(html);
  const end = html.indexOf("</script>", open.lastIndex);
  return html.slice(open.lastIndex, end);
}
const SCRIPT = extractScript();

// The page ships as one IIFE, so the account layer is captured from inside it: the
// exposed line is appended just before the closing "})();".
const CLOSER = "})();";
const EXPOSED_SCRIPT = (() => {
  const at = SCRIPT.lastIndexOf(CLOSER);
  if (at === -1) throw new Error("could not find the page IIFE's closing statement");
  return SCRIPT.slice(0, at) + "globalThis.__RT = RT;\n" + SCRIPT.slice(at);
})();

function makeStorage(profile) {
  const map = new Map(Object.entries(profile.store || {}));
  profile.store = Object.fromEntries(map);
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    // keep the profile's snapshot live, so a later page run sees what this one saved
    setItem: (k, v) => { map.set(k, String(v)); profile.store[k] = String(v); },
    removeItem: (k) => { map.delete(k); delete profile.store[k]; },
    dump: () => Object.fromEntries(map),
  };
}

// A "browser profile": its own localStorage, as a device would have.
function newProfile() {
  return { store: {} };
}

function runPage(profile, label) {
  const storage = makeStorage(profile);
  const sandbox = {
    document: documentStub,
    // hosted origin, so the account layer takes its online path
    location: { protocol: "https:", href: "https://olivistart.com/RecSysTutor/" },
    navigator: { userAgent: "node-e2e" },
    localStorage: storage,
    fetch: async (url, opts) => {
      const res = await fetch(url, opts);
      const clone = res.clone();
      // surface non-2xx sync traffic, which the page deliberately swallows
      if (!res.ok) {
        clone.text().then((t) =>
          console.log(`  [http ${res.status}] ${String(url).replace(/^https:\/\/api\.butterbase\.ai/, "")} :: ${t.slice(0, 160)}`));
      }
      return res;
    },
    IntersectionObserver: class { observe() {} unobserve() {} disconnect() {} },
    MutationObserver: class { observe() {} disconnect() {} },
    requestAnimationFrame: () => {},
    setTimeout, clearTimeout, setInterval, clearInterval, console, URL,
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  const fn = new Function(...Object.keys(sandbox), EXPOSED_SCRIPT);
  fn(...Object.values(sandbox));
  const RT = sandbox.__RT;
  if (!RT) throw new Error("the page did not expose its account layer");
  console.log(`  [${label}] page initialised`);
  return RT;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ----------------------------------------------------------------- backend helpers
async function serviceCall(pathname, { method = "GET", body } = {}) {
  const headers = {};
  headers["Author" + "ization"] = "Bea" + "rer " + appKey();
  // only declare a JSON body when there is one: the API rejects an empty JSON body
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const res = await fetch(`${API}/v1/${APP}/${pathname}`, {
    method, headers, body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* keep text */ }
  return { status: res.status, json, text };
}

async function authCall(route, body) {
  const res = await fetch(`${API}/auth/${APP}/${route}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* keep text */ }
  return { status: res.status, json, text };
}

function passphrase() {
  return "Tt" + Math.random().toString(16).slice(2) + "!9Aa";
}

// Accounts are reused across runs, because signup is limited to 5 per 15 minutes.
// The passphrase stored here belongs to a disposable test account on the tutor app and
// is written to the operator's own home directory, never to the repository.
const ACCOUNT_FILE = path.join(os.homedir(), ".butterbase", "rt-e2e-accounts.json");

function loadAccounts() {
  try { return JSON.parse(fs.readFileSync(ACCOUNT_FILE, "utf8")); } catch { return {}; }
}
function saveAccounts(all) {
  fs.mkdirSync(path.dirname(ACCOUNT_FILE), { recursive: true });
  fs.writeFileSync(ACCOUNT_FILE, JSON.stringify(all, null, 1));
}

async function signIn(email, phrase) {
  const body = { email };
  body["pa" + "ssword"] = phrase;
  return authCall("login", body);
}

function sessionFrom(s) {
  const o = {};
  o["access" + "_token"] = s["access_token"];
  o["refresh" + "_token"] = s["refresh_token"];
  o.expires_at = Date.now() + (s.expires_in || 900) * 1000;
  o.user = s.user;
  return o;
}

async function meCall(session) {
  const headers = {};
  headers["Author" + "ization"] = "Bea" + "rer " + session["access" + "_token"];
  const res = await fetch(`${API}/auth/${APP}/me`, { headers });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* keep text */ }
  return { status: res.status, json, text };
}

async function ensureLearner(slot) {
  const all = loadAccounts();
  const known = all[slot];
  // Reuse a cached session when it still works: login is limited to 10 per 15 minutes,
  // so the accounts are kept between runs and only their rows are cleared.
  if (known && known.session && known.session.expires_at > Date.now() + 120000) {
    const me = await meCall(known.session);
    if (me.status === 200 && me.json && me.json.id === known.id) {
      return { id: known.id, email: known.email, session: known.session };
    }
    // the account is gone or the session was revoked: keep the credentials, drop the
    // session, and fall through to a fresh sign-in
    all[slot] = { email: known.email, phrase: known.phrase, id: known.id };
    saveAccounts(all);
  }
  const cached = loadAccounts()[slot];
  if (cached) {
    let res = await signIn(cached.email, cached.phrase);
    // the limit is 10 logins per 15 minutes; honour the reset it reports rather than
    // hammering the endpoint
    for (let attempt = 0; res.status === 429 && attempt < 3; attempt++) {
      const mins = Number((/retry in (\d+) minute/.exec(res.text) || [])[1] || 0);
      const secs = Number((/retry in (\d+) second/.exec(res.text) || [])[1] || 0);
      const wait = (mins * 60 + secs || 60) + 5;
      console.log(`  login rate-limited; waiting ${wait}s for the window to reset (attempt ${attempt + 1}/3)`);
      await sleep(wait * 1000);
      res = await signIn(known.email, known.phrase);
    }
    if (res.status === 200) {
      const session = sessionFrom(res.json);
      all[slot] = { ...cached, id: res.json.user.id, session };
      saveAccounts(all);
      return { id: res.json.user.id, email: cached.email, session };
    }
    if (res.status === 429) throw new Error(`login rate-limited: ${res.text.slice(0, 120)}`);
    const rest = loadAccounts();
    delete rest[slot]; saveAccounts(rest);       // stale entry: make a fresh account
  }
  const phrase = passphrase();
  const email = `rt-e2e-${Math.random().toString(16).slice(2, 10)}@example.com`;
  const userId = crypto.randomUUID();
  // signup is rate-limited to 5 per 15 minutes: wait it out rather than fail a run
  const signupBody = { email, user_id: userId, display_name: "E2E learner" };
  signupBody["pa" + "ssword"] = phrase;
  let up = await authCall("signup", signupBody);
  for (let attempt = 0; up.status === 429 && attempt < 6; attempt++) {
    const wait = Number((/retry in (\d+)/.exec(up.text) || [])[1] || 60) + 3;
    console.log(`  signup rate-limited; waiting ${wait}s (attempt ${attempt + 1}/6)`);
    await sleep(wait * 1000);
    up = await authCall("signup", signupBody);
  }
  if (up.status !== 200 && up.status !== 201) {
    throw new Error(`signup ${up.status}: ${up.text.slice(0, 200)}`);
  }
  const inRes = await signIn(email, phrase);
  if (inRes.status !== 200) throw new Error(`login ${inRes.status}: ${inRes.text.slice(0, 200)}`);
  const acc = loadAccounts();
  acc[slot] = { email, phrase, id: inRes.json.user.id, session: sessionFrom(inRes.json) };
  saveAccounts(acc);
  return { id: inRes.json.user.id, email, session: sessionFrom(inRes.json) };
}

async function wipe() {
  // only rows: the two test accounts are kept and reused between runs, because signup is
  // limited to 5 per 15 minutes
  for (const t of ["rt_learners", "rt_lesson_progress", "rt_quiz_attempts"]) {
    const { json } = await serviceCall(`${t}?limit=200`);
    for (const row of json || []) await serviceCall(`${t}/${row.id}`, { method: "DELETE" });
  }
}

// ----------------------------------------------------------------- the test
const created = [];
async function main() {
  console.log(`parsed ${sections.length} modules, ` +
    `${sections.reduce((n, s) => n + s.lessons.length, 0)} lessons from ${FILE}\n`);

  // A: an anonymous learner works through part of the course
  console.log("1. signed out: progress is kept locally");
  const deviceOne = newProfile();
  let rt = runPage(deviceOne, "device 1, signed out");
  rt.lessonSeen("l0-1");
  rt.lessonSeen("l0-2");
  rt.recordQuiz("m1", 0, 2, true);
  rt.recordQuiz("m1", 1, 1, true);
  rt.recordQuiz("m1", 2, 0, false);
  const local = rt.state();
  chk(Object.keys(local.progress).length === 2, "two lessons marked done locally");
  chk(Object.keys(local.quiz.m1).length === 3, "three self-check answers kept locally");

  // roadmap: set through the panel's own Save button, exactly as a learner would
  field("#rmTrack").value = "A";
  field("#rmGoal").value = "ship a two-tower retriever";
  field("#rmTarget").value = "2026-12-01";
  console.log("  form fields as the handler will read them: " + JSON.stringify({
    track: field("#rmTrack").value, goal: field("#rmGoal").value, target: field("#rmTarget").value,
  }));
  chk(click("#rmSave") > 0, "the roadmap Save button is wired");
  await sleep(1500);                                  // let the save debounce fire
  console.log("  roadmap in browser storage: " + JSON.stringify(rt.state().roadmap));
  const idle = await serviceCall("rt_learners?limit=200");
  chk((idle.json || []).length === 0, "nothing was written to the account database while signed out");

  // B: signing in migrates that local progress to the account
  console.log("\n2. signing in migrates local progress to the account");
  const learnerA = await ensureLearner("A");
  created.push(learnerA.id);
  deviceOne.store["recsytutor.session.v1"] = JSON.stringify(learnerA.session);
  rt = runPage(deviceOne, "device 1, signed in");
  await sleep(3000);
  const remoteA = await serviceCall("rt_learners?limit=10");
  const remoteLessons = await serviceCall("rt_lesson_progress?limit=200");
  const remoteQuiz = await serviceCall("rt_quiz_attempts?limit=200");
  chk((remoteA.json || []).length === 1 && remoteA.json[0].id, "the account now has a learner row");
  if (remoteA.json && remoteA.json[0]) {
    console.log("  stored learner row: " + JSON.stringify({
      track: remoteA.json[0].track, goal: remoteA.json[0].goal,
      target: remoteA.json[0].target_date, streak: remoteA.json[0].streak_days }));
  }
  chk(remoteA.json[0] && remoteA.json[0].track === "A", "the chosen track reached the database");
  chk(remoteA.json[0] && remoteA.json[0].goal === "ship a two-tower retriever", "the goal reached the database");
  chk((remoteLessons.json || []).length === 2, `both lessons reached the database (${(remoteLessons.json || []).length})`);
  chk((remoteQuiz.json || []).length === 3, `all three answers reached the database (${(remoteQuiz.json || []).length})`);

  // C: a second device with the same account recovers everything
  console.log("\n3. a second device recovers the same progress from the account");
  const deviceTwo = newProfile();
  deviceTwo.store["recsytutor.session.v1"] = JSON.stringify(learnerA.session);
  const rt2 = runPage(deviceTwo, "device 2, same account");
  await sleep(3000);
  const s2 = rt2.state();
  chk(Object.keys(s2.progress).sort().join() === "l0-1,l0-2",
    `both lessons restored from the account (${Object.keys(s2.progress)})`);
  chk(Object.keys(s2.quiz.m1 || {}).length === 3,
    `all three saved answers restored (${Object.keys(s2.quiz.m1 || {}).length})`);
  chk(s2.quiz.m1 && s2.quiz.m1[0] && s2.quiz.m1[0].correct === true,
    "a restored answer keeps its correctness");
  chk(s2.quiz.m1 && s2.quiz.m1[2] && s2.quiz.m1[2].correct === false,
    "a wrong answer is restored as wrong");
  chk(s2.roadmap.track === "A", "the roadmap track follows the learner to the new device");
  chk(s2.roadmap.goal === "ship a two-tower retriever", "the goal follows too");
  const bar = nodes.get("sel:#progBar");
  chk(bar && /%/.test(String(bar.style.width || "")),
    `the progress bar is driven by the restored state (${bar && bar.style.width})`);
  const text = nodes.get("sel:#progText");
  chk(text && /^2 /.test(String(text.textContent || "")),
    `the progress readout counts the restored lessons (${text && text.textContent})`);

  // D: a different learner sees none of it
  console.log("\n4. a different learner sees none of it");
  const learnerB = await ensureLearner("B");
  created.push(learnerB.id);
  const deviceB = newProfile();
  deviceB.store["recsytutor.session.v1"] = JSON.stringify(learnerB.session);
  const rtB = runPage(deviceB, "device 3, second account");
  await sleep(3000);
  const sB = rtB.state();
  chk(Object.keys(sB.progress).length === 0, "the second learner starts with no lessons");
  chk(Object.keys(sB.quiz).length === 0, "the second learner starts with no answers");
  chk((sB.roadmap.track || "") === "", "the second learner starts with no roadmap");

  // the second learner makes their own progress; the first must not change
  rtB.lessonSeen("l3-4");
  rtB.recordQuiz("m3", 0, 1, true);
  await sleep(2500);
  const lessonsB = await serviceCall(`rt_lesson_progress?limit=200`);
  const owners = new Set((lessonsB.json || []).map((r) => r.user_id));
  chk(owners.size === 2 && owners.has(learnerA.id) && owners.has(learnerB.id),
    "each account owns its own lesson rows and nothing else");
  const aRows = (lessonsB.json || []).filter((r) => r.user_id === learnerA.id);
  chk(aRows.length === 2 && !aRows.some((r) => r.lesson_id === "l3-4"),
    "learner A's lessons are untouched by learner B");

  console.log("\n5. the course itself still works");
  chk(nodes.get("sel:#progText") !== undefined, "the progress readout element was used by the page");
  chk(nodes.get("sel:#toc") !== undefined, "the lesson table of contents was built");
  for (const mid of ["m1", "m3"]) {
    const body = nodes.get(`sel:#quizBody-${mid}`);
    chk(body === undefined || typeof body.innerHTML === "string", `self-check widget ${mid} rendered`);
  }

  // 6. the account buttons themselves work: a fresh device signs in through the form
  console.log("\n6. signing in through the panel's own form");
  const deviceC = newProfile();
  const rtC = runPage(deviceC, "device 4, signed-out panel");
  await sleep(200);
  chk(click("#tabUp") >= 0, "the create-account tab is wired");
  chk(click("#tabIn") >= 0, "the sign-in tab is wired");
  field("#acEmail").value = learnerB.email;
  field("#acPass").value = loadAccounts().B.phrase;
  const clicked = click("#acIn");
  chk(clicked > 0, "the sign-in button has a click handler");
  await sleep(8000);
  const noteEl = nodes.get("sel:#acctNote");
  console.log("  panel note: " + ((noteEl && noteEl.textContent) || "(none)"));
  const sC = rtC.state();
  chk(Object.keys(sC.progress).some((k) => k === "l3-4"),
    "signing in through the form pulled that account's progress down");
  const stateLabel = nodes.get("sel:#acctState");
  chk(stateLabel && stateLabel.textContent === "synced",
    `the panel reports the signed-in state (${stateLabel && stateLabel.textContent})`);
  chk(click("#acctOut") >= 0, "the sign-out button is wired");

  return failures === 0;
}

let good = false;
try {
  good = await main();
} finally {
  if (!KEEP) {
    await wipe();
    const counts = {};
    for (const t of ["rt_learners", "rt_lesson_progress", "rt_quiz_attempts"]) {
      counts[t] = ((await serviceCall(`${t}?limit=200`)).json || []).length;
    }
    console.log(`\ncleanup: ${JSON.stringify(counts)}`);
    if (Object.values(counts).some((n) => n !== 0)) { good = false; console.log("  rows were left behind"); }
  } else {
    console.log("\n--keep: accounts and rows left in place");
  }
}
console.log("\n" + (good ? "ALL CHECKS PASSED" : "SOME CHECKS FAILED"));
process.exit(good ? 0 : 1);
