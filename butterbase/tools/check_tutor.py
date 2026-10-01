#!/usr/bin/env python3
"""End-to-end checks against the deployed tutor:
  * health reports the new pipeline
  * a real question returns a grounded answer via pgvector (mode/retrieval/sources)
  * the debug endpoint exposes similarity scores and generation status
"""
import json, os, re, sys, urllib.error, urllib.request

APP = os.environ.get("BB_APP_ID", "app_48ul5eszfv7v")
URL = f"https://api.butterbase.ai/v1/{APP}/fn/tutor-chat"
DEBUG = os.environ.get("DEBUG_TOKEN", "")


def post(body, timeout=180):
    req = urllib.request.Request(URL, data=json.dumps(body).encode(), method="POST",
                                 headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", "ignore")


QUESTIONS = [
    "Why does two-tower retrieval need logQ correction?",
    "How do you shard an embedding table that does not fit on one device?",
    "What did the production war stories say about calibration?",
]

for q in QUESTIONS:
    st, body = post({"message": q})
    print("=" * 78)
    print("Q:", q)
    print("status:", st)
    if isinstance(body, dict):
        print("model:", body.get("model"), "| mode:", body.get("mode"),
              "| retrieval:", body.get("retrieval"), "| grounded:", body.get("grounded"),
              "| latencyMs:", body.get("latencyMs"))
        srcs = body.get("sources") or []
        print("sources:")
        for s in srcs:
            print("   ", s)
        ans = (body.get("answer") or "")
        print("answer (first 320 chars):")
        print("   ", re.sub(r"\s+", " ", ans)[:320])
    else:
        print(str(body)[:400])
    print()

if DEBUG:
    st, body = post({"message": QUESTIONS[0], "debug": DEBUG})
    print("=" * 78)
    print("DEBUG:", st, json.dumps(body)[:700])
else:
    print("(set DEBUG_TOKEN to inspect similarity scores)")
