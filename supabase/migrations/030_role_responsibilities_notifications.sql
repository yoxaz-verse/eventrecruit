create table if not exists public.platform_notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  category text not null check (category in ('account','verification','application','assignment','event','staffing','sponsorship','settlement','system')),
  title text not null check (char_length(title) between 1 and 160),
  body text not null check (char_length(body) between 1 and 1000),
  action_href text check (action_href is null or (action_href like '/%' and char_length(action_href) <= 500)),
  related_type text,
  related_id uuid,
  deduplication_key text,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint platform_notifications_dedup unique(profile_id, deduplication_key)
);

create index if not exists platform_notifications_inbox_idx
  on public.platform_notifications(profile_id, read_at, created_at desc);

create table if not exists public.workflow_activity (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  subject_type text not null check (char_length(subject_type) between 1 and 80),
  subject_id uuid not null,
  previous_status text,
  next_status text not null,
  reason text check (reason is null or char_length(reason) <= 1000),
  created_at timestamptz not null default now()
);

create index if not exists workflow_activity_subject_idx
  on public.workflow_activity(subject_type, subject_id, created_at desc);

alter table public.platform_notifications enable row level security;
alter table public.workflow_activity enable row level security;
revoke all on public.platform_notifications, public.workflow_activity from public, anon, authenticated;
grant select, insert, update, delete on public.platform_notifications, public.workflow_activity to service_role;

insert into public.platform_notifications(profile_id, category, title, body, action_href, deduplication_key)
select p.id, 'account', 'Welcome to your role workspace',
  'Review your role responsibilities and complete any required account steps.',
  '/dashboard/' || p.role,
  'responsibility-foundation-v1'
from public.profiles p
where p.role in ('admin','organizer','agency','sponsor_agency','exhibitor','talent')
on conflict(profile_id, deduplication_key) do nothing;
