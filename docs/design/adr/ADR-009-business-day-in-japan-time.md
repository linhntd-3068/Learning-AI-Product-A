# ADR-009: Ngày nghiệp vụ (業務日) theo giờ Nhật, mở ngày là một thao tác tường minh

- **Trạng thái:** Đề xuất cho thiết kế đích. Sửa điểm lệch của prototype. Viết lại sau review 06 Mục 1 (bản trước bị trả lại vì có hai định nghĩa "ngày hiện tại").
- **Ngày:** 16/10/2026

## Bối cảnh
- **Ngày nghiệp vụ không phải ngày lịch:** dùng JST (BC-39). Giao dịch, khóa sổ, báo cáo, khuyến khích đều gắn với ngày nghiệp vụ.
- **Giờ mở ngày** nằm trong khung 02:00–02:30 JST, không có mốc chính xác (BC-40). Khóa sổ thường xong khoảng 10:00 (02-07).
- **Batch báo cáo ngày** phải xong trước 11:00 (BC-42).
- **Lịch chợ:** 6 ngày/tuần, trừ ngày nghỉ theo lịch chợ (BC-41).
- **Giao hàng** có thể vắt qua hai kỳ khóa sổ; mỗi lần giao có ngày riêng (BC-50).
- **Prototype đang lệch ba chỗ:**
  - chốt giao dịch kiểm tư cách theo `business_day` của lô, mà lô có thể thuộc một ngày cũ còn mở;
  - giao hàng kiểm theo `current_date` của Postgres (giờ UTC);
  - màn hình lấy "hôm nay" bằng `toISOString()` (UTC). Từ 00:00 đến 09:00 JST, "hôm nay" trên màn hình vẫn là ngày hôm trước.
- Prototype không có màn hình hay API mở ngày mới: ngày chỉ có từ dữ liệu mẫu.

## Quyết định

### 1. Một định nghĩa duy nhất: ngày nghiệp vụ hiện tại
- **Ngày nghiệp vụ hiện tại** = ngày **duy nhất** có `business_days.status = 'open'`. Hàm `fn_current_business_date()` trả ngày đó, hoặc `NULL` khi không có ngày nào `open` (ví dụ từ lúc khóa ~10:00 tới lúc mở ngày sau ~02:00).
- **Tối đa một ngày `open` tại một thời điểm** (giả định S). Ràng buộc ở D: partial unique index trên `business_days(status) where status = 'open'`.
- API `GET /api/business-days/current` trả `{ day, status }` của ngày hiện tại, hoặc `{ day: null, suggested_day }` khi chưa có ngày mở (`suggested_day` tính theo đồng hồ, mục 4). Màn hình **không** tự tính "hôm nay".

### 2. Trạng thái ngày và việc được ghi trên từng trạng thái

| `business_days.status` | Ý nghĩa | Được ghi gì |
|---|---|---|
| `open` (営業中) | Ngày hiện tại | Mọi bản ghi mới: lô, giao dịch, lần giao, bút toán điều chỉnh `-R`/`-A`; sửa trực tiếp bản ghi của ngày (hủy giao dịch, sửa đánh giá) |
| `closing` (締め待ち) | Ngày cũ chưa khóa, đã thôi là ngày hiện tại vì ngày sau đã được mở (mục 5) — giả định S | Không nhận bản ghi mới; chỉ sửa trực tiếp bản ghi đã có của ngày và khóa |
| `reopened` (締め解除中) | Ngày đã khóa được mở lại có duyệt (BC-48, SCR-024) | **Không** phải ngày hiện tại. Không nhận bản ghi mới; chỉ nhận các sửa trực tiếp mà yêu cầu mở lại đã được duyệt để làm (hủy giao dịch, sửa đánh giá lô của ngày đó), mỗi lần ghi audit kèm `reopen_request_id`; phải khóa lại |
| `locked` (締め済) | Đã khóa | Không gì cả. Mọi lần cố ghi bị chặn và ghi `blocked_edit` (ADR-006) |

Hai hàm kiểm ở D, dùng chung cho mọi hàm ghi:
- `fn_assert_current_day(p_day)` — cho bản ghi **mới**: `p_day` phải bằng `fn_current_business_date()`. Sai thì raise `LOCKED_DAY` (ngày đã khóa), `DAY_NOT_OPEN` (chưa có ngày mở / ngày chưa mở) hoặc `NOT_CURRENT_DAY` (ngày khác ngày hiện tại).
- `fn_assert_day_editable(p_day)` — cho **sửa trực tiếp** bản ghi đã có: chấp nhận `open`, `closing`, `reopened`; `locked` → `LOCKED_DAY`. Thay cho `fn_assert_day_open` as-built.

### 3. Ngày của từng loại bản ghi

| Bản ghi | `business_date` | Kiểm tư cách theo ngày | Nguồn |
|---|---|---|---|
| Lô (`lots.business_day`) | Ngày hiện tại lúc ghi | — (bên bán kiểm theo ngày này) | BC-31, BC-39 |
| Giao dịch 相対 / せり | = `business_day` của lô; lô **phải** thuộc ngày hiện tại. Lô của ngày trước không giao dịch được — giả định S, khóa `allow_trade_on_previous_day_lots` (mặc định `false`, ADR-008) | Ngày hiện tại (= ngày của lô) | BC-06, BC-31 |
| Lần giao (`deliveries.business_date`) | Ngày hiện tại lúc ghi; có thể khác ngày của giao dịch | Ngày của lần giao, `purpose='deliver'` (ADR-007) | BC-50, BC-62 |
| Bút toán điều chỉnh `-R` / `-A` | Ngày hiện tại lúc duyệt cấp cuối | — | ADR-005, BC-44 |
| Bản ghi offline đồng bộ sau (lô, lần giao) | Ngày hiện tại **lúc lưu ở máy**; khi đồng bộ, ngày đó phải vẫn là ngày hiện tại, nếu không → vào màn hình hòa giải, không tự chuyển sang ngày mới | Như dòng tương ứng | ADR-010 |

