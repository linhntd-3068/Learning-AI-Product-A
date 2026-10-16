# 01 — Danh mục ràng buộc và quy tắc nghiệp vụ (Product A – 桜水産市場 業務支援システム)

Mục đích: liệt kê các ràng buộc mà thiết kế chi tiết **phải** tôn trọng, đặc biệt các điểm phân nhánh mà thiết kế "một luồng thẳng" dễ làm phẳng.
Nguồn: RFP gốc tiếng Nhật `product-a-rfp-ja-v1.0-rc7` (bản có thẩm quyền), `discovery/rfp-summary-vi.md`, `discovery/client-qa-list.xlsx` (Q1–Q35).
Không có file thứ cấp nào (glossary/actor-cast HTML) được dùng làm căn cứ.

## Cách đọc

Cột **Mức**:
- **B** = Bắt buộc: có chữ trong RFP (trích mã ID/mục).
- **A (Qxx)** = Giả định Plan A chờ khách trả lời Qxx; lấy từ cột "Plan A" của `client-qa-list.xlsx`.
- **S** = Suy luận / đề xuất của design: RFP im lặng hoặc mơ hồ, nhóm tự chọn. Qxx đi kèm nếu đã có câu hỏi nhưng chưa có Plan A. RFP im lặng không có nghĩa là đồng ý mở rộng phạm vi (RFP 00-06).

Ghi chú nguồn: mã `FIG-xxx` là hình, `TBL-xxx` là bảng, `07-0x` là mục. Hình FIG-004 đã được kiểm tra trực tiếp trên ảnh trang 17 của PDF (bản parse mất cấu trúc cột).

Lưu ý bối cảnh: RFP là tài liệu mô phỏng cho khóa đào tạo; thuật ngữ Nhật là nhãn nghiệp vụ của case này, không đại diện toàn bộ chợ bán buôn Nhật (RFP B.1). Vì vậy không suy rộng từ "luật chợ Nhật thật" ngoài những gì RFP/Q&A nêu.

---

## 1. Tư cách tham gia: 許可 / 承認 / đăng ký

Hai nguồn sự thật: TBL-ACTOR-01 (02-02), FIG-004 (02-02), FIG-010, B.2.

Ma trận FIG-004 (đọc từ ảnh gốc):

| Vai trò | 参加資格 (căn cứ tham gia) | 取引実行 | 一時停止・解除 (tạm dừng / gỡ) |
|---|---|---|---|
| 卸売業者 | 市場登録 (đăng ký với chợ) | 承認 | 承認 |
| 仲卸 | 許可 | 承認 | 条件付き (có điều kiện) |
| 売買参加者 | 承認 | 承認 | 再審査 (tái thẩm định) |
| 市場運営者 | 管理 | 管理 | 管理 |

| ID | Ràng buộc | Nguồn | Mức | Ảnh hưởng thiết kế |
|---|---|---|---|---|
| BC-01 | 許可 (giấy phép, qua thẩm định, điều kiện) và 承認 (chấp thuận) là hai căn cứ tham gia khác bản chất; **không được gộp thành một quy tắc/bảng "license" chung**. Gộp = bị xem không đạt. | 02-08; 12-06; 13-01; FIG-004 | B | Bảng tư cách `participant_qualifications` (ADR-007) phải có cột `basis_type` (REGISTRATION / PERMIT / APPROVAL) và logic kiểm tra tách theo basis; màn hình hồ sơ hiển thị nhãn khác nhau cho 3 loại |
| BC-02 | Bốn nhóm tham gia: 卸売業者 (đăng ký với chợ + quy chế nội bộ), 仲卸 (許可 còn hiệu lực), 売買参加者 (承認 còn hiệu lực), 買出人 (đăng ký tại điểm giao dịch). | TBL-ACTOR-01; FR-PARTY-01 | B | Enum `party_kind` 4 giá trị; mỗi kind map 1 basis |
| BC-03 | Hệ thống phải lưu **loại** nhóm + trạng thái hiệu lực; hiển thị ngày hiệu lực, ngày mất hiệu lực và trạng thái tạm dừng (nếu có). | FR-PARTY-01; B.2 | B | Màn hình hồ sơ: effective_from, expires_on, suspended flag |
| BC-04 | Vòng đời tư cách: 有効 ⇄ 一時停止 → 失効 → 再審査; sự kiện: nộp đơn, phê duyệt, vi phạm, gỡ, hết hạn. | FIG-010 | B (hình), S (chi tiết transition) | State machine `eligibility_status`; bảng event log |
| BC-05 | Tạm dừng / gỡ khác nhau theo nhóm: 卸売業者 cần phê duyệt; 仲卸 có điều kiện; 売買参加者 phải tái thẩm định (再審査). "条件付き" không được RFP giải thích điều kiện là gì. | FIG-004 | B (hình), S (nội dung "điều kiện") | Ba nhánh workflow riêng; `conditional_terms` (text) cho 仲卸; nhánh 再審査 cho 売買参加者 |
| BC-06 | Kiểm tra hiệu lực 許可/承認 **tại thời điểm chốt giao dịch** (không phải lúc tạo nháp, không phải lúc đăng nhập). Hết hạn → từ chối, hiện lý do, không tạo giao dịch. | BR-PERM-01; FR-PARTY-02; FR-AITAI-02 | B | Check nằm ở transition `確認待ち → 確定`, không ở lúc nhập |
| BC-07 | Cảnh báo hồ sơ sắp hết hạn trước ngày mất hiệu lực, **thời gian cảnh báo cấu hình được**; thông báo trong app + email; báo cáo RPT-03 (đã/sắp hết hạn) hằng ngày. | FR-PARTY-03; FR-NOTIFY-01; RPT-03 | B | Bảng cấu hình `expiry_warning_days`; job hằng ngày |
| BC-08 | Khi giao hàng có bước "権限失効確認"; nhánh 解除後 (sau khi gỡ). RFP **không nói** giao dịch đã chốt lúc còn hiệu lực mà đến lúc giao đã hết hạn thì chặn giao hay cho giao. | FIG-014 (bước giao hàng). EX-TRADE-01 chỉ nói tư cách hết hạn **sáng ngày giao dịch** → tạm dừng giao dịch, không nói về lúc giao | B (có bước kiểm tra), chờ Q31 (hành vi) | Điểm phân nhánh ở tác vụ "hoàn tất giao"; xem bảng 6.2 |
| BC-09 | "Hết hạn ngày X" tính từ lúc nào (00:00 lịch / 02:00 ngày nghiệp vụ X / hết ngày X) chưa chốt. | EX-TRADE-01; Q31 | S (Q31 chưa có Plan A) | Hàm `isValidAt(party, businessDate, timestamp)` tách riêng, quy tắc cấu hình được |
| BC-10 | 卸売業者 chỉ "đăng ký với chợ", RFP không nêu hạn đăng ký hay kiểm tra phía bán; BR-PERM-01 chỉ nói 許可/承認. | TBL-ACTOR-01; Q33 | S (Q33 chưa có Plan A) | Đề xuất: chỉ kiểm tra trạng thái tạm dừng của bên bán trong v1, cấu hình được; ghi nhận là giả định |
| BC-11 | 買出人 "đăng ký tại điểm giao dịch" nhưng RFP 05-05 EX-02 lại nêu "参加有効期限が切れている" cho 買出人 → 買出人 cũng có khái niệm hạn tham gia dù BR-PERM-01 không nhắc. | TBL-ACTOR-01 vs 05-05 EX-02 | S (mâu thuẫn nội bộ RFP, chưa có Q) | Mô hình hiệu lực dùng chung `valid_from/valid_to`, nhưng **kiểu căn cứ** vẫn tách; đưa vào danh sách câu hỏi mới |
| BC-12 | RFP không nêu: thời hạn hiệu lực (mấy tháng/năm), quy trình xin cấp/tái cấp chi tiết, điều kiện của 条件付き. Plan A: chỉ ghi trạng thái + hạn, **không** làm workflow xin cấp. | Q5 | A (Q5) | Màn hình nhập/sửa tay hiệu lực; không làm form đơn xin; lưu `renewal_note` |
| BC-13 | Phạm vi người dùng ngoài: Plan A chỉ người dùng nội bộ đăng nhập; bên ngoài chỉ nhận email (không portal, SCOPE-OUT-04). | Q4; SCOPE-OUT-04 | A (Q4) | Không có tài khoản/MFA cho 買出人, 仲卸, 売買参加者 trong baseline |

