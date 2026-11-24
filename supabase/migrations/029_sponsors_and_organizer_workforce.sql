-- Sponsor marketplace and organizer-owned paid/unpaid workforce.
alter type public.user_role add value if not exists 'sponsor_agency';

-- Keep the optimized app-owned signup RPC in sync with the new public role.
do $$
declare definition text;
begin
  select pg_get_functiondef('public.prepare_app_signup(text,text,text,text,text,text,text,text,timestamptz)'::regprocedure) into definition;
  if definition is not null then
    execute replace(definition, 'p_role not in (''talent'', ''agency'', ''exhibitor'', ''organizer'')', 'p_role not in (''talent'', ''agency'', ''exhibitor'', ''organizer'', ''sponsor_agency'')');
  end if;
end $$;

create or replace function public.guard_signup_role() returns trigger language plpgsql as $$
begin
 if current_user not in ('postgres', 'supabase_admin') and coalesce(new.raw_user_meta_data->>'role', 'talent') not in ('talent','agency','exhibitor','organizer','sponsor_agency') then raise exception 'Invalid signup account type'; end if;
 return new;
end;
$$;

alter table public.verification_requests drop constraint if exists verification_requests_entity_type_check;
alter table public.verification_requests add constraint verification_requests_entity_type_check
  check (entity_type in ('account','company','event','talent','document','sponsor_agency'));

create table if not exists public.sponsor_agencies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references public.profiles(id) on delete cascade,
  name text not null check (length(trim(name)) between 2 and 160),
  description text not null default '' check (length(description) <= 5000),
  website text check (website is null or website ~ '^https://'),
  city text not null check (length(trim(city)) between 1 and 120),
  contact_phone text not null check (length(trim(contact_phone)) between 3 and 40),
  logo_path text,
  verification_status public.verification_status not null default 'pending_verification',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sponsor_brands (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.sponsor_agencies(id) on delete cascade,
  name text not null check (length(trim(name)) between 2 and 160),
  industry text not null default '' check (length(industry) <= 160),
  description text not null default '' check (length(description) <= 5000),
  website text check (website is null or website ~ '^https://'),
  contact_name text not null default '' check (length(contact_name) <= 160),
  contact_email text not null default '' check (length(contact_email) <= 320),
  contact_phone text not null default '' check (length(contact_phone) <= 40),
  logo_path text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (agency_id, name)
);

create table if not exists public.event_sponsorship_settings (
  event_id uuid primary key references public.organizer_events(id) on delete cascade,
  is_enabled boolean not null default false,
  brief text not null default '' check (length(brief) <= 10000),
  target_amount numeric(14,2) check (target_amount is null or target_amount >= 0),
  accepts_cash boolean not null default true,
  accepts_in_kind boolean not null default true,
  accepts_custom_proposals boolean not null default true,
  response_deadline date,
  desired_industries text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (accepts_cash or accepts_in_kind)
);

create table if not exists public.sponsorship_packages (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.organizer_events(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 160),
  description text not null default '' check (length(description) <= 5000),
  price numeric(14,2) check (price is null or price >= 0),
  benefits text not null default '' check (length(benefits) <= 10000),
  deliverables text not null default '' check (length(deliverables) <= 10000),
  available_slots integer not null default 1 check (available_slots between 1 and 10000),
  display_priority integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, name)
);

create table if not exists public.sponsorship_proposals (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.organizer_events(id) on delete cascade,
  package_id uuid references public.sponsorship_packages(id) on delete restrict,
  agency_id uuid not null references public.sponsor_agencies(id) on delete restrict,
  brand_id uuid not null references public.sponsor_brands(id) on delete restrict,
  status text not null default 'draft' check (status in ('draft','submitted','under_review','changes_requested','organizer_accepted','confirmed','declined','withdrawn','cancelled')),
  cash_amount numeric(14,2) check (cash_amount is null or cash_amount >= 0),
  in_kind_items text not null default '' check (length(in_kind_items) <= 10000),
  in_kind_value numeric(14,2) check (in_kind_value is null or in_kind_value >= 0),
  proposed_benefits text not null default '' check (length(proposed_benefits) <= 10000),
  deliverables text not null default '' check (length(deliverables) <= 10000),
  notes text not null default '' check (length(notes) <= 10000),
  valid_until date,
  revision integer not null default 1 check (revision > 0),
  accepted_terms jsonb,
  accepted_revision integer,
  external_payment_reference text check (external_payment_reference is null or length(external_payment_reference) <= 240),
  agreement_notes text not null default '' check (length(agreement_notes) <= 10000),
  submitted_at timestamptz,
  organizer_accepted_at timestamptz,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (package_id is not null or cash_amount is not null or in_kind_value is not null),
  unique (event_id, brand_id)
);

