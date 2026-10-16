# SCR-010 — Chi tiết người tham gia và tư cách theo căn cứ (取引参加者詳細・参加資格)

Wireframe: [../05-wireframes/index.html#scr-010](../05-wireframes/index.html#scr-010) · Ràng buộc: BC-01…BC-12, BC-47, BC-81, BC-84, BC-88 · ADR: ADR-004, ADR-007, ADR-008, ADR-009 · Gap: G-01, G-02, G-05, G-06, G-14, G-16

> **Màn hình phân nhánh quan trọng nhất.** 許可 và 承認 **không bao giờ** dùng chung nhãn, chung nút hay chung thông báo. Gộp hai căn cứ là bị loại hồ sơ (RFP 12-06, BC-01, bẫy T2).

## 1. Mục đích và người dùng
- Xem và quản lý **tư cách tham gia** của một người tham gia theo đúng căn cứ của nhóm (BC-02, ADR-007 §1):

  | Nhóm (`party_kinds`) | Căn cứ (`basis_type`) | Nhãn căn cứ | Tạm dừng → gỡ (`suspend_policy`) |
  |---|---|---|---|
  | 卸売業者 `wholesaler` | `market_registration` | 市場登録 / Đăng ký với chợ | `approval`: gỡ cần người phê duyệt |
  | 仲卸 `middleman` | `permit` | 許可 / Giấy phép | `conditional`: gỡ khi đủ 条件 |
  | 売買参加者 `participant_buyer` | `approval` | 承認 / Chấp thuận | `re_review`: bắt buộc qua 再審査 |
  | 買出人 `point_buyer` | `point_registration` | 取引地点登録 / Đăng ký tại điểm giao dịch | — (FIG-004 không có dòng; giả định S: gỡ trực tiếp) |

- Ai dùng: `market_ops` (cập nhật hồ sơ, tạm dừng / gỡ), `approver` (duyệt gỡ tạm dừng của 卸売業者), các vai trò khác chỉ xem.
- Lúc dùng: giờ văn phòng (sau 10:00) là chính; tra cứu nhanh trong ca khi màn hình 相対 / せり báo từ chối. Tần suất thấp (vài chục lượt/ngày), không phải màn hình cao điểm.

## 2. Điều kiện vào màn hình
- Đường dẫn `/participants/{id}`; `id` = `participants.id`. Quyền `participants.read`.
- Vào từ: danh sách `/participants`, trang chủ (khối "sắp hết hạn"), liên kết trên thông báo từ chối ở SCR-016 / SCR-019, báo cáo RPT-03.
- Đi tới: `/trades/{id}` (giao dịch gần đây), `/participants` (quay lại).

## 3. Bố cục
1. **Header**: `{code} · {name}`; nhãn nhóm JP (卸売業者…); nhãn căn cứ JP + VI; huy hiệu trạng thái hiệu lực.
2. **Dải cảnh báo** (chỉ khi có): sắp hết hạn / đã hết hạn / đang tạm dừng / đang 再審査.
3. **Thẻ tư cách hiện hành**: số hiệu, cơ quan cấp, hiệu lực từ–đến, trạng thái, 条件 (chỉ 許可), người duyệt, bằng chứng.
4. **Thanh hành động** theo căn cứ (§7) — nút khác nhau cho từng căn cứ.
5. **Bảng lịch sử tư cách** (`participant_qualifications`, mới nhất trước).
6. **Dòng thời gian sự kiện** (`qualification_events`).
7. **Thông tin liên hệ** (điện thoại, ghi chú) — sửa được, có lý do.
8. **Giao dịch gần đây** (20 dòng, như bản hiện tại).

## 4. Dữ liệu hiển thị
| Mục | Nguồn | Định dạng | Ghi chú |
|---|---|---|---|
| Mã, tên, nhóm | `participants.code/name/kind` → `party_kinds.name_ja` | text | Nhóm hiện JP, VI trong tooltip |
| Căn cứ | `participant_qualifications.basis_type` (bản ghi hiện hành) | nhãn theo bảng §1 | **Không** hiện chữ chung "Giấy phép/License" cho mọi căn cứ |
| Trạng thái hiệu lực | `GET /api/participants/{id}` → `state.status` = `fn_qualification_state(qid, ngày tham chiếu)` (ADR-007) | huy hiệu: 有効 xanh · 一時停止 cam · 再審査中 tím · 失効 đỏ · 開始前 xám | **Ngày tham chiếu** = ngày nghiệp vụ hiện tại (`fn_current_business_date()`), khi chưa có ngày `open` thì ngày nghiệp vụ gần nhất (ADR-009 §3); không theo ngày máy |
| Hiệu lực | `valid_from`, `valid_to` | `YYYY/MM/DD` | `valid_to` rỗng (chỉ 市場登録) hiện `期限なし / Không thời hạn` |
| Còn bao nhiêu ngày | `valid_to − ngày tham chiếu` | số ngày | Chỉ khi ≤ `expiry_warning_days` |
| 条件 (điều kiện) | `participant_qualifications.conditions` | văn bản nhiều dòng | Chỉ căn cứ `permit` |
| Lịch sử tư cách | `participant_qualifications` theo `participant_id` | bảng: số hiệu, căn cứ, từ, đến, trạng thái, người duyệt | Chỉ đọc; bản cũ không sửa |
| Sự kiện | `qualification_events` | `YYYY/MM/DD HH:mm` JST · sự kiện JP · người làm · lý do | Chỉ thêm |
| Giao dịch gần đây | `trades` (buyer hoặc seller), 20 dòng | như bản hiện tại | Liên kết `/trades/{id}` |

## 5. Field nhập
Ba form nhỏ (hộp thoại), mở từ thanh hành động. `{basis}` trong thông báo được thay bằng nhãn JP đúng căn cứ.

**Form A — 資格登録・更新 / Đăng ký hoặc gia hạn tư cách** (`market_ops`)

| ID | Nhãn (JP / VI) | Kiểu | Bắt buộc | Mặc định | Nguồn lựa chọn | Validation (tầng) | Thông báo lỗi |
|---|---|---|---|---|---|---|---|
| A-01 | 根拠 / Căn cứ | select (chỉ đọc khi nhóm chỉ có 1 căn cứ) | Có | căn cứ của nhóm | `party_kind_basis` theo `participants.kind` | Cặp (kind, basis_type) có trong `party_kind_basis` (D: FK) | E-01 |
| A-02 | 番号 / Số hiệu | text ≤ 50 | Có với `permit`, `approval` (giả định S: RFP không nói số hiệu bắt buộc); không với loại khác | rỗng | — | Không rỗng khi bắt buộc (C, A) | E-02 |
| A-03 | 発行者 / Cơ quan cấp | text ≤ 100 | Không | rỗng | — | — | — |
| A-04 | 有効開始日 / Hiệu lực từ | date | Có | 業務日 hiện tại | — | Ngày hợp lệ (C, A) | E-03 |
| A-05 | 有効期限 / Hiệu lực đến | date | Có, trừ `market_registration` (giả định S theo BC-10) | rỗng | — | ≥ A-04 (C, A, D: CHECK) | E-04 |
| A-06 | 条件 / Điều kiện kèm theo | textarea ≤ 1000 | Không (chỉ hiện khi `permit`) | rỗng | — | Rỗng với căn cứ khác `permit` (D: CHECK) | E-05 |
| A-07 | 根拠資料 / Bằng chứng | file (PDF/JPG/PNG ≤ 10 MB), tải qua `POST /api/attachments` (quyền `attachments.upload` (mới)) | Không | — | — | Loại + dung lượng (C, A) | E-06 |
| A-08 | 理由 / Lý do | textarea | Có | rỗng | — | Không rỗng (C, A, D) | E-07 |

Khoảng hiệu lực mới không được chồng lên bản ghi khác cùng căn cứ đang `valid`/`suspended` (D: exclusion constraint) → E-08. Ràng buộc này là giả định (S): RFP không nói, nhóm đặt để lịch sử tư cách không mơ hồ.

**Form B — 一時停止 / Tạm dừng** (`market_ops`, mọi căn cứ)

| ID | Nhãn (JP / VI) | Kiểu | Bắt buộc | Mặc định | Nguồn lựa chọn | Validation (tầng) | Thông báo lỗi |
|---|---|---|---|---|---|---|---|
| B-01 | 停止理由 / Lý do tạm dừng | textarea | Có | rỗng | — | Không rỗng (C, A, D) | E-07 |
| B-02 | 解除条件 / Điều kiện để gỡ | textarea | **Có với `permit`**, ẩn với loại khác | `conditions` hiện có | — | Không rỗng khi `permit` (A, D) | E-09 |
| B-03 | 根拠資料 / Bằng chứng | file | Không | — | — | như A-07 | E-06 |

**Form C — gỡ / 再審査** (nội dung đổi theo căn cứ, xem §9; mở 再審査 chỉ dùng C-05)

| ID | Nhãn (JP / VI) | Kiểu | Bắt buộc | Mặc định | Nguồn lựa chọn | Validation (tầng) | Thông báo lỗi |
|---|---|---|---|---|---|---|---|
| C-01 | 解除理由 / Lý do gỡ | textarea | Có (mọi luồng gỡ) | rỗng | — | Không rỗng (C, A, D) | E-07 |
| C-02 | 条件充足の確認 / Đã đủ điều kiện | checkbox + textarea "確認内容" | Có, chỉ `permit` | chưa tick | Hiện nguyên văn `conditions` để đối chiếu | Tick + nội dung không rỗng (C, A, D) | E-10 |
| C-03 | 再審査結果 / Kết quả tái thẩm định | radio: 承認継続 (đạt) / 否認 (không đạt) | Có, chỉ `approval` khi đang `re_review` | không chọn | cố định | Một giá trị (C, A) | E-11 |
| C-04 | 新有効期限 / Hạn mới | date | Có khi C-03 = đạt | `valid_to` cũ | — | > ngày tham chiếu (C, A, D) | E-12 |
| C-05 | 再審査理由 / Lý do mở tái thẩm định | textarea ≤ 1000 | Có, chỉ khi bấm 再審査を開始 | rỗng | — | Không rỗng (C, A, D) | E-07 |

**Form D — 連絡先 / Liên hệ**: `phone` (text ≤ 20, không bắt buộc), `note` (text ≤ 500), `理由` (bắt buộc, E-07). Không còn ô sửa trạng thái / ngày hiệu lực ở đây.

**Thông báo lỗi** (API trả `{error, code}`; D raise với `code` để API dịch đúng câu):

| Mã | JP | VI |
|---|---|---|
| E-01 | この取引参加者の区分では、この根拠を登録できません。 | Nhóm người tham gia này không được dùng căn cứ đó. |
| E-02 | 番号を入力してください。 | Nhập số hiệu. |
| E-03 | 有効開始日を入力してください。 | Nhập ngày bắt đầu hiệu lực. |
| E-04 | 有効期限は有効開始日以降の日付にしてください。 | Ngày hết hạn phải từ ngày bắt đầu trở đi. |
| E-05 | 条件は許可（仲卸）にのみ設定できます。 | Chỉ 許可 (仲卸) mới có điều kiện kèm theo. |
| E-06 | 添付できるのは10MB以下のPDF・JPG・PNGです。 | Chỉ đính kèm PDF/JPG/PNG ≤ 10 MB. |
| E-07 | 理由を入力してください。 | Nhập lý do. |
| E-08 | 同じ根拠で有効期間が重複する資格があります。 | Đã có tư cách cùng căn cứ trùng khoảng hiệu lực. |
| E-09 | 許可の一時停止には解除条件の入力が必要です。 | Tạm dừng 許可 phải ghi điều kiện để gỡ. |
| E-10 | 解除条件を満たしたことを確認し、確認内容を入力してください。 | Xác nhận đã đủ điều kiện và ghi nội dung xác nhận. |
| E-11 | 再審査の結果を選択してください。 | Chọn kết quả tái thẩm định. |
| E-12 | 新しい有効期限は現在の業務日より後の日付にしてください。 | Hạn mới phải sau 業務日 hiện tại. |
| E-13 | 承認の一時停止は直接解除できません。再審査を開始してください。 | 承認 bị tạm dừng không gỡ trực tiếp được. Hãy mở tái thẩm định (再審査). |
| E-14 | 市場登録の一時停止解除は承認者のみ実行できます。 | Chỉ người phê duyệt mới gỡ tạm dừng 市場登録. |
| E-15 | 一時停止を行った本人は解除を承認できません。 | Người đã tạm dừng không được tự duyệt gỡ. |
| E-16 | 現在の状態ではこの操作はできません（現在: {status}）。 | Trạng thái hiện tại không cho thao tác này (hiện: {status}). |
| E-17 | 他の利用者が先に更新しました。画面を再読み込みしてください。 | Người khác vừa cập nhật. Tải lại màn hình. |

## 6. Trạng thái màn hình
| Trạng thái | Điều kiện | Hiển thị / hành vi |
|---|---|---|
| Đang tải | Chờ `GET /api/participants/{id}` | Khung xương cho header + thẻ tư cách |
| Trống | Người tham gia chưa có bản ghi tư cách nào (dữ liệu migrate thiếu) | Thẻ tư cách hiện `資格未登録 / Chưa đăng ký tư cách`, trạng thái coi như 失効; chỉ còn nút Form A |
| Lỗi tải | 404 / 5xx | 404: `取引参加者が見つかりません / Không tìm thấy người tham gia`; 5xx: thông báo + nút 再読み込み |
| Không có quyền | Thiếu `participants.read` | 403 — màn hình với thông báo chung AUTH-403 (README) |
| Ngày đã khóa | — | Không áp dụng: tư cách không gắn 業務日 đã khóa; thao tác ghi theo thời điểm hiện tại |
| Mất mạng | fetch lỗi mạng | Chỉ đọc dữ liệu đã tải; mọi nút ghi disabled, thông báo chung NET-01 (ADR-010: không xếp hàng) |
| Đang gửi | Chờ POST | Nút trong hộp thoại disabled + spinner |
| Thành công | 2xx | Đóng hộp thoại, thông báo `更新しました（監査ログ記録済み） / Đã cập nhật (đã ghi audit log)`, tải lại |
| Cảnh báo hết hạn | `0 ≤ valid_to − 業務日 ≤ expiry_warning_days` | Dải vàng: `{basis}の有効期限まで残り{n}日（{date}） / {basis} còn {n} ngày hết hạn ({date})` |
| Đã hết hạn | `valid_to < 業務日` | Dải đỏ: `{basis}は{date}に失効しています / {basis} đã hết hiệu lực từ {date}` |
| Tạm dừng / 再審査 | `status ∈ {suspended, re_review}` | Dải cam / tím với câu riêng theo căn cứ (§9) |

## 7. Hành động
| Nút / thao tác | Quyền | Bật khi | Gọi API | Kết quả thành công | Kết quả lỗi |
|---|---|---|---|---|---|
| 資格登録・更新 / Đăng ký, gia hạn | `participants.write` | Luôn (trừ `approval` đang `re_review`: gia hạn đi qua kết quả 再審査) | `POST /api/participants/{id}/qualifications` | 201, bản ghi mới, sự kiện `apply`+`approve` | E-01…E-08 |
| 一時停止 / Tạm dừng | `participants.write` | status = `valid` | `POST /api/qualifications/{qid}/events {event:"suspend", reason, conditions?}` | status `suspended`, sự kiện `suspend` | E-07, E-09, E-16 |
| 条件充足により解除 / Gỡ vì đủ điều kiện | `participants.write` | basis `permit`, status `suspended` | `…/events {event:"lift", reason, conditions_met_note}` | status `valid` | E-10, E-16 |
| 解除を承認 / Duyệt gỡ tạm dừng | `qualifications.approve` (mới) | basis `market_registration`, status `suspended` | `…/events {event:"lift", reason}` | status `valid` | E-14, E-15, E-16 |
| 解除 / Gỡ tạm dừng | `participants.write` | basis `point_registration`, status `suspended` | `…/events {event:"lift", reason}` | status `valid` | E-16 |
| 再審査を開始 / Mở tái thẩm định | `participants.write` | basis `approval`, status ∈ {`suspended`, `expired`} | `…/events {event:"re_review", reason}` (`reason` = C-05) | status `re_review` | E-07, E-16 |
| 再審査結果を登録 / Ghi kết quả 再審査 | `participants.write` | basis `approval`, status `re_review` | `…/events {event:"approve"\|"expire", reason, new_valid_to?}` | đạt → `valid` + hạn mới; không đạt → `expired` | E-11, E-12, E-16 |
| 連絡先を保存 / Lưu liên hệ | `participants.write` | Form D thay đổi | `PATCH /api/participants/{id} {phone, note, reason}` | 200 | E-07 |

Không có nút "解除" cho căn cứ `approval` ở bất kỳ trạng thái nào. Mọi POST gửi `version` (= `participant_qualifications.updated_at`, 03 §2); lệch → 409 E-17. `conditions_met_note`, `new_valid_to`, kết quả 再審査 lưu ở `qualification_events.payload`. Thiếu quyền → 403 AUTH-403. Mọi thao tác ghi `qualification_events` và `audit_logs` (trước/sau, lý do) trong **cùng giao dịch** (ADR-006, BC-81).

## 8. Phân quyền hiển thị
| Vai trò | Thấy màn hình | Thấy vùng / cột | Thao tác được |
|---|---|---|---|
| sys_admin | Có | Tất cả | Không (chỉ xem) |
| market_ops | Có | Tất cả | Form A, B, D; gỡ `permit` / `point_registration`; mở và ghi kết quả 再審査 |
| intake | Có | Header, thẻ tư cách, cảnh báo; ẩn lịch sử sự kiện và liên hệ (APPI, BC-84) | Không |
| judge | Không | — | — |
| trade | Có | như `intake` + giao dịch gần đây | Không |
| delivery | Không (đích: có thể mở từ SCR-029 khi cần tra cứu, chờ Q31) | — | — |
| settlement | Có | Tất cả | Không |
| approver | Có (đích: thêm `participants.read`) | Tất cả | Duyệt gỡ tạm dừng `market_registration` |
| rule_admin (đích) | Không | — | — (sửa `expiry_warning_days` ở SCR-034, không ở đây) |

## 9. Quy tắc nghiệp vụ và điểm phân nhánh
**Máy trạng thái** (BC-04, FIG-010): `valid ⇄ suspended`, `valid → expired`, `expired → re_review` (chỉ `approval`), `re_review → valid | expired`. Trạng thái `expired` do job hằng ngày ghi khi `valid_to < ngày tham chiếu` (sự kiện `expire`, actor = hệ thống); màn hình vẫn tính lại bằng `fn_qualification_state` để không lệch trước khi job chạy. Tư cách không gắn ngày nghiệp vụ nên ghi được cả khi chưa có ngày `open` (ADR-009 §3).

**Bảng quyết định gỡ tạm dừng** — hàm `fn_qualification_event(qid, event, actor, payload)` (tầng D) rẽ nhánh theo `party_kind_basis.suspend_policy`, không theo cờ ở client:

| Căn cứ | Ai gỡ | Điều kiện bắt buộc | Kết quả | Nguồn |
|---|---|---|---|---|
| 市場登録 (卸売業者) | Vai trò có `qualifications.approve` (giả định S: `approver`), khác người đã tạm dừng | Lý do | `valid` | FIG-004 「承認」, BC-05, BC-88 (S) |
| 許可 (仲卸) | `market_ops` | Lý do + xác nhận đủ `conditions` (nội dung điều kiện là văn bản tự do vì RFP không định nghĩa, BC-05, Q5) | `valid` | FIG-004 「条件付き」 |
| 承認 (売買参加者) | — **không gỡ trực tiếp** → E-13 | Phải `re_review` rồi ghi kết quả đạt + hạn mới | `re_review` → `valid` / `expired` | FIG-004 「再審査」 |
| 取引地点登録 (買出人) | `market_ops` | Lý do | `valid` | Giả định S (FIG-004 không có dòng; BC-11) |

**Câu hiển thị theo căn cứ** (dải cảnh báo; SCR-016/019 dùng cùng bộ khóa từ `fn_qualification_block_reason`):

| Căn cứ × trạng thái | JP | VI |
|---|---|---|
| 許可 · suspended | 許可は一時停止中です。解除条件: {conditions} | 許可 đang tạm dừng. Điều kiện để gỡ: {conditions} |
| 承認 · suspended | 承認は一時停止中です。再審査を経なければ再開できません。 | 承認 đang tạm dừng. Phải qua 再審査 mới hoạt động lại. |
| 承認 · re_review | 承認は再審査中です。 | 承認 đang tái thẩm định. |
| 市場登録 · suspended | 市場登録は一時停止中です。解除には承認者の承認が必要です。 | 市場登録 đang tạm dừng. Gỡ cần người phê duyệt duyệt. |
| 取引地点登録 · suspended | 取引地点登録は一時停止中です。 | Đăng ký tại điểm giao dịch đang tạm dừng. |

**Cảnh báo sắp hết hạn** (BC-07): ngưỡng `expiry_warning_days` đọc qua `fn_rule('expiry_warning_days', ngày tham chiếu)` (ADR-008; mặc định 30 — giá trị đang hardcode ở prototype, giữ làm mặc định S). Áp cho mọi căn cứ có `valid_to`. Email + RPT-03 do job hằng ngày, không thuộc màn hình này.

**Không bịa quy tắc** (bẫy T21, §1.1): màn hình không có ô "được mua ở 相対 / せり"; ma trận `trade_kind_matrix` nằm ở SCR-034 (ADR-008), mặc định cho phép cả ba nhóm bên mua (仲卸, 売買参加者, 買出人 — TBL-ACTOR-01) ở cả 相対 và せり; 卸売業者 là bên bán. Không đặt thời hạn mặc định cho 許可 / 承認 (BC-12).

**APPI** (BC-84): mở màn hình ghi log truy cập hồ sơ (`audit_logs` action `view`, entity `participant`) — chỉ cho vai trò thấy lịch sử sự kiện.

## 10. Tiêu chí nghiệm thu
1. **Given** ngày nghiệp vụ hiện tại = 2026-10-16 (`open`) và 仲卸 M-003 có 許可 `valid_from` = 2026-04-01, `valid_to` = 2026-10-15, **When** mở SCR-010 lúc 08:30 JST (ngày UTC vẫn là 2026-10-15 23:30), **Then** huy hiệu 失効 và dải đỏ ghi 「許可は2026/10/15に失効しています」, không phải chữ 承認 hay "license".
2. **Given** 売買参加者 B-003 có 承認 `status = suspended`, **When** `market_ops` mở màn hình, **Then** không có nút 解除, chỉ có 再審査を開始; gọi thẳng API `event:"lift"` trả 400 E-13 và không có dòng `qualification_events` mới.
3. **Given** 仲卸 M-004 `suspended` với `conditions` = "是正報告書の提出", **When** gửi `lift` không tick C-02, **Then** 400 E-10; **When** tick và ghi nội dung, **Then** trạng thái `valid`, sự kiện `lift` lưu `conditions_met_note`.
4. **Given** 卸売業者 W-001 có 市場登録 bị `market_ops` user X tạm dừng, **When** X (không có `qualifications.approve`) gọi `lift`, **Then** 403 AUTH-403 (nút trên màn hình hiện E-14); **When** approver Y (có quyền, khác X) gỡ, **Then** `valid`; **Given** approver Z vừa là người đã tạm dừng, **When** Z gỡ, **Then** 400 E-15.
5. **Given** B-003 có 承認 `status = re_review` và ngày nghiệp vụ hiện tại = 2026-10-16, **When** ghi kết quả 承認継続 với hạn mới > 業務日, **Then** status `valid`, `valid_to` mới, sự kiện `approve`; **When** ghi 否認, **Then** `expired`.
6. **Given** 仲卸, **When** gửi Form A với `basis_type = approval`, **Then** D từ chối (FK `party_kind_basis`) với E-01.
7. **Given** `expiry_warning_days` = 30 và M-002 có 許可 `valid_to` = ngày tham chiếu + 10, **When** rule_admin phát hành phiên bản đặt 7 và approver duyệt, **Then** từ ngày hiệu lực dải vàng không còn hiện cho M-002, không cần deploy.
8. **Given** bất kỳ thao tác ghi thành công, **Then** có đúng một dòng `audit_logs` với `before`, `after`, `reason`, cùng giao dịch với thay đổi (lỗi ghi audit → toàn bộ rollback).
9. **Given** vai trò `intake`, **When** mở màn hình, **Then** thấy trạng thái tư cách nhưng không thấy lịch sử sự kiện, liên hệ và không có nút ghi.
10. **Given** mất mạng, **When** bấm 一時停止, **Then** nút đã disabled với nhãn オフライン, không có request.

## 11. Khác prototype LAB-2 và việc cần làm
| G-xx | Hiện tại | Cần đổi |
|---|---|---|
| G-01 | `participants.basis` chỉ hiển thị; ô "Trạng thái" là dropdown sửa tự do cho mọi căn cứ; ba căn cứ xử lý như nhau | Bảng `participant_qualifications` + `qualification_events` + `party_kind_basis`; bỏ dropdown trạng thái; nút và form theo `suspend_policy` (§7, §9) |
| G-02 | Cờ hết hạn tính bằng ngày UTC ở client | `state` tính ở server bằng `fn_qualification_state` theo ngày tham chiếu (ADR-009) |
| G-05 | `EXPIRY_WARNING_DAYS = 30` hardcode (`api/dashboard/route.ts`) | `fn_rule('expiry_warning_days', …)` |
| G-06 | Audit ghi sau thao tác ở API | Ghi trong `fn_qualification_event`, cùng giao dịch |
| G-14 | `approved_by`, `actor` không FK | FK `profiles(id)` |
| G-16 | Không có `rule_admin`; `approver` không có `participants.read` | Thêm vai trò; cấp `participants.read` + `qualifications.approve` (mới, ADR-004) cho `approver`; `attachments.upload` (mới) cho `market_ops` (seed) |
| G-24 | Nhãn căn cứ tiếng Việt chung "Giấy phép/Chấp thuận/Đăng ký"; `registration` dùng chung cho 卸売業者 và 買出人 | Nhãn JP + VI theo bảng §1; tách `market_registration` / `point_registration` (ánh xạ ở 03 §3) |

## 12. Câu hỏi mở
- **Q5**: nội dung "条件付き" và thời hạn 許可 / 承認 chưa có → `conditions` là văn bản tự do, không đặt hạn mặc định.
- **Q33**: có kiểm hạn 市場登録 của 卸売業者 không → Plan A chỉ kiểm tạm dừng, `valid_to` không bắt buộc (BC-10).
- **M1 / BC-11**: 買出人 có hạn hay không — đang cho phép nhập `valid_to` (bắt buộc, S); câu hỏi mới cần gửi khách.
- Ai duyệt gỡ tạm dừng 市場登録 và ai ghi kết quả 再審査: RFP không nêu → giả định S (`approver` / `market_ops`), quyền đổi được trong ma trận quyền (ADR-004).
- **Q31**: tư cách đổi sau khi chốt ảnh hưởng giao hàng thế nào — thuộc SCR-029, màn hình này chỉ cung cấp trạng thái.
