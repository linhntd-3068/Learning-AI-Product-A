"""Load docs/lab5/backlog.json into GitHub: epic + task issues (tasks as sub-issues of their epic),
add them to the GitHub Project and fill the custom fields. Safe to re-run: issues already recorded in
docs/lab5/github-map.json are not created again, only their project fields are refreshed.

Usage (from repo root, gh logged in with the `project` scope):
    python scripts/github-project/load_backlog_to_github_project.py
"""
import json
import pathlib
import shutil
import subprocess
import sys

OWNER, REPO, PROJECT = "linhntd-3068", "Learning-AI-Product-A", 1
ROOT = pathlib.Path(__file__).resolve().parents[2]
BACKLOG = ROOT / "docs" / "lab5" / "backlog.json"
MAP = ROOT / "docs" / "lab5" / "github-map.json"
GH = shutil.which("gh") or r"C:\Program Files\GitHub CLI\gh.exe"


def gh(*args, input_text=None):
    r = subprocess.run([GH, *args], input=input_text, capture_output=True, text=True, encoding="utf-8")
    if r.returncode != 0:
        raise RuntimeError(f"gh {' '.join(args[:3])}… failed: {r.stderr.strip()}")
    return r.stdout.strip()


def gql(query, **vars):
    args = ["api", "graphql", "-f", f"query={query}"]
    for k, v in vars.items():
        args += ["-F" if isinstance(v, (int, float)) else "-f", f"{k}={v}"]
    return json.loads(gh(*args))


def project_meta():
    data = json.loads(gh("project", "view", str(PROJECT), "--owner", OWNER, "--format", "json"))
    fields = json.loads(gh("project", "field-list", str(PROJECT), "--owner", OWNER, "--format", "json", "--limit", "50"))["fields"]
    return data["id"], {f["name"]: f for f in fields}


def ensure_select_field(fields, name, options):
    """Create a single-select field, or add missing options to an existing one."""
    opts = list(dict.fromkeys(o for o in options if o))
    if name not in fields:
        gh("project", "field-create", str(PROJECT), "--owner", OWNER, "--name", name,
           "--data-type", "SINGLE_SELECT", "--single-select-options", ",".join(opts))
        return
    have = [o["name"] for o in fields[name].get("options", [])]
    missing = [o for o in opts if o not in have]
    if missing:
        all_opts = ",".join(f'{{name:{json.dumps(o)},color:GRAY,description:""}}' for o in have + missing)
        gql(f'mutation($f:ID!){{updateProjectV2Field(input:{{fieldId:$f,singleSelectOptions:[{all_opts}]}}){{clientMutationId}}}}',
            f=fields[name]["id"])


def short(text, n=48):
    return text if len(text) <= n else text[: n - 1] + "…"


def epic_option(e):
    return short(f"{e['id']} {e['title']}")


def issue_body_task(t, epic_title):
    sub = "\n".join(f"- [ ] {s}" for s in t.get("subtasks", []))
    refs = ", ".join(t.get("source_refs", []) or []) or "—"
    deps = ", ".join(t.get("depends_on", []) or []) or "—"
    return (f"**Epic:** {epic_title}\n\n{t.get('description', '')}\n\n### Subtask\n{sub}\n\n"
            f"| Story Points | Ước lượng (giờ) | Ưu tiên | Vai trò | Tầng | Ràng buộc đặc thù |\n|---|---|---|---|---|---|\n"
            f"| {t['story_points']} | {t['hours']} | {t.get('priority', '')} | {t.get('role', '')} | {t.get('layer', '')} | {t.get('special_constraint', '—')} |\n\n"
            f"**Nguồn thiết kế:** {refs}\n\n**Phụ thuộc:** {deps}\n\n### Định nghĩa xong (DoD)\n{t.get('definition_of_done', '')}\n\n"
            f"_Mã task: `{t['id']}` — sinh từ `docs/lab5/backlog.json`._")


def issue_body_epic(e, tasks):
    sp = sum(t["story_points"] for t in tasks)
    h = sum(t["hours"] for t in tasks)
    return (f"{e.get('goal', '')}\n\n**Phạm vi:** {e.get('scope', '—')}\n\n**Ràng buộc đặc thù:** {e.get('special_constraint', '—')}\n\n"
            f"**Tổng:** {len(tasks)} task · {sp} SP · {h} giờ\n\nTask con nằm ở mục Sub-issues bên dưới.\n\n_Mã epic: `{e['id']}`._")


def labels_for(item, kind):
    labels = [kind]
    if item.get("priority"):
        labels.append(item["priority"])
    flag = item.get("special_constraint")
    if flag and flag != "—":
        labels.append(f"đặc thù: {flag}")
    return labels


def create_issue(title, body, labels):
    url = gh("issue", "create", "--repo", f"{OWNER}/{REPO}", "--title", title, "--body-file", "-",
             "--label", ",".join(labels), input_text=body)
    number = int(url.rstrip("/").split("/")[-1])
    info = json.loads(gh("api", f"repos/{OWNER}/{REPO}/issues/{number}"))
    return {"number": number, "id": info["id"], "node_id": info["node_id"], "url": url}


def add_to_project(project_id, node_id):
    """Add an issue to the project, or return its existing item: GitHub auto-adds a sub-issue to the
    project when its parent epic is already there, and then addProjectV2ItemById fails with 'already exists'."""
    try:
        r = gql("mutation($p:ID!,$c:ID!){addProjectV2ItemById(input:{projectId:$p,contentId:$c}){item{id}}}", p=project_id, c=node_id)
        return r["data"]["addProjectV2ItemById"]["item"]["id"]
    except RuntimeError as e:
        if "already exists" not in str(e):
            raise
    r = gql("query($c:ID!){node(id:$c){... on Issue{projectItems(first:20){nodes{id project{id}}}}}}", c=node_id)
    return next(n["id"] for n in r["data"]["node"]["projectItems"]["nodes"] if n["project"]["id"] == project_id)


