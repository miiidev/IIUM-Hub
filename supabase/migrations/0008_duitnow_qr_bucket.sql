-- Idempotent: public duitnow-qr bucket for seller QR uploads.
-- Run in Dashboard -> SQL Editor. Safe to re-run.

insert into storage.buckets (id, name, public)
values ('duitnow-qr', 'duitnow-qr', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "sellers upload own qr" on storage.objects;
create policy "sellers upload own qr"
on storage.objects for insert
to authenticated
with check (bucket_id = 'duitnow-qr');

drop policy if exists "public read qr" on storage.objects;
create policy "public read qr"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'duitnow-qr');
