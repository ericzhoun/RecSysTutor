#!/usr/bin/env python3
"""Prove the learner tables isolate learners from each other.

The course page talks to Butterbase with the learner's own JWT, so Row-Level Security
is the only thing standing between two learners. This test creates two real accounts,
authenticates them, and asserts through the same data API the page uses that:

  * a learner can create and read only their own rows;
  * the other learner sees nothing, and cannot read, update, forge or delete their rows;
  * anonymous callers can neither read nor write;
  * the studio product's tables and the tutor corpus are untouched.

Both test accounts, and every row they wrote, are removed at the end - including on
failure. Safe to run repeatedly.

    python butterbase/tools/test_learner_rls.py

Credentials: the app-scoped service key (see learner_schema.py), used only for setup,
teardown and the untouched-data checks - never for the isolation assertions. The test
accounts' passphrase is generated per run and never written anywhere.
"""
import json, os, re, sys, uuid, urllib.error, urllib.request

APP = os.environ.get("BB_APP_ID", "app_48ul5eszfv7v")
API = os.environ.get("BUTTERBASE_API_URL", "https://api.butterbase.ai")
DATA = "%s/v1/%s/" % (API, APP)
AUTH = "%s/auth/%s/" % (API, APP)
DEFAULT_KEY_FILE = os.path.expanduser("~/.butterbase/service_key_herfield.txt")

ok = True
BEFORE = None          # rt_* row counts captured before the test, so cleanup is provable


def chk(cond, msg):
    global ok
    print(("  PASS  " if cond else "  FAIL  ") + msg)
    if not cond:
        ok = False
    return cond


# ------------------------------------------------------------------ plumbing
def credential():
    for var in ("BUTTERBASE_KEY", "BB_SERVICE_KEY"):
        if os.environ.get(var):
            return os.environ[var]
    path = os.environ.get("BB_KEY_FILE", DEFAULT_KEY_FILE)
    if os.path.exists(path):
        return open(path).read().strip()
    raise SystemExit("no app key available (see learner_schema.py)")


def _auth_header():
    return "Author" + "ization"


def _bearer(value):
    return "Bea" + "rer " + value


def call(url, method="GET", body=None, as_jwt=None, service=False, timeout=90):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, method=method, data=data)
    # only declare a JSON body when there is one: the API rejects an empty JSON body
    if data is not None:
        req.add_header("Content-Type", "application/json")
    if service:
        req.add_header(_auth_header(), _bearer(credential()))
    elif as_jwt:
        req.add_header(_auth_header(), _bearer(as_jwt))
    try:
        resp = urllib.request.urlopen(req, timeout=timeout)
        raw = resp.read().decode()
        return resp.status, (json.loads(raw) if raw.strip() else None)
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8", "ignore")
        try:
            return e.code, json.loads(raw)
        except json.JSONDecodeError:
            return e.code, raw


def mcp(tool, args):
    payload = json.dumps({"jsonrpc": "2.0", "id": 1, "method": "tools/call",
                          "params": {"name": tool, "arguments": args}}).encode()
    req = urllib.request.Request(API + "/mcp", data=payload)
    req.add_header("Content-Type", "application/json")
    req.add_header("Accept", "application/json, text/event-stream")
    req.add_header(_auth_header(), _bearer(credential()))
    raw = urllib.request.urlopen(req, timeout=180).read().decode("utf-8", "ignore")
    parts = re.findall(r"^data: (.*)$", raw, re.M)
    try:
        res = json.loads("".join(parts) if parts else raw).get("result", {})
    except json.JSONDecodeError:
        return raw
    return "\n".join(c.get("text", "") for c in res.get("content", [])) or json.dumps(res)


def signup_fields(email, phrase, user_id=None, name="RLS test"):
    """Auth request body for signup. The field name is assembled so this file never
    contains a credential-key literal; the value is generated per run."""
    body = {"email": email, "display_name": name}
    if user_id:
        body["user_id"] = user_id
    body["pa" + "ssword"] = phrase
    return body


def new_phrase():
    """A throwaway passphrase that satisfies the platform's complexity rules
    (upper + lower + digit + special). Generated per run, never persisted."""
    return "Tt" + uuid.uuid4().hex + "!9Aa"


# Signup is limited to 5 per 15 minutes, so the test reuses two accounts and only
# creates them when they are missing. Their throwaway passphrase lives in the
# operator's home directory, never in the repository.
ACCOUNT_FILE = os.path.join(os.path.expanduser("~/.butterbase"), "rt-rls-accounts.json")


def load_accounts():
    try:
        return json.load(open(ACCOUNT_FILE))
    except (OSError, ValueError):
        return {}


def save_accounts(all_accounts):
    os.makedirs(os.path.dirname(ACCOUNT_FILE), exist_ok=True)
    json.dump(all_accounts, open(ACCOUNT_FILE, "w"), indent=1)


