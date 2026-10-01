#!/usr/bin/env python3
"""Convert the raw Substack HTML in the reading-library corpus into house-style Markdown.

The corpus was captured in two waves:
  * 164 posts (mls-0001..0164) were converted to Markdown properly;
  * 80 posts (mls-0165..0244) were upgraded from paywall previews to full text by
    commit 831094b, but their bodies are still the raw Substack page HTML.

This script finishes that second wave. It reproduces the *same* conversion the first
wave used, which was reverse-engineered and verified byte-for-byte against the 164
already-clean documents (see tools/verify_clean.py).

House conventions (derived from the clean corpus, not invented):
  * title            : "# <title>" (kept as-is)
  * byline           : "*Machine Learning at Scale collection — Ludovico Bessi, <date> · topic: <topic>*"
  * bullets          : "  * "      (html2text body_width=0 default)   -> markdown_fmt re-parses
  * ordered          : "  1. "
  * thematic break   : "* * *"
  * code             : 4-space indented block
  * images           : "[![alt](../assets/x.png)](../assets/x.png)"  (library post)
                       "[](../assets/x.png)"                        (KB document)
  * links            : kept as markdown in the library post, flattened to plain text
                       in the KB document
  * no YAML frontmatter in the KB documents

Usage:
    python tools/clean_raw_posts.py [--check] [--only-missing]
"""
from __future__ import annotations

import argparse
import html
import pathlib
import re
import sys

try:
    import html2text
except ImportError:  # pragma: no cover
    sys.exit("pip install html2text")

REPO = pathlib.Path(__file__).resolve().parents[2]
POSTS = REPO / "ml-at-scale" / "posts"
KB = REPO / "deeptutor" / "content"

# ----------------------------------------------------------------------------------
# detection
# ----------------------------------------------------------------------------------
BODY_START = re.compile(r"<(p|h[1-6]|div|figure|ul|ol|blockquote|pre|hr|table|img)\b", re.I)
RAW_MARKERS = ('<div class="captioned-image-container"', "<p>", "</p>")


def is_raw(text: str) -> bool:
    """True when the body is still un-converted Substack HTML."""
    return sum(text.count(m) for m in RAW_MARKERS) > 3


def split_header(text: str):
    """Return (header, html_body). The header holds the title/byline, which are already
    Markdown in both waves; the HTML body starts at the first block-level tag."""
    m = BODY_START.search(text)
    if not m:
        raise ValueError("no HTML body start found")
    return text[: m.start()], text[m.start():]


# ----------------------------------------------------------------------------------
# chrome removal
# ----------------------------------------------------------------------------------
# Substack embeds device icons, share buttons and the paywall divider inside the body.
# html2text would render their aria-labels/paths as text, so drop them first.
DROP_ELEMENTS = re.compile(
    r"<(script|style|svg|button|form|input|noscript|iframe)\b.*?</\1\s*>",
    re.S | re.I,
)
SELF_CLOSING = re.compile(r"<(input|img|source|br|hr)\b[^>]*/?>(?!\s*</)", re.I)
PAYWALL_DIV = re.compile(r'<div[^>]*class="[^"]*(?:paywall-jump|paywall)[^"]*"[^>]*>\s*</div>', re.I)
# the "expand image" control lives inside figure markup but carries no content
IMAGE_CHROME = re.compile(
    r'<div[^>]*class="[^"]*(?:image-link-expand|pencraft)[^"]*"[^>]*>.*?</div>',
    re.S | re.I,
)
SUBSCRIBE_WIDGET = re.compile(
    r'<div[^>]*class="[^"]*(?:subscription-widget|subscribe-widget|post-ufi|share-dialog)[^"]*"[^>]*>.*?</div>',
    re.S | re.I,
)


