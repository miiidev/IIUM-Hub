-- IIUM Hub initial schema (mirrors live Supabase project).
-- Apply via Supabase Dashboard → SQL Editor, or `supabase db push` if using the CLI.

create extension if not exists "pgcrypto";

-- ── Shops ────────────────────────────────────────────────────────────────
create table if not exists public.shops (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  whatsapp_number text not null,
  category text not null,
  mahalla text not null,
  is_active boolean not null default true,
  owner_id uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists shops_slug_idx on public.shops (slug);
create index if not exists shops_is_active_idx on public.shops (is_active);
create index if not exists shops_owner_idx on public.shops (owner_id);

-- ── Products ─────────────────────────────────────────────────────────────
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  title text not null,
  price numeric(10,2) not null,
  is_available boolean not null default true,
  custom_fields jsonb not null default '[]'::jsonb
);
create index if not exists products_shop_idx on public.products (shop_id);

-- ── Orders ───────────────────────────────────────────────────────────────
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  buyer_name text not null,
  location text not null,
  total_amount numeric(10,2) not null,
  payment_ref_id text not null,
  custom_data jsonb not null default '{}'::jsonb,
  items jsonb not null default '[]'::jsonb,
  status text not null default 'pending'
    check (status in ('pending','confirmed','rejected','completed')),
  created_at timestamptz not null default now()
);
create index if not exists orders_shop_idx on public.orders (shop_id);
create index if not exists orders_status_idx on public.orders (status);

-- ── Profiles (1 row per seller auth user) ────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  whatsapp_number text,
  created_at timestamptz not null default now()
);

-- ── RLS ──────────────────────────────────────────────────────────────────
alter table public.shops enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.profiles enable row level security;

-- Public storefront (buyers are anonymous)
drop policy if exists "anon select active shops" on public.shops;
create policy "anon select active shops" on public.shops
  for select to anon using (is_active = true);
drop policy if exists "anon select available products" on public.products;
create policy "anon select available products" on public.products
  for select to anon using (is_available = true);

-- Buyer checkout + tracking (honor system for hackathon — tighten post-demo)
drop policy if exists "anon insert orders" on public.orders;
create policy "anon insert orders" on public.orders
  for insert to anon with check (true);
drop policy if exists "anon select orders" on public.orders;
create policy "anon select orders" on public.orders
  for select to anon using (true);
drop policy if exists "anon update orders status" on public.orders;
create policy "anon update orders status" on public.orders
  for update to anon using (true) with check (true);

-- Sellers manage only their own shop
drop policy if exists "owners all own shop" on public.shops;
create policy "owners all own shop" on public.shops
  for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "owners all own products" on public.products;
create policy "owners all own products" on public.products
  for all to authenticated
  using (exists (select 1 from public.shops s where s.id = products.shop_id and s.owner_id = auth.uid()))
  with check (exists (select 1 from public.shops s where s.id = products.shop_id and s.owner_id = auth.uid()));

drop policy if exists "owners select own orders" on public.orders;
create policy "owners select own orders" on public.orders
  for select to authenticated
  using (exists (select 1 from public.shops s where s.id = orders.shop_id and s.owner_id = auth.uid()));
drop policy if exists "owners update own orders" on public.orders;
create policy "owners update own orders" on public.orders
  for update to authenticated
  using (exists (select 1 from public.shops s where s.id = orders.shop_id and s.owner_id = auth.uid()))
  with check (exists (select 1 from public.shops s where s.id = orders.shop_id and s.owner_id = auth.uid()));

-- Profiles: users touch only their own row
drop policy if exists "users read own profile" on public.profiles;
create policy "users read own profile" on public.profiles
  for select to authenticated using (auth.uid() = id);
drop policy if exists "users insert own profile" on public.profiles;
create policy "users insert own profile" on public.profiles
  for insert to authenticated with check (auth.uid() = id);
drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- ── Realtime ─────────────────────────────────────────────────────────────
alter publication supabase_realtime add table public.orders;
