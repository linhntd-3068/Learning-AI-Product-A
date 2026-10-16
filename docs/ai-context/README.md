# Tài sản AI dùng chung của team — Product A

Bộ này để mọi người (và mọi phiên AI) bắt đầu từ cùng một context đã kiểm, thay vì mỗi người tự dán tài liệu theo cách riêng.

| File | Dùng khi |
|---|---|
| [project-context.md](project-context.md) | Luôn đọc đầu tiên. Một trang sự thật đã kiểm + 7 quy tắc không được làm sai + đọc gì cho việc gì. `CLAUDE.md` ở gốc repo tự nạp file này. |
| [prompts/screen-spec-writer.md](prompts/screen-spec-writer.md) | Viết / viết lại spec một màn hình |
| [prompts/design-review-checklist.md](prompts/design-review-checklist.md) | Review sản phẩm AI tạo ra và quyết định nhận / trả lại |
| [prompts/task-breakdown-from-design.md](prompts/task-breakdown-from-design.md) | Tách task từ bộ thiết kế (LAB-5) |

## Quản lý context
- **Nạp hẹp**: mỗi việc chỉ nạp các file trong bảng "Đọc gì cho việc gì". Không dán nguyên RFP tiếng Nhật; tra theo mã ID.
- **Agent con nhận brief riêng**: giao việc cho agent con bằng danh sách file cụ thể + tiêu chí xong, không chuyển cả lịch sử hội thoại.
- **Làm mới phiên khi**: AI bắt đầu trích sai mã, lặp lại giả định đã bỏ, hoặc trộn số liệu của LAB khác (vd effort AI tự đặt thay vì estimate LAB-1). Khi đó mở phiên mới, nạp lại `project-context.md` + đúng file của việc đang làm.
- **Sửa context khi sự thật đổi**: khách trả lời một câu Q&A, hay quyết định ADR đổi trạng thái → sửa `project-context.md` cùng commit.

## Ai sửa
Người sửa tài liệu thiết kế chịu trách nhiệm cập nhật `project-context.md` nếu thay đổi chạm vào 7 quy tắc hoặc bảng "Đọc gì".