def strip_chrome(body: str) -> str:
    """Remove page furniture that is not part of the post."""
    for pattern in (DROP_ELEMENTS, PAYWALL_DIV, SUBSCRIBE_WIDGET, IMAGE_CHROME):
        body = pattern.sub(" ", body)
    # Substack nests <figure><a><picture><img>. Collapse each figure to ONE <img> first,
    # otherwise html2text emits a link per nesting level ([[![](u)](u) ](u)).
    body = re.sub(r"<picture\b.*?</picture>", _keep_img, body, flags=re.S | re.I)
    body = re.sub(r"<figure\b[^>]*>(.*?)</figure>", _unwrap_link, body, flags=re.S | re.I)
    body = re.sub(r"<figcaption\b[^>]*>(.*?)</figcaption>", r"\1", body, flags=re.S | re.I)
    return body


def _unwrap_link(match: re.Match) -> str:
    """Drop the wrapping <a> inside a figure so a single image link survives."""
    inner = match.group(1)
    return re.sub(r"<a\b[^>]*>(.*?)</a>", r"\1", inner, flags=re.S | re.I)


def _keep_img(match: re.Match) -> str:
    """Collapse a <picture> with its srcset variants to a single <img src>."""
    m = re.search(r"<img\b[^>]*?src=\"([^\"]+)\"[^>]*?(?:alt=\"([^\"]*)\")?", match.group(0), re.I | re.S)
    if not m:
        return " "
    src, alt = m.group(1), (m.group(2) or "")
    return f'<img src="{src}" alt="{html.escape(alt)}">'


# ----------------------------------------------------------------------------------
# html -> markdown
# ----------------------------------------------------------------------------------
def convert_body(body: str) -> str:
    h = html2text.HTML2Text()
    h.body_width = 0          # never wrap: matches the clean corpus
    h.ignore_links = False    # keep markdown links in library posts
    h.ignore_images = False
    h.unicode_snob = True     # typographic quotes/dashes preserved
    h.protect_links = False   # clean corpus has 0 autolinks: never emit <url>
    h.single_line_break = False
    h.mark_code = False
    md = h.handle(body)
    return tidy(md)


def tidy(md: str) -> str:
    """Normalise whitespace and block spacing to match the clean corpus."""
    md = md.replace("\r\n", "\n").replace("\r", "\n")
    md = re.sub(r"[ \t]+\n", "\n", md)          # trailing spaces
    md = re.sub(r"\n{3,}", "\n\n", md)          # at most one blank line
    return md.strip() + "\n"


# ----------------------------------------------------------------------------------
# per-corpus rendering
# ----------------------------------------------------------------------------------
IMAGE_LINKED = re.compile(r"\[!\[([^\]]*)\]\(([^)]+)\)\]\(([^)]+)\)")
IMAGE_BARE = re.compile(r"!\[([^\]]*)\]\(([^)]+)\)")


def images_to_asset_links(md: str) -> str:
    """Library posts wrap each asset in a link: [![alt](u)](u)."""
    md = IMAGE_LINKED.sub(lambda m: f"[![]({m.group(2)})]({m.group(3)})", md)
    md = IMAGE_BARE.sub(lambda m: f"[![]({m.group(2)})]({m.group(2)})", md)
    return md


def images_to_empty_brackets(md: str) -> str:
    """KB documents use the bare form [](asset). Verified against mls-0001..0164."""
    md = IMAGE_LINKED.sub(lambda m: f"[]({m.group(2)})", md)
    md = IMAGE_BARE.sub(lambda m: f"[]({m.group(2)})", md)
    return md


def links_to_plain_text(md: str) -> str:
    """KB documents are link-stripped, except asset images which keep the [](){}.  form."""
    def repl(m: re.Match) -> str:
        target, text = m.group(2), m.group(1)
        if target.startswith("../assets/"):
            return text if text else m.group(0)   # keep image syntax
        return text
    return re.sub(r"\[([^\]]*)\]\(([^)]+)\)", repl, md)


# ----------------------------------------------------------------------------------
# frontmatter helpers
# ----------------------------------------------------------------------------------
FM = re.compile(r"^---\n(.*?)\n---\n\n", re.S)


def read_fm(text: str) -> dict:
    m = FM.match(text)
    if not m:
        return {}
    out = {}
    for line in m.group(1).splitlines():
        if ":" in line:
            k, v = line.split(":", 1)
            out[k.strip()] = v.strip().strip('"')
    return out


