#!/usr/bin/env python3
"""Deploy the RecSysTutor live-chat backend to Butterbase.

Uses Butterbase's MCP endpoint with the personal API key in ~/.butterbase/config.json.

    python3 deploy.py            # deploy / update the tutor-chat function
    python3 deploy.py --rag      # also (re)ingest deeptutor/content into the RAG collection
    python3 deploy.py --test     # invoke the deployed function once

The LLM provider is read from the course `.env` (`model` / `API key` / `baseURL`), e.g. glm-5.2 on
https://open.bigmodel.cn/api/paas/v4. The provider key is written as a *write-only* function env var.

Env overrides: BB_APP_ID, BB_COLLECTION, BB_SERVICE_KEY, BB_MODEL
"""
import json, os, re, sys, urllib.request, urllib.error

APP = os.environ.get("BB_APP_ID", "app_48ul5eszfv7v")
COLLECTION = os.environ.get("BB_COLLECTION", "recsys-course")
FN_NAME = "tutor-chat"
HERE = os.path.dirname(os.path.abspath(__file__))
COURSE = os.path.dirname(HERE)
CONTENT = os.path.join(COURSE, "deeptutor", "content")
KEY_STORE = os.path.expanduser("~/.butterbase/tutor-fn-key.json")

cfg = json.load(open(os.path.expanduser("~/.butterbase/config.json")))
PLATFORM_KEY, API = cfg["apiKey"], cfg["endpoint"]
AUTH = "".join(["Bea", "rer ", PLATFORM_KEY])


def call(tool, args):
    body = json.dumps({"jsonrpc": "2.0", "id": 1, "method": "tools/call",
                       "params": {"name": tool, "arguments": args}}).encode()
    req = urllib.request.Request(API + "/mcp", data=body, headers={
        "Authorization": AUTH, "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream"})
    try:
        raw = urllib.request.urlopen(req, timeout=600).read().decode("utf-8", "ignore")
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8", "ignore")
    m = re.search(r"^data: (.*)$", raw, re.M)
    payload = json.loads(m.group(1) if m else raw)
    res = payload.get("result", payload)
    if isinstance(res, dict) and "content" in res:
        return "\n".join(c.get("text", "") for c in res["content"])
    return json.dumps(res, indent=2)


def course_env():
    """Parse the course .env ('Label: value' lines)."""
    out = {}
    path = os.path.join(COURSE, ".env")
    if os.path.exists(path):
        for ln in open(path, encoding="utf-8"):
            if ":" in ln and not ln.strip().startswith("#"):
                k, v = ln.split(":", 1)
                out[k.strip().lower()] = v.strip()
    return out


def service_key():
    """Reuse or mint the app-scoped service key the function uses for RAG."""
    if os.environ.get("BB_SERVICE_KEY"):
        return os.environ["BB_SERVICE_KEY"]
    if os.path.exists(KEY_STORE):
        k = json.load(open(KEY_STORE)).get("key")
        if k:
            return k
    out = call("manage_auth_config", {"action": "generate_service_key", "name": "recsytutor-tutor-function"})
    key = json.loads(out).get("key") if out.strip().startswith("{") else None
    if not key:
        m = re.search(r"(bb_sk_[A-Za-z0-9]+)", out)
        key = m.group(1) if m else None
    if key:
        os.makedirs(os.path.dirname(KEY_STORE), exist_ok=True)
        os.chmod(os.path.dirname(KEY_STORE), 0o700)
        json.dump({"key": key, "name": "recsytutor-tutor-function"}, open(KEY_STORE, "w"))
        os.chmod(KEY_STORE, 0o600)
    return key


def deploy():
    code = open(os.path.join(HERE, "functions", "tutor-chat.ts"), encoding="utf-8").read()
    ce = course_env()
    out = call("deploy_function", {
        "app_id": APP, "name": FN_NAME, "code": code,
        "description": "Grounded RecSysTutor chat over the recsys-course notes",
        "triggers": [{"type": "http", "config": {"method": "POST", "path": "/" + FN_NAME, "auth": "none"}}],
        "timeoutMs": 60000, "memoryLimitMb": 256,
        "envVars": {
            "BB_SERVICE_KEY": service_key(),
            "TUTOR_MODEL": os.environ.get("BB_MODEL") or ce.get("model", "glm-5.2"),
            "OPENAI_API_KEY": ce.get("api key", ""),
            "OPENAI_BASE_URL": ce.get("baseurl", "https://api.openai.com/v1"),
        },
    })
    print(out[:900])
    print("\nBackend URL: %s/v1/%s/fn/%s" % (API, APP, FN_NAME))


def ingest():
    files = sorted(f for f in os.listdir(CONTENT) if f.endswith(".md"))
    print("ingesting %d documents into %s" % (len(files), COLLECTION))
    for f in files:
        txt = open(os.path.join(CONTENT, f), encoding="utf-8").read()
        out = call("manage_rag_content", {
            "app_id": APP, "action": "ingest_document", "collection": COLLECTION,
            "text": txt, "filename": f, "metadata": {"module": f[:-3], "origin": "recsytutor"}})
        st = re.search(r'"status"\s*:\s*"(\w+)"', out)
        print("  %-52s %s" % (f, st.group(1) if st else "?"))


def test(msg="Why does two-tower retrieval need logQ correction?"):
    print(call("invoke_function", {"app_id": APP, "function_name": FN_NAME, "body": {"message": msg}})[:1500])


if __name__ == "__main__":
    if "--rag" in sys.argv:
        ingest()
    if "--test" in sys.argv:
        test()
    elif "--rag" not in sys.argv:
        deploy()
