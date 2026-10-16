-- Add template column to forms table for the template-based form pivot.
-- Existing rows get NULL (= legacy builder forms, still readable in Submissions).
-- New template forms set this to one of the four kinds.

alter table public.forms
  add column template text
  check (template in ('printing', 'food', 'services', 'rentals'));

-- Index for seller list queries (where template is not null)
create index if not exists forms_template_idx on public.forms (template);