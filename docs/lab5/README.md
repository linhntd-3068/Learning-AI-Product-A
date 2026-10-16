# LAB-5 — Backlog trên GitHub Project + báo cáo tiến độ Sprint 1

## Sản phẩm nộp

| Yêu cầu | Ở đâu |
|---|---|
| GitHub Project board thật (epic / task / subtask, SP + giờ, trạng thái, người phụ trách giả định) | https://github.com/users/linhntd-3068/projects/1 — 14 epic + 133 task là issue thật trong repo, task là **sub-issue** của epic, subtask là checklist trong từng issue |
| Backlog dạng đọc được / máy đọc được | [backlog.md](backlog.md), [backlog.json](backlog.json) |
| Báo cáo tiến độ 1 sprint (trạng thái, burndown, rủi ro trễ) | [sprint1-progress-report.md](sprint1-progress-report.md) và bản Word `Lab 5/…Sprint 1 Progress Report.docx`; burndown [sprint1-burndown.png](sprint1-burndown.png) |
| Số giờ thật làm bài theo tuần | Mục 8 của báo cáo (người làm tự điền) |

### Các trường trên board

| Trường | Ý nghĩa |
|---|---|
| Status | Backlog · Todo · In Progress · In Review · Blocked · Done |
| Story Points / Estimate (h) | Cả hai chỉ số cho **mọi** task; epic = tổng task con |
| Actual (h) / Remaining (h) | Giờ thực tế / còn lại của Sprint 1 (giả lập) |
| Sprint | Sprint 1 … 6 hoặc Backlog |
| Epic · Đặc thù | Epic cha; ràng buộc nghiệp vụ đặc thù mà task chịu ảnh hưởng |
| Priority · Role · Layer | P0–P2 · BrSE / BE / FE / QA · DB / API / UI / Test / Doc |
| Phụ trách (giả định) | Thành viên giả định (BE An, BE Bình, FE Chi, FE Dũng, QA Hà, BrSE Linh) |

Board mở mặc định ở dạng bảng; thêm view **Board** (nhóm theo Status) và lọc `Sprint: Sprint 1` để xem như Kanban.

## Hạng mục chịu ràng buộc đặc thù — tách riêng

- **完納奨励金 (tiền khuyến khích thanh toán đủ đúng hạn): epic riêng E-INC, 18 task, mỗi task ≤ 12 giờ**, mỗi task một biến nghiệp vụ:
  - tách tên `payment_complete` / `delivery_complete` (bẫy T6);
  - bảng bậc tỷ lệ theo phiên bản quy tắc;
  - khoản phải thu; hạn thanh toán 支払期日;
  - ghi nhận trả tiền tay / nhập CSV và màn hình xác nhận;
  - kiểm đúng hạn theo 業務日 JST, không ân hạn, trễ = 0 vẫn ghi dòng;
  - bảng tính chỉ thêm (append-only); làm tròn xuống **sau** khi nhân 110/100;
  - lưu `rule_set_id` đã áp dụng;
  - điều chỉnh sau khóa kỳ thành delta kỳ sau;
  - API chạy và khóa kỳ; báo cáo RPT-07;
  - test vector INC-EDGE-01/02/03; kịch bản UAT.
- **Ràng buộc đặc thù khác**, gắn nhãn `đặc thù: …` trên từng issue:
  - 許可/承認 — 12 task;
  - quy tắc có phiên bản — 15;
  - ngày khóa & điều chỉnh — 17;
  - ngày nghiệp vụ JST — 9;
  - MFA — 11;
  - offline — 8;
  - せり có người xác nhận — 5;
  - kế toán IF-ACC-01 — 5.

## Cách dựng (lặp lại được)

| Bước | Ai / công cụ | Đầu ra |
|---|---|---|
| 1 | Agent lập kế hoạch đọc bộ thiết kế LAB-4 (gap G-01…G-24, 9 screen spec, ADR) theo mẫu prompt `docs/ai-context/prompts/task-breakdown-from-design.md` | `backlog.json`, `backlog.md` + 15 phép kiểm tự động (đều đạt) |
| 2 | Lead review backlog (mục dưới), sửa | Dời T-INC-17 |
| 3 | `scripts/github-project/simulate_sprint_progress.py` | Trạng thái / giờ / burndown Sprint 1 giả lập, 4 sự kiện gây trễ |
| 4 | `scripts/github-project/render_burndown_chart.py` | `sprint1-burndown.png` |
| 5 | `scripts/github-project/load_backlog_to_github_project.py` (gh CLI + GraphQL) | Issue, sub-issue, item và trường trên Project; chạy lại không tạo trùng (`github-map.json`) |
| 6 | `scripts/github-project/build_sprint_progress_report_md.py` | Báo cáo — mọi con số tính từ `backlog.json`, không gõ tay |

