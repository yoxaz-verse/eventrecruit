alter table public.exhibitors
  add column if not exists description text,
  add column if not exists website text,
  add column if not exists address text,
  add column if not exists city text;