### 1.1 Cái RFP KHÔNG nói về "ai được mua ở đâu"

TBL-ACTOR-01 chỉ ghi: 卸売業者 tạo lô, 相対取引, bán qua せり; 仲卸 mua/nhận/đối soát/thanh toán; 売買参加者 mua "theo quy chế chợ"; 買出人 mua liên tục "theo quy chế chợ". FR-AITAI-01 ghi 買出人 là bên mua của 相対. Như vậy **nhóm bên mua** theo TBL-ACTOR-01 là 仲卸, 売買参加者, 買出人; 卸売業者 là bên bán. **Không có chỗ nào RFP phân "ai được mua ở 相対 và ai ở せり"** (nội dung quy chế chợ không được cung cấp). Thiết kế **không** được tự bịa ma trận này; ma trận để cấu hình được (`trade_kind_matrix`, ADR-008), mặc định (S): **cả ba nhóm bên mua có tư cách hiệu lực được phép ở cả 相対 và せり**.

---

## 2. Quy tắc vận hành chợ (業務規程) và quản trị phiên bản

| ID | Ràng buộc | Nguồn | Mức | Ảnh hưởng thiết kế |
|---|---|---|---|---|
| BC-14 | Quy tắc/tỷ lệ có **ngày hiệu lực + số phiên bản**; phiên bản mới **không được làm biến dạng lịch sử đã chốt**. | 06-04; B.6; NFR-OPS-02 | B | Bảng `rule_version(version_no, effective_from, status, maker, checker)`; mọi bản ghi tính toán lưu `rule_version_id` đã áp dụng |
| BC-15 | Đổi quy định/tỷ lệ **tối đa 4 lần/năm** (GOV-RULE-01, B.6 "年4回まで"). | GOV-RULE-01; B.6 | B | Bộ đếm theo năm + cảnh báo khi đạt 4; không chặn cứng (RFP không nói chặn khi vượt, chỉ nêu "tối đa") — S cho hành vi khi vượt |
| BC-16 | **Tách người soạn / người duyệt** (maker–checker); bản nháp chưa duyệt **không có hiệu lực**. | GOV-RULE-01; FR-INC-02; B.6 | B | Trạng thái `DRAFT → APPROVED → EFFECTIVE`; kiểm tra `maker ≠ checker`; chỉ ROLE-RULE-ADMIN soạn |
| BC-17 | Ngày hiệu lực **được đặt ở tương lai**. | FR-INC-02; B.6 | B | Resolver chọn version theo `effective_from <= businessDate` |
| BC-18 | **Rollback bắt buộc, truy vết được**, theo đơn vị version (không sửa dữ liệu lịch sử). | FR-INC-02; B.6; ROLE-RULE-ADMIN | B | Rollback = phát hành version mới trỏ lại nội dung cũ, ghi audit; không UPDATE/DELETE version cũ |
| BC-19 | Quy tắc/tỷ lệ là **cấu hình có kiểm soát**, không phải mã: đổi bằng version mới, không cần deploy, không sửa dữ liệu lịch sử. Demo bằng version mới là tiêu chí nghiệm thu. | NFR-OPS-02; FR-INC-02 ("デプロイ不要") | B | Mọi hằng số quy tắc (hệ số thuế, tỷ lệ, ngưỡng cảnh báo...) nằm trong `rule_version`/`config`, không hard-code |
| BC-20 | Mỗi version ghi: người soạn, người duyệt, ngày hiệu lực, trạng thái; bản ghi khuyến khích/quyết toán hiện version và ngày hiệu lực đã áp dụng. Báo cáo RPT-12 liệt kê thay đổi + version áp dụng. | FR-RULE-01; FR-AUDIT-03; RPT-12 | B | Cột `rule_version_id` trên `incentive_calc`, `settlement`; màn hình RPT-12 |
| BC-21 | Ai chốt version: thực hiện = Rule admin + bộ phận đối soát; chịu trách nhiệm cuối = **trưởng bộ phận đối soát**. | RACI-01 (11-03) | B | Vai trò "duyệt version" = trưởng đối soát (cần MFA, BC-85) |
| BC-22 | RFP **không nêu** khác biệt theo từng chợ hay từng mặt hàng; chỉ có "một chợ" (桜水産市場). Phần quy tắc theo mặt hàng duy nhất được Plan A nêu: thuế suất cài theo mặt hàng (Q29). | Q29 | A (Q29) cho thuế; không có per-market | Không thiết kế đa chợ (YAGNI); `tax_rate` gắn mặt hàng |
| BC-23 | Cấu trúc bảng tỷ lệ chưa biết (`incentive-rate-table.csv` không có trong gói; "ngưỡng tối thiểu" ở INC-EDGE-01 gợi ý tỷ lệ theo bậc). Plan A: khách cung cấp bảng, hệ thống quản lý theo version. | Q16; C.1; INC-EDGE-01 | A (Q16) | Schema tỷ lệ: bảng bậc `(min_ratio, rate)` thuộc một `rule_version`, dùng dữ liệu giả để chạy prototype |

---

## 3. Loại giao dịch: 相対取引 vs せり

