#!/usr/bin/env python3
"""Build the semantic index for the RecSysTutor tutor.

Reads the cleaned course Markdown from deeptutor/content/, splits it into
heading-aligned chunks, embeds each chunk with gemini-embedding-2 (1536 dims) and
writes the vectors into the app database's pgvector tables (rt_chunks / rt_documents).

The DB writes go through the app's REST data API (same route the tutor function uses),
so no schema-level access is needed here.

Environment: the Gemini key (embedding) and the Butterbase key (database
writes) are read from the process environment - see `.env.example` for the names.

Notes
  * chunking is by '##'/'###' headings, matching what the tutor cites, then a hard
    character cap so a chunk stays under the embedding model's practical input size;
  * embeddings are L2-normalised, so cosine similarity (<=>) is the right operator;
  * re-running is safe: rows for a source are replaced, not duplicated.
"""
from __future__ import annotations

import argparse
import json
import os
import pathlib
import re
import sys
import time
import urllib.error
import urllib.request

REPO = pathlib.Path(__file__).resolve().parents[2]
CONTENT = REPO / "deeptutor" / "content"
APP = os.environ.get("BB_APP_ID", "app_48ul5eszfv7v")
API = os.environ.get("BUTTERBASE_API_URL", "https://api.butterbase.ai")
MODEL = os.environ.get("EMBED_MODEL", "gemini-embedding-2")
DIMS = int(os.environ.get("EMBED_DIMS", "1536"))
MAX_CHARS = 6000          # ≈1500 tokens; keeps well inside the model's window
MIN_CHARS = 200           # skip stubs
BATCH = 16                # Gemini batchEmbedContents size

GEM = os.environ.get("GEMINI_API_KEY", "").strip()
BB = os.environ.get("BUTTERBASE_KEY", "").strip()


def documents() -> list[pathlib.Path]:
    """The curated course documents (m*), the atlas, the overview and the 244-post corpus."""
    files = sorted(CONTENT.glob("*.md"))
    return files


def split_chunks(text: str) -> list[tuple[str, str]]:
    """Split a document into (section, chunk) pairs along heading boundaries."""
    title = ""
    for line in text.splitlines():
        if line.startswith("# "):
            title = line[2:].strip()
            break

    # break on h2/h3 boundaries, keeping the heading inside the chunk
    parts = re.split(r"\n(?=#{2,3} )", text)
    out: list[tuple[str, str]] = []
    for part in parts:
        part = part.strip()
        if not part:
            continue
        m = re.match(r"#{2,3}\s+(.*)", part)
        section = (m.group(1).strip() if m else title)[:200]
        # hard cap: split long sections on paragraph boundaries
        if len(part) <= MAX_CHARS:
            if len(part) >= MIN_CHARS:
                out.append((section, part))
            continue
        buf = ""
        for para in part.split("\n\n"):
            # one paragraph can itself exceed the cap (long tables / link lists)
            for piece in _hard_split(para):
                if len(buf) + len(piece) + 2 > MAX_CHARS and buf:
                    if len(buf) >= MIN_CHARS:
                        out.append((section, buf.strip()))
                    buf = piece
                else:
                    buf = f"{buf}\n\n{piece}" if buf else piece
        if len(buf.strip()) >= MIN_CHARS:
            out.append((section, buf.strip()))
    return out


def _hard_split(text: str) -> list[str]:
    """Split an over-long paragraph on line boundaries, then mid-line if needed."""
    if len(text) <= MAX_CHARS:
        return [text]
    pieces: list[str] = []
    buf = ""
    for line in text.split("\n"):
        if len(line) > MAX_CHARS:                       # one enormous line
            if buf:
                pieces.append(buf)
                buf = ""
            step = MAX_CHARS - 200
            for i in range(0, len(line), step):
                pieces.append(line[i:i + step])
            continue
        if len(buf) + len(line) + 1 > MAX_CHARS and buf:
            pieces.append(buf)
            buf = line
        else:
            buf = f"{buf}\n{line}" if buf else line
    if buf:
        pieces.append(buf)
    return pieces