Hệ quả với BC-06: vì giao dịch chỉ được ghi trên lô của ngày hiện tại, "tư cách tại ngày của lô" và "tư cách tại ngày hiện tại" luôn là một — điểm lệch đầu tiên của prototype biến mất. Nếu khách cần bán tiếp lô của ngày trước (bật `allow_trade_on_previous_day_lots`), giao dịch vẫn ghi vào ngày hiện tại và tư cách vẫn kiểm theo ngày hiện tại; chỉ tồn lô được mang sang.

Ghi chú tư cách / hồ sơ (SCR-010) không gắn ngày nghiệp vụ nên ghi được cả khi không có ngày mở. Khi cần một ngày để so (ví dụ "hạn mới phải sau ngày nghiệp vụ"), dùng **ngày nghiệp vụ tham chiếu** = `coalesce(fn_current_business_date(), max(business_days.day))` — giả định S, không dùng đồng hồ.

### 4. Đồng hồ chỉ dùng cho cảnh báo và gợi ý
- `fn_business_date(ts)` = ngày lịch của `(ts at time zone 'Asia/Tokyo') - business_day_start_time`. Mốc `business_day_start_time` (mặc định `'02:00'`, giả định S theo BC-40) là khóa của `system_settings` (ADR-008).
- Chỉ được dùng cho: cảnh báo trên dashboard / sắp hết hạn (BC-07), và gợi ý ngày cần mở (`suggested_day`).
- **Không bao giờ** dùng để quyết một thao tác ghi có hợp lệ hay không. Mọi kiểm hợp lệ dùng mục 1–3.

### 5. Mở ngày `fn_open_day(p_day, p_actor, p_reason)`
- Quyền `days.open` (ADR-004; mặc định `intake`, `settlement`).
- Chặn nếu `p_day` là ngày nghỉ trong `market_calendar`, đã có trong `business_days`, hoặc không lớn hơn ngày nghiệp vụ mới nhất.
- `p_day` khác `suggested_day`: chỉ cảnh báo ở màn hình, người mở phải xác nhận (không chặn ở D, vì đồng hồ không quyết hợp lệ).
- **Ngày trước chưa khóa** (còn `open` hoặc `reopened`): **cho mở, kèm cảnh báo và lý do bắt buộc** (`p_reason`) — giả định S, cấu hình bằng khóa `previous_day_unlocked_policy` ∈ `warn_with_reason` (mặc định) | `block`. Ngày `open` cũ chuyển sang `closing` trong cùng giao dịch SQL để giữ "tối đa một ngày `open`"; ngày `reopened` giữ nguyên trạng thái, vẫn chờ khóa lại.
- Lý do lưu ở `business_days.open_reason` và trong `audit_logs` (`action = 'open_day'`).

### 6. Thứ tự kiểm khi chốt giao dịch
Theo đúng bảng 01 §9.1 (tư cách → bên bán → tồn → ngày). Lần bị chặn vì ngày đã khóa luôn ghi `blocked_edit` theo ADR-006, bất kể bước nào.

### 7. Thêm bảng `market_calendar(day, is_holiday, note)`.

## Phương án đã cân nhắc
| Phương án | Bỏ vì |
|---|---|
| `DATE(created_at)` làm ngày nghiệp vụ | Sai cho giao dịch 00:00–02:00 và mọi chỗ dùng UTC (bẫy T9) |
| Ngày hiện tại = `fn_business_date(now())` theo đồng hồ | Lúc 02:00–02:30 chưa ai mở ngày, đồng hồ đã sang ngày mới; khi ngày trước chưa khóa, hai cách cho hai ngày khác nhau (lỗi C-01 của review) |
| Cho nhiều ngày `open` cùng lúc, chọn ngày trên form | Người nhập chọn nhầm ngày cũ thì tư cách bị xét theo ngày cũ; đối soát và khóa rối |
| Chặn mở ngày khi ngày trước chưa khóa | Sáng hôm sau mà quên khóa thì cả chợ đứng; RFP không có quy tắc này. Để thành cấu hình (`block`) nếu khách muốn |
| Tự mở ngày bằng cron lúc 02:00 | Ngày nghỉ, ngày chưa khóa hôm trước cần người quyết; vẫn có thể thêm cron gọi `fn_open_day` sau này |

## Hệ quả
- (+) Một định nghĩa ngày duy nhất trong toàn hệ thống; hết lệch UTC; tư cách lúc chốt luôn xét theo ngày hiện tại.
- (+) Lỗi "chọn nhầm ngày cũ" không xảy ra được: màn hình nhập không còn bộ chọn ngày.
- (−) Thêm màn hình / nút "Mở ngày nghiệp vụ", bảng lịch chợ, trạng thái `closing`.
- (−) Từ lúc khóa (~10:00) tới lúc mở ngày sau (~02:00) không có ngày hiện tại: duyệt cấp cuối yêu cầu điều chỉnh (sinh `-R`/`-A`) phải chờ ngày sau mở. Duyệt các cấp trước vẫn làm được. Nếu khách cần ghi bút toán ngay sau 10:00, cần câu hỏi mới (Q-009-1).
- (−) Các truy vấn "hôm nay" ở dashboard phải đổi sang ngày nghiệp vụ.