| ID | Ràng buộc | Nguồn | Mức | Ảnh hưởng thiết kế |
|---|---|---|---|---|
| BC-24 | 相対取引 là **luồng chính** (~90%), せり là phụ (~10%). Coi là hệ thống đấu giá = bị loại thẳng. Mẫu: 2026-07-15 có 636 相対 / 70 せり. | 01-03; 13-01; 12-06; FIG-009; C.5; FIG-027 | B | Điều hướng, thứ tự menu, phím tắt: 相対 là luồng mặc định; せり là màn hình "ghi kết quả" |
| BC-25 | Tỷ lệ 90/10 trong C.5 ghi là **tỷ lệ giá trị**; FIG-009/báo cáo mẫu là tỷ lệ số giao dịch. Dùng một nguồn số nhất quán khi tính tải. | C.5 vs FIG-009/FIG-027 | B (mâu thuẫn nhẹ) | Dữ liệu mẫu: ~90/10 theo số giao dịch (1.200 giao dịch/ngày cao điểm) |
| BC-26 | 相対 ghi: mã giao dịch, người mua, số lượng, đơn giá, 業務日 (phiếu FORM-TRADE-01: buyer, price, quantity, **確定者**); trừ đúng số lượng khả dụng của lô. | FR-AITAI-01; D.1 | B | Bảng `trade` (kind=AITAI) + `confirmed_by`; transaction trừ `lot.available_qty` |
| BC-27 | せり: **chỉ ghi kết quả cuối** do **con người** nhập: người thắng, số lượng, đơn giá, thời điểm, người xác nhận. **Không OCR, không suy luận từ ảnh/ký hiệu tay (手やり/符丁), không phòng đấu giá thời gian thực, không bid trực tuyến.** | FR-SERI-01/02; SCOPE-OUT-02; CAP-HUMAN-01; D.1 FORM-SERI-01 | B | Bảng `trade` (kind=SERI) cùng mã nghiệp vụ, thêm `winner_party_id`; form không có trường ảnh→giá; không có WebSocket/bid |
| BC-28 | せり: người chốt là **運営者 (せり進行役)**; kết quả là "kết quả cuối cùng do người vận hành xác nhận". Không đưa ra quyết định cuối thay con người. | B.3; FR-SERI-01; CAP-HUMAN-01; 03-07 | B | Trường `confirmed_by` bắt buộc; không có chế độ auto-confirm |
| BC-29 | **Tiêu chí loại 13-01**: không giữ người quyết định cuối ở các điểm bắt buộc (CAP-HUMAN-01: đánh giá tươi/chất lượng lô; chốt kết quả せり; phê duyệt sửa nhạy cảm; xác nhận hoàn tất giao hàng có tranh chấp). Ngoài ra không được loại người khỏi "đánh giá chất lượng và xác nhận kết quả nghiệp vụ". | 13-01; 06-03; 03-07 | B | Mọi transition ở 4 điểm này phải có `actor_id` người thật; không có batch/auto-approval, không gợi ý AI tự chốt |
| BC-30 | Hệ thống **không ép chợ đổi mô hình giao dịch** cho vừa phần mềm (03-07). | 03-07 | B | Không thêm bước bắt buộc mới ngoài flow hiện có (ví dụ không bắt đấu giá online) |
| BC-31 | Mọi giao dịch gắn với 業務日, người tham gia và lô; mỗi giao dịch **chỉ một mã nghiệp vụ chính** (một identifier xuyên suốt lot → trade → delivery → settlement). | B.3; 06-04; 06-01 | B | `lot_code`, `trade_code` là khóa nghiệp vụ duy nhất; mọi bảng con dùng FK này |
| BC-32 | Vòng đời trạng thái giao dịch (cả 相対 và せり): 下書き → 確認待ち → 確定; có 取消 (hủy, chỉ trước khi khóa), 更正 (cải chính) qua yêu cầu sửa → duyệt → 再確定. Hủy trả lại số lượng khả dụng. | FIG-012; FR-AITAI-03 | B | State machine chung; transition 確定 chạy BC-06 + BC-33 |
| BC-33 | Từ chối chốt nếu (a) người tham gia hết hiệu lực, hoặc (b) lô không đủ số lượng. Số lượng khả dụng **không bao giờ âm**; mọi điều chỉnh truy được lịch sử. | FR-AITAI-02; FR-LOT-03; BR-LOT-02 | B | Check + khóa hàng (row lock) trên `lot.available_qty` trong cùng transaction với chốt |
| BC-34 | Ai nhập/xác nhận 相対: ROLE-TRADE xác nhận; RFP không xác định nhân viên nhà bán buôn có nhập trực tiếp không. | TBL-ROLE-01; Q8 | S (Q8 chưa có Plan A) | Đề xuất: chỉ nhân viên chợ nhập và xác nhận trong v1 |
| BC-35 | Thời điểm nhập せり (trong phiên hay gộp sau phiên) chưa chốt. | Q10 | S (Q10 chưa có Plan A) | Màn hình hỗ trợ nhập từng dòng và lưu nháp; không tự sinh kết quả |
| BC-36 | 直荷引き (giao thẳng, không qua せり/相対) **ngoài phạm vi số hóa**, chỉ là bối cảnh; nếu dữ liệu migration có loại này thì cần quy tắc loại ra. | A.5; SCOPE | B | Không có `trade_kind = DIRECT`; migration rule loại bỏ |
| BC-37 | Đơn vị số lượng chưa chốt; Plan A: mỗi mặt hàng một đơn vị, không quy đổi. Lô có thể bán thành nhiều giao dịch. | Q9 | A (Q9) | `item.unit` cố định theo mặt hàng; so sánh số lượng chỉ trong một đơn vị |
| BC-38 | Trạng thái lô: 受付 → 下見済 → 公開 → 確定 → 引渡し完了. Lô bán nhiều giao dịch: hình FIG-011 đi thẳng 確定 → 引渡し完了, RFP **không định nghĩa** trạng thái lô khi bán một phần. Ai ghi 下見 và có bắt buộc trước 公開 hay không chưa chốt. | FIG-011; BR-LOT-02; Q9; Q32 | S (Q9 chung, Q32 chưa có Plan A) | Trạng thái lô suy ra từ `available_qty` và tổng đã giao, không lưu cứng "確定" khi còn hàng; `inspected_by` tùy chọn |

---

## 4. Ngày nghiệp vụ (業務日), khóa sổ (締め) và điều chỉnh sau khóa

Mốc giờ trong RFP (JST): 02:00–02:30 nhận lô sớm, **mở 業務日**, phân người; 02:30–05:00 cao điểm giao dịch và ghi kết quả; 05:00–08:00 cập nhật giao hàng, đối soát tạm, xử lý ngoại lệ; 08:00–10:00 chốt giao dịch buổi sáng, gom báo cáo ngày, xuất đối soát; sau 10:00 sửa có phê duyệt, xác nhận thanh toán, việc văn phòng (02-07). Mâu thuẫn nhỏ: A.1 ghi cao điểm 02:15–05:00 (RFP tự có hai số).

