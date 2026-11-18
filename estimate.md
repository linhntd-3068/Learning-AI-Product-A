# Estimate — SWP, giờ ước lượng và so với LAB-1

**Báo cáo HTML của skill chấm SWP:** [`reports/swp/estimate-swp-product-a-project1-261111.html`](reports/swp/estimate-swp-product-a-project1-261111.html). Chạy skill `tkm:estimate-swp` trên GitHub Project ngày 2026-11-11, mức xử lý `medium`. Kết quả: 133 issue, tổng **508 SWP**, trạng thái hiệu chỉnh **accepted**. Báo cáo là file HTML tự chứa, tải về mở bằng trình duyệt là xem được.

## 1. Issue mẫu skill chọn để kiểm

Skill tự chọn 5 issue mẫu theo quy tắc cố định: nhỏ nhất, trung vị, lớn nhất, lệch xa trung vị, độ tin cậy thấp nhất. Mỗi issue được hỏi 2 vòng: mức khó trước, rồi điểm cụ thể.

| Issue | Skill chấm (Scope × Complexity → SWP) | Bạn chốt | Lý do |
|---|---|---|---|
| #53 Chỉnh spec RJ-11 (nhỏ nhất) | 1 × 0 → **1** (rất dễ) | Giữ 1 | Sửa một bảng mã lỗi đã có quyết định từ review LAB-4, không có lựa chọn thiết kế |
| #147 Kịch bản UAT 完納奨励金 (trung vị) | 2 × 1 → **3** (dễ) | Giữ 3 | Kịch bản bám các luồng đã liệt kê trong issue. Rủi ro spec #130 chưa chốt nằm ở lịch (R7), không làm việc viết khó hơn |
| #56 Migrate tư cách 許可/承認 (lớn nhất) | 5 × 3 → **10** (vừa) | Giữ 10 | Đúng là một đơn vị migration có rollback và đối chiếu. Mâu thuẫn M1 đã có giả định B8 nên không cộng thêm. Đáng chú ý: ước 8 giờ nhưng 10 SWP là tỷ lệ giờ/SWP thấp nhất nhóm, khớp với việc Sprint 1 vượt ×1,5 (EV-3) |
| #29 Chuyển audit vào hàm `fn_*` (lệch xa trung vị) | 5 × 2 → **8** (vừa) | Giữ 8 | Rộng (5 hàm + các route gọi) nhưng mỗi chỗ sửa theo cùng một mẫu, nên Complexity 2 là hợp lý |
| #72 Màn hình cài đặt hệ thống (độ tin cậy thấp nhất) | 2 × 1 → **3** (dễ) | Giữ 3 | Một bảng + một form. Thiếu spec làm giảm độ tin cậy chứ không làm tăng điểm (đúng quy tắc của skill); thiếu spec ghi ở giả định |

Không sửa issue nào nên skill không áp quy tắc lan sang issue cùng nhóm; 0/133 issue đổi điểm. Lý do giữ nguyên: ở cả 5 mẫu, phần giải thích của AI nêu đúng cấu trúc việc trong issue (số hàm/màn hình, có migration hay không). Điểm khó thật của dự án nằm ở rủi ro nghiệp vụ chưa chốt (Q16/Q17, M1), mà rủi ro đó đã được quản lý ở PREMISE và progress-report, không nên cộng thẳng vào điểm.

## 2. Cách quy ra giờ

- **Cách đã chọn:** ước lượng **giờ trực tiếp từ issue**, không quy SWP ra giờ. Trường Story Points cũ (suy ra từ giờ) chỉ dùng để xếp sprint; **SWP của skill là điểm chính thức** ghi ở bảng §3 và trường `SWP` trên Project.
- **Vì sao:** issue đã nhỏ (1–16 giờ, một tầng, một người) nên ước giờ trực tiếp sát hơn qua hệ số. Các giờ này dùng ngay để xếp sprint theo năng lực từng vai trò (BE là nút cổ chai). SWP dùng để **kiểm chéo**: issue nào có giờ/SWP lệch xa mức chung thì xem lại issue, không sửa giờ theo SWP một cách máy móc.
- **Quy tắc giờ áp dụng nhất quán cho cả 133 issue:**

