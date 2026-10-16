-- Product A prototype: business rules as transactional functions, called by the API routes via rpc().
-- Errors are raised in Vietnamese so the API can show them as-is.

create or replace function fn_assert_day_open(p_day date) returns void language plpgsql as $$
begin
  if not exists (select 1 from business_days where day = p_day) then
    raise exception 'Ngày nghiệp vụ % chưa được mở', p_day;
  end if;
  if exists (select 1 from business_days where day = p_day and status = 'locked') then
    raise exception 'Ngày nghiệp vụ % đã khóa sổ, không sửa trực tiếp được (hãy tạo yêu cầu điều chỉnh)', p_day;
  end if;
end $$;

-- Reason the participant cannot trade on p_day, or null when valid.
create or replace function fn_participant_block_reason(p_id bigint, p_day date) returns text language sql stable as $$
  select case
    when p.id is null then 'Không tìm thấy người tham gia'
    when p.status = 'suspended' then p.name || ' đang bị tạm dừng tư cách'
    when p.status = 'under_review' then p.name || ' đang chờ tái thẩm định'
    when p.status = 'expired' or p.valid_to < p_day then p.name || ' đã hết hiệu lực từ ' || to_char(p.valid_to, 'DD/MM/YYYY')
    when p.valid_from > p_day then p.name || ' chưa tới ngày bắt đầu hiệu lực'
  end
  from (select 1) x left join participants p on p.id = p_id
$$;

create or replace function fn_create_lot(p_day date, p_seller bigint, p_shipper text, p_item text, p_unit text,
                                         p_qty numeric, p_actor uuid) returns lots language plpgsql as $$
declare v_reason text; v_seq int; v_lot lots;
begin
  perform fn_assert_day_open(p_day);
  if (select kind from participants where id = p_seller) is distinct from 'wholesaler' then
    raise exception 'Bên bán của lô phải là nhà phân phối lớn';
  end if;
  v_reason := fn_participant_block_reason(p_seller, p_day);
  if v_reason is not null then raise exception '%', v_reason; end if;
  perform pg_advisory_xact_lock(hashtext('lot' || p_day));
  select count(*) + 1 into v_seq from lots where business_day = p_day;
  insert into lots (code, business_day, seller_id, shipper, item, unit, initial_qty, available_qty, created_by)
  values ('L' || to_char(p_day, 'YYMMDD') || '-' || lpad(v_seq::text, 3, '0'), p_day, p_seller, p_shipper, p_item,
          p_unit, p_qty, p_qty, p_actor)
  returning * into v_lot;
  return v_lot;
end $$;

create or replace function fn_confirm_trade(p_lot bigint, p_buyer bigint, p_kind text, p_qty numeric, p_price numeric,
                                            p_actor uuid, p_note text default null) returns trades language plpgsql as $$
declare v_lot lots; v_reason text; v_seq int; v_trade trades;
begin
  select * into v_lot from lots where id = p_lot for update;
  if v_lot.id is null then raise exception 'Không tìm thấy lô'; end if;
  perform fn_assert_day_open(v_lot.business_day);
  if p_qty is null or p_qty <= 0 then raise exception 'Số lượng phải lớn hơn 0'; end if;
  if p_price is null or p_price < 0 then raise exception 'Đơn giá không hợp lệ'; end if;
  if (select kind from participants where id = p_buyer) = 'wholesaler' then
    raise exception 'Người mua không thể là nhà phân phối lớn';
  end if;
  v_reason := fn_participant_block_reason(p_buyer, v_lot.business_day);
  if v_reason is not null then raise exception 'Từ chối chốt: %', v_reason; end if;
  if p_qty > v_lot.available_qty then
    raise exception 'Từ chối chốt: lô % chỉ còn % %, không đủ %', v_lot.code, v_lot.available_qty, v_lot.unit, p_qty;
  end if;
  update lots set available_qty = available_qty - p_qty,
                  status = case when available_qty - p_qty = 0 then 'sold_out' else 'on_sale' end
  where id = p_lot;
  perform pg_advisory_xact_lock(hashtext('trade' || v_lot.business_day));
  select count(*) + 1 into v_seq from trades where business_day = v_lot.business_day;
  insert into trades (code, business_day, lot_id, seller_id, buyer_id, kind, qty, unit_price, confirmed_by, note)
  values ('T' || to_char(v_lot.business_day, 'YYMMDD') || '-' || lpad(v_seq::text, 4, '0'), v_lot.business_day,
          p_lot, v_lot.seller_id, p_buyer, p_kind, p_qty, p_price, p_actor, p_note)
  returning * into v_trade;
  return v_trade;
end $$;

create or replace function fn_cancel_trade(p_trade bigint, p_actor uuid, p_reason text) returns trades language plpgsql as $$
declare v_trade trades;
begin
  select * into v_trade from trades where id = p_trade for update;
  if v_trade.id is null then raise exception 'Không tìm thấy giao dịch'; end if;
  perform fn_assert_day_open(v_trade.business_day);
  if v_trade.status <> 'confirmed' or v_trade.entry_type <> 'original' then
    raise exception 'Chỉ hủy được giao dịch gốc đang ở trạng thái đã chốt';
  end if;
  if exists (select 1 from deliveries where trade_id = p_trade) then
    raise exception 'Giao dịch đã có ghi nhận giao hàng, không hủy được';
  end if;
  if coalesce(trim(p_reason), '') = '' then raise exception 'Phải nhập lý do hủy'; end if;
  update lots set available_qty = available_qty + v_trade.qty,
                  status = case when status = 'sold_out' then 'on_sale' else status end
  where id = v_trade.lot_id;
  update trades set status = 'cancelled', note = coalesce(note || ' / ', '') || 'Hủy: ' || p_reason
  where id = p_trade returning * into v_trade;
  return v_trade;
