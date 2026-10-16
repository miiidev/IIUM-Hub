-- Idempotent: shops.banner_url + public shop-banners bucket for seller uploads.
-- Mirrors 0008_duitnow_qr_bucket.sql. Safe to re-run.

alter table public.shops add column if not exists banner_url text;

insert into storage.buckets (id, name, public)
values ('shop-banners', 'shop-banners', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "sellers upload own banner" on storage.objects;
create policy "sellers upload own banner"
on storage.objects for insert
to authenticated
with check (bucket_id = 'shop-banners');

drop policy if exists "public read banners" on storage.objects;
create policy "public read banners"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'shop-banners');