## Review backlog do AI tạo (nhận có sửa)

Agent tự chạy 15 phép kiểm và báo "ALL CHECKS PASS". Lead không dừng ở đó mà tự kiểm thêm:

| # | Phát hiện | Vì sao phép kiểm tự động không bắt được | Xử lý |
|---|---|---|---|
| 1 | Test biên 完納奨励金 (T-INC-17, INC-EDGE-01/02/03) xếp ở **Sprint 6**, trong khi công thức code ở Sprint 3 → 3 sprint chạy công thức không có test chặn | Kiểm chỉ đòi "phụ thuộc xong trước", không đòi "test đi liền code" | **Đã sửa:** dời về Sprint 4, ngay sau task cuối mà nó phụ thuộc (T-INC-13) |
| 2 | QA gần như trống Sprint 2–3 (6 h, 0 h) rồi dồn Sprint 5–6 → lỗi tích hợp phát hiện muộn | Kiểm năng lực chỉ chặn **vượt**, không cảnh báo **dồn** | Ghi rủi ro R7 + hành động trong báo cáo |
| 3 | Sprint 1 dùng 208 / 336 giờ: BE kín 107 / 112, FE 52 / 112, QA 18 / 56 → nút cổ chai BE kéo dài dự án ~1 sprint | Không có kiểm cân bằng vai trò | Rủi ro R2, R6; đề xuất chuyển task DB đơn giản cho FE |
| 4 | Không tính ngày lễ Nhật (23/11, nghỉ cuối năm) | Agent tự ghi là giả định nhưng vẫn lên lịch như ngày thường | Rủi ro R5; Sprint 2 tính lại năng lực BE |
| 5 | Giả lập lần đầu (script của lead) cho kết quả quá đẹp: 31/34 task xong; sự kiện "chờ bảng tỷ lệ" không trúng task nào, sự kiện "review chậm" gắn vào task còn Todo | Script chạy không lỗi nhưng điều kiện so khớp sai | Sửa: gắn sự kiện vào đúng task; kết quả 27/34 task, 86/120 SP |
| 6 | Lỗi khi nạp board: GitHub tự thêm sub-issue vào Project khi epic cha đã ở trong Project → thêm lần hai báo "already exists", dừng giữa chừng để lại 1 issue mồ côi | Chỉ lộ ra khi chạy thật trên GitHub | Sửa script nhận lại item / issue đã có; chạy lại không tạo trùng |

Kết luận: **NHẬN CÓ SỬA**. Phép kiểm tự động đạt là điều kiện cần, không đủ: cả 4 phát hiện về kế hoạch (1–4) đều qua được kiểm tự động.

## Ghi chú cho cụm câu neo

Lưu ý trung thực: dự án Product A là bài tập, chưa kick-off; sprint là **giả lập**, không có release thật. Các ý dưới đây là những gì đã thực sự làm trong bài.

- **P2-07 (vận hành dự án có AI thực thi, ở vai quản lý):**
  - AI thực thi phần lớn công việc: tách 133 task, viết script nạp board và giả lập, sinh báo cáo.
  - Người giữ các quyết định: chọn cách làm, chấp nhận hay sửa backlog, đặt sự kiện rủi ro, viết hành động xử lý.
  - Phân công rõ: agent có brief và phạm vi riêng; lead tự review đầu ra.
- **P2-11 (đánh giá độ tin cậy báo cáo AI tổng hợp):** đã bắt được hai chỗ "tô hồng":
  - backlog báo "ALL CHECKS PASS" nhưng kế hoạch test dồn cuối và nút cổ chai BE;
  - lần giả lập đầu cho 31/34 task xong vì sự kiện rủi ro không trúng đích.
  
  Báo cáo cuối nêu rủi ro bằng số cụ thể (thiếu ~13 giờ BE ở Sprint 2, hạn trả lời Q16/Q17 là 27/11), không chỉ phần trăm.
- **P2-12 (quality gate: AI kiểm đạt VÀ người review đạt):** gate của bài là
  - 15 phép kiểm tự động của agent (đạt);
  - review của lead (6 phát hiện, 4 đã sửa, 2 thành rủi ro có hành động).
  
  Chỉ khi cả hai đạt mới nạp lên board. Đây là quyết định "nhận backlog", tương tự quyết định release.
- **P2-13 (dùng AI tổng hợp báo cáo):** báo cáo tiến độ do script sinh từ dữ liệu board, nên số liệu truy được về `backlog.json` và issue trên GitHub. Phần diễn giải rủi ro và hành động do lead viết và kiểm.
