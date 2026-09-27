alter table public.staffing_roles
  add column if not exists opportunity_type text not null default 'paid'
    check (opportunity_type in ('paid','volunteer'));

create unique index if not exists events_organizer_catalog_workforce
  on public.events(organizer_event_id)
  where organizer_event_id is not null and exhibitor_id is null;

create table if not exists public.exhibitor_stalls (
  id uuid primary key default gen_random_uuid(),
  exhibitor_id uuid not null references public.exhibitors(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  created_by uuid not null references public.profiles(id),
  name text not null check (length(trim(name)) between 1 and 160),
  booth_number text check (booth_number is null or length(booth_number) <= 80),
  booth_location text check (booth_location is null or length(booth_location) <= 240),
  area_sqft numeric(12,2) check (area_sqft is null or area_sqft > 0),
  dimensions text check (dimensions is null or length(dimensions) <= 160),
  description text not null default '' check (length(description) <= 5000),
  products_services text not null default '' check (length(products_services) <= 5000),
  branding_notes text not null default '' check (length(branding_notes) <= 3000),
  utilities text not null default '' check (length(utilities) <= 3000),
  equipment text not null default '' check (length(equipment) <= 3000),
  setup_at timestamptz,
  teardown_at timestamptz,
  vendor_details text not null default '' check (length(vendor_details) <= 3000),
  permits_documents text not null default '' check (length(permits_documents) <= 3000),
  instructions text not null default '' check (length(instructions) <= 5000),
  image_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (teardown_at is null or setup_at is null or teardown_at >= setup_at)
);

create index if not exists exhibitor_stalls_owner_event
  on public.exhibitor_stalls(exhibitor_id,event_id,created_at desc);

alter table public.exhibitor_stalls enable row level security;
revoke all on public.exhibitor_stalls from public, anon, authenticated;
grant select, insert, update, delete on public.exhibitor_stalls to service_role;

alter table public.staffing_roles
  add column if not exists stall_id uuid references public.exhibitor_stalls(id) on delete restrict;

create index if not exists staffing_roles_stall on public.staffing_roles(stall_id);
create index if not exists staffing_roles_opportunity on public.staffing_roles(opportunity_type,status,work_starts_on);

create or replace function public.validate_staffing_opportunity()
returns trigger language plpgsql set search_path = public as $$
declare target_event public.events%rowtype; target_stall public.exhibitor_stalls%rowtype;
begin
  select * into target_event from public.events where id=new.event_id;
  if new.opportunity_type='volunteer' then
    if target_event.organizer_event_id is null or target_event.exhibitor_id is not null or new.stall_id is not null then
      raise exception 'Volunteer openings must belong directly to an organizer event';
    end if;
    if coalesce(new.hourly_rate,0)<>0 or new.proposed_rate_min is not null or new.proposed_rate_max is not null then
      raise exception 'Volunteer openings cannot include payment rates';
    end if;
  else
    if new.stall_id is not null then
      select * into target_stall from public.exhibitor_stalls where id=new.stall_id;
      if target_stall.id is null or target_stall.event_id<>new.event_id or target_stall.exhibitor_id<>target_event.exhibitor_id then
        raise exception 'Staffing request stall does not belong to this event and exhibitor';
      end if;
    end if;
  end if;
  return new;
end; $$;

drop trigger if exists validate_staffing_opportunity on public.staffing_roles;
create trigger validate_staffing_opportunity
before insert or update of event_id,stall_id,opportunity_type,hourly_rate,proposed_rate_min,proposed_rate_max
on public.staffing_roles for each row execute function public.validate_staffing_opportunity();

comment on column public.staffing_roles.stall_id is
  'Nullable for legacy paid roles and organizer volunteers; required by the application for new exhibitor staffing requests.';
