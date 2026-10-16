# SCR-024/025 — Mở ngày, đối soát & khóa sổ (業務日開始・日次照合・締め)

Wireframe: [05-wireframes#scr-024](../05-wireframes/index.html#scr-024). As-built: `src/app/(app)/reconciliation/page.tsx`, `src/app/api/reconciliation/route.ts`, `src/app/api/business-days/**`, `src/app/api/reports/trades/route.ts` (CSV mẫu), `fn_lock_day`, `fn_assert_day_open`. ADR: ADR-004, ADR-005, ADR-006, ADR-008, ADR-009, ADR-010.

## 1. Mục đích và người dùng

- **Mở 業務日** (02:00–02:30 JST) theo lịch chợ (BC-40, BC-41, ADR-009). Người mở: `intake` hoặc `settlement`. Ngày vừa mở là **ngày nghiệp vụ hiện tại** — ngày `open` duy nhất.
- **Đối soát ngày (照合)**: tổng 相対 / せり, bút toán điều chỉnh ghi trong ngày, tình trạng giao hàng, danh sách cần xử lý (BC-49). Người dùng: `settlement` (đối soát tạm 05:00–08:00, chốt 08:00–10:00).
- **Khóa sổ (締め)** theo 業務日 JST (BC-43, BC-50); sau khóa chỉ sửa qua SCR-022.
- **Mở lại sổ (締め解除)** có người duyệt (BC-48, Q12) — thao tác nhạy cảm.
- **Xuất CSV kế toán** IF-ACC-01, chỉ sau khi khóa (BC-71, BC-72, T20).
- Tải: 1 ngày ~1.200 giao dịch cao điểm (BC-80); màn hình đối soát p95 ≤ 2 giây.

## 2. Điều kiện vào màn hình

- Đường dẫn: `/reconciliation?day=YYYY-MM-DD`; mặc định = ngày nghiệp vụ hiện tại (`/api/business-days/current`); khi chưa có ngày `open` thì ngày nghiệp vụ gần nhất, và thẻ "Mở ngày" hiện `suggested_day`.
- Quyền xem: `recon.read`. Mở ngày: `days.open` (mới). Khóa: `recon.lock`. Yêu cầu mở lại: `recon.reopen.request` (mới). Duyệt mở lại: `recon.reopen.approve` (mới). Xuất: `reports.export`. Mã mới đăng ký ở ADR-004.
- Vào được khi có `recon.read` **hoặc** `days.open`; người chỉ có `days.open` (vd `intake`) chỉ thấy thẻ "Mở ngày".
- Đi tới: chi tiết giao dịch `/trades/{id}`, giao hàng SCR-029, điều chỉnh SCR-022, hòa giải offline (SCR-054, chưa có spec), quy tắc SCR-034 (`lock_checklist`, `approval_levels`).

## 3. Bố cục

1. Header: `日次照合・締め / Đối soát & khóa sổ`, bộ chọn 業務日 để **xem** (kèm nhãn ngày nghỉ từ `market_calendar`), trạng thái ngày.
2. Thẻ "業務日開始 / Mở ngày": ngày gợi ý (`suggested_day`, theo đồng hồ — chỉ gợi ý), nút mở (chỉ khi chưa có ngày đó).
3. 4 ô số: 相対, せり, 調整仕訳 (bút toán điều chỉnh ghi trong ngày), 純額 (tổng ròng).
4. Thẻ giao hàng: 完了 / 引渡し中 / 待機 / 例外.
5. **Checklist trước khóa** (BC-49): từng mục, số lượng, mức (chặn / cảnh báo), link xử lý.
6. Thẻ khóa / mở lại / xuất kế toán theo trạng thái ngày.
7. Bảng "要対応 / Cần xử lý".
8. Lịch sử ngày: mở, khóa, yêu cầu mở lại, duyệt, xuất (từ `business_days`, `day_reopen_requests`, `audit_logs`, `accounting_exports`).

## 4. Dữ liệu hiển thị

| Mục | Nguồn | Định dạng | Ghi chú |
|---|---|---|---|
| Trạng thái ngày | `business_days.status` | `営業中 open` / `締め待ち closing` / `締め解除中 reopened` / `締め済 locked` | Đích thêm `closing`, `reopened` (ADR-009 §2) |
| Người mở / lý do / lúc | `opened_by`, `open_reason`, `opened_at` | tên, text, `HH:mm` JST | `open_reason` chỉ có khi mở lúc ngày trước chưa khóa |
| Người khóa / ghi chú / lúc | `locked_by`, `lock_comment`, `locked_at` | tên, text, `HH:mm` JST | |
| 相対 / せり | `GET /api/reconciliation` `negotiated`, `auction` (chỉ `entry_type = original`, trừ `cancelled`) | số GD · SL · ¥ | |
| Điều chỉnh trong ngày | `adjustments` (dòng -R/-A ghi vào ngày này) | số dòng · ¥ | ADR-005 |
| Tổng ròng | `netAmount` = mọi bút toán của ngày trừ `cancelled` | ¥, không thuế | `trades.amount` chưa thuế |
| Giao hàng | `delivery.{done,partial,waiting,exception}` | đếm | Theo SCR-029 §9.1 |
| Checklist | `GET /api/business-days/{day}/lock-checklist` | danh sách | Mới |
| Snapshot checklist lúc khóa | `business_days.lock_checklist_snapshot` | bảng | Lưu khi khóa, cũng có trong audit |
| Đã xuất | `business_days.exported`, `accounting_exports.batch_code` | `ACC-261016-01` | |

## 5. Field nhập

| ID | Nhãn (JP / VI) | Kiểu | Bắt buộc | Mặc định | Nguồn lựa chọn | Validation (tầng) | Thông báo lỗi |
|---|---|---|---|---|---|---|---|
| F-01 | 開始する業務日 / Ngày cần mở | date | Có | `suggested_day` (ngày không nghỉ kế tiếp; gợi ý theo đồng hồ, ADR-009 §4) | `market_calendar` | Không là ngày nghỉ (D); chưa tồn tại (D PK); lớn hơn ngày nghiệp vụ mới nhất (D). Khác `suggested_day` → chỉ cảnh báo, phải tích xác nhận (C, A) | `{date}は市場休業日のため開始できません / {date} là ngày chợ nghỉ, không mở được` ; `{date}はすでに開始されています / Ngày {date} đã được mở` ; `{date}は最新の業務日より後の日付にしてください / Ngày mở phải sau ngày nghiệp vụ mới nhất` ; cảnh báo `{date}は推奨日（{suggested}）と異なります / {date} khác ngày gợi ý ({suggested})` |
| F-02 | 前日未締め理由 / Lý do ngày trước chưa khóa | textarea ≤ 500 | Có khi còn ngày `open` hoặc `reopened` chưa khóa | trống | — | Bắt buộc theo điều kiện (C, A, D) | `前の業務日が未締めです。理由を入力してください / Ngày nghiệp vụ trước chưa khóa, hãy nhập lý do` |
| F-03 | 警告確認 / Đã xem cảnh báo | checkbox mỗi mục cảnh báo | Có khi checklist có mục `warn` | bỏ chọn | checklist | Mọi mục `warn` đã tích (C, A) | `未確認の警告があります / Còn cảnh báo chưa xác nhận` |
| F-04 | 締め時コメント / Ghi chú khi khóa | textarea ≤ 500 | Có khi có mục `warn` | trống | — | (A, D) | `警告がある状態で締める場合はコメントが必要です / Khóa khi còn cảnh báo phải ghi chú` |
| F-05 | 締め解除理由 / Lý do mở lại (ghi rõ việc cần sửa) | textarea ≤ 500 | Có | trống | — | Không rỗng (C, A, D) | `締め解除の理由を入力してください / Nhập lý do mở lại sổ` |
| F-06 | 承認コメント / Ý kiến duyệt mở lại | textarea ≤ 500 | Có khi từ chối | trống | — | (A, D) | `却下する場合はコメントが必要です / Từ chối phải ghi lý do` |

## 6. Trạng thái màn hình

| Trạng thái | Điều kiện | Hiển thị / hành vi |
|---|---|---|
| Đang tải | Chờ API | Skeleton |
| Trống | Ngày không có giao dịch | Các ô = 0; checklist vẫn chạy; khóa được |
| Lỗi tải | ≠ 2xx | Banner + `再読込` |
| Không có quyền | Thiếu `recon.read` và `days.open` | 403 với AUTH-403 |
| Chưa có ngày hiện tại | Không có ngày `open` | Thẻ "Mở ngày" nổi bật với `suggested_day` |
| Ngày đang mở | `open` | Checklist + nút khóa; nút xuất **ẩn** |
| Ngày chờ khóa | `closing` | Nhãn cam `締め待ち`: không nhận bản ghi mới (lô, giao dịch, giao hàng ghi vào ngày hiện tại); checklist + nút khóa |
| Ngày đã khóa | `locked` | Banner `締め済み。修正は修正申請（SCR-022）から / Đã khóa: sửa qua yêu cầu điều chỉnh`; nút xuất; nút yêu cầu mở lại (nếu chưa xuất) |
| Chờ duyệt mở lại | có `day_reopen_requests.status = pending` | Banner vàng; người duyệt thấy nút duyệt / từ chối |
| Đang mở lại | `reopened` | Nhãn đỏ `締め解除中`; chỉ cho các sửa trực tiếp nêu trong yêu cầu đã duyệt (ADR-009 §2); khóa lại bắt buộc qua checklist |
| Mất mạng | offline | Mọi nút ghi khóa với NET-01: `この操作にはネットワーク接続が必要です / Thao tác này cần có mạng` (BC-77 bảng 9.6) |
| Đang gửi | POST | Khóa nút |
| Thành công | 200 | Toast theo hành động; tải lại số liệu |

## 7. Hành động

| Nút / thao tác | Quyền | Bật khi | Gọi API | Kết quả thành công | Kết quả lỗi |
|---|---|---|---|---|---|
| `業務日を開始 / Mở ngày` | `days.open` | F-01 hợp lệ; F-02 khi cần | `POST /api/business-days` `{day, reason}` → `fn_open_day(p_day, p_actor, p_reason)` | 201; ngày mới `open`; ngày `open` cũ (nếu có) → `closing`; `open_reason` lưu; audit `open_day` | 400 (F-01, F-02) |
| `締める… / Khóa sổ` | `recon.lock` | Ngày `open` / `closing` / `reopened`, không mục `block`, mọi `warn` đã tích | Hộp xác nhận → `POST /api/business-days/{day}/lock` `{comment, acknowledged:[codes]}` → `fn_lock_day` | `locked`, `locked_by`, `lock_comment`, `lock_checklist_snapshot`; audit `lock_day` kèm snapshot | 400: `締め前チェックに未解決の項目があります（{n}件）/ Còn {n} mục chặn trong checklist` |
| `締め解除を申請 / Yêu cầu mở lại` | `recon.reopen.request` | `locked` và `exported = false` | `POST /api/business-days/{day}/reopen-requests` `{reason}` | `day_reopen_requests` `pending`; audit | 400: `会計連携済みのため締め解除できません。修正申請を使用してください / Đã xuất kế toán, không mở lại được; hãy dùng yêu cầu điều chỉnh` |
| `承認 / 却下` mở lại | `recon.reopen.approve` | Yêu cầu `pending`, người duyệt ≠ người yêu cầu, chưa duyệt cấp trước | `POST /api/day-reopen-requests/{id}/decision` `{approve, note}` → `fn_decide_day_reopen` | Ghi `day_reopen_decisions(level)`; cấp cuối: ngày → `reopened`; audit | 400: `申請者本人は承認できません / Người yêu cầu không được tự duyệt` |
| `会計CSV出力 / Xuất CSV kế toán` | `reports.export` | Ngày `locked` | `POST /api/accounting-exports` `{day}` → tạo hoặc trả batch | Tải file; `accounting_exports` + `accounting_export_lines`; `exported = true`; audit `export` | 400: `締め前の業務日は会計連携できません / Chưa khóa sổ thì không xuất kế toán được` |
| `再ダウンロード` | `reports.export` | Đã có batch | `GET /api/accounting-exports/{batch_code}` | Cùng nội dung, không tạo batch mới | — |

Thiếu quyền → 403 AUTH-403.

## 8. Phân quyền hiển thị

| Vai trò | Thấy màn hình | Thấy vùng / cột | Thao tác được |
|---|---|---|---|
| `settlement` | Có | Tất cả | Mở ngày, khóa, yêu cầu mở lại, xuất CSV |
| `approver` | Có | Tất cả | Duyệt / từ chối mở lại, xuất CSV |
| `intake` | Chỉ thẻ "Mở ngày" (không có `recon.read`) | Thẻ mở ngày | Mở ngày |
| `sys_admin` | Có (chỉ đọc) | Tất cả trừ nút | Không (đổi `accounting_csv_encoding` ở cài đặt hệ thống, `settings.manage`) |
| `market_ops`, `judge`, `trade`, `delivery` | Không | — | — |
| `rule_admin` (đích) | Không | — | Sửa `lock_checklist`, `approval_levels`, `previous_day_unlocked_policy` ở SCR-034 (phiên bản quy tắc) |

MFA: `settlement` và `approver` nằm trong `system_settings.mfa_required_roles` (mặc định, SCR-001) nên phải đăng nhập AAL2; phiên chưa AAL2 thì mọi API của màn hình trả 401 với M-06 của SCR-001 (thông báo chung, README). Không có bước hỏi MFA riêng khi khóa / mở lại; gỡ `settlement` khỏi danh sách thì không cần MFA (BC-85 chỉ bắt buộc vai trò duyệt).

## 9. Quy tắc nghiệp vụ và điểm phân nhánh

**9.1 Mở ngày (`fn_open_day`, ADR-009 §5):**

| Điều kiện | Hành vi | Căn cứ |
|---|---|---|
| `market_calendar.is_holiday = true` | Chặn | BC-41 |
| Đã có `business_days(day)`, hoặc `day` ≤ ngày nghiệp vụ mới nhất | Chặn | ADR-009 |
| Còn ngày `open` / `reopened` chưa khóa | `previous_day_unlocked_policy = warn_with_reason` (mặc định, S): cảnh báo, bắt buộc F-02, cho mở; ngày `open` cũ → `closing`, ngày `reopened` giữ nguyên. `block`: chặn | ADR-009 (S) |
| `day` khác `suggested_day` (đồng hồ) | Chỉ cảnh báo + xác nhận ở C/A; D không chặn (đồng hồ không quyết hợp lệ) | ADR-009 §4 |

**9.2 Checklist trước khóa (BC-49), mức theo `fn_rule('lock_checklist', ngày khóa)` (S):**

| Mã | Mục | Mức mặc định | Lý do mức |
|---|---|---|---|
| CK-1 | Giao dịch `下書き / 確認待ち` của ngày (khi có các trạng thái này) | **block** | Không thể chốt trong ngày đã khóa (BC-32, BC-43) |
| CK-2 | Bản ghi offline của ngày chưa đồng bộ / đồng bộ lỗi | **block** | Thiếu dữ liệu → đối soát sai (BC-49, ADR-010) |
| CK-3 | Ngoại lệ giao hàng chưa xác nhận (`kind = exception`, `confirmed_at is null`) | **block** | Cần người quyết (BC-56) |
| CK-4 | Giao dịch chưa giao xong (`待機`, `引渡し中`) | warn | Được giao vắt kỳ (BC-50) |
| CK-5 | Ngoại lệ giao hàng có tranh chấp chưa giải quyết (`disputed = true`, `dispute_resolved_at is null`, SCR-029) | warn | Tranh chấp có vòng xử lý riêng, có thể vắt kỳ (BC-51, BC-57); màn hình tranh chấp đầy đủ để giai đoạn sau |
| CK-6 | Yêu cầu điều chỉnh `pending`/`need_info` của giao dịch thuộc ngày | warn | Duyệt sau sẽ ghi vào ngày hiện tại khi đó (ADR-005) |
| CK-7 | Lô có tồn > 0 | warn (thông tin) | Không phải lỗi |

Giá trị mặc định của khóa (ADR-008):

```json
{"CK-1":"block","CK-2":"block","CK-3":"block","CK-4":"warn","CK-5":"warn","CK-6":"warn","CK-7":"warn"}
```

RFP chỉ nêu "đối soát xong → khóa" và các mục cần kiểm, **không** nói mục nào chặn cứng → mức ở trên là giả định (S), đổi qua phiên bản quy tắc (SCR-034) không cần deploy.

**9.3 Khóa / mở lại / xuất (BC-43, BC-48, BC-71, 01 §9.3):**

| Trạng thái | Thao tác | Hành vi |
|---|---|---|
| `open` / `closing` / `reopened` | Khóa | Chạy lại checklist ở D trong cùng giao dịch; `locked`; lưu `lock_comment`, `lock_checklist_snapshot` |
| `locked`, chưa xuất | Yêu cầu mở lại → duyệt (maker ≠ checker, số cấp `approval_levels` dùng chung Q11, ghi `day_reopen_decisions`) | `reopened`: **không** phải ngày hiện tại; chỉ nhận các sửa trực tiếp mà yêu cầu nêu (hủy giao dịch, sửa đánh giá lô của ngày), audit kèm `reopen_request_id`; bản ghi mới vẫn vào ngày hiện tại; khóa lại bắt buộc (ADR-009 §2) |
| `locked`, đã xuất | Mở lại | **Chặn**; sửa qua SCR-022 (bút toán -R/-A ở ngày hiện tại) — S an toàn hơn của BC-48 |
| `open` / `closing` / `reopened` | Xuất kế toán | **Chặn** (BC-71, T20) |
| `locked` | Mọi ghi trực tiếp từ màn hình khác | Hàm raise `LOCKED_DAY`; API ghi `audit_logs.action = 'blocked_edit'` qua `fn_log_blocked_edit` (BC-43, ADR-006) |

**9.4 Nội dung CSV (IF-ACC-01, BC-71/72):** header metadata (`accounting_exports`): `batch_code`, `business_date`, `generated_at` (JST), `run_by`; dòng theo người tham gia (`accounting_export_lines`): mã, nhóm, tổng tiền, tiền thuế (theo `item_tax_rates` của `rule_set_id` đã áp dụng, BC-70), `line_status`. Ánh xạ `line_status` (S): dòng gốc → `確認済み`; dòng `-R`/`-A` → `調整済み`; giao dịch có ngoại lệ giao hàng `disputed = true` chưa giải quyết (CK-5) → `保留`. Mã hóa: `fn_setting('accounting_csv_encoding')` (`system_settings`, mặc định `UTF-8-BOM` như prototype; `Shift_JIS` nếu Q20 chọn).

## 10. Tiêu chí nghiệm thu

Mỗi tiêu chí tự chuẩn bị dữ liệu nêu trong Given (README).

1. **Mở ngày nghỉ.** Given `market_calendar` 2026-10-18 `is_holiday = true`, ngày mới nhất 2026-10-17 `locked`; When mở 2026-10-18; Then 400 `…市場休業日…`, không có dòng `business_days`.
2. **Mở khi ngày trước chưa khóa.** Given 2026-10-15 còn `open`, `previous_day_unlocked_policy = warn_with_reason`; When mở 2026-10-16 không có F-02; Then 400; When có lý do; Then 201, 2026-10-16 `open`, 2026-10-15 `closing`, `open_reason` và audit lưu lý do; chỉ có một ngày `open`.
3. **Checklist chặn.** Given ngày 2026-10-16 `open` có 1 ngoại lệ giao hàng chưa xác nhận; When POST lock (bỏ qua UI); Then 400 `…未解決の項目があります（1件）…`, ngày vẫn `open`.
4. **Cảnh báo phải được xác nhận.** Given ngày chỉ có CK-4 (3 giao dịch chưa giao xong); When khóa không gửi `acknowledged` hoặc không có F-04; Then 400; When đủ; Then `locked`, `lock_comment` lưu, `lock_checklist_snapshot` chứa CK-4 = 3.
5. **Ghi vào ngày đã khóa bị chặn.** Given 2026-10-15 `locked` có giao dịch T261015-0001 `confirmed`; When gọi hủy giao dịch đó; Then 400 và có `audit_logs(action=blocked_edit)`.
6. **Xuất trước khi khóa.** Given ngày `open`; When POST `/api/accounting-exports`; Then 400 `締め前の業務日は会計連携できません / …`, không có `accounting_exports`.
7. **Xuất sau khóa.** Given ngày `locked` có 1 giao dịch gốc, 1 cặp `-R/-A`, và 1 giao dịch có ngoại lệ `disputed = true` chưa giải quyết; When xuất; Then file có header `batch_code`, `business_date`, `generated_at`, `run_by`; ba dòng mang lần lượt `確認済み`, `調整済み`, `保留`; xuất lần hai trả cùng `batch_code`.
8. **Mở lại: maker = checker.** Given `settlement` S1 (cũng được cấp `recon.reopen.approve`) tạo yêu cầu mở lại; When S1 duyệt; Then 400 `申請者本人は承認できません`; When `approver` A1 duyệt; Then ngày `reopened`.
9. **Mở lại sau khi đã xuất.** Given ngày `locked`, `exported = true`; When yêu cầu mở lại; Then 400 `会計連携済みのため締め解除できません…`.
10. **Offline.** Given mất mạng; Then nút mở ngày, khóa, mở lại, xuất đều khóa với NET-01.
11. **Ngày mở lại không phải ngày hiện tại.** Given 2026-10-15 `reopened`, 2026-10-16 `open`; When tạo lô với `day = 2026-10-15`; Then 400 (không phải ngày hiện tại); When hủy giao dịch của 2026-10-15; Then 200, audit có `reopen_request_id`.
12. **CK-5 theo cờ tranh chấp.** Given ngày có 1 ngoại lệ đã xác nhận nhưng `disputed = true`, chưa giải quyết; Then checklist hiện CK-5 = 1 mức `warn`; khóa được khi đã tích và có F-04.

## 11. Khác prototype LAB-2 và việc cần làm

| G-xx | Hiện tại | Cần đổi |
|---|---|---|
| G-07 | Không mở được ngày mới (chỉ seed); không có lịch chợ | `fn_open_day`, `market_calendar`, quyền `days.open`, trạng thái `closing` |
| G-08 | Khóa chỉ hiện số "chưa giao xong", không checklist | Checklist CK-1…7 ở D + API riêng; snapshot ở `business_days` |
| G-09 | Không mở lại được | `day_reopen_requests`, `day_reopen_decisions`, `fn_decide_day_reopen`, trạng thái `reopened` |
| G-06 | Audit `lock_day` ở API sau thao tác; không log lần bị chặn | Trong hàm; `blocked_edit` qua `fn_log_blocked_edit` |
| G-19 | Không có MFA | MFA theo phiên cho `approver`, `settlement` (SCR-001) |
| G-02 | Bộ chọn ngày dựa vào danh sách, không có "ngày hiện tại" JST | `/api/business-days/current` |
| G-05 | Không có cấu hình checklist / mã hóa CSV | `rule_values.lock_checklist`, `previous_day_unlocked_policy`; `system_settings.accounting_csv_encoding` |
| G-21 | CSV `/api/reports/trades` xuất mọi ngày, kể cả chưa khóa; không batch code, không `line_status` | `accounting_exports` + `accounting_export_lines` (03 §2) |

## 12. Câu hỏi mở

- **Q12:** mở lại sổ — dùng Plan A (cho mở khi có người duyệt); sau khi xuất → chặn (S).
- **Q11:** số cấp duyệt mở lại dùng chung `approval_levels` (mặc định 1).
- **Q20:** cách truyền và mã hóa CSV — Plan A: CSV, tài chính tự import.
- **Q13:** loại tranh chấp / SLA — v1 chỉ có cờ `disputed` (SCR-029); màn hình tranh chấp SCR-026/027 để giai đoạn sau.
- **Q-024-1 (mới):** mức chặn / cảnh báo của từng mục checklist (mục 9.2) cần khách xác nhận.
- **Q-024-2 (mới):** có tự khóa sổ theo giờ không — giả định không; chỉ người khóa (BC-29 tinh thần người quyết).
- **Q-024-3 (mới):** mở ngày khi ngày trước chưa khóa — giả định cho mở kèm lý do (`previous_day_unlocked_policy`); khách có muốn chặn không.
