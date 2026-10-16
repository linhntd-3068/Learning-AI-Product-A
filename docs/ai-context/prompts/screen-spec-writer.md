# Prompt mẫu — viết screen spec cho một màn hình

Dùng khi cần thêm / viết lại spec một màn hình. Thay các chỗ `<…>`.

---

Viết screen spec cho màn hình `<SCR-xxx — tên>` của Product A.

File tạo: `docs/design/04-screen-specs/scr-<xxx>-<ten-khong-dau>.md`.

Theo **đúng** mẫu và quy ước ở `docs/design/04-screen-specs/README.md` (mục 1–12, tầng validation C / A / D, dẫn BC-xx và G-xx, thông báo lỗi JP + VI).

Đọc (chỉ những file này, không nạp cả RFP):
- `docs/ai-context/project-context.md`
- `docs/design/01-business-constraints.md` — các BC liên quan tới màn hình: `<liệt kê nếu biết>`
- `docs/design/03-database-diagram.md` (§2 đích, §4 gap)
- ADR liên quan: `<vd ADR-007, ADR-009>`
- Code hiện tại của màn hình: `<src/app/(app)/…>`, API `<src/app/api/…>`, hàm SQL liên quan.

Quy tắc:
- Không bịa quy tắc nghiệp vụ; cần thì ghi "giả định (S)" và đưa vào `rule_values` (ADR-008).
- Mọi field: kiểu, bắt buộc, mặc định, nguồn lựa chọn, validation theo tầng, câu lỗi.
- §8 dùng đúng mã vai trò: sys_admin, market_ops, intake, judge, trade, delivery, settlement, approver (+ rule_admin).
- §10 tối thiểu 6 tiêu chí Given / When / Then, gồm các nhánh đặc thù.
- 150–250 dòng. Không sửa file khác.

Kết thúc bằng: danh sách giả định đã dùng và các mã BC / G / ADR đã trích.
