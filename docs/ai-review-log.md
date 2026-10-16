# Ghi chú làm việc với AI — LAB-2

Code prototype phần lớn do AI (Claude Code) sinh. Mỗi phần đều qua một bước kiểm tra tự động trước khi nhận:
typecheck, ESLint, build production, chạy SQL trên PGlite, thử lớp chặn đăng nhập bằng `next start`.

## Chỗ AI sinh sai hoặc chưa ổn, cách phát hiện và cách sửa

| # | AI sinh sai / thiếu | Phát hiện bằng | Đã sửa |
|---|---|---|---|
| 1 | Viết `middleware.ts` theo thói quen — Next 16 đã đổi tên thành `proxy.ts` | Đọc tài liệu đi kèm package (`node_modules/next/dist/docs`) theo cảnh báo trong `AGENTS.md` | Dùng `src/proxy.ts`, hàm `proxy()` |
| 2 | Hàm nghiệp vụ `fn_*` để mặc định — Supabase cho vai trò `anon` gọi được qua REST, tức là ai có key công khai cũng chốt giao dịch được mà không qua kiểm tra quyền | Rà bảo mật khi viết migration | Thu hồi quyền `execute` của `public / anon / authenticated`, chỉ `service_role` gọi được |
| 3 | Công thức "tổng ròng của ngày" ở màn hình đối soát cộng sai (lẫn bút toán đảo của ngày khác) | Tự soát lại theo nguyên tắc ghi sổ | Tổng ròng = mọi bút toán ghi trong ngày trừ dòng đã hủy |
| 4 | Kiểu trả về của truy vấn Supabase là `T \| null` → 14 lỗi TypeScript | `tsc --noEmit` | Hàm `check()` trả kiểu không null, mọi chỗ dùng `maybeSingle()` đều kiểm tra `if (!row)` |
| 5 | Fragment rỗng `<>` trong `map` không có `key` | Soát code trước khi lint | Đổi sang `<Fragment key>` |
| 6 | `setState` đồng bộ trong `useEffect` (hook gọi API, form người tham gia), `Date.now()` trong lúc render | ESLint (rule React Compiler mới của Next 16) | Viết lại `useApi` để trạng thái "đang tải" được suy ra; form tách component gắn `key`; ngày tham chiếu đặt bằng `useState(() => …)` |
| 7 | Giữ `cacheComponents: true` của template → build lỗi (cookie trong route handler, `usePathname` ngoài Suspense) | `npm run build` | Tắt `cacheComponents` vì mọi màn hình đều sau đăng nhập, không có gì để prerender — có ghi lý do trong `next.config.ts` |
| 8 | PowerShell ghi `package.json` kèm BOM | Kiểm tra byte đầu file | Ghi lại bằng Node, không BOM |
| 9 | Nạp biến môi trường lên Vercel bằng cách pipe từ PowerShell → giá trị dính ký tự xuống dòng, bản deploy đầu đăng nhập đều báo sai mật khẩu (401) | Chạy lại bộ test đầu cuối trên URL production; tải biến về so độ dài | Nạp lại giá trị không có ký tự thừa, deploy lại → 38/38 bước đạt |

## Bài học

- Với framework mới, đọc tài liệu đi kèm đúng phiên bản trước khi để AI viết code.
- Quy tắc nghiệp vụ quan trọng để trong database (hàm SQL, ràng buộc), có test riêng; API và giao diện chỉ là lớp ngoài.
- Không tin "chạy được" — mỗi thay đổi phải qua typecheck, lint, build và một kịch bản kiểm thử.
