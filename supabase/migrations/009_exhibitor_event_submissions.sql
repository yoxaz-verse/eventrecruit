create table public.exhibitor_event_submissions (
  id uuid primary key default gen_random_uuid(),
  exhibitor_id uuid not null references public.exhibitors(id) on delete cascade,
  title text not null check (length(trim(title)) between 1 and 160),
  description text not null default '',
  venue text not null check (length(trim(venue)) between 1 and 200),
  city text not null check (length(trim(city)) between 1 and 120),
  starts_at date not null,
  ends_at date not null check (ends_at >= starts_at),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index exhibitor_event_submissions_status on public.exhibitor_event_submissions(status, ends_at);
create index exhibitor_event_submissions_owner on public.exhibitor_event_submissions(exhibitor_id);
alter table public.exhibitor_event_submissions enable row level security;
create policy "approved events or owner or admin read" on public.exhibitor_event_submissions for select
 using (status = 'approved' or public.is_admin() or exhibitor_id in (select id from public.exhibitors where owner_id = auth.uid()));
create policy "exhibitor submits own event" on public.exhibitor_event_submissions for insert
 with check (status = 'pending' and reviewed_by is null and reviewed_at is null and exhibitor_id in (select id from public.exhibitors where owner_id = auth.uid()));
create policy "admin reviews event" on public.exhibitor_event_submissions for update
 using (public.is_admin()) with check (public.is_admin());
grant select, insert, update on public.exhibitor_event_submissions to authenticated;
alter table public.events add column organizer_event_id uuid references public.organizer_events(id),
  add column exhibitor_event_submission_id uuid references public.exhibitor_event_submissions(id);
alter table public.events add constraint one_catalog_event check (organizer_event_id is null or exhibitor_event_submission_id is null);
create unique index events_exhibitor_organizer_catalog on public.events(exhibitor_id, organizer_event_id)
  where exhibitor_id is not null and organizer_event_id is not null;
create unique index events_exhibitor_submitted_catalog on public.events(exhibitor_id, exhibitor_event_submission_id)
  where exhibitor_id is not null and exhibitor_event_submission_id is not null;