| ID | Ràng buộc | Nguồn | Mức | Ảnh hưởng thiết kế |
|---|---|---|---|---|
| BC-39 | 業務日 dùng **JST**; mọi giao dịch, khóa sổ, báo cáo, khuyến khích gắn với 業務日, **không phải ngày lịch**. | B.4; BR-INC-01 | B | Cột `business_date` tách khỏi `created_at`; không dùng `DATE(created_at)` làm khóa nghiệp vụ |
| BC-40 | Giờ mở 業務日 nằm trong khung 02:00–02:30 (RFP không nêu giây chính xác); giao dịch lúc 01:50 thuộc ngày nào chưa chốt. | 02-07 | S (chưa có Q) | Ngày nghiệp vụ hiện tại = ngày đang `open`, mở bằng thao tác "mở ngày" (ROLE-INTAKE / ROLE-SETTLEMENT). Mốc đồng hồ (timestamp − `business_day_start_time` 02:00 JST) chỉ dùng cho cảnh báo và gợi ý ngày cần mở (ADR-009) |
| BC-41 | Lịch chợ (ngày nghỉ) là master data; dịch vụ 6 ngày/tuần, trừ ngày nghỉ theo lịch chợ. | RFP dòng 192: 「02:00-10:00 JST、週6日、市場カレンダー上の休市日を除く」 | B | Bảng `market_calendar`; không có 業務日 ở ngày nghỉ |
| BC-42 | Báo cáo ngày (RPT-01..09) hằng ngày; batch báo cáo ngày hoàn thành **trước 11:00 JST**; 11:00 nằm ngoài giờ dịch vụ 02:00–10:00 (nên hệ thống không được "tắt" sau 10:00). | FIG-LOAD-01; C.5; Q25 | B (11:00); S (Q25 chưa có Plan A cho bảo trì ngoài giờ) | Job batch chạy sau chốt buổi sáng, SLA 11:00; cảnh báo nếu trễ |
| BC-43 | **Khóa ngày nghiệp vụ** (FR-SETTLE-02): sau khóa **không được sửa trực tiếp** (BR-CLOSE-01); mọi lần cố sửa bị chặn và **ghi log** (FR-CORR-03). | BR-CLOSE-01; FR-SETTLE-02; FR-CORR-03 | B | Guard ở tầng dịch vụ cho `trade/delivery/settlement` theo `business_date.locked`; log mọi lần bị chặn |
| BC-44 | Sau khóa chỉ còn con đường điều chỉnh kiểm soát: **bút toán đảo (reverse) hoặc chênh lệch (delta)** đã duyệt; **không ghi đè**; giữ lịch sử, bản gốc không đổi trước khi duyệt. | B.4; FR-CORR-01/02 | B | Mô hình append-only: `correction_request` + `reversal/delta` record; không UPDATE bản ghi đã chốt |
| BC-45 | Phiếu yêu cầu sửa FORM-CORR-01: bắt buộc mã giao dịch/bản ghi, 業務日, lý do, người yêu cầu; **bằng chứng đính kèm bắt buộc khi ảnh hưởng quyết toán/giao hàng**; kết quả: duyệt / từ chối / yêu cầu thêm thông tin. | D.4 | B | Form + validation có điều kiện (attachment required nếu `impact ∈ {settlement, delivery}`) |
| BC-46 | Ma trận phê duyệt sửa sau xác nhận (ai yêu cầu, mấy cấp, mốc chốt, cách hủy) **chưa được RFP chốt**; bên dự thầu tự nêu giả định. Plan A: **một bước duyệt, cấu hình được**. | 07-03; D.4; Q11 | A (Q11) | Cấu hình `approval_levels` (mặc định 1); người duyệt = trưởng đối soát (S) |
| BC-47 | Thao tác nhạy cảm theo vai trò (phải audit): sửa thông tin lô sau xác nhận (INTAKE); sửa kết quả đánh giá sau khi lô đã vào giao dịch (JUDGE); yêu cầu hủy/sửa sau xác nhận (TRADE); chốt giao thiếu, trả hàng (DELIVERY); điều chỉnh quyết toán, **mở lại sổ** (SETTLEMENT); ban hành/rollback quy tắc (RULE-ADMIN); cấp đặc quyền, khóa/mở tài khoản (SYS-ADMIN). | TBL-ROLE-01 | B | Ma trận quyền (role × thao tác) + audit bắt buộc cho từng ô |
| BC-48 | "Mở lại sổ" (締め解除) tồn tại như thao tác nhạy cảm của ROLE-SETTLEMENT, trái nghịch với BR-CLOSE-01. Plan A: **cho mở khi có người duyệt**, dùng chung luồng duyệt của Q11. Sau khi đã xuất sang kế toán thì xử lý ra sao chưa chốt. | TBL-ROLE-01; 02-08; Q12 | A (Q12) | Mở lại = giao dịch được duyệt + audit; nếu `exported_to_accounting` thì buộc đi đường reverse/delta (S, an toàn hơn) |
| BC-49 | Kiểm tra trước khi khóa: bảng đối soát ngày phản ánh **mọi** giao dịch đủ điều kiện của 業務日, gộp giao dịch, giao hàng, ngoại lệ; khóa theo trình tự "đối soát xong → khóa". | FR-SETTLE-01/02; 07-03 | B | Màn hình chốt sổ có checklist: lô đang chờ, giao dịch `確認待ち`, giao hàng mở, tranh chấp mở |
| BC-50 | Khóa **theo 業務日 trong JST** ("JSTの業務日で締める"). Giao hàng vắt qua hai kỳ khóa sổ cần xử lý. | B.8; Q14 | B; A (Q14) cho giao nhiều kỳ | Delivery lưu `business_date` của từng lần giao riêng; cuối kỳ vẫn mở thì sinh delta kỳ sau |
| BC-51 | Tranh chấp (FR-SETTLE-03): lưu trạng thái, nguyên nhân, người xử lý, kết quả, ngày dự kiến; báo cáo RPT-09 theo SLA. Định nghĩa SLA và loại tranh chấp chưa có. | FR-SETTLE-03; RPT-09; Q13 | S (Q13 chưa có Plan A) | 8 màn hình lõi chỉ có cờ tranh chấp trên ngoại lệ giao hàng (`deliveries.disputed`, SCR-029); màn hình tranh chấp đầy đủ (SCR-026/027, bảng `dispute`, SLA) để giai đoạn sau |
| BC-52 | Không **xóa cứng** giao dịch hoặc quyết toán đã xuất hiện trong báo cáo chính thức. | B.7; TBL-ATTACH-01 | B | Không có DELETE; soft-state `CANCELLED/CORRECTED` |

---

## 5. Giao hàng (引渡し)

Lưu ý thuật ngữ: trong RFP "荷受け" (追跡/状態/確認電話) thực chất là **giao hàng cho người mua** (引渡し); "完納" có hai nghĩa (xem BC-65). Dùng thống nhất 引渡し trong tài liệu nội bộ.

| ID | Ràng buộc | Nguồn | Mức | Ảnh hưởng thiết kế |
|---|---|---|---|---|
| BC-53 | Theo dõi trạng thái giao hàng **theo từng lần giao**, tối thiểu: 待機 (chờ), 引渡し中 (đang giao), 完了 (hoàn tất), 例外 (ngoại lệ). | FR-DEL-01 | B | `delivery_batch.status` 4 giá trị; một trade có N batch |
| BC-54 | Một giao dịch có thể giao **nhiều lần** (do xe gom/dỡ hàng); hệ thống hiển thị lũy kế đã giao và phần còn lại; còn hàng thì giữ "chưa hoàn tất", chờ lần sau (vòng mở). | FR-DEL-05; EX-DEL-02; FIG-014; FIG-029 | B | `delivered_cum`, `remaining` tính từ các batch; hoàn tất khi `remaining = 0` |
| BC-55 | Hoàn tất chỉ khi số lượng xác nhận **khớp quy tắc quyết toán hiện hành**; thiếu trường bắt buộc hoặc sai số lượng thì không cho hoàn tất. | BR-DEL-03; FR-DEL-02 | B | Validation ở transition "hoàn tất"; không có nút "ép hoàn tất" |
| BC-56 | Ngoại lệ phải ghi **lý do**: giao thiếu, giao thừa, trả hàng, hủy một phần; **có người xác nhận ngoại lệ**. Người chốt giao thiếu/trả hàng = ROLE-DELIVERY (nhạy cảm, audit). | FR-DEL-03; TBL-ROLE-01 | B | Bảng `delivery_exception(reason_code, confirmed_by)`; reason code dạng enum + ghi chú |
| BC-57 | Xác nhận hoàn tất giao hàng **có tranh chấp** là điểm bắt buộc phải có người quyết định cuối. | CAP-HUMAN-01 | B | Ngoại lệ có `disputed = true` chỉ đóng khi một người (khác người ghi) bấm giải quyết, có ý kiến (`dispute_resolved_by/at`, SCR-029); chưa giải quyết thì giao dịch không `完了` |
| BC-58 | Bản ghi giao hàng liên kết được với giao dịch/quyết toán (mở một quyết toán, truy được các lần giao). | FR-DEL-04 | B | FK `delivery.trade_id`, `settlement_line.delivery_id` |
| BC-59 | **Số lần giao tối đa, ai xác nhận từng lần, khi nào phản ánh vào quyết toán và khuyến khích** là điều kiện chốt estimate; RFP không nêu. Plan Q14 chưa có giá trị Plan A. | 07-04; Q14 | S (Q14 chưa có Plan A) | Cấu hình `max_deliveries_per_trade` (mặc định không giới hạn); phản ánh vào quyết toán khi giao đủ (đề xuất) |
| BC-60 | Ảnh/chứng từ hỗ trợ tranh chấp và giao hàng được lưu (DR-IMAGE-01); AI tự phán chất lượng từ ảnh **ngoài phạm vi**; gắn nhãn ảnh bằng AI chỉ là option riêng và phải có người xác nhận. | 08-07; SCOPE-OUT-06 | B | Bảng `attachment` (loại, retention class); không có model nhận dạng ảnh |
| BC-61 | RFP **không có quy tắc nào về "08:00"**; KPI-05 chỉ **đo** số cuộc gọi hỏi tình trạng giao hàng phát sinh sau 08:00 (nhật ký vận hành + bảng tổng hợp, hằng tuần). Mục tiêu hệ thống: thấy trạng thái giao hàng trực tiếp, thay cho 14 cuộc gọi/ngày cao điểm. | KPI-05; PP-02; LOG-CALL-01 | B (KPI), không có ràng buộc giờ | Dashboard trạng thái giao hàng theo thời gian thực; số liệu để tính KPI-05 (đếm yêu cầu tra cứu) |
| BC-62 | Giao hàng: bước kiểm tra "権限失効" xảy ra **lần nữa lúc giao** (ngoài lần lúc chốt giao dịch). | FIG-014; Q31 | B (bước tồn tại), S (hành vi) | Xem 6.2 |
| BC-63 | Thông báo giao hàng tồn đọng và ngoại lệ (RPT-04 hằng ngày); thông báo Critical gửi xong trong **5 phút**, thử lại email tối đa 3 lần, vẫn lỗi thì vào hàng đợi cảnh báo vận hành. Kênh baseline: trong app + email; **SMS và FAX ngoài phạm vi**. | FR-NOTIFY-01/02; BR-NOTIFY-01; RPT-04 | B | Bảng `notification_log(channel, recipient, result, attempts)`; cơ chế retry 3 lần |
| BC-64 | Máy hiện trường dùng chung theo ca; cần in PDF/chứng từ và máy in tại hiện trường; thao tác bằng bàn phím được; chạy trên tablet. | PERSONA-DOCK-01; D.3; NFR-USE-01; NFR-COMP-01 | B | Phím tắt và tab-order cho form lô/giao dịch/giao hàng; style in. Mẫu máy chưa có (Q23) |

