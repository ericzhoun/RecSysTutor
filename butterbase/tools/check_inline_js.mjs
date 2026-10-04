// Syntax-check every inline script in the course page.
//   node butterbase/tools/check_inline_js.mjs [file]
import fs from "node:fs";

const file = process.argv[2] || "index.html";
const html = fs.readFileSync(file, "utf8");
const open = /<script(?![^>]*type="application\/json")[^>]*>/g;
const close = /<\/script>/g;
let m, n = 0, bad = 0;
while ((m = open.exec(html))) {
  close.lastIndex = open.lastIndex;
  const end = close.exec(html);
  if (!end) break;
  n++;
  const code = html.slice(open.lastIndex, end.index);
  try {
    new Function(code);
    console.log(`script ${n}: OK (${code.length} chars)`);
  } catch (e) {
    bad++;
    console.log(`script ${n}: SYNTAX ERROR — ${e.message}`);
  }
  open.lastIndex = end.index + 9;
}
console.log(`\n${n} inline script(s), ${bad} with errors`);
process.exit(bad ? 1 : 0);
