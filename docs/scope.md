# Phạm vi prototype — Product A (LAB-2)

Nguồn: Screen List, Feature List, User Stories của LAB-1 (thư mục cha). Mã màn hình `SCR-xxx` khớp Screen List.

## 1. Dựng thật (frontend + API + Supabase)

| Nhóm | Màn hình prototype | Mã LAB-1 | Ghi chú |
|---|---|---|---|
| Đăng nhập | Đăng nhập | SCR-001 | Supabase Auth (email + mật khẩu); chưa đăng nhập thì mọi trang và API bị chặn |
| Trang chủ | Trang chủ, cảnh báo | SCR-003 | Giấy phép sắp hết hạn, giao hàng chưa xong, yêu cầu chờ duyệt |
| Quản trị | Tài khoản, gán vai trò | SCR-004, 005 | Tạo tài khoản, đổi vai trò, khóa / mở |
| Quản trị | Vai trò & phân quyền (ma trận) | SCR-006 | Bật / tắt quyền theo vai trò, lưu vào database |
| Người tham gia | Danh sách, chi tiết, sắp hết hạn | SCR-009, 010, 011 | 4 loại; tách căn cứ đăng ký / giấy phép / chấp thuận; đổi trạng thái, thời hạn |
| Lô hàng | Tiếp nhận lô, danh sách, chi tiết + ghi kết quả đánh giá | SCR-012, 013, 014, 015 | Tự cấp mã lô, số lượng khả dụng không âm |
| Giao dịch | **Nhập giao dịch thỏa thuận** (luồng chính) | SCR-016 | Từ chối nếu người mua hết hiệu lực, lô không đủ hàng, ngày đã khóa |
| Giao dịch | Danh sách, chi tiết, hủy trước khi khóa | SCR-017, 018 | |
| Đấu giá | **Ghi kết quả đấu giá** + danh sách | SCR-019, 020 | Chỉ ghi kết quả cuối (người trúng, số lượng, đơn giá) |
| Giao hàng | Danh sách, ghi giao nhiều lần, ngoại lệ | SCR-028, 029, 030 | Lũy kế / còn lại; ngoại lệ thiếu, thừa, trả, hủy một phần |
| Đối soát | Đối soát ngày, khóa ngày | SCR-024, 025 | Ngày đã khóa không sửa thẳng được |
| Điều chỉnh | Tạo yêu cầu, danh sách, duyệt | SCR-021, 022, 023 | Người duyệt khác người soạn; duyệt thì sinh bản ghi đảo + bản ghi mới, không ghi đè |
| Kiểm toán | Tra cứu audit log | SCR-052 | Mọi thao tác ghi đều có trước / sau, người làm, thời điểm |
| Báo cáo | Xuất CSV giao dịch theo ngày | SCR-038, 051 (rút gọn) | Mẫu cho báo cáo và xuất kế toán |

Khoảng 25 màn hình trong 54 màn hình baseline của LAB-1, phủ trọn luồng một ngày nghiệp vụ: tiếp nhận lô → đánh giá → bán (thỏa thuận / đấu giá) → giao hàng → đối soát → khóa ngày → điều chỉnh sau khóa.

> RFP ghi khoảng 90% giao dịch là thỏa thuận trực tiếp, 10% là đấu giá. Prototype vẫn có màn hình ghi kết quả đấu giá như đề yêu cầu, nhưng luồng chính là thỏa thuận trực tiếp.

## 2. Để ngoài phạm vi so với LAB-1

| Phần | Mã LAB-1 | Lý do |
|---|---|---|
| Làm việc khi mất mạng và đồng bộ lại | SCR-054, FN offline | Cần service worker, hàng đợi cục bộ, hòa giải xung đột — quá nặng cho prototype |
| MFA, khóa tài khoản theo số lần nhập sai, SSO | SCR-002, Plan B | Cần cấu hình Supabase MFA / IdP; không ảnh hưởng luồng nghiệp vụ chính |
| Tiền khuyến khích, ghi nhận thanh toán | SCR-032, 033 | Công thức và bảng tỷ lệ chưa có (Q16, Q17) |
| Quy định và tỷ lệ theo phiên bản | SCR-034, 035 | Phụ thuộc phần tiền khuyến khích |
| Tranh chấp | SCR-026, 027 | Luồng phụ; đối soát chỉ liệt kê chênh lệch |
| Thông báo email, cấu hình thông báo | SCR-036, 037 | Tích hợp bên thứ ba; trang chủ hiện cảnh báo thay cho thông báo |
| 11 báo cáo cố định còn lại, PDF | SCR-039–050 | Dựng 1 báo cáo CSV làm mẫu |
| Master, lịch chợ, yêu cầu dữ liệu cá nhân | SCR-007, 008, 053 | Dữ liệu master đổ sẵn |
| Màn hình Plan B và Option | SCR-055–060 | Ngoài phạm vi chính |

## 3. Phần được mock và nếu làm thật thì cần gì

| Phần mock | Đang làm thế nào | Nếu làm thật |
|---|---|---|
| Dữ liệu | Dữ liệu mẫu tự dựng (`supabase/seed.sql`), tên công ty giả | Chuyển đổi dữ liệu thật theo 3 đợt, đối chiếu số bản ghi và số tiền |
| Tài khoản demo | Tạo bằng script với mật khẩu demo | Cấp tài khoản theo người thật, bật MFA cho quản trị và người duyệt |
| Xuất kế toán | Tải file CSV từ trình duyệt | Thống nhất định dạng với phòng tài chính, gửi qua SFTP / API (Q20) |
| Cảnh báo | Tính khi mở trang chủ | Batch định kỳ + email, thử lại tối đa 3 lần |
| Ngày nghiệp vụ | Bảng `business_days` có sẵn 2 ngày | Tự mở ngày lúc 02:00 JST theo lịch chợ |
| Mở lại ngày đã khóa | Chưa làm | Quy trình mở khóa có phê duyệt (Q12) |
