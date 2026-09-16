-- R2 object keys only. Object bytes remain in the private Cloudflare bucket and
-- are served through authorization-aware application routes.
alter table public.agencies add column logo_path text;
alter table public.exhibitors add column logo_path text;
alter table public.organizer_events add column logo_path text;

alter table public.agencies add constraint agencies_logo_path_shape
  check (logo_path is null or logo_path ~ '^agencies/[0-9a-f-]{36}/');
alter table public.exhibitors add constraint exhibitors_logo_path_shape
  check (logo_path is null or logo_path ~ '^exhibitors/[0-9a-f-]{36}/');
alter table public.organizer_events add constraint organizer_events_logo_path_shape
  check (logo_path is null or logo_path ~ '^events/[0-9a-f-]{36}/');
