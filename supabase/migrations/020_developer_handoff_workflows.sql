-- EXPORB developer handoff: connected workflows, multi-company organizers,
-- application preflight data, and an admin-verified manual settlement ledger.

create type public.application_workflow_status as enum ('applied','under_review','shortlisted','confirmed','rejected','completed','closed');
alter table public.applications alter column status drop default;
alter table public.applications alter column status type public.application_workflow_status using
  (case status::text when 'accepted' then 'confirmed' when 'cancelled' then 'closed' else status::text end)::public.application_workflow_status;
alter table public.applications alter column status set default 'applied';

alter table public.organizer_companies drop constraint if exists organizer_companies_owner_id_key;
alter table public.organizer_companies
  add column if not exists logo_path text,
  add column if not exists public_phone text,
  add column if not exists verification_status public.verification_status not null default 'pending_verification';

create table if not exists public.organizer_company_memberships (
  company_id uuid not null references public.organizer_companies(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  permission text not null default 'owner' check (permission in ('owner','manager')),
  created_at timestamptz not null default now(),
  primary key (company_id, profile_id)
);
insert into public.organizer_company_memberships(company_id,profile_id,permission)
select id,owner_id,'owner' from public.organizer_companies on conflict do nothing;

create or replace function public.owns_organizer_company(company uuid) returns boolean
language sql stable security definer set search_path=public as $$
  select exists(select 1 from organizer_company_memberships where company_id=company and profile_id=auth.uid());
$$;

alter table public.organizer_events drop constraint if exists organizer_events_status_check;
alter table public.organizer_events add constraint organizer_events_status_check
  check (status in ('draft','submitted','published','cancelled'));
alter table public.organizer_events add column if not exists map_url text;

alter table public.exhibitor_event_submissions drop constraint if exists exhibitor_event_submissions_status_check;
alter table public.exhibitor_event_submissions add column if not exists map_url text;

alter table public.events
  add column if not exists verification_status text not null default 'verified'
    check (verification_status in ('verification_required','pending','verified','rejected')),
  add column if not exists map_url text,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists location_label text,
  add column if not exists payer_type text not null default 'exhibitor'
    check (payer_type in ('exhibitor','agency'));

alter table public.staffing_roles
  add column if not exists preferred_skills text[] not null default '{}',
  add column if not exists required_languages text[] not null default '{}',
  add column if not exists worker_standard text,
  add column if not exists rate_mode text not null default 'fixed'
    check (rate_mode in ('fixed','range','negotiable')),
  add column if not exists proposed_rate_min numeric(12,2),
  add column if not exists proposed_rate_max numeric(12,2),
  add column if not exists final_client_charge numeric(12,2),
  add column if not exists agency_share numeric(12,2),
  add column if not exists request_status text not null default 'received'
    check (request_status in ('received','under_review','approved','staffing','completed','closed','cancelled'));
update public.staffing_roles set proposed_rate_min=hourly_rate,proposed_rate_max=hourly_rate where proposed_rate_min is null;

alter table public.profiles add column if not exists profile_updated_at timestamptz not null default now();
alter table public.talent_profiles add column if not exists other_locations text[] not null default '{}';

create table if not exists public.skill_catalog (
  key text primary key,
  label text not null,
  training_url text check (training_url is null or training_url ~ '^https://'),
  active boolean not null default true
);

create table if not exists public.verification_requests (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('account','company','event','talent','document')),
  entity_id uuid not null,
  requester_id uuid not null references public.profiles(id),
  status text not null default 'pending' check (status in ('pending','verified','rejected','cancelled')),
  notes text,
  reviewer_id uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists verification_requests_one_pending
  on public.verification_requests(entity_type,entity_id) where status='pending';

alter table public.exhibitors
  add column if not exists company_type text,
  add column if not exists primary_contact_name text,
  add column if not exists contact_phone text,
  add column if not exists contact_email text;
alter table public.agencies add column if not exists contact_phone text;

create table if not exists public.agency_staff_contacts (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  talent_id uuid references public.talent_profiles(profile_id) on delete set null,
  full_name text not null,
  phone text,
  email text,
  skills text[] not null default '{}',
  availability text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.placements
  add column if not exists hours_worked numeric(8,2),
  add column if not exists completion_notes text;

create table if not exists public.platform_fee_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  fee_type public.commission_type not null,
  fee_value numeric(12,2) not null check (fee_value >= 0),
  active boolean not null default false,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
create unique index if not exists platform_fee_rules_one_active on public.platform_fee_rules(active) where active;

create table if not exists public.staffing_settlements (
  id uuid primary key default gen_random_uuid(),
  staffing_role_id uuid not null unique references public.staffing_roles(id) on delete cascade,
  payer_type text not null check (payer_type in ('exhibitor','agency')),
  payer_exhibitor_id uuid references public.exhibitors(id),
  payer_agency_id uuid references public.agencies(id),
  currency text not null default 'INR' check (currency='INR'),
  gross_amount numeric(12,2) not null check (gross_amount >= 0),
  platform_fee_type public.commission_type not null,
  platform_fee_value numeric(12,2) not null check (platform_fee_value >= 0),
  platform_fee_amount numeric(12,2) not null check (platform_fee_amount >= 0),
  agency_amount numeric(12,2) not null default 0 check (agency_amount >= 0),
  status text not null default 'pending' check (status in ('pending','sent','received','processing','partially_paid','paid','failed','refunded')),
  payer_reference text,
  payer_marked_at timestamptz,
  received_reference text,
  received_at timestamptz,
  received_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((payer_type='exhibitor' and payer_exhibitor_id is not null and payer_agency_id is null) or
         (payer_type='agency' and payer_agency_id is not null and payer_exhibitor_id is null))
);

create table if not exists public.settlement_payouts (
  id uuid primary key default gen_random_uuid(),
  settlement_id uuid not null references public.staffing_settlements(id) on delete cascade,
  recipient_type text not null check (recipient_type in ('agency','talent')),
  agency_id uuid references public.agencies(id),
  talent_id uuid references public.talent_profiles(profile_id),
  placement_id uuid references public.placements(id),
  amount numeric(12,2) not null check (amount >= 0),
  status text not null default 'pending' check (status in ('pending','processing','paid','failed','refunded')),
  transaction_reference text,
  paid_at timestamptz,
  paid_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((recipient_type='agency' and agency_id is not null and talent_id is null) or
         (recipient_type='talent' and talent_id is not null and agency_id is null))
);
create unique index if not exists settlement_payouts_agency_unique on public.settlement_payouts(settlement_id,agency_id) where agency_id is not null;
create unique index if not exists settlement_payouts_placement_unique on public.settlement_payouts(settlement_id,placement_id) where placement_id is not null;

create table if not exists public.settlement_audit_log (
  id uuid primary key default gen_random_uuid(),
  settlement_id uuid not null references public.staffing_settlements(id) on delete cascade,
  actor_id uuid not null references public.profiles(id),
  action text not null,
  amount numeric(12,2),
  reference text,
  created_at timestamptz not null default now()
);

create or replace function public.refresh_settlement_status(target uuid) returns void
language plpgsql security definer set search_path=public as $$
declare total_count integer; paid_count integer; current_status text;
begin
  select count(*),count(*) filter(where status='paid') into total_count,paid_count
  from settlement_payouts where settlement_id=target;
  select status into current_status from staffing_settlements where id=target;
  if current_status in ('failed','refunded') then return; end if;
  update staffing_settlements set status=case
    when total_count>0 and paid_count=total_count then 'paid'
    when paid_count>0 then 'partially_paid'
    when current_status='received' then 'received'
    when current_status='sent' then 'sent'
    else current_status end,updated_at=now() where id=target;
end $$;

create or replace function public.refresh_settlement_after_payout() returns trigger
language plpgsql security definer set search_path=public as $$
begin perform refresh_settlement_status(new.settlement_id); return new; end $$;
drop trigger if exists settlement_payout_status_refresh on public.settlement_payouts;
create trigger settlement_payout_status_refresh after insert or update of status on public.settlement_payouts
for each row execute function public.refresh_settlement_after_payout();

create or replace function public.guard_application_confirmation() returns trigger language plpgsql as $$
declare capacity integer; confirmed integer; target_role public.staffing_roles%rowtype;
begin
  if new.status='confirmed' and old.status is distinct from new.status then
    select * into target_role from public.staffing_roles where id=new.staffing_role_id for update;
    select count(*) into confirmed from public.applications where staffing_role_id=new.staffing_role_id and status='confirmed' and id<>new.id;
    if confirmed>=target_role.headcount then raise exception 'Role is full'; end if;
    if exists(select 1 from public.applications a join public.staffing_roles sr on sr.id=a.staffing_role_id
      where a.talent_id=new.talent_id and a.id<>new.id and a.status='confirmed'
      and sr.work_starts_on<=target_role.work_ends_on and sr.work_ends_on>=target_role.work_starts_on)
      then raise exception 'Talent is already booked on these days'; end if;
  end if;
  return new;
end $$;

create or replace function public.create_placement_from_acceptance() returns trigger
language plpgsql security definer set search_path=public as $$
declare role_rate numeric(12,2);
begin
  if new.status='confirmed' and old.status is distinct from new.status then
    select coalesce(proposed_rate_min,hourly_rate) into role_rate from staffing_roles where id=new.staffing_role_id;
    insert into placements(application_id,staffing_role_id,talent_id,agreed_rate,status)
      values(new.id,new.staffing_role_id,new.talent_id,coalesce(role_rate,0),'accepted') on conflict(application_id) do nothing;
  elsif new.status='closed' and old.status='confirmed' then update placements set status='cancelled' where application_id=new.id;
  elsif new.status='completed' then update placements set status='completed',completed_at=now() where application_id=new.id;
  end if;
  return new;
end $$;

create or replace function public.sync_placement_on_application_change() returns trigger language plpgsql as $$
declare confirmed integer; capacity integer;
begin
  if old.status is distinct from new.status and (old.status='confirmed' or new.status='confirmed') then
    select headcount into capacity from staffing_roles where id=new.staffing_role_id;
    select count(*) into confirmed from applications where staffing_role_id=new.staffing_role_id and status='confirmed';
    update staffing_roles set status=case when confirmed>=capacity then 'filled' else 'open' end where id=new.staffing_role_id and status in ('open','filled');
  end if;
  return new;
end $$;

create or replace function public.create_worker_payout_from_placement() returns trigger
language plpgsql security definer set search_path=public as $$
declare settlement uuid;
begin
  select id into settlement from staffing_settlements where staffing_role_id=new.staffing_role_id;
  if settlement is not null then
    insert into settlement_payouts(settlement_id,recipient_type,talent_id,placement_id,amount)
      values(settlement,'talent',new.talent_id,new.id,new.agreed_rate) on conflict do nothing;
  end if;
  return new;
end $$;
drop trigger if exists create_worker_payout_from_placement on public.placements;
create trigger create_worker_payout_from_placement after insert on public.placements for each row execute function public.create_worker_payout_from_placement();

alter table public.organizer_company_memberships enable row level security;
alter table public.skill_catalog enable row level security;
alter table public.verification_requests enable row level security;
alter table public.agency_staff_contacts enable row level security;
alter table public.platform_fee_rules enable row level security;
alter table public.staffing_settlements enable row level security;
alter table public.settlement_payouts enable row level security;
alter table public.settlement_audit_log enable row level security;
revoke all on public.organizer_company_memberships,public.verification_requests,public.agency_staff_contacts,
  public.platform_fee_rules,public.staffing_settlements,public.settlement_payouts,public.settlement_audit_log
  from public,anon,authenticated;
grant select on public.skill_catalog to anon,authenticated;
grant select,insert,update,delete on public.organizer_company_memberships,public.verification_requests,
  public.agency_staff_contacts,public.platform_fee_rules,public.staffing_settlements,public.settlement_payouts,
  public.settlement_audit_log to service_role;
