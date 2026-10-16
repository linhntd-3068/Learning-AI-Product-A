# Bộ thiết kế Product A — LAB-4

Phát triển từ prototype LAB-2 (https://product-a-prototype-gilt.vercel.app, mã nguồn ở repo này, danh sách mock ở [`../scope.md`](../scope.md)) thành bộ thiết kế đủ để đội dev triển khai và để LAB-5 tách task.

## Nội dung và thứ tự đọc

| # | Tài liệu | Trả lời câu hỏi |
|---|---|---|
| 01 | [Ràng buộc nghiệp vụ](01-business-constraints.md) | Khách bắt buộc gì? Chỗ nào luồng phải rẽ nhánh? (BC-01…89, bảng quyết định §9, bẫy §10) |
| 02 | [Kiến trúc](02-architecture.md) | Thành phần, luồng dữ liệu chính, điểm tích hợp, bảo mật |
| 03 | [Sơ đồ cơ sở dữ liệu](03-database-diagram.md) | ERD thực tế LAB-2 (§1), ERD đích (§2), mô hình tư cách 登録 / 許可 / 承認 (§3), **chỗ prototype làm khác thiết kế G-01…** (§4) |
| ADR | [adr/](adr/) | Vì sao chọn vậy: 10 quyết định có bối cảnh, phương án đã bỏ, hệ quả |
| 04 | [Screen spec](04-screen-specs/README.md) | Field, validation (C / A / D), trạng thái, hành động, phân quyền hiển thị, tiêu chí nghiệm thu — 9 màn hình |
| 05 | [Wireframe](05-wireframes/index.html) | Bố cục chi tiết, các biến thể theo nhánh nghiệp vụ, chú thích dẫn về spec (mở trực tiếp bằng trình duyệt) |
| 06 | [Nhật ký review](06-design-review-log.md) | Review từng tài liệu do AI tạo: nhận / nhận có sửa / trả lại, và cách đã xử lý |
| 07 | [Ghi chú làm việc với AI](07-lab4-ai-working-notes.md) | Quy trình, quản lý context, tài sản AI dùng chung, cách review (câu neo P1-04, P1-06, P2-10) |

## ADR

| ADR | Quyết định | Trạng thái |
|---|---|---|
| [001](adr/ADR-001-nextjs-fullstack-on-vercel-and-supabase.md) | Next.js full-stack trên Vercel + Supabase (Tokyo) | Chấp nhận |
| [002](adr/ADR-002-server-only-database-access.md) | Chỉ server truy cập DB; RLS bật không policy | Chấp nhận |
| [003](adr/ADR-003-business-rules-in-database-functions.md) | Quy tắc cốt lõi trong hàm plpgsql | Chấp nhận |
| [004](adr/ADR-004-data-driven-rbac-checked-in-api.md) | Phân quyền vai trò → mã quyền, kiểm ở API | Chấp nhận |
| [005](adr/ADR-005-append-only-correction-entries.md) | Điều chỉnh sau khóa bằng bút toán đảo, không ghi đè | Chấp nhận |
| [006](adr/ADR-006-audit-log-in-same-transaction.md) | Audit log trong cùng giao dịch SQL, chỉ thêm | Đề xuất |
| [007](adr/ADR-007-eligibility-by-basis-kind.md) | **Tư cách tách theo căn cứ 登録 / 許可 / 承認** | Đề xuất |
| [008](adr/ADR-008-versioned-market-rules-as-configuration.md) | **Quy tắc chợ là cấu hình có phiên bản**; tách `system_settings` | Đề xuất |
| [009](adr/ADR-009-business-day-in-japan-time.md) | Ngày nghiệp vụ JST, một ngày `open`, mở ngày tường minh | Đề xuất |
| [010](adr/ADR-010-offline-queue-for-intake-and-delivery-only.md) | Offline chỉ cho tiếp nhận lô và giao hàng | Đề xuất |

## Ràng buộc đặc thù đã đưa vào thiết kế (không làm phẳng)

| Ràng buộc | Ở đâu trong thiết kế |
|---|---|
| 許可 (仲卸, có điều kiện) ≠ 承認 (売買参加者, tạm dừng phải 再審査) ≠ 登録; gộp là bị loại (RFP 12-06) | ADR-007, 03 §3, SCR-010 (3 biến thể), SCR-016 mã từ chối riêng từng căn cứ |
| Quy tắc vận hành chợ có phiên bản, maker–checker, ngày hiệu lực tương lai, rollback, ≤ 4 lần / năm | ADR-008, SCR-034 |
| 相対 là luồng chính; せり chỉ ghi kết quả cuối do người xác nhận | SCR-016, SCR-019 (không có UI bid), G-22 |
| Kiểm tư cách lúc chốt **và** lúc giao | SCR-016 §9, SCR-029 §9 (bảng 9.2) |
| Ngày đã khóa: chặn + ghi log; chỉ điều chỉnh có duyệt | ADR-005, ADR-006, SCR-022, SCR-024 |
| Ngày nghiệp vụ JST, không theo ngày máy | ADR-009 |
| Mất mạng: chỉ tiếp nhận lô và giao hàng chạy tiếp | ADR-010, SCR-012, SCR-029 |

## Đầu vào cho LAB-5

- Mỗi gap **G-xx** ở 03 §4 → ít nhất một task (ưu tiên mức Cao).
- Mỗi screen spec → task theo §5 (field), §7 (hành động), §10 (nghiệm thu), §11 (khác prototype).
- Mỗi ADR trạng thái "Đề xuất" → nhóm task hiện thực.
- Mẫu prompt tách task: [`../ai-context/prompts/task-breakdown-from-design.md`](../ai-context/prompts/task-breakdown-from-design.md).

## Giới hạn

- 35 câu Q&A của khách **chưa có trả lời**: mọi Plan A là giả định; mọi quy tắc tự đặt ghi "giả định (S)" và cấu hình được.
- Bộ thiết kế do AI soạn theo phân công và đã qua một vòng review có ghi vết (06). Cần SME phía khách xác nhận trước khi làm thật.
