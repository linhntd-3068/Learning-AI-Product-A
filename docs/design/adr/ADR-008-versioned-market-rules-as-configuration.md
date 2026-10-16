# ADR-008: Quy tắc vận hành chợ là cấu hình có phiên bản (maker–checker, ngày hiệu lực, rollback); tham số bảo mật / vận hành tách riêng

- **Trạng thái:** Đề xuất cho thiết kế đích. Prototype chưa có. Cập nhật sau review 06 Mục 1 (danh mục khóa, tách `system_settings`).
- **Ngày:** 16/10/2026

## Bối cảnh
- **Có phiên bản, không sửa lịch sử:** quy tắc và tỷ lệ của chợ có số phiên bản và ngày hiệu lực; phiên bản mới không được làm sai lịch sử đã chốt (BC-14).
- **Tối đa 4 lần đổi mỗi năm** (GOV-RULE-01, BC-15).
- **Maker–checker:** người soạn khác người duyệt (BC-16).
- **Ngày hiệu lực được đặt ở tương lai; rollback bắt buộc** (BC-17, BC-18).
- **Đổi bằng cấu hình, không cần deploy** (NFR-OPS-02, BC-19). Demo bằng một phiên bản mới là tiêu chí nghiệm thu.
- **Prototype đang hardcode:** ngưỡng cảnh báo 30 ngày, danh sách đơn vị, hạng A/B/C, ma trận ai được bán / mua.
- **Phạm vi chợ:** RFP chỉ có **một chợ** (桜水産市場). Thứ duy nhất được phép khác theo mặt hàng là thuế suất (BC-22, Q29).
- **Tham số bảo mật / vận hành** (ngưỡng khóa đăng nhập, timeout phiên, vai trò cần MFA, mã hóa CSV, mốc giờ đầu ngày) không phải "quy tắc / tỷ lệ của chợ" theo GOV-RULE-01. Nếu để chung `rule_values`, mỗi lần siết bảo mật khi có sự cố phải tốn một trong 4 lần đổi / năm và chờ ngày hiệu lực tương lai (BC-17) — bế tắc vận hành (review 06 Mục 1, ADR-008).

## Quyết định
1. **Bảng `rule_sets`** (bất biến sau khi duyệt):
   - `version_no`, `effective_from`;
   - `status` ∈ `draft`, `submitted`, `approved`, `superseded` (`draft → submitted → approved`; trả lại thì `submitted → draft`);
   - `maker_id`, `checker_id` (ràng buộc `maker_id <> checker_id`), `approved_at`;
   - `change_reason` (bắt buộc), `over_limit_reason` (bắt buộc khi là lần thứ ≥ 5 trong năm);
   - `rollback_of` (trỏ tới phiên bản cũ khi phát hành rollback).
2. **Bảng `rule_values(rule_set_id, key, value jsonb)`** chỉ chứa các khóa trong **Danh mục khóa** dưới đây. D kiểm từng giá trị bằng `fn_validate_rule_value(key, value)`; khóa ngoài danh mục bị từ chối.
3. **Danh mục mặt hàng và thuế suất:** `items(code PK, name, unit)` là danh mục **không** gắn phiên bản (đơn vị cố định theo mặt hàng, BC-37); thuế suất theo phiên bản nằm ở `item_tax_rates(item_code, rule_set_id, tax_rate)` (BC-22, Q29). Lô FK `items.code`. Khóa `allowed_units` cũ bị bỏ: đơn vị lấy từ `items.unit`.
4. **Chọn phiên bản áp dụng:** `fn_rule_set(business_date)` trả `rule_set_id` của bản `approved` có `effective_from` lớn nhất ≤ ngày (trùng ngày thì `version_no` lớn nhất); `fn_rule(key, business_date)` đọc giá trị của bản đó. Bản `draft` / `submitted` không bao giờ được chọn.
5. **Lưu vết phiên bản đã dùng:** mọi bản ghi có tính toán lưu `rule_set_id` đã áp dụng (giao dịch, khuyến khích, quyết toán).
6. **Rollback là phát hành phiên bản mới** có nội dung của phiên bản cũ. Không UPDATE / DELETE phiên bản đã duyệt (trigger chặn).
7. **Giới hạn 4 lần / năm:** đếm số phiên bản `approved` có `effective_from` trong cùng năm lịch JST; từ lần thứ 5 cảnh báo và bắt buộc `over_limit_reason`. Không chặn cứng, vì RFP chỉ nêu "tối đa" mà không nói phải chặn.
8. **Không làm đa chợ:** không thêm `market_id`. Nếu sau này có chợ thứ hai, thêm `market_id` vào `rule_sets` là đủ.
9. **Tách `system_settings(key, value jsonb, updated_by, updated_at)`** cho tham số bảo mật / vận hành:
   - chỉ `sys_admin` sửa (quyền `settings.manage`, ADR-004); mỗi lần sửa ghi `audit_logs` (before / after, lý do bắt buộc) trong cùng giao dịch (ADR-006);
   - **có hiệu lực ngay**, không có ngày hiệu lực, không phiên bản, **không tính** vào giới hạn 4 lần / năm;
   - đọc bằng `fn_setting(key)`; D kiểm giá trị theo khóa như `rule_values`;
   - ràng buộc cứng: `mfa_required_roles` luôn chứa `sys_admin`, `rule_admin`, `approver` (bắt buộc theo BC-85); chỉ `settlement` gỡ được.

### Danh mục khóa `rule_values` (quy tắc / tỷ lệ của chợ — theo GOV-RULE-01)

Nơi duy nhất liệt kê khóa. Spec chỉ dẫn tên khóa, không định nghĩa lại. Sửa ở SCR-034/035.

