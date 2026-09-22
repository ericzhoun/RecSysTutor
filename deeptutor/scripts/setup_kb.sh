#!/usr/bin/env bash
# Build (or refresh) the DeepTutor knowledge base from the exported course content.
#
#   KB=recsys-course ./scripts/setup_kb.sh
#   PYTHON=.../deeptutor/.venv/bin/python GRAPH=.../knowledge_graph.json ./scripts/setup_kb.sh
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
root="$(cd "$here/../.." && pwd)"                 # course dir (contains index.html)
content="$here/../content"
kb="${KB:-recsys-course}"
py="${PYTHON:-python3}"

command -v deeptutor >/dev/null 2>&1 || { echo "error: 'deeptutor' not on PATH (pip install deeptutor)"; exit 1; }

# Optional: regenerate Markdown from the course HTML + knowledge graph.
if [ -n "${GRAPH:-}" ] && [ -f "${GRAPH}" ]; then
  echo "==> exporting markdown from course + graph"
  "$py" "$here/../tools/export_kb.py" "$root" "$GRAPH" "$content"
fi

echo "==> ingesting $content into KB '$kb'"
if deeptutor kb create "$kb" --docs-dir "$content" 2>/dev/null; then
  echo "created KB '$kb'"
else
  echo "KB '$kb' already exists — adding documents"
  deeptutor kb add "$kb" --docs-dir "$content"
fi
deeptutor kb set-default "$kb" || true
deeptutor kb info "$kb"
