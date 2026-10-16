# Product A — Prototype chợ thủy sản Sakura (LAB-2)

## Supabase project

https://supabase.com/dashboard/project/zefbjtcjhmmlfjgyfpgm

## Chạy local

1. Tạo file `.env.local` từ `.env.example`, điền 3 giá trị lấy ở Supabase → Project Settings → API Keys:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://zefbjtcjhmmlfjgyfpgm.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   SUPABASE_SECRET_KEY=sb_secret_...
   ```
2. Cài và chạy:
   ```bash
   npm install
   npm run dev
   ```
3. Mở http://localhost:3000 và đăng nhập bằng một tài khoản demo bên dưới.

## Tài khoản demo

Dùng được tới hết LAB-6. Bản deploy: https://product-a-prototype-gilt.vercel.app

Mật khẩu chung cho cả 8 tài khoản: **`Sakura-Demo-2026`**

| Vai trò | Email |
|---|---|
| Quản trị hệ thống | `demo.admin@example.com` |
| Vận hành chợ | `demo.ops@example.com` |
| Tiếp nhận lô | `demo.intake@example.com` |
| Đánh giá hàng | `demo.judge@example.com` |
| Giao dịch | `demo.trade@example.com` |
| Giao hàng | `demo.delivery@example.com` |
| Đối soát | `demo.settlement@example.com` |
| Phê duyệt | `demo.approver@example.com` |

## Lỗi kết nối database?

Project Supabase gói Free tự tạm dừng sau 7 ngày không có truy cập. Nếu app báo lỗi kết nối hoặc không đăng nhập được, vào link Supabase project ở trên và bấm **Resume project**, chờ 1–2 phút rồi thử lại.
