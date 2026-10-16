# ADR-010: Chạy khi mất mạng chỉ cho tiếp nhận lô và ghi giao hàng; chốt giao dịch luôn cần mạng

- **Trạng thái:** Đề xuất cho thiết kế đích (theo Plan A của Q15). Prototype chưa có.
- **Ngày:** 16/10/2026

## Bối cảnh
- **Mạng chập chờn:** khu tiếp nhận và bến giao hàng mất mạng ngắn 3–5 lần mỗi tuần cao điểm (PP-NET-01, BC-76). Hiện họ ghi giấy rồi nhập lại, dễ trễ hoặc trùng.
- **RFP không đòi offline toàn phần** (BC-75), nhưng bên dự thầu phải nêu rõ: việc nào chạy tiếp được, dữ liệu xếp hàng chờ ra sao, hòa giải thế nào khi có mạng lại.
- **Chốt giao dịch cần dữ liệu mới nhất:** phải kiểm tư cách (BC-06) và tồn lô (BC-33) theo số liệu hiện tại; nếu nhiều máy cùng chốt offline thì có thể bán quá tồn.

## Quyết định
1. **Tiếp nhận lô và ghi giao hàng:** khi mất mạng thì lưu vào hàng đợi trên máy (IndexedDB), hiện nhãn "chưa đồng bộ".
   - Mỗi bản ghi có `client_ref` (UUID sinh ở máy) làm **khóa chống trùng**. API và hàm `fn_*` nhận `client_ref`; gửi lại lần hai thì trả về bản ghi đã có, không tạo bản mới.
2. **Lô tạo khi offline:** có mã tạm, đổi sang mã chính thức `L<YYMMDD>-NNN` lúc đồng bộ. Màn hình "Hòa giải" liệt kê các bản ghi đồng bộ lỗi, ví dụ ngày đã khóa hay giao vượt.
3. **Chốt giao dịch, khóa sổ, duyệt, đổi quy tắc:** khi mất mạng thì bị chặn, báo rõ lý do; giao dịch đang nhập dở được giữ nháp trên máy.
4. **Khi có mạng lại,** hàng đợi gửi theo thứ tự thời gian. Kết quả từng bản ghi được ghi `audit_logs` với `action = 'sync'`.

## Phương án đã cân nhắc
| Phương án | Bỏ vì |
|---|---|
| Offline toàn phần, cả chốt giao dịch (Plan B, Q15, +19 MD) | Bán quá tồn và chốt với người hết tư cách; phải hòa giải tồn lượng rất phức tạp. Chỉ làm nếu khách trả lời Q15 theo hướng nặng |
| Không làm gì (ghi giấy) | Không đáp ứng 09-04, và chính là vấn đề PP-NET-01 |

## Hệ quả
- (+) Hai khu hay mất mạng làm việc liên tục; không nhập trùng.
- (−) Thêm service worker, IndexedDB, màn hình hòa giải; test khó hơn (giả lập mất mạng).
- (−) Prototype chưa có. Chiếm một nhóm task riêng ở LAB-5.
