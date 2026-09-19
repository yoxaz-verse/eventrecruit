-- Agency portal operations workspace. New records remain service-role only; every
-- application mutation must also verify agency ownership.

drop trigger if exists guard_application_confirmation on public.applications;
drop trigger if exists on_application_accepted on public.applications;
drop trigger if exists sync_placement_on_application_change on public.applications;
alter type public.application_workflow_status rename to application_workflow_status_legacy;
create type public.application_workflow_status as enum (
  'applied','shortlisted','documents_requested','under_review','approved','assigned',
  'completed','rejected','withdrawn','no_response','cancelled','closed'
);
alter table public.applications alter column status drop default;
alter table public.applications alter column status type public.application_workflow_status using
  (case status::text when 'confirmed' then 'assigned' else status::text end)::public.application_workflow_status;
alter table public.applications alter column status set default 'applied';
drop type public.application_workflow_status_legacy;

alter table public.agency_staff_contacts
  add column if not exists profile_photo_path text,
  add column if not exists whatsapp_phone text,
  add column if not exists location text,
  add column if not exists gender text,
  add column if not exists date_of_birth date,
  add column if not exists languages text[] not null default '{}',
  add column if not exists experience_years numeric(4,1) not null default 0,
  add column if not exists work_history text,
  add column if not exists availability_status text not null default 'available'
    check (availability_status in ('available','partially_available','unavailable')),
  add column if not exists assignment_status text not null default 'unassigned'
    check (assignment_status in ('unassigned','assigned','on_assignment','inactive')),
  add column if not exists recruiter_partner_id uuid,
  add column if not exists normalized_phone text,
  add column if not exists normalized_email text,
  add column if not exists invited_at timestamptz,
  add column if not exists claimed_at timestamptz;

