# LAB-5 — Backlog triển khai Product A (桜水産市場 業務支援システム)

Sinh từ bộ thiết kế LAB-4 theo `docs/ai-context/prompts/task-breakdown-from-design.md`. Bản máy đọc: `backlog.json` (cùng nội dung, có subtask và định nghĩa xong của từng task).

**Tổng:** 14 epic · 133 task · 556 SP · 981 giờ · 6 sprint theo năng lực (2026-11-09 → 2027-01-29).

## 1. Tổng hợp epic

| Epic | Tên | Task | SP | Giờ | Ràng buộc đặc thù |
|---|---|---:|---:|---:|---|
| E-FND | Nền tảng dữ liệu, phân quyền & spec chung | 12 | 46 | 83 | — |
| E-AUD | Audit nghiệp vụ trong cùng giao dịch (ADR-006) | 4 | 16 | 28 | — |
| E-RULE | Quy tắc chợ có phiên bản & tham số hệ thống (ADR-008, SCR-034) | 15 | 66 | 118 | Quy tắc phiên bản |
| E-BDAY | Ngày nghiệp vụ JST & mở ngày (ADR-009) | 8 | 26 | 47 | Ngày nghiệp vụ JST |
| E-QUAL | Tư cách tham gia theo căn cứ 登録/許可/承認 (ADR-007, SCR-010) | 11 | 51 | 93 | 許可/承認 |
| E-SEC | Đăng nhập, MFA, khóa tạm & timeout (SCR-001) | 11 | 33 | 63 | MFA/Bảo mật |
| E-LOT | Tiếp nhận & đánh giá lô (SCR-012/013) | 6 | 23 | 40 | — |
| E-TRADE | Chốt giao dịch 相対 & hủy (SCR-016/018) | 8 | 41 | 70 | — |
| E-AUC | Ghi kết quả せり có người xác nhận (SCR-019) | 5 | 16 | 29 | せり xác nhận |
| E-DEL | Ghi giao hàng, ngoại lệ & tranh chấp (SCR-029) | 8 | 40 | 66 | — |
| E-LOCK | Đối soát, khóa sổ, mở lại & điều chỉnh -R/-A (SCR-022/024) | 14 | 72 | 119 | Ngày khóa & điều chỉnh |
| E-ACC | Xuất kế toán IF-ACC-01 sau khóa sổ | 5 | 21 | 35 | Kế toán IF-ACC-01 |
| E-OFF | Offline cho tiếp nhận lô & giao hàng (ADR-010) | 8 | 33 | 60 | Offline |
| E-INC | 完納奨励金 — khuyến khích thanh toán đủ đúng hạn | 18 | 72 | 130 | 完納奨励金 |
| **Tổng** | | **133** | **556** | **981** | |

## 2. Task theo epic

Cột: SP · giờ · ưu tiên · vai trò · tầng. Subtask và định nghĩa xong đầy đủ ở `backlog.json`; dưới mỗi bảng là DoD rút gọn.

### E-FND — Nền tảng dữ liệu, phân quyền & spec chung

**Mục tiêu:** Có danh mục mặt hàng, FK người làm, vai trò/quyền mới, mã lỗi JP+VI, đính kèm và bộ dữ liệu test chung để mọi epic dựng trên đó.  
**Phạm vi:** items, FK profiles, seed rule_admin + mã quyền, doc_counters, trạng thái lô suy ra, ràng buộc DB (G-17), attachments, app shell, dữ liệu test.  
**Tổng:** 12 task · 46 SP · 83 h · cờ: —

| ID | Tiêu đề | Tầng | Vai trò | SP | Giờ | Ưu tiên | Phụ thuộc | Cờ | Nguồn | Sprint |
|---|---|---|---|---:|---:|---|---|---|---|---|
| T-FND-01 | Tạo danh mục `items` và chuyển `lots.item/unit` sang `item_code` | DB | BE | 5 | 8 | P0 | — | — | G-15, BC-37, BC-70, SCR-012 §5.1 F-04/F-05, 03 §2 | 1 |
| T-FND-02 | Thêm FK `profiles(id)` cho mọi cột người làm | DB | BE | 3 | 5 | P2 | — | — | G-14, BC-81 | 5 |
| T-FND-03 | Seed vai trò `rule_admin` và các mã quyền mới | DB | BE | 3 | 5 | P0 | — | — | G-16, ADR-004, BC-87, 06 Mục 1 §4.1 | 2 |
| T-FND-04 | Tạo `doc_counters(day, kind)` và thay mã chứng từ `count(*)+1` | DB | BE | 3 | 6 | P1 | LOT-01, TRADE-01, LOCK-03 | — | G-18, BC-31, SCR-012 §11, SCR-016 §11, SCR-022 §11 | 5 |
| T-FND-05 | Suy ra trạng thái lô từ tồn thay vì lưu cứng `lots.status` | DB | BE | 3 | 5 | P2 | LOCK-03 | — | G-13, BC-38 | 5 |
| T-FND-06 | Chuyển các quy tắc chỉ có ở API vào DB | DB | BE | 3 | 5 | P2 | LOCK-01 | — | G-17, ADR-003, SCR-022 AC9 | 5 |
| T-FND-07 | Dựng bảng `attachments` và API `POST /api/attachments` | API | BE | 5 | 10 | P0 | FND-03 | — | G-10, BC-45, BC-82, SCR-010 A-07, SCR-022 F-08 … | 3 |
| T-FND-08 | Viết spec khung ứng dụng (menu, header, nhãn 業務日 và mạng) | Doc | BrSE | 3 | 6 | P1 | — | — | 06 Mục 4 #10, ADR-009 §1, ADR-010 | 1 |
| T-FND-09 | Dựng khung ứng dụng theo spec app shell | UI | FE | 5 | 10 | P1 | FND-08, BDAY-03 | — | 06 Mục 4 #10, G-02 | 1 |
| T-FND-10 | Thống nhất bộ dữ liệu test chung và fixture factory | Test | QA | 5 | 8 | P0 | — | — | 06 Mục 4 #8, 04 README | 1 |
| T-FND-11 | Chuẩn hóa danh mục mã lỗi `{error, code}` với câu JP + VI | API | BE | 3 | 5 | P0 | — | — | G-24, BC-89, SCR-016 §9 | 2 |
| T-FND-12 | Dựng khung test tích hợp DB và E2E Playwright chạy trong CI | Test | QA | 5 | 10 | P0 | — | — | 04 README, ADR-010, KPI-03 | 1 |

- **T-FND-01** — Bảng items(code PK, name, unit) không phiên bản; lots.item_code FK items.code; migrate text tự do sang mã. Đơn vị cố định theo mặt hàng (BC-37). *DoD:* Lô mới chỉ nhận item_code có trong items; đơn vị lấy từ items.unit; dữ liệu cũ map hết, không còn cột text tự do.
- **T-FND-02** — Mọi cột *_by/actor/maker_id/checker_id hiện có trỏ FK profiles(id); kiểm dữ liệu mồ côi trước khi thêm ràng buộc. *DoD:* Mọi cột người làm có FK; insert actor không tồn tại bị DB từ chối.
- **T-FND-03** — Thêm vai trò rule_admin (giữ market_ops, ghi giả định S) và các quyền: qualifications.approve, days.open, recon.reopen.request/approve, rules.draft/approve/read, attachments.upload; cấp participants.read cho approver. *DoD:* Có 9 vai trò; mỗi mã quyền 06 §4.1 tồn tại và được cấp đúng vai trò đích; vai trò thiếu quyền nhận 403 AUTH-403.
- **T-FND-04** — Mã lô/giao dịch lấy từ bộ đếm theo ngày, khóa dòng khi tăng; dòng -R/-A không tăng bộ đếm. *DoD:* Mã L<YYMMDD>-NNN / T<YYMMDD>-NNNN liên tục theo ngày, không trùng khi chạy song song; -R/-A giữ mã gốc + hậu tố.
- **T-FND-05** — Trạng thái lô (受付/販売中/完売…) tính từ available_qty và giao dịch; bỏ cập nhật cứng để duyệt điều chỉnh không làm lệch. *DoD:* Sau duyệt điều chỉnh, trạng thái lô hiển thị khớp tồn mà không cần cập nhật tay.
- **T-FND-06** — Partial unique index một yêu cầu điều chỉnh đang xử lý (pending, need_info) mỗi giao dịch; CHECK lý do khi từ chối; CHECK hạng thuộc danh sách qua tham số hàm. *DoD:* Bỏ qua API, ghi thẳng DB vẫn bị chặn đúng 3 quy tắc; SCR-022 AC9 đạt.
- **T-FND-07** — Lưu file Supabase Storage, metadata owner_type/owner_id, retention_class BUSINESS_7Y | EVIDENCE_3Y_COLD; chỉ PDF/JPG/PNG ≤ 10 MB; quyền attachments.upload. *DoD:* Upload hợp lệ trả attachment_id; sai loại/quá 10 MB trả E-06; thiếu quyền 403; file không đọc được công khai.
- **T-FND-08** — Spec app shell còn thiếu: menu theo quyền, header hiện 業務日 hiện tại + trạng thái, nhãn オフライン, thông báo trong app, M-06 dùng chung. *DoD:* Spec app shell được lead NHẬN; có §5/§7/§10 như các spec khác.
- **T-FND-09** — Layout chung: menu ẩn/hiện theo quyền, header lấy 業務日 từ server, chỗ hiển thị nhãn mạng và thông báo. *DoD:* Mọi trang dùng chung shell; header hiện đúng 業務日 JST hoặc 「業務日未開始」; menu đúng quyền.
- **T-FND-10** — Một bộ dữ liệu (M-002, W-001/W-002, B-003, R-003…) dùng cho mọi AC; factory dựng Given cho từng tiêu chí, không phụ thuộc seed. *DoD:* Mọi test AC của 9 spec dựng dữ liệu bằng factory; tên mẫu thống nhất giữa các spec.
- **T-FND-11** — Module dùng chung dịch mã raise từ DB (RJ-xx, E-xx, V0xx-xx, M-xx, LOCKED_DAY…) sang câu JP + VI; UI nhãn tiếng Nhật (BC-89). *DoD:* Mọi lỗi nghiệp vụ trả {error, code}; câu JP + VI đúng bảng spec; không còn câu chỉ tiếng Việt.
- **T-FND-12** — Supabase local cho test tích hợp hàm fn_*, Playwright cho E2E (kể cả chế độ offline), chạy trên CI mỗi PR; dùng fixture của T-FND-10. *DoD:* PR chạy được test tích hợp DB và E2E trên CI; một test mẫu cho mỗi loại xanh.

### E-AUD — Audit nghiệp vụ trong cùng giao dịch (ADR-006)

**Mục tiêu:** Không thao tác nào thành công mà thiếu vết; lần bị chặn ở ngày khóa luôn có dòng blocked_edit (KPI-03 ≥ 98%).  
**Phạm vi:** audit_logs chỉ thêm, fn_audit trong hàm, fn_log_blocked_edit, test KPI-03.  
**Tổng:** 4 task · 16 SP · 28 h · cờ: —

| ID | Tiêu đề | Tầng | Vai trò | SP | Giờ | Ưu tiên | Phụ thuộc | Cờ | Nguồn | Sprint |
|---|---|---|---|---:|---:|---|---|---|---|---|
| T-AUD-01 | Chặn UPDATE/DELETE `audit_logs` và thêm index tra cứu | DB | BE | 2 | 4 | P0 | — | — | G-06, ADR-006, BC-81, 03 §2 | 1 |
| T-AUD-02 | Viết `fn_log_blocked_edit` và helper API bắt mã `LOCKED_DAY` | DB | BE | 3 | 6 | P0 | AUD-01, FND-11 | Ngày khóa & điều chỉnh | G-06, G-03, ADR-006, BC-43 | 2 |
| T-AUD-03 | Chuyển ghi audit vào trong các hàm `fn_*` (cùng giao dịch) | DB | BE | 8 | 12 | P0 | AUD-01 | — | G-06, ADR-006, BC-81, KPI-03 | 1 |
| T-AUD-04 | Kiểm thử KPI-03: đủ trước/sau, người làm cho mọi thao tác ghi | Test | QA | 3 | 6 | P0 | AUD-02, AUD-03, FND-12 | — | G-06, KPI-03, BC-81, SCR-010 AC8 | 2 |

- **T-AUD-01** — Trigger chặn sửa/xóa kể cả service_role; index (action, entity_id, at) để đếm lần đăng nhập sai và tra theo mã. *DoD:* Mọi UPDATE/DELETE trên audit_logs bị lỗi; truy vấn đếm login_failed 15 phút dùng index.
- **T-AUD-02** — Hàm ghi action=blocked_edit trong giao dịch riêng; helper API bắt LOCKED_DAY từ mọi RPC rồi gọi hàm này, không dùng dblink. *DoD:* Thao tác vào ngày đã khóa trả 400 và có đúng một dòng blocked_edit (entity, ngày, actor).
- **T-AUD-03** — Helper fn_audit(actor, action, entity, id, before, after, reason); các hàm as-built nhận p_reason và tự ghi; bỏ writeAuditLog() sau thao tác. *DoD:* Không còn lời gọi writeAuditLog sau thao tác; mỗi thao tác ghi có đúng 1 dòng audit cùng giao dịch.
- **T-AUD-04** — Test tích hợp quét mọi hàm ghi: có before/after/actor/reason; lỗi audit làm rollback; blocked_edit ghi được. *DoD:* SCR-010 AC8 đạt; tỉ lệ dòng giao dịch có đủ trước/sau + người làm = 100% trên dữ liệu test.

### E-RULE — Quy tắc chợ có phiên bản & tham số hệ thống (ADR-008, SCR-034)

**Mục tiêu:** Đổi quy tắc/tỷ lệ bằng phiên bản có maker–checker, ngày hiệu lực tương lai, rollback, ≤ 4 lần/năm, không deploy; tham số bảo mật hiệu lực ngay.  
**Phạm vi:** rule_sets, rule_values, fn_rule/fn_rule_set, item_tax_rates, system_settings/fn_setting, luồng soạn–duyệt, màn hình SCR-034.  
**Tổng:** 15 task · 66 SP · 118 h · cờ: Quy tắc phiên bản

