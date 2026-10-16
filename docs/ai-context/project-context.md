# Product A — context chuẩn cho AI (đọc trước khi làm bất cứ việc gì trong repo)

Một trang, chỉ chứa sự thật đã kiểm. Khi file này mâu thuẫn với tài liệu chi tiết, tài liệu chi tiết thắng và file này phải được sửa.

## Sản phẩm
- Hệ thống hỗ trợ nghiệp vụ cho **桜水産市場** (chợ bán buôn thủy sản, Nhật), RFP `product-a-rfp-ja-v1.0-rc7` (bản mô phỏng của khóa đào tạo Sun* AIDD).
- **Không phải hệ thống đấu giá.** 相対取引 (thỏa thuận) ~90% là luồng chính; せり (đấu giá) ~10% chỉ **ghi kết quả cuối do người nhập**. Làm thành hệ thống đấu giá = bị loại hồ sơ (12-06).
- Người dùng: nhân viên chợ (8 vai trò). Người tham gia bên ngoài không đăng nhập (Plan A, Q4).
- Giờ dịch vụ 02:00–10:00 JST, cao điểm 02:30–05:00; batch báo cáo ngày xong trước 11:00.

## Stack và cấu trúc
- Next.js 16 App Router (đọc `AGENTS.md`: API khác bản cũ, ví dụ `middleware` → `proxy.ts`), React 19, TypeScript, Tailwind v4.
- Supabase Postgres + Auth (Tokyo). Trình duyệt **không** gọi Supabase; API dùng secret key; RLS bật không policy.
- Quy tắc nghiệp vụ cốt lõi nằm trong hàm SQL `fn_*` (`supabase/migrations/0002_business_functions.sql`).
- Deploy: Vercel (hnd1), push `main` là tự deploy. URL: https://product-a-prototype-gilt.vercel.app

## 7 quy tắc không được làm sai
1. **許可 ≠ 承認.** Ba căn cứ tham gia: 市場登録 (卸売業者), 許可 (仲卸, có điều kiện), 承認 (売買参加者, tạm dừng phải 再審査); cộng đăng ký tại điểm giao dịch (買出人). Không gộp. (ADR-007, BC-01…05)
2. Kiểm tư cách **lúc chốt** giao dịch **và lại lúc giao hàng**, theo **ngày nghiệp vụ JST**, không theo ngày máy / UTC. (BC-06, BC-62, ADR-009)
3. Tồn lô không bao giờ âm; chốt giao dịch khóa dòng lô trong cùng giao dịch SQL. (BC-33)
4. Ngày đã khóa (締め) không sửa / hủy trực tiếp; chỉ điều chỉnh có duyệt bằng bút toán `-R` / `-A`. Người duyệt ≠ người soạn. (BC-43, BC-44, BC-88)
5. Quy tắc / tỷ lệ là **cấu hình có phiên bản** (maker–checker, ngày hiệu lực, rollback, ≤ 4 lần / năm), không hardcode. (ADR-008)
6. Bốn điểm bắt buộc có người quyết định cuối: đánh giá chất lượng lô, chốt kết quả せり, duyệt sửa nhạy cảm, xác nhận giao hàng có tranh chấp. Không auto-approve. (BC-29)
7. 完納奨励金 = khuyến khích **trả tiền đủ đúng hạn**, không phải "giao đủ hàng"; hệ số 110/100, cắt xuống yên **sau** khi nhân, không ân hạn. (BC-65…67)

## Đọc gì cho việc gì
| Việc | Đọc |
|---|---|
| Hiểu yêu cầu, quy tắc | `docs/design/01-business-constraints.md` (BC-xx, bảng quyết định §9, bẫy §10) |
| Kiến trúc, quyết định | `docs/design/02-architecture.md`, `docs/design/adr/` |
| Dữ liệu | `docs/design/03-database-diagram.md` (thực tế §1, đích §2, gap G-xx §4) |
| Một màn hình | `docs/design/04-screen-specs/scr-xxx-*.md` + `05-wireframes/` |
| Phạm vi prototype, mock | `docs/scope.md` |

**Không** nạp nguyên RFP tiếng Nhật (rất dài, làm nhiễu context) — tra theo mã ID khi cần: `grep -n "<ID>" ../product-a-rfp-ja-v1.0-rc7.pdf.parsed.md`.

## Quy ước
- Tài liệu: tiếng Việt, giữ thuật ngữ Nhật trong ngoặc. Nhãn màn hình: tiếng Nhật + tiếng Việt.
- Mỗi quy tắc dẫn mã nguồn (BC-xx / RFP ID / Qxx). Giả định ghi rõ "giả định (S)".
- 35 câu Q&A khách **chưa trả lời**: mọi Plan A là giả định, không phải xác nhận.
