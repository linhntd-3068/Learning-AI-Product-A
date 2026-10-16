"""Simulate Sprint 1 of the LAB-5 backlog day by day and write the result back into docs/lab5/backlog.json
under "simulation" (status, actual / remaining hours, assignee per task, daily burndown, events).

The simulation is deterministic and clearly labelled as SIMULATED in every output: it exists so the
progress report and the GitHub Project board show a realistic mid-project state, not real work done.

Usage: python scripts/github-project/simulate_sprint_progress.py
"""
import datetime as dt
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
BACKLOG = ROOT / "docs" / "lab5" / "backlog.json"

# Hypothetical team (names are placeholders, not real people).
PERSONAS = {"BrSE": ["BrSE Linh"], "BE": ["BE An", "BE Bình"], "FE": ["FE Chi", "FE Dũng"], "QA": ["QA Hà"], "Infra": ["BE An"]}
FOCUS_HOURS_PER_DAY = 5.6  # 8 h day × 0.7 focus factor (same as backlog capacity)

# Events that make the sprint realistic. Matched against task fields; each is applied once.
EVENTS = [
    {"id": "EV-1", "day": 1, "kind": "blocked_at_finish", "match": lambda t: t["id"] == "T-INC-01",
     "note": "Spec 完納奨励金 không chốt được: khách chưa trả lời Q16 (bảng tỷ lệ, 支払期日) và Q17 (cách biết đã trả tiền)"},
    {"id": "EV-2", "day": 2, "kind": "overrun", "factor": 1.6, "match": lambda t: t["id"] == "T-BDAY-02",
     "note": "Hàm ngày nghiệp vụ JST đụng nhiều hàm fn_* hơn dự kiến (trạng thái closing / reopened)"},
    {"id": "EV-3", "day": 5, "kind": "overrun", "factor": 1.5, "match": lambda t: t["id"] == "T-QUAL-03",
     "note": "Migrate basis cũ sang participant_qualifications: 買出人 thiếu hạn tham gia (mâu thuẫn M1 trong RFP), phải hỏi lại"},
    {"id": "EV-4", "day": 1, "kind": "review_wait", "match": lambda t: t["id"] == "T-BDAY-05",
     "note": "Review UI đổi ngày nghiệp vụ chậm: reviewer phía khách nghỉ phép, task nằm ở In Review qua cuối sprint"},
]


def workdays(start, n):
    d, out = start, []
    while len(out) < n:
        if d.weekday() < 5:
            out.append(d)
        d += dt.timedelta(days=1)
    return out


