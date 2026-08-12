-- =============================================================================
-- vitePOS — Schéma Neon / PostgreSQL (cloud sync / vue boss)
-- Compatible Neon SQL Editor ou npm run db:migrate
-- Auth Neon : colonne users.auth_external_id (pas de FK auth.users)
--
-- Aligné sur src/db/types.ts (Dexie offline-first).
-- Timestamps = epoch ms (bigint) comme côté app.
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. Boutiques
-- -----------------------------------------------------------------------------
create table if not exists public.boutiques (
  id text primary key,
  name text not null,
  currency text not null default 'CDF',
  invite_code text not null unique,
  usd_rate_cdf numeric,
  usd_rate_updated_at bigint,
  paper_width_mm smallint default 58 check (paper_width_mm in (58, 80)),
  auto_print_ticket boolean not null default false,
  created_at bigint not null,
  updated_at bigint not null
);

create index if not exists idx_boutiques_invite on public.boutiques (invite_code);

-- -----------------------------------------------------------------------------
-- 2. Utilisateurs (équipe)
-- -----------------------------------------------------------------------------
create table if not exists public.users (
  id text primary key,
  boutique_id text not null references public.boutiques (id) on delete cascade,
  name text not null,
  role text not null check (role in ('proprietaire', 'gerant', 'vendeur')),
  pin_hash text not null,
  active boolean not null default true,
  phone text,
  avatar_url text,
  permissions jsonb default '{}'::jsonb,
  -- Email / id Auth externe optionnel (Neon Auth, Clerk, etc.)
  auth_external_id text unique,
  created_at bigint not null,
  updated_at bigint not null
);

create index if not exists idx_users_boutique on public.users (boutique_id);
create index if not exists idx_users_auth_ext on public.users (auth_external_id);

-- -----------------------------------------------------------------------------
-- 3. Produits
-- -----------------------------------------------------------------------------
create table if not exists public.products (
  id text primary key,
  boutique_id text not null references public.boutiques (id) on delete cascade,
  name text not null,
  category text not null default 'Divers',
  sell_price numeric not null default 0,
  buy_price numeric,
  unit text not null default 'u',
  stock numeric not null default 0,
  alert_threshold numeric not null default 5,
  barcode text,
  favorite boolean not null default false,
  archived boolean not null default false,
  created_at bigint not null,
  updated_at bigint not null
);

create index if not exists idx_products_boutique on public.products (boutique_id);
create index if not exists idx_products_barcode on public.products (boutique_id, barcode)
  where barcode is not null and archived = false;
create index if not exists idx_products_stock_alert on public.products (boutique_id)
  where archived = false and stock <= alert_threshold;

-- -----------------------------------------------------------------------------
-- 4. Mouvements de stock
-- -----------------------------------------------------------------------------
create table if not exists public.stock_movements (
  id text primary key,
  boutique_id text not null references public.boutiques (id) on delete cascade,
  product_id text not null references public.products (id) on delete cascade,
  type text not null check (
    type in ('vente', 'reappro', 'casse', 'don', 'correction', 'inventaire', 'annulation')
  ),
  quantity numeric not null,
  reason text,
  user_id text references public.users (id) on delete set null,
  ref_id text,
  created_at bigint not null
);

create index if not exists idx_stock_movements_boutique on public.stock_movements (boutique_id, created_at desc);
create index if not exists idx_stock_movements_product on public.stock_movements (product_id, created_at desc);

-- -----------------------------------------------------------------------------
-- 5. Clients
-- -----------------------------------------------------------------------------
create table if not exists public.clients (
  id text primary key,
  boutique_id text not null references public.boutiques (id) on delete cascade,
  name text not null,
  phone text,
  notes text,
  purchase_count integer not null default 0,
  total_spent numeric not null default 0,
  created_at bigint not null,
  updated_at bigint not null
);

create index if not exists idx_clients_boutique on public.clients (boutique_id);

-- -----------------------------------------------------------------------------
-- 6. Sessions de caisse
-- -----------------------------------------------------------------------------
create table if not exists public.cash_sessions (
  id text primary key,
  boutique_id text not null references public.boutiques (id) on delete cascade,
  opened_by text references public.users (id) on delete set null,
  closed_by text references public.users (id) on delete set null,
  status text not null check (status in ('ouverte', 'cloturee')),
  opening_float numeric not null default 0,
  opening_float_usd numeric default 0,
  closing_cash_counted numeric,
  closing_cash_counted_usd numeric,
  expected_cash numeric,
  expected_cash_usd numeric,
  expected_mobile_money numeric,
  ticket_count integer,
  cash_variance numeric,
  cash_variance_usd numeric,
  notes text,
  opened_at bigint not null,
  closed_at bigint,
  updated_at bigint not null
);

create index if not exists idx_cash_sessions_boutique on public.cash_sessions (boutique_id, opened_at desc);
create index if not exists idx_cash_sessions_open on public.cash_sessions (boutique_id)
  where status = 'ouverte';

-- -----------------------------------------------------------------------------
-- 7. Ventes
-- -----------------------------------------------------------------------------
create table if not exists public.sales (
  id text primary key,
  boutique_id text not null references public.boutiques (id) on delete cascade,
  cash_session_id text references public.cash_sessions (id) on delete set null,
  client_id text references public.clients (id) on delete set null,
  user_id text references public.users (id) on delete set null,
  subtotal numeric not null default 0,
  discount numeric not null default 0,
  discount_percent numeric,
  total numeric not null default 0,
  pay_currency text check (pay_currency in ('CDF', 'USD')),
  exchange_rate numeric,
  total_in_pay_currency numeric,
  received_in_pay_currency numeric,
  change_in_pay_currency numeric,
  payment_method text not null check (payment_method in ('especes', 'mobile_money', 'mixte')),
  lines jsonb not null default '[]'::jsonb,
  payments jsonb not null default '[]'::jsonb,
  cash_received numeric,
  change_given numeric,
  status text not null check (status in ('validee', 'annulee')),
  cancel_reason text,
  created_at bigint not null,
  updated_at bigint not null
);

