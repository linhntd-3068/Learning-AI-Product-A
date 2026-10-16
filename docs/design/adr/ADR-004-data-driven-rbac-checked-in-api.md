# ADR-004: Phân quyền theo bảng vai trò → mã quyền, kiểm ở API

- **Trạng thái:** Chấp nhận · bổ sung vai trò và mã quyền theo RFP ở thiết kế đích (cập nhật sau review 06 Mục 1)
- **Ngày:** 15/10/2026

## Bối cảnh
- RFP yêu cầu phân quyền theo vai trò, có lịch sử đổi quyền (BC-87, FR-IAM-01/02).
- Chợ cần tự chỉnh quyền mà không phải sửa code.
- Một số thao tác nhạy cảm phải được audit (BC-47).

## Quyết định
- **Lưu trữ:** bảng `roles`, `permissions`, `role_permissions`; mỗi người đúng một vai trò (`profiles.role`).
- **Kiểm ở API:** mỗi route bọc trong `guard(permission | permission[], handler)`.
  - Chưa đăng nhập → 401; thiếu quyền → 403 với thông báo chung `AUTH-403` (04-screen-specs/README).
  - Vai trò thuộc `system_settings.mfa_required_roles` mà phiên chưa AAL2 → 401 với M-06 của SCR-001. MFA chỉ kiểm theo phiên đăng nhập, không hỏi lại theo từng thao tác.
  - Quyền đọc lại từ DB mỗi request, nên đổi quyền có hiệu lực ngay.
- **Màn hình:** dùng cùng mã quyền (`useCan`, `RequirePermission`) để ẩn menu và nút. Đây chỉ là tiện dùng, không phải hàng rào bảo mật.
- **Luật cứng:** `sys_admin` luôn giữ `admin.*`; không ai tự khóa hay tự đổi vai trò của mình.
- **Thiết kế đích — đối chiếu vai trò với RFP (BC-87):**
  - thêm `rule_admin` (ROLE-RULE-ADMIN);
  - `approver` ứng với "trưởng bộ phận đối soát" (BC-21) — **giả định (S)**: BC-21 chỉ nói người chịu trách nhiệm cuối là trưởng đối soát;
  - `market_ops` là vai trò nội bộ của chợ (quản lý hồ sơ người tham gia), RFP không có tên riêng — giữ lại, giả định (S).
- **Thiết kế đích — mã quyền mới** (danh mục duy nhất; spec chỉ dùng mã có trong `supabase/seed.sql` hoặc bảng này):

  | Mã | Ý nghĩa | Cấp mặc định | Spec |
  |---|---|---|---|
  | `qualifications.approve` | Duyệt gỡ tạm dừng 市場登録 | `approver` | SCR-010 |
  | `days.open` | Mở ngày nghiệp vụ | `intake`, `settlement` | SCR-024 |
  | `recon.reopen.request` | Yêu cầu mở lại ngày đã khóa | `settlement` | SCR-024 |
  | `recon.reopen.approve` | Duyệt mở lại ngày | `approver` | SCR-024 |
  | `rules.read` | Xem phiên bản quy tắc | `settlement`, `approver`, `sys_admin`, `rule_admin` | SCR-034 |
  | `rules.draft` | Soạn / gửi / rollback phiên bản quy tắc | `rule_admin` | SCR-034, SCR-001 |
  | `rules.approve` | Duyệt phiên bản quy tắc | `approver` | SCR-034, SCR-010 |
  | `attachments.upload` | Tải file đính kèm (`POST /api/attachments`) | `market_ops`, `settlement`, `delivery` | SCR-010, SCR-022, SCR-029 |
  | `settings.manage` | Sửa `system_settings` (ADR-008) | `sys_admin` | SCR-001, SCR-024 |

  Cấp thêm mã có sẵn: `participants.read` cho `approver` (SCR-010).

## Phương án đã cân nhắc
| Phương án | Bỏ vì |
|---|---|
| Vai trò cố định trong code | Đổi quyền phải deploy |
| Đưa quyền vào JWT claims | Đổi quyền không có hiệu lực tới khi phiên hết hạn |
| Một người nhiều vai trò | Chưa có yêu cầu; làm màn hình quản trị phức tạp (YAGNI) |

## Hệ quả
- (+) Có màn hình ma trận quyền để chợ tự điều chỉnh, có audit.
- (−) Mỗi request thêm hai truy vấn đọc quyền; chấp nhận được ở quy mô này.
- (−) Một số API đọc chấp nhận "một trong" nhiều quyền, rộng hơn tên gọi. Ví dụ danh sách người tham gia mở cho cả `trades.create`, để màn hình nhập giao dịch chọn được người mua; `GET /api/users?permission=` (danh sách 確認者) yêu cầu `auction.record`. Screen spec ghi rõ từng trường hợp.
- (−) Seed phải thêm vai trò `rule_admin` và 9 mã quyền trên.
