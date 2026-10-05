// Offline checks for the personalised learning path (M0 · lesson 01): the engine is
// lifted out of the page's own script and run against the page's real lesson list.
//   node butterbase/tools/check_learning_path.mjs
import fs from "node:fs";

const html = fs.readFileSync("index.html", "utf8");
const start = html.indexOf("  var PATH = (function(){");
const end = html.indexOf("  /* ================= learner accounts");
if (start < 0 || end < start) { console.log("FAIL  could not find the path engine in index.html"); process.exit(1); }
const engine = html.slice(start, end);

// every lesson on the page, with its heading, exactly as the browser would see it
const lessonRe = /<div class="(?:container )?lesson" id="(l[\w-]+)"[^>]*data-lesson[^>]*>\s*<h3>([\s\S]*?)<\/h3>/g;
const lessons = [];
let m;
while ((m = lessonRe.exec(html))) {
  const n = (/<span class="n">([^<]*)<\/span>/.exec(m[2]) || [, ""])[1];
  const text = m[2].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&");
  lessons.push({ id: m[1], h3: { textContent: text, n: { textContent: n } } });
}
const $ = (sel, root) => (sel === "h3" ? root.h3 : sel === ".n" ? root.n : null);
const PATH = new Function("$", "lessons", engine + "\nreturn PATH;")($, lessons);
const ids = new Set(lessons.map((l) => l.id));

let bad = 0;
function chk(cond, msg) { if (!cond) { bad++; console.log("  FAIL  " + msg); } return cond; }
let seenBad = 0;
function pass(msg) { if (bad === seenBad) console.log("  PASS  " + msg); seenBad = bad; }

// 1. every combination of answers yields a sound plan
const Q = PATH.QUESTIONS;
let combos = 0;
(function walk(i, a) {
  if (i === Q.length) {
    combos++;
    const p = PATH.plan(a), tag = JSON.stringify(a);
    if (!chk(p, "no plan for " + tag)) return;
    const all = p.phases.flatMap((ph) => ph.lessons);
    chk(all.length >= 8, "path too short (" + all.length + ") for " + tag);
    chk(new Set(all).size === all.length, "a lesson appears twice in " + tag);
    chk(all.every((id) => ids.has(id)), "path names a lesson missing from the page for " + tag);
    chk(p.later.every((id) => !all.includes(id)), "'save for later' overlaps the path for " + tag);
    chk(all.length + p.later.length === ids.size - 1, "path + later does not cover the course for " + tag);
    chk(p.phases.every((ph) => ph.lessons.length > 0 && ph.title && ph.why), "empty or untitled phase in " + tag);
    chk(/^[ABCD]$/.test(p.track) && p.trackName, "no recommended track for " + tag);
    chk(p.weeks >= 1 && p.hours > 0, "no time estimate for " + tag);
    chk(JSON.stringify(PATH.decode(p.code)) === JSON.stringify(a), "code does not round-trip for " + tag);
    return;
  }
  for (const o of Q[i].o) walk(i + 1, { ...a, [Q[i].k]: o[0] });
})(0, {});
pass(combos + " answer combinations each give a sound, complete, round-tripping plan");

// 2. invalid codes are rejected, so a stray roadmap value can never break the page
for (const c of ["", "A", "P1", "P1.x.y.z.a.b.c", "P2.none.research.papers.job.unsure.10", "P1.none.research.papers.job.unsure"])
  chk(PATH.decode(c) === null, "accepted invalid code " + JSON.stringify(c));
pass("malformed path codes are rejected");

// 3. no heading leaks its number badge, and shared headings are disambiguated
const titles = Object.values(PATH.title);
chk(titles.every((t) => !/^(EX|✓|\d)/.test(t)), "a lesson title still carries its badge");
chk(new Set(titles).size === titles.length, "two lessons share a title");
pass("lesson titles are clean and unique");

// 4. the two reference learners
const phd = PATH.plan(PATH.EXAMPLES.phd.a), mid = PATH.plan(PATH.EXAMPLES.mid.a);
const flat = (p) => p.phases.flatMap((ph) => ph.lessons);
chk(phd.beginner && phd.track === "A", "PhD graduate should start on track A (got " + phd.track + ")");
chk(flat(phd)[0] === "l0-2" && flat(phd).includes("l1-1"), "PhD graduate should start from the foundations");
chk(["l7-1", "l7-2", "l10-1", "l11-4"].every((id) => flat(phd).includes(id)), "PhD graduate should get the production-practice lessons");
chk(!flat(phd).includes("l4-5"), "PhD graduate should defer HSTU");
chk(!mid.beginner && mid.track === "C" && mid.then === "D", "mid-career engineer should get track C then D");
chk(mid.phases[0].mode === "skim", "mid-career engineer's first phase should be a skim");
chk(!flat(mid).includes("l1-1") && !flat(mid).includes("l2-1"), "mid-career engineer should skip the basics");
chk(["l4-3", "l4-4", "l4-5", "l5-1"].every((id) => flat(mid).includes(id)), "mid-career engineer should get SASRec to HSTU and MMoE");
pass("reference learners: PhD graduate -> track A then B; mid-career engineer -> track C then D");
console.log("    PhD graduate:  " + phd.phases.map((p) => p.title).join(" | "));
console.log("    mid-career:    " + mid.phases.map((p) => p.title).join(" | "));

console.log("\n" + (bad ? bad + " CHECK(S) FAILED" : "ALL CHECKS PASSED"));
process.exit(bad ? 1 : 0);
