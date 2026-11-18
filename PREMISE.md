# PREMISE — Backlog LAB-5 khác bản LAB-4 ở đâu

Bản LAB-4 làm gốc: [`docs/design/`](docs/design/README.md), commit `bcacf30` (2026-10-16). Mỗi dòng có mã (A·B·H) để `task-breakdown.md` và `estimate.md` trỏ về. Số issue lấy theo [`docs/lab5/github-map.json`](docs/lab5/github-map.json).

## 1. Spec thêm / bỏ / sửa so với LAB-4

Các bản sửa spec chưa viết sẵn vào `docs/design/`: mỗi dòng là một issue loại Doc trên Project. Khi issue đó xong, spec trong `docs/design/` được cập nhật và cột "Trước → sau" là nội dung cần đạt.

| # | Spec (mã/file) | Thêm/Bỏ/Sửa | Trước → sau | Vì sao | Issue bị ảnh hưởng |
|---|---|---|---|---|---|
| A1 | 完納奨励金: spec màn hình xác nhận tiền về, báo cáo RPT-07, bảng `receivables` / `payments` / `incentive_calc` | Thêm | Trước: chỉ có quy tắc ở 01 §6 và bảng quyết định 01 §9.4; không có screen spec, ERD đích (03 §2) không có khoản phải thu / thanh toán. → Sau: spec nghiệp vụ + 2 màn hình + 3 bảng, đánh dấu giả định B1–B7 | **Chỗ hở phát hiện khi break:** prompt tách task (`docs/ai-context/prompts/task-breakdown-from-design.md`) chỉ lấy đầu vào từ screen spec, gap G-xx và ADR. Không spec/gap nào nói về khuyến khích, nên phải bổ sung đầu vào 01 §6/§9.4 riêng thì mới có task cho 完納奨励金, trong khi FR-INC-01…03 là chức năng bắt buộc của RFP | #130 (spec), #133, #135, #136, #137, #139, #144, #145 |
| A2 | SCR-018 Chi tiết giao dịch và hủy | Thêm | Trước: 04 README ghi "chưa có spec"; SCR-022 dẫn tới SCR-018. → Sau: spec xem giao dịch, lịch sử `-R/-A`, nút 取消 trước khóa sổ có lý do | **Chỗ hở khi break:** G-11 (lưu người hủy, lý do hủy) cần màn hình nơi bấm 取消, nhưng màn hình đó chưa có spec | #86 (spec), #87 |
| A3 | Spec khung ứng dụng (app shell: menu theo quyền, header 業務日, nhãn オフライン) | Thêm | Trước: không có. → Sau: spec app shell có §5/§7/§10 như các spec khác | **Góp ý review LAB-4:** 06 Mục 4 #10. Ngoài ra ADR-009 bắt hiện 業務日 ở mọi màn hình, nhưng không spec nào sở hữu header | #22 (spec), #23 |
| A4 | SCR-034 F-21, F-18 | Sửa | Bỏ radio F-21, giữ nút có hộp xác nhận như SCR-022; F-18 thuế suất lưu 0–1, màn hình và câu lỗi theo % | **Góp ý review LAB-4:** 06 Mục 4 #1, #6 | #44 |
| A5 | SCR-019 §7 / AC12 | Sửa | Nút 記録 tắt khi 確認者 trống; V019-07 chỉ khi gửi bằng Enter/API | **Góp ý review LAB-4:** 06 Mục 4 #3 (§7 và AC12 mâu thuẫn) | #93 |
| A6 | SCR-001 M-06 | Sửa | Một câu → hai câu: chưa đăng ký app xác thực / đã đăng ký nhưng chưa xác minh phiên này | **Góp ý review LAB-4:** 06 Mục 4 #4 | #73 |
| A7 | SCR-016 RJ-11 | Sửa | Thêm câu riêng 「業務日が開始されていません」 khi không có ngày `open` (`{day}` = null) | **Góp ý review LAB-4:** 06 Mục 4 #2 | #53 |
| A8 | SCR-022 gợi ý "ngày gốc còn mở" | Sửa | Chỉ xét `open` → xét cả `closing` / `reopened` theo bảng trạng thái ADR-009 §2 | **Góp ý review LAB-4:** 06 Mục 4 #5 | #116 |
| A9 | SCR-029 §11 | Sửa | Thêm ghi chú: F-07 nay là ghi chú giải quyết tranh chấp, F-11 là ghi chú xác nhận | **Góp ý review LAB-4:** 06 Mục 4 #7 (đổi nghĩa ID, dễ dùng nhầm khi test) | #101 |

## 2. Giả định bổ sung

Chỉ lấp chỗ RFP/spec để ngỏ. Không dòng nào ghi đè điều RFP đã nêu rõ: hệ số 110/100, cắt xuống yên, không ân hạn, quá hạn = 0 (BR-INC-01, B.5) được giữ nguyên.