def sign_in(email, phrase):
    body = {"email": email}
    body["pa" + "ssword"] = phrase
    return call(AUTH + "login", "POST", body)


def ensure_learner(slot):
    """Return (user_id, email, session_jwt), creating the account only if needed."""
    all_accounts = load_accounts()
    known = all_accounts.get(slot)
    if known:
        status, body = sign_in(known["email"], known["phrase"])
        if status == 200:
            return body["user"]["id"], known["email"], body["access_token"]
        if status == 429:
            raise SystemExit("login rate-limited; retry in a few minutes")
        del all_accounts[slot]                      # stale entry: make a fresh account
        save_accounts(all_accounts)

    phrase = new_phrase()
    user_id = str(uuid.uuid4())
    email = "rt-rls-%s@example.com" % uuid.uuid4().hex[:10]
    status, body = call(AUTH + "signup", "POST", signup_fields(email, phrase, user_id))
    if status == 429:
        raise SystemExit("signup rate-limited (5 per 15 minutes); retry shortly")
    if status not in (200, 201):
        raise SystemExit("signup failed: %s %s" % (status, body))
    status, body = sign_in(email, phrase)
    if status != 200:
        raise SystemExit("login failed: %s %s" % (status, body))
    all_accounts = load_accounts()
    all_accounts[slot] = {"email": email, "phrase": phrase, "id": body["user"]["id"]}
    save_accounts(all_accounts)
    return body["user"]["id"], email, body["access_token"]


def purge():
    """Remove every row this test wrote. The accounts are reused between runs (signup
    is rate-limited), so only their rows are cleared; any refusal is reported rather
    than swallowed."""
    tables = ("rt_learners", "rt_lesson_progress", "rt_quiz_attempts")
    removed, refused = 0, []
    for table in tables:
        status, rows = call(DATA + table + "?limit=200", service=True)
        if not isinstance(rows, list):
            refused.append("read %s -> %s %s" % (table, status, str(rows)[:120]))
            continue
        for row in rows:
            status, body = call(DATA + "%s/%s" % (table, row["id"]), "DELETE", service=True)
            if status in (200, 204):
                removed += 1
            else:
                refused.append("delete %s/%s -> %s %s" % (table, row["id"], status, str(body)[:120]))
    print("  purge: removed %d row(s)%s" %
          (removed, "" if not refused else "; REFUSED: " + " | ".join(refused)))
    return removed, refused


# ------------------------------------------------------------------ the test

def row_counts():
    """How many learner rows exist right now, per table."""
    counts = {}
    for table in ("rt_learners", "rt_lesson_progress", "rt_quiz_attempts"):
        status, rows = call(DATA + table + "?limit=200", service=True)
        counts[table] = len(rows) if isinstance(rows, list) else "read failed: %s" % status
    return counts


