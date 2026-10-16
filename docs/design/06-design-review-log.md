# 06 — Nhật ký review thiết kế (LAB-4)

Mỗi lần review thêm một mục mới ở cuối file, không xóa mục cũ.

---

## Mục 1 — Review bộ thiết kế LAB-4 (01, 02, 03, ADR-001…010, 04-screen-specs) · 2026-10-16

- **Vai trò:** reviewer khó tính cấp quản lý, quyết định nhận / trả lại. Theo `docs/ai-context/prompts/design-review-checklist.md`.
- **Yêu cầu gốc (LAB-4):** từ prototype LAB-2, làm bộ thiết kế đủ: wireframe, kiến trúc (thành phần, luồng chính, điểm tích hợp), screen spec màn hình lõi (field, validation, trạng thái, hiển thị theo quyền), ADR (bối cảnh, lựa chọn, phương án bỏ, hệ quả), ERD khớp bảng LAB-2 và chỉ ra chỗ prototype lệch thiết kế. Phải phản ánh ràng buộc riêng của khách: quy tắc vận hành chợ, 許可 ≠ 承認. Sẽ tách task ở LAB-5.
- **Không review:** `05-wireframes/` (đang làm song song).
- **Cách kiểm:** đọc từng file; tra ID trong `product-a-rfp-ja-v1.0-rc7.pdf.parsed.md` bằng grep; đối chiếu 03 §1 với `supabase/migrations/0001_schema.sql` từng cột; đối chiếu mã quyền / vai trò với `supabase/seed.sql`, tên hàm với `0002_business_functions.sql`, đường dẫn code với `src/`.

### 1. Bảng kết luận

| File | Kết luận | Lý do (một dòng) |
|---|---|---|
| 01-business-constraints.md | **NHẬN** | 13 mã RFP tra ngẫu nhiên đều đúng nguyên văn; giả định ghi S/A rõ ràng |
| 02-architecture.md | **NHẬN CÓ SỬA** | Sequence chốt giao dịch đặt kiểm ngày khóa trước tư cách, trái §9.1 và SCR-016; thiếu job nền, lưu file, đồng bộ offline trong sơ đồ thành phần |
| 03-database-diagram.md | **NHẬN CÓ SỬA** | §1 khớp 0001 đủ 11 bảng / 92 cột; §2 thiếu nhiều bảng, cột mà spec đã dùng, có hai lỗi mô hình (`items` PK, `line_status`) |
| ADR-001 | **NHẬN** | Đủ 4 phần, phương án bỏ có lý do |
| ADR-002 | **NHẬN** | Đúng với code (`admin-client.ts`, revoke EXECUTE) |
| ADR-003 | **NHẬN CÓ SỬA** | Quyết định "RAISE tiếng Việt" trái quy ước JP + VI có mã lỗi mà mọi spec đã theo |
| ADR-004 | **NHẬN CÓ SỬA** | Chưa liệt kê 4 mã quyền mới và quyền cho `rule_admin`; ánh xạ `approver` = trưởng đối soát chưa ghi là S |
| ADR-005 | **NHẬN** | Đúng BC-43/44, khớp `fn_decide_correction` |
| ADR-006 | **NHẬN CÓ SỬA** | Để ngỏ hai cách ghi `blocked_edit` (dblink hoặc API), dev phải hỏi lại |
| ADR-007 | **NHẬN CÓ SỬA** | Spec đẻ thêm 3 hàm tư cách (`fn_qualification_state`, `fn_qualification_event`, `fn_delivery_qualification`) không có trong ADR, trùng `purpose='deliver'` |
| ADR-008 | **NHẬN CÓ SỬA** | Danh mục khóa lệch spec (`allowed_units` đã bị `items` thay); gộp tham số bảo mật / vận hành vào bộ quy tắc giới hạn 4 lần / năm |
| ADR-009 | **TRẢ LẠI** | Hai định nghĩa "ngày nghiệp vụ hiện tại" mâu thuẫn nhau (quy tắc số 2), coi `business_day` của lô vừa là lỗi vừa là đúng; một quy tắc tự đặt không ghi S |
| ADR-010 | **NHẬN** | Đúng Plan A Q15, BC-75…77 |
| 04-screen-specs/README.md | **NHẬN CÓ SỬA** | Quy ước "mã quyền đúng mã trong `permissions`" bị chính các spec vượt; thiếu chỗ ghi danh mục mã mới, không gian mã lỗi |
| SCR-001 đăng nhập | **NHẬN CÓ SỬA** | Đặt khóa bảo mật trong `rule_values` (4 lần / năm, hiệu lực tương lai); câu lỗi MFA khác SCR-022 / SCR-024 |
| SCR-010 tư cách | **NHẬN CÓ SỬA** | Phân nhánh 許可 / 承認 / 登録 đúng và đầy đủ; cột `conditions_met_note`, khóa lạc quan không có trong 03; A-02 bắt buộc số hiệu chưa ghi S |
| SCR-012 lô | **NHẬN CÓ SỬA** | `lots.client_ref`, `lots.item_code`, `doc_counters` chưa có ở 03 §2; tham số truy vấn người tham gia khác SCR-016 |
| SCR-016 相対 | **NHẬN CÓ SỬA** | Mặc định `trade_kind_matrix` chặn 卸売業者 mua, trái SCR-019; R-10 không ghi `blocked_edit`; khóa "tính hết ngày `valid_to`" không có tên |
| SCR-019 せり | **NHẬN CÓ SỬA** | 確認者 mặc định = người nhập, tái tạo đúng lỗ hổng G-22; `result_at`, `recorded_by` thiếu ở 03 §2 |
| SCR-022 điều chỉnh | **NHẬN CÓ SỬA** | `correction_decisions`, `impact_*`, `need_info` thiếu ở 03; khóa `correction_evidence_required_when` không có mặc định; quy tắc "1 yêu cầu / giao dịch" chưa ghi S |
| SCR-024 khóa sổ | **NHẬN CÓ SỬA** | CK-5 và `保留` dựa vào bảng tranh chấp không tồn tại; MFA theo thao tác mâu thuẫn MFA theo đăng nhập ở SCR-001 |
| SCR-029 giao hàng | **NHẬN CÓ SỬA** | Không có cách đánh dấu ngoại lệ "có tranh chấp" mà F-07 và BC-57 cần; ngày ghi lấy theo đồng hồ, khác SCR-022 / SCR-024 |

**Tổng:** 5 NHẬN · 16 NHẬN CÓ SỬA · 1 TRẢ LẠI (22 file).

Đánh giá chung: bộ tài liệu đạt mục tiêu LAB-4 ở phần khó nhất. 許可 / 承認 / 登録 tách bạch xuyên suốt từ 01 → ADR-007 → 03 §3 → SCR-010/016/019/029, câu thông báo khác nhau theo căn cứ, và có tiêu chí nghiệm thu kiểm đúng điều này. ERD as-built chính xác. Lỗi chủ yếu là **lệch giữa các spec do hai agent viết song song** và **03 §2 chưa theo kịp spec**. Phải sửa trước khi tách task LAB-5, nếu không task sẽ mang mâu thuẫn vào code.

Thiếu ở cấp bộ tài liệu (không gán cho file nào): **không có screen spec cho màn hình quy tắc và phiên bản (SCR-034/035)**. Đề bài nhấn "quy tắc vận hành chợ", ADR-008 có thiết kế, và 5 spec viện dẫn "màn hình quy tắc" (SCR-001 tiêu chí 8, SCR-010 §8, SCR-012 §8, SCR-022 §8, SCR-024 §8), nhưng không ai đặc tả màn hình đó. Đề xuất bổ sung `scr-034-rule-versions.md` trước LAB-5, hoặc ghi rõ ở README là ngoài 8 màn hình lõi kèm lý do.

### 2. Chi tiết từng file (chỉ ghi điểm không đạt)

Mục kiểm: (1) đủ phần · (2) đúng nguồn · (3) không bịa quy tắc · (4) 7 quy tắc · (5) nhất quán · (6) triển khai được · (7) kiểm thử được.

#### 01-business-constraints.md — NHẬN
- (2) Đạt. Đã tra 13 mã, đều tồn tại và nói đúng điều được trích: BR-PERM-01 (dòng RFP 1216: 「取引時点で 許可/承認 の有効性を確認」), BR-CLOSE-01 (1221), BR-INC-01 (1223: 110/100, 切り捨て, 猶予なし, 次期差分), BR-DEL-03 (1227), GOV-RULE-01 (1233: 年間最大四回, 起票・承認分離), FR-LOT-03 (1422), FR-AITAI-03 (1528), FR-CORR-03 (1625), FR-SETTLE-02 (1656), FR-DEL-03 (1807: 「例外確認者があること」), NFR-SEC-01 (2281), EX-02 (1079), 12-06 (2715: 「許可 と 承認 を同一の権限として扱うこと」).
- (2) Nhỏ: BC-41 ghi "chưa đối chiếu mục gốc", nhưng RFP dòng 192 có nguyên văn 「週6日、市場カレンダー上の休市日を除く」 → đổi Mức thành B và bỏ chú thích.
- (2) Nhỏ: BC-08 dẫn EX-TRADE-01 (dòng 2925), mã này nói về hết hạn **sáng ngày giao dịch**, cách xử lý hiện tại là tạm dừng giao dịch, không nói về lúc giao hàng. Nên dẫn riêng FIG-014 cho bước giao hàng.
- (5) Nhỏ: BC-87 liệt kê 7 vai trò RFP; `project-context.md` dòng 8 ghi "8 vai trò" (đúng với seed prototype có `market_ops`, `approver`). Không sai, nhưng nên thêm một dòng ánh xạ vai trò RFP → mã `roles` (đích 9 vai trò) để người đọc không nhầm.

