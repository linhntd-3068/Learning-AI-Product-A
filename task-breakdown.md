# Task breakdown — từ thiết kế LAB-4 tới backlog trên GitHub Project

Bản đầy đủ từng task (mô tả, subtask, DoD, phụ thuộc): [`docs/lab5/backlog.md`](docs/lab5/backlog.md), máy đọc: [`docs/lab5/backlog.json`](docs/lab5/backlog.json). Task ID → số issue: [`docs/lab5/github-map.json`](docs/lab5/github-map.json).

## 1. Nguyên tắc chia task

**Độ hạt — chia tới đâu thì dừng.** Dừng khi task thỏa cả 4 điều:
- một người làm xong trong 1–16 giờ;
- nằm ở **một tầng**: DB (migration, hàm `fn_*`) / API / UI / Test / Doc;
- có DoD kiểm được, lấy từ §10 của screen spec hoặc bảng quyết định ở 01 §9;
- với hạng mục có ràng buộc đặc thù: chỉ chứa **một biến nghiệp vụ**. Ví dụ ở 完納奨励金, "hạn thanh toán" và "kiểm đúng hạn" là 2 task.

**Khi nào tách tiếp:**
- task vượt 16 giờ;
- task cần 2 vai trò (BE viết hàm, FE dựng màn hình);
- task gộp 2 quy tắc mà khách có thể trả lời riêng (mỗi Q một task, để câu trả lời chỉ làm đổi task đó);
- test biên của ràng buộc đặc thù tách khỏi task code để QA làm song song.

**Định nghĩa xong (chung cho mọi issue):**
- đạt DoD riêng ghi trong issue;
- có test của chính task (hàm SQL: test tích hợp DB; API: test route; UI: E2E cho luồng chính);
- quy tắc dẫn mã nguồn (BC-xx / RFP ID / Qxx), giả định ghi "(S)";
- đã review và chuyển `Done` trên Project.

`In Review` chưa tính là xong.

**Cách dùng epic → issue → sub-issue trên Project:**

