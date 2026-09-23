#!/usr/bin/env python3
"""Export the RecSysTutor course into DeepTutor-ingestible Markdown.

Usage (uses the DeepTutor venv which ships lxml):
    <deeptutor-venv>/bin/python export_kb.py <course_dir> <knowledge_graph.json> <out_dir>

Produces one Markdown file per module (lesson prose + exercises + quiz bank),
an overview, and a paper-atlas file built from the ads knowledge graph.
"""
import json, re, sys, pathlib
from lxml import html as LH

COURSE = pathlib.Path(sys.argv[1]).resolve()
GRAPH = pathlib.Path(sys.argv[2]).resolve()
OUT = pathlib.Path(sys.argv[3]).resolve()
OUT.mkdir(parents=True, exist_ok=True)

src = (COURSE / "index.html").read_text(encoding="utf-8")
tree = LH.fromstring(src)

DROP_TAGS = {"script", "style", "svg", "nav", "aside", "header", "button", "input", "select", "option"}


def md_inline(el):
    out = []
    if el.text:
        out.append(el.text)
    for ch in el:
        cls = (ch.get("class") or "").split()
        if ch.tag in DROP_TAGS:
            pass
        elif ch.tag == "span" and "n" in cls:
            pass  # lesson number
        elif ch.tag in ("strong", "b"):
            out.append("**" + md_inline(ch).strip() + "**")
        elif ch.tag in ("em", "i"):
            out.append("*" + md_inline(ch).strip() + "*")
        elif ch.tag == "code":
            out.append("`" + md_inline(ch).strip() + "`")
        elif ch.tag == "br":
            out.append("\n")
        else:
            out.append(md_inline(ch))
        if ch.tail:
            out.append(ch.tail)
    return "".join(out)


def math_text(el):
    """Render MathML back to a readable plain-text form for the knowledge base."""
    t = el.tag
    if t in ("math", "mrow", "mstyle", "semantics"):
        return " ".join(math_text(c) for c in el)
    if t in ("mi", "mn", "mo", "mtext"):
        return (el.text or "").strip()
    if t == "msub":
        return math_text(el[0]) + "_" + math_text(el[1])
    if t == "msup":
        return math_text(el[0]) + "^" + math_text(el[1])
    if t == "msubsup":
        return math_text(el[0]) + "_" + math_text(el[1]) + "^" + math_text(el[2])
    if t == "mfrac":
        return "(" + math_text(el[0]) + ") / (" + math_text(el[1]) + ")"
    if t == "munder":
        return math_text(el[0]) + "_" + math_text(el[1])
    if t == "mover":
        return math_text(el[0]) + "^"
    if t == "msqrt":
        return "sqrt(" + " ".join(math_text(c) for c in el) + ")"
    if t == "mspace":
        return " "
    return " ".join(math_text(c) for c in el) if len(el) else (el.text or "")


def formula_text(el):
    parts = []
    for ch in el.iterchildren():
        cls = (ch.get("class") or "").split()
        if ch.tag == "math":
            txt = re.sub(r"\s+", " ", math_text(ch)).strip()
            txt = re.sub(r"\s+([,)\]}])", r"\1", txt)
            txt = re.sub(r"([([{])\s+", r"\1", txt)
            parts.append(txt)
        elif "fnote" in cls:
            parts.append("(" + md_inline(ch).strip() + ")")
    return "  ".join(p for p in parts if p.strip())


def md_block(el, lines):
    tag = el.tag
    cls = (el.get("class") or "").split()
    if tag in DROP_TAGS or "widget" in cls or "landscape" in cls or "toc" in cls or "side-search" in cls:
        return
    if tag in ("h1", "h2", "h3", "h4", "h5"):
        lvl = {"h1": "#", "h2": "##", "h3": "###", "h4": "####", "h5": "#####"}[tag]
        t = md_inline(el).strip()
        if t:
            lines += ["", lvl + " " + t, ""]
    elif tag == "p":
        t = md_inline(el).strip()
        if t:
            lines += ["", t]
    elif tag in ("ul", "ol"):
        for i, li in enumerate(el.iterchildren("li")):
            lines.append((f"{i+1}. " if tag == "ol" else "- ") + md_inline(li).strip())
        lines.append("")
    elif tag == "table":
        rows = []
        for tr in el.iter("tr"):
            cells = [md_inline(td).strip().replace("\n", " ") for td in tr.iterchildren("th", "td")]
            if cells:
                rows.append(cells)
        if rows:
            lines += ["", "| " + " | ".join(rows[0]) + " |", "|" + "---|" * len(rows[0])]
            for r in rows[1:]:
                lines.append("| " + " | ".join(r) + " |")
            lines.append("")
    elif tag == "pre":
        lines += ["", "```", el.text_content().rstrip(), "```", ""]
    elif tag == "details":
        summ = el.find("summary")
        lines += ["", "**" + (md_inline(summ).strip() if summ is not None else "Details") + "**"]
        for ch in el.iterchildren():
            if ch.tag != "summary":
                md_block(ch, lines)
    elif tag == "hr":
        lines += ["", "---", ""]
    elif tag == "div":
        if "formula" in cls:
            txt = formula_text(el)
            if txt:
                lines += ["", "```", txt, "```", ""]
        elif "note" in cls:
            lines += ["", "> " + md_inline(el).strip(), ""]
        else:
            for ch in el.iterchildren():
                md_block(ch, lines)
    else:
        for ch in el.iterchildren():
            md_block(ch, lines)


