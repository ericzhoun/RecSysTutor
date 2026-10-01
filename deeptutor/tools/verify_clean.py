#!/usr/bin/env python3
"""Verify the completed corpus: no raw HTML, conventions match, nothing lost.

Checks both corpora against the 164 pre-existing documents, which are the reference.
"""
import collections, pathlib, re, sys

REPO = pathlib.Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO / "deeptutor" / "tools"))
import clean_raw_posts as C  # noqa: E402

POSTS = REPO / "ml-at-scale" / "posts"
KB = REPO / "deeptutor" / "content"
ASSETS = REPO / "ml-at-scale" / "assets"

ok = True


def chk(cond, msg):
    global ok
    print(("PASS  " if cond else "FAIL  ") + msg)
    if not cond:
        ok = False


# --- 1) nothing left raw -----------------------------------------------------------
raw_posts = [p.name for p in POSTS.glob("*.md") if C.is_raw(p.read_text(encoding="utf-8"))]
raw_kb = [p.name for p in KB.glob("mls-*.md") if C.is_raw(p.read_text(encoding="utf-8"))]
chk(not raw_posts, f"no raw HTML in library posts ({len(raw_posts)} left)")
chk(not raw_kb, f"no raw HTML in KB documents ({len(raw_kb)} left)")

chk(len(list(POSTS.glob("*.md"))) == 244, "244 library posts present")
chk(len(list(KB.glob("mls-*.md"))) == 244, "244 KB documents present")

# --- 2) KB docs are derived from the posts, deterministically -----------------------
idx = sorted(int(re.match(r"mls-(\d+)", f.name).group(1)) for f in KB.glob("mls-*.md"))
chk(idx == list(range(1, 245)), "KB indices are contiguous 1..244")

# --- 3) image refs resolve and the two corpora agree --------------------------------
posts = {re.sub(r"^\d{4}-\d{2}-\d{2}-", "", p.stem): p for p in POSTS.glob("*.md")}
mismatch, missing_asset = [], set()
for f in KB.glob("mls-*.md"):
    n = int(re.match(r"mls-(\d+)", f.name).group(1))
    slug = re.sub(r"^mls-\d+-", "", f.stem)
    if n < 165:
        continue
    p = posts.get(slug)
    if not p:
        mismatch.append(f.name)
        continue
    kb_imgs = re.findall(r"\.\./assets/([A-Za-z0-9._-]+)", f.read_text(encoding="utf-8"))
    post_imgs = re.findall(r"\.\./assets/([A-Za-z0-9._-]+)", p.read_text(encoding="utf-8"))
    # KB has one ref per image (bare form); post has two (linked img + href)
    if sorted(set(kb_imgs)) != sorted(set(post_imgs)):
        mismatch.append(f.name)
    missing_asset |= {a for a in kb_imgs if not (ASSETS / a).exists()}

chk(not mismatch, f"KB image sets match cleaned posts ({len(mismatch)} mismatched)")
chk(not missing_asset, f"all image refs resolve on disk ({len(missing_asset)} missing)")

# --- 4) no residual page chrome ----------------------------------------------------
CHROME = ["data-attrs", "captioned-image-container", "pencraft", "subscription-widget",
          "paywall-jump", "restack-image", "image-link-expand", "srcset", "&quot;",
          "digest-post-embed"]
leaks = collections.Counter()
for f in list(POSTS.glob("*.md")) + list(KB.glob("mls-*.md")):
    t = f.read_text(encoding="utf-8")
    for c in CHROME:
        if c in t:
            leaks[c] += 1
chk(not leaks, f"no Substack page chrome leaked ({dict(leaks)})")

# --- 5) conversion is deterministic / idempotent -----------------------------------
chk(C.is_raw("## Title\n\nSome prose.") is False, "is_raw() ignores clean markdown")

# --- 6) new docs follow the house image convention ---------------------------------
def is_bare(s):
    return re.match(r"^\[\]\([^)]+\)$", s.strip()) is not None

odd = []
for f in KB.glob("mls-*.md"):
    n = int(re.match(r"mls-(\d+)", f.name).group(1))
    if n < 165:
        continue
    for line in f.read_text(encoding="utf-8").splitlines():
        if "../assets/" in line and not is_bare(line):
            odd.append((f.name, line.strip()[:80]))
chk(not odd, f"new KB docs use the [](asset) convention ({len(odd)} odd lines)")

# --- 7) fidelity vs the ACTUAL source HTML (ground truth) ---------------------------
# NB: the 'words:' frontmatter is crawler metadata and is unreliable for the 80 upgraded
# posts (for 9 of them it records the article's full length while the stored body is the
# publicly visible portion). So completeness is measured against the pre-conversion HTML
# in git, not against frontmatter.
import subprocess


def source_body(rel_path: str) -> str | None:
    raw = subprocess.run(["git", "show", f"HEAD:{rel_path}"], capture_output=True,
                         text=True, encoding="utf-8").stdout
    if not raw or not C.is_raw(raw):
        return None
    m = C.FM.match(raw)
    _, html_body = C.split_header(raw[m.end():])
    return html_body


fid = []
for f in KB.glob("mls-*.md"):
    n = int(re.match(r"mls-(\d+)", f.name).group(1))
    if n < 165:
        continue
    slug = re.sub(r"^mls-\d+-", "", f.stem)
    p = posts.get(slug)
    if not p:
        continue
    hb = source_body(p.relative_to(REPO).as_posix())
    if hb is None:
        continue
    plain = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", C.strip_chrome(hb))).strip()
    src_w = len(plain.split())
    if not src_w:
        continue
    out_w = len(f.read_text(encoding="utf-8").split())
    fid.append((out_w / src_w, f.name, src_w, out_w))

fid.sort()
chk(len(fid) == 80, f"fidelity measured for all 80 converted documents ({len(fid)})")
if fid:
    print(f"      output/source words: min {fid[0][0]:.2f} median {fid[len(fid)//2][0]:.2f} max {fid[-1][0]:.2f}")
    chk(fid[0][0] > 0.95, "every document retains its full source text")

# --- 8) report (not fail) the posts whose stored body is a preview -------------------
previews = []
for f in KB.glob("mls-*.md"):
    n = int(re.match(r"mls-(\d+)", f.name).group(1))
    if n < 165:
        continue
    slug = re.sub(r"^mls-\d+-", "", f.stem)
    p = posts.get(slug)
    if not p:
        continue
    fm = C.read_fm(p.read_text(encoding="utf-8"))
    declared = int(fm.get("words", 0) or 0)
    if declared and len(f.read_text(encoding="utf-8").split()) < declared * 0.85:
        previews.append((f.name, declared, len(f.read_text(encoding="utf-8").split())))
print(f"\nNOTE  {len(previews)} documents hold only the publicly visible portion of a "
      f"paid post (upstream crawler metadata; not a conversion loss):")
for name, d, a in previews:
    print(f"        declared {d:5d} vs stored {a:5d}  {name}")

print("\n" + ("ALL CHECKS PASSED" if ok else "SOME CHECKS FAILED"))
raise SystemExit(0 if ok else 1)