#### 02-architecture.md — NHẬN CÓ SỬA
- (1) Sơ đồ §1 thiếu các thành phần mà thiết kế đích cần: job định kỳ (đổi trạng thái `expired` của SCR-010 §9, cảnh báo hết hạn BC-07, batch báo cáo trước 11:00 BC-42, thử lại email 3 lần BC-63); nơi lưu file đính kèm (`attachments`, SCR-010/022/029); service worker + IndexedDB + màn hình hòa giải (ADR-010).
- (1) §3 thiếu điểm tích hợp nhập tiền về bằng CSV (Q17, BC-68) — đầu vào duy nhất để tính 完納奨励金.
- (5) Dòng 77–80: sequence kiểm "ngày nghiệp vụ còn mở?" **trước** tư cách và tồn. 01 §9.1 và SCR-016 §9 đặt ngày khóa ở bước 6 (sau cùng). Ba tài liệu phải theo một thứ tự (xem §3 mục C-12).
- (5) Dòng 87: `A->>D: INSERT audit_logs` sau khi hàm trả về — đó là as-built (G-06). Sơ đồ phải ghi rõ "as-built" hoặc vẽ theo đích (audit trong `fn_confirm_trade`, ADR-006).
- (5) Dòng 102–109 (điều chỉnh) chưa có `need_info`, bằng chứng, nhiều cấp duyệt như SCR-022.
- (5) Dòng 41: "trả lỗi tiếng Việt" trái quy ước JP + VI có mã (README spec dòng 23, G-24).

#### 03-database-diagram.md — NHẬN CÓ SỬA
- **§1 so với `0001_schema.sql`: khớp hoàn toàn.** 11 bảng, đủ cột, đúng kiểu, đúng FK, đúng giá trị CHECK enum (`kind`, `basis`, `status`, `entry_type`, `exception_type`), cột sinh `amount`. Không có cột thừa hay thiếu. Chỉ là ERD không ghi vài CHECK phụ: `participants valid_to >= valid_from`, `lots.initial_qty > 0`, `trades.unit_price >= 0`, `corrections.new_qty > 0`, `deliveries (kind='exception') = (exception_type is not null)`, mặc định `lots.unit = 'kg'`. Đề xuất thêm một dòng ghi chú; không bắt buộc.
- (5) §2 thiếu những gì spec đã dùng (chi tiết ở §4 bên dưới): bảng `correction_decisions`, `day_reopen_requests`, `doc_counters`, `disputes` (hoặc cờ tranh chấp), dòng chi tiết xuất kế toán; cột `lots.item_code`, `lots.client_ref`, `trades.result_at`, `trades.recorded_by`, `corrections.impact_settlement/impact_delivery` + trạng thái `need_info`, `deliveries.confirmed_at/qualification_flag`, `qualification_events.payload`.
- (6) Dòng 221–227: `items` có PK `(code, rule_set_id)`, nhưng dòng 160 vẽ `lots.item_code` FK tới `items`. FK chỉ bằng `code` là không làm được vì `code` không duy nhất. Dev sẽ hỏi: lô trỏ tới phiên bản mặt hàng nào? Đề xuất: tách `items(code PK, name, unit)` và `item_tax_rates(item_code, rule_set_id, tax_rate)`; lô FK `items.code`.
- (6) Dòng 264–271: `line_status` (保留 / 確認済み / 調整済み) đặt trên `accounting_exports` (một batch), trong khi BC-71 và SCR-024 §9.4 nói trạng thái **theo dòng**. Thêm bảng `accounting_export_lines(batch_id, participant_id, amount, tax, line_status)`.
- (5) G-19 dòng 320 ghi MFA cho `sys_admin, rule_admin, approver`; SCR-001 thêm `settlement` (S) → đồng bộ (thêm "+ settlement mặc định, S").
- (5) G-16 dòng 317 và ADR-004 cần liệt kê quyền mới (xem §4).

#### ADR-003 — NHẬN CÓ SỬA
- (5) Dòng 19: "RAISE bằng thông báo tiếng Việt; API trả nguyên văn". Mọi spec đã chuyển sang "D raise kèm `code`, API ánh xạ câu JP + VI" (SCR-010 dòng 85, SCR-016 dòng 122). Sửa quyết định cho khớp, ghi hệ quả "đổi toàn bộ RAISE sang mã lỗi".
- (5) Dòng 16: danh sách hàm chỉ có hàm as-built. Thêm dòng "thiết kế đích: xem danh mục hàm ở 06 §4" hoặc liệt kê.

#### ADR-004 — NHẬN CÓ SỬA
- (5) Chưa có 4 mã quyền mới mà spec dùng: `qualifications.approve`, `days.open`, `recon.reopen.request`, `recon.reopen.approve`; chưa có mã quyền nào cho `rule_admin` (soạn / duyệt phiên bản quy tắc) dù SCR-001/010 tiêu chí nghiệm thu dựa vào nó.
- (3) Dòng 20: "`approver` ứng với trưởng bộ phận đối soát" là suy luận, chưa ghi "giả định (S)" (BC-21 chỉ nói người chịu trách nhiệm cuối).

#### ADR-006 — NHẬN CÓ SỬA
- (6) Dòng 14: "dùng `dblink` / autonomous call **hoặc** ghi ở API khi nhận lỗi `P0001`". Hai cách khác hẳn về hạ tầng (dblink phải bật extension, có kết nối thứ hai). Dev sẽ hỏi chọn cái nào. Đề xuất chọn một: hàm raise kèm `code = 'LOCKED_DAY'`, API bắt mã đó và ghi `blocked_edit` qua một RPC riêng `fn_log_blocked_edit` (không cần dblink). SCR-012/024/029 đã viết "ghi `blocked_edit`" nên chỉ cần ADR chốt cách.

#### ADR-007 — NHẬN CÓ SỬA
- (5) Quyết định 3 chỉ có `fn_qualification_block_reason(party, business_date, purpose ∈ sell/buy/deliver)`. Spec lại dùng thêm `fn_qualification_state(qid, date)` (SCR-010 dòng 40), `fn_qualification_event(...)` (SCR-010 dòng 152), `fn_delivery_qualification(buyer, business_date)` (SCR-029 dòng 108). Hàm cuối trùng `purpose='deliver'` — vi phạm DRY. Chốt họ hàm trong ADR: `fn_qualification_state` (trạng thái), `fn_qualification_block_reason` (chặn theo mục đích, trả `block | allow_with_flag | allow` cho `deliver`), `fn_qualification_event` (vòng đời).

#### ADR-008 — NHẬN CÓ SỬA
- (5) Dòng 23: khóa `allowed_units` đã lỗi thời — 03 §2 và SCR-012 F-05 lấy đơn vị từ `items.unit`. Bỏ khóa này.
- (5) Danh sách khóa dòng 21–27 chỉ có 6 khóa; spec dùng 24 khóa (xem §4). ADR phải là nơi duy nhất liệt kê, kèm mặc định và mức S.
- (4) Quy tắc số 5 ("≤ 4 lần / năm, ngày hiệu lực tương lai"): SCR-001 đưa `mfa_required_roles`, ngưỡng khóa đăng nhập, timeout phiên; SCR-024 đưa `accounting_csv_encoding`, `lock_checklist` vào cùng `rule_values`. Hệ quả: mỗi lần chỉnh timeout hay mã hóa CSV tốn một trong 4 lần đổi quy tắc / năm của GOV-RULE-01 và phải chờ ngày hiệu lực tương lai (BC-17) — không thể siết bảo mật ngay khi có sự cố. Đây chưa phải vi phạm, nhưng sẽ thành vi phạm hoặc bế tắc vận hành. Đề xuất: tách `rule_values` (quy tắc / tỷ lệ chợ, theo GOV-RULE-01) và `system_settings` (bảo mật, vận hành; có audit + maker–checker nhưng không tính vào giới hạn 4 lần, hiệu lực ngay). Ghi quyết định vào ADR-008.
- (5) `trade_kind_matrix`: chưa ghi giá trị mặc định → hai spec tự chọn hai mặc định khác nhau (C-02).

#### ADR-009 — TRẢ LẠI
- (4)(5) **Hai định nghĩa "ngày nghiệp vụ hiện tại" trong cùng một ADR.** Dòng 21: "ngày có trạng thái `open` mới nhất". Dòng 22: `fn_business_date(now())` = ngày lịch của (giờ JST − 2 giờ). Hai cách cho kết quả khác nhau lúc 02:00–02:30 (chưa ai bấm mở ngày) và khi ngày hôm trước còn mở. Đây là quy tắc số 2 trong `project-context.md`. Hậu quả đã lan: SCR-022 ghi bút toán vào "ngày `open` mới nhất" (dòng 132); SCR-029 ghi giao hàng theo `fn_business_date(now())` (dòng 56) nhưng bản offline lại lấy `/api/business-days/current`; SCR-016 kiểm tư cách theo `business_day` của lô (dòng 97).
- (5) Dòng 12 liệt kê "chốt giao dịch kiểm theo `business_day` của lô" là **điểm lệch** của prototype, nhưng dòng 21 lại quyết "mọi thao tác ghi nhận ngày nghiệp vụ từ bản ghi gốc (lô, giao dịch)" — tức chính là hành vi đó. SCR-016 dòng 97 làm theo dòng 21. Phải nói rõ cái nào đúng.
- (3) Dòng 20: "chặn nếu ngày trước đó chưa khóa mà chưa ghi lý do" — RFP không có quy tắc này, ADR không ghi "giả định (S)" và không đưa vào cấu hình.
- (5) Chưa xử lý trạng thái `reopened` (SCR-024): ngày mở lại có được coi là "ngày hiện tại" không, `fn_assert_day_open` có nhận `reopened` không.
- (5) Chữ ký `fn_open_day(p_day, p_actor)` (dòng 18) khác SCR-024 dòng 76 `fn_open_day(p_day, p_actor, p_reason)`.
- **Yêu cầu làm lại:** một định nghĩa duy nhất, ví dụ: (a) `fn_current_business_date()` = ngày `open` mới nhất (không tính `reopened`); mọi thao tác ghi mới (lô, giao dịch, giao hàng, bút toán điều chỉnh) dùng ngày này; (b) giao dịch kế thừa `business_day` của lô **chỉ khi** lô thuộc một ngày đang `open` — kiểm tư cách theo ngày đó, ghi rõ hệ quả với BC-06; (c) `fn_business_date(now())` chỉ dùng cho việc không gắn bản ghi (cảnh báo hết hạn, gợi ý ngày cần mở); (d) khóa `business_day_start_time = '02:00'` có tên; (e) quy tắc "ngày trước chưa khóa" ghi S và có khóa cấu hình; (f) nêu cách xử lý `reopened`.