| Story Points (xếp sprint) | Giờ |
|---:|---|
| 1 | 1–2 |
| 2 | 3–4 |
| 3 | 5–7 |
| 5 | 8–11 |
| 8 | 12–16 |

- Giờ = giờ dev có AI hỗ trợ, **đã gồm test của chính task**. Chưa gồm review code, họp: hai phần này trừ qua hệ số tập trung 0,7, nên năng lực là 56 giờ/người/sprint.
- Issue > 16 giờ phải tách. Hiện cả backlog không có issue nào > 14 giờ.
- **Kiểm chéo giờ ↔ SWP:** tỷ lệ chung là 981 giờ / 508 SWP ≈ **1,93 giờ/SWP**. Epic có tỷ lệ cao (giờ nhiều so với độ phức tạp cấu trúc) là E-LOCK 2,38, E-INC 2,20, E-TRADE 2,26: đây là phần có nhiều quy tắc nghiệp vụ mà skill chỉ thấy một phần. Tỷ lệ thấp là E-AUD 1,33 và issue #56 (0,8): đây là chỗ giờ có thể đang bị ước thấp, khớp với #56 vượt giờ ở Sprint 1.

## 3. Tổng theo epic

SWP của epic = tổng SWP các issue con (skill không chấm epic trực tiếp).

| Epic | Số issue | Tổng SWP | Tổng giờ | Ghi chú |
|---|---:|---:|---:|---|
| #1 E-FND Nền tảng | 12 | 50 | 83 | |
| #2 E-AUD Audit | 4 | 21 | 28 | Giờ/SWP thấp nhất (1,33) |
| #3 E-RULE Quy tắc có phiên bản | 15 | 59 | 118 | Đặc thù: quy tắc phiên bản |
| #4 E-BDAY Ngày nghiệp vụ JST | 8 | 31 | 47 | Đặc thù |
| #5 E-QUAL Tư cách 登録/許可/承認 | 11 | 52 | 93 | Đặc thù; chứa issue lớn nhất #56 (10 SWP) |
| #6 E-SEC Đăng nhập, MFA | 11 | 36 | 63 | Đặc thù: MFA |
| #7 E-LOT Tiếp nhận & đánh giá lô | 6 | 20 | 40 | |
| #8 E-TRADE Chốt 相対 & hủy | 8 | 31 | 70 | |
| #9 E-AUC Kết quả せり | 5 | 14 | 29 | Đặc thù |
| #10 E-DEL Giao hàng | 8 | 32 | 66 | |
| #11 E-LOCK Khóa sổ & điều chỉnh | 14 | 50 | 119 | Đặc thù; giờ/SWP cao nhất (2,38) |
| #12 E-ACC Kế toán IF-ACC-01 | 5 | 17 | 35 | Đặc thù |
| #13 E-OFF Offline | 8 | 36 | 60 | Đặc thù |
| #14 E-INC 完納奨励金 | 18 | 59 | 130 | **Ràng buộc của đề**; giả định B1–B7 |
| **Tổng** | **133** | **508** | **981** | |

## 4. So với estimate LAB-1

LAB-1: file đã nộp `Lab1/[Product-A] … - Effort Estimation WBS.xlsx` (không nằm trong repo này), sheet **WBS Estimation**, Plan A (1.127 MD = 7.889 giờ). So bằng **giờ**: lấy cột "Total (hours)" của từng dòng WBS, cộng theo hạng mục.

Hai bên đều có AI hỗ trợ, nhưng giờ không cùng nghĩa, nên đọc cột "Tỷ lệ" chứ không đọc số tuyệt đối:

| | LAB-1 (WBS đã nộp) | LAB-5 |
|---|---|---|
| Gồm việc gì | FE/BE coding + unit test + fixbug + giờ QA của từng dòng | Dev + test tự động của chính task; QA viết test ở issue riêng |
| Buffer | Có, nằm trong từng dòng (20%; 25–30% cho đối soát, điều chỉnh, khuyến khích, migration, offline) | Không (trừ qua hệ số tập trung 0,7 khi xếp sprint) |
| AI hỗ trợ | Đã trừ 20% cho task dev | Ước trực tiếp với AI hỗ trợ |
| Cách làm | Làm mới (greenfield) trên AWS / NestJS | Làm tiếp trên prototype Next.js + Supabase đã có (ADR-001) |

