# SCR-029/030 — Ghi giao hàng & ngoại lệ (引渡し記録・例外処理)

Wireframe: [05-wireframes#scr-029](../05-wireframes/index.html#scr-029). As-built: `src/app/(app)/deliveries/page.tsx` (SCR-028 danh sách), `deliveries/[tradeId]/page.tsx`, `src/app/api/trades/[id]/deliveries/route.ts`, `src/lib/api/delivery-status.ts`, `fn_record_delivery`. ADR: ADR-004, ADR-006, ADR-007, ADR-008, ADR-009, ADR-010.

> **Bẫy thuật ngữ 完納 (BC-65, T6):** màn hình này **không** dùng chữ 完納. Hoàn tất giao hàng là `引渡し完了` / cột `delivery_complete`. 完納 trong 完納奨励金 là **trả tiền đủ, đúng hạn** (`payment_complete`) — khái niệm khác, trạng thái khác, không chung enum. Không ai được hiển thị "完納" trên màn hình giao hàng.

## 1. Mục đích và người dùng

- Nhân viên giao hàng (`delivery`) ghi **từng lần giao** của một giao dịch đã chốt; hệ thống cộng dồn đã giao và báo phần còn lại (BC-53, BC-54).
- Ghi **ngoại lệ** (giao thiếu, giao thừa, trả hàng, hủy một phần) có lý do và **người xác nhận** (BC-56). Ngoại lệ **có tranh chấp** được đánh dấu bằng cờ `disputed` và chỉ đóng khi một người khác người ghi quyết định giải quyết (BC-57, 4 điểm bắt buộc có người quyết của BC-29).
- Kiểm lại tư cách người mua **lúc giao** (BC-62, bảng 01 §9.2).
- Thời điểm: 05:00–08:00 JST cao điểm cập nhật giao hàng (02-07); thay 14 cuộc gọi hỏi tình trạng/ngày (BC-61). Bến giao hàng mất mạng 3–5 lần/tuần → offline queue (ADR-010).
- Màn hình tranh chấp đầy đủ (loại, SLA, RPT-09 — FR-SETTLE-03, SCR-026/027) **để giai đoạn sau**; v1 chỉ có cờ và người giải quyết trên ngoại lệ giao hàng.

## 2. Điều kiện vào màn hình

- Đường dẫn: `/deliveries/{tradeId}`; vào từ danh sách giao hàng `/deliveries` (SCR-028) hoặc chi tiết giao dịch `/trades/{id}`.
- Quyền xem: `trades.read` hoặc `deliveries.record`. Quyền ghi: `deliveries.record`. Tải file: `attachments.upload` (mới, ADR-004).
- Giao dịch phải là dòng sống: `status = confirmed` và `qty > 0` (dòng gốc hoặc dòng `-A`). Dòng `cancelled`, `reversed`, `-R` → hiện chỉ đọc kèm link tới dòng `-A` hiện hành.
- **Chuỗi giao dịch:** dòng gốc và các dòng `-A` nối qua `reverses_id` là một chuỗi (SCR-022 §2). Mở màn hình từ dòng nào trong chuỗi cũng thấy cùng lũy kế.

## 3. Bố cục

1. Header: `引渡し / Giao hàng · {trade.code}`, mặt hàng, người mua, 業務日 hiện tại, chỉ báo mạng + số bản ghi 未同期.
2. Băng cảnh báo tư cách (khi có): màu vàng (cho giao kèm cờ) hoặc đỏ (chặn), mục 9.3.
3. Thẻ tình trạng 4 ô lớn: `販売数量 / Đã bán`, `引渡し累計 / Đã giao (ròng)`, `残数量 / Còn lại`, `状態 / Trạng thái`.
4. Form ghi nhận: chọn loại (giao / ngoại lệ), số lượng, loại ngoại lệ, lý do, cờ tranh chấp; nút lớn cho tablet (BC-64).
5. Bảng lịch sử: lần, loại, số lượng, 業務日 của lần giao, người ghi, người xác nhận, tranh chấp, trạng thái đồng bộ.
6. Danh sách ngoại lệ mở / tranh chấp chưa giải quyết với nút `確認 / Xác nhận`, `係争にする / Đánh dấu tranh chấp`, `係争を解決 / Giải quyết tranh chấp`.

## 4. Dữ liệu hiển thị

Mọi tổng dưới đây tính trên **mọi `deliveries` có `trade_id` thuộc chuỗi** (gốc + các `-A`, bỏ `-R`), để lần giao ghi trên dòng gốc trước khi điều chỉnh vẫn được tính sau khi dòng sống là `-A`.

| Mục | Nguồn | Định dạng | Ghi chú |
|---|---|---|---|
| Đã bán | `trades.qty` của dòng sống trong chuỗi | số + `items.unit` | |
| Đã giao (ròng) | Σ`delivery` − Σ`return` đã xác nhận | số | Đích; prototype chỉ cộng `delivery` |
| Đã xử lý thiếu | Σ`short` + Σ`partial_cancel` đã xác nhận | số | Phần không giao nữa |
| Còn lại | `Đã bán − đã giao ròng − đã xử lý thiếu`, không âm | số, in đậm | BC-54 |
| Giao thừa | Σ`over` đã xác nhận | số | Hiện riêng, không trừ vào còn lại |
| Trạng thái | suy ra (mục 9.1) | `待機 / 引渡し中 / 完了 / 例外` | BC-53; không lưu cứng |
| 業務日 của lần giao | `deliveries.business_date` | `YYYY-MM-DD` | BC-50, có thể khác ngày giao dịch |
| Người ghi / xác nhận | `recorded_by`, `confirmed_by`, `confirmed_at` → `profiles` | tên, `HH:mm` | |
| Tranh chấp | `disputed`, `dispute_note`, `dispute_resolved_by`, `dispute_resolved_at`, `dispute_resolution_note` | nhãn đỏ `係争中` / xám `係争解決済` | Mới (03 §2) |
| Cờ tư cách | `deliveries.qualification_flag` | nhãn vàng `失効後引渡し` | mục 9.3 |

## 5. Field nhập

| ID | Nhãn (JP / VI) | Kiểu | Bắt buộc | Mặc định | Nguồn lựa chọn | Validation (tầng) | Thông báo lỗi |
|---|---|---|---|---|---|---|---|
| F-01 | 区分 / Loại | segmented | Có | `delivery` | `delivery`, `exception` | Thuộc tập (A, D CHECK) | `区分が不正です / Loại ghi nhận không hợp lệ` |
| F-02 | 数量 / Số lượng | number 0.01 | Có | = còn lại (khi `delivery`) | — | `> 0` (C, A, D CHECK); `delivery`: ≤ còn lại (D) | `数量は0より大きい値を入力してください / Số lượng phải lớn hơn 0` ; `残数量は{n}です。超過分は「過剰引渡し」として例外登録してください / Chỉ còn {n} cần giao; giao vượt phải ghi là ngoại lệ "giao thừa"` |
| F-03 | 例外種別 / Loại ngoại lệ | select | Có khi F-01 = `exception` | trống | `short 不足`, `over 過剰`, `return 返品`, `partial_cancel 一部取消` | Thuộc tập (A, D CHECK) | `例外種別を選択してください / Chọn loại ngoại lệ` |
| F-04 | 例外数量の上限 (không phải ô nhập) | — | — | — | — | `short`/`partial_cancel` ≤ còn lại; `return` ≤ đã giao ròng (D) | `返品数量が引渡し累計を超えています / Số trả hàng vượt số đã giao` ; `不足・一部取消の数量が残数量を超えています / Số thiếu/hủy một phần vượt số còn lại` |
| F-05 | 理由 / Lý do | textarea ≤ 500 | Có khi `exception` | trống | — | Không rỗng (C, A, D) | `例外には理由の入力が必要です / Ngoại lệ phải có lý do` |
| F-06 | 証跡 / Ảnh, chứng từ | file (jpg/png/pdf ≤ 10 MB), qua `POST /api/attachments` | Không | — | `attachments` | Định dạng, cỡ (C, A) | `添付できるのはJPG/PNG/PDF（10MBまで）です / Chỉ đính kèm JPG/PNG/PDF tối đa 10 MB` |
| F-07 | 解決コメント / Ý kiến giải quyết tranh chấp | textarea ≤ 500 | Có khi bấm 係争を解決 | trống | — | Không rỗng (C, A, D) | `係争の解決にはコメントが必要です / Giải quyết tranh chấp phải có ý kiến` |
| F-08 | client_ref (ẩn) | uuid | Có | sinh ở máy | — | Duy nhất (D UNIQUE) | — (trùng = trả bản ghi đã có) |
| F-09 | 係争あり / Có tranh chấp | checkbox | Không (chỉ hiện khi F-01 = `exception`) | bỏ chọn | — | Chỉ với `exception` (A, D CHECK) | `係争は例外にのみ設定できます / Chỉ ngoại lệ mới đánh dấu tranh chấp được` |
| F-10 | 係争内容 / Nội dung tranh chấp | textarea ≤ 500 | Có khi F-09 tích (hoặc khi bấm 係争にする) | trống | — | Không rỗng (C, A, D) | `係争内容を入力してください / Nhập nội dung tranh chấp` |
| F-11 | 確認コメント / Ý kiến xác nhận ngoại lệ | text ≤ 200 | Không | trống | — | Độ dài (C, A) | — |

`business_date` của lần giao **không nhập**: server gán = `fn_current_business_date()` (ngày `open` duy nhất, ADR-009) — không dùng đồng hồ. Bản ghi offline mang `business_date` = ngày hiện tại đọc từ `/api/business-days/current` gần nhất lúc lưu; khi đồng bộ, nếu ngày đó không còn là ngày hiện tại → vào hòa giải (SCR-054, chưa có spec), không tự chuyển ngày.

## 6. Trạng thái màn hình

| Trạng thái | Điều kiện | Hiển thị / hành vi |
|---|---|---|
| Đang tải | Chờ `GET /api/trades/{id}` | Skeleton 4 ô |
| Trống | Chưa có lần giao | Bảng: `引渡し記録はまだありません / Chưa có lần giao nào`; trạng thái `待機` |
| Lỗi tải | ≠ 2xx | Banner đỏ + `再読込` |
| Không có quyền | Thiếu cả 2 quyền xem | 403 với AUTH-403 |
| Chưa có ngày hiện tại | Không có ngày `open` | Form khóa: `業務日が開始されていません / Chưa mở ngày nghiệp vụ`; vẫn xem được |
| Ngày đã khóa | Ngày hiện tại vừa bị khóa (API trả lỗi ngày khóa) | Form khóa: `本日の業務日は締め済みです / Ngày nghiệp vụ hiện tại đã khóa sổ`; ngày của **giao dịch** đã khóa thì **vẫn ghi được** vào ngày hiện tại (BC-50) |
| Bị chặn tư cách | mục 9.3 trả `block` | Băng đỏ, ẩn loại `delivery`; vẫn ghi được ngoại lệ |
| Mất mạng | offline | Ghi vào queue, dòng `未同期`; nút xác nhận / tranh chấp khóa với NET-01 |
| Đang gửi | POST | Khóa nút, spinner |
| Thành công | 201 | Toast `{n}{unit} の引渡しを記録しました / Đã ghi giao {n}`; F-02 đặt lại = còn lại mới |
| Hoàn tất | còn lại = 0, không ngoại lệ mở, không tranh chấp chưa giải quyết | Ô trạng thái xanh `引渡し完了`; form chỉ còn loại `exception` (cho `return`) |

## 7. Hành động

| Nút / thao tác | Quyền | Bật khi | Gọi API | Kết quả thành công | Kết quả lỗi |
|---|---|---|---|---|---|
| `記録 / Lưu` | `deliveries.record` | Form hợp lệ, có ngày hiện tại | `POST /api/trades/{id}/deliveries` `{kind, qty, exception_type, note, disputed, dispute_note, client_ref, attachment_ids}` → `fn_record_delivery` | 201 + dòng; audit `deliver` / `delivery_exception` trong giao dịch | 400 + thông báo hàm |
| Lưu offline (tự động) | `deliveries.record` | Mất mạng | IndexedDB | Dòng `未同期` | — |
| Đồng bộ | `deliveries.record` | Có mạng, queue ≠ rỗng | Cùng API, theo thứ tự lưu | Audit `sync` | Vào màn hình hòa giải |
| `確認 / Xác nhận ngoại lệ` | `deliveries.record` | Ngoại lệ chưa xác nhận, có mạng | `POST /api/deliveries/{id}/confirm` `{comment}` → `fn_confirm_delivery_exception` | `confirmed_by`, `confirmed_at`, `confirm_comment`; số liệu tính lại | 400 |
| `係争にする / Đánh dấu tranh chấp` | `deliveries.record` | Ngoại lệ chưa `disputed` (đã hoặc chưa xác nhận), có mạng | `POST /api/deliveries/{id}/dispute` `{dispute_note}` → `fn_flag_delivery_dispute` | `disputed = true`, `dispute_note`; audit | 400 |
| `係争を解決 / Giải quyết tranh chấp` | `deliveries.record` | `disputed = true`, chưa giải quyết, người bấm ≠ `recorded_by`, có mạng | `POST /api/deliveries/{id}/resolve-dispute` `{resolution_note}` (F-07) → `fn_resolve_delivery_dispute` | `dispute_resolved_by`, `dispute_resolved_at`, `dispute_resolution_note`; audit | 400: `例外を記録した本人は係争を解決できません / Người ghi ngoại lệ không được tự giải quyết tranh chấp` |
| `修正申請へ / Tạo yêu cầu điều chỉnh` | `corrections.request` | Có ngoại lệ đã xác nhận làm đổi tiền | Điều hướng SCR-022 với `trade_id`, `impact=delivery` | — | — |

Thiếu quyền → 403 AUTH-403.

## 8. Phân quyền hiển thị

| Vai trò | Thấy màn hình | Thấy vùng / cột | Thao tác được |
|---|---|---|---|
| `delivery` | Có | Tất cả | Ghi giao, ghi + xác nhận ngoại lệ, đánh dấu / giải quyết tranh chấp (không phải ngoại lệ mình ghi) |
| `trade`, `settlement`, `approver` | Có (chỉ đọc) | Tất cả | `settlement`: nút tạo yêu cầu điều chỉnh |
| `sys_admin`, `market_ops` | Có (chỉ đọc, có `trades.read`) | Tất cả | Không |
| `intake`, `judge` | Không (không có `trades.read`) | — | Không |
| `rule_admin` (đích) | Không | — | — |

## 9. Quy tắc nghiệp vụ và điểm phân nhánh

**9.1 Trạng thái giao hàng (suy ra, BC-53/54/55/57):** `例外` nếu có ngoại lệ chưa xác nhận **hoặc** ngoại lệ `disputed = true` chưa giải quyết; ngược lại `完了` nếu còn lại = 0; `引渡し中` nếu đã giao ròng > 0; còn lại `待機`. Không có nút "ép hoàn tất" (BC-55).

**9.2 Tác động của từng loại ngoại lệ — giả định (S), `fn_rule('delivery_exception_effects', business_date)`:**

| Loại | Lúc ghi | Sau khi xác nhận | Đổi `trades.qty` / tồn lô? |
|---|---|---|---|
| `short 不足` | Mở, chặn `完了` | Trừ vào còn lại (không giao nữa) | **Không**. Đổi tiền → SCR-022 |
| `partial_cancel 一部取消` | Mở | Trừ vào còn lại | **Không**. Trả tồn lô → SCR-022 (ADR-005) |
| `return 返品` | Mở | Trừ đã giao ròng → còn lại tăng | **Không** |
| `over 過剰` | Mở | Ghi nhận phần thừa, không đổi còn lại | **Không**. Tăng SL → SCR-022 (kiểm tồn ở D) |

Giá trị mặc định của khóa (ADR-008):

```json
{"short":{"reduces":"remaining","changes_trade":false},"partial_cancel":{"reduces":"remaining","changes_trade":false},"return":{"reduces":"delivered","changes_trade":false},"over":{"reduces":null,"changes_trade":false}}
```

RFP chỉ đòi lý do + người xác nhận (BC-56); tác động tồn/tiền không được nêu, nên mọi thay đổi số tiền / tồn đi qua yêu cầu điều chỉnh có duyệt — không sửa trực tiếp.

**9.3 Kiểm tư cách người mua lúc giao (BC-08, BC-62, 01 §9.2; Q31)** — `fn_qualification_block_reason(buyer, business_date, 'deliver')` (ADR-007; không có hàm riêng cho giao hàng), theo `basis_type`, ngày = `business_date` của lần giao (= ngày hiện tại, G-02). Hàm trả `block | allow_with_flag | allow`:

| Tư cách lúc giao | Kết quả (`delivery_expired_policy`, mặc định S) | Thông báo |
|---|---|---|
| Còn hiệu lực | `allow` | — |
| Hết hạn (luôn là **sau** khi giao dịch đã chốt, vì lúc chốt đã kiểm) | `allow_with_flag` (mặc định): cho giao, `qualification_flag = expired_after_confirm`, thông báo `settlement` (照合事務局); policy `block`: chặn | Vàng: `{name} の{許可/承認/取引地点登録}は{date}に失効しています。確定済み取引のため引渡しを記録し、照合事務局に通知しました / {許可/承認/取引地点登録} của {name} đã hết hiệu lực ngày {date}; vì giao dịch đã chốt trước đó nên vẫn ghi giao và đã báo bộ phận đối soát` |
| Đang tạm dừng (一時停止) hoặc 再審査 | `block` loại `delivery`; cho ghi ngoại lệ; người quyết xử lý tiếp | Đỏ: `{name} の{許可/承認/取引地点登録}は一時停止中のため引渡しできません。例外として記録してください / {許可/承認/取引地点登録} của {name} đang bị tạm dừng, không giao được; hãy ghi ngoại lệ` |
| Đã gỡ (解除後) | Kiểm lại như "còn hiệu lực" | — |

Thông báo dùng đúng nhãn căn cứ như SCR-010: 許可 (仲卸) / 承認 (売買参加者) / 取引地点登録 (買出人), không gộp chung "giấy phép" (BC-01, G-01). Mốc hạn theo `qualification_valid_to_inclusive`.

**9.4 Các chặn khác (tầng D, `fn_record_delivery`):**

| # | Điều kiện | Hành vi | Căn cứ |
|---|---|---|---|
| 1 | Giao dịch không sống (`cancelled`, `reversed`, `-R`) | Chặn: `この取引は引渡し対象ではありません / Giao dịch này không còn hiệu lực để giao` | BC-32 |
| 2 | Không có ngày hiện tại / ngày ghi đã khóa (`fn_assert_current_day`) | Chặn; ngày khóa → raise `LOCKED_DAY`, API ghi `blocked_edit` qua `fn_log_blocked_edit`: `業務日{date}は締め済みのため記録できません / Ngày {date} đã khóa sổ, không ghi được` | BC-43, G-03, ADR-006, ADR-009 |
| 3 | `delivery` vượt còn lại | Chặn, hướng dẫn ghi `over` | BC-55 |
| 4 | Số lần giao của chuỗi ≥ `max_deliveries_per_trade` (mặc định null = không giới hạn) | Chặn: `引渡し回数の上限（{n}回）に達しました / Đã đạt số lần giao tối đa ({n})` | BC-59 (S) |
| 5 | `client_ref` đã có | Trả bản ghi cũ, không thêm | ADR-010 |
| 6 | `disputed = true` với `kind = delivery` | Chặn (F-09) | BC-57 |

**9.5 Tranh chấp (BC-57, tối thiểu cho 8 màn hình lõi; giả định S cho chi tiết):**

| Tình huống | Hành vi |
|---|---|
| Đánh dấu tranh chấp | Khi ghi ngoại lệ (F-09) hoặc sau đó bằng 係争にする; bắt buộc `dispute_note` |
| Xác nhận ngoại lệ (`確認`) | Ghi nhận sự việc (BC-56); **không** đóng tranh chấp. Người xác nhận khác người ghi chỉ khi `exception_confirm_by_other = true` (mặc định `false`, S) |
| Giải quyết tranh chấp | Người quyết **luôn khác** người đã ghi ngoại lệ (tinh thần quyết định độc lập BC-29), bắt buộc F-07; ghi `dispute_resolved_by/at` |
| Chưa giải quyết | Giao dịch ở `例外`, không `完了`; SCR-024 CK-5 đếm; dòng xuất kế toán `保留` (SCR-024 §9.4) |

## 10. Tiêu chí nghiệm thu

Dữ liệu chung: ngày nghiệp vụ hiện tại = 2026-10-16 (`open`). Mỗi tiêu chí tự chuẩn bị dữ liệu nêu trong Given (README).

1. **Giao nhiều lần.** Given giao dịch 100 kg chưa có lần giao; When ghi 40 rồi 60; Then sau lần 1 còn lại 60, `引渡し中`; sau lần 2 còn lại 0, `引渡し完了`; không chỗ nào hiện chữ 完納.
2. **Giao thừa.** Given còn lại 10; When ghi `delivery` 12; Then 400 `残数量は10です…`; When ghi ngoại lệ `over` 2 có lý do; Then tạo dòng ngoại lệ mở, trạng thái `例外` đến khi có người xác nhận.
3. **Ngoại lệ thiếu lý do.** Given form loại `exception`; When gửi API không có `note`; Then 400 `例外には理由の入力が必要です / …`.
4. **Ngoại lệ phải có người xác nhận.** Given ngoại lệ `short` 5 đã ghi trên giao dịch 100 kg đã giao 50; Then trạng thái `例外`, còn lại 50; When `delivery` bấm 確認; Then `confirmed_by` = người bấm, còn lại 45, `trades.qty` và `lots.available_qty` không đổi.
5. **Tư cách hết hạn giữa lúc chốt và lúc giao.** Given M-002 (仲卸) có 許可 `valid_to` = 2026-10-15, giao dịch của M-002 chốt ngày 2026-10-15; When giao ở ngày hiện tại 2026-10-16 với policy mặc định; Then ghi thành công, `qualification_flag = expired_after_confirm`, 1 thông báo tới `settlement`, banner vàng nêu "許可"; With policy `block`; Then 400 và không có dòng mới.
6. **Người mua đang tạm dừng.** Given M-004 (仲卸) có 許可 `status = suspended`; When ghi `delivery`; Then 400 thông báo tạm dừng nêu 許可; When ghi ngoại lệ; Then cho phép.
7. **Ngày hiện tại đã khóa.** Given ngày 2026-10-16 bị khóa sau khi trang đã mở; When POST delivery; Then 400 ngày đã khóa và có `audit_logs(action=blocked_edit)`.
8. **Giao dịch của ngày đã khóa, giao hôm nay.** Given giao dịch ngày 2026-10-15 (`locked`), ngày 2026-10-16 `open`; When ghi giao; Then thành công với `business_date = 2026-10-16`.
9. **Đồng bộ offline trùng.** Given lần giao lưu offline `client_ref = Y` đã tới server nhưng mất phản hồi; When queue gửi lại; Then chỉ có 1 dòng `deliveries`, lũy kế không bị cộng đôi.
10. **Ngày theo ngày nghiệp vụ, không theo đồng hồ.** Given ngày 2026-10-16 `open`, lúc 2026-10-16 07:30 JST (= 2026-10-15 22:30 UTC); When ghi giao; Then `business_date = 2026-10-16` và tư cách kiểm theo 2026-10-16. Given 2026-10-16 đã khóa và chưa mở ngày 2026-10-17, lúc 2026-10-17 02:10 JST; When ghi giao; Then 400 `業務日が開始されていません`, không gán ngày theo đồng hồ.
11. **Tranh chấp phải có người khác giải quyết.** Given user D1 ghi ngoại lệ `short` 5 với F-09 tích và nội dung tranh chấp; Then trạng thái `例外`; When D1 bấm 係争を解決; Then 400 `例外を記録した本人は係争を解決できません…`; When D2 giải quyết không có F-07; Then 400; When D2 có F-07; Then `dispute_resolved_by = D2`, và sau khi ngoại lệ được xác nhận, còn lại = 0 thì `引渡し完了`.
12. **Tranh chấp chưa giải quyết chặn hoàn tất.** Given giao dịch đã giao đủ, có ngoại lệ đã xác nhận nhưng `disputed = true` chưa giải quyết; Then trạng thái `例外`, không `完了`; SCR-024 CK-5 đếm 1.
13. **Lũy kế theo chuỗi.** Given giao dịch gốc 100 đã giao 60, sau đó được duyệt điều chỉnh thành `-A` 90; When mở `/deliveries/{id của -A}`; Then Đã bán 90, Đã giao 60, Còn lại 30.

## 11. Khác prototype LAB-2 và việc cần làm

| G-xx | Hiện tại | Cần đổi |
|---|---|---|
| G-02 | Kiểm tư cách theo `current_date` (UTC) | Theo `deliveries.business_date` = ngày hiện tại (ADR-009) |
| G-03 | `fn_record_delivery` không chặn ngày khóa | Chặn + log `blocked_edit` |
| G-12 | `return`/`partial_cancel` không đổi gì; một ngoại lệ là `例外` vĩnh viễn | Bảng 9.2; ngoại lệ có `confirmed_by`, đóng được; cờ tranh chấp + người giải quyết |
| G-01 | Một thông báo chung cho mọi căn cứ | Thông báo theo 許可 / 承認 / 取引地点登録 qua `fn_qualification_block_reason(..., 'deliver')` |
| G-05 | Chính sách hết hạn lúc giao hardcode (chặn mọi trường hợp) | `delivery_expired_policy`, `max_deliveries_per_trade`, `delivery_exception_effects`, `exception_confirm_by_other` trong `rule_values` |
| G-06 | Audit sau ở API | Trong hàm, cùng giao dịch |
| G-20 | Không có offline | Queue + `deliveries.client_ref UNIQUE` |
| G-14 | `recorded_by` không FK | FK `profiles(id)`; thêm `confirmed_by`, `dispute_resolved_by` |
| — | Lũy kế chỉ theo `trade_id` của một dòng | Lũy kế theo chuỗi `reverses_id` |

## 12. Câu hỏi mở

- **Q31:** hành vi khi tư cách hết hạn sau chốt — đang dùng `allow_with_flag` (S).
- **Q14:** số lần giao tối đa, ai xác nhận từng lần, khi nào phản ánh vào quyết toán — mặc định không giới hạn; mỗi lần giao do người ghi tự xác nhận.
- **Q30:** liên kết 引渡し完了 với 完納奨励金 — không liên kết trong màn hình này.
- **Q13:** loại tranh chấp và SLA — v1 chỉ có cờ `disputed` + người giải quyết; màn hình tranh chấp đầy đủ (SCR-026/027) để giai đoạn sau.
- **Q-029-1 (mới):** người xác nhận ngoại lệ có phải khác người ghi? Giả định không bắt buộc; khóa `exception_confirm_by_other` (mặc định `false`). Người giải quyết tranh chấp thì luôn khác người ghi (S).
- **Q-029-2 (mới):** ai được giải quyết tranh chấp — giả định S: người có `deliveries.record` khác người ghi; nếu khách muốn giao cho bộ phận đối soát thì đổi quyền ở ma trận (ADR-004).
