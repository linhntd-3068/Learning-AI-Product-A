# Ghi chú làm việc với AI — LAB-4 (trả lời cụm câu neo)

Toàn bộ bộ thiết kế được làm bằng Claude Code. Phiên chính đóng vai lead: chia việc, ra quyết định, kiểm tra, ghép kết quả. Các agent con làm từng phần.

| Bước | Ai làm | Đầu ra |
|---|---|---|
| 1 | Agent đọc RFP + Q&A (song song với 2) | 01 — 89 ràng buộc, 7 bảng quyết định, 21 bẫy |
| 2 | Agent khảo sát code prototype (chỉ đọc) | Kiểm kê thực tế: bảng, hàm, API, màn hình, 16 chỗ làm tắt |
| 3 | Lead | 02 kiến trúc, 03 ERD + gap, ADR-001…010, mẫu screen spec |
| 4 | 2 agent viết spec song song (4 + 4 màn hình) | 8 screen spec |
| 5 | Agent wireframe (song song với 6) | Wireframe HTML |
| 6 | Agent review (vai quản lý, nhận / trả lại) | 06 Mục 1 |
| 7 | Lead ra 9 quyết định; agent sửa; agent viết SCR-034 bằng mẫu prompt dùng chung | 06 Mục 2, SCR-034 |
| 8 | Lead kiểm ngẫu nhiên, chốt nhận | 06 Mục 3 |
| 9 | Agent wireframe cập nhật theo spec đã sửa | 05 bản cuối |

## P1-04 — Quản lý context

- **Chọn đúng đầu vào cho từng việc, không dồn hết vào một chỗ.**
  - RFP tiếng Nhật rất dài nên không nạp nguyên văn. Agent ràng buộc tra theo mã ID; agent sau chỉ đọc bản đã chắt lọc (01) cộng các file liên quan tới đúng việc của mình.
  - Agent viết spec chỉ nhận: mẫu spec, 01, 03, các ADR liên quan và đúng file code của màn hình đó.
- **Mỗi agent nhận brief tự đủ:** danh sách file cụ thể, tiêu chí xong, phạm vi được sửa, không nhận lịch sử hội thoại. Ví dụ agent wireframe được dặn không đụng spec, agent sửa được dặn không đụng wireframe, để hai agent chạy song song không ghi đè nhau.
- **Lúc context bị nhiễu và cách xử lý:**
  - **Hai agent viết spec song song đã tự đặt giả định khác nhau.** Có 15 mâu thuẫn: ngày nghiệp vụ hiểu ba cách, ba câu thông báo MFA khác nhau, mặc định ma trận mua bán khác nhau. Nguyên nhân là chúng không thấy bài của nhau. Cách xử lý: thay vì sửa từng chỗ, lead ra một bộ quyết định chung (D1–D9) làm nguồn duy nhất, rồi một agent áp quyết định đó cho mọi file.
  - **Agent khảo sát code kết luận sai** "không có cách tạo tài khoản đầu tiên", vì nó không đọc thư mục `scripts/`. Lead phát hiện nhờ đã biết repo, nên không đưa câu đó vào tài liệu.
  - **Thông tin mới đến khi agent đang chạy:** spec SCR-034 xong khi agent sửa vẫn đang làm. Lead gửi bổ sung qua tin nhắn cho đúng agent đang có context, thay vì mở agent mới.
- **Sự thật dùng chung được chốt vào một file:** `docs/ai-context/project-context.md`, được `CLAUDE.md` tự nạp. Mọi phiên sau bắt đầu từ cùng một nền đã kiểm.

## P1-06 — Tài sản AI dùng chung cho team

Đã tạo trong repo, ai clone về cũng có:

