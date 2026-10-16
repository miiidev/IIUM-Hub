-- Order privacy: stop anonymous bulk reads of orders.
--
-- APPLY ORDER (critical): the matching frontend (client-generated order ids,
-- insert-without-select, tracker via get_order) must be DEPLOYED AND LIVE first.
-- 0010_buyer_uploads_private.sql must already be applied. Then paste this file
-- into Dashboard -> SQL Editor and Run. Verify with the checklist at the bottom.
--
-- 1. Logged-out GET /rest/v1/orders?select=* returns no rows.
-- 2. A /order/<id>/track link still loads and updates.
-- 3. Checkout still creates orders.
-- 4. Seller dashboard + /seller/orders/:id still work (owner policies).
-- 5. Old public buyer-uploads file URLs now 404 (after 0010).

create or replace function public.get_order(p_id uuid)
returns setof public.orders
language sql
stable
security definer
set search_path = public
as $$
  select * from public.orders where id = p_id;
$$;

grant execute on function public.get_order(uuid) to anon, authenticated;

drop policy if exists "anon select orders" on public.orders;

drop policy if exists "anon insert orders" on public.orders;
create policy "anon insert pending orders"
on public.orders for insert
to anon, authenticated
with check (status = 'pending_verification');