#### 04-screen-specs/README.md — NHẬN CÓ SỬA
- (5) Dòng 19: "Mã quyền dùng đúng mã trong `permissions`" — spec đã thêm 4 mã mới. Sửa thành "mã có sẵn, hoặc mã mới ghi `(mới)` và đăng ký trong 06 §4 / ADR-004".
- (5) Không quy ước không gian mã lỗi: SCR-001 dùng M-xx, SCR-010 E-xx, SCR-016 V-xx / R-xx; SCR-019 dùng lại V-02 với câu khác (dòng 52). Đề xuất: R-xx dùng chung cho lỗi nghiệp vụ từ D (một bảng chung), V-xx / E-xx / M-xx có tiền tố màn hình (`V016-02`, `V019-02`).
- (1) Thiếu dòng ghi các màn hình phụ thuộc chưa có spec: quy tắc (SCR-034/035), tranh chấp (SCR-026/027), hòa giải offline (SCR-054).

#### SCR-001 — NHẬN CÓ SỬA
- (4)(5) §9 dòng 93–102: 6 khóa bảo mật đặt trong `rule_values` → vướng giới hạn 4 lần / năm và ngày hiệu lực tương lai (xem ADR-008). Tiêu chí 8 dòng 130 cũng dựa vào luồng này. Chuyển sang `system_settings`.
- (5) Dòng 90 câu lỗi M-06 cho thiếu AAL2; SCR-022 dòng 102 và SCR-024 dòng 94 dùng hai câu khác cho cùng tình huống. Dùng M-06 cho mọi nơi.
- (5) `docs/scope.md` dòng 33 đặt MFA ở SCR-002; spec gộp vào SCR-001 (`/login/mfa`). Ghi chú gộp ở README hoặc scope.
- (6) Dòng 109: đếm lần sai từ `audit_logs` theo email — cần index `(action, entity_id/email, at)`; ghi vào 03 để dev không phải hỏi.

#### SCR-010 — NHẬN CÓ SỬA
- (4) Đạt: phân nhánh 3 luồng gỡ tạm dừng đúng FIG-004 (承認 / 条件付き / 再審査), không có nút gỡ trực tiếp cho 承認 (dòng 134), tiêu chí 1–6 kiểm đúng các nhánh. Đây là phần tốt nhất của bộ spec.
- (3) A-02 dòng 56: số hiệu **bắt buộc** với `permit`, `approval` — RFP không nói, chưa ghi S.
- (3) Dòng 64: ràng buộc không chồng khoảng hiệu lực cùng căn cứ — hợp lý nhưng là quy tắc tự đặt, ghi S.
- (5) Dòng 127 lưu `conditions_met_note`; dòng 134 khóa lạc quan bằng `version` — 03 §2 `qualification_events` không có cột payload, `participant_qualifications` không có `updated_at`. Bổ sung 03.
- (5) Dòng 40 `current_business_date` — phụ thuộc định nghĩa ADR-009 (C-01).
- (7) Tiêu chí 4 dòng 181: "403/400 E-14" — một tiêu chí phải có một kết quả. Chọn 403 (thiếu quyền) hoặc 400 (sai luồng).

#### SCR-012 — NHẬN CÓ SỬA
- (5) Dòng 58, 153: `lots.client_ref UNIQUE` và dòng 55 `lots.item_code` — 03 §2 không có cột của `lots`, chỉ có quan hệ. Dòng 115 `doc_counters` chưa có trong 03 §2.
- (5) Dòng 53: `GET /api/participants?kind=wholesaler&tradable_on={day}`; SCR-016/019 dùng `?purpose=buy&day={d}`. Thống nhất `?purpose=sell|buy&day=` (khớp `purpose` của ADR-007).
- (5) Dòng 113 có khóa `seller_registration_check` cho kiểm hạn bên bán; SCR-016 bước 4 (dòng 109) lại cứng "chỉ kiểm tạm dừng". Cùng một quy tắc phải đọc cùng khóa (C-11).
- (6) Dòng 64: `fn_rule('grades', 業務日)` nhưng dòng 39, 148 gọi `fn_rule('grades')` thiếu ngày. Ghi chữ ký đúng một kiểu.

#### SCR-016 — NHẬN CÓ SỬA
- (3)(5) Dòng 101: mặc định `trade_kind_matrix` "cho phép 仲卸, 売買参加者, 買出人; 卸売業者 không mua". 01 §1.1 dòng 51 nói mặc định "cho phép mọi nhóm có hiệu lực"; SCR-019 dòng 101 theo §1.1. Hai spec cùng gọi `fn_confirm_trade` mà mặc định khác nhau (C-02).
- (4) Dòng 111 R-10 (ngày đã khóa): không ghi `audit_logs.action='blocked_edit'`, trong khi BC-43 đòi "mọi lần cố sửa bị chặn **và ghi log**", SCR-012 / SCR-029 / SCR-024 §9.3 đều ghi. Tiêu chí 7 cũng không kiểm log.
- (5) Dòng 97: tư cách đánh giá theo `business_date` của lô — phụ thuộc ADR-009 đang bị trả lại (C-01). Nếu F-01 chọn một ngày cũ còn `open`, tư cách được xét theo ngày cũ chứ không theo lúc bấm chốt.
- (6) Dòng 97: "mốc đặt trong `rule_values`" — không nêu tên khóa. Đặt tên, ví dụ `qualification_valid_to_inclusive = true`.
- (5) Dòng 102: R-01 gộp "hết hạn / chưa tới ngày" vào một câu 「失効しています」 — với bản ghi chưa tới `valid_from` câu này sai. Tách R-01a 「許可の有効期間が始まっていません」.
- (5) Dòng 109: bước 4 cứng "chỉ kiểm tạm dừng" — đọc `seller_registration_check` như SCR-012.

#### SCR-019 — NHẬN CÓ SỬA
- (4) Dòng 44 F-07 mặc định "người đang đăng nhập", dòng 110 cho phép trùng người nhập. G-22 (03 dòng 323, mức **Cao**, BC-28/29) chính là "`confirmed_by` luôn là người gọi API". Mặc định bằng chính mình thì trên thực tế một Enter là xong, quay về đúng lỗi G-22. Sửa: F-07 mặc định **trống** (giữ lại giá trị đã chọn tay ở dòng trước, như dòng 67 đã định); `auction_confirmer_must_differ` giữ `false` (S).
- (5) Dòng 107, 139: cột `trades.result_at`, `trades.recorded_by` chưa có trong 03 §2 `trades`.
- (5) Dòng 52: V-02 trùng mã với SCR-016 nhưng khác câu. Dòng 101: R-00s — tên mã lẻ. Theo quy ước mã ở README.
- (6) Dòng 103 "mốc 02:00 từ `rule_values`" không tên khóa (dùng `business_day_start_time`, C-13).
- (6) Dòng 31 `GET /api/users?permission=` — không nêu quyền nào được gọi (API này lộ danh sách nhân viên). Đề xuất: yêu cầu `auction.record`.

#### SCR-022 — NHẬN CÓ SỬA
- (3) Dòng 121: "một yêu cầu đang xử lý / giao dịch" — căn cứ "—"; là hành vi prototype, RFP không có. Ghi S.
- (5) Dòng 38, 40, 131, 158: `corrections.impact_settlement/impact_delivery`, trạng thái `need_info`, bảng `correction_decisions(level)` — 03 §2 không có (03 §2 chỉ vẽ `corrections ||--o{ attachments`).
- (6) Dòng 114: khóa `correction_evidence_required_when` không có mặc định, không có cấu trúc giá trị.
- (6) Dòng 37, 112: "đã giao ròng" của giao dịch. Sau khi duyệt, dòng sống là `-A` nhưng `deliveries.trade_id` vẫn trỏ dòng gốc (`reversed`). SCR-029 dòng 18 cho mở giao hàng trên dòng `-A`. Không spec nào nói lũy kế giao hàng của dòng gốc chuyển sang `-A` thế nào → dev sẽ hỏi. Đề xuất: lũy kế tính theo "chuỗi" giao dịch (gốc + `-A`, qua `reverses_id`); ghi rõ ở SCR-029 §4 và SCR-022 §4.
- (5) Dòng 74: dẫn "SCR-018" (hủy) — chỉ có trong `scope.md`, chưa có spec; ghi rõ là màn hình chi tiết giao dịch `/trades/{id}`.
- (5) Dòng 102: câu lỗi MFA riêng — dùng M-06.

