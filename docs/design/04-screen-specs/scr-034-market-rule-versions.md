# SCR-034/035 — Quy tắc vận hành chợ & phiên bản (規則・料率のバージョン管理)

Wireframe: [05-wireframes#scr-034](../05-wireframes/index.html#scr-034) (chưa vẽ). As-built: **không có** — prototype chưa có màn hình, bảng hay hàm nào cho quy tắc (G-05). Thiết kế theo ADR-008.

## 1. Mục đích và người dùng

- **SCR-034 規則バージョン一覧:** danh sách phiên bản quy tắc / tỷ lệ của chợ, phiên bản đang áp dụng, phiên bản đã duyệt chờ hiệu lực, lịch sử "phiên bản nào áp dụng từ ngày nào đến ngày nào" (dạng RPT-12, BC-20), so sánh hai phiên bản, kiểm tra "ngày nghiệp vụ X dùng phiên bản nào".
- **SCR-035 規則バージョン編集・承認:** `rule_admin` soạn bản nháp (sao chép từ phiên bản đã duyệt), sửa giá trị theo từng khóa, đặt ngày hiệu lực tương lai, gửi duyệt; `approver` (trưởng bộ phận đối soát, BC-21) duyệt hoặc trả lại. Rollback = phát hành phiên bản mới mang nội dung phiên bản cũ (BC-18).
- Đổi quy tắc bằng cấu hình, không deploy; demo bằng một phiên bản mới là tiêu chí nghiệm thu (BC-19, NFR-OPS-02).
- Tần suất thấp: tối đa ~4 lần duyệt / năm (BC-15, GOV-RULE-01). Thường làm ngoài giờ cao điểm, sau 10:00 JST.
- **Ngoài phạm vi màn hình:** khóa bảo mật / vận hành (`mfa_required_roles`, khóa đăng nhập, timeout phiên, `accounting_csv_encoding`…) nằm ở bảng `system_settings` riêng, **không** thuộc `rule_values` và **không** tính vào giới hạn 4 lần / năm (ADR-008 #9). Màn hình này không hiển thị chúng.

## 2. Điều kiện vào màn hình

| Màn hình | Đường dẫn | Quyền |
|---|---|---|
| Danh sách + lịch sử + mô phỏng ngày | `/rules` | `rules.read` hoặc `rules.draft` hoặc `rules.approve` |
| Chi tiết / so sánh | `/rules/{id}`, `/rules/diff?from={id}&to={id}` | như trên |
| Soạn / sửa bản nháp | `/rules/{id}/edit` (chỉ `draft`) | `rules.draft` |
| Duyệt | `/rules/{id}` khi `submitted` | `rules.approve` (phiên AAL2 do `approver` thuộc `mfa_required_roles`, SCR-001) |

- Menu: "設定 › 規則・料率 / Cài đặt › Quy tắc & tỷ lệ". Từ SCR-022, SCR-024 (`approval_levels`, `lock_checklist`) có link "規則を確認 / Xem quy tắc" về `/rules`.
- Ngày nghiệp vụ hiện tại lấy từ `/api/business-days/current` (ADR-009), không lấy đồng hồ máy. Màn hình thường dùng sau 10:00 khi chưa có ngày `open` → so sánh theo **ngày tham chiếu** = ngày hiện tại, hoặc ngày nghiệp vụ gần nhất khi chưa có ngày mở (ADR-009 §3). Mã quyền `rules.read`, `rules.draft`, `rules.approve` đăng ký ở ADR-004.

## 3. Bố cục

1. Header: phiên bản đang áp dụng `v{n}` + 業務日 hiện tại; phiên bản chờ hiệu lực (nếu có); bộ đếm `{năm}: {k}/4 回`.
2. Thanh hành động: `新規下書き`, `ロールバック`, `比較`.
3. Thẻ mô phỏng ngày hiệu lực (日付で適用版を確認): ô nhập 業務日 → phiên bản + bảng giá trị áp dụng.
4. Bảng phiên bản (trạng thái, kỳ áp dụng, người soạn / duyệt).
5. Dòng thời gian lịch sử áp dụng (RPT-12): mỗi đoạn `[effective_from, effective_from kế tiếp)`.
6. Chi tiết / soạn (SCR-035): thông tin chung (ngày hiệu lực, lý do, rollback_of) → các khối khóa (mỗi khóa một trình sửa theo kiểu, mục 5.2) → vùng so sánh với phiên bản gốc → vùng duyệt.

## 4. Dữ liệu hiển thị

| Mục | Nguồn (bảng.cột / API) | Định dạng | Ghi chú |
|---|---|---|---|
| Số phiên bản | `rule_sets.version_no` | `v12` | Tăng dần, UK |
| Trạng thái hiển thị | `rule_sets.status` + so với 業務日 hiện tại | `下書き` / `承認待ち` / `承認済（{date}から）` / `適用中` / `過去` | `適用中` = bản `fn_rule` chọn cho ngày hiện tại; không lưu |
| Ngày hiệu lực | `rule_sets.effective_from` | `YYYY-MM-DD (曜)` | 業務日 JST |
| Kỳ áp dụng | `effective_from` → `effective_from` của bản duyệt kế tiếp − 1 | `2026-11-01 〜 2027-03-31` / `〜 現在` | Tính ở API |
| Người soạn / duyệt | `maker_id`, `checker_id → profiles` | tên + `YYYY-MM-DD HH:mm` | `approved_at` |
| Lý do thay đổi | `rule_sets.change_reason` | text | Mới |
| Rollback của | `rule_sets.rollback_of → version_no` | `v9 の復元` | |
| Lý do vượt giới hạn | `rule_sets.over_limit_reason` | text | Chỉ khi là lần thứ ≥ 5 trong năm |
| Đếm trong năm | `count(*)` `approved`, theo năm của `effective_from` | `3/4` | Cảnh báo ở 4 |
| Số bản ghi đã dùng | `count(trades.rule_set_id)` (sau thêm khuyến khích, quyết toán) | số | Chứng minh không sửa lịch sử (BC-14) |
| Giá trị khóa | `rule_values(rule_set_id, key, value)` | theo kiểu (mục 5.2) | |
| Thuế suất mặt hàng | `items(code, name, unit)` + `item_tax_rates(item_code, rule_set_id, tax_rate)` | `%` | BC-22, Q29; danh mục mặt hàng không phiên bản, chỉ thuế suất theo phiên bản (ADR-008 #3) |
| So sánh | `GET /api/rules/diff?from=&to=` | thêm / xóa / đổi, cũ → mới | Mức từng ô (ma trận, dòng bậc, dòng mặt hàng) |

## 5. Field nhập

### 5.1 Thông tin chung (SCR-035, bản nháp)

| ID | Nhãn (JP / VI) | Kiểu | Bắt buộc | Mặc định | Nguồn lựa chọn | Validation (tầng) | Thông báo lỗi |
|---|---|---|---|---|---|---|---|
| F-01 | 適用開始日 / Ngày hiệu lực | date | Có | ngày tham chiếu + 1 | — | `> ngày tham chiếu` (C, A, D — kiểm lại lúc gửi **và** lúc duyệt) | `適用開始日は翌業務日以降を指定してください / Ngày hiệu lực phải sau ngày nghiệp vụ hiện tại` |
| F-02 | (cảnh báo F-01) | — | — | — | `market_calendar` | Ngày nghỉ chợ → cảnh báo, không chặn (A) | `指定日は休市日です / Ngày đã chọn là ngày chợ nghỉ` |
| F-03 | 変更理由 / Lý do thay đổi | textarea 1–500 | Có | trống | — | Không rỗng sau trim (C, A, D) | `変更理由を入力してください / Phải nhập lý do thay đổi` |
| F-04 | 上限超過の理由 / Lý do vượt 4 lần / năm | textarea 1–500 | Có khi bản này là lần thứ ≥ 5 trong năm của F-01 | trống | — | (A, D ở `fn_submit_rule_set` và `fn_approve_rule_set`) | `年間変更回数の上限（4回）を超えます。理由を入力してください / Vượt giới hạn 4 lần đổi / năm — phải nhập lý do` |
| F-05 | 元バージョン / Phiên bản gốc | chỉ đọc | Có | bản `適用中` (hoặc bản chọn khi rollback) | `rule_sets` approved | — | — |

### 5.2 Giá trị quy tắc — trình sửa theo kiểu

Mỗi khóa được D kiểm bằng `fn_validate_rule_value(key, value)` (schema theo khóa); C chỉ kiểm sớm cho tiện. Màn hình sửa các khóa sau trong **Danh mục khóa** của ADR-008 (nơi duy nhất định nghĩa kiểu và mặc định). Các khóa còn lại của danh mục (`seller_registration_check`, `qualification_valid_to_inclusive`, `allow_trade_on_previous_day_lots`, `auction_confirmer_must_differ`, `delivery_exception_effects`, `exception_confirm_by_other`, `max_deliveries_per_trade`, `correction_evidence_required_when`, `previous_day_unlocked_policy`) hiện bằng trình sửa JSON chung có kiểm schema ở D; khóa ngoài danh mục bị từ chối.

| ID | Khóa / nhãn (JP / VI) | Kiểu trình sửa | Mặc định | Validation (tầng) | Thông báo lỗi |
|---|---|---|---|---|---|
| F-11 | `expiry_warning_days` 期限警告日数 / Số ngày cảnh báo hết hạn tư cách | number (nguyên) | 30 (S) | 1–365 (C, A, D) | `1〜365の整数で入力してください / Nhập số nguyên 1–365` |
| F-12 | `grades` 等級 / Hạng đánh giá lô | danh sách (thêm / xóa / kéo đổi thứ tự) | `A`, `B`, `C` (S) | ≥ 1 mục, không trùng, mỗi mục 1–10 ký tự (C, A, D) | `等級が重複しています / Hạng bị trùng` |
| F-13 | `trade_kind_matrix` 取引区分マトリクス / Ma trận nhóm mua × loại giao dịch | ma trận checkbox: hàng = 仲卸 / 売買参加者 / 買出人; cột = 相対 / せり | tất cả ✓ (S) | Mỗi cột có ≥ 1 ✓ (A, D). 卸売業者 là bên bán, không có hàng (ghi chú dưới ma trận) | `各取引区分に少なくとも1つの買手区分を許可してください / Mỗi loại giao dịch phải cho phép ít nhất một nhóm người mua` |
| F-14 | `delivery_expired_policy` 失効後の引渡し / Giao hàng khi tư cách đã hết | chọn một | `allow_with_flag` (S, Q31) | ∈ `allow_with_flag`, `block` (A, D) | `選択肢から選んでください / Chọn một giá trị trong danh sách` |
| F-15 | `approval_levels` 承認段階数 / Số cấp duyệt điều chỉnh | number | 1 (A, Q11) | 1–3 (C, A, D) | `1〜3の整数で入力してください / Nhập số nguyên 1–3` |
| F-16 | `lock_checklist` 締めチェック項目 / Checklist khóa sổ | bảng: mã CK, tên, mức `block` / `warn` | CK-1..3 `block`, CK-4..7 `warn` (S, SCR-024) | Mã thuộc tập CK-1..7 của SCR-024, không trùng; mức thuộc tập (A, D) | `チェック項目が不正です / Mục checklist không hợp lệ` |
| F-17 | `incentive_rate_tiers` 完納奨励金料率 / Bậc tỷ lệ khuyến khích | bảng bậc: `min_ratio` (%) , `rate` (%) | 1 dòng giả `0% → 0%` + nhãn `仮データ（Q16回答待ち）/ Dữ liệu giả — chờ Q16` | Bậc đầu `min_ratio = 0`; `min_ratio` tăng dần, 0–100; `rate` 0–100 (C, A, D) | `下限比率は昇順で入力してください / Ngưỡng tối thiểu phải tăng dần` |
| F-18 | 品目別税率 / Thuế suất theo mặt hàng (`item_tax_rates` của phiên bản) | bảng: mã, tên, đơn vị (chỉ đọc, từ `items`), thuế suất (sửa được) | sao chép từ bản gốc | Mỗi `items.code` một dòng; `tax_rate` ∈ [0, 1], tối đa 3 chữ số thập phân (C, A, D CHECK). Thêm mặt hàng mới: thêm vào `items` (không phiên bản, audit) rồi đặt thuế suất ở bản nháp; tên / đơn vị mặt hàng đã dùng không sửa (BC-37) | `税率は0〜100%で入力してください / Thuế suất phải trong khoảng 0–100%` |

Mỗi khối có nút `元に戻す / Hoàn về giá trị gốc` và đánh dấu `変更あり` khi khác bản gốc.

### 5.3 Duyệt (SCR-035)

| ID | Nhãn (JP / VI) | Kiểu | Bắt buộc | Mặc định | Nguồn lựa chọn | Validation (tầng) | Thông báo lỗi |
|---|---|---|---|---|---|---|---|
| F-21 | 判断 / Quyết định | radio | Có | trống | `approve 承認`, `return 差戻し` | Thuộc tập (A, D) | `判断を選択してください / Chọn quyết định` |
| F-22 | コメント / Ý kiến | textarea ≤ 500 | Có khi `return` | trống | — | (C, A, D) | `差戻しにはコメントが必要です / Trả lại phải ghi ý kiến` |

### 5.4 Mô phỏng ngày (SCR-034)

| ID | Nhãn (JP / VI) | Kiểu | Bắt buộc | Mặc định | Validation (tầng) | Thông báo lỗi |
|---|---|---|---|---|---|---|
| F-31 | 確認する業務日 / Ngày nghiệp vụ cần kiểm | date | Có | 業務日 hiện tại | Ngày hợp lệ (C, A) | `日付を正しく入力してください / Ngày không hợp lệ` |
| F-32 | 下書き・承認待ちを含める / Tính cả bản nháp / chờ duyệt | checkbox | — | tắt | Chỉ `rules.draft` / `rules.approve` thấy (A) | — |

## 6. Trạng thái màn hình

| Trạng thái | Điều kiện | Hiển thị / hành vi |
|---|---|---|
| Đang tải | Chờ API | Skeleton bảng + thẻ |
| Trống | Chưa có `rule_sets` nào (chỉ khi chưa seed) | `規則バージョンがありません。初期版を作成してください / Chưa có phiên bản quy tắc — hãy tạo bản đầu tiên` |
| Lỗi tải | ≠ 2xx | Banner + `再読込` |
| Không có quyền | Thiếu cả 3 quyền | 403 với AUTH-403 (README) |
| Chỉ xem | Chỉ có `rules.read` | Ẩn mọi nút ghi |
| Đã có bản nháp mở | Có `draft` / `submitted` | `新規下書き`, `ロールバック` khóa: `処理中の下書き（v{n}）があります / Đang có bản nháp v{n} chưa xử lý xong` |
| Đạt giới hạn năm | Đếm năm của F-01 ≥ 4 | Banner vàng `{年}年の変更は既に{k}回です（上限4回）/ Năm {năm} đã đổi {k} lần (giới hạn 4)`; F-04 hiện ra |
| Là người soạn | `maker_id = me` | Vùng duyệt thay bằng `ご自身の下書きは承認できません / Bạn là người soạn — không được tự duyệt` |
| Ngày hiệu lực đã qua | `submitted`, F-01 ≤ 業務日 hiện tại | Nút 承認 khóa: `適用開始日が過ぎています。差戻してください / Ngày hiệu lực đã qua — hãy trả lại để sửa` |
| Mất mạng | offline | Mọi nút ghi khóa với NET-01: `この操作にはネットワーク接続が必要です / Thao tác này cần có mạng` (không có hàng đợi offline, ADR-010) |
| Đang gửi / Thành công | POST / PUT | Khóa nút / toast + tải lại |

## 7. Hành động

| Nút / thao tác | Quyền | Bật khi | Gọi API | Kết quả thành công | Kết quả lỗi |
|---|---|---|---|---|---|
| `新規下書き / Tạo bản nháp` | `rules.draft` | Không có bản nháp mở | `POST /api/rules` `{base_id}` → `fn_create_rule_draft` | 201, sao chép `rule_values` + `items` của bản gốc; mở `/rules/{id}/edit` | 409 đã có bản nháp |
| `ロールバック / Rollback về phiên bản cũ` | `rules.draft` | Chọn một bản `approved` không phải `適用中`; không có bản nháp mở | `POST /api/rules` `{base_id, rollback: true}` | Bản nháp mới `rollback_of = base_id`, nội dung y bản cũ; đi tiếp luồng duyệt như bản thường | 409 |
| `保存 / Lưu nháp` | `rules.draft` | `draft`, người dùng là maker | `PUT /api/rules/{id}` `{effective_from, change_reason, values, items}` → `fn_save_rule_draft` | 200; audit before/after theo khóa | 400 theo mục 5 |
| `承認依頼 / Gửi duyệt` | `rules.draft` | `draft`, mọi khóa hợp lệ, có ≥ 1 khác biệt với bản gốc | `POST /api/rules/{id}/submit` → `fn_submit_rule_set` | `submitted`; thông báo trong app cho `approver` | 400 (F-01, F-03, F-04, `変更内容がありません / Không có thay đổi nào`) |
| `下書き削除 / Xóa bản nháp` | `rules.draft` | `draft`, maker | `DELETE /api/rules/{id}` | Bản nháp xóa (chưa từng có hiệu lực); audit giữ lại | 400 nếu không phải `draft` |
| `承認 / Duyệt` | `rules.approve` | `submitted`, ≠ maker, F-01 > ngày tham chiếu | `POST /api/rules/{id}/decision` `{decision:'approve', note, over_limit_reason?}` → `fn_approve_rule_set` | `approved`, `checker_id`, `approved_at`, `version_no` cố định; bất biến từ đây | 400 / 403 AUTH-403 / 401 M-06 (phiên chưa AAL2) |
| `差戻し / Trả lại` | `rules.approve` | `submitted`, ≠ maker | `{decision:'return', note}` | Về `draft`, giữ lịch sử quyết định | 400 |
| `比較 / So sánh` | đọc | Chọn 2 phiên bản bất kỳ | `GET /api/rules/diff` | Bảng khác biệt theo khóa | — |
| `確認 / Mô phỏng ngày` | đọc | F-31 hợp lệ | `GET /api/rules/resolve?date=&include_pending=` → `fn_rule_set(date)` | Phiên bản + giá trị; nếu `include_pending`, ghi rõ `（未承認のため実際には適用されません）/ (chưa duyệt — thực tế không áp dụng)` | 400 |
| `CSV出力 / Xuất lịch sử` | đọc | — | `GET /api/rules/history.csv` | Danh sách phiên bản + kỳ áp dụng (RPT-12) | — |

## 8. Phân quyền hiển thị

| Vai trò | Thấy màn hình | Thấy vùng / cột | Thao tác được |
|---|---|---|---|
| `rule_admin` | Có | Tất cả, gồm bản nháp | Tạo / sửa / gửi / xóa nháp, rollback (không duyệt). MFA theo phiên (BC-85, SCR-001) |
| `approver` (trưởng đối soát, giả định S — ADR-004) | Có | Tất cả, gồm bản chờ duyệt | Duyệt / trả lại (không bản của mình). MFA theo phiên (SCR-001) |
| `settlement` | Có | Bản đã duyệt, lịch sử, so sánh, mô phỏng | Chỉ xem (`rules.read`) |
| `sys_admin` | Có | Như `settlement` | Chỉ xem; không soạn / duyệt (tách trách nhiệm) |
| `intake`, `judge`, `trade`, `delivery`, `market_ops` | Không | — | Không |

## 9. Quy tắc nghiệp vụ và điểm phân nhánh

**9.1 Vòng đời phiên bản (tầng D):** `draft → submitted → approved`; `submitted → draft` khi trả lại. `approved` là bất biến: trigger chặn UPDATE / DELETE trên `rule_sets` (trừ cột `status` → `superseded`) và trên `rule_values`, `items` của bản không phải `draft` (BC-14, BC-18). "Áp dụng" không phải trạng thái lưu mà suy ra từ ngày (BC-16, BC-17).

**9.2 Chọn phiên bản cho một ngày** — `fn_rule(key, business_date)` / `fn_rule_set(business_date)` (ADR-008 #4):

| Điều kiện | Kết quả | Căn cứ |
|---|---|---|
| Có bản `approved`, `effective_from ≤ date` | Bản có `effective_from` lớn nhất; trùng ngày thì `version_no` lớn nhất | ADR-008 #4, BC-17 |
| Bản `draft` / `submitted` | Không bao giờ được chọn | BC-16 |
| Không có bản nào ≤ date | Lỗi `適用可能な規則バージョンがありません / Không có phiên bản quy tắc cho ngày này` | — |
| Bản ghi đã chốt (giao dịch…) | Giữ `rule_set_id` đã lưu, không tính lại | BC-14, BC-20 |

**9.3 Gửi và duyệt:**

| # | Tình huống | Hành vi | Căn cứ |
|---|---|---|---|
| 1 | `checker_id = maker_id` | Chặn (CHECK + kiểm trong hàm): `作成者本人は承認できません / Người soạn không được tự duyệt` | BC-16, BC-88 |
| 2 | `effective_from ≤ ngày tham chiếu` lúc gửi hoặc lúc duyệt | Chặn (F-01) | BC-17 |
| 3 | Đã có `approved` khác với cùng `effective_from` | Cho, cảnh báo `同日適用の承認済み版（v{n}）を置き換えます / Thay bản v{n} cùng ngày hiệu lực` — đây là cách hủy bản tương lai đã duyệt sai | Giả định (S) |
| 4 | Số bản `approved` có `effective_from` cùng năm JST ≥ 4 | Không chặn; bắt buộc F-04; audit ghi `over_limit = true` | BC-15, ADR-008 #7 |
| 5 | Rollback | Đếm như một lần đổi; vẫn maker–checker, ngày tương lai | BC-18, BC-15 |
| 6 | Duyệt thành công | Bản `approved` trước đó có `effective_from` < bản mới → `superseded` khi bản mới bắt đầu áp dụng (hiển thị; `fn_rule` không phụ thuộc cột này) | ADR-008 #1 |
| 7 | Mọi thao tác ghi | Audit trong cùng giao dịch: before/after theo khóa, lý do | ADR-006, BC-81 |

**9.4 Ma trận loại giao dịch mặc định (F-13, ADR-008):** nhóm bên mua theo TBL-ACTOR-01 — 仲卸, 売買参加者, 買出人 — được cả 相対 và せり; 卸売業者 là bên bán. Phân 相対 / せり theo nhóm là giả định S (01 §1.1). SCR-016 / SCR-019 đọc ma trận qua `fn_rule('trade_kind_matrix', 業務日 giao dịch)`.

## 10. Tiêu chí nghiệm thu

1. **Demo đổi quy tắc không deploy (BC-19).** Given `v1` `expiry_warning_days = 30` đang áp dụng; When `rule_admin` tạo `v2` = 14, hiệu lực 2026-10-20, `approver` duyệt; Then ngày 2026-10-19 SCR-010 cảnh báo theo 30, ngày 2026-10-20 theo 14; không có deploy.
2. **Maker ≠ checker.** Given U có cả `rules.draft` và `rules.approve` gửi `v3`; When U gọi API duyệt (bỏ qua UI); Then 400 `作成者本人は承認できません…`, `v3` vẫn `submitted`.
3. **Ngày hiệu lực tương lai.** Given ngày nghiệp vụ hiện tại 2026-10-16 (`open`); When gửi với `effective_from = 2026-10-16`; Then 400 `適用開始日は翌業務日以降を指定してください…`. Given `v4` gửi với 2026-10-17 nhưng duyệt khi 業務日 đã là 2026-10-17; Then 400, phải trả lại.
4. **Bản nháp không có hiệu lực.** Given `v5` `submitted` hiệu lực 2026-10-18; When mô phỏng ngày 2026-10-20 không tick F-32; Then trả về bản `approved` mới nhất, không phải `v5`.
5. **Không sửa lịch sử.** Given giao dịch ngày 2026-10-15 lưu `rule_set_id = v1`; When `v2` có hiệu lực; Then giao dịch vẫn `v1`; mọi UPDATE vào `rule_values` của `v1` bị trigger chặn.
6. **Rollback là phiên bản mới.** Given `v2` áp dụng; When rollback về `v1` và duyệt với hiệu lực 2026-11-01; Then có `v3` với `rollback_of = v1`, giá trị = `v1`; `v1`, `v2` không đổi; lịch sử hiện `v2 〜 2026-10-31`, `v3（v1の復元）2026-11-01〜`.
7. **Giới hạn 4 lần / năm.** Given năm 2026 đã có 4 bản `approved`; When gửi bản thứ 5 không F-04; Then 400 `年間変更回数の上限（4回）を超えます…`; When có F-04; Then gửi được, duyệt được, audit `over_limit = true`.
8. **Trình sửa theo kiểu.** When bỏ hết ✓ cột せり ở F-13; Then 400 `各取引区分に少なくとも1つの買手区分を許可してください…`. When F-17 có `min_ratio` 50 rồi 30; Then 400 `下限比率は昇順で入力してください…`.
9. **So sánh.** Given `v1`, `v3`; When so sánh; Then chỉ liệt kê các khóa / ô / dòng mặt hàng khác nhau, dạng cũ → mới.
10. **Phân quyền.** Given `settlement`; Then thấy danh sách, lịch sử, mô phỏng, không thấy nút ghi; POST trả 403. Given `trade`; Then 403 khi mở `/rules`.
11. **Không chứa khóa hệ thống.** When gửi `values` có `session_idle_timeout_min`; Then 400 `未定義の規則キーです / Khóa quy tắc không tồn tại`.

## 11. Khác prototype LAB-2 và việc cần làm

Màn hình này **không tồn tại** trong prototype: không có trang, API, bảng hay hàm. Toàn bộ là việc mới.

| G-xx | Hiện tại | Cần đổi |
|---|---|---|
| G-05 | Ngưỡng 30 ngày, đơn vị, hạng A/B/C, ma trận mua / bán hardcode | `rule_sets` + `rule_values` + `fn_rule`; màn hình này; các hàm `fn_*` đọc qua `fn_rule` |
| G-15 | Mặt hàng, đơn vị là text tự do | Bảng `items(code PK)` + `item_tax_rates` theo phiên bản (03 §2), sửa thuế suất ở F-18 |
| G-16 | Không có vai trò `rule_admin` | Seed `rule_admin`; quyền `rules.draft`, `rules.approve`, `rules.read` (ADR-004) |
| G-19 | Không MFA | MFA theo phiên cho `rule_admin`, `approver` (SCR-001) |
| G-06 | Audit ghi ở API sau thao tác | Audit trong `fn_*_rule_*` |
| — | ERD đích trước đây chỉ có `draft/approved/superseded` | Đã thêm `submitted`, `change_reason`, `over_limit_reason` vào 03 §2; quyết định trả lại / duyệt ghi ở `audit_logs` |

## 12. Câu hỏi mở

- **Q16 / BC-23:** cấu trúc bảng tỷ lệ khuyến khích chưa có; F-17 dùng `(min_ratio, rate)` với dữ liệu giả.
- **Q31:** hành vi giao hàng khi tư cách hết hạn; mặc định `allow_with_flag` (S).
- **Q11:** số cấp duyệt; mặc định 1.
- **Q-034-1 (mới):** "4 lần / năm" đếm theo năm của ngày hiệu lực hay ngày duyệt, năm lịch hay năm tài chính? Giả định: năm lịch JST của `effective_from`, rollback tính là một lần.
- **Q-034-2 (mới):** vượt 4 lần có cần cấp duyệt cao hơn không? Giả định: chỉ cảnh báo + lý do (ADR-008 #7).
- **Q-034-3 (mới):** hủy một bản đã duyệt chưa tới ngày hiệu lực — giả định: phát hành bản mới cùng ngày hiệu lực (9.3 #3), không xóa.
- **C-02 (đã đóng):** mặc định `trade_kind_matrix` thống nhất ở ADR-008, SCR-016, SCR-019, 01 §1.1 (mục 9.4).