def unq(s):
    try:
        return json.loads('"' + s + '"')
    except Exception:
        return s


def quiz_bank(src):
    m = re.search(r"var QUIZ = \{(.*?)\n  \};", src, re.S)
    if not m:
        return {}
    body = m.group(1)
    parts = re.split(r"\n    (m\d+):\[", body)
    banks = {}
    for i in range(1, len(parts), 2):
        mid, chunk = parts[i], parts[i + 1]
        qs = []
        for qm in re.finditer(r'\{q:"((?:[^"\\]|\\.)*)",\s*o:\[(.*?)\],a:(\d),\s*e:"((?:[^"\\]|\\.)*)"\}', chunk, re.S):
            q = unq(qm.group(1))
            opts = [unq(x) for x in re.findall(r'"((?:[^"\\]|\\.)*)"', qm.group(2))]
            a = int(qm.group(3))
            e = unq(qm.group(4))
            qs.append((q, opts, a, e))
        banks[mid] = qs
    return banks


def clean(s):
    s = re.sub(r"\n{3,}", "\n\n", s)
    return s.strip() + "\n"


banks = quiz_bank(src)
titles = {}

# ---- per-module files ----
for sec in tree.xpath("//section[contains(@class,'module')]"):
    mid = sec.get("id", "m?")
    head = sec.xpath(".//div[contains(@class,'module-head')]/h2")
    title = md_inline(head[0]).strip() if head else mid
    titles[mid] = title
    lines = []
    for el in sec.iterchildren():
        md_block(el, lines)
    md = clean("\n".join(lines))
    md = f"# Module {mid} — {title}\n\n" + md
    qs = banks.get(mid.upper().lower(), []) or banks.get(mid, [])
    if qs:
        md += "\n\n## Quiz bank\n\n"
        for i, (q, opts, a, e) in enumerate(qs, 1):
            md += f"**Q{i}. {q}**\n\n"
            for j, o in enumerate(opts):
                tag = "  _(correct)_" if j == a else ""
                md += f"- {o}{tag}\n"
            md += f"\n_Answer: {opts[a]}. {e}_\n\n"
    (OUT / f"{mid}-{re.sub(r'[^a-z0-9]+','-',title.lower()).strip('-')}.md").write_text(md, encoding="utf-8")
    print(f"wrote {mid} ({len(md)} bytes, {len(qs)} quiz Q)")

# ---- overview ----
ov = ["# RecSysTutor — course overview", "",
      "An interactive course on recommender systems for machine-learning engineers, assembled from the "
      "“Be a happy and strong coder” blog archive and the Awesome-Deep-Learning-Papers ads knowledge graph.", "",
      "## Structure", ""]
for mid in sorted(titles):
    ov.append(f"- **{mid}** — {titles[mid]}")
ov += ["", "## How to study with DeepTutor", "",
       "Ask for explanations grounded in these notes, request quizzes per module, or ask for a study path:",
       "```bash",
       'deeptutor chat --kb recsys-course -t rag',
       'deeptutor run deep_question "Module 2 candidate generation" --kb recsys-course --config num_questions=5',
       'deeptutor run mastery_path "recommender systems, beginner to HSTU" --kb recsys-course',
       "```"]
(OUT / "00-overview.md").write_text(clean("\n".join(ov)), encoding="utf-8")

# ---- paper atlas from graph ----
g = json.loads(GRAPH.read_text(encoding="utf-8"))
nodes = {n["id"]: n for n in g["nodes"]}
papers = [n for n in g["nodes"] if n.get("type") == "paper"]
stages = {n["id"].split(":", 1)[1]: n["label"] for n in g["nodes"] if n.get("type") == "stage"}
themes = {n["id"].split(":", 1)[1]: n["label"] for n in g["nodes"] if n.get("type") == "theme"}
by_stage = {}
for p in papers:
    by_stage.setdefault(p.get("stage"), []).append(p)
lines = ["# Ads & recommender-systems paper atlas", "",
         f"{len(papers)} papers curated in the companion repository "
         "Awesome-Deep-Learning-Papers-for-Search-Recommendation-Advertising.", "",
         "Paper PDFs are hosted in that repository; links are included per paper.", ""]
for st in sorted(by_stage, key=lambda k: -len(by_stage[k])):
    lines.append(f"## {stages.get(st, st)}")
    lines.append("")
    for p in sorted(by_stage[st], key=lambda x: (x.get("year") or 0)):
        th = ", ".join(themes.get(t, t) for t in (p.get("themes") or []))
        meta = " · ".join(x for x in [str(p.get("year") or ""), p.get("venue") or "", p.get("company") or ""] if x)
        lines.append(f"- **{p.get('label') or p.get('title')}** ({meta}) — {p.get('note') or ''}"
                     + (f" _Themes: {th}._" if th else ""))
        if p.get("url"):
            lines.append(f"  - PDF: {p['url']}")
    lines.append("")
lin = [e for e in g["edges"] if e.get("r") == "lineage"]
if lin:
    lines.append("## Curated lineage chains (“builds on”)")
    lines.append("")
    for e in lin:
        a = nodes.get(e["s"], {}).get("label", e["s"])
        b = nodes.get(e["t"], {}).get("label", e["t"])
        lines.append(f"- {a} → {b}" + (f" — {e.get('label')}" if e.get("label") else ""))
(OUT / "papers-atlas.md").write_text(clean("\n".join(lines)), encoding="utf-8")
print(f"wrote papers-atlas.md ({len(papers)} papers)")
print("OUT:", OUT)