| ID | Tiêu đề | Tầng | Vai trò | SP | Giờ | Ưu tiên | Phụ thuộc | Cờ | Nguồn | Sprint |
|---|---|---|---|---:|---:|---|---|---|---|---|
| T-RULE-01 | Tạo `rule_sets` và `rule_values` với trigger bất biến | DB | BE | 5 | 8 | P0 | — | Quy tắc phiên bản | G-05, ADR-008, BC-14, BC-16, BC-18 | 1 |
| T-RULE-02 | Viết `fn_validate_rule_value` theo danh mục khóa ADR-008 | DB | BE | 5 | 10 | P0 | RULE-01 | Quy tắc phiên bản | G-05, ADR-008 danh mục khóa, SCR-034 AC8, SCR-034 AC11 | 1 |
| T-RULE-03 | Viết `fn_rule_set(date)`, `fn_rule(key, date)` và seed phiên bản v1 | DB | BE | 3 | 6 | P0 | RULE-02 | Quy tắc phiên bản | G-05, ADR-008 §4, BC-17, SCR-034 AC4 | 1 |
| T-RULE-04 | Tạo `item_tax_rates` thuế suất theo phiên bản | DB | BE | 2 | 4 | P0 | RULE-01, FND-01 | Quy tắc phiên bản | BC-22, BC-70, Q29, ADR-008 §3 | 1 |
| T-RULE-05 | Tạo `system_settings` và `fn_setting(key)` | DB | BE | 3 | 6 | P0 | AUD-03 | Quy tắc phiên bản | ADR-008 §9, BC-85, BC-86, G-23 | 1 |
| T-RULE-06 | Thay hằng số hardcode ở API/UI bằng `fn_rule` | API | FE | 3 | 6 | P1 | RULE-03 | Quy tắc phiên bản | G-05, BC-19, SCR-010 §11, SCR-012 §11 | 2 |
| T-RULE-07 | Viết hàm soạn phiên bản: tạo nháp, lưu nháp, gửi duyệt | DB | BE | 8 | 12 | P0 | RULE-03, AUD-03, BDAY-02 | Quy tắc phiên bản | ADR-008 §6-7, BC-15, BC-17, SCR-034 §7, SCR-034 AC3 … | 2 |
| T-RULE-08 | Viết `fn_approve_rule_set` duyệt / trả lại | DB | BE | 5 | 8 | P0 | RULE-07 | Quy tắc phiên bản | ADR-008, BC-16, BC-88, SCR-034 AC2, SCR-034 AC6 | 3 |
| T-RULE-09 | Dựng API ghi `/api/rules` (nháp, lưu, gửi, duyệt, trả lại, xóa nháp) | API | BE | 5 | 10 | P0 | RULE-08, FND-03 | Quy tắc phiên bản | SCR-034 §7, ADR-004, G-16, SCR-034 AC10 | 4 |
| T-RULE-10 | Dựng API đọc: so sánh, mô phỏng ngày, xuất lịch sử RPT-12 | API | FE | 5 | 8 | P0 | RULE-03 | Quy tắc phiên bản | SCR-034 §7, SCR-034 AC9, BC-74, RPT-12 | 2 |
| T-RULE-11 | Dựng màn hình SCR-034: danh sách, lịch sử, so sánh, mô phỏng ngày | UI | FE | 5 | 10 | P0 | RULE-10 | Quy tắc phiên bản | SCR-034 §5, SCR-034 §7, SCR-034 AC1, SCR-034 AC9 | 2 |
| T-RULE-12 | Dựng trình sửa phiên bản theo kiểu khóa (SCR-034 edit) | UI | FE | 8 | 12 | P0 | RULE-09, RULE-14 | Quy tắc phiên bản | SCR-034 §5, SCR-034 AC8, 06 Mục 4 #6 | 4 |
| T-RULE-13 | Dựng thao tác gửi duyệt / duyệt / trả lại có hộp xác nhận | UI | FE | 3 | 6 | P0 | RULE-12 | Quy tắc phiên bản | SCR-034 §7, 06 Mục 4 #1, SCR-034 AC2, SCR-034 AC7 | 4 |
| T-RULE-14 | Chỉnh spec SCR-034: bỏ F-21 và thống nhất thuế suất 0–1 hiển thị % | Doc | BrSE | 1 | 2 | P0 | — | Quy tắc phiên bản | 06 Mục 4 #1, 06 Mục 4 #6, SCR-034 | 1 |
| T-RULE-15 | Kiểm thử SCR-034 AC1–AC11 | Test | QA | 5 | 10 | P0 | RULE-13, RULE-11 | Quy tắc phiên bản | SCR-034 §10, BC-19 | 4 |

- **T-RULE-01** — rule_sets(version_no, effective_from, status draft|submitted|approved|superseded, maker_id, checker_id <> maker, change_reason, over_limit_reason, rollback_of); rule_values(rule_set_id, key, value jsonb). *DoD:* SCR-034 AC5 phần DB: mọi UPDATE vào rule_values của bản approved bị trigger chặn.
- **T-RULE-02** — Kiểm kiểu/miền cho từng khóa (expiry_warning_days, grades, trade_kind_matrix, lock_checklist, incentive_rate_tiers…); từ chối khóa ngoài danh mục. *DoD:* SCR-034 AC11: gửi khóa ngoài danh mục → 400 「未定義の規則キーです」; ma trận rỗng một cột → 400.
- **T-RULE-03** — Chọn bản approved có effective_from lớn nhất ≤ ngày (trùng ngày lấy version_no lớn nhất); seed v1 bằng giá trị mặc định danh mục. *DoD:* SCR-034 AC4: mô phỏng ngày không tick F-32 trả bản approved mới nhất, không phải bản submitted.
- **T-RULE-04** — item_tax_rates(item_code, rule_set_id, tax_rate 0..1); bản nháp mới sao chép thuế suất của bản gốc (Q29, Plan A). *DoD:* Thuế suất đọc theo (item_code, fn_rule_set(業務日)); giá trị ngoài 0..1 bị từ chối.
- **T-RULE-05** — Tham số bảo mật/vận hành hiệu lực ngay, không phiên bản; mfa_required_roles luôn chứa sys_admin, rule_admin, approver; seed 8 khóa. *DoD:* Đổi khóa có hiệu lực từ request kế tiếp, rule_sets không đổi; gỡ sys_admin khỏi mfa_required_roles bị từ chối.
- **T-RULE-06** — Bỏ EXPIRY_WARNING_DAYS (api/dashboard), danh sách đơn vị, A/B/C, chặn wholesaler mua cứng; đọc qua fn_rule theo 業務日. *DoD:* Không còn hằng số quy tắc trong src/; đổi phiên bản thì dashboard đổi theo, không deploy.
- **T-RULE-07** — fn_create_rule_draft (sao chép, rollback_of), fn_save_rule_draft, fn_submit_rule_set: ≥1 khác biệt, effective_from > ngày tham chiếu, đếm 4 lần/năm JST, over_limit_reason từ lần 5. *DoD:* SCR-034 AC3 và AC7 đạt ở tầng hàm; rollback tạo bản nháp có rollback_of.
- **T-RULE-08** — Duyệt: checker ≠ maker, effective_from vẫn > ngày lúc duyệt, gán version_no, approved_at; trả lại về draft giữ lịch sử quyết định. *DoD:* SCR-034 AC2, AC6 đạt: maker tự duyệt bị chặn; rollback v1 sinh v3 với rollback_of = v1, v1/v2 không đổi.
- **T-RULE-09** — Route theo SCR-034 §7 với quyền rules.draft/rules.approve; duyệt cần phiên AAL2 (M-06 qua guard); map lỗi JP + VI. *DoD:* Mọi nút SCR-034 §7 có API; SCR-034 AC10 (settlement chỉ đọc, trade 403) đạt.
- **T-RULE-10** — GET /api/rules/diff, /api/rules/resolve?date=&include_pending= (ghi rõ chưa duyệt), /api/rules/history.csv. *DoD:* SCR-034 AC9: so sánh v1–v3 chỉ liệt kê khác biệt cũ → mới; CSV có kỳ áp dụng từng phiên bản.
- **T-RULE-11** — Danh sách phiên bản với trạng thái và kỳ áp dụng, so sánh 2 bản, mô phỏng ngày; chỉ đọc cho settlement. *DoD:* SCR-034 AC1 (demo đổi quy tắc không deploy) trình diễn được trên màn hình; AC9 hiển thị đúng.
- **T-RULE-12** — Trình sửa có kiểu: ma trận trade_kind (F-13), bậc khuyến khích tăng dần (F-17), thuế suất hiển thị % lưu 0–1 (F-18), lý do thay đổi, ngày hiệu lực. *DoD:* SCR-034 AC8: bỏ hết せり → 400 câu JP; min_ratio 50 rồi 30 → 400; thuế suất nhập 8 hiển thị 8% lưu 0.08.
- **T-RULE-13** — Nút 承認依頼, 承認, 差戻し với hộp xác nhận (bỏ radio F-21); ô over_limit_reason khi vượt 4 lần. *DoD:* Luồng draft → submitted → approved/return chạy hết trên UI; không còn radio F-21.
- **T-RULE-14** — Hai điểm tồn đọng Mục 4 #1, #6: bỏ radio F-21 giữ nút có hộp xác nhận như SCR-022; F-18 lưu 0–1, màn hình và câu lỗi theo %. *DoD:* Spec SCR-034 không còn F-21; F-18 ghi rõ lưu 0–1 / hiển thị %.
- **T-RULE-15** — Chạy đủ 11 tiêu chí, gồm demo BC-19 không deploy, maker ≠ checker, ngày hiệu lực tương lai, rollback, 4 lần/năm. *DoD:* SCR-034 AC1–AC11 đạt; có bằng chứng demo đổi quy tắc không deploy.

### E-BDAY — Ngày nghiệp vụ JST & mở ngày (ADR-009)

**Mục tiêu:** Một định nghĩa 業務日 duy nhất theo JST; mọi ghi chép kiểm theo ngày hiện tại, không theo đồng hồ/UTC.  
**Phạm vi:** Trạng thái business_days, market_calendar, fn_current_business_date, fn_assert_*, fn_open_day, bỏ ngày UTC ở UI.  
**Tổng:** 8 task · 26 SP · 47 h · cờ: Ngày nghiệp vụ JST

| ID | Tiêu đề | Tầng | Vai trò | SP | Giờ | Ưu tiên | Phụ thuộc | Cờ | Nguồn | Sprint |
|---|---|---|---|---:|---:|---|---|---|---|---|
| T-BDAY-01 | Mở rộng `business_days` theo trạng thái và thêm `market_calendar` | DB | BE | 3 | 6 | P0 | — | Ngày nghiệp vụ JST | G-07, ADR-009 §1-2, ADR-009 §7, BC-41, 03 §2 | 1 |
| T-BDAY-02 | Viết hàm ngày nghiệp vụ: `fn_current_business_date`, `fn_business_date`, `fn_assert_*` | DB | BE | 5 | 8 | P0 | BDAY-01, RULE-05 | Ngày nghiệp vụ JST | G-02, ADR-009 §1-4, BC-39, BC-40 | 1 |
| T-BDAY-03 | Dựng API `GET /api/business-days/current` và danh sách theo trạng thái | API | FE | 2 | 4 | P0 | BDAY-02 | Ngày nghiệp vụ JST | ADR-009 §1, 06 Mục 1 §4.2, G-02 | 1 |
| T-BDAY-04 | Viết `fn_open_day` và API `POST /api/business-days` | DB | BE | 5 | 10 | P0 | BDAY-02, RULE-03, AUD-03, FND-03 | Ngày nghiệp vụ JST | G-07, ADR-009 §5, BC-41, SCR-024 §7, SCR-024 AC1 … | 4 |
| T-BDAY-05 | Thay ngày UTC ở UI bằng 業務日 từ server | UI | FE | 5 | 8 | P0 | BDAY-03 | Ngày nghiệp vụ JST | G-02, G-07, ADR-009, SCR-016 §11, SCR-019 §11 | 1 |
| T-BDAY-06 | Nạp lịch chợ `market_calendar` và import CSV ngày nghỉ | API | FE | 2 | 4 | P1 | BDAY-01 | Ngày nghiệp vụ JST | BC-41, ADR-009 §7, G-07 | 1 |
| T-BDAY-07 | Kiểm thử ngày nghiệp vụ JST và mở ngày | Test | QA | 3 | 6 | P0 | BDAY-04 | Ngày nghiệp vụ JST | ADR-009, SCR-029 AC10, SCR-010 AC1, SCR-024 AC1, SCR-024 AC2 | 4 |
| T-BDAY-08 | Chỉnh spec RJ-11: câu riêng khi chưa mở ngày | Doc | BrSE | 1 | 1 | P1 | — | Ngày nghiệp vụ JST | 06 Mục 4 #2, SCR-016 §9 | 1 |

- **T-BDAY-01** — status open|closing|reopened|locked, partial unique một ngày open; opened_at, open_reason, lock_comment, lock_checklist_snapshot, exported; bảng market_calendar. *DoD:* Insert ngày open thứ hai bị DB từ chối; dữ liệu cũ map đúng trạng thái.
- **T-BDAY-02** — fn_current_business_date() = ngày open duy nhất hoặc NULL; fn_business_date(ts) theo Asia/Tokyo − business_day_start_time (chỉ cảnh báo/gợi ý); fn_assert_current_day / fn_assert_day_editable raise LOCKED_DAY / DAY_NOT_OPEN / NOT_CURRENT_DAY. *DoD:* Lúc 07:30 JST (22:30 UTC hôm trước) ngày trả về là ngày open; khi không có ngày open trả NULL, không suy từ đồng hồ.
- **T-BDAY-03** — Trả {day, status} hoặc {day:null, suggested_day}; GET /api/business-days?status= cho SCR-016/019/024. *DoD:* Màn hình không tự tính 'hôm nay'; API trả đúng 2 dạng theo ADR-009 §1.
- **T-BDAY-04** — Chặn ngày nghỉ, ngày đã có, ngày không lớn hơn ngày mới nhất; ngày trước chưa khóa: warn_with_reason (lý do bắt buộc) hoặc block; ngày open cũ → closing trong cùng giao dịch; audit open_day. *DoD:* SCR-024 AC1 (ngày nghỉ → 400) và AC2 (thiếu lý do → 400; có lý do → 15 closing, 16 open, chỉ một ngày open) đạt.
- **T-BDAY-05** — Bỏ toISOString()/BusinessDayPicker; mọi form và dashboard lấy ngày từ /api/business-days/current; cờ hết hạn do server tính. *DoD:* Lúc 00:00–09:00 JST màn hình không còn hiện ngày hôm trước; không còn bộ chọn ngày ở màn hình nhập.
- **T-BDAY-06** — Seed lịch chợ 2026–2027 (6 ngày/tuần + ngày nghỉ, giả định S chờ khách cung cấp); API import CSV cho settlement. *DoD:* Lịch 2026–2027 có trong DB; import lại cùng file không tạo trùng.
- **T-BDAY-07** — Test biên JST/UTC, một ngày open, closing, không gán ngày theo đồng hồ khi chưa mở ngày. *DoD:* Các AC liệt kê đạt; không có thao tác ghi nào dựa vào đồng hồ.
- **T-BDAY-08** — RJ-11 dùng {day} nhưng khi không có ngày open thì null; thêm câu riêng 「業務日が開始されていません」. *DoD:* Spec có câu RJ cho trường hợp chưa mở ngày, không dùng {day} null.