#### SCR-024 — NHẬN CÓ SỬA
- (5)(6) Dòng 115 CK-5 "Tranh chấp mở" và dòng 131 `保留` cho "giao dịch còn tranh chấp mở" — không có bảng hay cờ tranh chấp ở đâu (SCR-029 dòng 160 nói rõ "chưa có bảng `dispute`"; 03 §2 không có). Checklist không chạy được.
- (5) Dòng 94: MFA cho `settlement` "khi khóa / mở lại" (theo thao tác, bắt buộc); SCR-001 dòng 97 MFA theo đăng nhập, `settlement` là S và gỡ được khỏi `mfa_required_roles`. Hai cơ chế khác nhau (C-03).
- (5) Dòng 79, 152: `day_reopen_requests`, `fn_decide_day_reopen` chưa có ở 03 §2. Dòng 37 `opened_by` có, nhưng lý do mở ngày (F-02), ghi chú khóa (F-04), snapshot checklist lưu ở đâu chưa nói (audit hay cột).
- (6) Dòng 107: cấu trúc `lock_checklist` (map `CK-x → block|warn`?) chưa có ví dụ giá trị.
- (5) Dòng 7 vs ADR-009: người mở ngày `intake` + `settlement` khớp ADR; nhưng `days.open` cho `intake` (dòng 89) chưa có trong ADR-004.

#### SCR-029 — NHẬN CÓ SỬA
- (4) Quy tắc số 6 / BC-57: "xác nhận hoàn tất giao hàng **có tranh chấp** phải có người quyết". Spec đúng ở chỗ mọi ngoại lệ đều phải có người bấm 確認 (dòng 95, 134). Nhưng F-07 (dòng 53) "bắt buộc khi ngoại lệ có tranh chấp" dựa vào một trạng thái không tồn tại: không có field, cột hay bảng nào đánh dấu "có tranh chấp" (dòng 160 thừa nhận). Dev không cài được, tester không kiểm được. Sửa tối thiểu: thêm cờ `disputed` (bool) + `dispute_note` khi ghi ngoại lệ; khi `disputed = true` thì người xác nhận phải khác người ghi (BC-29 tinh thần người quyết độc lập) và F-07 bắt buộc; CK-5 của SCR-024 đếm theo cờ này.
- (5) Dòng 56: `business_date` của lần giao = `fn_business_date(now())`, trong khi SCR-022 dùng "ngày `open` mới nhất" và chính dòng 56 cho bản offline dùng `/api/business-days/current`. Lúc 02:00–02:30 chưa mở ngày, hai cách cho hai ngày khác nhau (C-01). Tiêu chí 10 (dòng 140) cũng dựa vào đồng hồ.
- (5) Dòng 108: `fn_delivery_qualification` trùng `fn_qualification_block_reason(..., 'deliver')` của ADR-007.
- (5) 03 §2 `deliveries` thiếu `confirmed_at`, `qualification_flag`, trạng thái ngoại lệ (mở / đã xác nhận).
- (6) Dòng 97: `delivery_exception_effects` không có cấu trúc giá trị; bảng 9.2 là mặc định nhưng không viết dạng JSON.
- (6) Dòng 34: "Đã giao ròng" khi giao dịch đã bị điều chỉnh (`-A`) — xem SCR-022 mục 6.

#### ADR không có điểm hỏng: ADR-001, ADR-002, ADR-005, ADR-010
- Đủ bối cảnh / quyết định / phương án bỏ / hệ quả; dẫn mã đúng. ADR-002 dòng 19 dẫn lỗi `anon` gọi được `fn_confirm_trade` — đã có trong `docs/ai-review-log.md`. ADR-005 dòng 7 nói "sau khóa, số liệu đã chuyển sang kế toán" hơi rộng (xuất là bước riêng sau khóa), không ảnh hưởng quyết định.

### 3. Mâu thuẫn giữa các spec

| # | Chủ đề | Spec A nói | Spec B nói | Đề xuất thống nhất |
|---|---|---|---|---|
| C-01 | Ngày nghiệp vụ hiện tại | ADR-009 dòng 21, SCR-022 dòng 132, SCR-024 dòng 16: ngày `open` mới nhất | ADR-009 dòng 22, SCR-029 dòng 56: `fn_business_date(now())` theo đồng hồ; SCR-016 dòng 97: theo `business_day` của lô | Một hàm `fn_current_business_date()` = ngày `open` mới nhất; mọi thao tác ghi mới dùng nó; đồng hồ chỉ cho cảnh báo. Viết lại ADR-009 rồi sửa SCR-016/029 |
| C-02 | Mặc định `trade_kind_matrix` | SCR-016 dòng 101: chặn 卸売業者 làm người mua 相対 | SCR-019 dòng 101 + 01 §1.1: cho phép mọi nhóm có tư cách | Ghi **một** mặc định trong ADR-008. Theo §1.1: cho phép mọi nhóm có tư cách; nếu muốn giữ hành vi prototype (卸売業者 không mua) thì ghi S với lý do và áp cho cả 相対 và せり |
| C-03 | MFA cho `settlement` | SCR-001 dòng 97: theo đăng nhập, qua `mfa_required_roles`, gỡ được (S) | SCR-024 dòng 94: bắt buộc khi khóa / mở lại (theo thao tác) | Một cơ chế: theo đăng nhập (AAL2) qua danh sách cấu hình; SCR-024 chỉ dẫn lại SCR-001, không thêm luật riêng |
| C-04 | Câu lỗi thiếu MFA | SCR-001 M-06 | SCR-022 dòng 102, SCR-024 dòng 94: hai câu khác | Dùng M-06 ở mọi nơi; `guard()` trả một mã |
| C-05 | Hàm kiểm tư cách lúc giao | ADR-007: `fn_qualification_block_reason(..., purpose='deliver')` | SCR-029 dòng 108: `fn_delivery_qualification(buyer, date)` | Dùng hàm của ADR-007, trả `block / allow_with_flag / allow` |
| C-06 | Chữ ký `fn_open_day` | ADR-009 dòng 18: `(p_day, p_actor)` | SCR-024 dòng 76: `(p_day, p_actor, p_reason)` | Theo SCR-024; sửa ADR-009 |
| C-07 | Đơn vị mặt hàng | ADR-008 dòng 23: khóa `allowed_units` | 03 §2, SCR-012 F-05: `items.unit` | Bỏ `allowed_units` khỏi ADR-008 |
| C-08 | Tham số lọc người tham gia | SCR-012 dòng 53: `?kind=wholesaler&tradable_on=` | SCR-016/019: `?purpose=buy&day=` | `?purpose=sell|buy&day=`, server áp `party_kind_basis` + `fn_qualification_state` |
| C-09 | Tranh chấp | SCR-024 CK-5, `保留`: dựa vào tranh chấp mở | SCR-029 dòng 160: "chưa có bảng `dispute`" | Cờ `deliveries.disputed` (tối thiểu) cho đến khi có SCR-026/027; CK-5 đếm theo cờ |
| C-10 | Lũy kế giao hàng sau điều chỉnh | SCR-022 dòng 37: lấy "đã giao ròng" từ SCR-029 | SCR-029 dòng 18: giao trên dòng `-A`, nhưng `deliveries.trade_id` vẫn là dòng gốc | Lũy kế theo chuỗi `reverses_id` (gốc + `-A`); ghi ở cả hai spec |
| C-11 | Kiểm hạn đăng ký bên bán | SCR-012 dòng 113: khóa `seller_registration_check` | SCR-016 dòng 109: cứng "chỉ kiểm tạm dừng" | SCR-016 bước 4 đọc cùng khóa |
| C-12 | Thứ tự kiểm khi chốt | 02 dòng 78: ngày mở trước, rồi tư cách, rồi tồn | 01 §9.1, SCR-016/019: ngày khóa ở bước 6 (sau cùng) | Đưa kiểm ngày (R-10/R-11) **lên đầu**: ngày đã khóa thì mọi lý do khác vô nghĩa, và phải ghi `blocked_edit` ngay. Sửa 01 §9.1 (ghi chú thứ tự), SCR-016/019 bảng §9; tiêu chí 8 SCR-016 không bị ảnh hưởng |
| C-13 | Mốc giờ đầu ngày | ADR-009 dòng 22, SCR-019 dòng 103: "đặt trong `rule_values`", không tên | — | Khóa `business_day_start_time` (mặc định `"02:00"`, S) |
| C-14 | Ghi `blocked_edit` | SCR-012, SCR-024 §9.3, SCR-029: có | SCR-016, SCR-019: R-10 không ghi | Thêm vào bảng §9 và tiêu chí 7 của SCR-016/019 |
| C-15 | Mã lỗi | SCR-016 V-02 「買受人を選択してください」 | SCR-019 V-02 「落札者を選択してください」 | Tiền tố màn hình cho V-xx; R-xx một bảng chung do `fn_confirm_trade` sinh |

Đã kiểm, **không mâu thuẫn**: người tạo yêu cầu điều chỉnh (02 §2.3, SCR-022, SCR-029 đều là `settlement`; mở cho `trade` là câu hỏi Q-022-1); người duyệt điều chỉnh và mở lại sổ (`approver`, maker ≠ checker ở D); `approval_levels` dùng chung cho điều chỉnh và mở lại (SCR-022, SCR-024 ghi rõ); `delivery_expired_policy` mặc định `allow_with_flag` (ADR-007 quyết định 6, ADR-008, SCR-029 khớp 01 §9.2); người mở ngày `intake` / `settlement` (ADR-009, SCR-024).

### 4. Danh mục hợp nhất (để LAB-5 tách task)

#### 4.1 Mã quyền mới

