# ADR-007: Tư cách tham gia tách theo căn cứ — đăng ký (登録) / giấy phép (許可) / chấp thuận (承認)

- **Trạng thái:** Đề xuất cho thiết kế đích. Sửa một lỗi nghiêm trọng của prototype.
- **Ngày:** 16/10/2026

## Bối cảnh
- **Mỗi nhóm tham gia có căn cứ riêng** (FIG-004, TBL-ACTOR-01):

  | Nhóm | Căn cứ tham gia | Tạm dừng / gỡ tạm dừng |
  |---|---|---|
  | 卸売業者 (nhà bán buôn) | đăng ký với chợ (市場登録) | cần phê duyệt (承認) |
  | 仲卸 (môi giới) | giấy phép (許可), qua thẩm định có điều kiện | có điều kiện (条件付き) |
  | 売買参加者 (khách mua lớn) | chấp thuận (承認), thủ tục nhẹ hơn | phải tái thẩm định (再審査) |
  | 買出人 (người đi chợ) | đăng ký tại điểm giao dịch | — |

- **Gộp hai căn cứ là bị loại hồ sơ.** RFP 12-06 ghi nguyên văn: hồ sơ coi 「許可 と 承認 を同一の権限として扱う」 bị xem là không đạt.
- **Lúc kiểm tra tư cách** (BC-06, BC-62):
  - khi **chốt** giao dịch (BR-PERM-01);
  - khi **giao hàng**, có bước "権限失効確認".
- **Prototype đang dính đúng lỗi bị loại:**
  - cột `participants.basis` chỉ để lưu và hiển thị;
  - `fn_participant_block_reason` xét chung một bộ trạng thái + hạn cho cả ba căn cứ;
  - giao hàng kiểm theo `current_date` chứ không theo ngày nghiệp vụ.

## Quyết định
1. **Tách bảng tư cách.** Bảng `participant_qualifications` (một người tham gia có thể có lịch sử nhiều bản ghi), mỗi bản ghi gồm:
   - `basis_type` ∈ `market_registration`, `permit` (許可), `approval` (承認), `point_registration` (đăng ký tại điểm giao dịch);
   - số hiệu, cơ quan cấp, `valid_from`, `valid_to`;
   - `status` (有効 / 一時停止 / 失効 / 再審査中);
   - điều kiện kèm theo (`conditions`, chỉ dùng cho 許可);
   - người duyệt, bằng chứng.
2. **Ràng buộc nhóm ↔ căn cứ ở DB.** Bảng `party_kind_basis(kind, basis_type)` chặn việc gán sai, ví dụ 仲卸 không thể có căn cứ 承認.
3. **Họ hàm tư cách — chỉ ba hàm, spec không được đẻ thêm hàm khác:**
   - `fn_qualification_state(qid, business_date)` → trạng thái hiển thị (`valid`, `not_started`, `suspended`, `re_review`, `expired`) của một bản ghi tư cách tại ngày; dùng cho SCR-010 và cờ ở danh sách chọn người (`GET /api/participants?purpose=sell|buy&day=`).
   - `fn_qualification_block_reason(party, business_date, purpose)` — `purpose` ∈ `sell`, `buy`, `deliver`:
     - `sell` / `buy`: trả `NULL` (cho phép) hoặc mã lý do riêng theo căn cứ (RJ-01…RJ-08a của SCR-016), ví dụ "許可 đã hết hiệu lực", "承認 đang chờ 再審査", "取引地点登録 hết hạn"…;
     - `deliver`: trả `{result ∈ block | allow_with_flag | allow, code}` theo bảng quyết định 6 bên dưới và khóa `delivery_expired_policy`. Vì lúc chốt đã kiểm tư cách, "hết hạn tại ngày giao" luôn là "hết hạn sau khi đã chốt" — không cần tham số giao dịch. Không có hàm `fn_delivery_qualification` riêng;
     - mốc tính hạn theo khóa `qualification_valid_to_inclusive` (ADR-008).
   - `fn_qualification_event(qid, event, actor, payload)` → vòng đời (`apply`, `approve`, `suspend`, `lift`, `re_review`, `expire`), rẽ nhánh theo `party_kind_basis.suspend_policy`; `payload` lưu vào `qualification_events.payload`.
   - Luôn đánh giá theo **ngày nghiệp vụ** (ADR-009), không theo đồng hồ.
4. **Vòng đời tạm dừng / gỡ là ba luồng khác nhau:**
   - 卸売業者: gỡ tạm dừng cần người duyệt;
   - 仲卸: gỡ khi đủ điều kiện ghi trong `conditions`;
   - 売買参加者: phải qua trạng thái 再審査 rồi mới về 有効.
5. **Ma trận "nhóm × loại giao dịch → được phép" là cấu hình** (`trade_kind_matrix`, ADR-008). Nhóm bên mua lấy từ TBL-ACTOR-01: 仲卸, 売買参加者, 買出人; 卸売業者 là bên bán (tạo lô, bán qua 相対 / せり), không phải bên mua. Mặc định: cả ba nhóm bên mua có tư cách hiệu lực được phép ở **cả** 相対 và せり. RFP không phân "ai mua ở 相対, ai mua ở せり" (01 §1.1), nên **không tự đặt quy tắc** chặn thêm.
6. **Lúc giao hàng mà tư cách đã đổi:** theo bảng quyết định 9.2 (chờ Q31):
   - hết hạn sau khi đã chốt → cho giao, gắn cờ cảnh báo;
   - đang tạm dừng → chặn, chờ người quyết định.

## Phương án đã cân nhắc
| Phương án | Bỏ vì |
|---|---|
| Giữ một cột `basis` + một bộ `valid_from / valid_to / status` (như prototype) | Vi phạm 12-06; không có chỗ cho điều kiện của 許可, tái thẩm định của 承認, hay lịch sử gia hạn |
| Ba bảng riêng `permits`, `approvals`, `registrations` | Trùng cấu trúc ~90%; truy vấn "ai hết hạn trong 30 ngày" phải UNION. Một bảng có `basis_type` cùng ràng buộc nhóm ↔ căn cứ là đủ tách bạch |
| Tự đặt quy tắc "chỉ 仲卸 / 売買参加者 được mua đấu giá" | RFP không nói; tự bịa là vi phạm 00-06 |

## Hệ quả
- (+) Đáp ứng 12-06; thông báo từ chối nói đúng loại căn cứ, người dùng biết phải làm thủ tục gì.
- (+) Có lịch sử tư cách, không còn phải đọc lại vết từ audit log.
- (−) Phải migrate dữ liệu `participants.basis / valid_* / status` sang bảng mới; màn hình chi tiết người tham gia phải làm lại.
- (−) Còn mở: hạn của 買出人 (mâu thuẫn M1, đề xuất thêm câu hỏi); nội dung "条件付き" (Q5); giờ chính xác tư cách mất hiệu lực (Q31).
