-- shops.seller_email: the owning seller's @live.iium.edu.my address, exposed
-- publicly so buyers can verify a real student runs the shop.
-- Idempotent: mirrors 0014. Safe to re-run. Backfills from auth.users.

alter table public.shops add column if not exists seller_email text;

update public.shops s
set seller_email = u.email
from (select id, email from auth.users) u
where s.owner_id = u.id
  and (s.seller_email is null or s.seller_email <> u.email);
