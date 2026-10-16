# ADR-003: Quy tắc nghiệp vụ cốt lõi viết trong hàm plpgsql

- **Trạng thái:** Chấp nhận
- **Ngày:** 15/10/2026

## Bối cảnh
Các quy tắc sau phải đúng tuyệt đối, kể cả khi nhiều người thao tác cùng lúc giờ cao điểm (1.200 giao dịch/ngày, 60 người đồng thời — BC-80):
- không bán quá tồn lô (BC-33);
- không giao dịch với người hết tư cách (BC-06);
- không sửa ngày đã khóa (BC-43);
- người duyệt khác người soạn (BC-88);
- điều chỉnh sinh bút toán đảo (BC-44).

## Quyết định
- **Thao tác ghi quan trọng là hàm `fn_*` trong Postgres,** mỗi hàm chạy trong một giao dịch SQL:
  - `fn_create_lot`, `fn_confirm_trade`, `fn_cancel_trade`, `fn_record_delivery`, `fn_lock_day`, `fn_decide_correction`;
  - hai hàm hỗ trợ: `fn_assert_day_open`, `fn_participant_block_reason`.
  - thiết kế đích thêm / đổi hàm theo ADR-006 (`fn_log_blocked_edit`), ADR-007 (họ hàm tư cách), ADR-008 (`fn_rule`, `fn_rule_set`, `fn_setting`), ADR-009 (`fn_current_business_date`, `fn_assert_current_day`, `fn_assert_day_editable`, `fn_open_day`) và danh mục ở 06-design-review-log §4.2.
- **Xử lý tranh chấp đồng thời:** khóa dòng bằng `SELECT … FOR UPDATE`; sinh mã chứng từ dưới `pg_advisory_xact_lock`.
- **Báo lỗi nghiệp vụ:** hàm `RAISE` kèm **mã lỗi** (ví dụ `RJ-09`, `LOCKED_DAY`) trong `DETAIL` / `HINT` cùng tham số; API ánh xạ mã sang câu tiếng Nhật + tiếng Việt theo bảng mã của screen spec. Màn hình không tự dựng câu. (Prototype đang RAISE câu tiếng Việt — đổi ở thiết kế đích.)

## Phương án đã cân nhắc
| Phương án | Bỏ vì |
|---|---|
| Service layer TypeScript với nhiều câu SQL rời | supabase-js không gói nhiều câu trong một giao dịch; hai người chốt cùng một lô sẽ tranh nhau |
| Trigger thuần | Khó đọc luồng, khó trả thông báo đúng ngữ cảnh |

## Hệ quả
- (+) Kiểm thử bằng SQL thuần (PGlite: 17/17 kịch bản), không cần chạy app.
- (+) Gọi từ đâu (API, script, migration) cũng đi qua cùng quy tắc.
- (−) Vẫn còn quy tắc chỉ nằm ở API, và vài thao tác ghi thẳng bảng. Danh sách và hướng chuyển vào hàm ở [03-database-diagram.md](../03-database-diagram.md) §4.
- (−) Phải đổi toàn bộ `RAISE` của hàm as-built sang mã lỗi, và giữ bảng ánh xạ mã → câu JP + VI ở API.
- (−) Các hàm đang là SECURITY INVOKER và chưa cố định `search_path`. Làm thật phải thêm `set search_path = public`.
