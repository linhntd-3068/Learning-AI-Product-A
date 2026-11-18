# LAB-5 — Backlog, GitHub Project và báo cáo tiến độ · Product A

**Dự án:** 桜水産市場 業務支援システム (Công ty CP Chợ Thủy sản Vịnh Sakura — hư cấu) · **Đề:** Product A — sàn đấu giá thủy sản

## 1. Tổng quan

- **Nguồn break:** bộ thiết kế LAB-4 trong [`docs/design/`](docs/design/README.md), commit `bcacf30` ngày **2026-10-16** (wireframe, kiến trúc, ERD, 10 ADR, 9 screen spec, nhật ký review).
- **PREMISE.md có thay đổi:**
  - **Thêm** spec 完納奨励金, spec app shell và spec SCR-018, vì LAB-4 chưa có.
  - **Sửa** 6 điểm tồn đọng nhỏ đã ghi ở 06 Mục 4.
  - **Thêm** 10 giả định cho chỗ RFP/spec còn để ngỏ.

  Chi tiết ở [PREMISE.md](PREMISE.md).
- **Backlog:** 14 epic · 133 issue · **508 SWP** (đã review, trường `SWP` trên Project) · 981 giờ, xếp vào 6 sprint 2 tuần (2026-11-09 → 2027-01-29).
- **Sprint giả lập đã chạy:** **Sprint 1** (2026-11-09 → 2026-11-20). Trạng thái, giờ thực tế và burndown do script sinh, có 4 sự kiện gây trễ đặt có chủ đích. Xem [progress-report.md](progress-report.md).

## 2. Link

| Mục | Link |
|---|---|
| Repo | https://github.com/linhntd-3068/Learning-AI-Product-A |
| GitHub Project | https://github.com/users/linhntd-3068/projects/1 |
| Báo cáo HTML của skill chấm SWP | [`reports/swp/estimate-swp-product-a-project1-261111.html`](reports/swp/estimate-swp-product-a-project1-261111.html) (file HTML tự chứa — tải về rồi mở bằng trình duyệt) |

Đã mở thử repo, Project và báo cáo HTML bằng cửa sổ ẩn danh (không đăng nhập) ngày `TODO-ngày`: `TODO-kết quả`.

## 3. Cấu trúc repo

| File/thư mục | Nội dung |
|---|---|
| `README.md` | File này |
| `PREMISE.md` | Backlog khác bản LAB-4 ở đâu: spec thêm/sửa, giả định, hướng đã chốt |
| `task-breakdown.md` | Nguyên tắc chia task, spec → issue, hạng mục 完納奨励金, chỗ hở của spec |
| `estimate.md` | Kiểm SWP bằng skill, cách quy ra giờ, tổng theo epic, so với LAB-1 |
| `progress-report.md` | Báo cáo tiến độ Sprint 1: trạng thái, burndown, rủi ro trễ |
| `AI-report.md` | Đã dùng AI thế nào, review ra sao, điểm hiệu quả/chưa tốt |
| `reports/swp/` | Báo cáo HTML của skill chấm SWP |
| `docs/design/` | Bộ thiết kế LAB-4 (đầu vào của backlog) |
| `docs/lab5/` | Dữ liệu backlog (`backlog.json`, `backlog.md`), `github-map.json` (task → số issue), burndown PNG/SVG, bản báo cáo gốc do script sinh |
| `docs/ai-context/` | Context và prompt mẫu cho agent (gồm prompt tách task) |
| `docs/scope.md` | Phạm vi màn hình của prototype và phần ngoài phạm vi |
| `docs/prototype-readme.md` | Cách chạy prototype LAB-2 (Next.js + Supabase) |
| `docs/ai-review-log.md` | Nhật ký review output AI từ các lab trước |
| `scripts/github-project/` | Script nạp backlog lên Project, giả lập sprint, vẽ burndown, sinh báo cáo |
| `scripts/create-demo-users.mjs` | Tạo tài khoản demo cho prototype |
| `src/`, `public/`, `supabase/` | Mã nguồn prototype LAB-2 (app, tài nguyên tĩnh, migration DB) |
| `AGENTS.md`, `CLAUDE.md` | Hướng dẫn cho agent AI làm việc trong repo |
| `package.json`, `package-lock.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs` | Cấu hình build Next.js/TypeScript |
| `vercel.json`, `.vercelignore` | Cấu hình deploy Vercel |
| `.env.example`, `.gitignore` | Mẫu biến môi trường (không chứa khóa thật), danh sách bỏ qua của git |

## 4. Spec → epic

Số issue epic theo [`docs/lab5/github-map.json`](docs/lab5/github-map.json).

| Spec (mã/file LAB-4, hoặc dòng PREMISE) | Epic trên Project | Ghi chú |
|---|---|---|
| 03 §4 G-14…G-18; 06 Mục 4 #8, #10; PREMISE A3 | #1 — E-FND Nền tảng dữ liệu, phân quyền & spec chung | Gồm spec app shell mới |
| ADR-006; G-06 | #2 — E-AUD Audit nghiệp vụ trong cùng giao dịch | |
| ADR-008; SCR-034; G-05 | #3 — E-RULE Quy tắc chợ có phiên bản & tham số hệ thống | Ràng buộc: quy tắc vận hành riêng (業務規程), maker–checker, ≤ 4 lần/năm |
| ADR-009; G-02, G-07 | #4 — E-BDAY Ngày nghiệp vụ JST & mở ngày | Ràng buộc: 業務日 theo JST |
| ADR-007; SCR-010; G-01, G-24 | #5 — E-QUAL Tư cách tham gia theo căn cứ 登録/許可/承認 | Ràng buộc: 2 cấp quyền pháp lý 許可 ≠ 承認 (RFP 12-06) |
| SCR-001; G-19, G-23 | #6 — E-SEC Đăng nhập, MFA, khóa tạm & timeout | |
| SCR-012/013; G-04, G-15 | #7 — E-LOT Tiếp nhận & đánh giá lô | Thẩm định bằng mắt do người làm |
| SCR-016, SCR-018; G-11; PREMISE A2 | #8 — E-TRADE Chốt giao dịch 相対 & hủy | 相対 là luồng chính |
| SCR-019; G-22 | #9 — E-AUC Ghi kết quả せり có người xác nhận | Ràng buộc: chỉ ghi kết quả cuối, có 確認者 là người; không làm UI đấu giá |
| SCR-029; G-03, G-12 | #10 — E-DEL Ghi giao hàng, ngoại lệ & tranh chấp | |
| SCR-022, SCR-024; ADR-005; G-08…G-10 | #11 — E-LOCK Đối soát, khóa sổ, mở lại & điều chỉnh -R/-A | |
| 03 §4 G-21 | #12 — E-ACC Xuất kế toán IF-ACC-01 sau khóa sổ | |
| ADR-010; G-20 | #13 — E-OFF Offline cho tiếp nhận lô & giao hàng | |
| 01 §6, §9.4 (BR-INC-01, FR-INC-01…03); PREMISE A1 | #14 — E-INC 完納奨励金 | **Ràng buộc đặc thù của đề:** tách 18 issue, mỗi issue một biến nghiệp vụ, xem [task-breakdown.md §3](task-breakdown.md#3-hạng-mục-chịu-ràng-buộc-đặc-thù-của-đề) |
