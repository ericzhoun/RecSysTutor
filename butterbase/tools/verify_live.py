#!/usr/bin/env python3
"""Final end-to-end verification of the tutor pipeline."""
import json, os, re, urllib.error, urllib.request

APP = os.environ.get("BB_APP_ID", "app_48ul5eszfv7v")
URL = f"https://api.butterbase.ai/v1/{APP}/fn/tutor-chat"
DBG = os.environ.get("DEBUG_TOKEN", "")
ok = True


def chk(cond, msg):
    global ok
    print(("PASS  " if cond else "FAIL  ") + msg)
    if not cond:
        ok = False


# health
r = urllib.request.Request(URL, headers={"Accept": "application/json"})
h = json.loads(urllib.request.urlopen(r, timeout=60).read().decode())
print("health:", json.dumps(h))
chk(h.get("status") == "ok", "health ok")
chk(h.get("version") == "1.3.0", f"version {h.get('version')}")
chk(h.get("model") == "kimi-k2.6", f"model {h.get('model')}")
chk(h.get("embedModel") == "gemini-embedding-2", f"embed model {h.get('embedModel')}")
chk("pgvector" in (h.get("retrieval") or ""), f"retrieval {h.get('retrieval')}")


def ask(q):
    req = urllib.request.Request(URL, data=json.dumps({"message": q}).encode(), method="POST",
                                 headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=200) as r:
            return r.status, json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", "ignore")


print()
for q in ["Why does two-tower retrieval need logQ correction?",
          "What is the diversity / effective catalog size idea?",
          "Summarise what a production post-mortem looks like in the library"]:
    st, b = ask(q)
    chk(st == 200 and isinstance(b, dict) and b.get("grounded"), f"grounded answer: {q[:46]}")
    if isinstance(b, dict):
        sr = b.get("sources") or []
        sims = [s.get("similarity") for s in sr if s.get("similarity")]
        print(f"      retrieval={b.get('retrieval')} chunks_src={len(sr)} "
              f"top_sim={max(sims) if sims else None} latency={b.get('latencyMs')}ms")

print()
if DBG:
    req = urllib.request.Request(URL, data=json.dumps(
        {"message": "shard an embedding table", "debug": DBG}).encode(), method="POST",
        headers={"Content-Type": "application/json"})
    d = json.loads(urllib.request.urlopen(req, timeout=200).read().decode())
    print("debug:", json.dumps(d)[:400])
    chk(d.get("retrievalMode") == "pgvector", f"debug retrieval mode {d.get('retrievalMode')}")
    chk((d.get("maxSim") or 0) > 0.5, f"debug max similarity {d.get('maxSim')}")
    chk(d.get("llm", {}).get("ok") is True, "debug provider ok")

print("\n" + ("ALL CHECKS PASSED" if ok else "SOME CHECKS FAILED"))
raise SystemExit(0 if ok else 1)
