alter table public.app_accounts add column if not exists disabled_at timestamptz;

create table if not exists public.account_notification_preferences (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  email_notifications boolean not null default true,
  in_app_notifications boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','approved','rejected','cancelled')),
  requested_at timestamptz not null default now(),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  review_note text
);
create unique index if not exists account_deletion_requests_one_pending
  on public.account_deletion_requests(profile_id) where status='pending';
create index if not exists account_deletion_requests_review_queue
  on public.account_deletion_requests(status,requested_at desc);

alter table public.account_notification_preferences enable row level security;
alter table public.account_deletion_requests enable row level security;
revoke all on public.account_notification_preferences, public.account_deletion_requests from public, anon, authenticated;
grant all on public.account_notification_preferences, public.account_deletion_requests to service_role;