| Tài sản | Dùng làm gì | Đã dùng thật trong bài |
|---|---|---|
| `CLAUDE.md` + `docs/ai-context/project-context.md` | Context chuẩn một trang: sản phẩm, stack, 7 quy tắc không được làm sai, đọc gì cho việc gì | Nạp tự động mỗi phiên Claude Code |
| `docs/ai-context/prompts/screen-spec-writer.md` | Mẫu prompt viết spec một màn hình | Viết SCR-034 bằng chính mẫu này: ra đúng cấu trúc, không cần chỉnh khung |
| `docs/ai-context/prompts/design-review-checklist.md` | Mẫu prompt review sản phẩm AI: 7 mục kiểm, 3 kết luận | Agent review dùng nguyên mẫu này để chấm 22 file |
| `docs/ai-context/prompts/task-breakdown-from-design.md` | Mẫu prompt tách task từ thiết kế | Chuẩn bị cho LAB-5 |
| `docs/design/04-screen-specs/README.md` | Mẫu spec 12 mục + quy ước (tầng validation C / A / D, mã lỗi, câu dùng chung) | Mọi spec theo cùng khung |

Bài học: mẫu prompt chỉ có giá trị khi nó buộc đầu ra có thể kiểm. Ví dụ mẫu review buộc trích bằng chứng theo dòng và mã, thay vì để AI tự nhận xét chung chung.

## P2-10 — Review sản phẩm AI ở góc quản lý (nhận hay trả lại)

- **Đối chiếu với yêu cầu đã đặt, không theo cảm nhận.**
  - Reviewer nhận đề bài LAB-4 tóm tắt cùng checklist 7 mục.
  - Kết quả lần 1: 22 file → 5 NHẬN, 16 NHẬN CÓ SỬA, **1 TRẢ LẠI**. ADR-009 bị trả vì định nghĩa "ngày nghiệp vụ hiện tại" theo hai cách, vi phạm một trong 7 quy tắc.
- **Không tin chỗ AI tự chấm.**
  - Sau khi sửa, chính agent sửa tự đánh giá "NHẬN" cho gần hết. Lead không lấy đó làm kết luận.
  - Lead tự kiểm ngẫu nhiên 8 điểm (06 Mục 3), gồm grep mã lỗi cũ, đọc câu từ chối 許可 / 承認, parse sơ đồ, kiểm link. Sau đó mới chốt.
- **Tự kiểm nguồn trước khi dùng làm nền.** Trước khi xây thiết kế trên danh mục ràng buộc, lead kiểm 4 trích dẫn quan trọng trên RFP gốc. Nhờ vậy xác nhận được câu 12-06 (gộp 許可 và 承認 là bị loại hồ sơ). Chính câu này cho thấy prototype LAB-2 đang mắc đúng lỗi bị loại, vì nó xử lý ba căn cứ như nhau (G-01).
- **Quyết định thuộc về người, ghi lại có lý do.** Reviewer để lại hai câu hỏi cần quyết: tách `system_settings`, và có viết spec màn hình quy tắc không. Agent sửa thì phát sinh hai giả định: trạng thái `closing` và "ngày tham chiếu". Lead quyết cả bốn và ghi lý do (06 Mục 2 §2.1, Mục 3).
- **Lỗi AI đáng chú ý đã bắt được:**
  - prototype gộp 許可 và 承認;
  - định nghĩa ngày mâu thuẫn;
  - ERD đích có khóa chính làm FK không thực hiện được;
  - giá trị mặc định của người xác nhận せり vô tình tái tạo đúng lỗi G-22;
  - cú pháp Mermaid lỗi vì dấu chấm phẩy, bắt được khi parse thật.

## Còn mở (cần khách hoặc SME)

Q-009-1 (duyệt điều chỉnh sau khi khóa ~10:00), Q-024-3 (có chặn mở ngày khi ngày trước chưa khóa không), Q-029-2 (ai giải quyết tranh chấp giao hàng), hạn tham gia của 買出人 (mâu thuẫn M1 trong RFP), và 35 câu Q&A gốc chưa có trả lời.
