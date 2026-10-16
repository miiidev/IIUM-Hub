-- Buyer file uploads for custom product fields (field type `file`).
--
-- Design notes (see chat, Oct 2026):
-- - SELECT applies to `anon, authenticated` — scoping public reads to `anon` alone breaks
--   logged-in buyers/sellers (same bug class as 0002).
-- - INSERT allows `anon` because buyers check out without login; bounded by the bucket's
--   5MB `file_size_limit` + MIME allowlist below (bucket-level = real enforcement).
-- - No UPDATE/DELETE policies for anon: uploaded files cannot be overwritten or wiped by
--   strangers. Accepted debt: no delete for sellers/buyers, no orphan cleanup.
-- - Practical anti-listing protection is the unguessable path
--   `<shop_id>/<uuid>-<name>` written by the client.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'buyer-uploads',
  'buyer-uploads',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public read buyer uploads" on storage.objects;
create policy "public read buyer uploads"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'buyer-uploads');

drop policy if exists "buyers upload files" on storage.objects;
create policy "buyers upload files"
on storage.objects for insert
to anon, authenticated
with check (bucket_id = 'buyer-uploads');