end $$;

create or replace function fn_record_delivery(p_trade bigint, p_qty numeric, p_kind text, p_exception text,
                                              p_note text, p_actor uuid) returns deliveries language plpgsql as $$
declare v_trade trades; v_done numeric; v_reason text; v_row deliveries;
begin
  select * into v_trade from trades where id = p_trade for update;
  if v_trade.id is null then raise exception 'Không tìm thấy giao dịch'; end if;
  if v_trade.status <> 'confirmed' or v_trade.qty < 0 then raise exception 'Giao dịch này không còn hiệu lực để giao'; end if;
  v_reason := fn_participant_block_reason(v_trade.buyer_id, current_date);
  if v_reason is not null then raise exception 'Chặn giao hàng: %', v_reason; end if;
  select coalesce(sum(qty), 0) into v_done from deliveries where trade_id = p_trade and kind = 'delivery';
  if p_kind = 'delivery' and p_qty > v_trade.qty - v_done then
    raise exception 'Chỉ còn % cần giao; giao vượt phải ghi là ngoại lệ "giao thừa"', v_trade.qty - v_done;
  end if;
  insert into deliveries (trade_id, seq, qty, kind, exception_type, note, recorded_by)
  values (p_trade, (select coalesce(max(seq), 0) + 1 from deliveries where trade_id = p_trade), p_qty, p_kind,
          case when p_kind = 'exception' then p_exception end, p_note, p_actor)
  returning * into v_row;
  return v_row;
end $$;

create or replace function fn_lock_day(p_day date, p_actor uuid) returns business_days language plpgsql as $$
declare v_row business_days;
begin
  perform fn_assert_day_open(p_day);
  update business_days set status = 'locked', locked_by = p_actor, locked_at = now() where day = p_day
  returning * into v_row;
  return v_row;
end $$;

create or replace function fn_decide_correction(p_id bigint, p_approve boolean, p_note text, p_actor uuid)
returns corrections language plpgsql as $$
declare v_c corrections; v_t trades; v_post date; v_delta numeric;
begin
  select * into v_c from corrections where id = p_id for update;
  if v_c.id is null then raise exception 'Không tìm thấy yêu cầu điều chỉnh'; end if;
  if v_c.status <> 'pending' then raise exception 'Yêu cầu này đã được xử lý'; end if;
  if v_c.requested_by = p_actor then raise exception 'Người soạn không được tự duyệt yêu cầu của mình'; end if;
  if p_approve then
    select * into v_t from trades where id = v_c.trade_id for update;
    if v_t.status <> 'confirmed' then raise exception 'Giao dịch gốc không còn ở trạng thái đã chốt'; end if;
    select max(day) into v_post from business_days where status = 'open';
    if v_post is null then raise exception 'Không có ngày nghiệp vụ đang mở để ghi bút toán điều chỉnh'; end if;
    v_delta := v_c.new_qty - v_t.qty;
    if v_delta > (select available_qty from lots where id = v_t.lot_id) then
      raise exception 'Lô không đủ hàng để tăng số lượng thêm %', v_delta;
    end if;
    update lots set available_qty = available_qty - v_delta where id = v_t.lot_id;
    update trades set status = 'reversed' where id = v_t.id;
    insert into trades (code, business_day, lot_id, seller_id, buyer_id, kind, entry_type, qty, unit_price, reverses_id, confirmed_by, note)
    values (v_t.code || '-R', v_post, v_t.lot_id, v_t.seller_id, v_t.buyer_id, v_t.kind, 'reversal', -v_t.qty,
            v_t.unit_price, v_t.id, p_actor, 'Bút toán đảo của ' || v_t.code),
           (v_t.code || '-A', v_post, v_t.lot_id, v_t.seller_id, v_t.buyer_id, v_t.kind, 'adjusted', v_c.new_qty,
            v_c.new_unit_price, v_t.id, p_actor, 'Điều chỉnh của ' || v_t.code || ': ' || v_c.reason);
  end if;
  update corrections set status = case when p_approve then 'approved' else 'rejected' end,
                         decided_by = p_actor, decided_at = now(), decision_note = p_note
  where id = p_id returning * into v_c;
  return v_c;
end $$;

-- Supabase lets anon / authenticated call public functions through the REST API by default.
-- Only the server (service role) may run these, after the API route has checked the user's permission.
do $$
declare f record;
begin
  for f in select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname like 'fn\_%' loop
    execute format('revoke execute on function %s from public', f.sig);
    if exists (select 1 from pg_roles where rolname = 'anon') then
      execute format('revoke execute on function %s from anon, authenticated', f.sig);
      execute format('grant execute on function %s to service_role', f.sig);
    end if;
  end loop;
end $$;
