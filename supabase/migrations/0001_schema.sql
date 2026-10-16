-- Product A prototype: tables. Run first in the Supabase SQL editor.
-- Every table has RLS enabled and no policies: only the server (secret / service-role key, used by the
-- Next.js API routes) can read or write. The browser never talks to Supabase directly.

create table if not exists roles (
  code text primary key,
  name text not null,
  sort int not null default 0
);

create table if not exists permissions (
  code text primary key,
  name text not null,
  grp text not null,
  sort int not null default 0
);

create table if not exists role_permissions (
  role text not null references roles(code) on delete cascade,
  permission text not null references permissions(code) on delete cascade,
  primary key (role, permission)
);

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  role text not null references roles(code),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists participants (
  id bigint generated always as identity primary key,
  code text not null unique,
  name text not null,
  kind text not null check (kind in ('wholesaler', 'middleman', 'buyer', 'retail_buyer')),
  basis text not null check (basis in ('registration', 'license', 'approval')),
  status text not null default 'active' check (status in ('active', 'suspended', 'expired', 'under_review')),
  valid_from date not null,
  valid_to date not null,
  phone text,
  note text,
  updated_at timestamptz not null default now(),
  check (valid_to >= valid_from)
);

create table if not exists business_days (
  day date primary key,
  status text not null default 'open' check (status in ('open', 'locked')),
  locked_by uuid,
  locked_at timestamptz
);

create table if not exists lots (
  id bigint generated always as identity primary key,
  code text not null unique,
  business_day date not null references business_days(day),
  seller_id bigint not null references participants(id),
  shipper text not null,
  item text not null,
  unit text not null default 'kg',
  initial_qty numeric(12, 2) not null check (initial_qty > 0),
  available_qty numeric(12, 2) not null check (available_qty >= 0),
  grade text,
  inspection_note text,
  inspected_by uuid,
  inspected_at timestamptz,
  status text not null default 'received' check (status in ('received', 'inspected', 'on_sale', 'sold_out')),
  created_by uuid,
  created_at timestamptz not null default now(),
  check (available_qty <= initial_qty)
);

create table if not exists trades (
  id bigint generated always as identity primary key,
  code text not null unique,
  business_day date not null references business_days(day),
  lot_id bigint not null references lots(id),
  seller_id bigint not null references participants(id),
  buyer_id bigint not null references participants(id),
  kind text not null check (kind in ('negotiated', 'auction')),
  entry_type text not null default 'original' check (entry_type in ('original', 'reversal', 'adjusted')),
  qty numeric(12, 2) not null check (qty <> 0),
  unit_price numeric(12, 0) not null check (unit_price >= 0),
  amount numeric(14, 0) generated always as (round(qty * unit_price)) stored,
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled', 'reversed')),
  reverses_id bigint references trades(id),
  confirmed_by uuid,
  confirmed_at timestamptz not null default now(),
  note text
);

create table if not exists deliveries (
  id bigint generated always as identity primary key,
  trade_id bigint not null references trades(id),
  seq int not null,
  qty numeric(12, 2) not null check (qty > 0),
  kind text not null check (kind in ('delivery', 'exception')),
  exception_type text check (exception_type in ('short', 'over', 'return', 'partial_cancel')),
  note text,
  recorded_by uuid,
  recorded_at timestamptz not null default now(),
  unique (trade_id, seq),
  check ((kind = 'exception') = (exception_type is not null))
);

create table if not exists corrections (
  id bigint generated always as identity primary key,
  trade_id bigint not null references trades(id),
  new_qty numeric(12, 2) not null check (new_qty > 0),
  new_unit_price numeric(12, 0) not null check (new_unit_price >= 0),
  reason text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  requested_by uuid not null,
  requested_at timestamptz not null default now(),
  decided_by uuid,
  decided_at timestamptz,
  decision_note text
);

create table if not exists audit_logs (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor uuid,
  actor_email text,
  action text not null,
  entity text not null,
  entity_id text,
  before jsonb,
  after jsonb,
  reason text
);

create index if not exists lots_day_idx on lots (business_day);
create index if not exists trades_day_idx on trades (business_day);
create index if not exists trades_lot_idx on trades (lot_id);
create index if not exists deliveries_trade_idx on deliveries (trade_id);
create index if not exists audit_at_idx on audit_logs (at desc);

do $$
declare t text;
begin
  foreach t in array array['roles', 'permissions', 'role_permissions', 'profiles', 'participants', 'business_days',
                           'lots', 'trades', 'deliveries', 'corrections', 'audit_logs'] loop
    execute format('alter table %I enable row level security', t);
  end loop;
end $$;