create table if not exists public.sponsorship_proposal_revisions (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.sponsorship_proposals(id) on delete cascade,
  revision integer not null check (revision > 0),
  terms jsonb not null,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (proposal_id, revision)
);

create table if not exists public.event_sponsors (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null unique references public.sponsorship_proposals(id) on delete restrict,
  event_id uuid not null references public.organizer_events(id) on delete cascade,
  package_id uuid references public.sponsorship_packages(id) on delete restrict,
  brand_id uuid not null references public.sponsor_brands(id) on delete restrict,
  agency_id uuid not null references public.sponsor_agencies(id) on delete restrict,
  package_name text,
  display_priority integer not null default 0,
  agreed_cash_amount numeric(14,2) not null default 0 check (agreed_cash_amount >= 0),
  agreed_in_kind_value numeric(14,2) not null default 0 check (agreed_in_kind_value >= 0),
  agreed_terms jsonb not null,
  status text not null default 'active' check (status in ('active','cancelled')),
  confirmed_at timestamptz not null default now(),
  cancelled_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.sponsorship_audit_log (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.sponsorship_proposals(id) on delete cascade,
  actor_id uuid not null references public.profiles(id),
  action text not null,
  details jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.sponsorship_notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  proposal_id uuid not null references public.sponsorship_proposals(id) on delete cascade,
  message text not null check (length(message) <= 500),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists sponsor_brands_agency on public.sponsor_brands(agency_id,is_active,name);
create index if not exists sponsorship_settings_discovery on public.event_sponsorship_settings(is_enabled,response_deadline);
create index if not exists sponsorship_packages_event on public.sponsorship_packages(event_id,is_active,display_priority);
create index if not exists sponsorship_proposals_event_status on public.sponsorship_proposals(event_id,status,updated_at desc);
create index if not exists sponsorship_proposals_agency_status on public.sponsorship_proposals(agency_id,status,updated_at desc);
create index if not exists event_sponsors_public on public.event_sponsors(event_id,status,display_priority);
create index if not exists sponsorship_notifications_profile on public.sponsorship_notifications(profile_id,read_at,created_at desc);

create or replace function public.validate_sponsorship_proposal()
returns trigger language plpgsql set search_path=public as $$
begin
  if not exists(select 1 from sponsor_brands where id=new.brand_id and agency_id=new.agency_id and is_active) then raise exception 'Sponsor brand does not belong to agency'; end if;
  if new.package_id is not null and not exists(select 1 from sponsorship_packages where id=new.package_id and event_id=new.event_id and is_active) then raise exception 'Package does not belong to event'; end if;
  if new.status='submitted' and (tg_op='INSERT' or old.status='draft') and not exists(select 1 from sponsor_agencies where id=new.agency_id and verification_status='verified') then raise exception 'Verified sponsor agency required'; end if;
  if tg_op='UPDATE' and old.status in ('organizer_accepted','confirmed') and new.revision<>old.revision then raise exception 'Accepted proposal terms are locked'; end if;
  return new;
end $$;

drop trigger if exists validate_sponsorship_proposal on public.sponsorship_proposals;
create trigger validate_sponsorship_proposal before insert or update on public.sponsorship_proposals
for each row execute function public.validate_sponsorship_proposal();

alter table public.events add column if not exists organizer_company_id uuid references public.organizer_companies(id) on delete restrict;
alter table public.events drop constraint if exists events_payer_type_check;
alter table public.events add constraint events_payer_type_check check (payer_type in ('exhibitor','agency','organizer'));
alter table public.staffing_settlements add column if not exists payer_organizer_company_id uuid references public.organizer_companies(id);
alter table public.staffing_settlements drop constraint if exists staffing_settlements_payer_type_check;
alter table public.staffing_settlements add constraint staffing_settlements_payer_type_check check (payer_type in ('exhibitor','agency','organizer'));
alter table public.staffing_settlements drop constraint if exists staffing_settlements_check;
alter table public.staffing_settlements add constraint staffing_settlements_payer_identity_check check (
  (payer_type='exhibitor' and payer_exhibitor_id is not null and payer_agency_id is null and payer_organizer_company_id is null) or
  (payer_type='agency' and payer_agency_id is not null and payer_exhibitor_id is null and payer_organizer_company_id is null) or
  (payer_type='organizer' and payer_organizer_company_id is not null and payer_exhibitor_id is null and payer_agency_id is null)
);

create or replace function public.confirm_sponsorship(p_proposal_id uuid, p_actor_id uuid)
returns uuid language plpgsql security definer set search_path=public as $$
declare p public.sponsorship_proposals%rowtype; pkg public.sponsorship_packages%rowtype; sponsor_id uuid; used_slots integer;
begin
  select * into p from sponsorship_proposals where id=p_proposal_id for update;
  if p.id is null or p.status <> 'organizer_accepted' or p.accepted_revision <> p.revision or p.accepted_terms is null then raise exception 'Proposal terms are not ready for confirmation'; end if;
  if not exists(select 1 from sponsor_agencies where id=p.agency_id and owner_id=p_actor_id and verification_status='verified') then raise exception 'Verified sponsor agency required'; end if;
  if p.package_id is not null then
    select * into pkg from sponsorship_packages where id=p.package_id and event_id=p.event_id and is_active for update;
    if pkg.id is null then raise exception 'Package is unavailable'; end if;
    select count(*) into used_slots from event_sponsors where package_id=p.package_id and status='active';
    if used_slots >= pkg.available_slots then raise exception 'Package is full'; end if;
  end if;
  insert into event_sponsors(proposal_id,event_id,package_id,brand_id,agency_id,package_name,display_priority,agreed_cash_amount,agreed_in_kind_value,agreed_terms)
  values(p.id,p.event_id,p.package_id,p.brand_id,p.agency_id,pkg.name,coalesce(pkg.display_priority,0),coalesce(p.cash_amount,0),coalesce(p.in_kind_value,0),p.accepted_terms)
  returning id into sponsor_id;
  update sponsorship_proposals set status='confirmed',confirmed_at=now(),updated_at=now() where id=p.id;
  insert into sponsorship_audit_log(proposal_id,actor_id,action) values(p.id,p_actor_id,'confirmed');
  return sponsor_id;
end $$;

alter table public.sponsor_agencies enable row level security;
alter table public.sponsor_brands enable row level security;
alter table public.event_sponsorship_settings enable row level security;
alter table public.sponsorship_packages enable row level security;
alter table public.sponsorship_proposals enable row level security;
alter table public.sponsorship_proposal_revisions enable row level security;
alter table public.event_sponsors enable row level security;
alter table public.sponsorship_audit_log enable row level security;
alter table public.sponsorship_notifications enable row level security;

revoke all on public.sponsor_agencies,public.sponsor_brands,public.event_sponsorship_settings,public.sponsorship_packages,
 public.sponsorship_proposals,public.sponsorship_proposal_revisions,public.event_sponsors,public.sponsorship_audit_log,public.sponsorship_notifications from public,anon,authenticated;
grant select,insert,update,delete on public.sponsor_agencies,public.sponsor_brands,public.event_sponsorship_settings,public.sponsorship_packages,
 public.sponsorship_proposals,public.sponsorship_proposal_revisions,public.event_sponsors,public.sponsorship_audit_log,public.sponsorship_notifications to service_role;
grant execute on function public.confirm_sponsorship(uuid,uuid) to service_role;

comment on table public.event_sponsors is 'Immutable public sponsorship snapshot created only after organizer acceptance and sponsor-agency confirmation.';