def main():
    b = json.loads(BACKLOG.read_text(encoding="utf-8"))
    s1 = b["sprints"][0]
    start = dt.date.fromisoformat(s1["start"])
    days = workdays(start, 10)
    by_id = {t["id"]: t for t in b["tasks"]}
    sprint_tasks = [by_id[i] for i in s1["task_ids"] if i in by_id]

    # Assign personas round-robin within each role, keeping backlog order (priority first).
    order = sorted(sprint_tasks, key=lambda t: ({"P0": 0, "P1": 1, "P2": 2}.get(t.get("priority"), 3), s1["task_ids"].index(t["id"])))
    rr, assignee = {}, {}
    for t in order:
        people = PERSONAS.get(t.get("role"), PERSONAS["BE"])
        assignee[t["id"]] = people[rr.get(t.get("role"), 0) % len(people)]
        rr[t.get("role")] = rr.get(t.get("role"), 0) + 1

    effort = {t["id"]: float(t["hours"]) for t in sprint_tasks}       # real effort the work turns out to need
    spent = {t["id"]: 0.0 for t in sprint_tasks}
    state = {t["id"]: "Todo" for t in sprint_tasks}
    note, applied, effect_day = {}, set(), {}
    finished_day = {}

    def deps_done(t):
        return all(state.get(d, "Done") == "Done" for d in t.get("depends_on", []) if d in state)

    burndown = []
    total_planned = sum(t["hours"] for t in sprint_tasks)
    for di, day in enumerate(days, start=1):
        for ev in EVENTS:
            if ev["id"] in applied or di < ev["day"]:
                continue
            target = next((t for t in order if ev["match"](t) and state[t["id"]] != "Done"), None)
            if not target:
                continue
            applied.add(ev["id"])
            tid = target["id"]
            if ev["kind"] == "overrun":
                effort[tid] = round(effort[tid] * ev["factor"], 1)
            elif ev["kind"] == "blocked":
                state[tid] = "Blocked"
            note[tid] = f"{ev['id']}: {ev['note']}"
            ev["task"] = tid
            if ev["kind"] == "overrun":
                effect_day[tid] = di
        capacity = {p: FOCUS_HOURS_PER_DAY for ps in PERSONAS.values() for p in ps}
        for t in order:
            tid = t["id"]
            if state[tid] in ("Done", "Blocked", "In Review") or not deps_done(t):
                continue
            p = assignee[tid]
            if capacity[p] <= 0:
                continue
            state[tid] = "In Progress"
            work = min(capacity[p], effort[tid] - spent[tid])
            spent[tid] += work
            capacity[p] -= work
            if spent[tid] >= effort[tid] - 1e-6:
                if any(ev.get("task") == tid and ev["kind"] == "blocked_at_finish" for ev in EVENTS):
                    spent[tid] = effort[tid] - 1  # last hour (sign-off with the customer) cannot be done
                    state[tid] = "Blocked"
                    effect_day.setdefault(tid, di)
                    continue
                held = any(ev.get("task") == tid and ev["kind"] == "review_wait" for ev in EVENTS)
                state[tid] = "In Review" if held else "Done"
                if held:
                    effect_day.setdefault(tid, di)
                if not held:
                    finished_day[tid] = di
        # Remaining effort of every task not yet Done (In Review has no dev effort left but is not done in SP terms).
        remaining = sum(max(effort[i] - spent[i], 0) for i in effort if state[i] != "Done")
        burndown.append({"day": di, "date": day.isoformat(),
                         "ideal_remaining_h": round(total_planned * (1 - di / len(days)), 1),
                         "actual_remaining_h": round(remaining, 1),
                         "done_sp": sum(by_id[i]["story_points"] for i in state if state[i] == "Done")})

    sim = {
        "label": "SIMULATED — số liệu giả lập cho báo cáo mẫu LAB-5, không phải công việc đã làm thật",
        "sprint": s1["name"], "report_date": days[-1].isoformat(),
        "focus_hours_per_day": FOCUS_HOURS_PER_DAY, "personas": PERSONAS,
        "status": state, "assignee": assignee,
        "actual_hours": {i: round(spent[i], 1) for i in spent},
        "remaining_hours": {i: round(max(effort[i] - spent[i], 0), 1) for i in spent},
        "reestimated_hours": {i: effort[i] for i in effort if effort[i] != by_id[i]["hours"]},
        "notes": note, "finished_day": finished_day,
        "events": [dict({k: v for k, v in ev.items() if k != "match"}, effect_day=effect_day.get(ev.get("task"), ev["day"]))
                   for ev in EVENTS if ev["id"] in applied],
        "burndown": burndown,
        "committed": {"tasks": len(sprint_tasks), "sp": sum(t["story_points"] for t in sprint_tasks), "hours": total_planned},
        "completed": {"tasks": sum(1 for v in state.values() if v == "Done"),
                      "sp": sum(by_id[i]["story_points"] for i, v in state.items() if v == "Done")},
    }
    b["simulation"] = sim
    BACKLOG.write_text(json.dumps(b, ensure_ascii=False, indent=1), encoding="utf-8")
    c, d = sim["committed"], sim["completed"]
    print(f"Sprint 1: committed {c['tasks']} tasks / {c['sp']} SP / {c['hours']} h; done {d['tasks']} tasks / {d['sp']} SP")
    print("status:", {k: sum(1 for v in state.values() if v == k) for k in set(state.values())})
    print("events:", [(e["id"], e.get("task")) for e in sim["events"]])


if __name__ == "__main__":
    main()
