# Screen spec — mẫu và quy ước

8 màn hình lõi của luồng một ngày nghiệp vụ, cộng màn hình quy tắc & phiên bản (SCR-034/035). Mỗi file theo đúng mẫu bên dưới, để đội dev triển khai mà không phải hỏi lại và LAB-5 tách task thẳng từ các mục §5 (field), §7 (hành động) và §10 (nghiệm thu).

| Mã | Màn hình | File | Wireframe |
|---|---|---|---|
| SCR-001 | Đăng nhập (+ MFA) | [scr-001-login.md](scr-001-login.md) | [wireframe](../05-wireframes/index.html#scr-001) |
| SCR-010 | Chi tiết người tham gia & tư cách (登録 / 許可 / 承認) | [scr-010-participant-qualifications.md](scr-010-participant-qualifications.md) | [wireframe](../05-wireframes/index.html#scr-010) |
| SCR-012/013 | Tiếp nhận lô & đánh giá | [scr-012-lot-intake-and-inspection.md](scr-012-lot-intake-and-inspection.md) | [wireframe](../05-wireframes/index.html#scr-012) |
| SCR-016 | Nhập giao dịch thỏa thuận (相対取引) | [scr-016-negotiated-trade-entry.md](scr-016-negotiated-trade-entry.md) | [wireframe](../05-wireframes/index.html#scr-016) |
| SCR-019 | Ghi kết quả đấu giá (せり) | [scr-019-auction-result-entry.md](scr-019-auction-result-entry.md) | [wireframe](../05-wireframes/index.html#scr-019) |
| SCR-029/030 | Ghi giao hàng & ngoại lệ (引渡し) | [scr-029-delivery-recording.md](scr-029-delivery-recording.md) | [wireframe](../05-wireframes/index.html#scr-029) |
| SCR-024/025 | Mở ngày, đối soát & khóa sổ (締め) | [scr-024-reconciliation-and-day-lock.md](scr-024-reconciliation-and-day-lock.md) | [wireframe](../05-wireframes/index.html#scr-024) |
| SCR-022/023 | Yêu cầu điều chỉnh & phê duyệt (確定後修正) | [scr-022-correction-request-and-approval.md](scr-022-correction-request-and-approval.md) | [wireframe](../05-wireframes/index.html#scr-022) |
| SCR-034/035 | Quy tắc vận hành chợ & phiên bản (規則・料率) | [scr-034-market-rule-versions.md](scr-034-market-rule-versions.md) | [wireframe](../05-wireframes/index.html#scr-034) |

SCR-002 (MFA) trong `docs/scope.md` được gộp vào SCR-001 (`/login/mfa`).

### Màn hình liên quan chưa có spec (giai đoạn sau)

| Mã | Màn hình | Spec nào dẫn tới | Tạm thời |
|---|---|---|---|
| SCR-018 | Chi tiết giao dịch `/trades/{id}`: hủy (取消) trước khóa sổ, rồi nhập lại | SCR-016, SCR-019, SCR-022 | Quyền `trades.cancel`, lý do bắt buộc, chặn ngày đã khóa (01 §9.3) |
| SCR-026/027 | Tranh chấp đầy đủ (loại, SLA, RPT-09; FR-SETTLE-03) | SCR-024, SCR-029 | 8 màn hình lõi chỉ dùng cờ `deliveries.disputed` trên ngoại lệ giao hàng |
| SCR-054 | Hòa giải bản ghi offline đồng bộ lỗi | SCR-012, SCR-024, SCR-029 | ADR-010; checklist CK-2 của SCR-024 |
| (chưa mã) | Cài đặt hệ thống `system_settings` | SCR-001, SCR-024 | ADR-008 #9; quyền `settings.manage` |
| SCR-034/035 | Quy tắc vận hành chợ & phiên bản (規則・料率のバージョン管理) | [scr-034-market-rule-versions.md](scr-034-market-rule-versions.md) | [wireframe](../05-wireframes/index.html#scr-034) |

## Quy ước

- **Nhãn màn hình**: tiếng Nhật là chính (người dùng ở chợ), kèm tiếng Việt cho đội dev, dạng `取引先 / Người mua`.
- **Mã quyền**: chỉ dùng mã có trong `supabase/seed.sql` hoặc mã mới đã đăng ký ở [ADR-004](../adr/ADR-004-data-driven-rbac-checked-in-api.md) (ghi `(mới)` khi dùng lần đầu trong spec). Không tự đặt mã khác. Vai trò dùng mã `roles` (vd `trade`); vai trò đích thêm `rule_admin`.
- **Cấu hình**: quy tắc / tỷ lệ của chợ đọc qua `fn_rule(key, business_date)` từ `rule_values` (có phiên bản); tham số bảo mật / vận hành đọc qua `fn_setting(key)` từ `system_settings` (hiệu lực ngay). Danh mục khóa duy nhất ở [ADR-008](../adr/ADR-008-versioned-market-rules-as-configuration.md); spec chỉ dẫn tên khóa.
- **Validation** ghi rõ tầng: **C** = client (chỉ tiện dùng), **A** = API, **D** = database / hàm `fn_*` (nơi quyết định). Quy tắc nghiệp vụ phải có tầng D.
- **Ngày nghiệp vụ** luôn là 業務日 JST theo [ADR-009](../adr/ADR-009-business-day-in-japan-time.md): bản ghi mới ghi vào ngày `open` duy nhất (`fn_current_business_date()`); đồng hồ chỉ cho cảnh báo / gợi ý.
- Mỗi quy tắc dẫn mã ràng buộc `BC-xx`; mỗi chỗ khác prototype dẫn mã `G-xx` ([03-database-diagram.md](../03-database-diagram.md) §4).
- Thông báo lỗi viết đúng câu sẽ hiện, tiếng Nhật + tiếng Việt. **Một mã = một câu** trong toàn bộ spec.
- **Không gian mã thông báo:**
  - `RJ-xx` — lý do từ chối nghiệp vụ do hàm `fn_confirm_trade` / `fn_qualification_block_reason` sinh; một bảng chung, chủ sở hữu là [SCR-016 §9](scr-016-negotiated-trade-entry.md#9-quy-tắc-nghiệp-vụ-và-điểm-phân-nhánh). (Không dùng tiền tố `R-` vì trùng mã người tham gia 買出人 `R-001`…)
  - `V016-xx`, `V019-xx`… — lỗi nhập của từng màn hình, có số màn hình trong mã. Màn hình khác chỉ dùng lại khi câu giống hệt.
  - `M-xx` (SCR-001), `E-xx` (SCR-010) — cục bộ của màn hình đó; dẫn từ nơi khác thì ghi kèm số màn hình ("M-06 của SCR-001").
  - **Thông báo dùng chung** (mọi màn hình dùng đúng câu này, không viết câu khác):

    | Mã | Khi | JP | VI |
    |---|---|---|---|
    | M-06 (SCR-001) | Vai trò thuộc `mfa_required_roles` mà phiên chưa AAL2 — `guard()` trả 401 | この役割では二要素認証が必須です。認証アプリを登録してください。 | Vai trò này bắt buộc xác thực hai lớp. Hãy đăng ký ứng dụng xác thực. |
    | AUTH-403 | Thiếu quyền (API 403, màn hình 403, nút bị chặn) | この操作を行う権限がありません。 | Bạn không có quyền thực hiện thao tác này. |
    | NET-01 | Thao tác cần mạng mà đang offline (không có hàng đợi) | この操作にはネットワーク接続が必要です。 | Thao tác này cần có mạng. |

  - MFA chỉ kiểm theo phiên đăng nhập (SCR-001); spec không thêm bước hỏi MFA theo thao tác.
- **Tiêu chí nghiệm thu tự đủ**: mỗi tiêu chí nêu dữ liệu cần có ngay trong **Given** (ví dụ "M-003 có 許可 `valid_to` = ngày nghiệp vụ hiện tại − 1"). Dữ liệu test chuẩn bị riêng cho từng tiêu chí; **không** dựa vào ngày hay trạng thái trong `supabase/seed.sql` (seed tính ngày theo `current_date`, đổi theo ngày chạy).

## Mẫu (copy cho mỗi màn hình)

```
# SCR-xxx — <Tên tiếng Việt> (<tên tiếng Nhật>)

## 1. Mục đích và người dùng
- Mục đích, ai dùng (vai trò), lúc nào trong ngày nghiệp vụ, tần suất / tải (BC-80 nếu liên quan).

## 2. Điều kiện vào màn hình
- Quyền cần, đường dẫn, tham số; điều hướng từ đâu / đi đâu.

## 3. Bố cục
- Danh sách vùng (header, bộ lọc, form, bảng, thanh hành động) theo thứ tự trên → dưới; trỏ tới wireframe.

## 4. Dữ liệu hiển thị
| Mục | Nguồn (bảng.cột / API) | Định dạng | Ghi chú |

## 5. Field nhập
| ID | Nhãn (JP / VI) | Kiểu | Bắt buộc | Mặc định | Nguồn lựa chọn | Validation (tầng) | Thông báo lỗi |

## 6. Trạng thái màn hình
| Trạng thái | Điều kiện | Hiển thị / hành vi |
(tối thiểu: đang tải, trống, lỗi tải, không có quyền, ngày đã khóa, mất mạng, đang gửi, thành công)

## 7. Hành động
| Nút / thao tác | Quyền | Bật khi | Gọi API | Kết quả thành công | Kết quả lỗi |

## 8. Phân quyền hiển thị
| Vai trò | Thấy màn hình | Thấy vùng / cột | Thao tác được |

## 9. Quy tắc nghiệp vụ và điểm phân nhánh
- Bảng quyết định cho các nhánh đặc thù (căn cứ 許可/承認, loại giao dịch, trạng thái ngày…), dẫn BC-xx.

## 10. Tiêu chí nghiệm thu
- Given / When / Then, mỗi tiêu chí kiểm được bằng một test.

## 11. Khác prototype LAB-2 và việc cần làm
| G-xx | Hiện tại | Cần đổi |

## 12. Câu hỏi mở
- Qxx chưa trả lời ảnh hưởng màn hình; giả định đang dùng.
```