| # | Giả định | Chỗ spec/RFP để ngỏ | Ảnh hưởng tới issue/estimate |
|---|---|---|---|
| B1 | Kỳ tính khuyến khích = tháng dương lịch theo 業務日 | 01 §9.4 và FR-INC-01 không nêu kỳ | #139, #140, #143; nếu kỳ là tuần hoặc theo đợt thì job khóa kỳ (#143) đổi, khoảng +4 giờ |
| B2 | `eligible_amount` = tổng phải thu ròng của kỳ (đã tính `-R/-A`); trước hay sau thuế chờ Q29 | 01 §9.4 ghi công thức là suy luận (S) | #133, #140; nếu đổi sang sau thuế thì sửa test vector #146 |
| B3 | Ngày áp dụng phiên bản quy tắc cho khuyến khích = 支払期日 của khoản phải thu | FR-INC-02 chỉ nói "version có hiệu lực tại ngày áp dụng", không nói ngày nào | #141 |
| B4 | Bảng tỷ lệ là danh sách bậc `[{min_ratio, rate}]` trong phiên bản quy tắc | Q16 chưa trả lời; RFP nhắc `incentive-rate-table.csv` nhưng không có mẫu | #132, #140; nếu khách dùng ma trận nhiều chiều thì #132 và #140 phải ước lượng lại (rủi ro R1) |
| B5 | 支払期日 = cuối kỳ + N ngày nghiệp vụ theo `market_calendar`; lưu trên khoản phải thu, không tính lại khi phiên bản đổi | Q16 (định nghĩa 支払期日) | #134 |
| B6 | Biết đã trả tiền qua nhập tay + import CSV từ bộ phận đối soát; không liên kết ngân hàng | Q17 (Plan A); liên kết ngân hàng là SCOPE-OUT-05 | #135, #136, #137 |
| B7 | Mã báo cáo khuyến khích = RPT-07 | 01 không đánh số báo cáo này | #144, #145 (chỉ đổi tên) |
| B8 | 買出人 có `valid_to` bắt buộc như SCR-010 | RFP tự mâu thuẫn (M1: "đăng ký tại điểm giao dịch" vs "参加有効期限"), chưa có câu hỏi | #56 (migrate); đã gây vượt giờ ở Sprint 1 (EV-3), câu hỏi mới gửi khách (R3) |
| B9 | Giờ ước lượng = giờ dev có AI hỗ trợ, đã gồm test của chính task; năng lực 56 giờ/người/sprint (focus 0,7); không tính lễ Nhật | RFP không nêu đội hình, lịch làm việc | Toàn bộ estimate; Sprint 2 và 4 mất ~10% năng lực nếu theo lịch Nhật (R5) |
| B10 | Không có thành viên Infra: bucket Storage, service worker, CI giao cho BE/FE | Đội hình do bên làm tự chọn | #24, #26, #122–#129 |

## 3. Hướng đã chốt

| Vấn đề | Các phương án ở LAB-4 | Phương án chốt | Vì sao |
|---|---|---|---|
| Nguồn dữ liệu "đã trả tiền" cho 完納奨励金 | 01 §9.4 để mở: nhập tay / CSV (Q17), chưa chọn | Làm **cả hai**, tách 2 issue riêng (#135 nhập tay, #136 CSV) dùng chung bảng `payments` | Nhập tay để chạy được ngay khi CSV chưa có định dạng; CSV giảm nhập tay khi ~1.200 giao dịch/ngày. Tách issue để nếu khách bỏ CSV thì chỉ gỡ #136 |
| Ngày cũ chưa khóa khi mở ngày mới | 06 Mục 2.1 ghi trạng thái `closing` là "quyết định phát sinh, cần lead xác nhận" | Chốt dùng `closing` | Là cách duy nhất giữ cùng lúc "tối đa một ngày `open`" và "cho mở ngày khi ngày trước chưa khóa"; đã tính vào #46, #47 |
| Thứ tự kiểm khi chốt giao dịch | Reviewer (C-12): kiểm ngày lên đầu; 01 §9.1: ngày ở bước 6 | Giữ 01 §9.1 (lead đã chốt ở LAB-4 D1); mọi nhánh ngày khóa vẫn ghi `blocked_edit` | Không đổi so với LAB-4; ghi lại để #82 làm đúng một thứ tự |
| Tranh chấp giao hàng | Module tranh chấp đầy đủ (SCR-026/027) / cờ `disputed` tối thiểu | Cờ `disputed` (D3); SCR-026/027 để giai đoạn sau, không có issue | Đủ để checklist khóa sổ CK-5 chạy; không mở rộng phạm vi |
| Hạn tham gia của 買出人 | SCR-010 bắt buộc `valid_to`; RFP mâu thuẫn (M1) | Tạm theo SCR-010 (B8), gửi câu hỏi mới | Migrate (#56) không chờ được; nếu khách trả lời ngược thì chỉ nới ràng buộc, không phải migrate lại |