| Khóa | Kiểu | Mặc định | Mức | Spec sở hữu / dùng |
|---|---|---|---|---|
| `expiry_warning_days` | int 1–365 | `30` | S (BC-07: "cấu hình được", không cho số) | SCR-010 / SCR-034 |
| `grades` | string[] | `["A","B","C"]` | S | SCR-012 / SCR-034 |
| `trade_kind_matrix` | object `{negotiated: kind[], auction: kind[]}` | `{"negotiated":["middleman","participant_buyer","point_buyer"],"auction":["middleman","participant_buyer","point_buyer"]}` — ba nhóm bên mua theo TBL-ACTOR-01; 卸売業者 là bên bán, không nằm trong ma trận | Theo TBL-ACTOR-01 (nhóm mua); phân 相対 / せり là S (§1.1) | SCR-016, SCR-019 / SCR-034 |
| `seller_registration_check` | enum `suspension_only` \| `full` | `suspension_only` | S (Q33, BC-10) | SCR-012, SCR-016, SCR-019 |
| `qualification_valid_to_inclusive` | bool | `true` (hiệu lực gồm cả ngày `valid_to`) | S (BC-09, Q31) | SCR-016, SCR-019, SCR-029 |
| `allow_trade_on_previous_day_lots` | bool | `false` | S (ADR-009) | SCR-016, SCR-019 |
| `auction_confirmer_must_differ` | bool | `false` | S | SCR-019 |
| `delivery_expired_policy` | enum `allow_with_flag` \| `block` | `allow_with_flag` | S (Q31, 01 §9.2) | SCR-029 / SCR-034 |
| `delivery_exception_effects` | object theo loại ngoại lệ (ví dụ ở SCR-029 §9.2) | bảng SCR-029 §9.2 | S | SCR-029 |
| `exception_confirm_by_other` | bool | `false` | S | SCR-029 |
| `max_deliveries_per_trade` | int \| null | `null` (không giới hạn) | S (Q14, BC-59) | SCR-029 |
| `approval_levels` | int 1–3 | `1` | A (Q11) | SCR-022, SCR-024 / SCR-034 |
| `correction_evidence_required_when` | string[] ⊆ `settlement`, `delivery` | `["settlement","delivery"]` | B (BC-45) | SCR-022 |
| `previous_day_unlocked_policy` | enum `warn_with_reason` \| `block` | `warn_with_reason` | S (ADR-009) | SCR-024 |
| `lock_checklist` | object `CK-x → block \| warn` | `{"CK-1":"block","CK-2":"block","CK-3":"block","CK-4":"warn","CK-5":"warn","CK-6":"warn","CK-7":"warn"}` | S | SCR-024 / SCR-034 |
| `incentive_rate_tiers` | array `[{min_ratio, rate}]` | dữ liệu giả `[{"min_ratio":0,"rate":0}]` | A (Q16) | SCR-034 (khuyến khích: ngoài 8 màn hình lõi) |
| (bảng) `item_tax_rates` | theo mặt hàng | sao chép từ bản trước | A (Q29) | SCR-012, SCR-024 / SCR-034 |

### Danh mục khóa `system_settings` (bảo mật / vận hành — hiệu lực ngay)

| Khóa | Kiểu | Mặc định | Mức | Spec sở hữu |
|---|---|---|---|---|
| `mfa_required_roles` | string[] | `["sys_admin","rule_admin","approver","settlement"]` | B cho ba vai trò đầu (BC-85); `settlement` S | SCR-001 |
| `login_max_failures` | int | `5` | S (BC-86) | SCR-001 |
| `login_failure_window_min` | int | `15` | S | SCR-001 |
| `login_lock_min` | int | `15` | S | SCR-001 |
| `session_idle_timeout_min` | int | `30` | S (BC-86) | SCR-001 |
| `session_absolute_hours` | int | `10` | S | SCR-001 |
| `accounting_csv_encoding` | enum `UTF-8-BOM` \| `Shift_JIS` | `UTF-8-BOM` | A (Q20) | SCR-024 |
| `business_day_start_time` | `HH:mm` | `"02:00"` | S (BC-40) | ADR-009, SCR-019 |

## Phương án đã cân nhắc
| Phương án | Bỏ vì |
|---|---|
| Bảng cấu hình key–value sửa tại chỗ cho quy tắc | Mất lịch sử, không có maker–checker, không đặt được ngày hiệu lực tương lai (bẫy T14) |
| Hằng số trong code (như prototype) | Mỗi lần đổi phải deploy — vi phạm NFR-OPS-02 |
| Bảng riêng cho từng loại quy tắc | Mỗi loại quy tắc mới lại thêm bảng và màn hình; `rule_values` + kiểm theo `key` gọn hơn |
| Để tham số bảo mật trong `rule_values` | Tốn lượt đổi của GOV-RULE-01 và phải chờ ngày hiệu lực khi cần siết ngay |
| `items(code, rule_set_id)` làm PK | `lots.item_code` không FK được vì `code` không duy nhất |

## Hệ quả
- (+) Đổi quy tắc không cần deploy. Báo cáo tháng gom được theo phiên bản (BC-74). Màn hình RPT-12 có sẵn dữ liệu.
- (+) Siết bảo mật (timeout, khóa đăng nhập) có hiệu lực ngay, không đụng giới hạn 4 lần / năm.
- (−) Thêm màn hình "Quy tắc & phiên bản" (SCR-034/035), màn hình cài đặt hệ thống, vai trò `rule_admin`.
- (−) Hàm nghiệp vụ phải đọc quy tắc qua `fn_rule` / `fn_setting`, không đọc hằng số.
