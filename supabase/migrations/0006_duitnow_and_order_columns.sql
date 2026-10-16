alter table public.shops add column if not exists duitnow_qr_url text;
alter table public.shops add column if not exists duitnow_account text;
alter table public.orders add column if not exists items jsonb not null default '[]'::jsonb;
alter table public.orders add column if not exists custom_data jsonb not null default '{}'::jsonb;