| Mã | Cấp cho (đích) | Spec dùng | Có ở ADR-004 / seed? |
|---|---|---|---|
| `qualifications.approve` | `approver` | SCR-010 | Không |
| `days.open` | `intake`, `settlement` | SCR-024 | Không |
| `recon.reopen.request` | `settlement` | SCR-024 | Không |
| `recon.reopen.approve` | `approver` | SCR-024 | Không |
| `participants.read` (cấp thêm) | `approver` | SCR-010 | Mã có sẵn, chưa cấp |
| *(chưa đặt)* soạn / duyệt phiên bản quy tắc | `rule_admin` / `approver` | SCR-001 tiêu chí 8, SCR-010 tiêu chí 7 | **Không có ở đâu** — đề xuất `rules.draft`, `rules.approve` |
| *(chưa đặt)* tải file đính kèm | — | SCR-010 A-07, SCR-022 F-08, SCR-029 F-06 | Không nêu quyền cho `POST /api/attachments` |

Vai trò mới: `rule_admin` (ADR-004, G-16).

#### 4.2 Hàm và endpoint mới hoặc đổi

| Tên | Loại | Spec | Có ở 03 / ADR? |
|---|---|---|---|
| `fn_current_business_date()` / `fn_business_date(ts)` | hàm | ADR-009, SCR-029 | ADR-009 (đang mâu thuẫn) |
| `fn_open_day(p_day, p_actor, p_reason)` | hàm | ADR-009, SCR-024 | ADR-009 (sai chữ ký); G-07 |
| `fn_rule(key, business_date)`, `fn_rule_set(business_date)` | hàm | ADR-008, mọi spec; `fn_rule_set` chỉ SCR-016 | `fn_rule` có; `fn_rule_set` không |
| `fn_qualification_block_reason`, `fn_qualification_state`, `fn_qualification_event` | hàm | ADR-007, SCR-010/016/019 | Chỉ hàm đầu ở ADR-007 |
| `fn_delivery_qualification` | hàm | SCR-029 | Không — bỏ, dùng `purpose='deliver'` |
| `fn_inspect_lot(p_lot, p_grade, p_note, p_reason, p_actor)` | hàm | SCR-012 | G-04 |
| `fn_request_correction` | hàm | SCR-022 | Không (ADR-006 chỉ nói chung) |
| `fn_decide_correction` (thêm cấp, `need_info`) | hàm đổi | SCR-022 | Có (as-built) |
| `fn_lock_day` (thêm checklist, comment, acknowledged) | hàm đổi | SCR-024 | Có (as-built); G-08 |
| `fn_decide_day_reopen` | hàm | SCR-024 | Không; G-09 nói chung |
| `fn_confirm_delivery_exception` | hàm | SCR-029 | Không |
| `fn_create_lot`, `fn_confirm_trade`, `fn_record_delivery` (thêm `client_ref`, audit, mã lỗi) | hàm đổi | SCR-012/016/019/029 | Có (as-built) |
| `fn_log_blocked_edit` | hàm (đề xuất) | — | Chốt ở ADR-006 |
| `GET /api/business-days/current` | API | ADR-009, SCR-010/012/016/019/024/029 | ADR-009 |
| `GET /api/business-days?status=open`, `POST /api/business-days` | API | SCR-016/019, SCR-024 | Không |
| `GET /api/business-days/{day}/lock-checklist`, `POST …/{day}/lock`, `POST …/{day}/reopen-requests` | API | SCR-024 | Không |
| `POST /api/day-reopen-requests/{id}/decision` | API | SCR-024 | Không |
| `POST /api/accounting-exports`, `GET /api/accounting-exports/{batch_code}` | API | SCR-024 | Không (G-21 nói chung) |
| `POST /api/auth/mfa/enroll`, `POST /api/auth/mfa/verify`, `POST /api/auth/logout` | API | SCR-001 | Không (G-19) |
| `GET /api/participants/{id}` (thêm `state`), `POST /api/participants/{id}/qualifications`, `POST /api/qualifications/{qid}/events`, `PATCH /api/participants/{id}` (thêm lý do) | API | SCR-010 | Không |
| `GET /api/participants?purpose=&day=` | API đổi | SCR-012/016/019 | Không (C-08) |
| `POST /api/lots/{id}/inspection`; `POST /api/lots` (thêm `item_code`, `client_ref`) | API | SCR-012 | Không |
| `GET /api/users?permission=&active=` | API | SCR-019 | Không; chưa nêu quyền |
| `POST /api/attachments` | API | SCR-022 (ngầm ở SCR-010/029) | Không; chưa nêu quyền, giới hạn |
| `PATCH /api/corrections/{id}` (gửi lại) | API | SCR-022 | Không |
| `POST /api/deliveries/{id}/confirm` | API | SCR-029 | Không |
| `POST /api/trades` (thêm `result_at`, `confirmed_by`, `client_ref`) | API đổi | SCR-016/019 | G-22 |

#### 4.3 Khóa `rule_values`

| Khóa | Mặc định | Spec dùng | Ở ADR-008? | Ghi chú |
|---|---|---|---|---|
| `expiry_warning_days` | 30 (S) | SCR-010 | Có | |
| `grades` | A/B/C (S) | SCR-012 | Có | |
| `allowed_units` | — | — | Có | **Lỗi thời**, bỏ (C-07) |
| `trade_kind_matrix` | **mâu thuẫn** | SCR-016, SCR-019 | Có, không mặc định | C-02 |
| `delivery_expired_policy` | `allow_with_flag` (S) | SCR-029 | Có | |
| `approval_levels` | 1 (A, Q11) | SCR-022, SCR-024 | Có | |
| bảng bậc tỷ lệ khuyến khích | — | — | Có, **không tên khóa** | Đặt tên, ví dụ `incentive_rate_tiers` |
| `seller_registration_check` | `suspension_only` (S) | SCR-012 (SCR-016 nên dùng) | Không | C-11 |
| `auction_confirmer_must_differ` | `false` (S) | SCR-019 | Không | |
| `correction_evidence_required_when` | **không có** | SCR-022 | Không | Đặt mặc định, ví dụ `["settlement","delivery"]` |
| `max_open_ahead_days` | 1 (S) | SCR-024 | Không | |
| `lock_checklist` | CK-1..3 block, CK-4..7 warn (S) | SCR-024 | Không | Ghi dạng JSON |
| `accounting_csv_encoding` | `UTF-8 BOM` | SCR-024 | Không | Nên là `system_settings` |
| `max_deliveries_per_trade` | `null` (S) | SCR-029 | Không | BC-59 |
| `delivery_exception_effects` | bảng SCR-029 §9.2 (S) | SCR-029 | Không | Ghi dạng JSON |
| `exception_confirm_by_other` | `false` (S) | SCR-029 | Không | Ép `true` khi `disputed` (xem SCR-029) |
| *(không tên)* tính hiệu lực gồm ngày `valid_to` | inclusive (S) | SCR-016 | Không | Đặt `qualification_valid_to_inclusive` |
| *(không tên)* giờ đầu ngày | 02:00 (S) | ADR-009, SCR-019 | Không | Đặt `business_day_start_time` |
| `mfa_required_roles` | 4 vai trò | SCR-001 | Không | Chuyển `system_settings` |
| `login_max_failures`, `login_failure_window_min`, `login_lock_min` | 5 / 15 / 15 (S) | SCR-001 | Không | Chuyển `system_settings` |
| `session_idle_timeout_min`, `session_absolute_hours` | 30 / 10 (S) | SCR-001 | Không | Chuyển `system_settings` |

#### 4.4 So với 03 §2 — thiếu trong ERD đích

| Thiếu | Spec cần | Mức |
|---|---|---|
| Bảng `correction_decisions(correction_id, level, decided_by, decision, note, at)` | SCR-022 | Cao (nhiều cấp duyệt, Q11) |
| `corrections.impact_settlement`, `impact_delivery`; `status` thêm `need_info` | SCR-022 | Cao (BC-45, G-10) |
| Bảng `day_reopen_requests(day, requested_by, reason, status, decided_by, note)` | SCR-024 | Cao (BC-48) |
| Bảng `doc_counters(day, kind, last_no)` | SCR-012/016/019/022 | TB (G-18 có nêu, ERD không vẽ) |
| Cờ / bảng tranh chấp (`deliveries.disputed` tối thiểu, hoặc `disputes`) | SCR-024 CK-5, SCR-029 F-07 | Cao (BC-57, quy tắc 6) |
| Bảng dòng xuất kế toán `accounting_export_lines`; bỏ `line_status` khỏi header | SCR-024 §9.4 | Cao (BC-71, T20) |
| `lots.item_code`, `lots.client_ref UK` | SCR-012 | TB |
| `trades.result_at`, `trades.recorded_by` | SCR-019 | Cao (G-22) |
| `deliveries.confirmed_at`, `qualification_flag`, trạng thái ngoại lệ | SCR-029 | TB |
| `qualification_events.payload` (hoặc `conditions_met_note`, `new_valid_to`); `participant_qualifications.updated_at` | SCR-010 | TB |
| `business_days.opened_at`, `open_reason`, `lock_comment`, `lock_checklist_snapshot` (hoặc ghi rõ "lưu ở audit") | SCR-024 | Thấp |
| Bảng `system_settings` (nếu nhận đề xuất ADR-008) | SCR-001, SCR-024 | TB |
| Sửa `items` PK / FK (tách thuế suất theo phiên bản) | SCR-012, SCR-016 | Cao (FK hiện không làm được) |
| Seed: vai trò `rule_admin`; 4 mã quyền mới + quyền quy tắc | SCR-001/010/024 | TB |

### 5. Danh sách sửa cụ thể (theo mức nghiêm trọng)

**Mức 1 — chặn tách task LAB-5**

