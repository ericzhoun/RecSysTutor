#!/usr/bin/env python3
"""Write the course .env that deploy.py reads to configure the tutor function.

Secrets are taken from the process environment - no credential literal is authored here.
The resulting .env is gitignored (.gitignore line 2), which is where deploy.py expects it.

Required env: KIMI_API_KEY, GEMINI_API_KEY
Optional env: KIMI_BASE_URL (default https://api.moonshot.cn/v1)
              KIMI_MODEL    (default kimi-k2.6)
"""
import io, os, pathlib, sys

root = pathlib.Path(__file__).resolve().parents[2]
env_path = root / ".env"

kimi = os.environ.get("KIMI_API_KEY", "").strip()
gem = os.environ.get("GEMINI_API_KEY", "").strip()
base = os.environ.get("KIMI_BASE_URL", "https://api.moonshot.cn/v1").strip()
model = os.environ.get("KIMI_MODEL", "kimi-k2.6").strip()

if not kimi:
    sys.exit("KIMI_API_KEY not set")
if not gem:
    sys.exit("GEMINI_API_KEY not set")

# deploy.py parses "Label: value" lines and lowercases the label.
#   'model'    -> TUTOR_MODEL
#   'api key'  -> OPENAI_API_KEY
#   'baseurl'  -> OPENAI_BASE_URL
lines = [
    "# RecSysTutor tutor configuration (gitignored - do not commit).",
    "# Generation: Moonshot Kimi, OpenAI-compatible endpoint.",
    f"model: {model}",
    f"api key: {kimi}",
    f"baseurl: {base}",
    "",
    "# Embedding for the tutor's pgvector retrieval (Butterbase indexes with its own",
    "# model; this key is used at query time inside the function).",
    f"gemini api key: {gem}",
    "",
]
env_path.write_text("\n".join(lines), encoding="utf-8")

print(f"wrote {env_path}")
print(f"  model   : {model}")
print(f"  baseurl : {base}")
print(f"  keys    : kimi(len={len(kimi)}), gemini(len={len(gem)}) [not printed]")
print("  gitignored:", os.popen("git check-ignore .env").read().strip() or "NOT IGNORED (!!)")
