-- Indexes used by the server-only admin lists and attention queues.
create index if not exists profiles_admin_status_created on public.profiles(verification_status,created_at desc);
create index if not exists organizer_events_admin_status_created on public.organizer_events(status,created_at desc);
create index if not exists exhibitor_event_submissions_admin_status_created on public.exhibitor_event_submissions(status,created_at desc);
create index if not exists staffing_roles_admin_status_created on public.staffing_roles(status,created_at desc);
create index if not exists applications_admin_status_created on public.applications(status,created_at desc);
create index if not exists applications_admin_cancellation on public.applications(cancellation_requested_at desc) where cancellation_requested_at is not null;
create index if not exists placements_admin_status_created on public.placements(status,created_at desc);
create index if not exists event_bookings_admin_created on public.event_bookings(created_at desc);
create index if not exists event_space_inquiries_admin_status_created on public.event_space_inquiries(status,created_at desc);
create index if not exists placement_reviews_admin_visibility_created on public.placement_reviews(visibility_status,created_at desc);
create index if not exists commission_records_admin_status_created on public.commission_records(status,created_at desc);
create index if not exists talent_recommendations_admin_status_created on public.talent_recommendations(status,created_at desc);

do $$ begin
  if to_regclass('public.agency_exhibitor_relationships') is not null then
    execute 'create index if not exists agency_relationships_admin_status_created on public.agency_exhibitor_relationships(status,created_at desc)';
  end if;
end $$;
