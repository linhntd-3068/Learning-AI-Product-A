# SCR-012/013 — Tiếp nhận lô & ghi kết quả đánh giá (入荷受付・下見評価)

Wireframe: [05-wireframes#scr-012](../05-wireframes/index.html#scr-012). As-built: `src/app/(app)/lots/page.tsx`, `lots/lot-intake-form.tsx`, `lots/[id]/page.tsx`, `src/app/api/lots/**`, `fn_create_lot` (`0002_business_functions.sql`).

## 1. Mục đích và người dùng

- **SCR-012 入荷受付:** nhân viên tiếp nhận (`intake`) ghi một lô hàng vừa về: bên bán (卸売業者), mặt hàng, số lượng. Hệ thống cấp mã lô `L<YYMMDD>-NNN`; lô là gốc của mã nghiệp vụ xuyên suốt lô → giao dịch → giao hàng (BC-31).
- **SCR-013 下見・評価:** người đánh giá (`judge`) ghi hạng và nhận xét. **Con người quyết định hạng**; hệ thống không chấm, không gợi ý, không đọc ảnh (BC-27, BC-29, T5).
- Thời điểm: 02:00–02:30 JST nhận lô sớm, rải rác tới 05:00 (02-07). Tải: 350 lô/ngày thường, 600 cao điểm (BC-80); tìm/lọc danh sách p95 ≤ 2 giây.
- Thiết bị: tablet dùng chung theo ca ở khu tiếp nhận, mạng chập chờn (BC-64, BC-76) → form dùng được bằng bàn phím, có hàng đợi offline cho tiếp nhận (ADR-010).

## 2. Điều kiện vào màn hình

| Màn hình | Đường dẫn | Quyền xem | Quyền ghi |
|---|---|---|---|
| Danh sách lô + form tiếp nhận | `/lots?day=YYYY-MM-DD` | `lots.read` | `lots.create` |
| Chi tiết lô + form đánh giá | `/lots/{id}` | `lots.read` | `lots.inspect` |

- `day` mặc định = ngày nghiệp vụ hiện tại từ `GET /api/business-days/current` (ADR-009), **không** tính bằng đồng hồ máy. Chọn ngày khác chỉ để **xem**; lô mới luôn ghi vào ngày hiện tại (ngày `open` duy nhất).
- Từ danh sách → bấm mã lô → chi tiết. Từ chi tiết → giao dịch trên lô (`/trades/{id}`), → nhập 相対 (SCR-016) với lô đã chọn.

## 3. Bố cục

1. Header: tiêu đề `入荷・ロット / Lô hàng`, bộ chọn 業務日, nhãn trạng thái ngày (`営業中 / Đang mở`, `締め済 / Đã khóa`), chỉ báo mạng + số bản ghi chưa đồng bộ.
2. Form tiếp nhận (chỉ khi có `lots.create` và ngày đang xem là ngày hiện tại `open`), một hàng 6 ô trên tablet ngang.
3. Bảng lô của ngày, bộ lọc: mặt hàng, bên bán, trạng thái, "chưa đánh giá".
4. Vùng "未同期 / Chưa đồng bộ" (chỉ khi hàng đợi có bản ghi): mã tạm, giờ lưu, trạng thái gửi.
5. Chi tiết lô: thẻ số lượng (ban đầu / khả dụng / đã bán), thẻ đánh giá (hạng, người, lúc), form đánh giá, bảng giao dịch trên lô, lịch sử đánh giá (từ `audit_logs`).

## 4. Dữ liệu hiển thị

| Mục | Nguồn | Định dạng | Ghi chú |
|---|---|---|---|
| Mã lô | `lots.code` | `L261016-001` | Lô offline chưa đồng bộ hiện `TMP-xxxxxxxx` (8 ký tự đầu `client_ref`) |
| Mặt hàng | `items.name` qua `lots.item_code` | text | Đích (G-15); prototype `lots.item` text |
| Bên bán | `participants.code · name` | `W-001 · …` | |
| Chủ hàng (荷主) | `lots.shipper` | text | |
| Ban đầu / Khả dụng | `lots.initial_qty`, `available_qty` | số 2 lẻ + `items.unit` | Khả dụng in đậm |
| Hạng | `lots.grade` | nhãn từ `fn_rule('grades', 業務日 của lô)` | `未評価 / chưa đánh giá` khi null |
| Trạng thái lô | suy ra: tồn, giao dịch, đánh giá | `受付 / 下見済 / 販売中 / 完売` | Suy ra, không lưu cứng (BC-38, G-13) |
| Người / lúc đánh giá | `lots.inspected_by → profiles.full_name`, `inspected_at` | `HH:mm` JST | |
| Giao dịch trên lô | `GET /api/lots/{id}` → `trades` | bảng | Gồm dòng -R/-A |

Quy tắc suy ra trạng thái lô: chưa có giao dịch sống và `grade is null` → `受付`; có `grade`, chưa có giao dịch → `下見済`; có giao dịch và `available_qty > 0` → `販売中`; `available_qty = 0` → `完売`. Trạng thái `引渡し完了` của lô không dùng (FIG-011 không định nghĩa cho bán nhiều phần, BC-38).

## 5. Field nhập

### 5.1 Tiếp nhận (SCR-012)

| ID | Nhãn (JP / VI) | Kiểu | Bắt buộc | Mặc định | Nguồn lựa chọn | Validation (tầng) | Thông báo lỗi |
|---|---|---|---|---|---|---|---|
| F-01 | 業務日 / Ngày nghiệp vụ | date (chỉ đọc trong form) | Có | `fn_current_business_date()` (ADR-009) | — | Là ngày hiện tại (A, D `fn_assert_current_day`) | `この業務日は締め済みです。修正申請を作成してください / Ngày nghiệp vụ đã khóa sổ, hãy tạo yêu cầu điều chỉnh` ; `業務日が未開始です / Ngày nghiệp vụ chưa được mở` ; `現在の業務日ではありません / Không phải ngày nghiệp vụ hiện tại` |
| F-02 | 卸売業者 / Bên bán | select | Có | trống | `GET /api/participants?purpose=sell&day={day}` (server lọc nhóm 卸売業者 theo `party_kind_basis`, gắn cờ bằng `fn_qualification_state`) | Chọn một (C); `kind = wholesaler` (D); đăng ký chợ không `suspended` tại 業務日 (D, BC-10) | `売り手は卸売業者を選択してください / Bên bán phải là 卸売業者` ; `{name} は一時停止中のため入荷を受け付けできません / {name} đang bị tạm dừng, không tiếp nhận được` |
| F-03 | 荷主 / Chủ hàng | text ≤ 100 | Có | trống | gõ tự do | Không rỗng sau trim (C, A) | `荷主を入力してください / Nhập chủ hàng` |
| F-04 | 品目 / Mặt hàng | select có tìm kiếm | Có | trống | `items` (danh mục, G-15) | Mã có trong `items` (A, D FK `items.code`) | `品目マスタにない品目です / Mặt hàng không có trong danh mục` |
| F-05 | 単位 / Đơn vị | chỉ đọc | — | `items.unit` của F-04 | `items.unit` | Không cho chọn (BC-37) | — |
| F-06 | 数量 / Số lượng | number, bước 0.01 | Có | trống | — | `> 0`, ≤ 2 chữ số lẻ, ≤ 9 999 999 999.99 (C, A, D CHECK) | `数量は0より大きい値を入力してください / Số lượng phải lớn hơn 0` |
| F-07 | client_ref (ẩn) | uuid | Có | sinh ở máy khi mở form | — | Duy nhất (D UNIQUE) | — (trùng = trả bản ghi đã có, không báo lỗi) |

### 5.2 Đánh giá (SCR-013)

| ID | Nhãn (JP / VI) | Kiểu | Bắt buộc | Mặc định | Nguồn lựa chọn | Validation (tầng) | Thông báo lỗi |
|---|---|---|---|---|---|---|---|
| F-11 | 評価 / Hạng | select | Có | hạng hiện tại hoặc trống | `fn_rule('grades', 業務日)` (G-05; prototype hardcode A/B/C) | Thuộc danh sách (A, D) | `評価区分を選択してください / Chọn hạng đánh giá` |
| F-12 | 所見 / Nhận xét | textarea ≤ 500 | Không | giá trị hiện tại | — | Độ dài (C, A) | `所見は500文字以内で入力してください / Nhận xét tối đa 500 ký tự` |
| F-13 | 修正理由 / Lý do sửa | textarea ≤ 500 | Có khi lô đã có giao dịch (kể cả đã hủy) | trống | — | Bắt buộc theo điều kiện (C hiện ô, D quyết) (BC-47) | `取引済みロットの評価修正には理由が必要です / Lô đã có giao dịch: phải nhập lý do sửa kết quả đánh giá` |

## 6. Trạng thái màn hình

| Trạng thái | Điều kiện | Hiển thị / hành vi |
|---|---|---|
| Đang tải | Chờ `/api/lots` | Skeleton bảng; form khóa |
| Trống | Ngày chưa có lô | `この業務日のロットはありません / Chưa có lô nào trong ngày`; form vẫn hiện nếu được ghi |
| Lỗi tải | API ≠ 2xx | Banner đỏ, nút `再読込 / Tải lại`; giữ dữ liệu cũ nếu có |
| Không có quyền | Thiếu `lots.read` | Trang 403 với thông báo chung AUTH-403 (README) |
| Ngày đã khóa | Ngày đang xem `locked` | Ẩn form tiếp nhận và form đánh giá; banner `締め済みのため閲覧のみ / Ngày đã khóa sổ: chỉ xem` |
| Ngày cũ chưa khóa / mở lại | Ngày đang xem `closing` hoặc `reopened` | Ẩn form tiếp nhận (lô mới chỉ vào ngày hiện tại); form đánh giá vẫn dùng được (sửa bản ghi đã có, ADR-009 §2) |
| Ngày chưa mở | Không có ngày `open` | Banner + link SCR-024 `業務日を開始してください / Hãy mở ngày nghiệp vụ` |
| Mất mạng | `navigator.onLine = false` hoặc fetch lỗi mạng | Tiếp nhận: lưu IndexedDB, dòng mới mang nhãn `未同期`; Đánh giá: nút khóa, thông báo chung NET-01 |
| Đang gửi | Chờ POST | Nút quay, khóa nút để chống bấm đôi |
| Thành công | 201 / 200 | Toast `ロット {code} を受け付けました / Đã tiếp nhận lô {code}`; xóa F-03, F-04, F-06, giữ F-02 cho lô kế tiếp; focus về F-04 |
| Đồng bộ lỗi | Server từ chối bản ghi queue | Dòng đỏ ở vùng 未同期 + link màn hình hòa giải (ADR-010) |

## 7. Hành động

| Nút / thao tác | Quyền | Bật khi | Gọi API | Kết quả thành công | Kết quả lỗi |
|---|---|---|---|---|---|
| `受付 / Tiếp nhận` (Enter) | `lots.create` | Ngày `open`, F-02..F-06 hợp lệ | `POST /api/lots` `{day, seller_id, shipper, item_code, qty, client_ref}` → `fn_create_lot` | 201 + lô; audit `create` trong cùng giao dịch (ADR-006) | 400 + thông báo của hàm, giữ nguyên dữ liệu đã nhập |
| Lưu offline (tự động) | `lots.create` | Mất mạng khi bấm Tiếp nhận | — (IndexedDB) | Dòng `TMP-…`, `未同期` | Hết dung lượng: `端末に保存できません / Không lưu được trên máy` |
| Đồng bộ (tự động khi có mạng) | `lots.create` | Hàng đợi khác rỗng | `POST /api/lots` lần lượt theo thời gian lưu | Đổi mã tạm → mã chính thức; audit `sync` | Ghi vào danh sách hòa giải, không xóa bản ghi queue |
| `評価を登録 / Lưu đánh giá` | `lots.inspect` | Ngày của lô `open` / `closing` / `reopened`, có mạng | `POST /api/lots/{id}/inspection` `{grade, note, reason}` → `fn_inspect_lot` (G-04) | 200; audit `inspect` có before/after/reason | 400 + thông báo |
| In nhãn lô | `lots.read` | Lô đã có mã chính thức | trình duyệt in | Nhãn mã lô + mặt hàng | — |

## 8. Phân quyền hiển thị

| Vai trò | Thấy màn hình | Thấy vùng / cột | Thao tác được |
|---|---|---|---|
| `intake` | Có | Form tiếp nhận, bảng, vùng 未同期 | Tiếp nhận, in nhãn |
| `judge` | Có | Bảng, chi tiết, form đánh giá | Ghi / sửa đánh giá |
| `trade` | Có | Bảng, chi tiết (chỉ đọc) | Đi tới nhập giao dịch |
| `delivery`, `settlement`, `approver`, `sys_admin` | Có | Bảng, chi tiết (chỉ đọc) | Không |
| `market_ops` | Có (chỉ đọc) | Bảng, chi tiết | Không (vai trò giả định, G-16) |
| `rule_admin` (đích) | Không | — | — (quản lý danh mục `items` ở màn hình quy tắc, không ở đây) |

## 9. Quy tắc nghiệp vụ và điểm phân nhánh

**9.1 Tiếp nhận lô (`fn_create_lot`, tầng D):**

| # | Điều kiện | Hành vi | Căn cứ |
|---|---|---|---|
| 1 | 業務日 không phải ngày hiện tại (`fn_assert_current_day`: chưa mở / đã khóa / khác ngày `open`) | Chặn; ngày khóa → raise `LOCKED_DAY`, API ghi `audit_logs.action = 'blocked_edit'` qua `fn_log_blocked_edit` | BC-43, ADR-006, ADR-009 |
| 2 | Bên bán `kind ≠ wholesaler` | Chặn | TBL-ACTOR-01 |
| 3 | Đăng ký chợ của bên bán `suspended` tại 業務日 | Chặn | BC-10 (S, Q33) |
| 4 | Đăng ký chợ hết hạn (`valid_to < 業務日`) | Theo `fn_rule('seller_registration_check', 業務日)`: `suspension_only` (mặc định, S) → cho qua; `full` → chặn | BC-10 giả định (S), cấu hình ADR-008 |
| 5 | `client_ref` đã tồn tại | Trả lô đã có (200), không tạo mới | ADR-010, BC-76 |
| 6 | Hợp lệ | Sinh mã từ `doc_counters(day,'lot')` (G-18), `available_qty = initial_qty`, audit trong giao dịch | BC-31, BC-81 |

Lưu ý: prototype kiểm bên bán bằng `fn_participant_block_reason` (cả hạn lẫn tạm dừng) — chặt hơn BC-10; giữ hành vi này bằng `full` nếu khách chọn ở Q33.

**9.2 Đánh giá (`fn_inspect_lot`, tầng D):**

| Tình huống | Hành vi | Căn cứ |
|---|---|---|
| Ngày của lô đã khóa | `fn_assert_day_editable` chặn + log `blocked_edit`; sửa đánh giá sau khóa không có đường (không ảnh hưởng tiền) → câu hỏi Q-012-2 | BC-43, G-04 |
| Ngày của lô `closing` / `reopened` | Cho sửa (bản ghi đã có của ngày); với `reopened`, audit ghi kèm `reopen_request_id` | ADR-009 §2, BC-48 |
| Lô chưa có giao dịch | Ghi hạng; `inspected_by` = người bấm | BC-29 |
| Lô đã có giao dịch (bất kỳ trạng thái) | Bắt buộc F-13; audit lưu hạng trước/sau + lý do (thao tác nhạy cảm của JUDGE) | BC-47, BC-81 |
| Lô chưa đánh giá mà có người chốt giao dịch | **Không chặn**: RFP không nói 下見 bắt buộc trước 公開 | BC-38 (Q32) |
| Bất kỳ | Không có trường ảnh→hạng, không có auto-grade, không có duyệt hàng loạt | BC-27, BC-29 |

**9.3 Offline (ADR-010, BC-77):** chỉ tiếp nhận chạy offline. Đánh giá cần mạng (không thuộc Plan A của Q15). Bản ghi queue giữ `day` = ngày hiện tại lúc lưu (đọc từ `/api/business-days/current` gần nhất); nếu khi đồng bộ ngày đó không còn là ngày hiện tại (đã khóa hoặc đã sang ngày mới) → vào hòa giải (SCR-054, chưa có spec), **không** tự chuyển sang ngày mới.

## 10. Tiêu chí nghiệm thu

1. **Tiếp nhận bình thường.** Given ngày 2026-10-16 `open`, bên bán W-001 `active`, mặt hàng `MAGURO` đơn vị `kg`; When `intake` nhập 120 và bấm 受付; Then tạo lô `L261016-NNN`, `available_qty = 120`, đơn vị `kg` lấy từ `items`, có 1 dòng `audit_logs(action=create)` cùng giao dịch.
2. **Bên bán tạm dừng.** Given W-002 (卸売業者) có 市場登録 `status = suspended`; When tiếp nhận lô của W-002; Then 400 `W-002 … 一時停止中のため入荷を受け付けできません / … đang bị tạm dừng…`, không có dòng `lots` mới.
3. **Bên bán không phải 卸売業者.** Given gửi `seller_id` của M-001 qua API (bỏ qua UI); Then 400 `売り手は卸売業者を選択してください / Bên bán phải là 卸売業者`.
4. **Ngày đã khóa.** Given ngày 2026-10-15 `locked`, ngày 2026-10-16 `open`; When POST `/api/lots` với `day = 2026-10-15`; Then 400 thông báo ngày đã khóa, và có 1 dòng `audit_logs(action=blocked_edit, entity=lot)`.
5. **Đồng bộ offline trùng.** Given lô lưu offline với `client_ref = X`, request đầu đã tới server nhưng mất phản hồi; When hàng đợi gửi lại cùng `client_ref = X`; Then chỉ có 1 lô, lần hai trả 200 cùng `lots.id`, nhãn 未同期 biến mất.
6. **Đồng bộ vào ngày đã khóa.** Given lô lưu offline cho 2026-10-15, ngày bị khóa trước khi có mạng; When đồng bộ; Then bản ghi bị từ chối, nằm trong danh sách hòa giải với lý do ngày đã khóa, không tạo lô ở ngày 2026-10-16.
7. **Sửa đánh giá sau khi có giao dịch.** Given lô đã có 1 giao dịch `confirmed`, hạng A; When `judge` đổi sang B không nhập lý do; Then 400 `取引済みロットの評価修正には理由が必要です / …`; When nhập lý do; Then 200 và audit có `before.grade = A`, `after.grade = B`, `reason`.
8. **Người quyết định là người.** Given bất kỳ lô; Then màn hình không có nút/ô nào tự đề xuất hạng, và `inspected_by` luôn bằng id người đã bấm Lưu.
9. **Chưa đánh giá vẫn bán được.** Given lô `受付` chưa có hạng; When `trade` chốt giao dịch trên lô; Then không bị chặn vì thiếu đánh giá.

## 11. Khác prototype LAB-2 và việc cần làm

| G-xx | Hiện tại | Cần đổi |
|---|---|---|
| G-04 | API `update lots` thẳng; đánh giá được lô ngày đã khóa; kiểm "đã có giao dịch" ở API | Hàm `fn_inspect_lot(p_lot, p_grade, p_note, p_reason, p_actor)`: chặn ngày khóa, lý do bắt buộc ở D |
| G-05 | Hạng A/B/C và đơn vị `kg/thùng/con/khay` hardcode ở UI/API | Đọc `fn_rule('grades', 業務日)`; đơn vị theo `items` |
| G-15 | `item`, `unit` text tự do | Bảng `items`; `lots.item_code` FK; đơn vị chỉ đọc |
| G-06 | Audit ghi sau ở API, không log lần bị chặn | Audit trong `fn_create_lot` / `fn_inspect_lot`; log `blocked_edit` |
| G-13 | `lots.status` lưu cứng, không cập nhật khi điều chỉnh | Suy ra trạng thái (mục 4) |
| G-18 | Mã lô = `count(*)+1` | `doc_counters(day,'lot')` |
| G-20 | Không có offline | IndexedDB queue + `client_ref UNIQUE` trên `lots` |
| G-02 | Bộ chọn ngày không dựa trên ngày nghiệp vụ | Mặc định từ `/api/business-days/current`; lô mới chỉ vào ngày hiện tại |
| G-14 | `created_by`, `inspected_by` không FK | FK `profiles(id)` |

## 12. Câu hỏi mở

- **Q33** (kiểm bên bán): đang dùng `suspension_only` (S). Đổi bằng `rule_values.seller_registration_check`.
- **Q32** (ai ghi 下見, có bắt buộc trước 公開): giả định không bắt buộc, chỉ `judge` ghi.
- **Q9** (đơn vị): một mặt hàng một đơn vị, không quy đổi (Plan A).
- **Q-012-1 (mới):** 荷主 có cần danh mục riêng không? Giả định: text tự do, bắt buộc.
- **Q-012-2 (mới):** sửa đánh giá của lô thuộc ngày đã khóa có cần đường riêng (không qua bút toán vì không đổi tiền)? Giả định: chặn.
- **Q-012-3 (mới):** sửa thông tin lô sau xác nhận (thao tác nhạy cảm của INTAKE, BC-47) chưa thiết kế ở màn hình này; đề xuất dùng chung luồng SCR-022.