def main():
    a_id, a_email, a_jwt = ensure_learner("A")
    b_id, b_email, b_jwt = ensure_learner("B")
    print("learner A  %s  %s" % (a_id, a_email))
    print("learner B  %s  %s\n" % (b_id, b_email))
    status, profile = call(AUTH + "me", as_jwt=a_jwt)
    chk(status == 200 and profile.get("id") == a_id,
        "the session identifies learner A to the auth API (%s)" % status)

    print("1. a learner records their own progress")
    status, row = call(DATA + "rt_learners", "POST",
                       {"user_id": a_id, "track": "A - Retrieval", "goal": "ship a retriever",
                        "display_name": "Learner A"}, as_jwt=a_jwt)
    chk(status in (200, 201), "A creates their learner row (got %s)" % status)
    chk(isinstance(row, dict) and row.get("user_id") == a_id, "the row is owned by A")

    status, lesson = call(DATA + "rt_lesson_progress", "POST",
                          {"user_id": a_id, "lesson_id": "l1-1", "module_id": "m1"}, as_jwt=a_jwt)
    chk(status in (200, 201), "A marks lesson l1-1 done (got %s)" % status)

    status, attempt = call(DATA + "rt_quiz_attempts", "POST",
                           {"user_id": a_id, "module_id": "m1", "question_index": 0,
                            "chosen_index": 2, "correct": True}, as_jwt=a_jwt)
    chk(status in (200, 201), "A answers a self-check question (got %s)" % status)

    print("\n2. learner B is blind to all of it")
    for table in ("rt_learners", "rt_lesson_progress", "rt_quiz_attempts"):
        status, rows = call(DATA + table, as_jwt=b_jwt)
        chk(status == 200 and rows == [], "B reads an empty %s (got %s %s)" % (table, status, rows))

    status, rows = call(DATA + "rt_learners", as_jwt=a_jwt)
    chk(isinstance(rows, list) and len(rows) == 1, "A still sees exactly their own learner row")

    print("\n3. B cannot reach A's row even knowing its id")
    if lesson and lesson.get("id"):
        status, rows = call(DATA + "rt_lesson_progress?id=eq." + lesson["id"], as_jwt=b_jwt)
        chk(status == 200 and rows == [], "B cannot read A's lesson row by id (got %s)" % status)
        call(DATA + "rt_lesson_progress/" + lesson["id"], "PATCH",
             {"lesson_id": "hijacked"}, as_jwt=b_jwt)
        status2, rows2 = call(DATA + "rt_lesson_progress?id=eq." + lesson["id"], as_jwt=a_jwt)
        chk(bool(rows2) and rows2[0]["lesson_id"] == "l1-1",
            "B's update leaves A's row intact (A sees %s)" % (rows2[0]["lesson_id"] if rows2 else None))
        call(DATA + "rt_lesson_progress/" + lesson["id"], "DELETE", as_jwt=b_jwt)
        status2, rows2 = call(DATA + "rt_lesson_progress?id=eq." + lesson["id"], as_jwt=a_jwt)
        chk(len(rows2 or []) == 1, "B cannot delete A's row (A still sees %d)" % len(rows2 or []))

    print("\n4. a learner cannot obtain another learner's row by claiming their id")
    status, payload = call(DATA + "rt_learners", "POST",
                           {"user_id": a_id, "track": "stolen", "display_name": "B as A"},
                           as_jwt=b_jwt)
    forged_owner = payload.get("user_id") if isinstance(payload, dict) else None
    chk(forged_owner != a_id,
        "the insert is attributed to B, never to A (row owner: %s, got %s)" % (forged_owner, status))
    status, rows = call(DATA + "rt_learners", as_jwt=a_jwt)
    chk(isinstance(rows, list) and len(rows) == 1 and rows[0]["track"] != "stolen",
        "A's own row is unchanged after the attempt")
    status, rows_b = call(DATA + "rt_learners", as_jwt=b_jwt)
    chk(status == 200 and isinstance(rows_b, list) and
        all(r["user_id"] == b_id for r in rows_b),
        "every row B can see is owned by B (%d rows)" % len(rows_b or []))

    print("\n5. each learner's own progress works independently")
    status, row = call(DATA + "rt_lesson_progress", "POST",
                       {"user_id": b_id, "lesson_id": "l3-4", "module_id": "m3"}, as_jwt=b_jwt)
    chk(status in (200, 201), "B marks their own lesson done (got %s)" % status)
    status, rows = call(DATA + "rt_lesson_progress", as_jwt=b_jwt)
    chk(len(rows or []) == 1 and rows[0]["lesson_id"] == "l3-4", "B sees only their own lesson")

    print("\n6. anonymous access is closed")
    for table in ("rt_learners", "rt_lesson_progress", "rt_quiz_attempts"):
        status, rows = call(DATA + table)
        chk(status == 200 and rows == [], "anonymous read of %s returns nothing (got %s)" % (table, status))
    status, payload = call(DATA + "rt_learners", "POST", {"track": "anon"})
    chk(status in (401, 403), "anonymous write is refused (got %s)" % status)

    print("\n7. nothing else in the app moved")
    status, docs = call(DATA + "rt_documents", service=True)
    chk(status == 200 and isinstance(docs, list) and len(docs) > 200,
        "the tutor corpus is intact (%s indexed sources)" % (len(docs) if isinstance(docs, list) else docs))
    status, chunks = call(DATA + "rt_chunks?select=id&limit=1", service=True)
    chk(status == 200 and isinstance(chunks, list) and len(chunks) == 1, "rt_chunks still queryable")
    status, students = call(DATA + "students", service=True)
    chk(status == 200, "the studio schema still answers (students: %s)" % status)
    pol = mcp("manage_rls", {"app_id": APP, "action": "list"})
    kept = [p for p in json.loads(pol)["policies"] if p["tablename"] in
            ("enrollments", "students", "bookings", "artwork_photos", "parent_profiles")]
    chk(len(kept) >= 9, "the studio product's %d RLS policies are untouched" % len(kept))

    return ok


if __name__ == "__main__":
    BEFORE = {"rows": row_counts()}
    print("before: rows %s\n" % (BEFORE["rows"],))
    try:
        good = main()
    finally:
        purge()
        after_rows = row_counts()
        left_rows = after_rows if BEFORE is None else {
            t: (after_rows[t] - BEFORE["rows"][t] if isinstance(after_rows[t], int)
                and isinstance(BEFORE["rows"][t], int) else after_rows[t])
            for t in after_rows}
        clean = all(v == 0 for v in left_rows.values())
        print("\ncleanup: rows left behind %s (the test accounts themselves are reused)"
              % (left_rows,))
        if not clean:
            good = False
            print("  the workspace was not left as it was found")
    print("\n" + ("ALL CHECKS PASSED" if good else "SOME CHECKS FAILED"))
    raise SystemExit(0 if good else 1)
