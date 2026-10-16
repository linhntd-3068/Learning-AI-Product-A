# Prompt mẫu — tách task từ bộ thiết kế (dùng cho LAB-5)

---

Tách bộ thiết kế Product A thành task triển khai.

Đầu vào (chỉ những file này):
- `docs/ai-context/project-context.md`
- `docs/design/03-database-diagram.md` §4 (gap G-01…G-20) — mỗi gap ít nhất một task
- `docs/design/04-screen-specs/*.md` — mỗi màn hình: task theo §5 (field), §7 (hành động), §10 (nghiệm thu), §11 (khác prototype)
- `docs/design/adr/ADR-006…010` (các quyết định "Đề xuất" cần hiện thực)

Mỗi task ghi:
| Cột | Nội dung |
|---|---|
| ID | T-<nhóm>-<số> |
| Tiêu đề | động từ + đối tượng |
| Nguồn | SCR-xxx §y / G-xx / ADR-xxx / BC-xx |
| Tầng | DB (migration, hàm) / API / UI / Test / Infra |
| Phụ thuộc | ID task phải xong trước |
| Định nghĩa xong | tiêu chí nghiệm thu lấy từ §10, kiểm được |
| Ước lượng | giờ, ≤ 16 h / task; lớn hơn thì tách |

Thứ tự ưu tiên: gap mức **Cao** (G-01 tư cách theo căn cứ, G-02 ngày JST, G-03/G-04 ngày đã khóa, G-05 quy tắc có phiên bản, G-06 audit, G-19 MFA) trước, rồi mới tới màn hình mới.

Không tạo task cho phần đã ghi "ngoài phạm vi" trong `docs/scope.md` trừ khi gap yêu cầu.