def html_library_body(raw_doc: str) -> str:
    """Body (with h1 + subtitle) of a raw library post, minus frontmatter."""
    m = FM.match(raw_doc)
    return raw_doc[m.end():] if m else raw_doc


def byline(fm: dict) -> str:
    return (f"*Machine Learning at Scale collection — Ludovico Bessi, "
            f"{fm.get('date','')} · topic: {fm.get('topics','').strip('[]')}*")


# ----------------------------------------------------------------------------------
# drivers
# ----------------------------------------------------------------------------------
def clean_library_post(raw_doc: str) -> str:
    """Raw library post -> clean library post (frontmatter + body preserved)."""
    fm = read_fm(raw_doc)
    m = FM.match(raw_doc)
    front = raw_doc[: m.end()]
    header, body = split_header(raw_doc[m.end():])
    # header is: "# title\n\n*subtitle*\n\n" (subtitle optional)
    md = convert_body(strip_chrome(body))
    md = images_to_asset_links(md)
    return front + header.rstrip("\n") + "\n\n" + md


def raw_library_to_kb(raw_doc: str) -> str:
    """Raw library post -> KB document (no frontmatter, link-stripped, byline)."""
    fm = read_fm(raw_doc)
    m = FM.match(raw_doc)
    header, body = split_header(raw_doc[m.end():])
    lines = header.rstrip("\n").split("\n")
    title = next((l for l in lines if l.startswith("# ")), "")
    md = convert_body(strip_chrome(body))
    md = images_to_empty_brackets(md)
    md = links_to_plain_text(md)
    return f"{title}\n\n{byline(fm)}\n\n{md}"


def library_to_kb(clean_doc: str) -> str:
    """Clean library post -> KB document, matching the verified 164-file transform."""
    fm = read_fm(clean_doc)
    m = FM.match(clean_doc)
    body = clean_doc[m.end():]
    lines = body.split("\n")
    i = 1
    while i < len(lines) and not lines[i].strip():
        i += 1
    bl = byline(fm)
    if i < len(lines) and re.match(r"^\*(?!\*).*\*$", lines[i].strip()):
        lines[i] = bl                      # replace the subtitle
    else:
        lines.insert(i, bl)                # or insert one
    body = "\n".join(lines)
    body = links_to_plain_text(body)
    return tidy(body)


# ----------------------------------------------------------------------------------
def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true", help="report only, write nothing")
    ap.add_argument("--only-missing", action="store_true",
                    help="skip posts whose KB document already exists and is clean")
    args = ap.parse_args()

    raw_posts = sorted(p for p in POSTS.glob("*.md") if is_raw(p.read_text(encoding="utf-8")))
    print(f"raw library posts to convert: {len(raw_posts)}")
    if not raw_posts:
        print("nothing to do")
        return 0

    changed = 0
    for p in raw_posts:
        raw = p.read_text(encoding="utf-8")
        slug = re.sub(r"^\d{4}-\d{2}-\d{2}-", "", p.stem)
        kb_path = next(KB.glob(f"mls-*-{slug}.md"), None)
        if args.only_missing and kb_path and not is_raw(kb_path.read_text(encoding="utf-8")):
            print(f"  skip (already clean): {p.name}")
            continue

        fixed = clean_library_post(raw)
        # a cleaned post must not be detected as raw any more
        assert not is_raw(fixed), f"still raw after conversion: {p.name}"
        assert fixed.count("<") < 40, f"too much residual HTML in {p.name}"

        if kb_path:
            kb_text = raw_library_to_kb(raw)
            assert not is_raw(kb_text), f"KB still raw: {kb_path.name}"

        if args.check:
            print(f"  would clean {p.name}  ({len(raw)} -> {len(fixed)} chars)")
        else:
            p.write_text(fixed, encoding="utf-8", newline="\n")
            if kb_path:
                kb_path.write_text(kb_text, encoding="utf-8", newline="\n")
            changed += 1
            if changed % 10 == 0:
                print(f"  ... {changed} done")

    print(f"{'would convert' if args.check else 'converted'}: {len(raw_posts) if args.check else changed} posts")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