### E-QUAL — Tư cách tham gia theo căn cứ 登録/許可/承認 (ADR-007, SCR-010)

**Mục tiêu:** Tách tư cách theo căn cứ, vòng đời tạm dừng/gỡ riêng cho từng nhóm, thông báo từ chối đúng loại căn cứ (tránh loại hồ sơ 12-06).  
**Phạm vi:** party_kinds/party_kind_basis, participant_qualifications, qualification_events, 3 hàm fn_qualification_*, migrate, API + màn hình SCR-010.  
**Tổng:** 11 task · 51 SP · 93 h · cờ: 許可/承認

| ID | Tiêu đề | Tầng | Vai trò | SP | Giờ | Ưu tiên | Phụ thuộc | Cờ | Nguồn | Sprint |
|---|---|---|---|---:|---:|---|---|---|---|---|
| T-QUAL-01 | Tạo `party_kinds` và `party_kind_basis` (suspend_policy) | DB | BE | 2 | 4 | P0 | — | 許可/承認 | G-01, ADR-007 §1-2, BC-01, BC-02, BC-03 … | 1 |
| T-QUAL-02 | Tạo `participant_qualifications` và `qualification_events` | DB | BE | 3 | 6 | P0 | QUAL-01 | 許可/承認 | G-01, ADR-007 §1, SCR-010 §5, 06 Mục 1 §4.4 | 1 |
| T-QUAL-03 | Migrate tư cách từ `participants` sang bảng mới rồi bỏ cột cũ | DB | BE | 5 | 8 | P0 | QUAL-02 | 許可/承認 | G-01, G-24, 03 §3, ADR-007 Hệ quả | 1 |
| T-QUAL-04 | Viết `fn_qualification_state(qid, business_date)` | DB | BE | 3 | 5 | P0 | QUAL-03, RULE-03 | 許可/承認 | G-01, G-02, ADR-007 §3, SCR-010 AC1 | 2 |
| T-QUAL-05 | Viết `fn_qualification_block_reason(party, day, purpose)` theo căn cứ | DB | BE | 5 | 10 | P0 | QUAL-04, FND-11 | 許可/承認 | G-01, G-24, ADR-007 §3, ADR-007 §6, BC-06 … | 2 |
| T-QUAL-06 | Viết `fn_qualification_event` rẽ nhánh theo suspend_policy | DB | BE | 8 | 12 | P0 | QUAL-02, AUD-03, BDAY-02 | 許可/承認 | G-01, ADR-007 §3-4, SCR-010 §7, SCR-010 §9 | 2 |
| T-QUAL-07 | Dựng API tư cách cho SCR-010 | API | BE | 5 | 10 | P0 | QUAL-06, QUAL-04 | 許可/承認 | G-01, SCR-010 §7, 06 Mục 1 §4.2 | 3 |
| T-QUAL-08 | Dựng API `GET /api/participants?purpose=sell|buy&day=` có cờ trạng thái | API | FE | 2 | 4 | P0 | QUAL-04 | 許可/承認 | G-01, G-02, C-08, SCR-012 F-02, SCR-016 §11 | 2 |
| T-QUAL-09 | Dựng màn hình SCR-010: thông tin, danh sách tư cách, cảnh báo hạn | UI | FE | 5 | 10 | P0 | QUAL-07 | 許可/承認 | G-01, G-24, SCR-010 §5, SCR-010 AC1, SCR-010 AC9 | 3 |
| T-QUAL-10 | Dựng form A/B/C/D của SCR-010 theo căn cứ | UI | FE | 8 | 14 | P0 | QUAL-09, FND-07 | 許可/承認 | G-01, SCR-010 §5, SCR-010 §7, SCR-010 AC2-AC5 | 4 |
| T-QUAL-11 | Kiểm thử SCR-010 AC1–AC9 | Test | QA | 5 | 10 | P0 | QUAL-10 | 許可/承認 | SCR-010 §10, RFP 12-06 | 5 |

- **T-QUAL-01** — 4 nhóm 卸売業者/仲卸/売買参加者/買出人 và căn cứ hợp lệ market_registration/permit/approval/point_registration với suspend_policy approval|conditional|re_review|direct. *DoD:* Bảng 03 §3 có trong DB; không thể gán căn cứ sai nhóm.
- **T-QUAL-02** — Bản ghi tư cách theo căn cứ (số hiệu, cơ quan cấp, hiệu lực, status, conditions chỉ permit, updated_at làm version) + sự kiện vòng đời với payload jsonb. *DoD:* SCR-010 AC6 ở tầng DB: (仲卸, approval) bị FK từ chối; khoảng trùng → E-08.
- **T-QUAL-03** — Ánh xạ buyer→participant_buyer, retail_buyer→point_buyer, license→permit, registration theo nhóm; sinh sự kiện apply/approve lịch sử; script rollback. *DoD:* 100% người tham gia có bản ghi tư cách đúng căn cứ; registration của 卸売業者 và 買出人 tách đúng.
- **T-QUAL-04** — Trả valid | not_started | suspended | re_review | expired theo ngày nghiệp vụ; mốc hạn theo khóa qualification_valid_to_inclusive. *DoD:* SCR-010 AC1: lúc 08:30 JST ngày 2026-10-16, 許可 hết 2026-10-15 trả expired (không phải theo ngày UTC).
- **T-QUAL-05** — sell/buy trả NULL hoặc RJ-01…RJ-08a riêng theo căn cứ (許可/承認/取引地点登録/市場登録, seller_registration_check); deliver trả {block|allow_with_flag|allow, code} theo delivery_expired_policy. *DoD:* SCR-016 AC2/AC3/AC4/AC14 ở tầng hàm: 許可 hết hạn → RJ-01, 承認 再審査 → RJ-05, 買出人 hết hạn → RJ-06, chưa hiệu lực → RJ-01a.
- **T-QUAL-06** — apply/approve/suspend/lift/re_review/expire: 承認 không gỡ trực tiếp (E-13); 市場登録 gỡ cần qualifications.approve và ≠ người tạm dừng (E-14/E-15); 許可 gỡ cần xác nhận điều kiện (E-10); ghi event + audit cùng giao dịch. *DoD:* SCR-010 AC2–AC5 đạt ở tầng hàm; lift trên 承認 trả E-13 và không có qualification_events mới.
- **T-QUAL-07** — GET /api/participants/{id} (kèm state), POST …/qualifications, POST /api/qualifications/{qid}/events, PATCH /api/participants/{id} (lý do bắt buộc); version → 409 E-17. *DoD:* Mọi nút SCR-010 §7 có API; hai người sửa cùng lúc → người sau 409 E-17.
- **T-QUAL-08** — Server lọc nhóm theo purpose và gắn cờ bằng fn_qualification_state; dùng cho SCR-012/016/019. *DoD:* Danh sách chọn người có cờ do server tính theo 業務日 JST; đúng nhóm theo purpose.
- **T-QUAL-09** — Huy hiệu trạng thái với nhãn JP đúng căn cứ, dải đỏ/vàng theo expiry_warning_days, lịch sử sự kiện; intake chỉ xem trạng thái. *DoD:* SCR-010 AC1 (dải đỏ 「許可は2026/10/15に失効しています」) và AC9 (intake không thấy lịch sử/nút ghi) đạt.
- **T-QUAL-10** — Form đăng ký/gia hạn, tạm dừng, gỡ/再審査, liên hệ; nút hiện theo suspend_policy — không có 解除 cho 承認; C-02 hiện nguyên văn điều kiện. *DoD:* SCR-010 AC2–AC5 đạt trên UI; 承認 bị tạm dừng chỉ có nút 再審査を開始.
- **T-QUAL-11** — Tập trung các điểm có thể bị loại hồ sơ: phân biệt 許可/承認, luồng 再審査, maker ≠ checker khi gỡ 市場登録. *DoD:* SCR-010 AC1–AC9 đạt (AC10 offline kiểm ở T-OFF-08).

### E-SEC — Đăng nhập, MFA, khóa tạm & timeout (SCR-001)

**Mục tiêu:** MFA theo phiên (AAL2) cho vai trò quản trị/duyệt; khóa tạm khi sai nhiều lần; timeout theo system_settings.  
**Phạm vi:** API login/MFA/logout, guard AAL2, khóa tạm, timeout, màn hình đăng nhập, màn hình cài đặt hệ thống.  
**Tổng:** 11 task · 33 SP · 63 h · cờ: MFA/Bảo mật

| ID | Tiêu đề | Tầng | Vai trò | SP | Giờ | Ưu tiên | Phụ thuộc | Cờ | Nguồn | Sprint |
|---|---|---|---|---:|---:|---|---|---|---|---|
| T-SEC-01 | Làm lại API đăng nhập với thông báo M-01…M-04 và audit | API | BE | 3 | 6 | P0 | AUD-01, FND-11 | MFA/Bảo mật | SCR-001 §7, BC-86, G-06, SCR-001 AC5, SCR-001 AC6 … | 4 |
| T-SEC-02 | Khóa tạm tài khoản khi đăng nhập sai nhiều lần | API | BE | 3 | 6 | P1 | SEC-01, RULE-05 | MFA/Bảo mật | G-23, BC-86, SCR-001 AC4 | 5 |
| T-SEC-03 | Timeout phiên nhàn rỗi và tuyệt đối trong `proxy.ts` | API | FE | 3 | 6 | P1 | RULE-05, SEC-01 | MFA/Bảo mật | G-23, BC-86, SCR-001 AC7, SCR-001 AC8 | 5 |
| T-SEC-04 | Dựng API MFA TOTP: đăng ký và xác minh | API | BE | 5 | 8 | P0 | SEC-01 | MFA/Bảo mật | G-19, BC-85, NFR-SEC-01, SCR-001 §7, SCR-001 AC3 | 4 |
| T-SEC-05 | Bắt buộc AAL2 trong `guard()` và `proxy.ts` cho vai trò cần MFA | API | BE | 3 | 6 | P0 | SEC-04, RULE-05 | MFA/Bảo mật | G-19, BC-85, SCR-001 AC2, SCR-022 §11, SCR-024 §11 … | 4 |
| T-SEC-06 | Dựng màn hình đăng nhập và bước MFA (SCR-001) | UI | FE | 5 | 10 | P0 | SEC-04, SEC-09 | MFA/Bảo mật | G-19, SCR-001 §5, SCR-001 §7, SCR-001 AC10 | 4 |
| T-SEC-07 | Dựng API sửa `system_settings` (sys_admin, lý do bắt buộc) | API | BE | 2 | 4 | P1 | RULE-05, SEC-05 | MFA/Bảo mật | ADR-008 §9, SCR-001 AC8, G-23 | 5 |
| T-SEC-08 | Dựng màn hình cài đặt hệ thống cho sys_admin | UI | FE | 3 | 6 | P1 | SEC-07 | MFA/Bảo mật | ADR-008 §9, ADR-008 Hệ quả | 5 |
| T-SEC-09 | Chỉnh spec M-06: tách câu chưa đăng ký / chưa xác minh | Doc | BrSE | 1 | 1 | P0 | — | MFA/Bảo mật | 06 Mục 4 #4, SCR-001 §5 | 1 |
| T-SEC-10 | Kiểm thử đăng nhập và MFA (SCR-001 AC1–AC3, AC5, AC6, AC9, AC10) | Test | QA | 3 | 6 | P0 | SEC-06, SEC-05 | MFA/Bảo mật | SCR-001 §10, G-19 | 6 |
| T-SEC-11 | Kiểm thử khóa tạm, timeout và cài đặt (SCR-001 AC4, AC7, AC8) | Test | QA | 2 | 4 | P1 | SEC-02, SEC-03, SEC-08 | MFA/Bảo mật | SCR-001 §10, G-23 | 6 |

