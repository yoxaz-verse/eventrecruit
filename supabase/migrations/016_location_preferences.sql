create table public.locations (
  id uuid primary key,
  name text not null check (length(trim(name)) between 1 and 120),
  state_name text not null check (length(trim(state_name)) between 1 and 120),
  state_code text not null check (length(trim(state_code)) between 1 and 12),
  country_name text not null check (length(trim(country_name)) between 1 and 120),
  country_code text not null check (length(trim(country_code)) = 2),
  slug text not null unique check (slug = lower(slug)),
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (country_code, state_code, name)
);

insert into public.locations (id,name,state_name,state_code,country_name,country_code,slug,display_order) values
 ('10000000-0000-4000-8000-000000000001','Thiruvananthapuram','Kerala','KL','India','IN','in-kl-thiruvananthapuram',1),
 ('10000000-0000-4000-8000-000000000002','Kollam','Kerala','KL','India','IN','in-kl-kollam',2),
 ('10000000-0000-4000-8000-000000000003','Pathanamthitta','Kerala','KL','India','IN','in-kl-pathanamthitta',3),
 ('10000000-0000-4000-8000-000000000004','Alappuzha','Kerala','KL','India','IN','in-kl-alappuzha',4),
 ('10000000-0000-4000-8000-000000000005','Kottayam','Kerala','KL','India','IN','in-kl-kottayam',5),
 ('10000000-0000-4000-8000-000000000006','Thodupuzha','Kerala','KL','India','IN','in-kl-thodupuzha',6),
 ('10000000-0000-4000-8000-000000000007','Kochi','Kerala','KL','India','IN','in-kl-kochi',7),
 ('10000000-0000-4000-8000-000000000008','Thrissur','Kerala','KL','India','IN','in-kl-thrissur',8),
 ('10000000-0000-4000-8000-000000000009','Palakkad','Kerala','KL','India','IN','in-kl-palakkad',9),
 ('10000000-0000-4000-8000-000000000010','Malappuram','Kerala','KL','India','IN','in-kl-malappuram',10),
 ('10000000-0000-4000-8000-000000000011','Kozhikode','Kerala','KL','India','IN','in-kl-kozhikode',11),
 ('10000000-0000-4000-8000-000000000012','Kalpetta','Kerala','KL','India','IN','in-kl-kalpetta',12),
 ('10000000-0000-4000-8000-000000000013','Kannur','Kerala','KL','India','IN','in-kl-kannur',13),
 ('10000000-0000-4000-8000-000000000014','Kasaragod','Kerala','KL','India','IN','in-kl-kasaragod',14);

alter table public.profiles add column home_location_id uuid references public.locations(id);
alter table public.organizer_events add column location_id uuid references public.locations(id);
alter table public.exhibitor_event_submissions add column location_id uuid references public.locations(id);
alter table public.events add column location_id uuid references public.locations(id);

create table public.talent_preferred_locations (
  talent_id uuid not null references public.talent_profiles(profile_id) on delete cascade,
  location_id uuid not null references public.locations(id),
  created_at timestamptz not null default now(),
  primary key (talent_id, location_id)
);

update public.profiles p set home_location_id=l.id from public.locations l where lower(trim(p.city))=lower(l.name);
update public.organizer_events e set location_id=l.id from public.locations l where lower(trim(e.city))=lower(l.name);
update public.exhibitor_event_submissions e set location_id=l.id from public.locations l where lower(trim(e.city))=lower(l.name);
update public.events e set location_id=l.id from public.locations l where lower(trim(e.city))=lower(l.name);
insert into public.talent_preferred_locations(talent_id,location_id)
 select tp.profile_id,p.home_location_id from public.talent_profiles tp join public.profiles p on p.id=tp.profile_id
 where p.home_location_id is not null on conflict do nothing;

create index locations_active_order on public.locations(is_active, country_code, state_code, display_order);
create index talent_preferred_locations_location on public.talent_preferred_locations(location_id,talent_id);
create index organizer_events_location on public.organizer_events(location_id,starts_at) where status='published';
create index exhibitor_event_submissions_location on public.exhibitor_event_submissions(location_id,starts_at) where status='approved';
create index events_location on public.events(location_id);

create or replace function public.sync_catalog_location_name() returns trigger language plpgsql set search_path=public as $$
declare catalog_name text; active boolean;
begin
  if new.location_id is null then return new; end if;
  select name,is_active into catalog_name,active from public.locations where id=new.location_id;
  if catalog_name is null or not active then raise exception 'Choose an active location'; end if;
  new.city=catalog_name;
  return new;
end $$;
create trigger organizer_events_sync_location before insert or update of location_id,city on public.organizer_events for each row execute function public.sync_catalog_location_name();
create trigger exhibitor_submissions_sync_location before insert or update of location_id,city on public.exhibitor_event_submissions for each row execute function public.sync_catalog_location_name();
create trigger staffing_events_sync_location before insert or update of location_id,city on public.events for each row execute function public.sync_catalog_location_name();

create or replace function public.create_talent_job_alerts() returns trigger language plpgsql as $$
begin
  insert into public.talent_job_alerts (talent_id, staffing_role_id)
  select p.id,new.id from public.profiles p
    join public.talent_profiles tp on tp.profile_id=p.id
    join public.talent_job_preferences pref on pref.talent_id=p.id
    join public.talent_preferred_locations preferred on preferred.talent_id=p.id
    join public.events e on e.id=new.event_id and e.location_id=preferred.location_id
  where p.role='talent' and p.verification_status='verified' and pref.is_online
  on conflict (talent_id,staffing_role_id) do nothing;
  return new;
end $$;

alter table public.locations enable row level security;
alter table public.talent_preferred_locations enable row level security;
revoke all on public.locations, public.talent_preferred_locations from public,anon,authenticated;
grant select,insert,update,delete on public.locations, public.talent_preferred_locations to service_role;
