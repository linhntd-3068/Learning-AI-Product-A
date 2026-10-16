# ADR-001: Next.js full-stack trên Vercel + Supabase (Postgres, Auth)

- **Trạng thái:** Chấp nhận (prototype LAB-2) · xem lại trước giai đoạn production
- **Ngày:** 15/10/2026

## Bối cảnh
- LAB-2 bắt buộc stack Next.js + Vercel + Supabase.
- Cần prototype chạy thật: có đăng nhập, đọc / ghi dữ liệu thật, triển khai trong vài ngày, một người phát triển.
- Người dùng ở Nhật, giờ dịch vụ 02:00–10:00 JST (BC-78). Dữ liệu cá nhân chịu APPI (BC-84).

## Quyết định
- **Một ứng dụng Next.js 16 (App Router).** Màn hình và Route Handlers `/api/*` nằm chung, làm luôn backend; không tách service riêng.
- **Supabase Postgres + Supabase Auth,** project đặt ở Tokyo (`ap-northeast-1`).
- **Vercel function region `hnd1` (Tokyo),** khai trong `vercel.json`, để server đứng cạnh database.

## Phương án đã cân nhắc
| Phương án | Bỏ vì |
|---|---|
| Backend riêng (NestJS / FastAPI) + SPA | Hai codebase, hai lần deploy. Quy mô 180 tài khoản, 60 người đồng thời (BC-80) không cần |
| Gọi Supabase thẳng từ trình duyệt + RLS policy | Đẩy quy tắc phân quyền vào policy SQL, khó kiểm thử (xem ADR-002) |
| Region Sydney (mặc định lúc tạo project đầu tiên) | Xa người dùng, dữ liệu ra khỏi Nhật. Đã xóa và tạo lại project ở Tokyo |

## Hệ quả
- (+) Một repo, một lần deploy; Vercel tự deploy khi push `main`.
- (+) Màn hình và API cùng TypeScript, dùng chung kiểu dữ liệu.
- (−) Supabase gói Free tự tạm dừng sau 7 ngày không truy cập. README có hướng dẫn bấm Resume.
- (−) Hạ tầng production còn là **quyết định mở**. Đề xuất LAB-1 ước tính trên AWS Multi-AZ (~170.000 JPY/tháng). Chọn giữ Vercel + Supabase gói trả phí hay chuyển AWS cần so ba điểm:
  - khả dụng 99,5% trong giờ dịch vụ;
  - RTO 4 giờ, RPO 15 phút (BC-79);
  - chi phí.
