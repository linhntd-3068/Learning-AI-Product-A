# SCR-016 — Nhập giao dịch thỏa thuận (相対取引入力)

Wireframe: [../05-wireframes/index.html#scr-016](../05-wireframes/index.html#scr-016) · Ràng buộc: BC-06, BC-09, BC-10, BC-11, BC-24, BC-26, BC-31…BC-34, BC-37, BC-39, BC-43, BC-64, BC-70, BC-77, BC-80, BC-81 · Bảng quyết định 01 §9.1 · ADR: ADR-004, ADR-006, ADR-007, ADR-008, ADR-009, ADR-010 · Gap: G-01, G-02, G-05, G-06, G-07, G-14, G-15, G-18, G-20, G-24

## 1. Mục đích và người dùng
- Ghi và **chốt** (確定) giao dịch 相対 — **luồng chính, ~90% giao dịch** (BC-24). Phiếu FORM-TRADE-01: người mua, số lượng, đơn giá, 確定者 (BC-26).
- Ai dùng: vai trò `trade` (nhân viên giao dịch của chợ). Giả định S (BC-34, Q8): chỉ nhân viên chợ nhập và chốt; nhân viên 卸売業者 không nhập trực tiếp.
- Lúc dùng: **cao điểm 02:30–05:00 JST**, nhập liên tục. Tải thiết kế (BC-80): 700–1.200 giao dịch/ngày, ~90% là 相対 → tới ~1.080 lần chốt trong 2,5 giờ (≈ 7 lần/phút toàn chợ), nhiều máy cùng lúc.
- Mục tiêu tốc độ (giả định S): một giao dịch nhập xong **chỉ bằng bàn phím, ≤ 15 giây**; API chốt p95 ≤ 2 giây (cùng mức NFR-PERF của tìm kiếm). Chạy trên tablet hiện trường và máy dùng chung (BC-64).

## 2. Điều kiện vào màn hình
- Đường dẫn `/trades/new`. Quyền `trades.create`.
- Là mục **đầu tiên** trong menu nhóm 取引 và phím tắt mặc định sau đăng nhập của vai trò `trade` (BC-24: 相対 là luồng mặc định, せり là màn hình phụ).
- Đi tới: `/trades/{id}` (bấm mã giao dịch trong bảng), `/participants/{id}` (liên kết trong thông báo từ chối tư cách).

## 3. Bố cục
1. **Header**: tiêu đề `相対取引入力 / Nhập giao dịch thỏa thuận`; 業務日 hiện tại (chỉ đọc, không có bộ chọn ngày — ADR-009); nhãn trạng thái mạng (オンライン / オフライン).
2. **Vùng thông báo** (`role="alert"`, `aria-live`): kết quả chốt gần nhất hoặc lý do từ chối.
3. **Form một hàng** (tablet: hai hàng): ロット → 買受人 → 数量 → 単価 → 備考 → [確定]; dưới ô lô hiện "残 {n}{unit}"; cạnh nút hiện thành tiền dự tính.
4. **Bảng giao dịch 相対 vừa chốt** của 業務日 hiện tại (15 dòng mới nhất).

## 4. Dữ liệu hiển thị
| Mục | Nguồn (bảng.cột / API) | Định dạng | Ghi chú |
|---|---|---|---|
| 業務日 hiện tại | `GET /api/business-days/current` (ADR-009) | `YYYY/MM/DD (曜)` | Ngày `open` duy nhất; không tự tính "hôm nay" ở client. Không có ngày `open` → trạng thái "Chưa mở ngày" (§6) |
| Lô còn hàng | `GET /api/lots?day={d}&available=1` (d = ngày hiện tại) → `lots.code, item_code→items.name, items.unit, available_qty` | `L260716-012 · 本マグロ · 残 120 kg` | Tải lại sau mỗi lần chốt và mỗi 30 giây (S). Chỉ lô của ngày hiện tại (khóa `allow_trade_on_previous_day_lots = false`, ADR-008) |
| Người mua | `GET /api/participants?purpose=buy&day={d}` → `code, name, kind, state.status, state.basis_type` | `M-001 · 丸吉商店（仲卸）` + cờ | Cờ: `⚠ 許可失効` / `⚠ 承認再審査中` / `⚠ 取引地点登録期限切れ` … theo căn cứ (`fn_qualification_state`, ADR-007); người không hợp lệ **vẫn chọn được** để lý do từ chối hiện rõ (như bản hiện tại) |
| Thành tiền dự tính | client: `round(qty × unit_price)` | `¥1,234,000（税抜）` | Chỉ để xem; số chính thức là `trades.amount` do DB sinh. Thuế theo mặt hàng, không áp 110/100 (BC-70) |
| 確定者 | Người đang đăng nhập (`/api/me`) | tên | Ghi vào `trades.confirmed_by` |
| Bảng gần đây | `GET /api/trades?kind=negotiated&day={d}&limit=15` | mã, giờ chốt, lô, người mua, SL, đơn giá, thành tiền, trạng thái | Mã liên kết `/trades/{id}` |

## 5. Field nhập
| ID | Nhãn (JP / VI) | Kiểu | Bắt buộc | Mặc định | Nguồn lựa chọn | Validation (tầng) | Thông báo lỗi |
|---|---|---|---|---|---|---|---|
| F-01 | 業務日 / Ngày nghiệp vụ | chỉ đọc | Có | `fn_current_business_date()` | — | Không gửi từ client; D lấy ngày của lô và kiểm bằng `fn_assert_current_day` (bước 6) | RJ-10, RJ-11, RJ-14 |
| F-02 | ロット / Lô | combobox, gõ mã hoặc tên mặt hàng, lọc tức thì | Có | giữ lô vừa dùng | lô của ngày hiện tại có `available_qty > 0` | Đã chọn (C, A); lô tồn tại (D) | V016-01, RJ-12 |
| F-03 | 買受人 / Người mua | combobox, gõ mã hoặc tên | Có | giữ người mua vừa dùng | người tham gia nhóm bên mua (§9 bước 0) | Đã chọn (C, A); tư cách theo §9 (D) | V016-02, RJ-00…RJ-08a |
| F-04 | 数量 / Số lượng (`{unit}` của lô) | số thập phân, `inputmode=decimal`, 2 chữ số lẻ | Có | rỗng | — | > 0 (C, A, D); ≤ `available_qty` (C chỉ nhắc, D quyết) | V016-03, RJ-09 |
| F-05 | 単価 / Đơn giá (¥, 税抜) | số nguyên, `inputmode=numeric` | Có | rỗng | — | Số nguyên ≥ 0 (C, A, D) | V016-04 |
| F-06 | 備考 / Ghi chú | text ≤ 200 | Không | rỗng | — | Độ dài (C, A) | V016-05 |
| (ẩn) | `client_ref` | UUID v4 | Có | sinh mới mỗi lần form sạch | — | UNIQUE (D: `trades.client_ref`) | — (gửi lại trả bản ghi cũ) |

Đơn vị số lượng là đơn vị của mặt hàng, không quy đổi (BC-37). Ô số lượng hiện đơn vị ngay trong nhãn.

**Lỗi nhập (V016)**:

| Mã | JP | VI |
|---|---|---|
| V016-01 | ロットを選択してください。 | Chọn lô. |
| V016-02 | 買受人を選択してください。 | Chọn người mua. |
| V016-03 | 数量は0より大きい数値で入力してください（小数点以下2桁まで）。 | Số lượng phải lớn hơn 0 (tối đa 2 chữ số lẻ). |
| V016-04 | 単価は0以上の整数（円）で入力してください。 | Đơn giá là số nguyên ≥ 0 (yên). |
| V016-05 | 備考は200文字以内で入力してください。 | Ghi chú tối đa 200 ký tự. |

## 6. Trạng thái màn hình
| Trạng thái | Điều kiện | Hiển thị / hành vi |
|---|---|---|
| Đang tải | Chờ ngày / lô / người mua | Form disabled, khung xương cho bảng |
| Trống | Ngày hiện tại không còn lô có hàng | Ô lô hiện `販売可能なロットがありません / Không còn lô có hàng`; nút 確定 disabled |
| Lỗi tải | 5xx khi tải lô / người mua | Thông báo `データを読み込めませんでした / Không tải được dữ liệu` + nút 再読み込み; nháp giữ nguyên |
| Không có quyền | Thiếu `trades.create` | Màn hình 403 với AUTH-403 (README) |
| Chưa mở ngày | `/api/business-days/current` trả `day = null` | Thông báo RJ-11; form disabled; liên kết SCR-024 (mở ngày) |
| Ngày đã khóa | Ngày bị khóa giữa chừng (API trả RJ-10) | Thông báo RJ-10; form disabled; liên kết tới yêu cầu điều chỉnh (SCR-022) |
| Mất mạng | `navigator.onLine=false` hoặc lỗi mạng khi gửi | Nhãn header đỏ; nút 確定 disabled; thông báo RJ-13; nháp lưu cục bộ, **không** xếp hàng chốt (BC-77, ADR-010) |
| Đang gửi | Chờ `POST /api/trades` | Nút `確定中…`, disabled; Enter lần hai bị bỏ qua |
| Thành công | 201 (hoặc 200 khi trùng `client_ref`) | Thông báo xanh S-01; xóa F-04/F-05/F-06, giữ F-02/F-03, focus F-04; tải lại lô và bảng; sinh `client_ref` mới |
| Bị từ chối | 400 với mã RJ-xx | Thông báo đỏ nguyên văn JP + VI; **giữ nguyên** mọi field; focus vào field liên quan (RJ-00…RJ-08a → F-03, RJ-09 → F-04, RJ-12/RJ-14 → F-02) |

S-01: `{code} を確定しました：{qty}{unit} × ¥{price} = ¥{amount} / Đã chốt {code}: …`

## 7. Hành động
| Nút / thao tác | Quyền | Bật khi | Gọi API | Kết quả thành công | Kết quả lỗi |
|---|---|---|---|---|---|
| 確定 / Chốt (Enter ở bất kỳ field nào) | `trades.create` | Online, có ngày hiện tại, không đang gửi | `POST /api/trades {kind:"negotiated", lot_id, buyer_id, qty, unit_price, note, client_ref}` → `fn_confirm_trade` | 201 + giao dịch `confirmed`; S-01 | 400 RJ-xx / V016-xx; 401 hết phiên (về SCR-001, nháp giữ) hoặc M-06; 403 AUTH-403 |
| クリア / Xóa form (Esc) | — | Luôn | — | Xóa F-02…F-06, xóa nháp cục bộ | — |
| Phím tắt | — | — | — | `Alt+L` → F-02, `Alt+B` → F-03, `Alt+Q` → F-04 (S) | — |

Hủy (取消) không làm ở màn hình này: thực hiện ở chi tiết giao dịch `/trades/{id}` (SCR-018, chưa có spec — README; quyền `trades.cancel`, chỉ trước khóa sổ, có lý do — 01 §9.3).

## 8. Phân quyền hiển thị
| Vai trò | Thấy màn hình | Thấy vùng / cột | Thao tác được |
|---|---|---|---|
| sys_admin | Không | — | — |
| market_ops | Không | — | — |
| intake | Không | — | — |
| judge | Không | — | — |
| trade | Có | Tất cả | Chốt 相対 |
| delivery | Không | — | — |
| settlement | Không (xem giao dịch ở danh sách / đối soát) | — | — |
| approver | Không | — | — |
| rule_admin (đích) | Không | — | — |

API `GET /api/participants` mở cho `trades.create` để chọn người mua (ADR-004, hệ quả 3) nhưng chỉ trả các cột ở §4, không trả liên hệ (BC-84).

## 9. Quy tắc nghiệp vụ và điểm phân nhánh
`fn_confirm_trade` (tầng D, một giao dịch SQL) khóa dòng lô `FOR UPDATE`, rồi đánh giá **theo đúng thứ tự 01 §9.1** và dừng ở điều kiện hỏng đầu tiên (cộng dồn nhiều lý do là S, không làm ở v1). `business_date` của giao dịch = ngày của lô, và lô phải thuộc ngày nghiệp vụ hiện tại (ADR-009 §3) — nên tư cách luôn xét theo ngày hiện tại, qua `fn_qualification_block_reason(party, business_date, purpose)` (ADR-007). Hiệu lực gồm cả ngày `valid_to` khi `qualification_valid_to_inclusive = true` (mặc định, giả định S, BC-09, chờ Q31).

Đây là **bảng mã RJ dùng chung** (README): SCR-019 và các hàm khác dùng lại đúng mã và câu.

| # | Điều kiện | Mã | JP | VI | Nguồn |
|---|---|---|---|---|---|
| 0 | Nhóm người mua không có trong `trade_kind_matrix[kind]` (mặc định: 仲卸, 売買参加者, 買出人 được cả 相対 và せり; 卸売業者 là bên bán — TBL-ACTOR-01) | RJ-00 | この区分の取引参加者は{取引種別}の買い手になれません。 | Nhóm người tham gia này không được làm bên mua trong {loại giao dịch}. | 01 §1.1, ADR-008 (S) |
| 1a | Căn cứ `permit`: hết hạn | RJ-01 | 仲卸の許可が失効しています（有効期限: {date}）。取引を確定できません。 | 許可 của 仲卸 đã hết hiệu lực ({date}). Không chốt được. | BR-PERM-01, BC-06 |
| 1a' | Mọi căn cứ: chưa tới `valid_from` | RJ-01a | {根拠}の有効期間がまだ始まっていません（開始日: {date}）。取引を確定できません。 | {căn cứ} chưa tới ngày bắt đầu hiệu lực ({date}). Không chốt được. | BR-PERM-01 |
| 1b | Căn cứ `permit`: tạm dừng | RJ-02 | 仲卸の許可は一時停止中です。解除条件を満たすまで確定できません。 | 許可 của 仲卸 đang tạm dừng. Chưa đủ điều kiện gỡ thì không chốt được. | BC-05 |
| 2a | Căn cứ `approval`: hết hạn | RJ-03 | 売買参加者の承認が失効しています（{date}）。再審査の手続きが必要です。 | 承認 của 売買参加者 đã hết hiệu lực ({date}). Cần làm thủ tục 再審査. | BR-PERM-01, FIG-004 |
| 2b | Căn cứ `approval`: tạm dừng | RJ-04 | 売買参加者の承認は一時停止中です。再審査を経るまで確定できません。 | 承認 đang tạm dừng. Phải qua 再審査 mới chốt được. | FIG-004 |
| 2c | Căn cứ `approval`: đang 再審査 | RJ-05 | 売買参加者の承認は再審査中です。再審査が完了するまで確定できません。 | 承認 đang tái thẩm định. Chờ xong 再審査 mới chốt được. | FIG-004, BC-04 |
| 3a | Căn cứ `point_registration`: hết hạn | RJ-06 | 買出人の取引地点登録の期限が切れています（{date}）。取引地点で再登録してください。 | 取引地点登録 của 買出人 đã hết hạn ({date}). Đăng ký lại tại điểm giao dịch. | 05-05 EX-02, BC-11 (S) |
| 3b | Căn cứ `point_registration`: tạm dừng | RJ-07 | 買出人の取引地点登録は一時停止中です。 | 取引地点登録 của 買出人 đang tạm dừng. | BC-11 (S) |
| 4 | Bên bán 卸売業者: 市場登録 tạm dừng | RJ-08 | 卸売業者（{seller}）の市場登録が一時停止中のため、このロットは取引できません。 | 市場登録 của 卸売業者 ({seller}) đang tạm dừng, lô này không giao dịch được. | Q33, BC-10 (S) |
| 4' | Bên bán: 市場登録 hết hạn, chỉ khi `seller_registration_check = full` (mặc định `suspension_only` → bỏ qua, như SCR-012) | RJ-08a | 卸売業者（{seller}）の市場登録の有効期限が切れています（{date}）。 | 市場登録 của 卸売業者 ({seller}) đã hết hạn ({date}). | Q33, BC-10 (S) |
| 5 | `qty > lot.available_qty` | RJ-09 | ロット{lot}の残数量は{available}{unit}です。{qty}{unit}は確定できません。 | Lô {lot} chỉ còn {available}{unit}, không chốt được {qty}{unit}. | BR-LOT-02, BC-33 |
| 6 | Ngày của lô đã khóa → raise `LOCKED_DAY`; API ghi `audit_logs.action = 'blocked_edit'` qua `fn_log_blocked_edit` (ADR-006) | RJ-10 | 業務日{day}は締め済みです。修正は確定後修正申請で行ってください。 | 業務日 {day} đã khóa sổ. Muốn sửa hãy tạo yêu cầu điều chỉnh. | BR-CLOSE-01, BC-43, FR-CORR-03 |
| 6' | Chưa có ngày `open` / ngày của lô chưa mở | RJ-11 | 業務日{day}はまだ開始されていません。 | 業務日 {day} chưa được mở. | ADR-009 |
| 6'' | Lô thuộc ngày khác ngày nghiệp vụ hiện tại (`allow_trade_on_previous_day_lots = false`) | RJ-14 | ロット{lot}は業務日{day}のロットのため、現在の業務日では取引できません。 | Lô {lot} thuộc 業務日 {day}, không giao dịch được ở ngày nghiệp vụ hiện tại. | ADR-009 (S) |
| — | Lô không tồn tại | RJ-12 | 指定したロットが見つかりません。 | Không tìm thấy lô. | — |
| — | Mất mạng (client) | RJ-13 | ネットワークに接続されていません。取引の確定にはオンライン接続が必要です。入力内容は端末に下書き保存しました。 | Mất mạng. Chốt giao dịch cần có mạng. Nội dung đã lưu nháp trên máy. | BC-77, ADR-010 |
| 7 | Mọi điều kiện đạt | — | — | — | FR-AITAI-01 |

`{根拠}` / `{căn cứ}` thay bằng nhãn đúng căn cứ (許可 / 承認 / 市場登録 / 取引地点登録), không dùng chữ chung. `{取引種別}` = 相対取引 / せり.

Bước 7 trong cùng giao dịch SQL: trừ `lots.available_qty` (không bao giờ âm, CHECK); sinh mã `T<YYMMDD>-NNNN` từ `doc_counters(day,'trade')` (BC-31, G-18); `INSERT trades` với `kind='negotiated'`, `status='confirmed'`, `confirmed_by = recorded_by = actor` (người thật, BC-28/29), `rule_set_id = fn_rule_set(business_date)` (ADR-008), `client_ref`; ghi `audit_logs` (ADR-006). Một `client_ref` đã có → trả về giao dịch đó, không trừ tồn lần hai (BC-76).

Ghi chú:
- **Vòng đời** (BC-32): form là 下書き (chỉ ở máy); bấm 確定 đi thẳng `確認待ち → 確定` trong một lệnh vì người nhập cũng là 確定者 (giả định S theo BC-34). Không có hàng chờ xác nhận riêng ở v1.
- **Nháp cục bộ** (BC-77, S): F-02…F-06 lưu `localStorage` theo khóa `trade-draft:{userId}`, xóa khi chốt thành công hoặc bấm クリア; khôi phục khi mở lại (kể cả sau SCR-001 timeout). Đăng xuất trên máy dùng chung xóa nháp.
- Mã lỗi RJ-xx do D raise kèm mã (ADR-003); API ánh xạ sang câu JP + VI ở trên — client không tự dựng câu.
- Không có giá trị nào hardcode: `trade_kind_matrix`, `seller_registration_check`, `qualification_valid_to_inclusive`, `allow_trade_on_previous_day_lots` đọc qua `fn_rule(key, business_date)` (BC-19, ADR-008).

## 10. Tiêu chí nghiệm thu
Dữ liệu chung: ngày nghiệp vụ hiện tại = 2026-10-16 (`open`), ngày 2026-10-15 `locked`. Mỗi tiêu chí tự chuẩn bị dữ liệu nêu trong Given, không dùng seed (README).
1. **Given** lô L-012 của ngày 2026-10-16 còn 120 kg và 仲卸 M-001 có 許可 `valid` từ 2026-01-01 đến 2026-12-31, **When** chốt 50 kg × ¥3,000 bằng bàn phím (gõ mã lô, Tab, gõ mã người mua, Tab, số lượng, Tab, đơn giá, Enter), **Then** 201, lô còn 70 kg, `trades.confirmed_by` = người nhập, có `rule_set_id`, có một dòng `audit_logs`, focus về 数量.
2. **Given** 仲卸 M-003 có 許可 `valid_to` = 2026-10-15, **When** chốt cho M-003, **Then** 400 RJ-01 (chữ 許可, 仲卸), không có dòng `trades` mới, tồn lô không đổi.
3. **Given** 売買参加者 B-003 có 承認 `status = re_review`, **When** chốt, **Then** 400 RJ-05 (chữ 承認, 再審査) — khác câu với tiêu chí 2.
4. **Given** 買出人 R-003 có 取引地点登録 `valid_to` = 2026-10-15, **When** chốt, **Then** 400 RJ-06.
5. **Given** lô còn 10 kg, **When** chốt 12 kg, **Then** 400 RJ-09 nêu "残数量は10kg", focus ô 数量, các field giữ nguyên.
6. **Given** hai máy cùng chốt 8 kg trên lô còn 10 kg cùng lúc, **Then** đúng một máy thành công; máy kia nhận RJ-09; tồn lô = 2 kg (không âm).
7. **Given** 業務日 2026-10-16 bị settlement khóa sau khi trang đã mở, **When** chốt, **Then** 400 RJ-10, form chuyển disabled, và `audit_logs` có đúng một dòng `action = 'blocked_edit'` (entity `trade`, ngày 2026-10-16, actor = người nhập).
8. **Given** 仲卸 M-004 có 許可 `status = suspended` (RJ-02) và lô chỉ còn 1 kg, **When** chốt 5 kg cho M-004, **Then** thông báo là RJ-02 (thứ tự 01 §9.1).
9. **Given** 卸売業者 W-002 có 市場登録 `status = suspended` và lô L-020 của W-002, **When** chốt trên L-020, **Then** 400 RJ-08.
10. **Given** máy mất mạng, **When** nhấn Enter, **Then** không có request, hiện RJ-13, nháp còn sau khi tải lại trang.
11. **Given** request chốt đã tới server nhưng mất phản hồi, **When** gửi lại cùng `client_ref`, **Then** trả cùng giao dịch, tồn lô chỉ bị trừ một lần.
12. **Given** 1.200 lần chốt mô phỏng trong 2,5 giờ từ 10 máy, **Then** p95 thời gian phản hồi `POST /api/trades` ≤ 2 giây (BC-80).
13. **Given** ngày 2026-10-15 ở `closing` (ngày 2026-10-16 được mở khi 15 chưa khóa), lô L-005 của ngày 15 còn 30 kg, `allow_trade_on_previous_day_lots = false`, **When** gửi `POST /api/trades` với `lot_id` của L-005 (bỏ qua UI), **Then** 400 RJ-14, không có `blocked_edit`. **Given** ngày 15 đã `locked`, **When** gửi lại, **Then** 400 RJ-10 và có `blocked_edit` (bước 6 kiểm ngày khóa trước).
14. **Given** 仲卸 M-005 có 許可 `valid_from` = 2026-10-20, **When** chốt, **Then** 400 RJ-01a nêu 許可 và ngày 2026-10-20.

## 11. Khác prototype LAB-2 và việc cần làm
| G-xx | Hiện tại | Cần đổi |
|---|---|---|
| G-01 | `fn_participant_block_reason` một bộ trạng thái + hạn chung; câu "tạm dừng tư cách / hết hiệu lực" giống nhau cho 許可 và 承認 | `fn_qualification_block_reason` theo căn cứ, mã RJ-01…RJ-07 riêng; thêm kiểm bên bán RJ-08 / RJ-08a |
| G-02 | Cờ ⚠ hết hạn tính bằng `new Date().toISOString()` (UTC) | Cờ do server tính theo 業務日 JST (`purpose=buy&day=`) |
| G-07 | `BusinessDayPicker` chọn ngày mới nhất trong danh sách; không có API ngày hiện tại | Bỏ bộ chọn; `GET /api/business-days/current`; lô chỉ của ngày hiện tại |
| G-05 | `wholesaler` không được mua — hardcode trong hàm | `trade_kind_matrix` trong `rule_values` (mặc định vẫn chỉ ba nhóm bên mua, theo TBL-ACTOR-01) |
| G-06 | Audit ghi ở API sau khi hàm đã commit; không log lần bị chặn | Ghi trong `fn_confirm_trade`; `blocked_edit` qua `fn_log_blocked_edit` |
| G-14 | `confirmed_by` uuid trơn | FK `profiles(id)`; thêm `recorded_by` |
| G-15 | Đơn vị lấy từ `lots.unit` text tự do | `items.unit` |
| G-18 | Mã giao dịch = `count(*)+1` (dòng -R/-A cũng tăng đếm) | `doc_counters(day, kind)` |
| G-20 | Không phát hiện mất mạng; mất kết nối thì chỉ báo lỗi fetch, form có thể bị bấm lại | Nhãn mạng, chặn 確定 khi offline, nháp `localStorage`, `client_ref` chống trùng |
| G-24 | Thứ tự kiểm: ngày khóa → SL/giá → nhóm → tư cách → tồn; câu lỗi chỉ tiếng Việt | Thứ tự 01 §9.1 (§9), câu JP + VI có mã RJ |
| — | Bảng gần đây lấy mọi ngày (`/api/trades?kind=negotiated`) | Lọc theo 業務日 hiện tại, `limit=15` |

## 12. Câu hỏi mở
- **Q8**: ai nhập / xác nhận 相対 — giả định S: chỉ `trade` của chợ, người nhập = 確定者.
- **Q31 / BC-09**: "hết hạn ngày X" tính tới hết ngày X (bao gồm) — giả định S, khóa `qualification_valid_to_inclusive`.
- **Q33**: bên bán chỉ kiểm tạm dừng 市場登録 (RJ-08) — giả định S, khóa `seller_registration_check`.
- **M1 / BC-11**: 買出人 có hạn (RJ-06) theo EX-02 — giả định S, cần câu hỏi mới.
- **§1.1**: ma trận nhóm × loại giao dịch không có trong RFP; mặc định cho phép cả ba nhóm bên mua có tư cách hiệu lực, cấu hình qua `trade_kind_matrix`.
- Bán tiếp lô của ngày trước: mặc định không (`allow_trade_on_previous_day_lots = false`, S); cần khách xác nhận.
- Mục tiêu ≤ 15 giây / giao dịch là đề xuất S để đo khi UAT; RFP chỉ cho tải (BC-80).
