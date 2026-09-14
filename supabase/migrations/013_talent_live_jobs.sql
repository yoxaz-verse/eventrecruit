alter table public.staffing_roles add column work_starts_on date, add column work_ends_on date;
update public.staffing_roles sr set work_starts_on = e.starts_at, work_ends_on = e.ends_at from public.events e where e.id = sr.event_id;
alter table public.staffing_roles alter column work_starts_on set not null, alter column work_ends_on set not null;
alter table public.staffing_roles add constraint valid_work_days check (work_ends_on >= work_starts_on);
create or replace function public.validate_staffing_work_days() returns trigger language plpgsql as $$
declare event_start date; event_end date;
begin
  select starts_at, ends_at into event_start, event_end from public.events where id = new.event_id;
  if event_start is null or new.work_starts_on < event_start or new.work_ends_on > event_end then
    raise exception 'Work days must be within event dates';
  end if;
  return new;
end $$;
create trigger validate_staffing_work_days before insert or update of work_starts_on, work_ends_on, event_id on public.staffing_roles
  for each row execute function public.validate_staffing_work_days();

alter table public.applications add column cancellation_requested_at timestamptz;

create table public.talent_job_preferences (
  talent_id uuid primary key references public.talent_profiles(profile_id) on delete cascade,
  is_online boolean not null default false,
  notify_push boolean not null default false,
  updated_at timestamptz not null default now()
);
create table public.talent_job_alerts (
  id uuid primary key default gen_random_uuid(),
  talent_id uuid not null references public.talent_profiles(profile_id) on delete cascade,
  staffing_role_id uuid not null references public.staffing_roles(id) on delete cascade,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  unique (talent_id, staffing_role_id)
);
create or replace function public.create_talent_job_alerts() returns trigger language plpgsql as $$
begin
  insert into public.talent_job_alerts (talent_id, staffing_role_id)
  select p.id, new.id from public.profiles p
    join public.talent_profiles tp on tp.profile_id = p.id
    join public.talent_job_preferences pref on pref.talent_id = p.id
    join public.events e on e.id = new.event_id
  where p.role = 'talent' and p.verification_status = 'verified' and pref.is_online
    and lower(trim(p.city)) = lower(trim(e.city))
    and (cardinality(new.required_skills) = 0 or exists (
      select 1 from unnest(new.required_skills) required, unnest(tp.skills) owned
      where lower(trim(required)) = lower(trim(owned))
    ))
  on conflict (talent_id, staffing_role_id) do nothing;
  return new;
end $$;
create trigger create_talent_job_alerts after insert on public.staffing_roles
  for each row execute function public.create_talent_job_alerts();
create table public.talent_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  talent_id uuid not null references public.talent_profiles(profile_id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth_secret text not null,
  created_at timestamptz not null default now()
);
create table public.exhibitor_event_participation (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.organizer_events(id) on delete cascade,
  exhibitor_id uuid not null references public.exhibitors(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  unique (event_id, exhibitor_id)
);

create or replace function public.guard_application_confirmation() returns trigger language plpgsql as $$
declare
  target_role public.staffing_roles%rowtype;
  occupied integer;
begin
  if new.status = 'accepted' and old.status is distinct from new.status then
    if old.status in ('cancelled','completed') then raise exception 'This application is closed'; end if;
    -- Serialize confirmations for both this talent and this role.
    perform pg_advisory_xact_lock(hashtextextended(new.talent_id::text, 0));
    select * into target_role from public.staffing_roles where id = new.staffing_role_id for update;
    if target_role.id is null or target_role.status <> 'open' then raise exception 'Role is not open'; end if;
    select count(*) into occupied from public.applications
      where staffing_role_id = new.staffing_role_id and status = 'accepted' and id <> new.id;
    if occupied >= target_role.headcount then raise exception 'Role is full'; end if;
    if exists (
      select 1 from public.applications a join public.staffing_roles sr on sr.id = a.staffing_role_id
      where a.talent_id = new.talent_id and a.id <> new.id and a.status = 'accepted'
        and sr.work_starts_on <= target_role.work_ends_on
        and sr.work_ends_on >= target_role.work_starts_on
    ) then raise exception 'Talent is already booked on these days'; end if;
  end if;
  return new;
end $$;
create trigger guard_application_confirmation before update of status on public.applications
  for each row execute function public.guard_application_confirmation();

create or replace function public.sync_placement_on_application_change() returns trigger language plpgsql as $$
declare confirmed integer; capacity integer;
begin
  if old.status = 'accepted' and new.status = 'cancelled' then
    update public.placements set status = 'cancelled' where application_id = new.id;
  end if;
  if old.status is distinct from new.status and (old.status = 'accepted' or new.status = 'accepted') then
    select headcount into capacity from public.staffing_roles where id = new.staffing_role_id;
    select count(*) into confirmed from public.applications where staffing_role_id = new.staffing_role_id and status = 'accepted';
    update public.staffing_roles set status = case when confirmed >= capacity then 'filled' else 'open' end
      where id = new.staffing_role_id and status in ('open','filled');
  end if;
  return new;
end $$;
create trigger sync_placement_on_application_change after update of status on public.applications
  for each row execute function public.sync_placement_on_application_change();

alter table public.talent_job_preferences enable row level security;
alter table public.talent_job_alerts enable row level security;
alter table public.talent_push_subscriptions enable row level security;
alter table public.exhibitor_event_participation enable row level security;
revoke all on public.talent_job_preferences, public.talent_job_alerts, public.talent_push_subscriptions, public.exhibitor_event_participation from public, anon, authenticated;
grant select, insert, update, delete on public.talent_job_preferences, public.talent_job_alerts, public.talent_push_subscriptions, public.exhibitor_event_participation to service_role;