- **T-SEC-01** — Chuẩn hóa email, M-02 chung cho email không tồn tại/sai mật khẩu, M-04 tài khoản vô hiệu, chặn open redirect ?next, ghi login/login_failed/logout. *DoD:* SCR-001 AC1, AC5, AC6, AC9 đạt; login_failed lưu email đã chuẩn hóa, không lưu mật khẩu.
- **T-SEC-02** — Đếm login_failed theo email trong login_failure_window_min; đạt login_max_failures thì khóa login_lock_min, trả 423 M-03 với giờ mở khóa JST, ghi account_locked. *DoD:* SCR-001 AC4: sai 5 lần trong 15 phút rồi đúng ở lần 6 vẫn 423 M-03; có account_locked.
- **T-SEC-03** — Cookie last_seen; hết session_idle_timeout_min hoặc session_absolute_hours thì hủy phiên, về /login?reason=timeout (M-07), ghi session_timeout. *DoD:* SCR-001 AC7 đạt; đổi timeout 30 → 20 áp dụng từ request kế tiếp (AC8).
- **T-SEC-04** — POST /api/auth/mfa/enroll và /verify qua Supabase MFA; sai mã M-05 tính vào bộ đếm; ghi mfa_enrolled/mfa_failed. *DoD:* SCR-001 AC3: sys_admin chưa có factor phải đăng ký QR, chỉ vào được sau khi đạt AAL2.
- **T-SEC-05** — Vai trò trong system_settings.mfa_required_roles chưa đạt AAL2 → mọi /api/* có guard trả 401 M-06; không hỏi MFA lại theo thao tác. *DoD:* SCR-001 AC2: approver chưa nhập mã gọi API có guard → 401 M-06.
- **T-SEC-06** — Bước 1 email/mật khẩu; bước 2 nhập mã hoặc đăng ký QR; quay lại hủy phiên AAL1; M-07 khi timeout, M-08 khi mất mạng, không gửi lặp. *DoD:* SCR-001 AC2, AC3, AC10 đạt trên UI.
- **T-SEC-07** — PUT /api/system-settings/{key} quyền settings.manage; kiểm giá trị theo key; audit before/after cùng giao dịch; hiệu lực ngay. Màn hình chưa có spec (S). *DoD:* SCR-001 AC8: đổi timeout không tạo rule_sets mới, audit có before/after.
- **T-SEC-08** — Bảng khóa system_settings với giá trị, người/lúc sửa, form sửa có lý do; không có spec riêng — giả định (S) theo ADR-008 Hệ quả. *DoD:* sys_admin sửa được 8 khóa; vai trò khác không thấy menu.
- **T-SEC-09** — M-06 hiện nói 'đăng ký app xác thực' cho cả người đã đăng ký nhưng chưa xác minh phiên; tách thành hai câu. *DoD:* Spec có M-06a (chưa đăng ký) và M-06b (chưa xác minh phiên này).
- **T-SEC-10** — Các tiêu chí đăng nhập/MFA/redirect/mất mạng. *DoD:* Các AC liệt kê của SCR-001 đạt.
- **T-SEC-11** — Các tiêu chí phụ thuộc system_settings. *DoD:* SCR-001 AC4, AC7, AC8 đạt.

### E-LOT — Tiếp nhận & đánh giá lô (SCR-012/013)

**Mục tiêu:** Tiếp nhận lô theo 業務日 hiện tại với mặt hàng chuẩn; đánh giá qua hàm, chặn ngày khóa, người quyết định là người.  
**Phạm vi:** fn_create_lot, fn_inspect_lot, API lots, UI tiếp nhận/đánh giá, test SCR-012.  
**Tổng:** 6 task · 23 SP · 40 h · cờ: —

| ID | Tiêu đề | Tầng | Vai trò | SP | Giờ | Ưu tiên | Phụ thuộc | Cờ | Nguồn | Sprint |
|---|---|---|---|---:|---:|---|---|---|---|---|
| T-LOT-01 | Sửa `fn_create_lot`: item_code, client_ref, ngày hiện tại, kiểm bên bán | DB | BE | 5 | 8 | P0 | FND-01, BDAY-02, QUAL-05, AUD-03 | — | SCR-012 §5.1, G-02, G-15, G-20, BC-10 … | 3 |
| T-LOT-02 | Viết `fn_inspect_lot` và API `POST /api/lots/{id}/inspection` | DB | BE | 5 | 8 | P0 | BDAY-02, RULE-03, AUD-02 | Ngày khóa & điều chỉnh | G-04, BC-43, BC-47, BC-29, SCR-012 §5.2 … | 4 |
| T-LOT-03 | Cập nhật API `POST /api/lots` (item_code, client_ref, mã lỗi) | API | FE | 2 | 4 | P0 | LOT-01 | — | SCR-012 §7, G-20, ADR-010 §1, SCR-012 AC5 | 3 |
| T-LOT-04 | Dựng form tiếp nhận lô SCR-012 | UI | FE | 5 | 8 | P0 | LOT-03, QUAL-08, BDAY-05 | — | SCR-012 §5.1, SCR-012 §7, SCR-012 AC1, G-15 | 3 |
| T-LOT-05 | Dựng màn hình đánh giá lô SCR-013 và in nhãn | UI | FE | 3 | 6 | P0 | LOT-02 | — | SCR-012 §5.2, SCR-012 AC8, BC-29, G-04 | 5 |
| T-LOT-06 | Kiểm thử SCR-012 AC1–AC4, AC7–AC9 | Test | QA | 3 | 6 | P0 | LOT-04, LOT-05 | — | SCR-012 §10 | 6 |

- **T-LOT-01** — Lô chỉ vào ngày hiện tại (fn_assert_current_day), bên bán phải 卸売業者 không bị tạm dừng (purpose=sell), client_ref trùng trả bản ghi cũ, audit trong hàm. *DoD:* SCR-012 AC2 (W-002 tạm dừng → 400), AC3 (M-001 làm bên bán → 400), AC4 (ngày khóa → 400 + blocked_edit) đạt ở tầng hàm.
- **T-LOT-02** — Hạng thuộc fn_rule('grades'); chặn ngày locked (fn_assert_day_editable + blocked_edit); lý do bắt buộc khi lô đã có giao dịch (kể cả đã hủy); inspected_by = người bấm. *DoD:* SCR-012 AC7: đổi A → B không lý do → 400; có lý do → 200 và audit before/after/reason.
- **T-LOT-03** — Nhận item_code, client_ref; trùng client_ref trả 200 cùng lots.id; map lỗi hàm sang JP + VI; giữ dữ liệu người dùng khi lỗi. *DoD:* Gửi lại cùng client_ref trả 200 cùng id, không tạo lô thứ hai.
- **T-LOT-04** — 業務日 chỉ đọc từ server, bên bán purpose=sell, mặt hàng có tìm kiếm, đơn vị chỉ đọc từ items, client_ref sinh khi mở form, nhập bằng bàn phím. *DoD:* SCR-012 AC1: nhập 120 → lô L261016-NNN, đơn vị kg lấy từ items.
- **T-LOT-05** — Hạng từ fn_rule, ô lý do hiện khi lô đã có giao dịch, không gợi ý hạng tự động; in nhãn lô có mã chính thức. *DoD:* SCR-012 AC8: không có nút/ô đề xuất hạng; inspected_by = người bấm Lưu.
- **T-LOT-06** — Các tiêu chí tiếp nhận/đánh giá online (AC5–AC6 offline kiểm ở T-OFF-08). *DoD:* SCR-012 AC1–AC4, AC7–AC9 đạt.

### E-TRADE — Chốt giao dịch 相対 & hủy (SCR-016/018)

**Mục tiêu:** Chốt giao dịch đúng thứ tự kiểm 01 §9.1, mã RJ-xx JP+VI, tồn không âm, lưu rule_set_id; hủy có người/lý do.  
**Phạm vi:** fn_confirm_trade, API trades, UI nhập bằng bàn phím, fn_cancel_trade + SCR-018, test chức năng và tải.  
**Tổng:** 8 task · 41 SP · 70 h · cờ: —

| ID | Tiêu đề | Tầng | Vai trò | SP | Giờ | Ưu tiên | Phụ thuộc | Cờ | Nguồn | Sprint |
|---|---|---|---|---:|---:|---|---|---|---|---|
| T-TRADE-01 | Viết lại `fn_confirm_trade` theo thứ tự kiểm 01 §9.1 | DB | BE | 8 | 14 | P0 | QUAL-05, RULE-03, BDAY-02, AUD-03 | 許可/承認 | G-24, G-01, BC-06, BC-33, 01 §9.1 … | 3 |
| T-TRADE-02 | Cập nhật API `POST /api/trades`: đọc body một lần, quyền theo kind, mã RJ | API | BE | 3 | 6 | P0 | TRADE-01, AUD-02 | — | SCR-016 §7, SCR-019 §7, ADR-006, SCR-016 AC7, SCR-016 AC11 | 3 |
| T-TRADE-03 | Dựng màn hình nhập 相対 SCR-016 thao tác bằng bàn phím | UI | FE | 8 | 12 | P0 | TRADE-02, QUAL-08, BDAY-05 | — | SCR-016 §5, SCR-016 §7, SCR-016 AC1, SCR-016 AC5, G-02 … | 4 |
| T-TRADE-04 | Thêm thông tin hủy và viết `fn_cancel_trade` + API | DB | BE | 5 | 8 | P0 | BDAY-02, AUD-02 | Ngày khóa & điều chỉnh | G-11, BC-47, BC-81, 01 §9.3, SCR-024 AC5 | 5 |
| T-TRADE-05 | Viết spec SCR-018 chi tiết giao dịch và hủy | Doc | BrSE | 2 | 4 | P1 | — | — | 04 README SCR-018, 01 §9.3 | 1 |
| T-TRADE-06 | Dựng màn hình chi tiết giao dịch SCR-018 | UI | FE | 5 | 8 | P1 | TRADE-04, TRADE-05 | — | G-11, 04 README SCR-018 | 5 |
| T-TRADE-07 | Kiểm thử SCR-016 AC1–AC9, AC11, AC13, AC14 | Test | QA | 5 | 10 | P0 | TRADE-03 | — | SCR-016 §10 | 5 |
| T-TRADE-08 | Kiểm thử tải chốt giao dịch: p95 ≤ 2 giây | Test | QA | 5 | 8 | P1 | TRADE-02 | — | SCR-016 AC12, BC-80, NFR-PERF-01 | 6 |

- **T-TRADE-01** — trade_kind_matrix → tư cách bên mua theo căn cứ → bên bán → tồn (khóa dòng lô) → ngày; lô phải thuộc ngày hiện tại (allow_trade_on_previous_day_lots); lưu rule_set_id, recorded_by; client_ref idempotent; audit trong hàm. *DoD:* SCR-016 AC8: M-004 tạm dừng + thiếu tồn → báo RJ-02 (đúng thứ tự); AC6 hai máy cùng chốt chỉ một thành công, tồn không âm.
- **T-TRADE-02** — Kiểm kind trước rồi guard (auction.record / trades.create), bỏ request.clone(); map RJ-xx JP + VI; LOCKED_DAY → blocked_edit. *DoD:* SCR-016 AC7 (ngày khóa giữa chừng → RJ-10 + đúng 1 blocked_edit) và AC11 (gửi lại client_ref → cùng giao dịch, trừ tồn một lần) đạt.
- **T-TRADE-03** — Tab/Enter, phím tắt Alt+L/B/Q, cờ tư cách do server tính, thông báo RJ, focus về 数量 sau khi chốt, bảng gần đây lọc 業務日 hiện tại limit 15. *DoD:* SCR-016 AC1 (chốt bằng bàn phím, focus về 数量) và AC5 (RJ-09 nêu 残数量, giữ field) đạt.
- **T-TRADE-04** — cancelled_by/at/cancel_reason; chỉ khi ngày editable (open/closing/reopened, kèm reopen_request_id), trả tồn, audit; ngày locked → blocked_edit. *DoD:* Hủy lưu người/lúc/lý do riêng (không nối note); hủy trên ngày locked → 400 + blocked_edit.
- **T-TRADE-05** — Spec còn thiếu (README): xem giao dịch, lịch sử -R/-A, nút 取消 trước khóa sổ có lý do, liên kết SCR-022 sau khóa. *DoD:* Spec SCR-018 được lead NHẬN.
- **T-TRADE-06** — Hiển thị giao dịch + chuỗi -R/-A + giao hàng; nút 取消 có lý do khi ngày còn sửa được; nút sang SCR-022 khi đã khóa. *DoD:* Hủy thành công trả tồn, hiển thị người/lúc/lý do hủy.
- **T-TRADE-07** — Gồm kiểm đồng thời 2 máy (AC6) và thứ tự kiểm (AC8); AC10 offline ở T-OFF-08, AC12 tải ở T-TRADE-08. *DoD:* Các AC liệt kê của SCR-016 đạt.
- **T-TRADE-08** — Mô phỏng 1.200 lần chốt trong 2,5 giờ từ 10 máy trên dữ liệu ≥ mức BC-80 (600 lô cao điểm). *DoD:* SCR-016 AC12: p95 POST /api/trades ≤ 2 giây.

### E-AUC — Ghi kết quả せり có người xác nhận (SCR-019)

**Mục tiêu:** Chỉ ghi kết quả cuối do người nhập, có 確認者 chọn tường minh và 落札時刻 — không phải hệ thống đấu giá.  
**Phạm vi:** trades.result_at/recorded_by/confirmed_by, API users theo quyền, UI SCR-019, test.  
**Tổng:** 5 task · 16 SP · 29 h · cờ: せり xác nhận

| ID | Tiêu đề | Tầng | Vai trò | SP | Giờ | Ưu tiên | Phụ thuộc | Cờ | Nguồn | Sprint |
|---|---|---|---|---:|---:|---|---|---|---|---|
| T-AUC-01 | Thêm `trades.result_at`, `recorded_by` và bắt buộc 確認者 cho せり | DB | BE | 3 | 6 | P0 | TRADE-01 | せり xác nhận | G-22, BC-28, BC-29, SCR-019 §5, SCR-019 AC2 … | 4 |
| T-AUC-02 | Dựng API `GET /api/users?permission=&active=` | API | FE | 2 | 4 | P0 | FND-03 | せり xác nhận | G-22, SCR-019 §11, 06 Mục 1 §4.2 | 2 |
| T-AUC-03 | Dựng màn hình ghi kết quả せり SCR-019 | UI | FE | 5 | 10 | P0 | AUC-01, AUC-02, TRADE-03, AUC-04 | せり xác nhận | G-22, SCR-019 §5, SCR-019 §7, SCR-019 AC1, SCR-019 AC11 … | 4 |
| T-AUC-04 | Chỉnh spec SCR-019: nút 記録 tắt khi 確認者 trống | Doc | BrSE | 1 | 1 | P0 | — | せり xác nhận | 06 Mục 4 #3, SCR-019 | 1 |
| T-AUC-05 | Kiểm thử SCR-019 AC1–AC8, AC10–AC12 | Test | QA | 5 | 8 | P0 | AUC-03 | せり xác nhận | SCR-019 §10, BC-29 | 5 |

- **T-AUC-01** — confirmed_by chọn tường minh, không mặc định người gọi API; kiểm 確認者 active và có auction.record (V019-08), result_at không ở tương lai (V019-06), auction_confirmer_must_differ. *DoD:* SCR-019 AC2: confirmed_by=Y, recorded_by=X, result_at 03:12 JST; AC3 thiếu confirmed_by → 400 V019-07.
- **T-AUC-02** — Danh sách người dùng có quyền cho ô 確認者; chỉ người có auction.record gọi được. *DoD:* Chỉ trả user active có quyền yêu cầu; thiếu quyền → 403.
- **T-AUC-03** — F-06 落札時刻, F-07 確認者 không mặc định và giữ sau mỗi dòng, không giữ lô; không có ảnh, giá hiện tại, bid hay WebSocket. *DoD:* SCR-019 AC1 (không có yếu tố đấu giá), AC11 (giữ F-07), AC12 (F-07 trống → không gửi) đạt.
- **T-AUC-04** — §7 và AC12 mâu thuẫn; giữ nút tắt, V019-07 chỉ khi gửi bằng Enter/API. *DoD:* SCR-019 §7 và §10 thống nhất.
- **T-AUC-05** — Gồm chứng minh không phải hệ thống đấu giá (AC1) và 確認者 bắt buộc (AC3, AC12); AC9 offline ở T-OFF-08. *DoD:* Các AC liệt kê của SCR-019 đạt.

### E-DEL — Ghi giao hàng, ngoại lệ & tranh chấp (SCR-029)

**Mục tiêu:** Giao nhiều lần theo ngày giao, kiểm tư cách lại lúc giao, ngoại lệ có người xác nhận, tranh chấp do người khác giải quyết.  
**Phạm vi:** Cột deliveries mới, fn_record_delivery, hiệu ứng ngoại lệ, xác nhận/tranh chấp, UI SCR-029, test.  
**Tổng:** 8 task · 40 SP · 66 h · cờ: —

| ID | Tiêu đề | Tầng | Vai trò | SP | Giờ | Ưu tiên | Phụ thuộc | Cờ | Nguồn | Sprint |
|---|---|---|---|---:|---:|---|---|---|---|---|
| T-DEL-01 | Mở rộng `deliveries`: ngày giao, client_ref, xác nhận, cờ tư cách, tranh chấp | DB | BE | 3 | 5 | P0 | — | — | G-12, BC-50, BC-56, BC-57, 03 §2 | 2 |
| T-DEL-02 | Sửa `fn_record_delivery`: ngày hiện tại JST, chặn ngày khóa, kiểm tư cách lúc giao | DB | BE | 8 | 12 | P0 | DEL-01, QUAL-05, BDAY-02, AUD-02 | Ngày nghiệp vụ JST | G-02, G-03, BC-50, BC-62, ADR-007 §6 … | 3 |
| T-DEL-03 | Áp quy tắc tồn theo loại ngoại lệ và viết `fn_confirm_delivery_exception` | DB | BE | 5 | 10 | P0 | DEL-01, RULE-03, AUD-03 | — | G-12, BC-56, BC-57, SCR-029 §9.2, SCR-029 AC4 | 2 |
| T-DEL-04 | Viết hàm tranh chấp và 3 API xác nhận / đánh dấu / giải quyết | API | BE | 5 | 8 | P0 | DEL-03 | — | G-12, BC-57, SCR-029 §7, SCR-029 AC11, SCR-029 AC12 | 3 |
| T-DEL-05 | Dựng màn hình ghi giao hàng SCR-029 | UI | FE | 8 | 12 | P0 | DEL-02, DEL-03, INC-02 | — | SCR-029 §5, SCR-029 AC1, SCR-029 AC2, SCR-029 AC3, BC-65 | 3 |
| T-DEL-06 | Dựng thao tác xác nhận ngoại lệ và tranh chấp trên SCR-029 | UI | FE | 5 | 8 | P0 | DEL-04, DEL-05 | — | SCR-029 §7, SCR-029 AC11, SCR-029 AC12 | 3 |
| T-DEL-07 | Chỉnh spec SCR-029 §11: ghi chú đổi nghĩa F-07 / F-11 | Doc | BrSE | 1 | 1 | P2 | — | — | 06 Mục 4 #7, SCR-029 | 1 |
| T-DEL-08 | Kiểm thử SCR-029 AC1–AC8, AC10–AC13 | Test | QA | 5 | 10 | P0 | DEL-06 | — | SCR-029 §10 | 5 |

- **T-DEL-01** — business_date FK, client_ref UK, recorded_by, confirmed_by/at/comment, qualification_flag, disputed (chỉ exception), dispute_note, dispute_resolved_by ≠ recorded_by, dispute_resolved_at/note. *DoD:* Cột theo 03 §2 có trong DB; dữ liệu cũ có business_date.
- **T-DEL-02** — business_date = ngày hiện tại (không current_date UTC); ngày locked → LOCKED_DAY + blocked_edit; tư cách purpose=deliver (allow_with_flag thông báo settlement); max_deliveries_per_trade; lũy kế theo chuỗi reverses_id; client_ref. *DoD:* SCR-029 AC5 (hết hạn sau chốt → ghi + qualification_flag), AC7 (ngày khóa → 400 + blocked_edit), AC10 (07:30 JST → business_date ngày open) đạt.
- **T-DEL-03** — delivery_exception_effects (over/short/return/partial_cancel) quyết định đổi SL giao dịch/tồn; ngoại lệ mở đến khi có người xác nhận (exception_confirm_by_other). *DoD:* SCR-029 AC4: xác nhận short 5 → còn lại 45, trades.qty và lots.available_qty không đổi.
- **T-DEL-04** — fn_flag_delivery_dispute, fn_resolve_delivery_dispute (người giải quyết ≠ recorded_by, ghi chú bắt buộc); POST /api/deliveries/{id}/confirm|dispute|resolve-dispute. *DoD:* SCR-029 AC11: D1 tự giải quyết → 400; D2 có ghi chú → resolved; AC12: tranh chấp mở chặn 引渡し完了.
- **T-DEL-05** — Đã bán / Đã giao / Còn lại theo chuỗi, ghi giao và ngoại lệ (lý do bắt buộc), banner vàng nêu đúng căn cứ khi tư cách hết hạn sau chốt; trạng thái 引渡し中/引渡し完了/例外, không dùng chữ 完納. *DoD:* SCR-029 AC1 (40 rồi 60 → 引渡し完了, không chỗ nào hiện 完納), AC2, AC3 đạt.
- **T-DEL-06** — Nút 確認, 係争にする, 係争を解決 (ẩn với người ghi), 修正申請へ sang SCR-022 với impact=delivery. *DoD:* Luồng ngoại lệ → xác nhận → tranh chấp → giải quyết chạy hết trên UI.
- **T-DEL-07** — F-07 giờ là ghi chú giải quyết, F-11 là ghi chú xác nhận; ghi vào §11 để test/dev không dùng ID cũ. *DoD:* SCR-029 §11 có dòng giải thích F-07/F-11.
- **T-DEL-08** — AC9 (offline trùng) kiểm ở T-OFF-08. *DoD:* Các AC liệt kê của SCR-029 đạt.

### E-LOCK — Đối soát, khóa sổ, mở lại & điều chỉnh -R/-A (SCR-022/024)

**Mục tiêu:** Ngày đã khóa không sửa trực tiếp; điều chỉnh có bằng chứng và duyệt nhiều cấp; khóa sổ theo checklist; mở lại có duyệt.  
**Phạm vi:** corrections/correction_decisions, fn_request/decide_correction, checklist CK-1…7, fn_lock_day, mở lại, UI SCR-022/024.  
**Tổng:** 14 task · 72 SP · 119 h · cờ: Ngày khóa & điều chỉnh

| ID | Tiêu đề | Tầng | Vai trò | SP | Giờ | Ưu tiên | Phụ thuộc | Cờ | Nguồn | Sprint |
|---|---|---|---|---:|---:|---|---|---|---|---|
| T-LOCK-01 | Mở rộng `corrections` và tạo `correction_decisions` | DB | BE | 3 | 5 | P0 | — | Ngày khóa & điều chỉnh | G-10, BC-45, BC-46, 06 Mục 1 §4.4 | 1 |
| T-LOCK-02 | Viết `fn_request_correction` và API tạo / gửi lại yêu cầu | DB | BE | 8 | 12 | P0 | LOCK-01, FND-07, RULE-03, AUD-03 | Ngày khóa & điều chỉnh | G-10, BC-45, SCR-022 §7, SCR-022 AC1, SCR-022 AC9 | 4 |
| T-LOCK-03 | Sửa `fn_decide_correction`: nhiều cấp, need_info, sinh -R/-A ở ngày hiện tại | DB | BE | 8 | 12 | P0 | LOCK-01, BDAY-02, AUD-03 | Ngày khóa & điều chỉnh | BC-43, BC-44, BC-88, ADR-005, ADR-009 §3 … | 1 |
| T-LOCK-04 | Dựng form yêu cầu điều chỉnh SCR-022 | UI | FE | 5 | 10 | P0 | LOCK-02 | Ngày khóa & điều chỉnh | SCR-022 §5, SCR-022 §7, SCR-022 AC6, SCR-022 AC12 | 4 |
| T-LOCK-05 | Dựng màn hình duyệt điều chỉnh SCR-022 | UI | FE | 5 | 8 | P0 | LOCK-03 | Ngày khóa & điều chỉnh | SCR-022 §7, SCR-022 AC3, SCR-022 AC5, SCR-022 AC7 | 1 |
| T-LOCK-06 | Kiểm thử SCR-022 AC1–AC9, AC11, AC12 | Test | QA | 5 | 10 | P0 | LOCK-04, LOCK-05 | Ngày khóa & điều chỉnh | SCR-022 §10 | 5 |
| T-LOCK-07 | Viết checklist khóa sổ CK-1…7 và API `GET …/{day}/lock-checklist` | DB | BE | 5 | 10 | P0 | RULE-03, BDAY-01, DEL-04 | Ngày khóa & điều chỉnh | G-08, BC-49, SCR-024 §9, SCR-024 AC3, SCR-024 AC12 | 3 |
| T-LOCK-08 | Sửa `fn_lock_day` và API `POST …/{day}/lock` | DB | BE | 5 | 8 | P0 | LOCK-07, AUD-03 | Ngày khóa & điều chỉnh | G-08, BC-43, BC-49, SCR-024 §7, SCR-024 AC4 | 4 |
| T-LOCK-09 | Tạo luồng mở lại ngày đã khóa có duyệt nhiều cấp | DB | BE | 8 | 12 | P1 | BDAY-01, RULE-03, AUD-03, FND-03 | Ngày khóa & điều chỉnh | G-09, BC-48, Q12, SCR-024 §7, SCR-024 AC8 … | 5 |
| T-LOCK-10 | Dựng màn hình SCR-024: mở ngày, checklist, khóa sổ | UI | FE | 8 | 12 | P0 | LOCK-08, BDAY-04 | Ngày khóa & điều chỉnh | SCR-024 §5, SCR-024 §7, G-07, G-08 | 4 |
| T-LOCK-11 | Dựng thao tác yêu cầu / duyệt mở lại ngày trên SCR-024 | UI | FE | 3 | 6 | P1 | LOCK-09, LOCK-10 | Ngày khóa & điều chỉnh | G-09, SCR-024 §7 | 5 |
| T-LOCK-12 | Kiểm thử SCR-024 AC1–AC5, AC12 | Test | QA | 5 | 8 | P0 | LOCK-10, TRADE-04 | Ngày khóa & điều chỉnh | SCR-024 §10, BC-43 | 5 |
| T-LOCK-13 | Kiểm thử mở lại ngày (SCR-024 AC8, AC9, AC11) | Test | QA | 3 | 5 | P1 | LOCK-11, ACC-03 | Ngày khóa & điều chỉnh | SCR-024 §10, BC-48 | 6 |
| T-LOCK-14 | Chỉnh spec SCR-022: gợi ý 'ngày gốc còn mở' xét cả closing / reopened | Doc | BrSE | 1 | 1 | P2 | — | Ngày khóa & điều chỉnh | 06 Mục 4 #5, ADR-009 §2 | 1 |

- **T-LOCK-01** — impact_settlement, impact_delivery, status thêm need_info, current_level; bảng quyết định theo cấp (approve|reject|need_info, decided_by, note). *DoD:* Cấu trúc theo 03 §2; lịch sử quyết định lưu theo cấp.
- **T-LOCK-02** — Suy ra impact_*; bằng chứng bắt buộc theo correction_evidence_required_when; một yêu cầu đang xử lý mỗi giao dịch; lũy kế theo chuỗi; POST /api/corrections, PATCH /api/corrections/{id}. *DoD:* SCR-022 AC1: sửa SL ảnh hưởng quyết toán/giao hàng không file → 400 câu JP; AC9 yêu cầu thứ hai → 400.
- **T-LOCK-03** — approval_levels; người duyệt ≠ người tạo và không duyệt 2 cấp; reject/need_info cần ý kiến; cấp cuối sinh -R/-A với business_day = ngày hiện tại (không có ngày open → 400), kiểm tồn khi tăng SL. *DoD:* SCR-022 AC4: duyệt sinh T261015-0012-R/-A ngày 2026-10-16, tổng ròng 2026-10-15 không đổi; AC11 chưa mở ngày → 400.
- **T-LOCK-04** — Chọn giao dịch, SL/giá mới, lý do, ảnh hưởng thêm, đính kèm; gợi ý dùng hủy khi ngày gốc còn sửa được; gửi lại khi need_info. *DoD:* SCR-022 AC6 (need_info → bổ sung → pending, giữ lịch sử) và AC12 hiển thị đúng.
- **T-LOCK-05** — Hàng chờ duyệt, chi tiết trước/sau, cấp hiện tại/tổng cấp; 承認/却下/追加情報依頼 có hộp xác nhận; thông báo trong app cho người tạo. *DoD:* Duyệt nhiều cấp hiển thị (1/2), (2/2); từ chối không ý kiến bị chặn ở UI.
- **T-LOCK-06** — AC10 offline kiểm ở T-OFF-08. *DoD:* Các AC liệt kê của SCR-022 đạt.
- **T-LOCK-07** — Đếm giao dịch chờ, bản ghi đồng bộ lỗi chưa hòa giải (S), ngoại lệ chưa xác nhận, giao hàng mở, tranh chấp chưa giải quyết…; mức block/warn theo lock_checklist. *DoD:* SCR-024 AC3: 1 ngoại lệ chưa xác nhận → block 1; AC12: tranh chấp mở → CK-5 = 1 mức warn.
- **T-LOCK-08** — Nhận open/closing/reopened; chặn khi còn block; warn phải có trong acknowledged; lưu lock_comment, lock_checklist_snapshot, locked_by; audit lock_day kèm snapshot. *DoD:* SCR-024 AC4: thiếu acknowledged/ghi chú → 400; đủ → locked với snapshot CK-4 = 3.
- **T-LOCK-09** — day_reopen_requests, day_reopen_decisions, fn_decide_day_reopen (≠ người yêu cầu, approval_levels); chặn khi exported = true (dùng điều chỉnh); cấp cuối → reopened; API reopen-requests và decision. *DoD:* SCR-024 AC8: S1 tự duyệt → 400; A1 duyệt → reopened; AC9: đã xuất kế toán → 400.
- **T-LOCK-10** — Mở ngày (cảnh báo suggested_day, lý do khi ngày trước chưa khóa), checklist block/warn với ô tích, ghi chú khóa, hộp xác nhận. *DoD:* SCR-024 AC2–AC4 thực hiện được trên UI.
- **T-LOCK-11** — Nút 締め解除を申請 (ẩn khi exported), hàng chờ duyệt mở lại với 承認/却下. *DoD:* Luồng yêu cầu → duyệt → reopened chạy trên UI.
- **T-LOCK-12** — Mở ngày, checklist, khóa, ghi vào ngày khóa bị chặn; AC10 offline ở T-OFF-08. *DoD:* SCR-024 AC1–AC5, AC12 đạt.
- **T-LOCK-13** — Maker ≠ checker khi mở lại, chặn mở lại sau khi xuất kế toán, ngày reopened không phải ngày hiện tại. *DoD:* SCR-024 AC8, AC9, AC11 đạt.
- **T-LOCK-14** — Bổ sung theo bảng trạng thái ADR-009 §2. *DoD:* SCR-022 xét đủ open/closing/reopened.

### E-ACC — Xuất kế toán IF-ACC-01 sau khóa sổ

**Mục tiêu:** CSV kế toán chỉ cho ngày đã khóa, có batch code, metadata và trạng thái dòng 保留/確認済み/調整済み.  
**Phạm vi:** accounting_exports(+lines), hàm sinh batch, API CSV theo mã hóa, nút trên SCR-024, test.  
**Tổng:** 5 task · 21 SP · 35 h · cờ: Kế toán IF-ACC-01

| ID | Tiêu đề | Tầng | Vai trò | SP | Giờ | Ưu tiên | Phụ thuộc | Cờ | Nguồn | Sprint |
|---|---|---|---|---:|---:|---|---|---|---|---|
| T-ACC-01 | Tạo `accounting_exports` và `accounting_export_lines` | DB | BE | 3 | 5 | P0 | BDAY-01 | Kế toán IF-ACC-01 | G-21, BC-71, BC-72, 06 Mục 1 §4.4 | 4 |
| T-ACC-02 | Viết hàm sinh batch kế toán chỉ cho ngày đã khóa | DB | BE | 8 | 12 | P0 | ACC-01, RULE-04, DEL-04, LOCK-03 | Kế toán IF-ACC-01 | G-21, BC-70, BC-71, SCR-024 AC6, SCR-024 AC7 | 4 |
| T-ACC-03 | Dựng API xuất CSV kế toán và khóa CSV cũ cho ngày chưa khóa | API | BE | 5 | 8 | P0 | ACC-02, RULE-05 | Kế toán IF-ACC-01 | G-21, BC-71, BC-72, Q20, SCR-024 §7 | 5 |
| T-ACC-04 | Thêm nút 会計CSV出力 / 再ダウンロード trên SCR-024 | UI | FE | 2 | 4 | P0 | ACC-03, LOCK-10 | Kế toán IF-ACC-01 | G-21, SCR-024 §7 | 5 |
| T-ACC-05 | Kiểm thử xuất kế toán (SCR-024 AC6, AC7, mã hóa) | Test | QA | 3 | 6 | P0 | ACC-04 | Kế toán IF-ACC-01 | SCR-024 AC6, SCR-024 AC7, BC-71 | 6 |

- **T-ACC-01** — Header: batch_code UK, business_day FK, run_by, run_at, encoding; dòng: participant_id, amount, tax, line_status 保留/確認済み/調整済み. *DoD:* Cấu trúc theo 03 §2; line_status ở dòng, không ở header.
- **T-ACC-02** — Chỉ ngày locked; gom theo người tham gia; tiền + thuế theo item_tax_rates của rule_set_id; gốc → 確認済み, -R/-A → 調整済み, tranh chấp mở → 保留; gọi lại trả cùng batch; set exported. *DoD:* SCR-024 AC6: ngày open → 400, không có accounting_exports; AC7: ba dòng 確認済み/調整済み/保留, lần hai cùng batch_code.
- **T-ACC-03** — POST /api/accounting-exports, GET /api/accounting-exports/{batch_code}; header batch_code, business_date, generated_at, run_by; mã hóa theo accounting_csv_encoding (UTF-8-BOM | Shift_JIS); /api/reports/trades không còn xuất ngày chưa khóa cho mục đích kế toán. *DoD:* CSV có đủ metadata; tải lại cùng nội dung; không còn đường xuất kế toán cho ngày chưa khóa.
- **T-ACC-04** — Nút bật khi ngày locked; hiển thị batch đã xuất; tải lại không tạo batch mới. *DoD:* Ngày chưa khóa không bấm được xuất; ngày đã xuất hiện batch_code.
- **T-ACC-05** — Kiểm chỉ xuất sau khóa, trạng thái dòng, idempotent, Shift_JIS. *DoD:* SCR-024 AC6, AC7 đạt; tổng CSV khớp tổng ngày.

### E-OFF — Offline cho tiếp nhận lô & giao hàng (ADR-010)

**Mục tiêu:** Khu tiếp nhận và bến giao làm việc tiếp khi mất mạng ngắn, không nhập trùng; chốt giao dịch luôn cần mạng.  
**Phạm vi:** Phát hiện mạng, hàng đợi IndexedDB, client_ref, đồng bộ, màn hình hòa giải, nháp cục bộ, test giả lập mất mạng.  
**Tổng:** 8 task · 33 SP · 60 h · cờ: Offline

| ID | Tiêu đề | Tầng | Vai trò | SP | Giờ | Ưu tiên | Phụ thuộc | Cờ | Nguồn | Sprint |
|---|---|---|---|---:|---:|---|---|---|---|---|
| T-OFF-01 | Dựng phát hiện mạng và nhãn オフライン dùng chung | UI | FE | 5 | 8 | P1 | — | Offline | G-20, ADR-010 §3, BC-77, SCR-001 M-08 | 1 |
| T-OFF-02 | Dựng hàng đợi IndexedDB cho bản ghi offline | UI | FE | 5 | 10 | P1 | OFF-01 | Offline | G-20, ADR-010 §1, BC-75, BC-76 | 1 |
| T-OFF-03 | Hỗ trợ đồng bộ phía server: audit `sync` và kiểm ngày lúc lưu | API | BE | 3 | 6 | P1 | LOT-03, DEL-02, AUD-03 | Offline | G-20, ADR-010 §4, ADR-009 §3, SCR-012 AC6 | 4 |
| T-OFF-04 | Đồng bộ lô offline: mã tạm TMP → mã chính thức | UI | FE | 5 | 8 | P1 | OFF-02, OFF-03, LOT-04 | Offline | G-20, ADR-010 §2, SCR-012 §7, SCR-012 AC5 | 5 |
| T-OFF-05 | Đồng bộ giao hàng offline | UI | FE | 3 | 6 | P1 | OFF-02, OFF-03, DEL-05 | Offline | G-20, ADR-010, SCR-029 AC9 | 5 |
| T-OFF-06 | Dựng màn hình hòa giải bản ghi đồng bộ lỗi | UI | FE | 5 | 10 | P1 | OFF-04, OFF-05 | Offline | G-20, ADR-010 §2, BC-75, SCR-012 AC6 | 5 |
| T-OFF-07 | Giữ nháp cục bộ cho chốt 相対 / せり khi mất mạng | UI | FE | 2 | 4 | P1 | OFF-01, TRADE-03, AUC-03 | Offline | BC-77, ADR-010 §3, SCR-016 AC10, SCR-019 AC9 | 4 |
| T-OFF-08 | Kiểm thử offline bằng giả lập mất mạng | Test | QA | 5 | 8 | P1 | OFF-06, OFF-07 | Offline | ADR-010, BC-75, BC-76, BC-77 | 6 |

- **T-OFF-01** — Hook trạng thái mạng + ping server; nhãn header; nút cần mạng (chốt, khóa, duyệt, đổi quy tắc, tư cách) disabled với NET-01. *DoD:* Mất mạng: các nút cần mạng tắt với nhãn オフライン, không phát request.
- **T-OFF-02** — Lưu payload + client_ref + 業務日 lúc lưu + thời điểm; thứ tự thời gian; nhãn 未同期; báo khi hết dung lượng. *DoD:* Bản ghi offline còn sau tải lại trang; hết dung lượng hiện 「端末に保存できません」.
- **T-OFF-03** — API lots/deliveries nhận saved_business_date; nếu không còn là ngày hiện tại thì từ chối có mã để vào hòa giải (không tự chuyển ngày); ghi audit action=sync. *DoD:* Đồng bộ vào ngày đã khóa bị từ chối với mã riêng; không tạo bản ghi ở ngày mới.
- **T-OFF-04** — Gửi lần lượt theo thời gian, idempotent bằng client_ref, đổi mã tạm sang L<YYMMDD>-NNN, lỗi → danh sách hòa giải, không xóa khỏi queue. *DoD:* SCR-012 AC5: gửi lại cùng client_ref chỉ có 1 lô, nhãn 未同期 biến mất.
- **T-OFF-05** — Queue giao hàng gửi theo thứ tự, idempotent; lũy kế không cộng đôi; lỗi giao vượt/ngày khóa vào hòa giải. *DoD:* SCR-029 AC9: chỉ có 1 dòng deliveries, lũy kế không bị cộng đôi.
- **T-OFF-06** — Liệt kê bản ghi lỗi (ngày khóa, giao vượt, bên bán tạm dừng) với lý do; thao tác bỏ/ghi lại thủ công vào ngày hiện tại có xác nhận; spec tối thiểu giả định (S). *DoD:* SCR-012 AC6: lô offline của ngày đã khóa nằm trong hòa giải với lý do, không tự sang ngày mới.
- **T-OFF-07** — Enter khi offline không gửi request, hiện RJ-13 / V019-13; nháp localStorage còn sau tải lại; xóa nháp khi chốt thành công hoặc クリア. *DoD:* SCR-016 AC10 và SCR-019 AC9 đạt.
- **T-OFF-08** — Gom mọi AC offline: SCR-012 AC5–AC6, SCR-029 AC9, SCR-016 AC10, SCR-019 AC9, SCR-010 AC10, SCR-022 AC10, SCR-024 AC10. *DoD:* Tất cả AC offline liệt kê đạt; không có bản ghi trùng.

### E-INC — 完納奨励金 — khuyến khích thanh toán đủ đúng hạn

**Mục tiêu:** Tính 完納奨励金 = floor(eligible × rate × 110/100) chỉ cho khoản trả đủ trong 支払期日 (JST, không ân hạn), có phiên bản, append-only, báo cáo RPT-07.  
**Phạm vi:** Bậc tỷ lệ theo phiên bản, 支払期日, ghi nhận thanh toán (tay + CSV), kiểm đúng hạn, tính & làm tròn, rule_set_id, delta kỳ sau, RPT-07, test vector, UAT. Không có trong 9 spec lõi → nhiều giả định (S).  
**Tổng:** 18 task · 72 SP · 130 h · cờ: 完納奨励金

| ID | Tiêu đề | Tầng | Vai trò | SP | Giờ | Ưu tiên | Phụ thuộc | Cờ | Nguồn | Sprint |
|---|---|---|---|---:|---:|---|---|---|---|---|
| T-INC-01 | Soạn spec nghiệp vụ 完納奨励金 và gửi câu hỏi Q16/Q17/Q29/Q30 | Doc | BrSE | 5 | 8 | P0 | — | 完納奨励金 | BR-INC-01, FR-INC-01, FR-INC-02, FR-INC-03, BC-65 … | 1 |
| T-INC-02 | Tách tên trạng thái `payment_complete` và `delivery_complete` (bẫy T6) | DB | BE | 2 | 4 | P0 | — | 完納奨励金 | BC-65, T6, FR-DEL-02, Q30, SCR-029 AC1 | 2 |
| T-INC-03 | Định nghĩa bảng bậc tỷ lệ `incentive_rate_tiers` trong phiên bản quy tắc | DB | BE | 2 | 4 | P0 | RULE-02 | 完納奨励金 | BC-23, Q16, ADR-008 danh mục khóa, FR-INC-02, SCR-034 AC8 | 2 |
| T-INC-04 | Tạo khoản phải thu `receivables` sinh từ giao dịch đã chốt | DB | BE | 5 | 10 | P0 | INC-01, INC-02, RULE-04, LOCK-03 | 完納奨励金 | BC-68, BC-70, Q29, FR-INC-01 | 2 |
| T-INC-05 | Định nghĩa và cấu hình hạn thanh toán 支払期日 | DB | BE | 3 | 6 | P0 | INC-04, BDAY-01 | 完納奨励金 | BC-68, Q16, FR-INC-01, ADR-008, ADR-009 | 2 |
| T-INC-06 | Ghi nhận thanh toán thủ công (bảng `payments` + API) | API | BE | 5 | 10 | P0 | INC-04, AUD-03, FND-03 | 完納奨励金 | BC-68, Q17, FR-INC-01, SCOPE-OUT-05 | 2 |
| T-INC-07 | Import CSV thanh toán (Plan A Q17) | API | BE | 5 | 10 | P1 | INC-06 | 完納奨励金 | BC-68, Q17, SCOPE-OUT-05 | 5 |
| T-INC-08 | Dựng màn hình xác nhận tiền về (nhập tay + CSV) | UI | FE | 8 | 12 | P1 | INC-06, INC-07 | 完納奨励金 | BC-68, Q17, INC-01 spec | 5 |
| T-INC-09 | Kiểm đúng hạn theo 業務日 JST, không ân hạn | DB | BE | 3 | 6 | P0 | INC-05, INC-06 | 完納奨励金 | BC-67, BC-39, FR-INC-01, EX-SETTLE-01, 01 §9.4 | 3 |
| T-INC-10 | Tạo bảng `incentive_calc` append-only theo kỳ | DB | BE | 3 | 6 | P0 | INC-03 | 完納奨励金 | BC-69, FR-INC-03, ADR-005 | 3 |
| T-INC-11 | Tính tiền khuyến khích: floor sau ×110/100 bằng số nguyên/Decimal | DB | BE | 5 | 8 | P0 | INC-09, INC-10 | 完納奨励金 | BC-66, BC-67, BR-INC-01, INC-EDGE-01, INC-EDGE-03 … | 3 |
| T-INC-12 | Áp `rule_set_id` theo ngày áp dụng và lưu vết trên dòng tính | DB | BE | 2 | 4 | P0 | INC-11, RULE-03 | 完納奨励金 | FR-INC-02, ADR-008 §5, BC-14, BC-74, 01 §9.4 | 3 |
| T-INC-13 | Điều chỉnh sau khóa kỳ thành dòng delta ở kỳ sau | DB | BE | 5 | 8 | P0 | INC-12 | 完納奨励金 | BC-69, FR-INC-03, INC-EDGE-02, ADR-005 | 4 |
| T-INC-14 | Dựng API chạy tính khuyến khích theo kỳ và khóa kỳ | API | BE | 3 | 6 | P0 | INC-13, FND-03 | 完納奨励金 | FR-INC-01, FR-INC-03, BC-69 | 4 |
| T-INC-15 | Dựng báo cáo RPT-07 khuyến khích (API + CSV) | API | FE | 5 | 8 | P1 | INC-14 | 完納奨励金 | BC-73, BC-74, FR-RPT-01, RPT-07, Q19 | 5 |
| T-INC-16 | Dựng màn hình báo cáo RPT-07 | UI | FE | 5 | 8 | P1 | INC-15 | 完納奨励金 | RPT-07, BC-73, BC-65 | 5 |
| T-INC-17 | Viết unit test INC-EDGE-01/02/03 và các nhánh biên | Test | QA | 3 | 6 | P0 | INC-13 | 完納奨励金 | INC-EDGE-01, INC-EDGE-02, INC-EDGE-03, BC-66, BC-67 … || 4 |
| T-INC-18 | Viết kịch bản UAT 完納奨励金 | Doc | BrSE | 3 | 6 | P1 | INC-01 | 完納奨励金 | BC-65, BC-66, BC-67, BC-69, BC-88 … | 1 |

- **T-INC-01** — Không spec lõi nào có khuyến khích: viết spec màn hình xác nhận tiền về + RPT-07 + bảng quyết định 01 §9.4; đánh dấu giả định (S): kỳ = tháng, eligible_amount, mốc 支払期日, liên kết Q30. *DoD:* Spec được lead NHẬN; mỗi giả định ghi (S) kèm câu hỏi; câu hỏi đã gửi khách.
- **T-INC-02** — Hai trường/enum độc lập: thanh toán đủ (完納 theo nghĩa khuyến khích) và giao đủ (引渡し完了); không dùng chữ 完納 cho giao hàng; thêm vào glossary và kiểm tự động. *DoD:* Không có enum dùng chung cho thanh toán và giao hàng; UI giao hàng không có chữ 完納; kiểm grep chạy trong CI.
- **T-INC-03** — Khóa rule_values incentive_rate_tiers = [{min_ratio, rate}]; min_ratio tăng dần, rate Decimal 0..1; dữ liệu giả cho prototype (Q16, giả định S về cấu trúc bậc). *DoD:* Bậc tỷ lệ đổi được qua phiên bản mới, không deploy; bậc sai thứ tự bị từ chối.
- **T-INC-04** — Mỗi giao dịch confirmed (kể cả -R/-A) sinh/điều chỉnh khoản phải thu theo người tham gia: amount, tax theo item_tax_rates, business_date, payment_status; cơ sở trước/sau thuế là giả định (S, Q29). *DoD:* Tổng phải thu theo người tham gia khớp tổng giao dịch ròng (gốc + -R + -A) của kỳ.
- **T-INC-05** — Khóa rule_values payment_due_rule (ví dụ cuối tháng + N ngày nghiệp vụ, giả định S chờ Q16); hàm fn_due_date(receivable) tính theo market_calendar; due_date lưu trên khoản phải thu, không tính lại khi phiên bản đổi. *DoD:* Mỗi khoản phải thu có due_date cố định; đổi payment_due_rule chỉ ảnh hưởng khoản phải thu sinh sau ngày hiệu lực.
- **T-INC-06** — payments append-only: participant_id, amount, paid_at, paid_business_date (JST), source manual|csv, ref, recorded_by; phân bổ vào khoản phải thu; quyền payments.record cho settlement; audit trong hàm. *DoD:* Nhập tay một khoản trả cập nhật đúng payment_status; không sửa/xóa được payment đã ghi (chỉ bút toán đảo).
- **T-INC-07** — Upload CSV (UTF-8/Shift_JIS), validate từng dòng, xem trước, ghi idempotent theo (participant, ngày trả, số tiền, ref); trả danh sách dòng lỗi; liên kết ngân hàng ngoài phạm vi. *DoD:* Import lại cùng file không tạo payment trùng; dòng lỗi báo số dòng + lý do.
- **T-INC-08** — Danh sách khoản phải thu theo kỳ/người tham gia với due_date và payment_status; form nhập tay; tải CSV, xem trước, xác nhận ghi. Không có spec lõi — theo spec INC-01 (S). *DoD:* Settlement ghi được thanh toán bằng tay và CSV; khoản trả đủ hiện payment_complete, không dùng nhãn giao hàng.
- **T-INC-09** — fn_payment_on_time(receivable): đủ tiền và paid_business_date ≤ due_date (JST, theo 業務日); trễ 1 ngày = không đạt; chưa có dữ liệu trả = chưa tính (không ra 0). *DoD:* Trả đúng ngày due_date → on_time; trễ 1 業務日 → late; chưa nhập trả → unknown; không dùng ngày UTC.
- **T-INC-10** — incentive_calc(participant_id, period, eligible_amount, rate, rule_set_id, amount, result on_time|late, delta_of_id, period_locked); trigger chặn UPDATE/DELETE; kỳ đã khóa không ghi thêm dòng gốc. *DoD:* Mọi UPDATE/DELETE trên incentive_calc bị chặn; dòng late vẫn được lưu với amount = 0.
- **T-INC-11** — amount = floor(eligible_amount × rate × 110 / 100) tính bằng numeric (không float), cắt xuống yên sau khi nhân; late → 0 vẫn ghi dòng; chọn bậc theo min_ratio (công thức là giả định S chờ Q16). *DoD:* Kết quả khớp tay cho INC-EDGE-01 (đúng ngưỡng) và INC-EDGE-03 (thập phân sau ×110/100 cắt xuống yên); không có phép float.
- **T-INC-12** — Chọn bản approved có effective_from ≤ ngày áp dụng (giả định S: ngày áp dụng = due_date) qua fn_rule_set; draft/submitted không dùng; lưu rule_set_id trên incentive_calc để báo cáo gom theo phiên bản. *DoD:* Mỗi dòng incentive_calc có rule_set_id; phiên bản nháp không bao giờ được dùng.
- **T-INC-13** — Khi khoản trả/khoản phải thu của kỳ đã khóa thay đổi (điều chỉnh -R/-A, nhập trả muộn), tính lại và ghi dòng delta (delta_of_id) vào kỳ đang mở; kỳ cũ và báo cáo kỳ cũ giữ nguyên. *DoD:* INC-EDGE-02: kỳ trước không đổi một đồng; kỳ sau có đúng một dòng delta trỏ delta_of_id.
- **T-INC-14** — POST /api/incentives/run {period} (quyền incentives.run, settlement); chạy lại kỳ đang mở là idempotent; POST …/lock khóa kỳ; audit; cần mạng. *DoD:* Chạy lại kỳ mở không tạo dòng trùng; kỳ đã khóa chỉ nhận delta.
- **T-INC-15** — Báo cáo theo kỳ/người tham gia: eligible, rate, phiên bản, kết quả đúng hạn/trễ (dòng 0 vẫn hiện), delta kỳ trước; bộ lọc + CSV, không PDF (Q19). Mã RPT-07 theo brief LAB-5, giả định (S). *DoD:* Báo cáo hiện cả dòng late = 0 và dòng delta; tổng CSV = tổng incentive_calc của kỳ.
- **T-INC-16** — Bộ lọc kỳ/người tham gia/kết quả, bảng có cột phiên bản quy tắc và delta, nút xuất CSV. *DoD:* Settlement xem và xuất được RPT-07 theo kỳ.
- **T-INC-17** — Ba test vector RFP + trễ đúng 1 ngày = 0 vẫn có dòng + chưa nhập trả = chưa tính + trả lúc 00:30 JST + phiên bản nháp không dùng. *DoD:* Tất cả test xanh trong CI; mỗi vector có giá trị kỳ vọng tính tay ghi trong test.
- **T-INC-18** — Kịch bản tiếng Nhật cho người phụ trách nghiệp vụ: nhập trả tay/CSV, trả đúng hạn/trễ 1 ngày, đổi bậc qua phiên bản mới, điều chỉnh sau khóa kỳ → delta, đọc RPT-07. *DoD:* Kịch bản được lead NHẬN và gửi khách trước UAT.

## 3. Hạng mục chịu ràng buộc đặc thù

Các task mang cờ khác "—": ràng buộc riêng của chợ bán buôn Nhật / luật / RFP, sai là mất điểm hoặc bị loại hồ sơ. Mỗi cờ là một nhóm theo dõi riêng (label trên GitHub Project).

| Cờ | Task | SP | Giờ | Vì sao đặc thù |
|---|---:|---:|---:|---|
| Ngày khóa & điều chỉnh | 17 | 85 | 141 | 締め: không sửa trực tiếp, chỉ -R/-A có duyệt, người duyệt ≠ người soạn, log lần bị chặn. |
| Quy tắc phiên bản | 15 | 66 | 118 | GOV-RULE-01: maker–checker, ngày hiệu lực tương lai, rollback, ≤ 4 lần/năm, không deploy. |
| Ngày nghiệp vụ JST | 9 | 34 | 59 | 業務日 theo JST, mở ngày tường minh; UTC làm lệch ngày 00:00–09:00 JST. |
| 許可/承認 | 12 | 59 | 107 | RFP 12-06: gộp 許可 và 承認 là loại hồ sơ; kiểm tư cách lúc chốt và lúc giao. |
| MFA/Bảo mật | 11 | 33 | 63 | NFR-SEC-01: MFA cho quản trị/duyệt; khóa tạm, timeout (BC-85/86). |
| せり xác nhận | 5 | 16 | 29 | Chỉ ghi kết quả cuối có 確認者 là người (BC-29); làm thành hệ thống đấu giá là bị loại. |
| Kế toán IF-ACC-01 | 5 | 21 | 35 | CSV kế toán chỉ sau khóa sổ, batch code + trạng thái dòng 保留/確認済み/調整済み (T20). |
| Offline | 8 | 33 | 60 | Khu tiếp nhận/bến giao mất mạng 3–5 lần/tuần; chỉ tiếp nhận và giao chạy offline (Q15). |
| 完納奨励金 | 18 | 72 | 130 | Khuyến khích trả đủ đúng hạn (BR-INC-01): ×110/100 rồi cắt xuống yên, không ân hạn, delta kỳ sau; dễ hiểu nhầm thành 'giao đủ' (T6). |

- **Ngày khóa & điều chỉnh:** T-AUD-02 (3 SP/6 h), T-LOT-02 (5 SP/8 h), T-TRADE-04 (5 SP/8 h), T-LOCK-01 (3 SP/5 h), T-LOCK-02 (8 SP/12 h), T-LOCK-03 (8 SP/12 h), T-LOCK-04 (5 SP/10 h), T-LOCK-05 (5 SP/8 h), T-LOCK-06 (5 SP/10 h), T-LOCK-07 (5 SP/10 h), T-LOCK-08 (5 SP/8 h), T-LOCK-09 (8 SP/12 h), T-LOCK-10 (8 SP/12 h), T-LOCK-11 (3 SP/6 h), T-LOCK-12 (5 SP/8 h), T-LOCK-13 (3 SP/5 h), T-LOCK-14 (1 SP/1 h)
- **Quy tắc phiên bản:** T-RULE-01 (5 SP/8 h), T-RULE-02 (5 SP/10 h), T-RULE-03 (3 SP/6 h), T-RULE-04 (2 SP/4 h), T-RULE-05 (3 SP/6 h), T-RULE-06 (3 SP/6 h), T-RULE-07 (8 SP/12 h), T-RULE-08 (5 SP/8 h), T-RULE-09 (5 SP/10 h), T-RULE-10 (5 SP/8 h), T-RULE-11 (5 SP/10 h), T-RULE-12 (8 SP/12 h), T-RULE-13 (3 SP/6 h), T-RULE-14 (1 SP/2 h), T-RULE-15 (5 SP/10 h)
- **Ngày nghiệp vụ JST:** T-BDAY-01 (3 SP/6 h), T-BDAY-02 (5 SP/8 h), T-BDAY-03 (2 SP/4 h), T-BDAY-04 (5 SP/10 h), T-BDAY-05 (5 SP/8 h), T-BDAY-06 (2 SP/4 h), T-BDAY-07 (3 SP/6 h), T-BDAY-08 (1 SP/1 h), T-DEL-02 (8 SP/12 h)
- **許可/承認:** T-QUAL-01 (2 SP/4 h), T-QUAL-02 (3 SP/6 h), T-QUAL-03 (5 SP/8 h), T-QUAL-04 (3 SP/5 h), T-QUAL-05 (5 SP/10 h), T-QUAL-06 (8 SP/12 h), T-QUAL-07 (5 SP/10 h), T-QUAL-08 (2 SP/4 h), T-QUAL-09 (5 SP/10 h), T-QUAL-10 (8 SP/14 h), T-QUAL-11 (5 SP/10 h), T-TRADE-01 (8 SP/14 h)
- **MFA/Bảo mật:** T-SEC-01 (3 SP/6 h), T-SEC-02 (3 SP/6 h), T-SEC-03 (3 SP/6 h), T-SEC-04 (5 SP/8 h), T-SEC-05 (3 SP/6 h), T-SEC-06 (5 SP/10 h), T-SEC-07 (2 SP/4 h), T-SEC-08 (3 SP/6 h), T-SEC-09 (1 SP/1 h), T-SEC-10 (3 SP/6 h), T-SEC-11 (2 SP/4 h)
- **せり xác nhận:** T-AUC-01 (3 SP/6 h), T-AUC-02 (2 SP/4 h), T-AUC-03 (5 SP/10 h), T-AUC-04 (1 SP/1 h), T-AUC-05 (5 SP/8 h)
- **Kế toán IF-ACC-01:** T-ACC-01 (3 SP/5 h), T-ACC-02 (8 SP/12 h), T-ACC-03 (5 SP/8 h), T-ACC-04 (2 SP/4 h), T-ACC-05 (3 SP/6 h)
- **Offline:** T-OFF-01 (5 SP/8 h), T-OFF-02 (5 SP/10 h), T-OFF-03 (3 SP/6 h), T-OFF-04 (5 SP/8 h), T-OFF-05 (3 SP/6 h), T-OFF-06 (5 SP/10 h), T-OFF-07 (2 SP/4 h), T-OFF-08 (5 SP/8 h)
- **完納奨励金:** T-INC-01 (5 SP/8 h), T-INC-02 (2 SP/4 h), T-INC-03 (2 SP/4 h), T-INC-04 (5 SP/10 h), T-INC-05 (3 SP/6 h), T-INC-06 (5 SP/10 h), T-INC-07 (5 SP/10 h), T-INC-08 (8 SP/12 h), T-INC-09 (3 SP/6 h), T-INC-10 (3 SP/6 h), T-INC-11 (5 SP/8 h), T-INC-12 (2 SP/4 h), T-INC-13 (5 SP/8 h), T-INC-14 (3 SP/6 h), T-INC-15 (5 SP/8 h), T-INC-16 (5 SP/8 h), T-INC-17 (3 SP/6 h), T-INC-18 (3 SP/6 h)

## 4. Quy tắc ước lượng (sizing)

- Ước lượng **giờ trước** (dev có AI hỗ trợ, đã gồm viết test của chính task), SP **suy ra** từ giờ theo bảng dưới — một quy tắc cho mọi task.
- Mỗi task 1–16 giờ; SP ∈ {1, 2, 3, 5, 8}; task > 16 giờ phải tách (không có task 'một khối').
- Task test (QA) tách khỏi task dev để QA chạy song song; tiêu chí nghiệm thu lấy từ §10 của spec.

| SP | Giờ |
|---:|---|
| 1 | 1-2 |
| 2 | 3-4 |
| 3 | 5-7 |
| 5 | 8-11 |
| 8 | 12-16 |

## 5. Kế hoạch sprint

Đội: BrSE×1, BE×2, FE×2, QA×1; sprint 2 tuần (10 ngày làm); 8 h/ngày × focus factor 0.7 = **56 h/người/sprint** → năng lực 336 h/sprint (BE 112, FE 112, QA 56, BrSE 56).
Xếp lịch tự động: ưu tiên P0 → P1 → P2, trong cùng mức ưu tiên task nằm trên chuỗi phụ thuộc dài nhất (đường găng) đi trước; task chỉ bắt đầu khi task phụ thuộc đã xong (có thể trong cùng sprint nếu kịp), mỗi người ≤ 56 h/sprint. Infra giao cho BE.

| Sprint | Từ | Đến | Task | SP | Giờ | BE | FE | QA | BrSE |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|
| Sprint 1 | 2026-11-09 | 2026-11-20 | 34 | 120 | 208 | 107 | 52 | 18 | 31 |
| Sprint 2 | 2026-11-23 | 2026-12-04 | 20 | 78 | 142 | 104 | 32 | 6 | 0 |
| Sprint 3 | 2026-12-07 | 2026-12-18 | 18 | 87 | 152 | 110 | 42 | 0 | 0 |
| Sprint 4 | 2026-12-21 | 2027-01-01 | 26 | 127 | 223 | 111 | 90 | 22 | 0 |
| Sprint 5 | 2027-01-04 | 2027-01-15 | 28 | 120 | 213 | 69 | 88 | 56 | 0 |
| Sprint 6 | 2027-01-18 | 2027-01-29 | 7 | 24 | 43 | 0 | 0 | 43 | 0 |

**Đọc kết quả:** BrSE 31 h ≈ 0.6 sprint, BE 501 h ≈ 4.5 sprint, FE 304 h ≈ 2.7 sprint, QA 145 h ≈ 2.6 sprint. **BE là vai trò giới hạn** (đường găng đi qua migration và hàm `fn_*`). Sprint 1 dùng 208/336 h nhưng BE đã 107/112 h — tức là đầy theo năng lực BE. FE/QA dư ở Sprint 1–3 dùng cho việc độc lập (offline, app shell, khung test); nếu FE làm được SQL (đội Next.js full-stack) thì cho FE nhận thêm task DB/API của QUAL/RULE để rút ngắn khoảng 1 sprint. FE đã nhận sẵn 9 route handler mỏng (BDAY-03, QUAL-08, AUC-02, RULE-06, RULE-10, LOT-03, SEC-03, INC-15, BDAY-06).

### Sprint 1 (cam kết) — 2026-11-09 → 2026-11-20

Trọng tâm: nền DB của các gap **Cao** (G-01 tư cách, G-02 ngày JST, G-05 quy tắc phiên bản, G-06 audit), khung MFA (G-19), cùng spec/câu hỏi khách cho 完納奨励金 để gỡ Q16/Q17 sớm.

| ID | Tiêu đề | Vai trò | SP | Giờ | Cờ |
|---|---|---|---:|---:|---|
| T-AUD-01 | Chặn UPDATE/DELETE `audit_logs` và thêm index tra cứu | BE | 2 | 4 | — |
| T-AUD-03 | Chuyển ghi audit vào trong các hàm `fn_*` (cùng giao dịch) | BE | 8 | 12 | — |
| T-RULE-05 | Tạo `system_settings` và `fn_setting(key)` | BE | 3 | 6 | Quy tắc phiên bản |
| T-BDAY-01 | Mở rộng `business_days` theo trạng thái và thêm `market_calendar` | BE | 3 | 6 | Ngày nghiệp vụ JST |
| T-RULE-01 | Tạo `rule_sets` và `rule_values` với trigger bất biến | BE | 5 | 8 | Quy tắc phiên bản |
| T-BDAY-02 | Viết hàm ngày nghiệp vụ: `fn_current_business_date`, `fn_business_date`, `fn_assert_*` | BE | 5 | 8 | Ngày nghiệp vụ JST |
| T-QUAL-01 | Tạo `party_kinds` và `party_kind_basis` (suspend_policy) | BE | 2 | 4 | 許可/承認 |
| T-RULE-02 | Viết `fn_validate_rule_value` theo danh mục khóa ADR-008 | BE | 5 | 10 | Quy tắc phiên bản |
| T-LOCK-01 | Mở rộng `corrections` và tạo `correction_decisions` | BE | 3 | 5 | Ngày khóa & điều chỉnh |
| T-QUAL-02 | Tạo `participant_qualifications` và `qualification_events` | BE | 3 | 6 | 許可/承認 |
| T-FND-01 | Tạo danh mục `items` và chuyển `lots.item/unit` sang `item_code` | BE | 5 | 8 | — |
| T-LOCK-03 | Sửa `fn_decide_correction`: nhiều cấp, need_info, sinh -R/-A ở ngày hiện tại | BE | 8 | 12 | Ngày khóa & điều chỉnh |
| T-QUAL-03 | Migrate tư cách từ `participants` sang bảng mới rồi bỏ cột cũ | BE | 5 | 8 | 許可/承認 |
| T-INC-01 | Soạn spec nghiệp vụ 完納奨励金 và gửi câu hỏi Q16/Q17/Q29/Q30 | BrSE | 5 | 8 | 完納奨励金 |
| T-RULE-03 | Viết `fn_rule_set(date)`, `fn_rule(key, date)` và seed phiên bản v1 | BE | 3 | 6 | Quy tắc phiên bản |
| T-RULE-04 | Tạo `item_tax_rates` thuế suất theo phiên bản | BE | 2 | 4 | Quy tắc phiên bản |
| T-BDAY-03 | Dựng API `GET /api/business-days/current` và danh sách theo trạng thái | FE | 2 | 4 | Ngày nghiệp vụ JST |
| T-BDAY-05 | Thay ngày UTC ở UI bằng 業務日 từ server | FE | 5 | 8 | Ngày nghiệp vụ JST |
| T-RULE-14 | Chỉnh spec SCR-034: bỏ F-21 và thống nhất thuế suất 0–1 hiển thị % | BrSE | 1 | 2 | Quy tắc phiên bản |
| T-AUC-04 | Chỉnh spec SCR-019: nút 記録 tắt khi 確認者 trống | BrSE | 1 | 1 | せり xác nhận |
| T-LOCK-05 | Dựng màn hình duyệt điều chỉnh SCR-022 | FE | 5 | 8 | Ngày khóa & điều chỉnh |
| T-SEC-09 | Chỉnh spec M-06: tách câu chưa đăng ký / chưa xác minh | BrSE | 1 | 1 | MFA/Bảo mật |
| T-FND-12 | Dựng khung test tích hợp DB và E2E Playwright chạy trong CI | QA | 5 | 10 | — |
| T-FND-10 | Thống nhất bộ dữ liệu test chung và fixture factory | QA | 5 | 8 | — |
| T-OFF-01 | Dựng phát hiện mạng và nhãn オフライン dùng chung | FE | 5 | 8 | Offline |
| T-OFF-02 | Dựng hàng đợi IndexedDB cho bản ghi offline | FE | 5 | 10 | Offline |
| T-FND-08 | Viết spec khung ứng dụng (menu, header, nhãn 業務日 và mạng) | BrSE | 3 | 6 | — |
| T-TRADE-05 | Viết spec SCR-018 chi tiết giao dịch và hủy | BrSE | 2 | 4 | — |
| T-FND-09 | Dựng khung ứng dụng theo spec app shell | FE | 5 | 10 | — |
| T-INC-18 | Viết kịch bản UAT 完納奨励金 | BrSE | 3 | 6 | 完納奨励金 |
| T-BDAY-06 | Nạp lịch chợ `market_calendar` và import CSV ngày nghỉ | FE | 2 | 4 | Ngày nghiệp vụ JST |
| T-BDAY-08 | Chỉnh spec RJ-11: câu riêng khi chưa mở ngày | BrSE | 1 | 1 | Ngày nghiệp vụ JST |
| T-DEL-07 | Chỉnh spec SCR-029 §11: ghi chú đổi nghĩa F-07 / F-11 | BrSE | 1 | 1 | — |
| T-LOCK-14 | Chỉnh spec SCR-022: gợi ý 'ngày gốc còn mở' xét cả closing / reopened | BrSE | 1 | 1 | Ngày khóa & điều chỉnh |

### Sprint 2 (phác thảo) — 2026-11-23 → 2026-12-04

- **E-INC:** T-INC-02, T-INC-04, T-INC-06, T-INC-05, T-INC-03
- **E-FND:** T-FND-11, T-FND-03
- **E-QUAL:** T-QUAL-04, T-QUAL-05, T-QUAL-06, T-QUAL-08
- **E-DEL:** T-DEL-01, T-DEL-03
- **E-RULE:** T-RULE-07, T-RULE-10, T-RULE-11, T-RULE-06
- **E-AUD:** T-AUD-02, T-AUD-04
- **E-AUC:** T-AUC-02

### Sprint 3 (phác thảo) — 2026-12-07 → 2026-12-18

- **E-TRADE:** T-TRADE-01, T-TRADE-02
- **E-DEL:** T-DEL-04, T-DEL-02, T-DEL-05, T-DEL-06
- **E-INC:** T-INC-09, T-INC-10, T-INC-11, T-INC-12
- **E-RULE:** T-RULE-08
- **E-LOT:** T-LOT-01, T-LOT-03, T-LOT-04
- **E-QUAL:** T-QUAL-07, T-QUAL-09
- **E-FND:** T-FND-07
- **E-LOCK:** T-LOCK-07

### Sprint 4 (dự kiến) — 2026-12-21 → 2027-01-01

- **E-RULE:** T-RULE-09, T-RULE-12, T-RULE-13, T-RULE-15
- **E-ACC:** T-ACC-01, T-ACC-02
- **E-SEC:** T-SEC-01, T-SEC-04, T-SEC-05, T-SEC-06
- **E-TRADE:** T-TRADE-03
- **E-BDAY:** T-BDAY-04, T-BDAY-07
- **E-LOCK:** T-LOCK-02, T-LOCK-08, T-LOCK-10, T-LOCK-04
- **E-INC:** T-INC-13, T-INC-14, T-INC-17 (dời từ Sprint 6 sau review — xem README)
- **E-AUC:** T-AUC-01, T-AUC-03
- **E-QUAL:** T-QUAL-10
- **E-LOT:** T-LOT-02
- **E-OFF:** T-OFF-03, T-OFF-07

### Sprint 5 (dự kiến) — 2027-01-04 → 2027-01-15

- **E-ACC:** T-ACC-03, T-ACC-04
- **E-TRADE:** T-TRADE-04, T-TRADE-07, T-TRADE-06
- **E-LOT:** T-LOT-05
- **E-QUAL:** T-QUAL-11
- **E-DEL:** T-DEL-08
- **E-LOCK:** T-LOCK-06, T-LOCK-12, T-LOCK-09, T-LOCK-11
- **E-AUC:** T-AUC-05
- **E-OFF:** T-OFF-04, T-OFF-05, T-OFF-06
- **E-INC:** T-INC-07, T-INC-15, T-INC-08, T-INC-16
- **E-SEC:** T-SEC-07, T-SEC-02, T-SEC-03, T-SEC-08
- **E-FND:** T-FND-04, T-FND-02, T-FND-05, T-FND-06

### Sprint 6 (dự kiến) — 2027-01-18 → 2027-01-29

- **E-SEC:** T-SEC-10, T-SEC-11
- **E-LOT:** T-LOT-06
- **E-ACC:** T-ACC-05
- **E-TRADE:** T-TRADE-08
- **E-OFF:** T-OFF-08
- **E-LOCK:** T-LOCK-13

## 6. Giả định

- Mọi Plan A của 35 câu Q&A là giả định (S); đặc biệt Q16 (bảng tỷ lệ, 支払期日), Q17 (nhập tay/CSV), Q29 (thuế suất, cơ sở tính), Q30 (liên kết 完納) chưa được khách trả lời.
- 完納奨励金 không có trong 9 spec lõi: kỳ tính = tháng; eligible_amount = tổng phải thu ròng của kỳ; ngày áp dụng phiên bản = 支払期日; công thức floor(eligible × rate × 110/100) — đều là (S).
- Mã báo cáo RPT-07 cho khuyến khích lấy theo brief LAB-5; tài liệu 01 không ghi số RPT cho báo cáo này (S).
- Màn hình cài đặt hệ thống, hòa giải offline, xác nhận tiền về, SCR-018 và app shell chưa có spec: có task viết spec (BrSE) hoặc dựng theo ADR với giả định (S).
- CK-2 'đồng bộ offline' trên server = số bản ghi đồng bộ lỗi chưa hòa giải; server không thấy hàng đợi còn nằm trên máy (S).
- Ước lượng là giờ dev có AI hỗ trợ, đã gồm test của chính task; chưa gồm review code và họp (đã trừ qua focus factor 0,7).
- Không có thành viên Infra: việc Infra (bucket Storage, service worker, CI grep) giao BE/FE.
- Sprint xếp theo năng lực, không tính ngày lễ (đội offshore); nếu đội làm theo lịch Nhật thì Sprint 2 mất 1 ngày (23/11 勤労感謝の日) và Sprint 4 rơi vào nghỉ cuối năm.
- Không làm phần 'ngoài phạm vi' của docs/scope.md (SCR-055–060 Plan B/Option); màn hình tranh chấp đầy đủ SCR-026/027 để giai đoạn sau.

## 7. Câu hỏi mở

- Q16: cấu trúc bảng tỷ lệ và định nghĩa 支払期日 — chặn chốt T-INC-05, T-INC-11 (đang chạy bằng dữ liệu giả).
- Q17: định dạng CSV thanh toán của bộ phận đối soát — chặn chốt T-INC-07.
- Q29/Q30: cơ sở tính khuyến khích trước/sau thuế; liên kết 完納 thanh toán với giao hàng.
- Q20: mã hóa CSV kế toán (Shift_JIS hay UTF-8 BOM) — T-ACC-03 hỗ trợ cả hai qua system_settings.
- Q31/Q33: chính sách tư cách hết hạn lúc giao; kiểm bên bán đầy đủ hay chỉ tạm dừng — đã cấu hình được, chờ chọn mặc định.
