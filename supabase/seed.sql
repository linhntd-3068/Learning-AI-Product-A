-- Product A prototype: mock data (fictitious companies, no real business data). Run after the two migrations.
-- Business days are relative to the day you run it: yesterday (locked after trading) and today (open).
-- Lots and trades go through the business functions so the seed obeys the same rules as the app.

insert into roles (code, name, sort) values
  ('sys_admin', 'Quản trị hệ thống', 1), ('market_ops', 'Vận hành chợ', 2), ('intake', 'Tiếp nhận lô', 3),
  ('judge', 'Đánh giá hàng', 4), ('trade', 'Giao dịch', 5), ('delivery', 'Giao hàng', 6),
  ('settlement', 'Đối soát', 7), ('approver', 'Phê duyệt', 8)
on conflict (code) do update set name = excluded.name, sort = excluded.sort;

insert into permissions (code, name, grp, sort) values
  ('participants.read', 'Xem người tham gia', 'Người tham gia', 1),
  ('participants.write', 'Sửa người tham gia, hiệu lực', 'Người tham gia', 2),
  ('lots.read', 'Xem lô hàng', 'Lô hàng', 3),
  ('lots.create', 'Tiếp nhận lô', 'Lô hàng', 4),
  ('lots.inspect', 'Ghi kết quả đánh giá', 'Lô hàng', 5),
  ('trades.read', 'Xem giao dịch, giao hàng', 'Giao dịch', 6),
  ('trades.create', 'Chốt giao dịch thỏa thuận', 'Giao dịch', 7),
  ('auction.record', 'Ghi kết quả đấu giá', 'Giao dịch', 8),
  ('trades.cancel', 'Hủy giao dịch trước khi khóa', 'Giao dịch', 9),
  ('deliveries.record', 'Ghi giao hàng, ngoại lệ', 'Giao hàng', 10),
  ('recon.read', 'Xem đối soát ngày', 'Đối soát', 11),
  ('recon.lock', 'Khóa ngày nghiệp vụ', 'Đối soát', 12),
  ('corrections.request', 'Tạo yêu cầu điều chỉnh', 'Điều chỉnh', 13),
  ('corrections.approve', 'Duyệt điều chỉnh', 'Điều chỉnh', 14),
  ('reports.export', 'Xuất báo cáo CSV', 'Báo cáo', 15),
  ('audit.read', 'Xem audit log', 'Kiểm toán', 16),
  ('admin.users', 'Quản lý tài khoản', 'Quản trị', 17),
  ('admin.roles', 'Quản lý phân quyền', 'Quản trị', 18)
on conflict (code) do update set name = excluded.name, grp = excluded.grp, sort = excluded.sort;

insert into role_permissions (role, permission)
select r, unnest(p) from (values
  ('sys_admin', array['admin.users', 'admin.roles', 'audit.read', 'participants.read', 'lots.read', 'trades.read', 'recon.read']),
  ('market_ops', array['participants.read', 'participants.write', 'lots.read', 'trades.read']),
  ('intake', array['participants.read', 'lots.read', 'lots.create']),
  ('judge', array['lots.read', 'lots.inspect']),
  ('trade', array['participants.read', 'lots.read', 'trades.read', 'trades.create', 'auction.record', 'trades.cancel']),
  ('delivery', array['lots.read', 'trades.read', 'deliveries.record']),
  ('settlement', array['participants.read', 'lots.read', 'trades.read', 'recon.read', 'recon.lock', 'corrections.request',
                       'reports.export', 'audit.read']),
  ('approver', array['lots.read', 'trades.read', 'recon.read', 'corrections.approve', 'reports.export', 'audit.read'])
) as v(r, p)
on conflict do nothing;

insert into participants (code, name, kind, basis, status, valid_from, valid_to, phone, note) values
  ('W-001', 'Kaiyo Suisan Oroshi', 'wholesaler', 'registration', 'active', current_date - 900, current_date + 700, '045-000-0101', null),
  ('W-002', 'Minato Gyorui', 'wholesaler', 'registration', 'active', current_date - 600, current_date + 500, '045-000-0102', null),
  ('M-001', 'Marukichi Shoten', 'middleman', 'license', 'active', current_date - 700, current_date + 400, '045-000-0201', null),
  ('M-002', 'Yamaichi Suisan', 'middleman', 'license', 'active', current_date - 300, current_date + 10, '045-000-0202', 'Sắp hết hạn giấy phép'),
  ('M-003', 'Kaneko Gyogyo', 'middleman', 'license', 'expired', current_date - 400, current_date - 3, '045-000-0203', 'Giấy phép đã hết hạn'),
  ('M-004', 'Taisei Shoten', 'middleman', 'license', 'suspended', current_date - 200, current_date + 300, '045-000-0204', 'Tạm dừng do vi phạm quy chế'),
  ('B-001', 'Shirokuma Super', 'buyer', 'approval', 'active', current_date - 500, current_date + 365, '045-000-0301', null),
  ('B-002', 'Umi no Sachi Foods', 'buyer', 'approval', 'active', current_date - 100, current_date + 20, '045-000-0302', null),
  ('B-003', 'Hokuto Processing', 'buyer', 'approval', 'under_review', current_date - 50, current_date + 300, '045-000-0303', 'Đang tái thẩm định'),
  ('R-001', 'Sushi Hanamaru', 'retail_buyer', 'registration', 'active', current_date - 60, current_date + 300, '045-000-0401', null),
  ('R-002', 'Izakaya Ebisu', 'retail_buyer', 'registration', 'active', current_date - 30, current_date + 200, '045-000-0402', null),
  ('R-003', 'Kappo Shiomi', 'retail_buyer', 'registration', 'active', current_date - 20, current_date + 5, '045-000-0403', null)