Tỷ lệ chung của các phần so được là **981 / 3.360 ≈ 0,29**.

| Phần (chức năng/epic) | LAB-1 (giờ) | LAB-5 (giờ) | Chênh (tỷ lệ LAB-5 / LAB-1) | Vì sao |
|---|---:|---:|---:|---|
| 3. Nền tảng ↔ E-FND | 238 | 83 | 0,35 | Gần mức chung |
| 4. Xác thực & phân quyền ↔ E-SEC | 280 | 63 | 0,23 | Supabase Auth có sẵn MFA (AAL2), chỉ cấu hình và chặn theo vai trò |
| 5. Người tham gia ↔ E-QUAL | 287 | 93 | 0,32 | Gần mức chung; LAB-4 tách 3 căn cứ (ADR-007) bù cho phần đã có ở prototype |
| 6. Lô hàng ↔ E-LOT | 399 | 40 | **0,10** | Prototype LAB-2 đã có tiếp nhận / đánh giá lô; LAB-5 chỉ sửa gap G-04, G-15; in nhãn lô (6.2, 70 giờ) chưa break |
| 7. 相対 ↔ E-TRADE | 392 | 70 | 0,18 | Hàm chốt giao dịch đã có ở prototype; thêm SCR-018 (PREMISE A2) |
| 8. Ghi kết quả せり ↔ E-AUC | 98 | 29 | 0,30 | Gần mức chung |
| 9 + 10. Điều chỉnh + đối soát/chốt sổ ↔ E-LOCK + E-BDAY | 525 | 166 | 0,32 | Gần mức chung; ngày nghiệp vụ JST ở LAB-1 nằm trong 3.4 (28 giờ), LAB-5 tách thành E-BDAY (47 giờ) vì thêm trạng thái `closing` / `reopened` |
| 11. Giao hàng ↔ E-DEL | 287 | 66 | 0,23 | Tranh chấp chỉ làm cờ (PREMISE "Hướng đã chốt") |
| 12.4a/b. Version quy định ↔ E-RULE | 105 | 118 | **1,12** | LAB-4 mở rộng thành danh mục khóa có kiểu, `system_settings`, maker–checker, giới hạn ≤ 4 lần/năm, rollback (ADR-008, 06 D2). LAB-1 chỉ tính logic soạn–duyệt + màn hình |
| 12.1/12.2/12.3/12.5. Khuyến khích ↔ E-INC | 259 | 130 | **0,50** | Cao gấp ~1,7 lần mức chung. LAB-1 gộp thành 4 dòng; LAB-5 thêm khoản phải thu, 支払期日, CSV, màn hình xác nhận tiền về, RPT-07 (PREMISE A1, B1–B7) và tách test biên riêng |
| 15. Kế toán IF-ACC-01 ↔ E-ACC | 98 | 35 | 0,36 | Gần mức chung |
| 16. Audit, APPI & lưu trữ ↔ E-AUD | 175 | 28 | 0,16 | LAB-5 chỉ có audit cùng giao dịch; APPI / lưu trữ 7 năm chưa có detail design |
| 17. Offline ↔ E-OFF | 217 | 60 | 0,28 | Gần mức chung |
| **Tổng phần so được** | **3.360** | **981** | **0,29** | |
| 1, 2, 13, 14, 18–22 | 4.529 | — | — | Khởi động, thiết kế, thông báo, báo cáo, hạ tầng, kiểm thử hệ thống, chuyển đổi dữ liệu, UAT, PM: chưa có detail design LAB-4 nên chưa break (task-breakdown.md §2, dòng cuối) |

**Kết luận:**
- Hai chỗ LAB-5 lớn bất thường so với LAB-1 trùng đúng hai ràng buộc đặc thù: quy tắc có phiên bản (×3,8 so với mức chung) và 完納奨励金 (×1,7). LAB-1 đã ước thấp hai phần này.
- Nếu báo giá lại, nên tăng nhóm 12 của LAB-1 trước. Ở sheet "Assumptions Plan A-B", Q16/Q17 ghi "re-estimate", tức là nếu khách trả lời theo hướng nặng thì phần tăng thêm chưa có cả trong Plan B.