---

## 6. Khuyến khích (完納奨励金), thuế, quyết toán, kế toán

| ID | Ràng buộc | Nguồn | Mức | Ảnh hưởng thiết kế |
|---|---|---|---|---|
| BC-65 | 完納奨励金 = tiền khuyến khích **thanh toán đủ và đúng hạn** (timely payment incentive), **không phải thưởng giao đủ hàng**. FR-DEL-02 dùng "完納" cho nghĩa "giao đủ" → hai khái niệm khác nhau, đặt tên cột/trạng thái tách biệt (`payment_complete` vs `delivery_complete`). | E.1; BR-INC-01; FR-DEL-02; Q30 | B (nghĩa gốc); S (Q30 chưa có Plan A cho liên kết) | Hai trường trạng thái độc lập; không dùng chung enum |
| BC-66 | Công thức (BR-INC-01): hệ số thuế **110/100**, **làm tròn xuống tới yên sau khi nhân**; **không có thời gian ân hạn**; xét theo JST và 業務日. Test vector: INC-EDGE-01 (đúng ngưỡng tối thiểu), -02 (điều chỉnh sau khóa → delta kỳ sau), -03 (số thập phân sau nhân hệ số → cắt xuống JPY). | BR-INC-01; B.5; C.3 | B | Dùng số nguyên/Decimal, `floor` **sau** phép nhân; unit test theo 3 vector |
| BC-67 | Chỉ tính khoản trả **trong hạn thanh toán (支払期日以内)**; quá hạn dù 1 ngày thì khuyến khích = **0**. | FR-INC-01; B.5; FIG-013; EX-SETTLE-01 | B | Điều kiện `paid_at <= due_date` (cùng 業務日, JST); nhánh = 0 vẫn được ghi (không bỏ bản ghi) |
| BC-68 | Định nghĩa 支払期日 (hạn thanh toán: tính từ đâu) chưa có; Q16. Hệ thống biết "đã trả" bằng cách nào: Plan A **bộ phận đối soát nhập tay hoặc nhập CSV** (liên kết ngân hàng ngoài phạm vi). | FR-INC-01; SCOPE-OUT-05; Q16; Q17 | A (Q17); S (định nghĩa hạn, Q16 chờ) | Màn hình xác nhận tiền về + import CSV; `due_date` lưu trên khoản phải thu, mặc định cấu hình theo `rule_version` |
| BC-69 | Điều chỉnh sau khóa **không sửa kỳ cũ**: báo cáo kỳ trước giữ nguyên, **sinh chênh lệch ở kỳ sau**. | FR-INC-03; B.5; INC-EDGE-02 | B | Bảng `incentive_calc` append-only, `period`, `delta_of_id` |
| BC-70 | Thuế suất của **tiền hàng** (8% giảm cho thực phẩm hay 10%) và cơ sở tính khuyến khích (trước/sau thuế) **RFP không nói**; 110/100 chỉ cố định cho **khuyến khích**. Plan A: **thuế suất cài theo từng mặt hàng**. | BR-INC-01; D.2; Q29 | A (Q29) | `item.tax_rate` trong cấu hình; không dùng 110/100 chung cho tiền hàng; hiển thị thuế trên bảng xuất kế toán |
| BC-71 | Giao diện kế toán IF-ACC-01: dữ liệu = **đối soát ngày sau khi khóa sổ**, bên nhận là hệ thống kế toán sẵn có do tài chính vận hành. Trường tối thiểu: batch code, 業務日 đã khóa, mã người tham gia (hoặc nhóm), tổng tiền và tiền thuế, trạng thái dòng (**保留 / 確認済み / 調整済み**). Truyền, xác thực, retry, môi trường test **chưa chốt**. Plan A: **xuất CSV sau khóa, tài chính tự import**; mã hóa ký tự (Shift_JIS/UTF-8) cần xác nhận. | D.2; 08-03; DR-SETTLE-01; Q20 | B (trường tối thiểu), A (Q20) | Bảng `accounting_export(batch_code, business_date, ...)`; chỉ cho xuất từ ngày đã khóa; xuất lại sau mở khóa = batch mới có dòng `調整済み` |
| BC-72 | Dữ liệu xuất phải có thời điểm tạo, 業務日, người chạy, batch code; định dạng mở. | 08-05; 06-04 | B | Header/metadata bắt buộc cho mọi export |
| BC-73 | 12 báo cáo cố định có bộ lọc + xuất CSV; **không** có công cụ tự thiết kế báo cáo. Plan A: chỉ màn hình + CSV (không PDF). | 08-02; FR-RPT-01/03; Q19 | B; A (Q19) | 12 màn hình/endpoint cố định; filter theo bảng TBL-REPORT-01 |
| BC-74 | Báo cáo tháng gom đúng theo 業務日 và **phiên bản quy định** áp dụng. | FR-RPT-02; RPT-10/11/12 | B | Truy vấn nhóm theo `business_date` + `rule_version_id` |

---

## 7. Mạng gián đoạn, khả dụng, khôi phục sự cố

| ID | Ràng buộc | Nguồn | Mức | Ảnh hưởng thiết kế |
|---|---|---|---|---|
| BC-75 | **Không yêu cầu offline toàn phần**; bên dự thầu phải nêu: tác vụ nào chạy tiếp khi ngắt ngắn; dữ liệu nào lưu cục bộ/xếp hàng chờ đồng bộ; cảnh báo, hòa giải và phân trách nhiệm khi đồng bộ lại. | 09-04; NFR-AVL-02; PP-NET-01 | B | Cơ chế hàng đợi ghi cục bộ + trạng thái "chưa đồng bộ" |
| BC-76 | Mạng chập chờn ở khu tiếp nhận và bến giao hàng, **3–5 lần ngắt ngắn mỗi tuần cao điểm**; hiện tạm ghi giấy/máy cục bộ rồi nhập lại (nguy cơ nhập trễ hoặc trùng). | PP-NET-01; EX-05; LOG-NET-01 | B | Idempotency key khi đồng bộ để tránh trùng bản ghi |
| BC-77 | Phạm vi offline Plan A: **chỉ tiếp nhận lô và ghi giao hàng** chạy được khi mất mạng; **chốt giao dịch cần có mạng** (vì cần kiểm tra BC-06 và BC-33 theo dữ liệu mới nhất). | Q15 | A (Q15) | Chốt giao dịch bị chặn có thông báo khi offline; nháp được lưu cục bộ (S); lô/giao hàng ghi vào queue |
| BC-78 | Khả dụng **99,5%/tháng trong giờ dịch vụ 02:00–10:00** (trừ bảo trì đã báo); đo bằng log uptime độc lập. | NFR-AVL-01 | B | Giám sát bên ngoài; lịch bảo trì ngoài 02:00–10:00 |
| BC-79 | **RTO ≤ 4 giờ, RPO ≤ 15 phút**; nghiệm thu bằng biên bản diễn tập restore. RTO 4 giờ vượt nửa khung dịch vụ, 99,5% chỉ cho phép khoảng 1 giờ dừng/tháng: hai mục tiêu xung đột. Plan A: **khôi phục trong 4 giờ (Multi-AZ)**. | NFR-AVL-03; FIG-020; Q35 | B; A (Q35) | Backup/WAL liên tục (RPO), runbook restore; hiển thị rõ giả định |
| BC-80 | Tải thiết kế: 180 tài khoản, tối đa 60 người dùng đồng thời; lô 350 (thường) – 600 (cao điểm); giao dịch 700 – 1.200 mỗi ngày; tìm kiếm thường p95 ≤ 2 giây. Không được đặt mục tiêu thấp hơn. | FIG-LOAD-01; NFR-PERF-01/02; 03-07 | B | Dữ liệu mẫu và test tải phải ≥ mức này |

