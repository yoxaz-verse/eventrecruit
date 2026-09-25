-- Supports the public directory's approved-participant lookup without scanning
-- pending or rejected requests. The existing unique(event_id, exhibitor_id)
-- index remains responsible for duplicate prevention.
create index if not exists exhibitor_event_participation_approved_event
  on public.exhibitor_event_participation(event_id, exhibitor_id)
  where status = 'approved';
