-- Collapse `rejected` into `cancelled`: they mean the same thing to the buyer
-- ("won't proceed"), and having both only duplicated filters, badges and code.
-- Applied live. Safe to re-run.

alter table public.orders drop constraint if exists orders_status_check;

update public.orders
set status = 'cancelled',
    cancel_reason = coalesce(cancel_reason, 'Rejected at payment verification')
where status = 'rejected';

alter table public.orders add constraint orders_status_check
  check (status in ('pending_verification', 'confirmed', 'ready', 'completed', 'cancelled'));
