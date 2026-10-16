# ADR-002: Chỉ server được truy cập database; RLS bật, không policy

- **Trạng thái:** Chấp nhận
- **Ngày:** 15/10/2026

## Bối cảnh
Supabase cho trình duyệt gọi thẳng database bằng publishable key nếu có RLS policy. Hệ thống có nhiều vai trò, quyền đổi được trên màn hình, và quy tắc phức tạp (tư cách theo căn cứ, ngày đã khóa). Viết lại tất cả bằng RLS policy vừa khó đọc vừa khó kiểm thử.

## Quyết định
- Trình duyệt chỉ gọi `/api/*` của ứng dụng.
- Server dùng **secret key** (`src/lib/supabase/admin-client.ts`, có `import "server-only"`).
- Bật RLS trên mọi bảng và **không tạo policy nào**: có publishable key cũng không đọc / ghi được bảng.
- Hàm `fn_*`: thu hồi `EXECUTE` của `public`, `anon`, `authenticated`; chỉ cấp cho `service_role`.

## Phương án đã cân nhắc
| Phương án | Bỏ vì |
|---|---|
| RLS policy theo vai trò, client gọi thẳng | Logic quyền rải trong policy; khó diễn đạt "một trong các quyền"; khó audit |
| Để quyền mặc định của Supabase | Đã phát hiện ở LAB-2: `anon` gọi được `fn_confirm_trade` qua REST, bỏ qua phân quyền (lỗi AI #2 trong `docs/ai-review-log.md`) |

## Hệ quả
- (+) Một điểm kiểm soát duy nhất là tầng API. Lộ publishable key cũng vô hại.
- (−) Secret key là chìa khóa vạn năng:
  - chỉ để trong biến môi trường server, đánh dấu "sensitive" trên Vercel;
  - không bao giờ có tiền tố `NEXT_PUBLIC_`.
- (−) Không dùng được realtime hay truy vấn thẳng từ client; màn hình nào cũng cần API tương ứng.
