-- Idempotent: products.image_url + shops.description + public product-images bucket.
-- Mirrors 0012_shop_banner.sql. Safe to re-run.

alter table public.products add column if not exists image_url text;
alter table public.shops add column if not exists description text;

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "sellers upload product images" on storage.objects;
create policy "sellers upload product images"
on storage.objects for insert
to authenticated
with check (bucket_id = 'product-images');

drop policy if exists "public read product images" on storage.objects;
create policy "public read product images"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'product-images');
