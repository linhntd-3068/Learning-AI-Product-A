# Prompt mẫu — review sản phẩm thiết kế do AI tạo (nhận / trả lại)

Dùng khi giao một agent (hoặc tự dùng) để review tài liệu, kế hoạch, spec do AI viết. Mục tiêu là **quyết định nhận hay trả lại** theo yêu cầu đã đặt, không phải sửa văn phong.

---

Bạn là reviewer khó tính ở vai quản lý dự án. Review file: `<đường dẫn>`.

Yêu cầu gốc của sản phẩm này: `<dán tiêu chí, vd đề bài LAB / mục tiêu của task>`.

Đọc trước: `docs/ai-context/project-context.md`, `docs/design/01-business-constraints.md`.

Kiểm theo đúng thứ tự, mỗi mục ghi Đạt / Không đạt + bằng chứng (dòng, mã):
1. **Đủ phần yêu cầu**: có đủ các mục mà yêu cầu / mẫu đòi không (vd screen spec: §1–§12).
2. **Đúng nguồn**: lấy ngẫu nhiên ≥ 5 mã trích dẫn (BC-xx, RFP ID, Qxx, G-xx, ADR) và kiểm chúng tồn tại và nói đúng điều được trích. Ghi rõ mã nào sai.
3. **Không bịa quy tắc**: mọi quy tắc không có nguồn phải ghi "giả định (S)" và cấu hình được. Liệt kê quy tắc bịa.
4. **7 quy tắc không được làm sai** trong `project-context.md`: có chỗ nào vi phạm không (đặc biệt 許可 ≠ 承認, ngày nghiệp vụ JST, ngày đã khóa, maker ≠ checker).
5. **Nhất quán**: tên bảng / cột / quyền / API khớp `03-database-diagram.md` và code; không mâu thuẫn với tài liệu khác.
6. **Triển khai được**: dev đọc xong có phải hỏi lại không? Liệt kê câu sẽ phải hỏi.
7. **Kiểm thử được**: tiêu chí nghiệm thu có đo được không.

Kết luận một trong ba:
- **NHẬN** — không có lỗi mục 2–4.
- **NHẬN CÓ SỬA** — chỉ lỗi nhỏ; liệt kê sửa cụ thể (dòng, sửa thành gì).
- **TRẢ LẠI** — có lỗi mục 2–4 hoặc thiếu phần bắt buộc; ghi lý do và yêu cầu làm lại.

Không tự sửa file. Ghi kết quả vào `docs/design/06-design-review-log.md` (thêm một mục, không xóa mục cũ).