---

## 8. Kiểm toán, lưu trữ, bảo mật, vai trò

| ID | Ràng buộc | Nguồn | Mức | Ảnh hưởng thiết kế |
|---|---|---|---|---|
| BC-81 | Audit **mức nghiệp vụ** (không chỉ log hạ tầng) cho tạo, sửa, duyệt, khóa, đổi quyền: người làm, thời điểm, **trước/sau**, lý do; tìm theo mã giao dịch, 業務日, người tham gia, loại thao tác. KPI-03: ≥ 98% dòng giao dịch có đủ trước/sau + người thực hiện. | FR-AUDIT-01/02; OBJ-03; KPI-03; 06-06 | B | Bảng `audit_log(entity, entity_id, before, after, actor, at, reason)`; ghi trong cùng transaction với thay đổi |
| BC-82 | Lưu online: dữ liệu nghiệp vụ tìm kiếm được (phiếu tiếp nhận, phiếu giao dịch, bảng đối soát) **7 năm**; ảnh/chứng từ hỗ trợ tranh chấp và giao hàng **3 năm online** rồi chuyển lưu lạnh, khôi phục tối đa **2 ngày làm việc** (B.7 ghi "trong 2 ngày": mâu thuẫn, Q34). | DR-RET-01; TBL-ATTACH-01; B.7; Q34 | B; S (Q34) | Cột `retention_class` (BUSINESS_7Y / EVIDENCE_3Y_COLD); job chuyển lưu lạnh |
| BC-83 | Xóa vật lý sau khi hết hạn lưu **cần phê duyệt**; không xóa cứng giao dịch/quyết toán đã vào báo cáo chính thức. | B.7; TBL-ATTACH-01 | B | Quy trình purge có phê duyệt, tách khỏi flow thường |
| BC-84 | **APPI** (luật bảo vệ thông tin cá nhân): phạm vi thông tin thu thập, mục đích, giới hạn cung cấp bên thứ ba; mã hóa + RBAC + log truy cập (khớp DR-RET-01); quy trình tiếp nhận yêu cầu xem/sửa/xóa; trách nhiệm thông báo khi rò rỉ. Thông tin cá nhân gồm cả hiệu lực 許可/承認 và lịch sử giao dịch gắn với cá nhân. | 09-06; FIG-033 | B | Mã hóa lưu trữ, log truy cập dữ liệu hồ sơ; **yêu cầu xóa phải được đối chiếu với nghĩa vụ giữ 7 năm** (BC-82/83), xem bảng 9.5 |
| BC-85 | **MFA bắt buộc** cho tài khoản quản trị và các vai trò phê duyệt nội bộ (NFR-SEC-01). Chính sách MFA cho người tham gia bên ngoài phải được nêu (phạm vi, ảnh hưởng máy dùng chung, kế hoạch chuyển đổi) (SEC-IAM-02). Plan A: tài khoản riêng (ID + mật khẩu), **chỉ quản trị dùng MFA**; bên ngoài không đăng nhập. | NFR-SEC-01; SEC-IAM-02; Q21; Q4 | B; A (Q21, Q4) | Vai trò cần MFA: ROLE-SYS-ADMIN, ROLE-RULE-ADMIN, vai trò duyệt sửa/mở sổ (ROLE-SETTLEMENT/trưởng đối soát). Máy dùng chung theo ca: nhớ thiết bị không được áp cho vai trò duyệt |
| BC-86 | Session timeout, khóa tạm khi nhập sai nhiều lần, log hành vi bất thường; TLS khi truyền; backup và secret tách khỏi source. | NFR-SEC-03/04 | B | Không hard-code secret trong repo prototype |
| BC-87 | Vai trò nội bộ: ROLE-INTAKE, ROLE-JUDGE, ROLE-TRADE, ROLE-DELIVERY, ROLE-SETTLEMENT, ROLE-RULE-ADMIN, ROLE-SYS-ADMIN. Mỗi thay đổi quyền: trước/sau, người làm, thời điểm. | TBL-ROLE-01; FR-IAM-01/02 | B | RBAC: 7 role RFP ánh xạ sang mã `roles`: INTAKE→`intake`, JUDGE→`judge`, TRADE→`trade`, DELIVERY→`delivery`, SETTLEMENT→`settlement` (+ `approver` = trưởng đối soát, S), RULE-ADMIN→`rule_admin`, SYS-ADMIN→`sys_admin`; thêm `market_ops` (nội bộ, S) → đích 9 vai trò (ADR-004) |
| BC-88 | Tách trách nhiệm: người yêu cầu sửa ≠ người duyệt; người soạn quy tắc ≠ người duyệt. Ai là "chủ" của từng cổng nghiệm thu do khách quyết (một người phụ trách nghiệp vụ duy nhất ký UAT). | 02-08; RACI-01; ACC-GATE-01 | B | Kiểm tra `maker_id ≠ checker_id` ở mọi luồng duyệt |
| BC-89 | Số tài khoản đăng ký 180, ngôn ngữ tài liệu: chỉ tiếng Nhật (Plan A); truy cập qua trình duyệt đã duyệt của khách; tablet hiện trường. | FIG-LOAD-01; Q27; NFR-COMP-01 | B; A (Q27) | UI tiếng Nhật; i18n không bắt buộc (YAGNI) |

---

## 9. Các điểm phân nhánh logic (decision tables)

### 9.1 Chốt giao dịch (`確認待ち → 確定`)

Điều kiện đánh giá theo thứ tự; trả lời ngay khi gặp ĐIỀU KIỆN FAIL đầu tiên (các lý do cũng nên cộng dồn hiển thị, S). Thứ tự này là chuẩn cho mọi tài liệu (02 §2.2, SCR-016, SCR-019, ADR-009). Mã lý do RJ-xx ở SCR-016 §9.

