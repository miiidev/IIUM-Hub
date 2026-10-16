-- Custom Forms: standalone versioned forms independent of products.
--
-- forms         → mutable metadata + draft state
-- form_versions → immutable snapshots (ROW created on publish)
-- form_submissions → buyer answers linked to a version
--
-- RLS: sellers own via shops.owner_id; public selects published forms;
--       anon/authenticated INSERT on submissions (honor-system, like orders).

-- ── Forms ──────────────────────────────────────────────────────────────
create table if not exists public.forms (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  title text not null,
  description text not null default '',
  status text not null default 'draft'
    check (status in ('draft','published','archived')),
  product_id uuid references public.products(id) on delete set null,
  fields_json jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists forms_shop_idx on public.forms (shop_id);
create index if not exists forms_status_idx on public.forms (status);
create index if not exists forms_product_idx on public.forms (product_id);

-- ── Form Versions (immutable — every publish inserts a new row) ────────
create table if not exists public.form_versions (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.forms(id) on delete cascade,
  version_number integer not null,
  snapshot jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists form_versions_form_idx on public.form_versions (form_id);
-- Enforce immutability: no updates allowed on form_versions
create or replace function block_form_versions_update()
returns trigger language plpgsql as $$
begin
  raise exception 'form_versions is immutable — updates are forbidden';
end;
$$;
drop trigger if exists trg_form_versions_immutable on public.form_versions;
create trigger trg_form_versions_immutable
  before update on public.form_versions
  for each row execute function block_form_versions_update();

-- ── Form Submissions ───────────────────────────────────────────────────
create table if not exists public.form_submissions (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.forms(id) on delete cascade,
  version_id uuid not null references public.form_versions(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists form_submissions_form_idx on public.form_submissions (form_id);
create index if not exists form_submissions_version_idx on public.form_submissions (version_id);
create index if not exists form_submissions_order_idx on public.form_submissions (order_id);
create index if not exists form_submissions_created_idx on public.form_submissions (created_at desc);

-- ── RLS ────────────────────────────────────────────────────────────────
alter table public.forms enable row level security;
alter table public.form_versions enable row level security;
alter table public.form_submissions enable row level security;

-- Sellers: full access to own forms (via shops.owner_id)
drop policy if exists "owners all own forms" on public.forms;
create policy "owners all own forms" on public.forms
  for all to authenticated
  using (exists (select 1 from public.shops s where s.id = forms.shop_id and s.owner_id = auth.uid()))
  with check (exists (select 1 from public.shops s where s.id = forms.shop_id and s.owner_id = auth.uid()));

-- Public: select published forms only
drop policy if exists "public select published forms" on public.forms;
create policy "public select published forms" on public.forms
  for select to anon, authenticated
  using (status = 'published');

-- Form versions: sellers see all own, public sees published forms' versions
drop policy if exists "owners all own form_versions" on public.form_versions;
create policy "owners all own form_versions" on public.form_versions
  for select to authenticated
  using (exists (select 1 from public.forms f
    join public.shops s on s.id = f.shop_id
    where f.id = form_versions.form_id and s.owner_id = auth.uid()));

drop policy if exists "public select published form_versions" on public.form_versions;
create policy "public select published form_versions" on public.form_versions
  for select to anon, authenticated
  using (exists (select 1 from public.forms f
    where f.id = form_versions.form_id and f.status = 'published'));

-- Form submissions: sellers select own, any authenticated/anon can insert
drop policy if exists "owners select own form_submissions" on public.form_submissions;
create policy "owners select own form_submissions" on public.form_submissions
  for select to authenticated
  using (exists (select 1 from public.forms f
    join public.shops s on s.id = f.shop_id
    where f.id = form_submissions.form_id and s.owner_id = auth.uid()));

drop policy if exists "public insert form_submissions" on public.form_submissions;
create policy "public insert form_submissions" on public.form_submissions
  for insert to anon, authenticated
  with check (true);

-- ── Realtime ───────────────────────────────────────────────────────────
alter publication supabase_realtime add table public.form_submissions;