| Tầng | Trên GitHub | Có điểm/giờ | Ghi chú |
|---|---|---|---|
| Epic | Issue nhãn `[EPIC]` (#1–#14) | Tổng của task con (trường "Sub-issues progress") | Một epic = một nhóm ràng buộc hoặc một màn hình lõi |
| Task | **Sub-issue** của epic (#15–#147) | Có — trường `SWP` (điểm đã review), `Estimate (h)`, `Iteration`, `Phụ trách (giả định)`; `Story Points` cũ chỉ dùng xếp sprint | Đơn vị gán người, xếp sprint, đổi trạng thái |
| Subtask | Checklist trong body của task (3–6 bước) | Không | Không tách thành sub-issue tầng 3: bước nào cũng < 4 giờ và cùng một người làm, tách ra chỉ làm board nhiễu mà không thêm thông tin quản lý |

## 2. Spec → issue

| Spec | Epic | Issue/sub-issue | Phần spec chưa thành issue và vì sao |
|---|---|---|---|
| SCR-001 Đăng nhập | #6 E-SEC | #65–#75, #122 | — |
| SCR-010 Tư cách tham gia | #5 E-QUAL | #21, #30, #36, #52, #54–#64 | Cổng cho người tham gia bên ngoài tự nộp hồ sơ: ngoài phạm vi (Plan A Q4, người ngoài không đăng nhập) |
| SCR-012/013 Tiếp nhận & đánh giá lô | #7 E-LOT | #15, #18, #36, #61, #76–#81, #124, #125, #127 | In nhãn lô (Q6): chưa có trả lời và SCR-012 chưa thiết kế, chưa break |
| SCR-016 Chốt giao dịch 相対 | #8 E-TRADE | #18, #25, #50, #53, #58, #61, #82–#84, #88, #89, #128 | — |
| SCR-018 Chi tiết giao dịch & hủy | #8 E-TRADE | #86 (spec, PREMISE A2), #87 | — |
| SCR-019 Ghi kết quả せり | #9 E-AUC | #50, #83, #90–#94, #128 | Không làm UI đặt giá / đấu giá trực tuyến: làm thành hệ thống đấu giá là bị loại (RFP 12-06) |
| SCR-022 Yêu cầu & duyệt điều chỉnh | #11 E-LOCK | #18, #20, #21, #69, #104–#108 | Mở quyền tạo yêu cầu cho `trade` (Q-022-1): chờ khách |
| SCR-024 Đối soát & khóa ngày | #11 E-LOCK, #12 E-ACC | #49, #52, #69, #85, #109–#115, #118–#121 | — |
| SCR-029 Ghi giao hàng | #10 E-DEL | #21, #52, #96–#102, #126, #131 | Màn hình tranh chấp đầy đủ SCR-026/027: để giai đoạn sau (PREMISE "Hướng đã chốt" — tranh chấp) |
| SCR-034 Phiên bản quy tắc | #3 E-RULE | #32–#33, #37–#45, #69, #132 | — |
| ADR-005 Bút toán đảo `-R/-A` | #11, #14 | #105, #139, #142 | — |
| ADR-006 Audit cùng giao dịch | #2 E-AUD | #27–#29, #83 | — |
| ADR-007 Tư cách theo căn cứ | #5 E-QUAL | #54–#59, #96 | — |
| ADR-008 Quy tắc có phiên bản | #3 E-RULE | #31–#35, #37, #38, #71, #72, #132, #134, #141 | — |
| ADR-009 Ngày nghiệp vụ JST | #4 E-BDAY | #22, #46–#52, #82, #105, #116, #124, #134 | — |
| ADR-010 Offline | #13 E-OFF | #22, #26, #78, #122–#129 | Offline cho màn hình khác tiếp nhận / giao hàng: ADR-010 loại có chủ đích |
| 03 §4 G-01…G-24 | nhiều epic | Mỗi gap ≥ 1 issue; G-21 → #117–#120 | — |
| 01 §6, §9.4 完納奨励金 (FR-INC-01…03, BR-INC-01) | #14 E-INC | #130–#147 | Liên kết ngân hàng tự động: SCOPE-OUT-05 |
| 06 Mục 4 #8 (dữ liệu test lệch giữa các spec) | #1 E-FND | #24 | — |
| 01 các phần còn lại: thông báo, 11 báo cáo cố định khác RPT-07, APPI / lưu trữ 7 năm, chuyển đổi dữ liệu, hạ tầng AWS, UAT / cutover | — | — | LAB-4 chỉ thiết kế chi tiết 9 màn hình lõi + ADR. Các phần này chưa có detail design nên chưa break; có trong estimate LAB-1 (xem estimate.md §5) |

## 3. Hạng mục chịu ràng buộc đặc thù của đề

**完納奨励金 (Product A)** — epic #14, **18 issue, 59 SWP, 130 giờ**, không issue nào > 12 giờ. Cột Issue ghi (SWP / giờ).

| Ràng buộc | Issue | Vì sao tách riêng |
|---|---|---|
| Spec nghiệp vụ + câu hỏi Q16/Q17/Q29/Q30 | #130 (3 SWP / 8 h) | LAB-4 không có spec (PREMISE A1). Gỡ chặn sớm nhất có thể nên xếp Sprint 1 |
| Tách `payment_complete` khỏi `delivery_complete` | #131 (2 / 4) | Bẫy T6: 完納 là **trả đủ tiền**, không phải giao đủ hàng. Tách để review riêng điểm dễ hiểu sai nhất |
| Bảng bậc tỷ lệ trong phiên bản quy tắc | #132 (3 / 4) | Phụ thuộc Q16 (B4). Khách trả lời khác thì chỉ issue này và #140 đổi |
| Khoản phải thu | #133 (5 / 10) | Biến đầu vào `eligible_amount` (B2); dùng chung với kế toán |
| Hạn thanh toán 支払期日 | #134 (3 / 6) | Định nghĩa chờ Q16 (B5); tính theo lịch chợ, lưu cứng trên khoản phải thu |
| Ghi nhận trả tiền thủ công | #135 (5 / 10) | Nguồn dữ liệu "đã trả" (B6) |
| Import CSV thanh toán | #136 (5 / 10) | Định dạng CSV chờ Q17; tách khỏi #135 để bỏ được nếu khách không cần |
| Màn hình xác nhận tiền về | #137 (4 / 12) | Người xác nhận cuối là người (BC-29) |
| Kiểm đúng hạn theo 業務日 JST, không ân hạn | #138 (2 / 6) | Trễ 1 ngày = 0; mốc ngày theo ADR-009, không theo đồng hồ máy |
| Bảng tính append-only theo kỳ | #139 (3 / 6) | Kỳ đã khóa không ghi đè (ADR-005); kỳ tính là giả định (B1) |
| Công thức: floor **sau** ×110/100, numeric không float | #140 (3 / 8) | Biến nhiều nhất và dễ sai thứ tự làm tròn; quá hạn vẫn ghi dòng 0 |
| Lưu `rule_set_id` đã áp dụng | #141 (3 / 4) | Truy vết phiên bản (FR-INC-02); ngày áp dụng là giả định (B3) |
| Điều chỉnh sau khóa kỳ → dòng delta kỳ sau | #142 (4 / 8) | FR-INC-03, INC-EDGE-02 |
| API chạy tính và khóa kỳ | #143 (3 / 6) | Thao tác có quyền riêng, ghi audit |
| Báo cáo RPT-07 (API + CSV) | #144 (3 / 8) | Đầu ra cho đối soát (B7) |
| Màn hình RPT-07 | #145 (2 / 8) | Tách UI khỏi API theo tầng |
| Test vector INC-EDGE-01/02/03 + nhánh biên | #146 (3 / 6) | QA viết riêng, đã dời từ Sprint 6 về Sprint 4 để đi liền task code (xem AI-report) |
| Kịch bản UAT tiếng Nhật | #147 (3 / 6) | Người phụ trách nghiệp vụ phía khách nghiệm thu từng biến |

**Ràng buộc đặc thù khác**: mỗi issue có trường `Đặc thù` trên Project để lọc.
- 許可/承認: 12 issue
- Quy tắc phiên bản: 15
- Ngày khóa & điều chỉnh: 17
- Ngày nghiệp vụ JST: 9
- MFA: 11
- Offline: 8
- せり xác nhận: 5
- Kế toán IF-ACC-01: 5

## 4. Chỗ hở hoặc mâu thuẫn của spec LAB-4 phát hiện khi break

| Spec | Chỗ hở/mâu thuẫn | Xử lý |
|---|---|---|
| 01 §6, §9.4 vs 9 screen spec | Có quy tắc 完納奨励金 nhưng không có màn hình, bảng dữ liệu hay báo cáo nào thực hiện nó | Đã sửa thiết kế — PREMISE A1 |
| 01 §9.4 | Không nêu kỳ tính khuyến khích | Giả định — PREMISE B1 |
| 01 §9.4 | Công thức `eligible × rate × 110/100` là suy luận; trước/sau thuế chưa rõ (Q29) | Giả định — PREMISE B2; tạo issue làm rõ #130 |
| 01 §9.4 / Q16 | Không có cấu trúc bảng tỷ lệ và định nghĩa 支払期日 | Giả định — PREMISE B4, B5; tạo issue làm rõ #130 |
| FR-INC-02 | "Ngày áp dụng" phiên bản quy tắc không nói là ngày nào | Giả định — PREMISE B3 |
| 01 §9.4 / Q17 | Cách biết khách đã trả tiền | Giả định — PREMISE B6 |
| 04 README, SCR-022 | SCR-022 dẫn tới SCR-018 nhưng SCR-018 chưa có spec | Đã sửa thiết kế — PREMISE A2 |
| 06 Mục 4 #10, ADR-009 | Header 業務日 bắt buộc ở mọi màn hình nhưng không spec nào sở hữu | Đã sửa thiết kế — PREMISE A3 |
| SCR-034 F-21, F-18 | Kiểu nút duyệt khác SCR-022; thuế suất lưu 0–1 nhưng hiển thị 0–100 | Đã sửa thiết kế — PREMISE A4 |
| SCR-019 §7 vs AC12 | Nút 記録 tắt vs bấm được rồi báo lỗi | Đã sửa thiết kế — PREMISE A5 |
| SCR-001 M-06 | Một câu cho 2 tình huống MFA khác nhau | Đã sửa thiết kế — PREMISE A6 |
| SCR-016 RJ-11 | `{day}` = null khi chưa mở ngày | Đã sửa thiết kế — PREMISE A7 |
| SCR-022 | Gợi ý "ngày gốc còn mở" bỏ sót `closing` / `reopened` | Đã sửa thiết kế — PREMISE A8 |
| SCR-029 §11 | F-07 / F-11 đổi nghĩa mà không ghi chú | Đã sửa thiết kế — PREMISE A9 |
| SCR-012, SCR-016, SCR-022 (AC) | Dữ liệu ví dụ khác nhau giữa các spec (M-002, W-001/W-002) | Tạo issue làm rõ #24 (bộ dữ liệu test chung) |
| SCR-010 vs RFP (M1) | 買出人 vừa "đăng ký tại điểm" vừa có hạn tham gia | Giả định — PREMISE B8 |
| 06 Mục 2.1 (Q-009-1) | Từ lúc khóa sổ (~10:00) tới lúc mở ngày sau không có ngày hiện tại, nên duyệt cấp cuối yêu cầu điều chỉnh phải chờ | Để mở: cần khách chọn giờ mở ngày; không chặn task nào ở Sprint 1–3, hỏi trong đợt câu hỏi kèm Q16/Q17 |
| SCR-029, SCR-024 CK-5 | Tranh chấp chỉ là cờ, chưa có SCR-026/027 | Để mở: ngoài phạm vi bộ lõi (PREMISE "Hướng đã chốt") |
