# ADR-006: Audit log ghi cùng giao dịch SQL với thay đổi

- **Trạng thái:** Đề xuất cho thiết kế đích. Prototype đang ghi ở tầng API.
- **Ngày:** 16/10/2026

## Bối cảnh
- Audit mức nghiệp vụ phải có: người làm, thời điểm, trước / sau, lý do (BC-81).
- KPI-03 đòi ≥ 98% dòng giao dịch có đủ thông tin này.
- Prototype ghi `audit_logs` bằng `writeAuditLog()` **sau khi** thao tác đã thành công. Nếu bước ghi audit lỗi, thao tác vẫn được giữ.
- Mọi lần cố sửa ngày đã khóa phải bị chặn **và ghi log** (BC-43). Prototype chỉ chặn, không ghi.

## Quyết định
- **Ghi audit trong hàm:** mỗi hàm `fn_*` tự ghi `audit_logs` trong cùng giao dịch SQL; nhận thêm tham số `p_reason`.
- **Ghi cả lần bị chặn:** khi chặn thao tác trên ngày đã khóa, hàm raise lỗi kèm mã `LOCKED_DAY` (cùng `entity`, `entity_id`, ngày bị chặn). API bắt đúng mã này và gọi RPC riêng `fn_log_blocked_edit(p_actor, p_entity, p_entity_id, p_day, p_payload)` — một giao dịch SQL mới, nên dòng `action = 'blocked_edit'` không bị rollback cùng thao tác. **Không** dùng `dblink` / autonomous transaction (không cần bật extension, không cần kết nối thứ hai). Áp cho mọi spec (SCR-012, 016, 019, 022, 024, 029).
- **Bảng chỉ thêm, không sửa:** `audit_logs` chặn UPDATE / DELETE bằng trigger, kể cả với `service_role`.

## Phương án đã cân nhắc
| Phương án | Bỏ vì |
|---|---|
| Giữ ghi ở API (như prototype) | Thao tác thành công mà audit thất bại → thủng KPI-03 |
| `dblink` / autonomous call để ghi `blocked_edit` trong hàm | Phải bật extension, mở kết nối thứ hai từ DB; khó vận hành trên Supabase |
| Trigger chung trên mọi bảng | Trigger không biết lý do nghiệp vụ, và chỉ thấy `service_role` chứ không thấy người dùng thật |

## Hệ quả
- (+) Không thể có thay đổi mà thiếu vết.
- (−) Phải đổi chữ ký các hàm `fn_*`.
- (−) Lỗi giữa lúc hàm raise và lúc API gọi `fn_log_blocked_edit` (mất kết nối) có thể làm thiếu một dòng `blocked_edit`; chấp nhận vì thao tác vẫn bị chặn đúng.
- (−) Phải chuyển vào hàm các thao tác đang ghi thẳng bảng: đánh giá lô, sửa người tham gia, tạo yêu cầu điều chỉnh.
