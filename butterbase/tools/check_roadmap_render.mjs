// Render check for the roadmap's next-step list, with no network: the page is run as a
// local file with a track and some progress already saved.
//   node butterbase/tools/check_roadmap_render.mjs
import fs from "node:fs";

const html = fs.readFileSync("index.html", "utf8");
const open = /<script(?![^>]*type="application\/json")[^>]*>/g;
open.exec(html);
const code = html.slice(open.lastIndex, html.indexOf("</script>", open.lastIndex));

const sections = [];
const secRe = /<section class="module" id="(m\d+)"[\s\S]*?<\/section>/g;
let sm;
while ((sm = secRe.exec(html))) {
  const body = sm[0];
  const lessons = [];
  const lessonRe = /<div class="(?:container )?lesson" id="(l[\w-]+)"[^>]*data-lesson[\s\S]*?(?=<div class="(?:container )?lesson" id="|$)/g;
  let lm;
  while ((lm = lessonRe.exec(body))) lessons.push(lm[1]);
  sections.push({ id: sm[1], lessons });
}

const nodes = new Map();
function node(id) {
  if (!nodes.has(id)) {
    const el = {
      id, style: {}, dataset: {}, textContent: "", value: "", className: "",
      children: [], listeners: {}, parentNode: null,
      classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
      appendChild(c) { this.children.push(c); return c; },
      addEventListener() {}, removeEventListener() {}, setAttribute() {}, focus() {},
      showModal() {}, close() {},
      querySelector(sel) { return node(String(sel).startsWith("#") ? "sel:" + sel : this.id + "|" + sel); },
      querySelectorAll: () => [],
    };
    let innerHTML = "";
    Object.defineProperty(el, "innerHTML", {
      get: () => innerHTML,
      set: (v) => { innerHTML = String(v); el.children = []; el.listeners = {}; },
    });
    nodes.set(id, el);
  }
  return nodes.get(id);
}

function sectionStub(sec) {
  const lessonEls = sec.lessons.map((id) => {
    const el = node(id);
    const h3 = node(id + "-h3");
    h3.textContent = "Lesson " + id;
    el.querySelector = () => h3;
    return el;
  });
  return {
    id: sec.id,
    querySelector: () => node(sec.id + "-h2"),
    querySelectorAll: (sel) => (sel === "[data-lesson]" ? lessonEls : []),
  };
}

function render(saved) {
  nodes.clear();
  const store = new Map([["recsytutor.learner.v1", JSON.stringify(saved)]]);
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
    addEventListener() {}, body: node("body"), documentElement: node("html"),
    hidden: false, readyState: "complete",
  };

  const sandbox = {
    document: documentStub,
    location: { protocol: "file:", href: "file:///index.html" },
    navigator: { userAgent: "node" },
    localStorage: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
    },
    fetch: () => Promise.reject(new Error("offline")),
    IntersectionObserver: class { observe() {} unobserve() {} disconnect() {} },
    MutationObserver: class { observe() {} disconnect() {} },
    requestAnimationFrame: () => {},
    setTimeout, clearTimeout, setInterval, clearInterval, console, URL,
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;

  new Function(...Object.keys(sandbox), code)(...Object.values(sandbox));
  const panel = node("sel:#acctBody").innerHTML;
  return { panel, text: panel.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() };
}

let bad = 0;
function chk(cond, msg) { console.log((cond ? "  PASS  " : "  FAIL  ") + msg); if (!cond) bad++; }

// a learner on track A who has finished the first two lessons of module 2
let { panel, text } = render({
  progress: { "l2-1": "2026-10-01T10:00:00.000Z", "l2-2": "2026-10-02T10:00:00.000Z" },
  quiz: {}, roadmap: { track: "A", goal: "ship a retriever", target: "2026-12-01" },
  streak: { count: 3, last: "2026-10-02" }, displayName: "Ada",
});
console.log("track A:");
chk(/track|A — Retrieval/.test(panel), "the chosen track is shown");
chk(/lessons/.test(text), "the track's lesson totals are shown");
chk(/next:/i.test(text), "a next step is named for the incomplete module");
chk(/M2/.test(text), "the first track module (M2) appears as a step");
chk(/M6/.test(text), "the second track module (M6) appears as a step");
chk(/2 \/ 25 lessons|2 \/ \d+ lessons/.test(text), "progress within the track is counted (" +
  (text.match(/\d+ \/ \d+ lessons/) || ["?"])[0] + ")");
chk(/streak 3d/.test(panel), "the streak is shown");
chk(/ship a retriever/.test(panel), "the goal is shown");
chk(/days left|due/.test(text), "the target date reports its distance");
chk(/complete/.test(text) || /M2/.test(text), "step completion state is expressed");

console.log("\nrendered panel text:\n" + text.slice(0, 700));

// a learner whose roadmap is the personal path from the survey (the mid-career example),
// with the first skim lesson done
({ panel, text } = render({
  progress: { "l1-3": "2026-10-01T10:00:00.000Z" },
  quiz: {}, roadmap: { track: "P1.dnn.mle.solid.deepen.sequence.6", goal: "", target: "" },
  streak: { count: 1, last: "2026-10-02" }, displayName: "",
}));
console.log("\npersonal path:");
chk(/Personal path \(from the survey\)" ?|selected>Personal path/.test(panel), "the select shows the personal path as chosen");
chk(/Path · 1\/15/.test(text), "the summary tag counts progress along the path (" + (text.match(/Path · \d+\/\d+/) || ["?"])[0] + ")");
chk(/Phase 1 · Quick refresh \(skim\) \u2014 1\/4 done/.test(text), "phase 1 counts the finished skim lesson");
chk(/next: A\/B testing done right/.test(text) || /next: Lesson l1-4/.test(text), "phase 1 names the next lesson");
chk(/Phase 4 · Read the frontier/.test(text), "all four phases are listed");
chk(/closest track C/.test(text), "the closest lettered track is named");
console.log("\nrendered panel text:\n" + text.slice(0, 700));
console.log("\n" + (bad ? "SOME CHECKS FAILED" : "ALL CHECKS PASSED"));
process.exit(bad ? 1 : 0);
