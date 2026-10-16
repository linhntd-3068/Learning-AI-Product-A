# SCR-022/023 — Yêu cầu điều chỉnh & phê duyệt (確定後修正申請・承認)

Wireframe: [05-wireframes#scr-022](../05-wireframes/index.html#scr-022). As-built: `src/app/(app)/corrections/page.tsx`, `src/app/(app)/trades/[id]/trade-actions.tsx`, `src/app/api/corrections/**`, `fn_decide_correction`.

## 1. Mục đích và người dùng

- **SCR-022 確定後修正申請:** đề nghị đổi số lượng / đơn giá của một giao dịch **đã chốt** theo phiếu FORM-CORR-01 (BC-45): mã giao dịch, 業務日, lý do, người yêu cầu, bằng chứng khi ảnh hưởng quyết toán / giao hàng. Người dùng: `settlement` (prototype). Bản gốc **giữ nguyên** đến khi duyệt (BC-44).
- **SCR-023 承認:** người duyệt (`approver`) chọn **承認 / 却下 / 追加情報依頼**. Duyệt cấp cuối sinh bút toán `<mã>-R` (đảo) và `<mã>-A` (giá trị mới) ở **ngày nghiệp vụ hiện tại** (ngày `open` duy nhất, `fn_current_business_date()`, ADR-009), không ghi đè (ADR-005, BC-44, BC-69).
- Người yêu cầu ≠ người duyệt (BC-88, T19). Số cấp duyệt `approval_levels` cấu hình, mặc định 1 (BC-46, Q11).
- Thời điểm: chủ yếu sau 10:00 JST "sửa có phê duyệt" (02-07); cũng dùng được khi ngày còn mở (decision table 9.3).

## 2. Điều kiện vào màn hình

| Màn hình | Đường dẫn | Quyền |
|---|---|---|
| Form yêu cầu | Thẻ "Thao tác" ở `/trades/{id}` hoặc `/corrections/new?trade_id=` | `corrections.request` |
| Hàng đợi + chi tiết | `/corrections?status=pending` , `/corrections/{id}` | `corrections.request` hoặc `corrections.approve` |

- Giao dịch phải là dòng sống: `status = confirmed`, `qty > 0` (dòng gốc hoặc `-A` của lần trước). Từ SCR-029 có thể mở form với `impact=delivery` điền sẵn.
- **Chuỗi giao dịch:** dòng gốc và mọi dòng `-A` nối với nhau qua `reverses_id` (dòng `-A` trỏ về dòng nó thay thế) là **một chuỗi**. Lũy kế giao hàng tính trên cả chuỗi (mục 4), vì `deliveries.trade_id` vẫn trỏ dòng lúc ghi (có thể là dòng gốc đã `reversed`).

## 3. Bố cục

1. Header + bộ lọc trạng thái (`申請中 pending`, `追加情報待ち need_info`, `承認済 approved`, `却下 rejected`, tất cả) + lọc 業務日 gốc, mã giao dịch.
2. Form yêu cầu (SCR-022): thông tin gốc (chỉ đọc) | giá trị mới | chênh lệch tính sẵn | ảnh hưởng | lý do | bằng chứng.
3. Bảng hàng đợi: giao dịch, hiện tại, đề nghị, chênh lệch ¥, lý do, người tạo, trạng thái, cấp duyệt (`1/1`).
4. Chi tiết yêu cầu (SCR-023): so sánh trước/sau, bằng chứng (xem trước ảnh/PDF), lịch sử quyết định, vùng quyết định (ô ý kiến F-12 + ba nút 承認 / 却下 / 追加情報依頼, mỗi nút mở hộp xác nhận).
5. Sau khi duyệt: link tới dòng `-R` và `-A`, ngày ghi sổ.

## 4. Dữ liệu hiển thị

| Mục | Nguồn | Định dạng | Ghi chú |
|---|---|---|---|
| Mã GD, 業務日 gốc, trạng thái ngày | `trades.code`, `business_day`, `business_days.status` | `T261015-0012` · `締め済` | |
| SL × đơn giá hiện tại | `trades.qty`, `unit_price`, `amount` | số × ¥ | |
| Đề nghị | `corrections.new_qty`, `new_unit_price` | số × ¥ | |
| Chênh lệch | `new_qty × new_unit_price − amount` | ¥ có dấu | Tính ở C để xem; D tính lại |
| Đã giao ròng | Σ trên **cả chuỗi** giao dịch (gốc + các `-A`, qua `reverses_id`; bỏ dòng `-R`) theo công thức SCR-029 §4 | số | Để thấy ảnh hưởng giao hàng |
| Ảnh hưởng | `corrections.impact_settlement`, `impact_delivery` | nhãn `精算` / `引渡し` | Mới |
| Bằng chứng | `attachments(owner_type='correction')` | thumbnail / tên file | Mới, `retention_class = EVIDENCE_3Y_COLD` (BC-82) |
| Người tạo / quyết | `requested_by`, `correction_decisions.decided_by → profiles` | tên + `HH:mm` | |
| Ngày ghi sổ | `trades.business_day` của dòng `-R`/`-A` | date | = ngày nghiệp vụ hiện tại lúc duyệt cấp cuối (ADR-009) |

## 5. Field nhập

### 5.1 Yêu cầu (SCR-022)

| ID | Nhãn (JP / VI) | Kiểu | Bắt buộc | Mặc định | Nguồn lựa chọn | Validation (tầng) | Thông báo lỗi |
|---|---|---|---|---|---|---|---|
| F-01 | 取引番号 / Mã giao dịch | chỉ đọc (từ ngữ cảnh) | Có | giao dịch đang xem | `trades` | Dòng sống (A, D) | `確定済みの取引のみ修正申請できます / Chỉ điều chỉnh được giao dịch đang ở trạng thái đã chốt` |
| F-02 | 業務日 / Ngày nghiệp vụ gốc | chỉ đọc | Có | `trades.business_day` | — | — | — |
| F-03 | 修正後数量 / Số lượng mới | number 0.01 | Có | SL hiện tại | — | `> 0` (C, A, D CHECK) | `修正後数量は0より大きい値を入力してください / Số lượng mới phải lớn hơn 0` |
| F-04 | 修正後単価 / Đơn giá mới (¥) | integer | Có | đơn giá hiện tại | — | `≥ 0`, số nguyên (C, A, D CHECK) | `単価は0以上の整数で入力してください / Đơn giá phải là số nguyên ≥ 0` |
| F-05 | (ràng buộc chung F-03/F-04) | — | — | — | — | Ít nhất một giá trị khác hiện tại (A, D) | `現在の値と同じです / Giá trị mới giống giá trị hiện tại` |
| F-06 | 影響範囲 / Ảnh hưởng | 2 checkbox `精算`, `引渡し` | — | Hệ thống tick sẵn, không bỏ được mục tự suy | Suy ra ở D (mục 9.1) | Người dùng chỉ thêm, không bớt (A, D) | — |
| F-07 | 修正理由 / Lý do | textarea 1–500 | Có | trống | — | Không rỗng sau trim (C, A, D) | `修正理由を入力してください / Phải nhập lý do điều chỉnh` |
| F-08 | 証跡 / Bằng chứng | file nhiều (jpg/png/pdf, ≤ 10 MB/file, ≤ 5 file), tải qua `POST /api/attachments` (quyền `attachments.upload` (mới)) | Có khi F-06 chứa mục thuộc `correction_evidence_required_when` (mặc định `精算`, `引渡し`) | — | `attachments` | Bắt buộc theo điều kiện (C, A, D) | `精算・引渡しに影響する修正には証跡の添付が必要です / Điều chỉnh ảnh hưởng quyết toán / giao hàng phải đính kèm bằng chứng` |

### 5.2 Quyết định (SCR-023)

Quyết định chọn bằng **ba nút** ở §7 (承認 / 却下 / 追加情報依頼), mỗi nút mở hộp xác nhận `{判断}してよろしいですか？ / Xác nhận {quyết định}?`; không có ô radio riêng.

| ID | Nhãn (JP / VI) | Kiểu | Bắt buộc | Mặc định | Nguồn lựa chọn | Validation (tầng) | Thông báo lỗi |
|---|---|---|---|---|---|---|---|
| F-12 | コメント / Ý kiến | textarea ≤ 500 | Có khi bấm 却下 hoặc 追加情報依頼 | trống | — | (C, A, D) | `却下・追加情報依頼にはコメントが必要です / Từ chối / yêu cầu thêm thông tin phải ghi ý kiến` |

## 6. Trạng thái màn hình

| Trạng thái | Điều kiện | Hiển thị / hành vi |
|---|---|---|
| Đang tải | Chờ API | Skeleton |
| Trống | Không có yêu cầu theo bộ lọc | `該当する修正申請はありません / Không có yêu cầu nào` |
| Lỗi tải | ≠ 2xx | Banner + `再読込` |
| Không có quyền | Thiếu cả 2 quyền | 403 với AUTH-403 |
| Ngày gốc đã khóa | `business_days.status = locked` | Nhãn `締め済 — 修正は-R/-A仕訳で反映 / Đã khóa — điều chỉnh ghi bằng bút toán -R/-A` |
| Ngày gốc còn mở | `open` | Gợi ý: có thể hủy và nhập lại ở chi tiết giao dịch `/trades/{id}` (SCR-018, chưa có spec — README) thay vì điều chỉnh |
| Không có ngày mở | `fn_current_business_date()` = NULL (ví dụ sau khóa ~10:00, trước khi mở ngày sau) | Nút 承認 khóa: `修正仕訳を記帳する業務日が開始されていません / Không có ngày nghiệp vụ đang mở để ghi bút toán điều chỉnh` |
| Là người tạo | `requested_by = me` | Vùng quyết định thay bằng `ご自身の申請は承認できません / Bạn là người tạo — không được tự duyệt` |
| Đã duyệt cấp này | Người dùng đã quyết ở cấp trước | Vùng quyết định ẩn: `この申請は承認済みです（{n}次）/ Bạn đã duyệt cấp {n}` |
| Mất mạng | offline | Mọi nút khóa (BC-77 bảng 9.6) với thông báo chung NET-01: `この操作にはネットワーク接続が必要です / Thao tác này cần có mạng` |
| Đang gửi / Thành công | POST | Khóa nút / toast + tải lại |

## 7. Hành động

| Nút / thao tác | Quyền | Bật khi | Gọi API | Kết quả thành công | Kết quả lỗi |
|---|---|---|---|---|---|
| `申請 / Gửi yêu cầu` | `corrections.request` | Form hợp lệ, file đã tải lên | `POST /api/attachments` (từng file) → `POST /api/corrections` `{trade_id, new_qty, new_unit_price, reason, impact_extra, attachment_ids}` → `fn_request_correction` | 201, `pending`; audit `request_correction` trong hàm | 400 |
| `再申請 / Gửi lại` | `corrections.request` | `need_info`, người dùng là người tạo | `PATCH /api/corrections/{id}` (sửa F-03..F-08) → `pending` | Audit `resubmit_correction` | 400 |
| `承認 / Duyệt` (hộp xác nhận) | `corrections.approve` | `pending`, người duyệt ≠ người tạo, chưa duyệt cấp trước; cấp cuối cần có ngày hiện tại | `POST /api/corrections/{id}/decision` `{decision:'approve', note}` → `fn_decide_correction` | Cấp cuối: gốc → `reversed`, thêm `-R`, `-A`; cấp chưa cuối: tăng cấp | 400 |
| `却下 / Từ chối` (hộp xác nhận) | `corrections.approve` | `pending`, người duyệt ≠ người tạo, F-12 có nội dung | `{decision:'reject', note}` | `rejected`; gốc không đổi | 400 |
| `追加情報依頼 / Yêu cầu thêm thông tin` (hộp xác nhận) | `corrections.approve` | như 却下 | `{decision:'need_info', note}` | `need_info`; thông báo trong app cho người tạo | 400 |

## 8. Phân quyền hiển thị

| Vai trò | Thấy màn hình | Thấy vùng / cột | Thao tác được |
|---|---|---|---|
| `settlement` | Có | Form, hàng đợi, chi tiết | Tạo, gửi lại yêu cầu |
| `approver` | Có | Hàng đợi, chi tiết, vùng quyết định | Duyệt / từ chối / yêu cầu thêm (không với yêu cầu của mình) |
| `trade` | Không (đích: xem ở chi tiết giao dịch) | — | Không — BC-47 ghi TRADE "yêu cầu hủy/sửa sau xác nhận"; mở quyền là câu hỏi Q-022-1 |
| `sys_admin` | Không (chỉ xem qua audit) | — | Không |
| `intake`, `judge`, `delivery`, `market_ops` | Không | — | Không |
| `rule_admin` (đích) | Không | — | Đặt `approval_levels` ở màn hình quy tắc |

MFA: `approver` và `settlement` nằm trong `system_settings.mfa_required_roles` (BC-85, G-19) nên phải đăng nhập AAL2 ở SCR-001; phiên chưa AAL2 thì `guard()` trả 401 với M-06 của SCR-001 (thông báo chung, README). Không hỏi MFA lại theo thao tác. Thiếu quyền → 403 AUTH-403.

## 9. Quy tắc nghiệp vụ và điểm phân nhánh

**9.1 Suy ra ảnh hưởng (tầng D, `fn_request_correction`) — giả định (S) dựa trên BC-45:**

| Điều kiện | Ảnh hưởng tự tick |
|---|---|
| `new_qty × new_unit_price ≠ amount` | `精算` (quyết toán) |
| Giao dịch đã có ≥ 1 dòng `deliveries` **và** `new_qty ≠ qty` | `引渡し` |
| `new_qty <` đã giao ròng (của cả chuỗi, mục 4) | `引渡し` + cảnh báo `修正後数量が引渡し累計を下回ります / Số lượng mới nhỏ hơn số đã giao` (không chặn) |

Bằng chứng bắt buộc khi ảnh hưởng thuộc `fn_rule('correction_evidence_required_when', ngày hiện tại)` — mặc định `["settlement","delivery"]` (ADR-008), đúng chữ BC-45. Hệ quả: gần như mọi điều chỉnh tiền đều cần bằng chứng; nếu khách muốn hẹp hơn thì đổi khóa này.

**9.2 Tạo yêu cầu:**

| # | Điều kiện | Hành vi | Căn cứ |
|---|---|---|---|
| 1 | Giao dịch không sống | Chặn | BC-32 |
| 2 | Đã có yêu cầu `pending`/`need_info` cho giao dịch | Chặn: `この取引には処理中の修正申請があります / Giao dịch này đã có một yêu cầu đang xử lý` (partial unique index, G-17) | Giả định (S): giữ hành vi prototype; RFP không có quy tắc này |
| 3 | Giá trị mới = cũ | Chặn | — |
| 4 | Thiếu bằng chứng khi có ảnh hưởng | Chặn | BC-45, G-10 |

**9.3 Quyết định (`fn_decide_correction`):**

| Tình huống | Hành vi | Căn cứ |
|---|---|---|
| `decided_by = requested_by` | Chặn: `申請者本人は承認できません / Người soạn không được tự duyệt yêu cầu của mình` | BC-88 |
| Cùng người đã quyết ở cấp trước | Chặn: `同一承認者が複数段階を承認することはできません / Một người không duyệt hai cấp` | BC-46 (S) |
| `approve`, cấp < `fn_rule('approval_levels', ngày tham chiếu)` (ADR-009 §3) | Ghi `correction_decisions(level)`, giữ `pending` | Q11 |
| `approve`, cấp cuối | Khóa dòng gốc; ngày ghi = `fn_current_business_date()` (ADR-009); nếu tăng SL: `delta ≤ lots.available_qty` (D); gốc → `reversed`; thêm `-R` (SL âm, giá cũ) và `-A` (giá trị mới), `reverses_id` = gốc, `rule_set_id` áp dụng tại ngày ghi; tồn lô điều chỉnh theo delta | ADR-005, BC-44, BC-33 |
| `approve`, gốc không còn `confirmed` | Chặn: `元取引が確定状態ではありません / Giao dịch gốc không còn ở trạng thái đã chốt` | ADR-005 |
| `approve`, thiếu tồn | Chặn: `ロットの在庫が不足しています（不足{n}）/ Lô không đủ hàng để tăng số lượng thêm {n}` | BC-33 |
| `approve` cấp cuối, không có ngày hiện tại | Chặn: `修正仕訳を記帳する業務日が開始されていません / Không có ngày nghiệp vụ đang mở để ghi bút toán điều chỉnh` (mục 6); các cấp trước vẫn duyệt được | ADR-009 |
| `reject` / `need_info` | Không đụng tới `trades`; bắt buộc F-12 | BC-45 |
| Bất kỳ | Audit trong giao dịch: before/after của `corrections` và các dòng `trades` mới | ADR-006 |

Kỳ đã khóa không bao giờ thay đổi tổng; chênh lệch hiện ở ngày ghi (BC-69). Duyệt **không** tự xuất lại CSV của ngày gốc; dòng `-R`/`-A` vào batch của ngày ghi với `line_status = 調整済み` (SCR-024 §9.4).

## 10. Tiêu chí nghiệm thu

1. **Yêu cầu thiếu bằng chứng.** Given GD 100 × ¥1.000 đã có một lần giao 40, `correction_evidence_required_when` mặc định; When gửi `new_qty = 90` không file; Then 400 `精算・引渡しに影響する修正には証跡の添付が必要です / …`; `impact_settlement` và `impact_delivery` đều được suy ra.
2. **Bản gốc giữ nguyên trước duyệt.** Given yêu cầu `pending`; Then `trades` gốc không đổi `qty`, `unit_price`, `status`; báo cáo ngày gốc không đổi.
3. **Maker = checker.** Given người dùng U có cả `corrections.request` và `corrections.approve` tạo yêu cầu; When U gọi API duyệt (bỏ qua UI); Then 400 `申請者本人は承認できません…`, trạng thái vẫn `pending`.
4. **Duyệt sinh -R/-A ở ngày hiện tại.** Given GD `T261015-0012` (100 × ¥1.000) ngày 2026-10-15 `locked`, ngày hiện tại 2026-10-16 `open`, yêu cầu `pending` do S1 tạo; When A1 duyệt yêu cầu 90 × ¥1.100; Then gốc `reversed`; có `T261015-0012-R` (−100 × ¥1.000) và `T261015-0012-A` (90 × ¥1.100) với `business_day = 2026-10-16`; tổng ròng 2026-10-15 không đổi.
5. **Từ chối không ý kiến.** When `reject` không `note`; Then 400 `却下・追加情報依頼にはコメントが必要です`.
6. **Yêu cầu thêm thông tin.** When `need_info` có ý kiến; Then trạng thái `need_info`, người tạo nhận thông báo; When người tạo bổ sung file và gửi lại; Then `pending`, lịch sử giữ cả hai lần.
7. **Hai cấp duyệt.** Given `approval_levels = 2`; When A1 duyệt; Then vẫn `pending` (1/2), chưa có `-R/-A`; When A1 duyệt lần nữa; Then 400; When A2 duyệt; Then sinh `-R/-A`.
8. **Tăng SL vượt tồn.** Given lô của GD còn 5, yêu cầu tăng SL thêm 8 đang `pending`; When duyệt cấp cuối; Then 400 thiếu tồn, không dòng mới.
9. **Một yêu cầu đang xử lý mỗi giao dịch.** Given đã có yêu cầu `need_info`; When tạo yêu cầu mới cho cùng giao dịch; Then 400 `この取引には処理中の修正申請があります`.
10. **Offline.** Given mất mạng; Then nút 申請 / 承認 / 却下 / 追加情報依頼 khóa với NET-01.
11. **Chưa có ngày hiện tại.** Given 2026-10-16 đã khóa, ngày 2026-10-17 chưa mở, `approval_levels = 1`; When approver duyệt; Then 400 `修正仕訳を記帳する業務日が開始されていません…`, không có dòng `-R/-A`.
12. **Lũy kế theo chuỗi.** Given GD gốc 100 đã giao 60, rồi được điều chỉnh thành `-A` 90; When mở yêu cầu mới trên dòng `-A`; Then "đã giao ròng" = 60 (tính cả lần giao ghi trên dòng gốc).

## 11. Khác prototype LAB-2 và việc cần làm

| G-xx | Hiện tại | Cần đổi |
|---|---|---|
| G-10 | Không bằng chứng, không `need_info`, không cột ảnh hưởng | `attachments`, `impact_*`, trạng thái `need_info` |
| G-17 | "Một pending / giao dịch", "lý do khi từ chối" chỉ ở API | Partial unique index (`pending`,`need_info`); CHECK lý do ở D |
| G-06 | Tạo yêu cầu insert thẳng bảng ở API; audit sau | `fn_request_correction`; audit trong hàm |
| G-05 | Một cấp duyệt hardcode | `fn_rule('approval_levels')` + bảng `correction_decisions(level)` |
| G-19 | Không MFA cho người duyệt | MFA theo phiên cho `approver`, `settlement` (`system_settings.mfa_required_roles`, SCR-001) |
| G-13 | Duyệt đổi tồn nhưng không cập nhật `lots.status` | Trạng thái lô suy ra từ tồn |
| G-18 | Mã -R/-A tự nối chuỗi; bộ đếm ngày đếm cả dòng -R/-A | `doc_counters` chỉ đếm dòng gốc |
| G-14 | `requested_by`, `decided_by` không FK | FK `profiles(id)` |

## 12. Câu hỏi mở

- **Q11 / BC-46:** ai yêu cầu, mấy cấp, cách hủy — Plan A: một cấp, cấu hình được; người duyệt = `approver` (trưởng đối soát, S).
- **Q-009-1 (mới, ADR-009):** sau khi khóa ~10:00 tới lúc mở ngày sau không có ngày hiện tại nên duyệt cấp cuối phải chờ; khách có cần ghi bút toán ngay sau 10:00 không?
- **Q-022-1 (mới):** `trade` có được tạo yêu cầu (BC-47 ghi TRADE) không? Giả định: chỉ `settlement` như prototype; mở bằng cách cấp `corrections.request` cho `trade`.
- **Q-022-2 (mới):** người tạo có được rút yêu cầu `pending` không? Giả định: không (RFP không nêu cách hủy, BC-46).
- **Q-022-3 (mới):** điều chỉnh khoản khác ngoài SL / đơn giá (đổi người mua, đổi lô) — ngoài phạm vi; làm bằng hủy + nhập lại khi ngày còn mở.