create table if not exists public.agency_client_profiles (
  agency_id uuid not null references public.agencies(id) on delete cascade,
  exhibitor_id uuid not null references public.exhibitors(id) on delete cascade,
  contact_designation text,
  whatsapp_phone text,
  company_address text,
  requirements text,
  payment_status text not null default 'not_started'
    check (payment_status in ('not_started','pending','partially_paid','paid','overdue')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (agency_id, exhibitor_id)
);

alter table public.staffing_roles
  add column if not exists reporting_time time,
  add column if not exists working_hours text,
  add column if not exists gender_requirement text,
  add column if not exists age_requirement text,
  add column if not exists dress_code text,
  add column if not exists benefits text,
  add column if not exists special_instructions text,
  add column if not exists application_deadline timestamptz,
  add column if not exists publication_status text not null default 'draft'
    check (publication_status in ('draft','published','closed')),
  add column if not exists operation_status text not null default 'requirement_received'
    check (operation_status in ('requirement_received','staffing_in_progress','staff_shortlisted','client_approval_pending','staff_confirmed','event_ongoing','event_completed','payment_pending','closed')),
  add column if not exists published_at timestamptz;

create table if not exists public.recruitment_partners (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  name text not null,
  contact_person text,
  phone text,
  email text,
  location text,
  staff_count integer not null default 0 check (staff_count >= 0),
  skills text[] not null default '{}',
  previous_work text,
  current_operations text,
  status text not null default 'active' check (status in ('active','inactive')),
  agreement_path text,
  payment_information text,
  performance_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$ begin
  alter table public.agency_staff_contacts add constraint agency_staff_recruiter_fk
    foreign key (recruiter_partner_id) references public.recruitment_partners(id) on delete set null;
exception when duplicate_object then null; end $$;

create table if not exists public.agency_contact_imports (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  target_type text not null check (target_type in ('staff','client')),
  file_name text not null,
  status text not null default 'preview' check (status in ('preview','awaiting_resolution','committed','failed','cancelled')),
  column_mapping jsonb not null default '{}',
  total_rows integer not null default 0,
  imported_rows integer not null default 0,
  rejected_rows integer not null default 0,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  committed_at timestamptz
);

create table if not exists public.agency_staff_invites (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  staff_contact_id uuid not null references public.agency_staff_contacts(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  claimed_by uuid references public.talent_profiles(profile_id),
  claimed_at timestamptz,
  revoked_at timestamptz,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.agency_contact_import_rows (
  id uuid primary key default gen_random_uuid(),
  import_id uuid not null references public.agency_contact_imports(id) on delete cascade,
  row_number integer not null,
  values_json jsonb not null,
  validation_errors text[] not null default '{}',
  duplicate_staff_id uuid references public.agency_staff_contacts(id) on delete set null,
  resolution text check (resolution in ('merge','keep_separate','skip')),
  selected boolean not null default true,
  unique (import_id, row_number)
);

create table if not exists public.staff_information_requests (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  staff_contact_id uuid references public.agency_staff_contacts(id) on delete cascade,
  application_id uuid references public.applications(id) on delete cascade,
  requested_types text[] not null,
  message text,
  status text not null default 'requested' check (status in ('requested','submitted','accepted','cancelled')),
  requested_by uuid not null references public.profiles(id),
  requested_at timestamptz not null default now(),
  responded_at timestamptz,
  check (staff_contact_id is not null or application_id is not null)
);

create table if not exists public.agency_documents (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  owner_type text not null check (owner_type in ('staff','client','partner','event','application','information_request')),
  owner_id uuid not null,
  document_type text not null,
  file_path text not null,
  visibility text not null default 'internal' check (visibility in ('internal','staff','client_shareable')),
  uploaded_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.agency_communications (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  subject_type text not null check (subject_type in ('staff','client','partner','event','application')),
  subject_id uuid not null,
  channel text not null check (channel in ('call','email','whatsapp','message','system')),
  direction text not null default 'outbound' check (direction in ('inbound','outbound')),
  summary text not null,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.agency_notifications (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  title text not null,
  body text,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.operation_status_history (
  id uuid primary key default gen_random_uuid(),
  staffing_role_id uuid not null references public.staffing_roles(id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_by uuid not null references public.profiles(id),
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.client_shortlists (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  exhibitor_id uuid not null references public.exhibitors(id) on delete cascade,
  staffing_role_id uuid not null references public.staffing_roles(id) on delete cascade,
  title text not null,
  token_hash text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.client_shortlist_members (
  id uuid primary key default gen_random_uuid(),
  shortlist_id uuid not null references public.client_shortlists(id) on delete cascade,
  application_id uuid not null references public.applications(id) on delete cascade,
  shared_fields text[] not null default '{photo,name,skills,experience,languages,availability}',
  review_status text not null default 'pending_review'
    check (review_status in ('pending_review','approved','rejected','replacement_requested')),
  client_note text,
  reviewed_at timestamptz,
  unique (shortlist_id, application_id)
);

create table if not exists public.public_action_rate_limits (
  key_hash text primary key,
  attempts integer not null default 0,
  window_started_at timestamptz not null default now()
);

update public.staffing_roles set publication_status='published',published_at=coalesce(published_at,created_at)
  where status in ('open','filled');

create index if not exists agency_staff_phone_idx on public.agency_staff_contacts(agency_id, normalized_phone) where normalized_phone is not null;
create index if not exists agency_staff_email_idx on public.agency_staff_contacts(agency_id, normalized_email) where normalized_email is not null;
create index if not exists agency_staff_filters_idx on public.agency_staff_contacts(agency_id,availability_status,assignment_status,location);
create index if not exists staffing_operations_idx on public.staffing_roles(operation_status,publication_status,work_starts_on);
create index if not exists application_pipeline_idx on public.applications(staffing_role_id,status,updated_at desc);
create index if not exists recruitment_partners_agency_idx on public.recruitment_partners(agency_id,status,name);
create index if not exists agency_imports_idx on public.agency_contact_imports(agency_id,status,created_at desc);
create index if not exists agency_notifications_idx on public.agency_notifications(agency_id,read_at,created_at desc);

alter table public.agency_client_profiles enable row level security;
alter table public.recruitment_partners enable row level security;
alter table public.agency_contact_imports enable row level security;
alter table public.agency_staff_invites enable row level security;
alter table public.agency_contact_import_rows enable row level security;
alter table public.staff_information_requests enable row level security;
alter table public.agency_documents enable row level security;
alter table public.agency_communications enable row level security;
alter table public.agency_notifications enable row level security;
alter table public.operation_status_history enable row level security;
alter table public.client_shortlists enable row level security;
alter table public.client_shortlist_members enable row level security;
alter table public.public_action_rate_limits enable row level security;

revoke all on public.agency_client_profiles,public.recruitment_partners,public.agency_contact_imports,public.agency_staff_invites,
  public.agency_contact_import_rows,public.staff_information_requests,public.agency_documents,
  public.agency_communications,public.agency_notifications,public.operation_status_history,
  public.client_shortlists,public.client_shortlist_members,public.public_action_rate_limits
  from public,anon,authenticated;
grant select,insert,update,delete on public.agency_client_profiles,public.recruitment_partners,public.agency_staff_invites,
  public.agency_contact_imports,public.agency_contact_import_rows,public.staff_information_requests,
  public.agency_documents,public.agency_communications,public.agency_notifications,
  public.operation_status_history,public.client_shortlists,public.client_shortlist_members,
  public.public_action_rate_limits to service_role;

create or replace function public.guard_application_confirmation() returns trigger language plpgsql as $$
declare capacity integer; assigned_count integer; target_role public.staffing_roles%rowtype;
begin
  if new.status='assigned' and old.status is distinct from new.status then
    select * into target_role from public.staffing_roles where id=new.staffing_role_id for update;
    select count(*) into assigned_count from public.applications where staffing_role_id=new.staffing_role_id and status='assigned' and id<>new.id;
    if assigned_count>=target_role.headcount then raise exception 'Role is full'; end if;
    if exists(select 1 from public.applications a join public.staffing_roles sr on sr.id=a.staffing_role_id
      where a.talent_id=new.talent_id and a.id<>new.id and a.status='assigned'
      and sr.work_starts_on<=target_role.work_ends_on and sr.work_ends_on>=target_role.work_starts_on)
      then raise exception 'Talent is already booked on these days'; end if;
  end if;
  return new;
end $$;

create or replace function public.create_placement_from_acceptance() returns trigger
language plpgsql security definer set search_path=public as $$
declare role_rate numeric(12,2);
begin
  if new.status='assigned' and old.status is distinct from new.status then
    select coalesce(proposed_rate_min,hourly_rate) into role_rate from staffing_roles where id=new.staffing_role_id;
    insert into placements(application_id,staffing_role_id,talent_id,agreed_rate,status)
      values(new.id,new.staffing_role_id,new.talent_id,coalesce(role_rate,0),'accepted') on conflict(application_id) do nothing;
  end if;
  return new;
end $$;

create or replace function public.sync_role_fill_status() returns trigger language plpgsql security definer set search_path=public as $$
declare capacity integer; assigned_count integer;
begin
  select headcount into capacity from staffing_roles where id=new.staffing_role_id;
  select count(*) into assigned_count from applications where staffing_role_id=new.staffing_role_id and status='assigned';
  update staffing_roles set status=case when assigned_count>=capacity then 'filled' else 'open' end
    where id=new.staffing_role_id and status in ('open','filled');
  return new;
end $$;

create trigger guard_application_confirmation before update of status on public.applications
for each row execute function public.guard_application_confirmation();
create trigger on_application_accepted after update of status on public.applications
for each row execute function public.create_placement_from_acceptance();
create trigger sync_placement_on_application_change after update of status on public.applications
for each row execute function public.sync_role_fill_status();