on conflict (code) do nothing;

insert into business_days (day, status) values (current_date - 1, 'open'), (current_date, 'open')
on conflict (day) do nothing;

do $$
declare
  d1 date := current_date - 1; d2 date := current_date;
  w1 bigint := (select id from participants where code = 'W-001');
  w2 bigint := (select id from participants where code = 'W-002');
  m1 bigint := (select id from participants where code = 'M-001');
  m2 bigint := (select id from participants where code = 'M-002');
  b1 bigint := (select id from participants where code = 'B-001');
  b2 bigint := (select id from participants where code = 'B-002');
  r1 bigint := (select id from participants where code = 'R-001');
  l lots; t trades;
begin
  if exists (select 1 from lots) then return; end if;  -- seed once

  -- yesterday: traded, delivered, then locked
  l := fn_create_lot(d1, w1, 'JF Sakura-hama', 'Cá ngừ vây xanh', 'kg', 180, null);
  update lots set grade = 'A', inspection_note = 'Thịt đỏ đẹp, mỡ tốt', inspected_at = now() - interval '1 day', status = 'inspected' where id = l.id;
  t := fn_confirm_trade(l.id, m1, 'auction', 120, 4200, null, 'Phiên đấu giá sáng');
  perform fn_record_delivery(t.id, 120, 'delivery', null, null, null);
  t := fn_confirm_trade(l.id, b1, 'negotiated', 60, 3900, null, null);
  perform fn_record_delivery(t.id, 40, 'delivery', null, 'Chuyến 1', null);
  perform fn_record_delivery(t.id, 18, 'delivery', null, 'Chuyến 2', null);
  perform fn_record_delivery(t.id, 2, 'exception', 'short', 'Thiếu 2 kg khi cân lại', null);

  l := fn_create_lot(d1, w2, 'Ishinomaki Gyokyo', 'Cá thu', 'thùng', 50, null);
  update lots set grade = 'B', inspected_at = now() - interval '1 day', status = 'inspected' where id = l.id;
  t := fn_confirm_trade(l.id, m2, 'negotiated', 30, 5200, null, null);
  perform fn_record_delivery(t.id, 30, 'delivery', null, null, null);
  t := fn_confirm_trade(l.id, r1, 'negotiated', 12, 5400, null, null);
  perform fn_record_delivery(t.id, 12, 'delivery', null, null, null);

  l := fn_create_lot(d1, w1, 'Choshi Port', 'Mực ống', 'kg', 90, null);
  t := fn_confirm_trade(l.id, b2, 'negotiated', 70, 1800, null, null);
  perform fn_record_delivery(t.id, 50, 'delivery', null, 'Giao một phần, còn chờ xe', null);

  perform fn_lock_day(d1, null);

  -- today: open day, partly sold
  l := fn_create_lot(d2, w1, 'JF Sakura-hama', 'Cá hồi', 'kg', 150, null);
  update lots set grade = 'A', inspected_at = now(), status = 'inspected' where id = l.id;
  t := fn_confirm_trade(l.id, b1, 'negotiated', 80, 2600, null, null);
  perform fn_record_delivery(t.id, 30, 'delivery', null, 'Chuyến 1', null);
  t := fn_confirm_trade(l.id, m1, 'negotiated', 40, 2700, null, null);

  l := fn_create_lot(d2, w2, 'Ishinomaki Gyokyo', 'Cua tuyết', 'thùng', 40, null);
  t := fn_confirm_trade(l.id, m2, 'auction', 25, 9800, null, 'Đấu giá sáng');

  l := fn_create_lot(d2, w1, 'Choshi Port', 'Cá cam', 'kg', 120, null);
  l := fn_create_lot(d2, w2, 'Hachinohe', 'Sò điệp', 'thùng', 60, null);
end $$;
