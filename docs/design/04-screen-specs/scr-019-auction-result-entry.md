# SCR-019 — Ghi kết quả đấu giá (せり結果入力)

Wireframe: [../05-wireframes/index.html#scr-019](../05-wireframes/index.html#scr-019) · Ràng buộc: BC-06, BC-24, BC-27, BC-28, BC-29, BC-31, BC-32, BC-33, BC-35, BC-39, BC-43, BC-77, BC-81 · Bảng quyết định 01 §9.1 · ADR: ADR-004, ADR-006, ADR-007, ADR-008, ADR-009, ADR-010 · Gap: G-01, G-02, G-05, G-06, G-07, G-14, G-18, G-20, G-22

> **Đây không phải hệ thống đấu giá.** Không phòng đấu giá thời gian thực, không bid trực tuyến, không WebSocket, không OCR / nhận dạng 手やり・符丁 từ ảnh (BC-27, SCOPE-OUT-02, bẫy T1, T5). Màn hình chỉ **ghi kết quả cuối** do con người nhập, có **người xác nhận** bắt buộc, **chọn tường minh mỗi lần** (BC-28, BC-29, G-22).

## 1. Mục đích và người dùng
- Ghi kết quả せり (FORM-SERI-01): người thắng (落札者), số lượng, đơn giá, thời điểm, người xác nhận (BC-27). Mỗi dòng kết quả là một giao dịch `kind='auction'`, cùng mã nghiệp vụ `T<YYMMDD>-NNNN` với 相対 (BC-31).
- Ai dùng: vai trò `trade` (người nhập). Người xác nhận là 運営者 / せり進行役 (BC-28) — giả định S: là một tài khoản nội bộ có quyền `auction.record`.
- Lúc dùng: **sau mỗi phiên せり**, nhập **từng dòng** từ sổ ghi của người điều hành (giả định S theo BC-35, Q10). Luồng phụ ~10% (BC-24): ~70–120 dòng/ngày, không phải màn hình cao điểm nhưng vẫn rơi vào 02:30–05:00.

## 2. Điều kiện vào màn hình
- Đường dẫn `/auction`. Quyền `auction.record`.
- Menu: mục **thứ hai** trong nhóm 取引, sau 相対 (BC-24); nhãn `せり結果入力`, không dùng chữ "đấu giá trực tuyến".
- Đi tới: `/trades/{id}` từ bảng kết quả; `/participants/{id}` từ thông báo từ chối.

## 3. Bố cục
1. **Header**: `せり結果入力 / Ghi kết quả đấu giá`; dòng phụ cố định `せりの最終結果のみを記録します（入札機能はありません） / Chỉ ghi kết quả cuối, không có chức năng bid`; 業務日 hiện tại (chỉ đọc, ADR-009); nhãn mạng.
2. **Vùng thông báo** (`role="alert"`).
3. **Form một dòng kết quả**: ロット → 落札者 → 数量 → 落札単価 → 落札時刻 → 確認者 → 備考 → [記録].
4. **Bảng kết quả せり đã ghi** của 業務日 hiện tại (mới nhất trước, toàn bộ trong ngày).

Không có: ô tải ảnh, ô "giá hiện tại", đồng hồ đếm ngược, danh sách người đặt giá.

## 4. Dữ liệu hiển thị
| Mục | Nguồn (bảng.cột / API) | Định dạng | Ghi chú |
|---|---|---|---|
| 業務日 hiện tại | `GET /api/business-days/current` | `YYYY/MM/DD (曜)` | ADR-009; ngày `open` duy nhất, không có bộ chọn ngày |
| Lô có thể ghi | `GET /api/lots?day={d}&available=1` (d = ngày hiện tại) | `L260716-031 · 本マグロ · 残 1 本` | Như SCR-016 |
| 落札者 | `GET /api/participants?purpose=buy&day={d}` | `B-001 · 白熊スーパー（売買参加者）` + cờ theo căn cứ | Người không hợp lệ vẫn chọn được để lý do hiện rõ |
| 確認者 | `GET /api/users?permission=auction.record&active=1` (mới; API yêu cầu quyền `auction.record`, chỉ trả `profiles.id, full_name`) | tên | Chỉ người thật, đang hoạt động |
| Thành tiền dự tính | client `round(qty × unit_price)` | `¥…（税抜）` | Số chính thức: `trades.amount` |
| Bảng kết quả | `GET /api/trades?kind=auction&day={d}` | mã, 落札時刻, lô, 落札者, SL, đơn giá, thành tiền, 確認者, người nhập, trạng thái | Liên kết `/trades/{id}` |

## 5. Field nhập
| ID | Nhãn (JP / VI) | Kiểu | Bắt buộc | Mặc định | Nguồn lựa chọn | Validation (tầng) | Thông báo lỗi |
|---|---|---|---|---|---|---|---|
| F-01 | 業務日 / Ngày nghiệp vụ | chỉ đọc | Có | `fn_current_business_date()` | — | D lấy ngày của lô, kiểm `fn_assert_current_day` (bước 6) | RJ-10, RJ-11, RJ-14 |
| F-02 | ロット / Lô | combobox (mã, mặt hàng) | Có | rỗng (không giữ lô: mỗi lô thường một dòng せり, S) | lô của ngày hiện tại có `available_qty > 0` | Đã chọn (C, A); tồn tại (D) | V016-01, RJ-12 |
| F-03 | 落札者 / Người thắng | combobox (mã, tên) | Có | rỗng | người tham gia nhóm bên mua | Đã chọn (C, A); tư cách theo §9 (D) | V019-02, RJ-00…RJ-08a |
| F-04 | 数量 / Số lượng (`{unit}`) | số thập phân, 2 chữ số lẻ | Có | `available_qty` của lô (S: thường bán cả lô) | — | > 0 (C, A, D); ≤ tồn (D) | V016-03, RJ-09 |
| F-05 | 落札単価 / Đơn giá trúng (¥, 税抜) | số nguyên | Có | rỗng | — | ≥ 0 (C, A, D) | V016-04 |
| F-06 | 落札時刻 / Thời điểm chốt せり | time `HH:mm` (JST) | Có | giờ hiện tại làm tròn phút | — | Định dạng (C); ghép với 業務日 thành timestamp, nằm trong [業務日 + `business_day_start_time`, now] (A, D) | V019-06 |
| F-07 | 確認者 / Người xác nhận | select | **Có** | **trống** ở dòng đầu mỗi lần mở form; sau khi ghi thành công thì giữ người đã chọn tay ở dòng trước. **Không bao giờ** tự điền người đang đăng nhập | danh sách 確認者 (§4) | Có giá trị (C, A, D); `profiles.active` và có `auction.record` (D) | V019-07, V019-08 |
| F-08 | 備考 / Ghi chú | text ≤ 200 | Không | rỗng | — | Độ dài (C, A) | V016-05 |
| (ẩn) | `client_ref` | UUID v4 | Có | mới cho mỗi dòng | — | UNIQUE (D) | — |

V016-01, V016-03…V016-05 là câu của [SCR-016 §5](scr-016-negotiated-trade-entry.md#5-field-nhập), dùng lại vì câu giống hệt. Mã riêng của màn hình này (câu khác SCR-016):

| Mã | JP | VI |
|---|---|---|
| V019-02 | 落札者を選択してください。 | Chọn người thắng. |
| V019-06 | 落札時刻は業務日の開始以降、現在時刻以前で入力してください。 | Thời điểm chốt phải từ lúc mở 業務日 tới hiện tại. |
| V019-07 | 確認者を選択してください。せり結果は確認者なしで記録できません。 | Chọn người xác nhận. Không ghi được kết quả せり khi thiếu người xác nhận. |
| V019-08 | 選択した確認者は無効か、せり結果を確認する権限がありません。 | Người xác nhận đã chọn bị khóa hoặc không có quyền xác nhận kết quả せり. |
| V019-09 | 確認者は記録者と別の人を選択してください。 | Người xác nhận phải khác người nhập. (chỉ khi `auction_confirmer_must_differ = true`) |
| V019-13 | ネットワークに接続されていません。せり結果の記録にはオンライン接続が必要です。入力内容は端末に下書き保存しました。 | Mất mạng. Ghi kết quả せり cần có mạng. Nội dung đã lưu nháp trên máy. |

## 6. Trạng thái màn hình
| Trạng thái | Điều kiện | Hiển thị / hành vi |
|---|---|---|
| Đang tải | Chờ ngày / lô / người / 確認者 | Form disabled |
| Trống | Không còn lô có hàng trong ngày | `記録できるロットがありません / Không còn lô để ghi`; bảng kết quả vẫn hiện |
| Lỗi tải | 5xx | `データを読み込めませんでした / Không tải được dữ liệu` + 再読み込み |
| Không có quyền | Thiếu `auction.record` | Màn hình 403 với AUTH-403 |
| Chưa mở ngày | `/api/business-days/current` trả `day = null` | RJ-11; form disabled; liên kết SCR-024 |
| Ngày đã khóa | API trả RJ-10 | RJ-10; form disabled; liên kết SCR-022 |
| Mất mạng | offline / lỗi mạng | Nút 記録 disabled, V019-13; dòng đang nhập lưu nháp `localStorage` (`auction-draft:{userId}`, không lưu F-07); **không** xếp hàng (ADR-010) |
| Đang gửi | Chờ POST | Nút `記録中…`, disabled |
| Thành công | 201 / 200 (trùng `client_ref`) | S-02 `{code} のせり結果を記録しました / Đã ghi kết quả せり {code}`; xóa F-02…F-06, F-08; **giữ F-07 đã chọn tay**; focus F-02; tải lại lô + bảng |
| Bị từ chối | 400 RJ-xx / V0xx-xx | Câu JP + VI nguyên văn; giữ mọi field; focus field liên quan |

## 7. Hành động
| Nút / thao tác | Quyền | Bật khi | Gọi API | Kết quả thành công | Kết quả lỗi |
|---|---|---|---|---|---|
| 記録 / Ghi kết quả (Enter) | `auction.record` | Online, có ngày hiện tại, F-07 có giá trị, không đang gửi | `POST /api/trades {kind:"auction", lot_id, buyer_id, qty, unit_price, result_at, confirmed_by, note, client_ref}` → `fn_confirm_trade` | 201, giao dịch `confirmed`, S-02 | 400 RJ-xx / V0xx-xx; 401 (hết phiên / M-06); 403 AUTH-403 |
| クリア / Xóa dòng (Esc) | — | Luôn | — | Xóa dòng đang nhập (giữ F-07 đã chọn tay) và nháp | — |

Không có thao tác "nhập hàng loạt", "nhập từ ảnh / CSV" hay "tự xác nhận" (BC-29, bẫy T19). Hủy / sửa kết quả: ở chi tiết giao dịch `/trades/{id}` (SCR-018, chưa có spec; 取消 trước khóa sổ, sau khóa qua SCR-022) như 相対.

Permission chọn theo `kind` trong body: `auction` → `auction.record`, ngược lại `trades.create` (như `src/app/api/trades/route.ts`). Thiết kế đích: API đọc body **một lần**, kiểm `kind` trước, rồi mới gọi `guard` (bỏ `request.clone()`).

## 8. Phân quyền hiển thị
| Vai trò | Thấy màn hình | Thấy vùng / cột | Thao tác được |
|---|---|---|---|
| sys_admin | Không | — | — |
| market_ops | Không | — | — |
| intake | Không | — | — |
| judge | Không | — | — |
| trade | Có | Tất cả | Ghi kết quả; được chọn làm 確認者 |
| delivery | Không | — | — |
| settlement | Không (xem ở danh sách giao dịch / đối soát) | — | — |
| approver | Không | — | — |
| rule_admin (đích) | Không | — | — |

Danh sách 確認者 = mọi người có `auction.record` qua `role_permissions` (ADR-004); nếu chợ tạo vai trò riêng cho せり進行役 thì chỉ cần gán quyền này, không đổi code.

## 9. Quy tắc nghiệp vụ và điểm phân nhánh
Cùng hàm `fn_confirm_trade` với SCR-016, cùng **thứ tự 01 §9.1** và **cùng mã / câu RJ-00…RJ-14** (bảng chung ở [SCR-016 §9](scr-016-negotiated-trade-entry.md#9-quy-tắc-nghiệp-vụ-và-điểm-phân-nhánh)): 許可 hết hạn (RJ-01) và 承認 đang 再審査 (RJ-05) vẫn là hai câu khác nhau. Với せり, `{取引種別}` của RJ-00 = せり; ma trận đọc `trade_kind_matrix.auction` (mặc định: 仲卸, 売買参加者, 買出人 — giống 相対, ADR-008). Kiểm riêng của せり chạy **trước** bảng chung (là kiểm đầu vào của phiếu):

| # | Điều kiện | Mã | Tầng / nguồn |
|---|---|---|---|
| a | Thiếu `confirmed_by`, hoặc không phải profile đang hoạt động có `auction.record` | V019-07 / V019-08 | A, D; BC-28 |
| b | `auction_confirmer_must_differ = true` và `confirmed_by = recorded_by` | V019-09 | D; giả định S |
| c | `result_at` ngoài [業務日 + `business_day_start_time` (system_settings, mặc định 02:00), now] | V019-06 | A, D; BC-27, ADR-009 |
| 0–6 | Như bảng chung (nhóm → tư cách theo căn cứ → bên bán → tồn → ngày) | RJ-00…RJ-14 | D |
| 7 | Đạt | — | D |

Ngày đã khóa (RJ-10): API ghi `audit_logs.action = 'blocked_edit'` qua `fn_log_blocked_edit` (ADR-006), như SCR-016.

Bước 7 trong cùng giao dịch SQL: trừ tồn lô; sinh mã từ `doc_counters`; `INSERT trades` với `kind='auction'`, `buyer_id` = 落札者, `confirmed_by` = F-07 (**không** mặc định bằng người gọi ở tầng D — phải truyền tường minh), `recorded_by` = người đang đăng nhập, `result_at`, `rule_set_id = fn_rule_set(business_date)`, `client_ref`; ghi `audit_logs` (`action='record_auction'`, after có cả `confirmed_by` và `recorded_by`).

Ghi chú:
- **確認者 không có mặc định** (G-22, BC-28/29): mặc định bằng người nhập thì một phím Enter là xong, quay lại đúng lỗi G-22. Dòng đầu mỗi lần mở form phải chọn tay; các dòng sau giữ lựa chọn tay đó để nhập nhanh cả phiên.
- **Người xác nhận có thể trùng người nhập** nếu chọn tay (giả định S): RFP chỉ đòi có người xác nhận là người thật (BC-28), không đòi tách người. Muốn tách: bật `auction_confirmer_must_differ` (mặc định `false`, ADR-008).
- **Không có trạng thái 確認待ち chờ người khác** ở v1: dòng ghi vào là `確定` ngay vì người xác nhận đã được nêu tên trên phiếu (BC-32, S). Không có chế độ auto-confirm.
- Kiểm tư cách và tồn vẫn chạy cho せり (BC-06, BC-33): người điều hành có thể đã gõ búa cho người hết hạn — hệ thống từ chối ghi và hiện lý do; xử lý ngoài hệ thống do người quyết (BC-29).
- Thời điểm nhập (trong phiên hay sau phiên) chưa chốt (Q10): màn hình hỗ trợ cả hai vì mỗi dòng độc lập.

## 10. Tiêu chí nghiệm thu
Dữ liệu chung: ngày nghiệp vụ hiện tại = 2026-10-16 (`open`). Mỗi tiêu chí tự chuẩn bị dữ liệu nêu trong Given (README).
1. **Given** màn hình `/auction`, **Then** không có field ảnh, không có giá "hiện tại", không có danh sách bid, không có kết nối WebSocket nào được mở.
2. **Given** lô L-031 của ngày 2026-10-16 còn 1 本 và 売買参加者 B-001 có 承認 `valid` đến 2026-12-31, **When** user X ghi 1 本 × ¥820,000, 落札時刻 03:12, 確認者 = user Y, **Then** 201, `trades.kind='auction'`, `confirmed_by=Y`, `recorded_by=X`, `result_at` = 2026-10-16 03:12 JST, lô còn 0.
3. **Given** gọi API trực tiếp không có `confirmed_by`, **Then** 400 V019-07 và không có dòng `trades` mới.
4. **Given** 確認者 là tài khoản `active=false` hoặc vai trò `delivery`, **When** ghi, **Then** 400 V019-08.
5. **Given** 落札者 là 仲卸 M-003 có 許可 `valid_to` = 2026-10-15, **Then** 400 RJ-01; **Given** 落札者 là 売買参加者 B-003 có 承認 `status = re_review`, **Then** 400 RJ-05 — hai câu khác nhau, đều không trừ tồn.
6. **Given** lô còn 20 kg, **When** ghi 25 kg, **Then** 400 RJ-09.
7. **Given** 業務日 2026-10-16 bị khóa sau khi trang đã mở, **When** ghi, **Then** 400 RJ-10, hướng tới yêu cầu điều chỉnh, và `audit_logs` có đúng một dòng `action = 'blocked_edit'` (entity `trade`, actor = người nhập).
8. **Given** 落札時刻 = 1 giờ sau hiện tại, **Then** 400 V019-06.
9. **Given** máy mất mạng, **When** nhấn Enter, **Then** không có request, V019-13, nháp dòng còn sau khi tải lại.
10. **Given** vai trò chỉ có `trades.create` (không có `auction.record`), **When** POST `kind:"auction"`, **Then** 403 AUTH-403.
11. **Given** đã ghi thành công một dòng với F-07 = Y chọn tay, **Then** F-07 vẫn là Y, focus về ロット để nhập dòng tiếp.
12. **Given** mở `/auction` lần đầu (hoặc tải lại trang), **Then** F-07 trống; **When** điền đủ mọi field khác và bấm 記録, **Then** bị chặn với V019-07, không có request ghi.

## 11. Khác prototype LAB-2 và việc cần làm
| G-xx | Hiện tại | Cần đổi |
|---|---|---|
| G-01 | Kiểm tư cách chung một bộ trạng thái cho mọi căn cứ | `fn_qualification_block_reason` theo căn cứ, RJ-01…RJ-07 |
| G-02 | Cờ người thắng tính theo ngày UTC ở client | Server tính theo 業務日 JST |
| G-05 | Không có `trade_kind_matrix`; `wholesaler` bị chặn bằng hardcode | `rule_values` (mặc định ba nhóm bên mua, như 相対) |
| G-06 | Audit ghi ở API sau commit; không log lần bị chặn | Ghi trong hàm, cùng giao dịch; `blocked_edit` qua `fn_log_blocked_edit` |
| G-07 | Ngày mặc định = ngày mới nhất trong danh sách | `/api/business-days/current`, không có bộ chọn ngày |
| G-14 | `confirmed_by` uuid trơn | FK `profiles(id)`; thêm `recorded_by` FK |
| G-18 | Mã = `count(*)+1` | `doc_counters` |
| G-20 | Không phát hiện mất mạng | Chặn ghi khi offline, nháp cục bộ, `client_ref` |
| G-22 | `confirmed_by` luôn = người gọi API; không có field 確認者; không lưu thời điểm chốt せり | Thêm F-06 `result_at`, F-07 `confirmed_by` bắt buộc **không mặc định**, cột `trades.result_at`, `trades.recorded_by`; API `/api/users?permission=` (yêu cầu `auction.record`) |
| — | Form chung với 相対 (`TradeEntryForm kind="auction"`), giữ lô sau khi ghi | Tách component hoặc thêm prop cho hai field mới; không giữ lô |

## 12. Câu hỏi mở
- **Q10**: nhập trong phiên hay gộp sau phiên — v1 hỗ trợ nhập từng dòng bất kỳ lúc nào khi có ngày hiện tại.
- せり進行役 có tài khoản hệ thống không: giả định S là có (vai trò có `auction.record`). Nếu không, cần đổi F-07 thành tên tự do + người nhập chịu trách nhiệm — trái BC-28, phải hỏi khách (câu hỏi mới).
- Người xác nhận có phải khác người nhập không: RFP im lặng → mặc định không bắt buộc, khóa cấu hình `auction_confirmer_must_differ`.
- **§1.1**: ma trận nhóm × せり không có trong RFP; mặc định cho phép cả ba nhóm bên mua có tư cách hiệu lực.
