#!/usr/bin/env python3
"""Index one source by name (used to fill a gap left by an interrupted run)."""
import os, pathlib, sys

REPO = pathlib.Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO / "butterbase" / "tools"))

import build_index as B  # noqa: E402

name = sys.argv[1] if len(sys.argv) > 1 else None
if not name:
    sys.exit("usage: index_one.py <source-stem>")

path = REPO / "deeptutor" / "content" / f"{name}.md"
if not path.exists():
    sys.exit(f"no such document: {path}")

text = path.read_text(encoding="utf-8")
chunks = B.split_chunks(text)
print(f"{name}: {len(chunks)} chunks")

vectors = []
for i in range(0, len(chunks), B.BATCH):
    vectors.extend(B.embed([c for _, c in chunks[i:i + B.BATCH]]))

B.bb_delete_source(name)
rows = [{
    "source": name, "section": sec, "ordinal": i, "content": chunk,
    "tokens": len(chunk) // 4, "model": B.MODEL, "embedding": __import__("json").dumps(vec),
} for i, ((sec, chunk), vec) in enumerate(zip(chunks, vectors))]
B.bb_post("rt_chunks", rows)
B.bb_post("rt_documents", [{
    "source": name, "title": name, "bytes": len(text),
    "chunks": len(chunks), "model": B.MODEL,
}])
print(f"indexed {name}: {len(rows)} rows")