1. **ADR-009** (dòng 12, 18–22): viết lại theo yêu cầu ở §2 (một định nghĩa ngày hiện tại; quan hệ lô ↔ giao dịch; `reopened`; khóa `business_day_start_time`; quy tắc "ngày trước chưa khóa" ghi giả định (S) + khóa cấu hình; chữ ký `fn_open_day(p_day, p_actor, p_reason)`).
2. **SCR-029** §5 F-07 (dòng 53), §9.1, §12 dòng 160: thêm `disputed` + `dispute_note` vào form ngoại lệ; `disputed = true` → F-07 bắt buộc và người xác nhận ≠ người ghi; thêm tiêu chí nghiệm thu cho nhánh này. **SCR-024** CK-5 (dòng 115) và §9.4 (dòng 131): đếm theo cờ này.
3. **SCR-019** F-07 (dòng 44): mặc định đổi thành "trống; sau dòng đầu giữ người đã chọn"; thêm tiêu chí "mở form lần đầu, F-07 trống, bấm 記録 → V-07".
4. **03 §2**: bổ sung toàn bộ mục ở §4.4; sửa `items` (dòng 221–227) và `accounting_exports` (dòng 264–271).
5. **ADR-008** dòng 21–27: thay bằng danh mục khóa §4.3 (tên, mặc định, mức S/A, spec dùng); bỏ `allowed_units`; đặt mặc định `trade_kind_matrix`; thêm quyết định tách `system_settings` khỏi `rule_values` cho khóa bảo mật / vận hành.
6. **SCR-016** dòng 101 và **SCR-019** dòng 101: dùng cùng mặc định `trade_kind_matrix` từ ADR-008 (C-02).

**Mức 2 — sửa trước khi giao dev**

7. **01 §9.1** + **SCR-016/019 §9** + **02 dòng 77–80**: chốt một thứ tự kiểm (đề xuất: ngày khóa / chưa mở lên đầu, C-12).
8. **SCR-016** §9 dòng 111 + tiêu chí 7 (dòng 132); **SCR-019** tiêu chí 7 (dòng 122): R-10 ghi `audit_logs.action='blocked_edit'`, tiêu chí kiểm có dòng log.
9. **SCR-029** dòng 56, 108, tiêu chí 10: dùng `fn_current_business_date()` theo ADR-009 mới; thay `fn_delivery_qualification` bằng `fn_qualification_block_reason(..., 'deliver')`.
10. **SCR-022** §4 dòng 37 + **SCR-029** §4 dòng 34: định nghĩa lũy kế giao hàng theo chuỗi `reverses_id` (C-10).
11. **ADR-006** dòng 14: chọn một cách ghi `blocked_edit` (đề xuất: mã lỗi `LOCKED_DAY` + `fn_log_blocked_edit` gọi từ API).
12. **ADR-004** dòng 18–21: thêm 4 mã quyền mới, quyền quy tắc (`rules.draft`, `rules.approve`), quyền tải đính kèm; ghi "`approver` = trưởng đối soát — giả định (S)".
13. **SCR-001** §9 dòng 93–102: chuyển 6 khóa sang `system_settings`; sửa tiêu chí 8 cho phù hợp. **SCR-022** dòng 102, **SCR-024** dòng 94: dùng M-06; SCR-024 bỏ luật MFA riêng theo thao tác, dẫn SCR-001 (C-03, C-04).
14. **SCR-022** dòng 114: đặt mặc định `correction_evidence_required_when = ["settlement","delivery"]`; dòng 121: ghi "giả định (S), hành vi prototype".
15. **SCR-012** dòng 53 + **SCR-016/019** §4: thống nhất `GET /api/participants?purpose=sell|buy&day=`. **SCR-016** dòng 109: đọc `seller_registration_check`.

**Mức 3 — sửa nhỏ**

16. **SCR-016** dòng 97: đặt tên khóa `qualification_valid_to_inclusive`; dòng 102: tách câu "chưa tới ngày hiệu lực" (R-01a).
17. **SCR-019** dòng 52, 101: mã lỗi theo quy ước README (V019-02, R-00 chung); dòng 31: `GET /api/users` yêu cầu `auction.record`; dòng 103: dùng `business_day_start_time`.
18. **SCR-010** dòng 56, 64: ghi "giả định (S)" cho số hiệu bắt buộc và ràng buộc không chồng khoảng; tiêu chí 4 dòng 181: chọn một mã HTTP.
19. **SCR-012** dòng 39, 148: `fn_rule('grades', 業務日)` thống nhất chữ ký.
20. **SCR-024** dòng 107: ví dụ JSON cho `lock_checklist`; ghi nơi lưu lý do mở ngày / ghi chú khóa / snapshot.
21. **SCR-022** dòng 74: thay "SCR-018" bằng "chi tiết giao dịch `/trades/{id}` (SCR-018, chưa có spec)".
22. **README** dòng 19–23: quy ước mã quyền mới, không gian mã lỗi, danh sách màn hình phụ thuộc chưa có spec (SCR-026/027, 034/035, 054). Cân nhắc thêm `scr-034-rule-versions.md`.
23. **ADR-003** dòng 19: đổi sang "RAISE kèm mã lỗi, API ánh xạ câu JP + VI".
24. **02**: thêm job định kỳ, lưu file, offline sync vào §1; nhập CSV tiền về (Q17) vào §3; dòng 41 "trả lỗi JP + VI có mã"; ghi "as-built" cho dòng 87 hoặc vẽ theo đích.
25. **01** BC-41: đổi Mức thành B, dẫn dòng RFP 「週6日、市場カレンダー上の休市日を除く」; BC-08: tách EX-TRADE-01 khỏi bước giao hàng.

**Câu hỏi còn mở cho chủ dự án**
- Có chấp nhận tách `system_settings` khỏi `rule_values` không (ảnh hưởng ADR-008, SCR-001, SCR-024)?
- Màn hình quy tắc / phiên bản (SCR-034/035) có vào phạm vi spec LAB-4 không, hay để LAB-5 tự đặc tả?

---

## Mục 2 — Xử lý sau review · 2026-10-16

- **Phạm vi sửa:** 01, 02, 03, ADR-003/004/005/006/007/008/009, `04-screen-specs/` (README, SCR-001/010/012/016/019/022/024/029, và SCR-034 mới do agent khác viết — chỉ sửa cho nhất quán). **Không** sửa `05-wireframes/`.
- **Nguồn quyết định:** quyết định của lead D1–D9 (2.1) thắng đề xuất của reviewer khi khác nhau; hai bản bổ sung của lead (SCR-034; phát hiện khi dựng wireframe) ghi ở 2.4.
- **Kiểm sau sửa (grep):** không spec nào còn `fn_delivery_qualification`, `allowed_units`, `max_open_ahead_days`, `R-00s`, câu MFA theo thao tác (`多要素認証が必要`), mã `R-xx` / `V-xx` cũ; khóa bảo mật không còn nằm trong `rule_values`; mã quyền trong spec ⊆ seed ∪ ADR-004; mã G-01…G-24, BC-01…BC-89, ADR-001…010 được dẫn đều tồn tại; ID RFP mới dẫn (FR-SETTLE-03, TBL-ACTOR-01, SCOPE-OUT-05, dòng 192) có trong bản parse. Không tìm thấy `FN-036` trong RFP nên không dẫn mã này — dẫn FR-SETTLE-03 và SCR-026/027 của `scope.md`.

### 2.1 Quyết định của lead

| # | Quyết định | Lý do | Áp vào |
|---|---|---|---|
| D1 | Ngày nghiệp vụ hiện tại = ngày `open` **duy nhất** (`fn_current_business_date()`); `reopened` không phải ngày hiện tại, chỉ nhận sửa đã duyệt; lô + giao dịch ghi ở ngày hiện tại, giao dịch lấy ngày của lô và lô phải thuộc ngày hiện tại (`allow_trade_on_previous_day_lots = false`, S); lần giao có ngày riêng = ngày hiện tại lúc ghi; bút toán `-R/-A` ở ngày hiện tại; đồng hồ (`business_day_start_time`) chỉ cho cảnh báo / gợi ý; mở ngày khi ngày trước chưa khóa: cảnh báo + lý do (S); thứ tự kiểm theo 01 §9.1; mọi lần bị chặn vì ngày khóa ghi `blocked_edit` | Một định nghĩa ngày, không phụ thuộc giờ bấm; tư cách lúc chốt luôn xét theo ngày hiện tại (BC-06) | ADR-009 (viết lại), 01, 02, 03, mọi spec |
| D2 | `rule_values` có **Danh mục khóa** đủ kiểu / mặc định / spec sở hữu; bỏ `allowed_units`; thêm `system_settings` cho bảo mật / vận hành (sys_admin sửa, audit, hiệu lực ngay, không tính 4 lần / năm) | GOV-RULE-01 chỉ áp cho quy tắc / tỷ lệ chợ; siết bảo mật phải có hiệu lực ngay | ADR-008, 03 §2, SCR-001, SCR-024, SCR-034 |
| D3 | Không có module tranh chấp trong bộ lõi; ngoại lệ giao hàng có `disputed` + `dispute_note` + `dispute_resolved_by/at`; CK-5 và `保留` dựa vào "ngoại lệ disputed chưa giải quyết"; tranh chấp đầy đủ để giai đoạn sau | Đủ để BC-57 có người quyết và checklist chạy được, không mở rộng phạm vi | SCR-029, SCR-024, 03 §2, 01 BC-51/57, README |
| D4 | 確認者 せり không có mặc định, chọn tay mỗi lần mở form | Chặn quay lại lỗi G-22 (BC-28/29) | SCR-019 |
| D5 | `trade_kind_matrix` mặc định: 仲卸, 売買参加者, 買出人 (nhóm bên mua theo TBL-ACTOR-01) được cả 相対 và せり; 卸売業者 là bên bán | Lấy từ bảng tác nhân, không phải quy tắc tự đặt | 01 §1.1, ADR-007, ADR-008, SCR-010, SCR-016, SCR-019, SCR-034 |
| D6 | Không có `fn_delivery_qualification`; dùng `fn_qualification_block_reason(party, date, 'deliver')` trả `block / allow_with_flag / allow` | DRY, một họ hàm tư cách | ADR-007, SCR-029 |
| D7 | MFA theo phiên (AAL2) cho `system_settings.mfa_required_roles` (mặc định sys_admin, rule_admin, approver, settlement); một bộ thông báo (M-06 của SCR-001) | Một cơ chế, không hỏi lại theo thao tác | SCR-001/022/024/034, ADR-004, 02, 03 G-19, README |
| D8 | Mã quyền mới: `qualifications.approve`, `days.open`, `recon.reopen.request`, `recon.reopen.approve`, `rules.read`, `rules.draft`, `rules.approve`, `attachments.upload`, `settings.manage`, kèm vai trò mặc định | Một danh mục duy nhất ở ADR-004 | ADR-004, 03, README, spec |
| D9 | 03 §2: `items(code PK)` + `item_tax_rates`; `accounting_export_lines` mang `line_status`; thêm mọi bảng / cột spec dùng | ERD đích phải triển khai được | 03 §2 |

