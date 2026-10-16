# ADR-005: Điều chỉnh sau khóa bằng bút toán đảo + bút toán mới, không ghi đè

- **Trạng thái:** Chấp nhận
- **Ngày:** 15/10/2026

## Bối cảnh
- Sau khóa sổ (締め), số liệu đã chuyển sang kế toán (BC-71).
- RFP cấm sửa trực tiếp ngày đã khóa (BR-CLOSE-01, BC-43).
- Chỉ cho điều chỉnh bằng bút toán đảo / chênh lệch đã được duyệt (BC-44).
- Người yêu cầu phải khác người duyệt (BC-88).

## Quyết định
- **Ngày đã khóa:** không sửa, không hủy trực tiếp (`fn_assert_day_open`; đích: `fn_assert_day_editable`, ADR-009).
- **Điều chỉnh đi qua bảng `corrections`:** trạng thái pending → approved / rejected.
- **Khi duyệt:**
  - dòng gốc chuyển sang `reversed`;
  - thêm dòng `<mã>-R` (`entry_type = reversal`, số lượng âm, giá cũ);
  - thêm dòng `<mã>-A` (`entry_type = adjusted`, giá trị mới);
  - cả hai dòng ghi vào ngày nghiệp vụ hiện tại (ngày `open` duy nhất, ADR-009), `reverses_id` trỏ về dòng gốc.
- **Người duyệt khác người soạn:** kiểm trong `fn_decide_correction`.

## Phương án đã cân nhắc
| Phương án | Bỏ vì |
|---|---|
| Sửa thẳng dòng gốc, lưu lịch sử | Số đã gửi kế toán của ngày cũ bị đổi âm thầm — vi phạm BC-43/44 |
| Mở khóa ngày cũ, sửa, khóa lại | Phải xuất lại CSV ngày cũ. Vẫn cần như một luồng riêng có phê duyệt (BC-48, Q12) nhưng không phải cách chính |

## Hệ quả
- (+) Tổng của ngày đã khóa không bao giờ thay đổi; chênh lệch hiện ở ngày ghi điều chỉnh.
- (−) Báo cáo phải hiểu `entry_type`. Tổng ròng một ngày = mọi bút toán ghi trong ngày, trừ dòng đã hủy.
- (−) Còn thiếu ở thiết kế đích (task LAB-5):
  - đính kèm bằng chứng bắt buộc khi điều chỉnh ảnh hưởng quyết toán / giao hàng (BC-45);
  - kết quả "yêu cầu thêm thông tin";
  - luồng mở lại sổ có duyệt (BC-48).
