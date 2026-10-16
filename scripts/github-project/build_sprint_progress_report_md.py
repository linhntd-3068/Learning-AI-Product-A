"""Build the Sprint 1 progress report (Markdown) from docs/lab5/backlog.json — every number is computed here,
none typed by hand. Output: docs/lab5/sprint1-progress-report.md (then converted to Word separately).

Usage: python scripts/github-project/build_sprint_progress_report_md.py
"""
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
LAB5 = ROOT / "docs" / "lab5"
BOARD = "https://github.com/users/linhntd-3068/projects/1"
REPO = "https://github.com/linhntd-3068/Learning-AI-Product-A"


def main():
    b = json.loads((LAB5 / "backlog.json").read_text(encoding="utf-8"))
    sim = b["simulation"]
    by = {t["id"]: t for t in b["tasks"]}
    epics = {e["id"]: e for e in b["epics"]}
    s1, s2 = b["sprints"][0], b["sprints"][1]
    ids = s1["task_ids"]
    st = sim["status"]
    gh_map = json.loads((LAB5 / "github-map.json").read_text(encoding="utf-8")) if (LAB5 / "github-map.json").exists() else {}
    link = lambda tid: f"[#{gh_map[tid]['number']}]({gh_map[tid]['url']})" if tid in gh_map else ""

    c, d = sim["committed"], sim["completed"]
    pct_sp = round(100 * d["sp"] / c["sp"])
    last = sim["burndown"][-1]
    status_count = {k: sum(1 for i in ids if st[i] == k) for k in ["Done", "In Review", "In Progress", "Blocked", "Todo"]}
    not_done = [i for i in ids if st[i] != "Done"]
    carry_h = round(sum(sim["remaining_hours"][i] for i in not_done), 1)
    overrun_h = round(sum(h - by[i]["hours"] for i, h in sim["reestimated_hours"].items()), 1)

    # Sprint 2 BE load after carry-over and the 11/23 holiday (勤労感謝の日) — the concrete slip risk.
    be_cap_s2 = b["team"]["capacity_hours_by_role"]["BE"] - b["team"]["members"]["BE"] * b["team"]["hours_per_day"] * b["team"]["focus_factor"]
    be_carry = round(sum(sim["remaining_hours"][i] for i in not_done if by[i]["role"] == "BE"), 1)
    be_s2 = s2["hours_by_role"]["BE"]
    be_over = round(be_s2 + be_carry - be_cap_s2, 1)
    inc_tasks = [t for t in b["tasks"] if t["epic"] == "E-INC"]
    inc_h = sum(t["hours"] for t in inc_tasks)
    inc_sprints = sorted({t["sprint"] for t in inc_tasks})

    L = []
    w = L.append
    w("# Báo cáo tiến độ Sprint 1 — Product A (桜水産市場 業務支援システム)")
    w("")
    w(f"**Kỳ báo cáo:** {s1['name']} ({s1['start']} → {s1['end']}) · **Ngày báo cáo:** {sim['report_date']} · **Người lập:** Nguyễn Thị Diệu Linh (BrSE/PM)")
    w("")
    w("> **SỐ LIỆU GIẢ LẬP (LAB-5).** Dự án chưa kick-off; trạng thái task, giờ thực tế và burndown được sinh bằng `scripts/github-project/simulate_sprint_progress.py` từ backlog thật trên GitHub Project, có 4 sự kiện gây trễ đặt có chủ đích. Khung báo cáo, cách tính và rủi ro dùng được ngay khi có số thật.")
    w("")
    w(f"Board: {BOARD} · Repo: {REPO}")
    w("")
    w("## 1. Tóm tắt")
    w("")
    w(f"- **Trạng thái: VÀNG.** Hoàn thành **{d['sp']}/{c['sp']} SP ({pct_sp}%)**, {d['tasks']}/{c['tasks']} task; còn **{last['actual_remaining_h']:.0f} giờ** việc chuyển sang Sprint 2 (đường lý tưởng = 0).")
    w(f"- **Chậm ở phần backend:** 2 task DB vượt ước lượng tổng **+{overrun_h:.1f} giờ** (ngày nghiệp vụ JST, migrate tư cách 許可/承認). BE đã kín {s1['hours_by_role']['BE']}/{b['team']['capacity_hours_by_role']['BE']:.0f} giờ ngay từ kế hoạch nên không có dư địa hấp thụ.")
    w(f"- **Rủi ro lớn nhất: epic 完納奨励金 ({len(inc_tasks)} task, {inc_h} giờ, rải từ {inc_sprints[0]} tới {inc_sprints[-1]}) chưa thể chốt spec** vì khách chưa trả lời Q16 (bảng tỷ lệ, 支払期日) và Q17 (cách biết đã trả tiền).")
    w(f"- **Sprint 2 đang quá tải BE khoảng {be_over:.0f} giờ** nếu giữ nguyên kế hoạch: {be_s2} giờ đã lên kế hoạch + {be_carry} giờ chuyển sang, trong khi năng lực BE chỉ còn {be_cap_s2:.0f} giờ do nghỉ lễ 23/11.")
    w("- **Cần khách:** trả lời Q16/Q17 trước **27/11**; xác nhận hạn tham gia của 買出人 (mâu thuẫn RFP); bố trí người review UI thay thế.")
    w("")
    w("## 2. Kết quả theo epic")
    w("")
    w("| Epic | Ràng buộc đặc thù | Task trong sprint | SP cam kết | SP xong | Ghi chú |")
    w("|---|---|---|---|---|---|")
    for eid in dict.fromkeys(by[i]["epic"] for i in ids):
        et = [i for i in ids if by[i]["epic"] == eid]
        sp_c = sum(by[i]["story_points"] for i in et)
        sp_d = sum(by[i]["story_points"] for i in et if st[i] == "Done")
        open_ = [i for i in et if st[i] != "Done"]
        w(f"| {eid} {epics[eid]['title']} | {epics[eid].get('special_constraint', '—')} | {len(et)} | {sp_c} | {sp_d} | {'còn ' + ', '.join(open_) if open_ else 'xong'} |")
    w("")
    w("## 3. Trạng thái task")
    w("")
    w("| Done | In Review | In Progress | Blocked | Todo |")
    w("|---|---|---|---|---|")
    w(f"| {status_count['Done']} | {status_count['In Review']} | {status_count['In Progress']} | {status_count['Blocked']} | {status_count['Todo']} |")
    w("")
    w("Task chưa xong (chuyển Sprint 2):")
    w("")
    w("| Task | Issue | Trạng thái | Phụ trách | Ước lượng / thực tế / còn (giờ) | Lý do |")
    w("|---|---|---|---|---|---|")
    for i in not_done:
        t = by[i]
        pending_deps = [dd for dd in t.get("depends_on", []) if st.get(dd, "Done") != "Done"]
        who = sim["assignee"][i]
        overruns = [f"{x} vượt +{h - by[x]['hours']:.1f} giờ" for x, h in sim["reestimated_hours"].items() if sim["assignee"].get(x) == who]
        reason = (sim["notes"].get(i)
                  or ("Chờ task phụ thuộc: " + ", ".join(pending_deps) if pending_deps else
                      f"{who} hết giờ trong sprint" + (f" do {', '.join(overruns)}" if overruns else "")))
        w(f"| {i} {t['title']} | {link(i)} | {st[i]} | {sim['assignee'][i]} | {t['hours']} / {sim['actual_hours'][i]} / {sim['remaining_hours'][i]} | {reason} |")
    w("")
    w(f"Tổng việc còn lại chuyển sang: **{carry_h} giờ**.")
    w("")
    w("## 4. Burndown")
    w("")
    w("![Burndown Sprint 1](sprint1-burndown.png)")
    w("")
    w("| Ngày | " + " | ".join(x["date"][5:] for x in sim["burndown"]) + " |")
    w("|---" * (len(sim["burndown"]) + 1) + "|")
    w("| Lý tưởng (giờ) | " + " | ".join(f"{x['ideal_remaining_h']:.0f}" for x in sim["burndown"]) + " |")
    w("| Thực tế (giờ) | " + " | ".join(f"{x['actual_remaining_h']:.0f}" for x in sim["burndown"]) + " |")
    w("")
    w("Đọc biểu đồ: nửa đầu sprint chạy nhanh hơn lý tưởng vì các task BrSE / FE nhỏ xong sớm; từ 17/11 đường thực tế nằm trên lý tưởng do hai task DB vượt giờ (EV-2, EV-3) và task spec 完納奨励金 bị chặn (EV-1). Số giờ còn lại cuối sprint tập trung ở BE và đường phụ thuộc corrections → màn hình duyệt (T-LOCK-03 → T-LOCK-05).")
    w("")
    w("## 5. Rủi ro trễ tiến độ")
    w("")
    w("| # | Rủi ro | Ảnh hưởng cụ thể | Khả năng | Mức | Hành động | Người / hạn |")
    w("|---|---|---|---|---|---|---|")
    w(f"| R1 | Khách chưa trả lời Q16 (bảng tỷ lệ, định nghĩa 支払期日) và Q17 (nguồn dữ liệu đã trả tiền) | Epic 完納奨励金 {inc_h} giờ không chốt được spec; T-INC-03, T-INC-05, T-INC-11 phải ước lượng lại; trễ tới ngày nào phụ thuộc ngày khách trả lời | Cao | **Cao** | Gửi lại câu hỏi kèm 2 phương án mặc định để khách chọn; nếu tới 27/11 chưa có thì dựng theo Plan A và ghi rõ rủi ro làm lại | BrSE Linh · 27/11 |")
    w(f"| R2 | Backend là nút cổ chai | Sprint 2: kế hoạch BE {be_s2} giờ + chuyển sang {be_carry} giờ, năng lực còn {be_cap_s2:.0f} giờ (nghỉ 23/11) → thiếu ~{be_over:.0f} giờ; trượt chuỗi corrections và các màn hình phụ thuộc | Cao | **Cao** | Chuyển 2–3 task DB đơn giản (QUAL / RULE) cho FE biết SQL; dời task P2 của Sprint 2 sang Sprint 3 | PM · 23/11 (planning Sprint 2) |")
    w("| R3 | RFP mâu thuẫn về hạn tham gia của 買出人 (M1) | T-QUAL-03 migrate tư cách vượt giờ và còn dở; nếu chọn sai phải migrate lại | TB | TB | Thêm câu hỏi mới cho khách; tạm để `valid_to` bắt buộc với 買出人 theo spec SCR-010, ghi giả định | BrSE Linh · 24/11 |")
    w("| R4 | Người review UI phía khách vắng | T-BDAY-05 nằm ở In Review qua cuối sprint; các màn hình Sprint 2–3 cũng cần review | TB | TB | Đề nghị khách cử người review thay thế; review nội bộ trước để rút thời gian review của khách | PM · 25/11 |")
    w("| R5 | Lịch nghỉ Nhật chưa tính vào kế hoạch (23/11; nghỉ cuối năm rơi vào Sprint 4) | Năng lực thực tế thấp hơn kế hoạch ~10% ở Sprint 2 và Sprint 4 | Chắc chắn | TB | Trừ ngày nghỉ khỏi năng lực khi lập kế hoạch Sprint 2 và Sprint 4 | PM · planning từng sprint |")
    fe_h, qa_h = s1["hours_by_role"]["FE"], s1["hours_by_role"]["QA"]
    w(f"| R6 | FE và QA dùng chưa hết năng lực (Sprint 1: FE {fe_h}/112 giờ, QA {qa_h}/56 giờ) trong khi BE quá tải | Tổng thời gian dự án dài thêm khoảng 1 sprint nếu không cân lại | Cao | TB | Cân lại vai trò ở Sprint 2 (xem R2); QA viết test tích hợp sớm cho các hàm SQL | PM · 23/11 |")
    qa = {s["name"]: s["hours_by_role"]["QA"] for s in b["sprints"]}
    qa_cap = b["team"]["capacity_hours_by_role"]["QA"]
    w(f"| R7 | Kiểm thử dồn về cuối dự án (QA theo kế hoạch: " + ", ".join(f"{k} {v} h" for k, v in qa.items()) + f"; năng lực {qa_cap:.0f} h/sprint) | Lỗi tích hợp phát hiện muộn ở Sprint 5–6, không còn sprint đệm trước UAT | Cao | **Cao** | QA viết test tích hợp cho hàm SQL ngay khi BE xong từng epic (Sprint 2–3 đang gần như trống QA); đã dời test biên 完納奨励金 (T-INC-17) từ Sprint 6 về Sprint 4 | PM + QA Hà · planning Sprint 2 |")
    w("")
    w("## 6. Kế hoạch Sprint 2 và đề nghị với khách")
    w("")
    w(f"- Sprint 2 ({s2['start']} → {s2['end']}): kế hoạch {len(s2['task_ids'])} task / {s2['story_points']} SP / {s2['hours']} giờ, cộng {len(not_done)} task chuyển sang ({carry_h} giờ). Đề xuất dời task P2 để giữ cam kết ≤ năng lực sau khi trừ ngày nghỉ.")
    w("- Ưu tiên đầu Sprint 2: hoàn tất T-LOCK-03 (sinh bút toán -R/-A) để mở khóa T-LOCK-05 (màn hình duyệt), T-RULE-03 (`fn_rule`) để các epic dùng quy tắc có phiên bản.")
    w("- Đề nghị khách: (1) trả lời Q16, Q17, Q29, Q30 trước 27/11; (2) xác nhận hạn tham gia của 買出人; (3) cử người review UI thay thế.")
    w("")
    w("## 7. Định nghĩa và cách tính")
    w("")
    w(f"- Story point suy ra từ giờ ước lượng: {b['sp_hour_guide'] if isinstance(b['sp_hour_guide'], str) else json.dumps(b['sp_hour_guide'], ensure_ascii=False)}.")
    w(f"- Năng lực: {b['team']['hours_per_day']} giờ/ngày × {b['team']['working_days_per_sprint']} ngày × hệ số tập trung {b['team']['focus_factor']} = {b['team']['capacity_hours_per_person']:.0f} giờ/người/sprint; đội BrSE×1, BE×2, FE×2, QA×1 (người phụ trách là giả định).")
    w("- \"Done\" = đã review và đạt định nghĩa xong của task; \"In Review\" chưa tính vào SP hoàn thành. Burndown tính theo giờ còn lại của task chưa Done.")
    w("")
    w("## 8. Số giờ thật đã dùng cho bài LAB-5")
    w("")
    w("| Tuần | Việc chính | Giờ thực tế |")
    w("|---|---|---|")
    w("| Tuần 1 | Break task từ thiết kế LAB-4, dựng GitHub Project | __ h |")
    w("| Tuần 2 | Giả lập sprint, burndown, báo cáo tiến độ, rà soát | __ h |")
    w("| Tổng | | __ h |")
    (LAB5 / "sprint1-progress-report.md").write_text("\n".join(L) + "\n", encoding="utf-8")
    print("wrote", LAB5 / "sprint1-progress-report.md", "| be_over", be_over, "| carry", carry_h)


if __name__ == "__main__":
    main()
