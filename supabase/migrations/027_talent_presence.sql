alter table public.talent_job_preferences
  rename column is_online to available_for_work;

alter table public.talent_job_preferences
  add column presence_visible boolean not null default true,
  add column last_seen_at timestamptz;

create index talent_job_preferences_visible_last_seen
  on public.talent_job_preferences (last_seen_at desc)
  where presence_visible;

create or replace function public.create_talent_job_alerts() returns trigger language plpgsql as $$
begin
  insert into public.talent_job_alerts (talent_id, staffing_role_id)
  select p.id, new.id from public.profiles p
    join public.talent_profiles tp on tp.profile_id = p.id
    join public.talent_job_preferences pref on pref.talent_id = p.id
    join public.events e on e.id = new.event_id
  where p.role = 'talent' and p.verification_status = 'verified' and pref.available_for_work
    and lower(trim(p.city)) = lower(trim(e.city))
    and (cardinality(new.required_skills) = 0 or exists (
      select 1 from unnest(new.required_skills) required, unnest(tp.skills) owned
      where lower(trim(required)) = lower(trim(owned))
    ))
  on conflict (talent_id, staffing_role_id) do nothing;
  return new;
end $$;
