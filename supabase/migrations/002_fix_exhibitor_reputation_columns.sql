alter table public.exhibitors
  add column if not exists average_rating numeric(3,2) not null default 0,
  add column if not exists reliability_score integer not null default 100,
  add column if not exists communication_score integer not null default 100,
  add column if not exists professionalism_score integer not null default 100,
  add column if not exists completed_events integer not null default 0,
  add column if not exists cancellations integer not null default 0,
  add column if not exists disputes integer not null default 0;

update public.exhibitors x
set
  completed_events = coalesce(placement_counts.completed_events, 0),
  cancellations = coalesce(placement_counts.cancellations, 0)
from (
  select
    x_inner.id as exhibitor_id,
    count(p.id) filter (where p.status = 'completed')::integer as completed_events,
    count(p.id) filter (where p.status = 'cancelled')::integer as cancellations
  from public.exhibitors x_inner
  left join public.events e on e.exhibitor_id = x_inner.id
  left join public.staffing_roles sr on sr.event_id = e.id
  left join public.placements p on p.staffing_role_id = sr.id
  group by x_inner.id
) placement_counts
where placement_counts.exhibitor_id = x.id;

do $$
declare
  exhibitor_record record;
begin
  for exhibitor_record in select owner_id from public.exhibitors loop
    perform public.refresh_profile_reputation(exhibitor_record.owner_id);
  end loop;
end $$;
