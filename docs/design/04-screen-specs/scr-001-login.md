# SCR-001 — Đăng nhập và xác thực hai lớp (ログイン / 二要素認証)

Wireframe: [../05-wireframes/index.html#scr-001](../05-wireframes/index.html#scr-001) · Ràng buộc: BC-13, BC-85, BC-86, BC-87, BC-89 · ADR: ADR-004, ADR-008 · Gap: G-19

## 1. Mục đích và người dùng
- Cổng vào duy nhất cho **người dùng nội bộ** của chợ (BC-13: Plan A, bên ngoài không đăng nhập, chỉ nhận email).
- Ai dùng: mọi vai trò `sys_admin`, `market_ops`, `intake`, `judge`, `trade`, `delivery`, `settlement`, `approver`, và vai trò đích `rule_admin` (ADR-004, G-16).
- **MFA bắt buộc** cho `sys_admin`, `rule_admin`, `approver` (BC-85, NFR-SEC-01; bảng 9.7). `settlement` bật MFA mặc định (giả định S theo bảng 9.7, gỡ được trong `system_settings.mfa_required_roles`). Các vai trò hiện trường (`intake`, `judge`, `trade`, `delivery`) không bắt buộc MFA vì dùng máy chung theo ca.
- Lúc dùng: đầu ca (02:00 JST mở 業務日) và mỗi lần đổi ca trên máy dùng chung (BC-64). Tải: 180 tài khoản, ≤ 60 người đồng thời (BC-80) — cao điểm đăng nhập là 02:00–02:30.

## 2. Điều kiện vào màn hình
- Đường dẫn: `/login` (bước 1) và `/login/mfa` (bước 2). Công khai, không cần quyền (`PUBLIC_PATHS` trong `src/proxy.ts`).
- Tham số: `?next=<đường dẫn nội bộ>`; chỉ chấp nhận chuỗi bắt đầu bằng `/` và không bắt đầu bằng `//` (như bản hiện tại, chống open redirect).
- Vào từ: mọi trang khi chưa có phiên hoặc phiên hết hạn (proxy redirect). Đã có phiên đầy đủ mà vào `/login` → chuyển về `/`.
- Đi tới: `next` hoặc `/` sau khi xong bước cuối cùng cần thiết.

## 3. Bố cục
1. Header thẻ: tên hệ thống `桜水産市場 業務支援システム`, dòng phụ tiếng Việt.
2. Vùng thông báo (`role="alert"`): lỗi / khóa tạm / hết phiên.
3. **Bước 1** — form: メールアドレス, パスワード, nút ログイン.
4. **Bước 2** (chỉ khi vai trò cần MFA) — form mã 6 số; hoặc màn hình **đăng ký MFA lần đầu** (mã QR TOTP + ô xác nhận mã).
5. Chân thẻ: ghi chú "共用端末では業務終了時に必ずログアウトしてください / Máy dùng chung: hết ca phải đăng xuất".

## 4. Dữ liệu hiển thị
| Mục | Nguồn | Định dạng | Ghi chú |
|---|---|---|---|
| Lý do bị đưa về trang đăng nhập | query `?reason=timeout` do proxy gắn | văn bản cố định | Hiện thông báo M-07 |
| Mã QR đăng ký TOTP | `POST /api/auth/mfa/enroll` → `supabase.auth.mfa.enroll({factorType:'totp'})` | SVG QR + secret dạng text | Chỉ hiện lần đầu, không lưu ở client |
| Thời gian còn khóa | `POST /api/auth/login` trả `locked_until` | `HH:mm` JST | Không lộ số lần đã sai |

## 5. Field nhập
| ID | Nhãn (JP / VI) | Kiểu | Bắt buộc | Mặc định | Nguồn lựa chọn | Validation (tầng) | Thông báo lỗi |
|---|---|---|---|---|---|---|---|
| F-01 | メールアドレス / Email | email, `autocomplete=username` | Có | rỗng | — | Không rỗng, đúng định dạng (C); trim + lowercase, không rỗng (A) | M-01 |
| F-02 | パスワード / Mật khẩu | password, `autocomplete=current-password` | Có | rỗng | — | Không rỗng (C, A); đúng mật khẩu (Supabase Auth) | M-01, M-02 |
| F-03 | 確認コード / Mã xác thực | text, `inputmode=numeric`, `autocomplete=one-time-code`, 6 ký tự | Có (bước 2) | rỗng | — | 6 chữ số (C, A); `mfa.challengeAndVerify` (Supabase) | M-05 |
| F-04 | 確認コード（登録） / Mã xác nhận đăng ký | như F-03 | Có (đăng ký lần đầu) | rỗng | — | như F-03 | M-05 |

Không có ô "ghi nhớ thiết bị": BC-85 cấm áp cho vai trò duyệt, và máy dùng chung theo ca (giả định S: bỏ hẳn cho mọi vai trò, KISS).

Thông báo (cùng một câu ở UI và trong body `{error}` của API):

| Mã | JP | VI |
|---|---|---|
| M-01 | メールアドレスとパスワードを入力してください。 | Nhập email và mật khẩu. |
| M-02 | メールアドレスまたはパスワードが正しくありません。 | Email hoặc mật khẩu không đúng. |
| M-03 | ログイン失敗が続いたため、{HH:mm}までロックされています。時間をおいて再度お試しいただくか、システム管理者に連絡してください。 | Sai quá nhiều lần, tài khoản bị khóa tạm đến {HH:mm}. Thử lại sau hoặc liên hệ quản trị hệ thống. |
| M-04 | このアカウントは無効化されているか、役割が割り当てられていません。 | Tài khoản đã bị khóa hoặc chưa được gán vai trò. |
| M-05 | 確認コードが正しくないか、有効期限が切れています。 | Mã xác thực sai hoặc đã hết hạn. |
| M-06 | この役割では二要素認証が必須です。認証アプリを登録してください。 | Vai trò này bắt buộc xác thực hai lớp. Hãy đăng ký ứng dụng xác thực. |

M-06 là thông báo **dùng chung** cho mọi màn hình khi phiên chưa đạt AAL2 (README spec). MFA chỉ kiểm theo phiên đăng nhập; không màn hình nào hỏi MFA lại theo từng thao tác.
| M-07 | 一定時間操作がなかったため、ログアウトしました。再度ログインしてください。 | Phiên đã hết do không thao tác. Đăng nhập lại. |
| M-08 | ネットワークに接続できません。接続を確認してください。 | Không kết nối được mạng. Kiểm tra kết nối. |

M-02 dùng chung cho "email không tồn tại" và "sai mật khẩu" — không lộ tài khoản nào có thật (BC-86).

## 6. Trạng thái màn hình
| Trạng thái | Điều kiện | Hiển thị / hành vi |
|---|---|---|
| Đang tải | Lần đầu mở trang | Form hiện ngay (trang tĩnh), không spinner |
| Trống | Mặc định | Focus vào F-01 |
| Lỗi tải | — | Không áp dụng (không tải dữ liệu) |
| Không có quyền | Tài khoản `active=false` hoặc không có vai trò | M-04, ở lại bước 1, phiên đã bị `signOut` |
| Khóa tạm | Số lần sai trong cửa sổ ≥ ngưỡng | M-03, nút ログイン vẫn bật (thử lại sẽ nhận lại M-03 cho tới hết khóa) |
| Ngày đã khóa | — | Không áp dụng (đăng nhập không phụ thuộc 業務日) |
| Mất mạng | `navigator.onLine=false` hoặc fetch lỗi mạng | M-08; không xếp hàng đợi (ADR-010 không áp cho đăng nhập) |
| Đang gửi | Chờ API | Nút đổi thành `ログイン中… / Đang đăng nhập…`, disabled; chặn submit lần hai |
| Cần MFA | API bước 1 trả `mfa: "verify"` hoặc `"enroll"` | Chuyển `/login/mfa`, focus F-03 / hiện QR + F-04 |
| Thành công | Phiên đạt mức yêu cầu (AAL1 cho vai trò thường, AAL2 cho vai trò MFA) | Chuyển `next` hoặc `/` |

## 7. Hành động
| Nút / thao tác | Quyền | Bật khi | Gọi API | Kết quả thành công | Kết quả lỗi |
|---|---|---|---|---|---|
| ログイン / Đăng nhập (Enter ở F-02) | Công khai | Không đang gửi | `POST /api/auth/login {email,password}` | `{ok:true, mfa:"none"}` → điều hướng; `{ok:true, mfa:"verify"\|"enroll"}` → bước 2 | 400 M-01 · 401 M-02 · 403 M-04 · 423 M-03 |
| 確認 / Xác nhận mã (Enter ở F-03) | Phiên AAL1 | F-03 đủ 6 số | `POST /api/auth/mfa/verify {code}` | Phiên nâng AAL2 → điều hướng | 400 M-05 (tính vào bộ đếm sai) |
| 認証アプリを登録 / Đăng ký MFA | Phiên AAL1, vai trò cần MFA, chưa có factor | Bước 2 kiểu `enroll` | `POST /api/auth/mfa/enroll` rồi `POST /api/auth/mfa/verify {factor_id, code}` | Factor `verified`, phiên AAL2 | M-05 |
| 戻る / Quay lại | — | Bước 2 | `POST /api/auth/logout` | Về bước 1, phiên AAL1 bị hủy | — |

Mọi kết quả ghi `audit_logs` (BC-81, BC-86): `login`, `login_failed` (kèm email đã nhập, không kèm mật khẩu), `account_locked`, `mfa_enrolled`, `mfa_failed`, `logout`, `session_timeout`. Theo ADR-006 bản ghi phải cùng giao dịch với thay đổi; riêng đăng nhập không đổi dữ liệu nghiệp vụ nên ghi ngay sau kết quả Auth.

## 8. Phân quyền hiển thị
| Vai trò | Thấy màn hình | Thấy vùng / cột | Thao tác được |
|---|---|---|---|
| sys_admin | Có | Bước 1 + bước 2 (bắt buộc) | Đăng nhập; không vào được app nếu chưa AAL2 |
| rule_admin (đích) | Có | Bước 1 + bước 2 (bắt buộc) | như trên |
| approver | Có | Bước 1 + bước 2 (bắt buộc) | như trên |
| settlement | Có | Bước 1 + bước 2 (mặc định bật, S) | như trên khi bật |
| market_ops, intake, judge, trade, delivery | Có | Chỉ bước 1 (trừ khi `mfa_required_roles` thêm vào) | Đăng nhập |
| Người tham gia bên ngoài | Không có tài khoản (BC-13) | — | — |

Chặn ở API, không chỉ ở màn hình: `guard()` (src/lib/api/route-guard.ts) kiểm thêm — nếu vai trò của người dùng nằm trong `system_settings.mfa_required_roles` mà phiên chưa AAL2 (`supabase.auth.mfa.getAuthenticatorAssuranceLevel()`) → 401 với M-06; `proxy.ts` đưa trang về `/login/mfa`.

## 9. Quy tắc nghiệp vụ và điểm phân nhánh
Cấu hình trong `system_settings` (ADR-008 #9: tham số bảo mật / vận hành, đọc bằng `fn_setting(key)`; `sys_admin` sửa với quyền `settings.manage` (mới), có audit, **hiệu lực ngay**, không tính vào giới hạn 4 lần / năm của quy tắc chợ). RFP không cho con số → mặc định là **giả định (S)**:

| Khóa | Mặc định (S) | Ý nghĩa |
|---|---|---|
| `mfa_required_roles` | `["sys_admin","rule_admin","approver","settlement"]` | Ba mã đầu là **B** (BC-85), không được gỡ khỏi danh sách (D: kiểm khi lưu `system_settings`); `settlement` là S |
| `login_max_failures` | 5 | Số lần sai liên tiếp trước khi khóa tạm (BC-86) |
| `login_failure_window_min` | 15 | Cửa sổ đếm lần sai |
| `login_lock_min` | 15 | Thời gian khóa tạm |
| `session_idle_timeout_min` | 30 | Không thao tác quá mức này thì hết phiên (BC-86) |
| `session_absolute_hours` | 10 | Tối đa một phiên, phủ khung dịch vụ 02:00–10:00 (BC-78) và buộc đăng nhập lại mỗi ca |

Bảng quyết định cho `POST /api/auth/login` (đánh giá theo thứ tự, dừng ở dòng đầu tiên khớp):

| # | Điều kiện | Kết quả | Tầng |
|---|---|---|---|
| 1 | Thiếu email / mật khẩu | 400 M-01 | C, A |
| 2 | Số `login_failed` của email trong `login_failure_window_min` ≥ `login_max_failures` và lần sai cuối + `login_lock_min` > now | 423 M-03, ghi `login_failed` (reason `locked`) | A (đếm từ `audit_logs`, không thêm bảng; index `(action, entity_id, at)` ở 03 §2) |
| 3 | Supabase Auth từ chối | 401 M-02, ghi `login_failed`; nếu vừa chạm ngưỡng thì ghi thêm `account_locked` | A |
| 4 | `profiles.active=false` hoặc không có profile | `signOut`, 403 M-04 | A |
| 5 | Vai trò ∈ `mfa_required_roles`, chưa có factor verified | `{mfa:"enroll"}` | A |
| 6 | Vai trò ∈ `mfa_required_roles`, có factor | `{mfa:"verify"}` | A |
| 7 | Còn lại | `{mfa:"none"}`, ghi `login` | A |

- Khóa tạm áp theo email (kể cả email không tồn tại) để không lộ tài khoản. `sys_admin` mở khóa sớm bằng màn hình quản trị tài khoản (BC-47, có audit) — ngoài phạm vi màn hình này.
- Sai mã MFA cũng cộng vào bộ đếm của email đó.
- Hết phiên do không thao tác: proxy so `last_seen` (cookie httpOnly, cập nhật mỗi request) với `session_idle_timeout_min`; quá hạn → `signOut`, ghi `session_timeout`, redirect `/login?reason=timeout&next=…`. Dữ liệu đang nhập dở trên màn hình khác không gửi đi (form 相対 giữ nháp cục bộ, xem SCR-016).
- Đăng nhập không kiểm tư cách người tham gia và không kiểm 業務日 (BC-06: kiểm lúc chốt, không lúc đăng nhập — bẫy T3).
- Mật khẩu chỉ đi qua TLS tới Supabase Auth, không log, không lưu ở client (BC-86).

## 10. Tiêu chí nghiệm thu
1. **Given** tài khoản `trade` đang hoạt động, **When** nhập đúng email và mật khẩu, **Then** vào thẳng `/` không qua bước MFA, và `audit_logs` có một dòng `login`.
2. **Given** tài khoản `approver` đã đăng ký TOTP, **When** đăng nhập đúng mật khẩu, **Then** chuyển `/login/mfa`; gọi bất kỳ `/api/*` có guard khi chưa nhập mã thì nhận 401 với M-06.
3. **Given** tài khoản `sys_admin` chưa có factor, **When** đăng nhập đúng mật khẩu, **Then** thấy màn hình đăng ký QR; chỉ sau khi nhập đúng mã thì phiên đạt AAL2 và vào được `/`.
4. **Given** ngưỡng `login_max_failures=5`, **When** nhập sai mật khẩu 5 lần trong 15 phút rồi nhập đúng ở lần 6, **Then** lần 6 vẫn nhận 423 M-03 với giờ mở khóa JST, và `audit_logs` có `account_locked`.
5. **Given** email không tồn tại, **When** đăng nhập, **Then** thông báo giống hệt sai mật khẩu (M-02), mã HTTP 401.
6. **Given** tài khoản `active=false`, **When** nhập đúng mật khẩu, **Then** nhận M-04 và không còn cookie phiên.
7. **Given** phiên `trade` không thao tác quá `session_idle_timeout_min`, **When** mở bất kỳ trang nào, **Then** bị đưa về `/login?reason=timeout` với M-07 và có dòng `session_timeout`.
8. **Given** `system_settings.session_idle_timeout_min = 30`, **When** `sys_admin` đổi thành 20 kèm lý do, **Then** từ request kế tiếp timeout 20 phút áp dụng, không deploy, không tạo phiên bản quy tắc (`rule_sets` không đổi), và `audit_logs` có before = 30 / after = 20.
9. **Given** `?next=//evil.example`, **When** đăng nhập thành công, **Then** điều hướng về `/`.
10. **Given** mất mạng, **When** bấm ログイン, **Then** hiện M-08, không có request lặp tự động.

## 11. Khác prototype LAB-2 và việc cần làm
| G-xx | Hiện tại | Cần đổi |
|---|---|---|
| G-19 | Không có MFA; mọi vai trò chỉ email + mật khẩu | Thêm `/login/mfa`, `/api/auth/mfa/enroll`, `/api/auth/mfa/verify`; `guard()` + `proxy.ts` đòi AAL2 cho `system_settings.mfa_required_roles` |
| G-16 | Không có vai trò `rule_admin` | Thêm vai trò (seed `roles`), nằm trong `mfa_required_roles` |
| G-05 | Chưa có ngưỡng khóa / timeout | Đọc 6 khóa ở §9 qua `fn_setting(key)` (`system_settings`) |
| G-06 | Chỉ ghi `login` thành công; lỗi audit bị bỏ qua | Ghi thêm `login_failed`, `account_locked`, `mfa_*`, `session_timeout`, `logout` |
| G-23 | Không khóa tạm khi sai nhiều lần; không có timeout không thao tác (chỉ dựa thời hạn token Supabase) | Bộ đếm lần sai từ `audit_logs`; cookie `last_seen` ở `proxy.ts` (BC-86) |
| — | Thông báo lỗi chỉ tiếng Việt | Bảng M-01…M-08 JP + VI (BC-89: UI tiếng Nhật) |

## 12. Câu hỏi mở
- Ngưỡng / timeout là **tham số vận hành** (`system_settings`), không phải quy tắc chợ; nếu khách coi chúng là quy tắc theo GOV-RULE-01 thì chuyển về `rule_values` (ADR-008).
- **Q21** (SSO với IdP nội bộ): Plan A = tài khoản riêng + MFA cho quản trị. Nếu Q21 = có SSO, bước 1 đổi thành nút "社内IDでログイン" và MFA do IdP đảm nhiệm; spec này giữ nguyên bảng quyết định cho tài khoản cục bộ.
- Phương thức MFA (TOTP qua ứng dụng xác thực) là giả định S; RFP chỉ nói "MFA". Nếu chợ không cho dùng điện thoại cá nhân, cần khóa phần cứng — chưa có câu hỏi, đề xuất thêm.
- Các ngưỡng 5 lần / 15 phút / 30 phút / 10 giờ là giả định S, cần chợ xác nhận.
- **Q4**: nếu mở cổng cho người tham gia bên ngoài thì phải nêu chính sách MFA cho họ (SEC-IAM-02, BC-85) — ngoài phạm vi baseline.