def find_existing_issues():
    """Issues already in the repo, keyed by title — lets a re-run adopt an issue created before a crash."""
    out = json.loads(gh("issue", "list", "--repo", f"{OWNER}/{REPO}", "--state", "all", "--limit", "1000", "--json", "number,title"))
    return {i["title"]: i["number"] for i in out}


def adopt_issue(number):
    info = json.loads(gh("api", f"repos/{OWNER}/{REPO}/issues/{number}"))
    return {"number": number, "id": info["id"], "node_id": info["node_id"], "url": info["html_url"]}


def set_fields(project_id, item_id, values, fields):
    """values: {field name: str|number}. One GraphQL request with an alias per field."""
    parts = []
    for i, (name, val) in enumerate(values.items()):
        if val is None or name not in fields:
            continue
        f = fields[name]
        if "options" in f:
            opt = next((o["id"] for o in f["options"] if o["name"] == val), None)
            if not opt:
                continue
            v = f'{{singleSelectOptionId:"{opt}"}}'
        elif isinstance(val, (int, float)):
            v = f"{{number:{val}}}"
        else:
            v = f"{{text:{json.dumps(str(val), ensure_ascii=False)}}}"
        parts.append(f'a{i}:updateProjectV2ItemFieldValue(input:{{projectId:"{project_id}",itemId:"{item_id}",fieldId:"{f["id"]}",value:{v}}}){{clientMutationId}}')
    if parts:
        gql("mutation{" + " ".join(parts) + "}")


def main():
    backlog = json.loads(BACKLOG.read_text(encoding="utf-8"))
    mapping = json.loads(MAP.read_text(encoding="utf-8")) if MAP.exists() else {}
    epics = {e["id"]: e for e in backlog["epics"]}
    tasks = backlog["tasks"]
    sprint_of = {tid: s["name"] for s in backlog.get("sprints", []) for tid in s.get("task_ids", [])}
    status_of = backlog.get("simulation", {}).get("status", {})

    existing = find_existing_issues()
    project_id, fields = project_meta()
    ensure_select_field(fields, "Epic", [epic_option(e) for e in backlog["epics"]])
    ensure_select_field(fields, "Đặc thù", [t.get("special_constraint") for t in tasks] + [e.get("special_constraint") for e in backlog["epics"]])
    ensure_select_field(fields, "Sprint", [s["name"] for s in backlog.get("sprints", [])] + ["Backlog"])
    project_id, fields = project_meta()

    def save():
        MAP.write_text(json.dumps(mapping, ensure_ascii=False, indent=1), encoding="utf-8")

    for e in backlog["epics"]:
        etasks = [t for t in tasks if t["epic"] == e["id"]]
        if e["id"] not in mapping:
            rec = create_issue(f"[EPIC] {e['id']} {e['title']}", issue_body_epic(e, etasks), labels_for(e, "epic"))
            rec["item_id"] = add_to_project(project_id, rec["node_id"])
            mapping[e["id"]] = rec
            save()
            print("epic", e["id"], "#", rec["number"], flush=True)
        set_fields(project_id, mapping[e["id"]]["item_id"], {
            "Loại": "Epic", "Epic": epic_option(e), "Đặc thù": e.get("special_constraint"),
            "Story Points": sum(t["story_points"] for t in etasks), "Estimate (h)": sum(t["hours"] for t in etasks),
            "Status": status_of.get(e["id"], "Backlog"),
        }, fields)

    for t in tasks:
        e = epics[t["epic"]]
        if t["id"] not in mapping:
            title = f"[{t['id']}] {t['title']}"
            adopted = title in existing
            if adopted:
                rec = adopt_issue(existing[title])
            else:
                rec = create_issue(title, issue_body_task(t, f"{e['id']} {e['title']}"), labels_for(t, "task"))
            try:
                gh("api", "-X", "POST", f"repos/{OWNER}/{REPO}/issues/{mapping[e['id']]['number']}/sub_issues", "-F", f"sub_issue_id={rec['id']}")
            except RuntimeError as err:
                if not adopted:  # an adopted issue was linked before the crash
                    raise
            rec["item_id"] = add_to_project(project_id, rec["node_id"])
            mapping[t["id"]] = rec
            save()
            print("task", t["id"], "#", rec["number"], flush=True)
        sim = backlog.get("simulation", {})
        set_fields(project_id, mapping[t["id"]]["item_id"], {
            "Loại": "Task", "Epic": epic_option(e), "Đặc thù": t.get("special_constraint"),
            "Story Points": t["story_points"], "Estimate (h)": t["hours"],
            "Priority": t.get("priority"), "Role": t.get("role"), "Layer": t.get("layer"),
            "Sprint": sprint_of.get(t["id"], "Backlog"),
            "Phụ trách (giả định)": t.get("assignee") or sim.get("assignee", {}).get(t["id"]),
            "Status": status_of.get(t["id"], "Todo" if t["id"] in sprint_of else "Backlog"),
            "Actual (h)": sim.get("actual_hours", {}).get(t["id"]),
            "Remaining (h)": sim.get("remaining_hours", {}).get(t["id"]),
        }, fields)
    save()
    print("done:", len(backlog["epics"]), "epics,", len(tasks), "tasks")


if __name__ == "__main__":
    sys.exit(main())