Quyết định phát sinh khi áp D1 (giả định S, cần lead xác nhận):
- **Trạng thái `closing` (締め待ち)** cho ngày `open` cũ khi mở ngày mới mà ngày cũ chưa khóa — cần để giữ đồng thời "tối đa một ngày `open`" và "cho mở khi ngày trước chưa khóa". Ngày `closing` không nhận bản ghi mới, chỉ sửa và khóa.
- **Ngày tham chiếu** = `coalesce(fn_current_business_date(), max(business_days.day))` cho thao tác không gắn ngày (tư cách SCR-010, phiên bản quy tắc SCR-034, job hết hạn) — không dùng đồng hồ.
- **Bỏ khóa `max_open_ahead_days`** (SCR-024): đó là kiểm hợp lệ dựa trên đồng hồ, trái D1. Thay bằng: D chặn ngày ≤ ngày mới nhất; khác `suggested_day` chỉ cảnh báo.
- **Hệ quả cần hỏi khách (Q-009-1):** từ lúc khóa (~10:00) tới lúc mở ngày sau không có ngày hiện tại, nên duyệt cấp cuối yêu cầu điều chỉnh phải chờ.
- **Tranh chấp:** xác nhận ngoại lệ (BC-56) và giải quyết tranh chấp (BC-57) là hai bước; người giải quyết luôn khác người ghi (S); thêm hàm `fn_flag_delivery_dispute`, `fn_resolve_delivery_dispute`, cột `dispute_resolution_note`, `confirm_comment`.
- **Mở lại nhiều cấp duyệt** dùng `day_reopen_decisions` (cùng cấu trúc `correction_decisions`).
- Hàm mới khác cho danh mục §4.2: `fn_assert_current_day`, `fn_assert_day_editable` (thay `fn_assert_day_open`), `fn_setting`, `fn_rule_set`, `fn_validate_rule_value`, `fn_log_blocked_edit`.

### 2.2 Xử lý từng mục của danh sách sửa (Mục 1 §5)

| # | Mục | Kết quả |
|---|---|---|
| 1 | ADR-009 viết lại | **Đã sửa** — theo D1: một định nghĩa, bảng trạng thái ngày, ngày của từng loại bản ghi, đồng hồ chỉ cảnh báo, `business_day_start_time` ở `system_settings`, `fn_open_day(p_day, p_actor, p_reason)`, quy tắc ngày trước chưa khóa = S + khóa `previous_day_unlocked_policy`, xử lý `reopened` |
| 2 | SCR-029 cờ tranh chấp; SCR-024 CK-5, `保留` | **Đã sửa** — theo D3; thêm F-09/F-10, hành động đánh dấu / giải quyết, §9.5, tiêu chí 11–12 |
| 3 | SCR-019 F-07 mặc định trống | **Đã sửa** — theo D4; tiêu chí 12 mới |
| 4 | 03 §2 bổ sung | **Đã sửa** — theo D9; thêm `system_settings`, `item_tax_rates`, `day_reopen_requests/decisions`, `correction_decisions`, `doc_counters`, `accounting_export_lines`, cột tranh chấp, `closing`, `submitted`, index audit |
| 5 | ADR-008 danh mục khóa, bỏ `allowed_units`, mặc định `trade_kind_matrix`, tách `system_settings` | **Đã sửa** — theo D2, D5 |
| 6 | Cùng mặc định `trade_kind_matrix` | **Đã sửa** — theo D5 |
| 7 | Một thứ tự kiểm | **Đã sửa theo D1**: giữ thứ tự 01 §9.1 (ngày ở bước 6), sửa 02 §2.2 cho khớp. Đề xuất của reviewer đưa kiểm ngày lên đầu (C-12) → **bỏ qua** vì lead chốt ngược lại; mọi nhánh ngày khóa vẫn ghi `blocked_edit` |
| 8 | SCR-016/019 R-10 ghi `blocked_edit` + tiêu chí | **Đã sửa** — RJ-10, tiêu chí 7 kiểm dòng log |
| 9 | SCR-029 ngày theo ADR-009, bỏ `fn_delivery_qualification` | **Đã sửa** — `fn_current_business_date()`, D6; tiêu chí 10 viết lại không dựa đồng hồ |
| 10 | Lũy kế giao hàng theo chuỗi `reverses_id` | **Đã sửa** — SCR-022 §2/§4, SCR-029 §2/§4, tiêu chí mới ở cả hai |
| 11 | ADR-006 chọn một cách ghi `blocked_edit` | **Đã sửa** — mã `LOCKED_DAY` + RPC `fn_log_blocked_edit` gọi từ API, bỏ dblink |
| 12 | ADR-004 quyền mới, `approver` = trưởng đối soát (S) | **Đã sửa** — theo D8 |
| 13 | SCR-001 khóa sang `system_settings`; M-06 dùng chung; SCR-024 bỏ MFA theo thao tác | **Đã sửa** — theo D2, D7; tiêu chí 8 SCR-001 viết lại |
| 14 | `correction_evidence_required_when` mặc định; "1 yêu cầu / giao dịch" = S | **Đã sửa** |
| 15 | Tham số `purpose=sell` / `purpose=buy` + `day`; SCR-016 đọc `seller_registration_check` | **Đã sửa** — thêm RJ-08a cho chế độ `full` |
| 16 | Tên khóa `qualification_valid_to_inclusive`; tách câu chưa tới ngày | **Đã sửa** — RJ-01a dùng chung mọi căn cứ (nhãn căn cứ thay vào câu) |
| 17 | SCR-019 mã lỗi, quyền `GET /api/users`, `business_day_start_time` | **Đã sửa** — V019-xx, RJ-00 chung; API yêu cầu `auction.record` |
| 18 | SCR-010 S cho số hiệu, exclusion; tiêu chí 4 một mã HTTP | **Đã sửa** — tiêu chí 4 tách 403 AUTH-403 / 400 E-15 |
| 19 | `fn_rule('grades', 業務日)` | **Đã sửa** |
| 20 | Ví dụ JSON `lock_checklist`; nơi lưu lý do / ghi chú / snapshot | **Đã sửa** — cột ở `business_days` |
| 21 | SCR-022 dẫn SCR-018 | **Đã sửa** — "chi tiết giao dịch `/trades/{id}` (SCR-018, chưa có spec)" |
| 22 | README quy ước mã quyền, mã lỗi, màn hình chưa có spec | **Đã sửa** — thêm bảng thông báo dùng chung, mục "Màn hình liên quan chưa có spec (giai đoạn sau)", SCR-034 vào danh sách |
| 23 | ADR-003 RAISE kèm mã | **Đã sửa** — thêm hệ quả đổi toàn bộ RAISE |
| 24 | 02 thành phần, CSV tiền về, lỗi JP + VI, as-built | **Đã sửa** — job định kỳ, Storage, service worker / IndexedDB, INT-06; sequence vẽ theo đích, ghi rõ chỗ as-built khác |
| 25 | 01 BC-41 mức B; BC-08 tách EX-TRADE-01 | **Đã sửa** |

Các điểm khác trong Mục 1 §2:
- 01 BC-87 ánh xạ vai trò RFP → `roles`: **Đã sửa**. BC-01 tên bảng `participant_eligibility` → `participant_qualifications`: **Đã sửa** (cùng loại lệch, thêm).
- 03 CHECK phụ chưa ghi: **Đã sửa** (ghi chú §1). G-19 thêm `settlement`, G-16, G-21, G-23 (`system_settings`): **Đã sửa**.
- ADR-007 họ ba hàm: **Đã sửa**. ADR-003 danh sách hàm đích: **Đã sửa** (dẫn ADR-006…009 và §4.2).
- SCR-001 index đếm lần sai: **Đã sửa** (03 §2 + SCR-001 §9). Ghi chú SCR-002 gộp vào SCR-001: **Đã sửa** ở README; **bỏ qua** sửa `docs/scope.md` vì ngoài các file được giao.
- SCR-010 `conditions_met_note` / khóa lạc quan: **Đã sửa** (`qualification_events.payload`, `participant_qualifications.updated_at`).
- SCR-012 `doc_counters`, `client_ref`, `item_code` ở 03: **Đã sửa**.
- SCR-024 `days.open` trong ADR-004: **Đã sửa**.
- SCR-029 `delivery_exception_effects` dạng JSON; cột `confirmed_at`, `qualification_flag`: **Đã sửa**.
- Thiếu spec SCR-034/035: **Đã có** (`scr-034-market-rule-versions.md`, agent khác viết); đã đối chiếu và sửa cho khớp (2.4).

