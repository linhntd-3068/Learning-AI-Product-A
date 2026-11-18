# AI-report — Dùng AI để break task, ước lượng và báo cáo tiến độ

## 1. Skill và prompt cho từng việc

| Việc | Skill / công cụ | Prompt / cách giao việc | Đầu ra |
|---|---|---|---|
| Break task | Agent lập kế hoạch (Claude Code) + mẫu prompt [`docs/ai-context/prompts/task-breakdown-from-design.md`](docs/ai-context/prompts/task-breakdown-from-design.md) | Giao đúng các file đầu vào: context 1 trang, 03 §4 (gap), 9 screen spec, ADR-006…010. Bổ sung riêng 01 §6/§9.4 cho 完納奨励金 (PREMISE A1). Ràng buộc trong prompt: mỗi task ≤ 16 giờ, một tầng, DoD lấy từ §10, ưu tiên gap mức Cao. Agent tự chạy 15 phép kiểm trước khi nộp (danh sách và prompt bổ sung cho E-INC ở [§1a](#1a-prompt-bổ-sung-cho-e-inc-và-15-phép-kiểm-tự-động)) | `docs/lab5/backlog.json`, `backlog.md` |
| Chấm SWP | Skill `tkm:estimate-swp` (mức `medium`), 5 agent chấm chạy song song, mỗi agent một lô ~27 issue, không có công cụ, chỉ nhận rubric + nội dung issue | Lệnh: `/tkm:estimate-swp https://github.com/users/linhntd-3068/projects/1 --include-closed --reestimate-existing --no-push-kpi`. Phạm vi: toàn bộ 133 task (14 epic tự cộng từ task con). Trước khi giao cho agent chấm, **che cột Story Points/giờ trong body issue** để AI không bị neo theo ước lượng cũ | [`reports/swp/estimate-swp-product-a-project1-261111.html`](reports/swp/estimate-swp-product-a-project1-261111.html): 508 SWP, hiệu chỉnh `accepted` |
| Ghi SWP lên Project | Agent (Claude Code) dùng `gh` CLI + GraphQL, sau khi người review đã chốt 5 issue mẫu | "Lấy SWP cuối cùng từ dữ liệu nhúng trong báo cáo HTML, tạo trường Number `SWP` trên Project, ghi cho đúng từng issue theo `github-map.json`; chỉ ghi trường SWP, không sửa trường khác; đọc lại và báo số khớp." Skill chấm chỉ đọc, nên bước ghi tách riêng và chỉ chạy khi người dùng đồng ý. Gặp lỗi 502 khi gửi lô 25 item → giảm còn 10 item/lần, có thử lại | Trường `SWP` trên Project: 147/147 item khớp báo cáo khi đọc lại; tổng task = tổng epic = 508. Trường Story Points cũ giữ lại để xếp sprint |
| Quy giờ | Không giao AI quyết định quy tắc. Lead chốt bảng SP ↔ giờ (estimate.md §2); agent chỉ áp bảng khi sinh backlog | "Ước giờ trực tiếp từ issue; task > 16 giờ phải tách" — nằm trong `sp_hour_guide` của `backlog.json`. Không quy SWP ra giờ; SWP chỉ dùng kiểm chéo tỷ lệ giờ/SWP (estimate.md §2) | Trường `Estimate (h)` trên Project; điểm chính thức là trường `SWP` |
| Nạp board | Script do agent viết: `scripts/github-project/load_backlog_to_github_project.py` (gh CLI + GraphQL) | Yêu cầu chạy lại không tạo trùng, ghi map task → issue ra `github-map.json` | 14 epic + 133 sub-issue, các trường tùy chỉnh |
| Báo cáo tiến độ | `simulate_sprint_progress.py` (giả lập), `render_burndown_chart.py`, `build_sprint_progress_report_md.py` | Mọi con số phải tính từ `backlog.json`, không gõ tay. Lead tự đặt 4 sự kiện trễ và viết phần hành động rủi ro | `docs/lab5/sprint1-progress-report.md`, burndown PNG, bản Word |

### 1a. Prompt bổ sung cho E-INC và 15 phép kiểm tự động

Ngoài mẫu prompt chung, brief giao agent có thêm yêu cầu cứng cho 完納奨励金 (trích nguyên văn, tiếng Anh như lúc giao):

> Incentive for on-time full payment (完納奨励金, BR-INC-01, FR-INC-01..03, BC-65..69, test vectors INC-EDGE-01..03, Q16/Q17/Q29/Q30) must be its OWN epic, split into separate tasks per business variable — e.g. rate-tier table under rule versions; payment due date (支払期日) definition/config; payment recording (manual + CSV import, Q17); on-time eligibility check JST business day, no grace, late = 0 still recorded; calculation floor after ×110/100 in integer/decimal; rule_set_id applied; post-lock adjustment as next-period delta (append-only); naming separation payment_complete vs delivery_complete (trap T6); incentive report RPT-07; unit tests for INC-EDGE-01/02/03; UAT scenario. Keep each ≤ 16 h. Note: none of the 9 core screen specs covers incentives — derive from 01 constraints and mark assumptions (S).

Brief cũng bắt agent tự kiểm bằng script Python trước khi nộp. Kết quả chạy trên `backlog.json` cuối cùng — cả 15 phép đạt:

| # | Phép kiểm | Kết quả |
|---|---|---|
| 1 | JSON đọc được | 14 epic, 133 task, 6 sprint |
| 2 | Story point thuộc {1, 2, 3, 5, 8} | Đạt |
| 3 | Giờ mỗi task trong 1…16 | Đạt |
| 4 | Mọi gap G-01…G-24 có ít nhất một task | 24/24 |
| 5 | Epic 完納奨励金 có ≥ 8 task | 18 task |
| 6 | Mọi ID phụ thuộc đều tồn tại | Đạt |
| 7 | Không có vòng phụ thuộc | Đạt |
| 8 | Tổng epic = tổng task con | Đạt |
| 9 | Đủ trường, mỗi task 2–5 subtask | Đạt |
| 10 | Giá trị liệt kê hợp lệ (cờ đặc thù, vai trò, tầng, ưu tiên) | Đạt |
| 11 | Không task nào phụ thuộc task ưu tiên thấp hơn | Đạt |
| 12 | Mỗi task nằm đúng một sprint | Đạt |
| 13 | Task phụ thuộc xếp không muộn hơn task dùng nó | Đạt |
| 14 | Giờ mỗi sprint không vượt năng lực từng vai trò | Đạt |
| 15 | Sprint 1 bắt đầu thứ Hai 2026-11-09, dài 2 tuần | Đạt |

Story point ở đây là điểm cũ quy từ giờ, chỉ dùng xếp sprint; điểm chính thức của bài là SWP (dòng "Chấm SWP" ở trên). 15 phép đạt nhưng vẫn lọt các lỗi kế hoạch ở §2 (#1–#4, #7) — xem nhận xét ở §3.

## 2. Review output của AI

**Con người review ở 4 bước:**
1. Duyệt backlog trước khi nạp board.
2. Kiểm kết quả giả lập.
3. Kiểm board sau khi nạp.
4. Đọc lại báo cáo trước khi gửi.

Quy tắc chung: phép kiểm tự động của agent đạt chỉ là điều kiện cần. Chỉ khi cả agent và lead đều đạt mới nạp lên board.

| # | Phát hiện trong output của AI | Vì sao phép kiểm tự động không bắt được | Xử lý |
|---|---|---|---|
| 1 | Test biên 完納奨励金 (#146) xếp Sprint 6, công thức code ở Sprint 3: 3 sprint không có test chặn | Phép kiểm chỉ đòi "phụ thuộc xong trước", không đòi "test đi liền code" | Dời #146 về Sprint 4 |
| 2 | QA gần như trống Sprint 2–3 rồi dồn Sprint 5–6 | Phép kiểm năng lực chỉ chặn **vượt**, không cảnh báo **dồn** | Rủi ro R6 |
| 3 | Sprint 1: BE 107/112 giờ trong khi FE 52/112, QA 18/56 | Không có phép kiểm cân bằng vai trò | Rủi ro R2; đề xuất chuyển issue DB đơn giản cho FE |
| 4 | Không tính lễ Nhật, dù agent tự ghi đây là giả định | Giả định được ghi ra nhưng không được dùng khi xếp lịch | Rủi ro R5 |
| 5 | Lần giả lập đầu cho kết quả quá đẹp (31/34 issue xong): sự kiện "chờ bảng tỷ lệ" không trúng issue nào, sự kiện "review chậm" gắn vào issue còn Todo | Script chạy không lỗi nhưng điều kiện so khớp sai | Sửa gắn sự kiện vào đúng issue → 27/34 |
| 6 | Nạp board dừng giữa chừng: GitHub tự thêm sub-issue vào Project khi epic cha đã ở trong đó, lần thêm thứ hai báo "already exists" | Chỉ lộ ra khi chạy thật | Sửa script nhận lại item đã có; chạy lại không trùng |
| 7 | Kịch bản UAT 完納奨励金 (#147) xếp Sprint 1 trong khi spec #130 bị chặn và tính năng làm ở Sprint 2–5 | Phép kiểm phụ thuộc đạt (#147 phụ thuộc #130, cùng sprint), nhưng không xét "viết UAT trước khi có spec là phí" | Rủi ro R7; dời sang Sprint 4 ở planning Sprint 2 |
| 8 | Mẫu prompt tách task ghi "gap G-01…G-20" trong khi 03 §4 đã có tới G-24 sau review LAB-4 | Prompt là tài sản dùng lại, không ai kiểm khi spec đổi | Agent vẫn đọc đủ G-21…G-24 vì nhận cả file 03 §4. **Đã sửa prompt:** đổi thành "mọi gap G-xx có trong bảng", và thêm 01 §6/§9.4 vào đầu vào để lần sau không bỏ sót 完納奨励金 (PREMISE A1) |
| 9 | Body issue chứa sẵn bảng Story Points/giờ cũ. Nếu đưa nguyên cho agent chấm, AI dễ chấm theo số cũ thay vì theo cấu trúc việc | Skill chỉ cấm "dùng ước lượng cũ", không tự che dữ liệu | Che 2 cột đó khỏi body trước khi chấm; giờ cũ chỉ giữ làm cột đối chiếu trong báo cáo |
| 10 | Script của skill đọc dữ liệu theo bảng mã Windows nên tên issue tiếng Việt bị vỡ chữ ở bước chia lô | Script chạy không lỗi, chỉ lộ ra khi đọc kết quả | Chạy lại toàn bộ ở chế độ UTF-8 (`python -X utf8`) trước khi giao cho agent |
| 11 | 15/133 dòng agent trả về có danh sách nhãn cấu trúc sai thứ tự quy định | Agent làm đúng nội dung, chỉ sai định dạng | Sắp lại theo thứ tự chuẩn (không đổi điểm), ghi vào phần lưu ý của báo cáo |
| 12 | Review 5 issue mẫu: giữ nguyên cả 5. Riêng #56 có giờ ước (8 h) thấp so với SWP (10), đúng issue đã vượt giờ ×1,5 ở Sprint 1 | Skill không so giờ với SWP | Không sửa SWP (cấu trúc chấm đúng); dùng tỷ lệ giờ/SWP làm tín hiệu ước giờ thấp (estimate.md §2) |

## 3. Điểm đặc biệt trong cách dùng AI

**Hiệu quả:**
- **Mọi con số đi từ một nguồn** (`backlog.json` → board → báo cáo). Sửa một task thì board và báo cáo đổi theo, không lệch như khi gõ tay. Nhờ vậy mới đặt được câu hỏi "AI có tô hồng không": số liệu truy về được issue thật.
- **Đặt sự kiện rủi ro có chủ đích vào giả lập.** Báo cáo sinh ra có chỗ trễ thật để phân tích, không phải burndown thẳng tắp. Đây cũng là cách bắt được lỗi #5: kết quả đẹp bất thường là dấu hiệu sai.
- **Giao AI phần cơ học, giữ cho người phần phán đoán.** AI tách task, viết script, sinh báo cáo. Người chọn quy tắc SP ↔ giờ, đặt sự kiện, viết hành động rủi ro, quyết định nhận backlog.

**Chưa tốt, cần cải thiện khi làm thật:**
- **Phép kiểm tự động chỉ kiểm "đúng luật", không kiểm "hợp lý".** Cả 4 phát hiện về kế hoạch (#1–#4, #7) đều qua kiểm. Lần sau thêm vào bộ kiểm:
  - test ràng buộc đặc thù phải ở sprint liền sau code;
  - không vai trò nào < 30% năng lực khi vai trò khác > 90%;
  - issue Doc của tính năng không xếp trước spec quá 2 sprint.
- **Prompt dùng lại bị cũ (#8).** Nên dẫn "toàn bộ 03 §4" thay vì liệt kê khoảng mã.
- **Giới hạn token / thời gian:** chưa cho agent đọc toàn bộ RFP mà chỉ tra theo mã ID. Nhanh hơn, nhưng là lý do khoảng hở 完納奨励金 (PREMISE A1) không tự lộ ra mà phải do người nhận thấy.
- **Skill chấm SWP:**
  - *Tin được:* điểm theo cấu trúc (số hàm, màn hình, có migration hay không), cùng mô tả thì ra cùng điểm. Có giải thích từng issue nên review nhanh.
  - *Chưa tốt:* skill chỉ thấy cấu trúc trong issue, không thấy rủi ro nghiệp vụ chưa chốt (Q16/Q17, M1). Vì vậy E-LOCK, E-INC có tỷ lệ giờ/SWP cao hơn hẳn mức chung. Phần đó phải quản lý bằng giả định và rủi ro, không trông vào điểm.
  - *Lần sau:* chạy mức `high` để có người chấm thứ hai trên các issue rủi ro, và để người review tự chọn thêm mẫu từ E-INC.
- **Bộ skill quản lý dự án `tkm:pm-*` (Takumi) — đã cân nhắc, không dùng.** Các skill tách task, báo cáo tiến độ, theo dõi rủi ro (`pm-create-tasks`, `pm-report-project`, `pm-track-risks-issues`) đều lấy đầu vào từ bộ tài liệu quản lý riêng (`schedule.md`, `function-list.md`, `progress.md` trong `project/01_management/`). Backlog bài này đi từ bộ thiết kế LAB-4, còn báo cáo phải theo đúng 4 phần đề yêu cầu. Dựng thêm bộ tài liệu đó chỉ để chạy skill thì tốn công mà không thêm gì cho bài nộp. Chỉ dùng `tkm:estimate-swp` vì khớp thẳng với yêu cầu chấm SWP.