create index if not exists idx_sales_boutique_date on public.sales (boutique_id, created_at desc);
create index if not exists idx_sales_status on public.sales (boutique_id, status);
create index if not exists idx_sales_session on public.sales (cash_session_id);

create table if not exists public.sale_lines (
  id text primary key default gen_random_uuid()::text,
  sale_id text not null references public.sales (id) on delete cascade,
  boutique_id text not null references public.boutiques (id) on delete cascade,
  product_id text,
  product_name text not null,
  unit_price numeric not null,
  quantity numeric not null,
  line_discount numeric not null default 0,
  line_total numeric not null,
  created_at bigint not null
);

create index if not exists idx_sale_lines_boutique on public.sale_lines (boutique_id, created_at desc);
create index if not exists idx_sale_lines_product on public.sale_lines (boutique_id, product_id);

-- -----------------------------------------------------------------------------
-- 8. Inventaire
-- -----------------------------------------------------------------------------
create table if not exists public.inventory_sessions (
  id text primary key,
  boutique_id text not null references public.boutiques (id) on delete cascade,
  user_id text references public.users (id) on delete set null,
  status text not null check (status in ('en_cours', 'valide', 'annule')),
  created_at bigint not null,
  validated_at bigint,
  validated_by text references public.users (id) on delete set null,
  updated_at bigint not null
);

create index if not exists idx_inventory_sessions_boutique on public.inventory_sessions (boutique_id, created_at desc);

create table if not exists public.inventory_lines (
  id text primary key,
  session_id text not null references public.inventory_sessions (id) on delete cascade,
  boutique_id text not null references public.boutiques (id) on delete cascade,
  product_id text not null references public.products (id) on delete cascade,
  theoretical_qty numeric not null default 0,
  counted_qty numeric,
  counted boolean not null default false,
  updated_at bigint not null
);

create index if not exists idx_inventory_lines_session on public.inventory_lines (session_id);

-- -----------------------------------------------------------------------------
-- 9. Dépenses
-- -----------------------------------------------------------------------------
create table if not exists public.expenses (
  id text primary key,
  boutique_id text not null references public.boutiques (id) on delete cascade,
  user_id text references public.users (id) on delete set null,
  amount numeric not null check (amount > 0),
  currency text not null check (currency in ('CDF', 'USD')),
  category text not null check (
    category in ('transport', 'fournitures', 'loyer', 'communication', 'autres')
  ),
  description text,
  cash_session_id text references public.cash_sessions (id) on delete set null,
  created_at bigint not null,
  updated_at bigint not null
);

create index if not exists idx_expenses_boutique on public.expenses (boutique_id, created_at desc);
create index if not exists idx_expenses_category on public.expenses (boutique_id, category);

-- -----------------------------------------------------------------------------
-- 10. Sync meta
-- -----------------------------------------------------------------------------
create table if not exists public.sync_revisions (
  boutique_id text primary key references public.boutiques (id) on delete cascade,
  revision bigint not null default 0,
  updated_at bigint not null
);

-- =============================================================================
-- Vues boss
-- =============================================================================

create or replace view public.v_daily_sales as
select
  s.boutique_id,
  (to_timestamp(s.created_at / 1000.0) at time zone 'Africa/Kinshasa')::date as jour,
  count(*) filter (where s.status = 'validee') as tickets,
  coalesce(sum(s.total) filter (where s.status = 'validee'), 0) as ca_fc
from public.sales s
group by 1, 2;

create or replace view public.v_daily_expenses as
select
  e.boutique_id,
  (to_timestamp(e.created_at / 1000.0) at time zone 'Africa/Kinshasa')::date as jour,
  e.currency,
  e.category,
  sum(e.amount) as total
from public.expenses e
group by 1, 2, 3, 4;

create or replace view public.v_top_products as
select
  boutique_id,
  product_id,
  product_name,
  sum(quantity) as qty_vendue,
  sum(line_total) as ca
from public.sale_lines
group by 1, 2, 3;

create or replace view public.v_low_stock as
select *
from public.products
where archived = false
  and stock <= alert_threshold;

-- =============================================================================
-- Trigger : peupler sale_lines depuis sales.lines (jsonb)
-- =============================================================================
create or replace function public.sync_sale_lines_from_json()
returns trigger
language plpgsql
as $$
begin
  delete from public.sale_lines where sale_id = new.id;

  insert into public.sale_lines (
    sale_id, boutique_id, product_id, product_name,
    unit_price, quantity, line_discount, line_total, created_at
  )
  select
    new.id,
    new.boutique_id,
    nullif(elem->>'productId', ''),
    coalesce(elem->>'productName', 'Produit'),
    coalesce((elem->>'unitPrice')::numeric, 0),
    coalesce((elem->>'quantity')::numeric, 0),
    coalesce((elem->>'lineDiscount')::numeric, 0),
    coalesce((elem->>'lineTotal')::numeric, 0),
    new.created_at
  from jsonb_array_elements(coalesce(new.lines, '[]'::jsonb)) as elem;

  return new;
end;
$$;

drop trigger if exists trg_sales_sync_lines on public.sales;
create trigger trg_sales_sync_lines
after insert or update of lines on public.sales
for each row
execute function public.sync_sale_lines_from_json();

-- =============================================================================
-- Smoke test (optionnel)
-- select 'ok' as schema_ready, now() as at;
-- =============================================================================