| # | Điều kiện | Hành vi hệ thống | Nguồn |
|---|---|---|---|
| 0 | Nhóm bên mua không được phép với loại giao dịch theo `trade_kind_matrix` (mặc định cho phép cả ba nhóm bên mua, §1.1) | Chặn; hiện lý do | §1.1 (S) |
| 1 | Bên mua có `basis = PERMIT` (仲卸) và 許可 hết hiệu lực/tạm dừng tại thời điểm chốt | Chặn; hiện "許可 đã hết hiệu lực / tạm dừng"; không tạo giao dịch | BR-PERM-01; FR-AITAI-02 |
| 2 | Bên mua có `basis = APPROVAL` (売買参加者) và 承認 hết hiệu lực/tạm dừng | Chặn; hiện "承認 đã hết hiệu lực / tạm dừng"; hướng dẫn 再審査 | BR-PERM-01; FIG-004 |
| 3 | Bên mua là 買出人 (đăng ký tại điểm giao dịch) và hồ sơ hết hạn/tạm dừng | Chặn (S: theo EX-02 của RFP) và hiện lý do riêng "đăng ký hết hạn" | 05-05 EX-02 (S) |
| 4 | Bên bán 卸売業者: đăng ký chợ bị tạm dừng | Chặn (đề xuất S, chờ Q33; Plan A phía bán là kiểm tra trạng thái tạm dừng) | Q33 |
| 5 | Số lượng yêu cầu > `lot.available_qty` | Chặn; lý do "không đủ số lượng"; không trừ | BR-LOT-02; FR-LOT-03 |
| 6 | `business_date` đã khóa, chưa mở, hoặc lô không thuộc ngày nghiệp vụ hiện tại | Chặn; ngày đã khóa thì chỉ nhận qua FORM-CORR-01 và **ghi log lần bị chặn** (`blocked_edit`, ADR-006) | BR-CLOSE-01; FR-CORR-03; ADR-009 (S cho "lô của ngày hiện tại") |
| 7 | Mọi điều kiện đạt | Tạo giao dịch `確定` (cần `confirmed_by` người thật), trừ số lượng khả dụng trong cùng transaction, ghi audit | FR-AITAI-01 |

### 9.2 Hoàn tất giao hàng khi tư cách đổi sau lúc chốt (BC-08/62)

| Trạng thái bên mua lúc giao | RFP nói gì | Hành vi Plan A (S, chờ Q31) |
|---|---|---|
| Còn hiệu lực | Bình thường | Cho giao |
| Hết hạn sau khi giao dịch đã chốt | Có bước "権限失効確認"; không nêu dừng hay tiếp tục | Đề xuất: **cho phép hoàn tất giao dịch đã chốt trước hạn**, gắn cờ cảnh báo và thông báo cho 照合事務局 (trùng lựa chọn đầu của Q31, nhưng Q31 chưa có Plan A); cấu hình được |
| Đang tạm dừng (一時停止) | Không nêu | Đề xuất: **chặn giao dịch mới**, giao dịch cũ chờ xử lý ngoại lệ do người quyết |
| Đã gỡ (解除後) | FIG-014 vẽ nhánh nhưng không mô tả | Đề xuất: kiểm tra lại hiệu lực, cho giao tiếp |

### 9.3 Điều chỉnh theo trạng thái ngày nghiệp vụ

| Trạng thái bản ghi | Thao tác | Hành vi | Nguồn |
|---|---|---|---|
| `business_date` chưa khóa, giao dịch `確定` | Hủy (取消) với lý do | Cho phép; trả số lượng khả dụng; giữ lịch sử | FR-AITAI-03 |
| `business_date` chưa khóa, giao dịch `確定` | Sửa (更正) | Qua yêu cầu sửa; bản gốc giữ nguyên đến khi duyệt | FR-CORR-01/02 |
| `business_date` đã khóa | Sửa/xóa trực tiếp | Chặn + ghi log | FR-CORR-03 |
| `business_date` đã khóa | Điều chỉnh có duyệt | Sinh reverse/delta, không ghi đè | FR-CORR-02; B.4 |
| `business_date` đã khóa | Mở lại sổ | Nhánh ROLE-SETTLEMENT + duyệt (Plan A, Q12); nếu đã xuất kế toán → ưu tiên reverse/delta | Q12 |
| Bản ghi đã vào báo cáo chính thức | Xóa | Cấm tuyệt đối | B.7 |

### 9.4 Khuyến khích 完納奨励金

| Điều kiện | Kết quả | Nguồn |
|---|---|---|
| Khoản thanh toán hoàn tất **trong hạn** (`paid_at ≤ 支払期日`, JST, theo 業務日) | `incentive = floor(eligible_amount × rate × 110/100)` theo version có hiệu lực tại ngày áp dụng (xác nhận công thức chi tiết với Q16) | BR-INC-01; FR-INC-01 |
| Quá hạn (dù 1 ngày) | `incentive = 0`, vẫn ghi bản ghi | B.5 |
| Chưa biết đã trả hay chưa | Chưa tính; chờ nhập tay/CSV | Q17 |
| Điều chỉnh sau khi kỳ đã khóa | Kỳ trước giữ nguyên; kỳ sau có dòng delta | FR-INC-03; INC-EDGE-02 |
| `rule_version` hết hiệu lực/nháp | Không dùng; chọn version `APPROVED` có `effective_from` gần nhất ≤ ngày nghiệp vụ | FR-INC-02 |

Lưu ý công thức: RFP chỉ ghi hệ số thuế 110/100 và quy tắc cắt xuống yên; công thức chính xác "eligible_amount × rate × 110/100" là suy luận (S) cho đến khi có `incentive-rate-table.csv` và Q16/Q29. Chỉ dùng như khung prototype.

### 9.5 Yêu cầu xóa dữ liệu cá nhân (APPI) so với giữ 7 năm

| Tình huống | Hành vi đề xuất (S) | Nguồn |
|---|---|---|
| Bản ghi giao dịch/quyết toán đã vào báo cáo chính thức | Từ chối xóa cứng; ẩn/ẩn danh hóa trường cá nhân không bắt buộc, giữ khóa nghiệp vụ | B.7; 09-06 |
| Hồ sơ tham gia hết 7 năm | Cho phép purge sau phê duyệt | DR-RET-01; B.7 |
| Ảnh/chứng từ > 3 năm | Chuyển lưu lạnh, không xóa tự động; purge cần phê duyệt | TBL-ATTACH-01 |

### 9.6 Offline (Plan A, Q15)

| Tác vụ | Mất mạng | Hành vi |
|---|---|---|
| Tiếp nhận lô (ROLE-INTAKE) | Có thể tiếp tục | Lưu cục bộ + mã tạm; đồng bộ khi có mạng, hòa giải trùng khóa nghiệp vụ |
| Ghi giao hàng (ROLE-DELIVERY) | Có thể tiếp tục | Queue; gắn nhãn "chưa đồng bộ" |
| Chốt giao dịch (ROLE-TRADE) | **Không** | Chặn; báo lý do cần mạng (cần BC-06/BC-33) |
| Khóa sổ, duyệt sửa, đổi quy định | Không | Cần mạng |

### 9.7 Vai trò nào cần MFA (BC-85)

| Vai trò | MFA |
|---|---|
| ROLE-SYS-ADMIN | Bắt buộc (NFR-SEC-01) |
| ROLE-RULE-ADMIN, người duyệt version, trưởng đối soát | Bắt buộc ("vai trò phê duyệt nội bộ") |
| ROLE-SETTLEMENT (mở sổ, điều chỉnh) | Bắt buộc nếu đóng vai người duyệt; mặc định bật (S) |
| ROLE-INTAKE/JUDGE/TRADE/DELIVERY | Không bắt buộc theo RFP; máy dùng chung theo ca |
| Người tham gia bên ngoài | Chính sách do bên dự thầu nêu (SEC-IAM-02); Plan A: không đăng nhập |

---

## 10. Bẫy dễ đơn giản hóa sai

Danh sách rút từ phần "Bẫy" của bản tóm tắt tiếng Việt (nhãn B1…B12 của bản tóm tắt, không phải mã của RFP) và đối chiếu bản gốc.

