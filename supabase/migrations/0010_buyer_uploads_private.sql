-- Make buyer-uploads private. Seller reads go through signed URLs.
--
-- HOW TO APPLY (do NOT auto-apply): Supabase Dashboard -> SQL Editor, paste this
-- file, Run. Then verify: as a logged-out visitor the old public file URLs must
-- 404, and the seller order page "View file" links must still open.
--
-- Effect on old data: orders whose file value is a full public http URL keep
-- rendering the file NAME everywhere; the link keeps working only until this runs.
-- After this runs, old public links 404 — the app shows the name without assuming
-- the file is reachable.

update storage.buckets set public = false where id = 'buyer-uploads';

drop policy if exists "public read buyer uploads" on storage.objects;

-- Anon INSERT ("buyers upload files") is intentionally kept: buyers check out
-- without login. 5MB + MIME limits + shopId-prefixed paths still bound it.

drop policy if exists "owners read own shop uploads" on storage.objects;
create policy "owners read own shop uploads"
on storage.objects for select
to authenticated
using (
  bucket_id = 'buyer-uploads'
  and exists (
    select 1 from public.shops s
    where s.id::text = (storage.foldername(name))[1]
    and s.owner_id = auth.uid()
  )
);

-- NOTE: storage.foldername() was verified to exist on this project. If a future
-- Postgres version drops it, the fallback is split_part(name, '/', 1).