Mâu thuẫn C-01…C-15: C-01 (D1), C-02 (D5), C-03/C-04 (D7), C-05 (D6), C-06, C-07, C-08, C-09 (D3), C-10, C-11, C-13, C-14, C-15 **đã sửa**; C-12 **sửa theo D1** (thứ tự 01 §9.1), không theo đề xuất đưa ngày lên đầu.

### 2.3 Câu hỏi mở của Mục 1
- Tách `system_settings`: **đã chốt** (D2).
- SCR-034/035 trong phạm vi: **đã có spec**.

### 2.4 Bổ sung của lead trong lúc sửa

| Nguồn | Mục | Kết quả |
|---|---|---|
| Bổ sung 1 | Đưa SCR-034 vào lượt kiểm nhất quán | **Đã sửa** SCR-034: `items` + `item_tax_rates`, bỏ trạng thái "chưa MFA" theo thao tác, `fn_rule_set_at` → `fn_rule_set`, ngày tham chiếu thay "業務日 hiện tại", NET-01 / AUTH-403, C-02 đã đóng |
| Bổ sung 1 | `rules.read` (settlement, approver, sys_admin, rule_admin) | **Đã sửa** — ADR-004 |
| Bổ sung 1 | `rule_sets.status` thêm `submitted`; cột `change_reason`, `over_limit_reason` | **Đã sửa** — 03 §2, ADR-008 #1 |
| Bổ sung 1 | Danh mục khóa ADR-008 khớp SCR-034 | **Đã sửa** — mọi khóa SCR-034 sửa đều có trong danh mục; khóa còn lại sửa bằng trình JSON chung có kiểm schema |
| Bổ sung 1 | G-23 dùng `system_settings` | **Đã sửa** |
| Bổ sung 2.1 | SCR-010 trường lý do 再審査 | **Đã sửa** — C-05 再審査理由 |
| Bổ sung 2.2 | Một mã = một câu; SCR-019 mã riêng | **Đã sửa** — V016-xx / V019-xx; RJ-00 chung có tham số loại giao dịch; câu offline せり là V019-13 |
| Bổ sung 2.3 | Một bộ câu MFA và 403 | **Đã sửa** — M-06 (SCR-001), AUTH-403, NET-01 ở README; mọi spec dẫn lại |
| Bổ sung 2.4 | SCR-022 câu offline có tiếng Việt; bỏ radio F-11 | **Đã sửa** — NET-01; ba nút có hộp xác nhận, giữ F-12 |
| Bổ sung 2.5 | SCR-029 dùng 取引地点登録 | **Đã sửa** |
| Bổ sung 2.6 | R-00…R-13 → RJ-00…RJ-13 | **Đã sửa** — thêm RJ-01a, RJ-08a, RJ-14 |
| Bổ sung 2.7 | Tiêu chí tự đủ dữ liệu; ghi chú README | **Đã sửa** — Given nêu dữ liệu và ngày cụ thể ở SCR-010/012/016/019/022/024/029 |
| Bổ sung 2.8 | SCR-018 và hòa giải offline vào README | **Đã sửa** — cùng SCR-026/027, SCR-054, cài đặt hệ thống |

### 2.5 Cập nhật kết luận

| File | Mục 1 | Sau sửa |
|---|---|---|
| 01-business-constraints.md | NHẬN | NHẬN |
| 02-architecture.md | NHẬN CÓ SỬA | NHẬN |
| 03-database-diagram.md | NHẬN CÓ SỬA | NHẬN |
| ADR-003, ADR-004, ADR-006, ADR-007, ADR-008 | NHẬN CÓ SỬA | NHẬN |
| ADR-009 | TRẢ LẠI | **NHẬN CÓ SỬA** — đúng một định nghĩa; còn chờ lead xác nhận hai giả định phát sinh (`closing`, ngày tham chiếu) và Q-009-1 |
| ADR-001, 002, 005, 010 | NHẬN | NHẬN (ADR-005 chỉ đổi chữ "ngày đang mở" → "ngày hiện tại") |
| 04-screen-specs/README.md | NHẬN CÓ SỬA | NHẬN |
| SCR-001, 010, 012, 016, 019, 022, 024, 029 | NHẬN CÓ SỬA | NHẬN |
| SCR-034 (mới) | — | NHẬN (sau chỉnh nhất quán) |

Còn mở cho chủ dự án: Q-009-1 (duyệt điều chỉnh sau 10:00); Q-024-3 (có chặn mở ngày khi ngày trước chưa khóa không); Q-029-2 (ai giải quyết tranh chấp); xác nhận trạng thái `closing` và "ngày tham chiếu". `05-wireframes/` cần đối chiếu lại với các thay đổi: bỏ bộ chọn ngày ở SCR-016/019, F-07 せり trống, trường tranh chấp SCR-029, mã RJ / V0xx, câu dùng chung.

## Mục 3 — Xác nhận của lead · 2026-10-16

Mục 2 do chính agent sửa tự đánh giá "sau sửa"; lead không lấy đó làm kết luận mà tự kiểm ngẫu nhiên trước khi nhận.

| Kiểm | Cách kiểm | Kết quả |
|---|---|---|
| Mã từ chối cũ R-xx đã thay hết bằng RJ-xx | grep `R-0x / R-1x` (trừ mã người tham gia R-001…) trên 9 spec | Không còn |
| 許可 hết hạn và 承認 đang 再審査 cho hai câu khác nhau ở cả 相対 và せり | đọc RJ-01 / RJ-05 ở SCR-016, SCR-019 và tiêu chí nghiệm thu | Đạt |
| Không còn bộ chọn ngày ở màn hình nhập giao dịch (ADR-009) | grep SCR-016, SCR-019 | Đạt — chỉ hiện 業務日 hiện tại, chỉ đọc |
| 確認者 せり không có mặc định (BC-28, BC-29, G-22) | đọc SCR-019 F-07 | Đạt có ghi chú: trống khi mở form; các dòng sau trong cùng phiên nhập giữ người đã **chọn tay** ở dòng trước. Chấp nhận vì người xác nhận vẫn do người chủ động chọn; không bao giờ tự lấy người đang đăng nhập |
| Trạng thái `closing` và "tối đa một ngày open" có ở ERD đích | grep 03 §2 | Đạt |
| Mã quyền trong spec nằm trong seed ∪ danh mục ADR-004 | trích mọi `xxx.yyy` trong spec, loại tên cột | Đạt |
| Sơ đồ Mermaid vẽ được | parse 6 khối bằng mermaid 10.9.1 trong trình duyệt | 6/6 đạt |
| Liên kết nội bộ giữa tài liệu | script kiểm mọi link tương đối trong `docs/` | 0 link hỏng |

**Quyết định về hai giả định phát sinh (Mục 2):** nhận trạng thái `closing` và "ngày tham chiếu" — cả hai là hệ quả trực tiếp của quyết định D1, đã ghi "giả định (S)" và có câu hỏi mở cho khách (Q-009-1, Q-024-3).

**Kết luận cuối:** toàn bộ 01, 02, 03, ADR-001…010, README và 9 screen spec — **NHẬN**. Wireframe (05) kiểm riêng sau khi cập nhật theo spec đã sửa.

## Mục 4 — Tồn đọng nhỏ sau khi dựng wireframe bản cuối · 2026-10-16

Wireframe (05) đã cập nhật theo spec sau sửa: 9 màn hình, 95 biến thể, kiểm bằng Chrome headless (đủ anchor, chuyển biến thể không lẫn, không lỗi JS). Lead xem trực tiếp biến thể SCR-010 承認・一時停止: đúng nhánh 再審査, không có gỡ trực tiếp. **Wireframe: NHẬN.**

Các điểm dưới đây không chạm ràng buộc nghiệp vụ; chuyển thành task chỉnh spec ở LAB-5 thay vì mở thêm vòng sửa:

| # | Điểm | Đề xuất |
|---|---|---|
| 1 | SCR-034 còn radio F-21 + nút 承認 / 差戻し (SCR-022 đã bỏ kiểu này) | Bỏ F-21, giữ nút có hộp xác nhận như SCR-022 |
| 2 | RJ-11 dùng `{day}` nhưng khi không có ngày mở thì ngày hiện tại là null | Câu riêng cho trường hợp "chưa mở ngày" |
| 3 | SCR-019: §7 nói nút 記録 tắt khi F-07 trống, AC 12 lại bấm được và nhận V019-07 | Giữ nút tắt; V019-07 chỉ khi gửi bằng Enter / API |
| 4 | M-06 nói "đăng ký app xác thực" cho cả người đã đăng ký nhưng chưa xác minh phiên này | Tách hai câu: chưa đăng ký / chưa xác minh |
| 5 | SCR-022: gợi ý "ngày gốc còn mở" chỉ xét `open`, chưa xét `closing` / `reopened` | Bổ sung theo bảng trạng thái ADR-009 §2 |
| 6 | SCR-034 F-18 thuế suất: lưu 0–1 nhưng màn hình và câu lỗi nói 0–100% | Lưu 0–1, hiển thị %, câu lỗi theo % |
| 7 | SCR-029 đổi nghĩa F-07 (giờ là ghi chú giải quyết), F-11 là ghi chú xác nhận | Ghi chú trong §11 để test / dev không dùng ID cũ |
| 8 | Dữ liệu ví dụ trong AC khác nhau giữa các spec (M-002, W-001 / W-002) | Không sai (AC tự đủ), nhưng nên thống nhất một bộ dữ liệu test ở LAB-5 |
| 9 | Đường menu SCR-034 là 設定 › 規則・料率 | Giữ theo spec |
| 10 | Chưa có spec cho khung ứng dụng (menu, header) | Viết spec app shell ở LAB-5 |