| # | Bẫy (thiết kế tuyến tính sẽ sai thế nào) | Đúng là | Liên kết |
|---|---|---|---|
| T1 (B1) | Làm "hệ thống đấu giá": phòng đấu giá, bid trực tuyến. | 相対 là luồng chính ~90%; せり chỉ ghi kết quả cuối do người nhập. Bị loại nếu đi sai. | BC-24, 27 |
| T2 (B2) | Một bảng `license` với `expires_at` cho mọi người. | Ba căn cứ khác nhau (đăng ký / 許可 / 承認), tạm dừng–gỡ khác nhau (承認 / 条件付き / 再審査). Bị loại nếu gộp. | BC-01..05 |
| T3 | Kiểm tra hiệu lực **một lần** lúc tạo giao dịch hoặc lúc đăng nhập. | Kiểm tra lúc **chốt**, và lại lúc **giao hàng**. | BC-06, 08 |
| T4 | Coi 買出人 luôn là người mua trực tiếp từ 卸売業者, và coi 買出人 không có hạn. | Có hạn (EX-02), RFP có mũi tên 再販 (bán lại) qua 仲卸; không bịa ma trận "ai mua ở đâu". | BC-11, 1.1 |
| T5 (B3) | "Tự động hóa" 目利き/下見/手やり/符丁 bằng OCR/AI; hoặc bỏ trống chỗ ghi kết quả. | Chỉ ghi kết quả do người nhập (FR-LOT-02 là P0); không auto. | BC-27, 29 |
| T6 (B4) | Hiểu 完納 là "giao đủ hàng"; hoặc dùng một trạng thái cho cả hai. | 完納奨励金 = trả đủ đúng hạn; FR-DEL-02 dùng "完納" với nghĩa khác. | BC-65 |
| T7 | Làm tròn trước khi nhân thuế; thêm ngày ân hạn. | `floor` sau nhân 110/100; không ân hạn. | BC-66, 67 |
| T8 (B5) | Dùng 110/100 cho **mọi số tiền** kể cả tiền hàng. | 110/100 chỉ của khuyến khích; thuế hàng thủy sản thường 8% (Q29 chưa trả lời, Plan A theo mặt hàng). | BC-70 |
| T9 (B6) | Dùng `DATE(created_at)` làm ngày nghiệp vụ; tắt hệ thống sau 10:00. | 業務日 bắt đầu khoảng 02:00 JST; sau 10:00 vẫn còn sửa có duyệt, xác nhận thanh toán; batch hạn 11:00. | BC-39, 42 |
| T10 | Sau khóa sổ cho sửa trực tiếp "có phân quyền" hoặc UPDATE bản ghi cũ. | Chỉ qua reverse/delta đã duyệt; mọi cố gắng sửa trực tiếp bị chặn và ghi log. | BC-43, 44 |
| T11 | Coi "mở lại sổ" là chuyện nhỏ, hoặc không có. | Thao tác nhạy cảm của ROLE-SETTLEMENT, mâu thuẫn BR-CLOSE-01; Q12. | BC-48 |
| T12 | Lô = một giao dịch = một lần giao; trạng thái lô "確定 → 引渡し完了" thẳng. | Một lô bán nhiều giao dịch; một giao dịch giao nhiều lần; giao hàng vắt qua hai kỳ. | BC-38, 54, 59 |
| T13 (B8) | Dựng module "nhận hàng từ tàu" chi tiết vì thấy chữ 荷受け. | 荷受け trong RFP ≈ 引渡し (giao cho người mua). | mục 5 |
| T14 | Rule version là một bảng cấu hình ghi đè trực tiếp; sửa tỷ lệ tại chỗ. | Version bất biến, maker–checker, ngày hiệu lực tương lai, rollback = phát hành version mới; ≤ 4 lần/năm. | BC-14..21 |
| T15 | Coi quy tắc thuộc từng chợ/mặt hàng và làm đa chợ. | Chỉ một chợ; chỉ thuế suất có thể theo mặt hàng (Plan A). Không đa chợ (YAGNI). | BC-22 |
| T16 | Xóa dữ liệu cá nhân theo yêu cầu APPI thành xóa cứng bản ghi giao dịch. | Cấm xóa cứng giao dịch/quyết toán đã vào báo cáo chính thức; giữ 7 năm; xử lý bằng ẩn danh/purge có duyệt. | BC-83, 84 |
| T17 | Tưởng offline là "toàn phần" hoặc không có gì. | Chỉ một số tác vụ (Plan A: tiếp nhận lô, ghi giao hàng); chốt giao dịch cần mạng; chống trùng khi đồng bộ. | BC-75..77 |
| T18 | Hiểu "08:00" là hạn bắt buộc giao hàng. | RFP chỉ có KPI-05 đếm cuộc gọi hỏi sau 08:00; không có quy tắc giờ. | BC-61 |
| T19 | Cho phép xác nhận hàng loạt / tự động duyệt để nhanh. | Bốn điểm bắt buộc có người quyết định cuối; maker ≠ checker. Bị loại thẳng nếu bỏ. | BC-29, 88 |
| T20 | Xuất kế toán từ ngày chưa khóa, hoặc tính 1 dòng không có trạng thái. | Chỉ xuất sau khi khóa; mỗi dòng có trạng thái 保留/確認済み/調整済み; batch code. | BC-71 |
| T21 | Phát minh quy tắc "ai được mua ở 相対 hay せり", hoặc thời hạn giấy phép (6 tháng, 1 năm). | RFP không nêu; ghi là giả định cấu hình được, không đặt cứng. | 1.1, BC-12 |

---

## 11. Điểm RFP mâu thuẫn hoặc mơ hồ ảnh hưởng thiết kế

| # | Điểm | Chỗ | Xử lý trong design |
|---|---|---|---|
| M1 | 買出人 vừa "đăng ký tại điểm giao dịch" vừa có "参加有効期限" | TBL-ACTOR-01 vs 05-05 EX-02 | BC-11; chưa có Q, đề xuất thêm câu hỏi |
| M2 | Cao điểm 02:30–05:00 vs 02:15–05:00 | 02-07 vs A.1 | Dùng 02:30–05:00 cho tải; ghi chú |
| M3 | Khôi phục lưu lạnh "2 ngày làm việc" vs "trong 2 ngày" | 08-04 vs B.7 | Q34; dùng "2 ngày làm việc theo lịch chợ" (nghiêm hơn hạn tính theo lịch, S) |
| M4 | 90/10 theo giá trị hay số giao dịch | C.5 vs FIG-009 | BC-25 |
| M5 | Tình trạng lô khi bán một phần | FIG-011 vs BR-LOT-02 | BC-38 |
| M6 | Mở sổ vs cấm sửa trực tiếp | TBL-ROLE-01 vs BR-CLOSE-01 | BC-48 |
| M7 | 99,5% trong 02:00–10:00 vs RTO 4 giờ | NFR-AVL-01/03 | Q35; BC-79 |
| M8 | Batch 11:00 nằm ngoài giờ dịch vụ | FIG-LOAD-01 vs NFR-AVL-01 | Q25; BC-42 |

## 12. Giới hạn của tài liệu này

- Không tìm thấy trong RFP: thời hạn hiệu lực cụ thể của 許可/承認; nội dung "条件付き" của 仲卸; ma trận 相対/せり theo nhóm mua; ai được nhập 相対; giờ mở/đóng chính xác của 業務日; mốc tự động khóa sổ; số lần giao tối đa; công thức tỷ lệ chi tiết (file `incentive-rate-table.csv` không có trong gói, Q1). Phần này đánh dấu S, đừng coi là yêu cầu khách.
- Plan A chỉ có giá trị cho các Q có cột "Plan A" điền; Q8, Q10, Q13, Q14, Q30–Q34 chưa có Plan A trong file; những chỗ đó là đề xuất S của design, cần xác nhận khi có dịp.
- File Q&A có cột trả lời trống ở toàn bộ 35 câu (khách chưa trả lời): mọi mục "A" đều là giả định, không phải xác nhận khách.
- Bảng quyết định mục 9 là đề xuất thiết kế dựa trên RFP; chưa được xác nhận bởi SME.
- Hai file HTML thứ cấp (glossary, actor-cast) không được dùng làm căn cứ (nội dung không mang thêm quy tắc, chỉ giải thích lại).
