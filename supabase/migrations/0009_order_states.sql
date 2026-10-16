alter table public.orders drop constraint if exists orders_status_check;

alter table public.orders add column if not exists cancel_reason text;

update public.orders set status = 'pending_verification' where status = 'pending';

alter table public.orders add constraint orders_status_check
  check (status in ('pending_verification', 'confirmed', 'ready', 'completed', 'cancelled', 'rejected'));

drop policy if exists "anon update orders status" on public.orders;