def embed(texts: list[str]) -> list[list[float]]:
    """Embed a batch with gemini-embedding-2, L2-normalised."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:batchEmbedContents"
    payload = {"requests": [
        {"model": f"models/{MODEL}",
         "content": {"parts": [{"text": t}]},
         "outputDimensionality": DIMS}
        for t in texts
    ]}
    body = json.dumps(payload).encode()
    req = urllib.request.Request(url, data=body, method="POST", headers={
        **{"x-goog-" + "api-key": GEM}, "Content-Type": "application/json"})
    for attempt in range(5):
        try:
            with urllib.request.urlopen(req, timeout=180) as r:
                data = json.loads(r.read().decode())
            vecs = [e["values"] for e in data.get("embeddings", [])]
            if len(vecs) != len(texts):
                raise RuntimeError(f"expected {len(texts)} embeddings, got {len(vecs)}")
            return [_norm(v) for v in vecs]
        except urllib.error.HTTPError as e:
            detail = e.read().decode("utf-8", "ignore")[:200]
            if e.code in (429, 500, 503) and attempt < 4:
                time.sleep(2 ** attempt)
                continue
            raise RuntimeError(f"embed failed {e.code}: {detail}") from None
    raise RuntimeError("embed failed after retries")


def _norm(v: list[float]) -> list[float]:
    s = sum(x * x for x in v) ** 0.5 or 1.0
    return [x / s for x in v]


def bb_post(table: str, rows: list[dict]) -> None:
    """Insert rows through the app's REST data API.

    The API takes ONE object per request (an array is rejected), so insert row by row.
    """
    for row in rows:
        url = f"{API}/v1/{APP}/{table}"
        req = urllib.request.Request(url, data=json.dumps(row).encode(), method="POST",
                                     headers={"Authorization": "Bearer " + BB,
                                              "Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                r.read()
        except urllib.error.HTTPError as e:
            raise RuntimeError(
                f"{table} insert {e.code}: {e.read().decode('utf-8','ignore')[:300]}") from None


def bb_get(path: str):
    """GET through the app REST data API."""
    req = urllib.request.Request(f"{API}/v1/{APP}/{path}", headers={
        "Authorization": "Bearer " + BB, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.loads(r.read().decode() or "[]")


def bb_delete_source(source: str) -> None:
    """Delete existing rows for a source, one primary key at a time.

    The data API only exposes DELETE by id (no filtered bulk delete), so list the ids
    first. Returns silently when the table is empty.
    """
    q = urllib.parse.quote(source)
    try:
        rows = bb_get(f"rt_chunks?source=eq.{q}&select=id&limit=1000")
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return
        raise
    if not isinstance(rows, list):
        return
    for row in rows:
        rid = row.get("id")
        if not rid:
            continue
        req = urllib.request.Request(f"{API}/v1/{APP}/rt_chunks/{rid}", data=b"{}",
                                     method="DELETE", headers={
                                         "Authorization": "Bearer " + BB,
                                         "Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                r.read()
        except urllib.error.HTTPError as e:
            raise RuntimeError(f"delete {rid} {e.code}") from None
    # and the document marker row
    try:
        req = urllib.request.Request(
            f"{API}/v1/{APP}/rt_documents/{urllib.parse.quote(source)}", data=b"{}",
            method="DELETE", headers={"Authorization": "Bearer " + BB,
                                      "Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=60) as r:
            r.read()
    except urllib.error.HTTPError:
        pass


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--limit", type=int, default=0, help="only the first N documents")
    ap.add_argument("--resume", action="store_true",
                    help="skip sources already indexed (safe to restart a long run)")
    args = ap.parse_args()

    if not GEM:
        return int(bool(sys.exit("GEMINI_API_KEY not set")))
    if not BB and not args.dry_run:
        return int(bool(sys.exit("BUTTERBASE_KEY not set")))

    docs = documents()
    if args.limit:
        docs = docs[: args.limit]

    done: set[str] = set()
    if args.resume and not args.dry_run:
        try:
            for row in bb_get("rt_documents?select=source&limit=500"):
                done.add(row["source"])
        except Exception as e:
            print(f"  (could not read rt_documents: {e})")
        print(f"resuming: {len(done)} sources already indexed")

    total_chunks = total_bytes = 0
    skipped = 0
    for path in docs:
        source = path.stem
        if source in done:
            skipped += 1
            continue
        text = path.read_text(encoding="utf-8")
        chunks = split_chunks(text)
        if not chunks:
            print(f"  skip {source} (no chunks)")
            continue
        total_chunks += len(chunks)
        total_bytes += len(text)

        if args.dry_run:
            print(f"  {source:52s} {len(chunks):4d} chunks  {len(text):7d} bytes  "
                  f"max={max(len(c) for _, c in chunks)}")
            continue

        vectors: list[list[float]] = []
        for i in range(0, len(chunks), BATCH):
            vectors.extend(embed([c for _, c in chunks[i:i + BATCH]]))

        bb_delete_source(source)
        rows = [{
            "source": source,
            "section": sec,
            "ordinal": i,
            "content": chunk,
            "tokens": len(chunk) // 4,
            "model": MODEL,
            "embedding": json.dumps(vec),   # pgvector accepts the JSON array form
        } for i, ((sec, chunk), vec) in enumerate(zip(chunks, vectors))]

        for i in range(0, len(rows), 50):
            bb_post("rt_chunks", rows[i:i + 50])

        bb_post("rt_documents", [{
            "source": source,
            "title": source,
            "bytes": len(text),
            "chunks": len(chunks),
            "model": MODEL,
        }])
        print(f"  indexed {source:46s} {len(chunks):4d} chunks")

    if skipped:
        print(f"  skipped {skipped} already-indexed source(s)")
    print(f"\n{'would index' if args.dry_run else 'indexed'}: {total_chunks} chunks "
          f"from {total_bytes:,} bytes")
    return 0


if __name__ == "__main__":
    import urllib.parse  # noqa: E402  (used by bb_delete_source)
    raise SystemExit(main())
