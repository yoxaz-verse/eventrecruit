-- Safe for databases that applied an earlier version of migration 009.
-- App-owned sessions authorize every read and write through server actions.
drop policy if exists "approved events or owner or admin read" on public.exhibitor_event_submissions;
drop policy if exists "exhibitor submits own event" on public.exhibitor_event_submissions;
drop policy if exists "admin reviews event" on public.exhibitor_event_submissions;
revoke all on public.exhibitor_event_submissions from public, anon, authenticated;
grant select, insert, update on public.exhibitor_event_submissions to service_role;
