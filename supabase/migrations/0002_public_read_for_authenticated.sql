-- Public browse + buyer flows must work for logged-in users too (role `authenticated`),
-- not just anonymous visitors. Policies scoped to `anon` stop applying the moment a user
-- signs in, which left logged-in sellers seeing ONLY their own shop/products, and unable
-- to insert or track orders.
--
-- Policy names below are historical (they still say "anon"); only the role list matters.

alter policy "anon select active shops"      on public.shops    to anon, authenticated;
alter policy "anon select available products" on public.products to anon, authenticated;
alter policy "anon insert orders"            on public.orders   to anon, authenticated;
alter policy "anon select orders"            on public.orders   to anon, authenticated;
alter policy "anon update orders status"     on public.orders   to anon, authenticated;
