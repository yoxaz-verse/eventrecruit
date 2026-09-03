create extension if not exists "pgcrypto";

create type public.user_role as enum ('admin', 'agency', 'exhibitor', 'talent');
create type public.verification_status as enum ('pending_verification', 'verified', 'rejected');
create type public.application_status as enum (
  'applied',
  'shortlisted',
  'accepted',
  'rejected',
  'completed',
  'cancelled'
);
create type public.commission_type as enum ('percentage', 'fixed');
create type public.reviewee_role as enum ('talent', 'exhibitor');
create type public.review_visibility as enum ('published', 'hidden');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role public.user_role not null,
  verification_status public.verification_status not null default 'pending_verification',
  avatar_url text,
  city text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.contact_details (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  phone text,
  whatsapp text,
  alternate_email text,
  emergency_contact text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.agencies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  commission_type public.commission_type not null default 'percentage',
  commission_value numeric(10,2) not null default 10,
  verification_status public.verification_status not null default 'pending_verification',
  average_rating numeric(3,2) not null default 0,
  reliability_score integer not null default 100,
  communication_score integer not null default 100,
  professionalism_score integer not null default 100,
  completed_events integer not null default 0,
  cancellations integer not null default 0,
  disputes integer not null default 0,
  created_at timestamptz not null default now(),
  unique (owner_id)
);

create table public.exhibitors (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  agency_id uuid references public.agencies(id) on delete set null,
  company_name text not null,
  industry text,
  verification_status public.verification_status not null default 'pending_verification',
  created_at timestamptz not null default now(),
  unique (owner_id)
);

create table public.talent_profiles (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  headline text,
  bio text,
  skills text[] not null default '{}',
  languages text[] not null default '{}',
  availability text,
  experience_years numeric(4,1) not null default 0,
  documents_note text,
  trust_score integer not null default 100,
  average_rating numeric(3,2) not null default 0,
  reliability_score integer not null default 100,
  communication_score integer not null default 100,
  professionalism_score integer not null default 100,
  completed_placements integer not null default 0,
  cancellations integer not null default 0,
  no_shows integer not null default 0,
  disputes integer not null default 0
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  exhibitor_id uuid references public.exhibitors(id) on delete cascade,
  agency_id uuid references public.agencies(id) on delete set null,
  title text not null,
  venue text not null,
  city text not null,
  starts_at date not null,
  ends_at date not null,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.staffing_roles (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  title text not null,
  description text,
  headcount integer not null check (headcount > 0),
  hourly_rate numeric(10,2) not null default 0,
  shift_start time not null,
  shift_end time not null,
  required_skills text[] not null default '{}',
  status text not null default 'open' check (status in ('open', 'filled', 'closed')),
  created_at timestamptz not null default now()
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  staffing_role_id uuid not null references public.staffing_roles(id) on delete cascade,
  talent_id uuid not null references public.talent_profiles(profile_id) on delete cascade,
  cover_note text,
  status public.application_status not null default 'applied',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (staffing_role_id, talent_id)
);

create table public.placements (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null unique references public.applications(id) on delete cascade,
  staffing_role_id uuid not null references public.staffing_roles(id) on delete cascade,
  talent_id uuid not null references public.talent_profiles(profile_id) on delete cascade,
  agreed_rate numeric(10,2) not null,
  status public.application_status not null default 'accepted',
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.profile_reputation (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  role public.reviewee_role not null,
  trust_score integer not null default 100,
  average_rating numeric(3,2) not null default 0,
  reliability_score integer not null default 100,
  communication_score integer not null default 100,
  professionalism_score integer not null default 100,
  completed_count integer not null default 0,
  cancellations integer not null default 0,
  no_shows integer not null default 0,
  disputes integer not null default 0,
  updated_at timestamptz not null default now()
);

create table public.placement_reviews (
  id uuid primary key default gen_random_uuid(),
  placement_id uuid not null references public.placements(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id),
  reviewee_id uuid not null references public.profiles(id) on delete cascade,
  reviewee_role public.reviewee_role not null,
  rating integer not null check (rating between 1 and 5),
  communication_rating integer not null check (communication_rating between 1 and 5),
  professionalism_rating integer not null check (professionalism_rating between 1 and 5),
  reliability_rating integer not null check (reliability_rating between 1 and 5),
  testimonial text not null,
  visibility_status public.review_visibility not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (placement_id, reviewer_id, reviewee_id)
);

create table public.reputation_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  change_amount integer not null,
  reason text not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.commission_records (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  exhibitor_id uuid not null references public.exhibitors(id) on delete cascade,
  placement_id uuid not null references public.placements(id) on delete cascade,
  commission_type public.commission_type not null,
  commission_value numeric(10,2) not null,
  placement_value numeric(10,2) not null,
  commission_amount numeric(10,2) not null,
  status text not null default 'tracked' check (status in ('tracked', 'approved', 'disputed', 'paid_offline')),
  created_at timestamptz not null default now()
);

create table public.talent_recommendations (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  staffing_role_id uuid not null references public.staffing_roles(id) on delete cascade,
  talent_id uuid not null references public.talent_profiles(profile_id) on delete cascade,
  note text,
  status text not null default 'recommended' check (status in ('recommended', 'accepted', 'rejected', 'withdrawn')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (agency_id, staffing_role_id, talent_id)
);

create or replace function public.current_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_role() = 'admin'
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role, verification_status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', 'New user'),
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'talent'),
    case
      when coalesce(new.raw_user_meta_data ->> 'role', 'talent') = 'talent'
        then 'pending_verification'::public.verification_status
      else 'pending_verification'::public.verification_status
    end
  );

  if coalesce(new.raw_user_meta_data ->> 'role', 'talent') = 'talent' then
    insert into public.talent_profiles (profile_id) values (new.id);
    insert into public.profile_reputation (profile_id, role) values (new.id, 'talent')
    on conflict (profile_id) do nothing;
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.create_exhibitor_reputation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profile_reputation (profile_id, role)
  values (new.owner_id, 'exhibitor')
  on conflict (profile_id) do nothing;

  return new;
end;
$$;

create trigger on_exhibitor_created
  after insert on public.exhibitors
  for each row execute function public.create_exhibitor_reputation();

create or replace function public.create_placement_from_acceptance()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  role_rate numeric(10,2);
begin
  if new.status = 'accepted' and old.status is distinct from new.status then
    select hourly_rate into role_rate
    from public.staffing_roles
    where id = new.staffing_role_id;

    insert into public.placements (application_id, staffing_role_id, talent_id, agreed_rate, status)
    values (new.id, new.staffing_role_id, new.talent_id, coalesce(role_rate, 0), 'accepted')
    on conflict (application_id) do nothing;
  end if;

  return new;
end;
$$;

create trigger on_application_accepted
  after update of status on public.applications
  for each row execute function public.create_placement_from_acceptance();

create or replace function public.refresh_profile_reputation(target_profile_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_role public.user_role;
  review_role public.reviewee_role;
  rating_avg numeric(3,2);
  communication_avg integer;
  professionalism_avg integer;
  reliability_avg integer;
  completed_total integer;
  cancellations_total integer;
  no_shows_total integer;
  disputes_total integer;
  trust_total integer;
begin
  select role into target_role from public.profiles where id = target_profile_id;

  if target_role not in ('talent', 'exhibitor') then
    return;
  end if;

  review_role := target_role::text::public.reviewee_role;

  select
    coalesce(round(avg(rating)::numeric, 2), 0),
    coalesce(round(avg(communication_rating) * 20)::integer, 100),
    coalesce(round(avg(professionalism_rating) * 20)::integer, 100),
    coalesce(round(avg(reliability_rating) * 20)::integer, 100)
  into rating_avg, communication_avg, professionalism_avg, reliability_avg
  from public.placement_reviews
  where reviewee_id = target_profile_id and visibility_status = 'published';

  if target_role = 'talent' then
    select completed_placements, cancellations, no_shows, disputes
    into completed_total, cancellations_total, no_shows_total, disputes_total
    from public.talent_profiles
    where profile_id = target_profile_id;
  else
    select completed_events, cancellations, 0, disputes
    into completed_total, cancellations_total, no_shows_total, disputes_total
    from public.exhibitors
    where owner_id = target_profile_id;
  end if;

  trust_total := greatest(
    0,
    least(
      100,
      round(
        (coalesce(rating_avg, 0) * 12)
        + (coalesce(reliability_avg, 100) * 0.18)
        + (coalesce(communication_avg, 100) * 0.10)
        + (coalesce(professionalism_avg, 100) * 0.10)
        + least(coalesce(completed_total, 0), 30) * 0.4
        - coalesce(cancellations_total, 0) * 5
        - coalesce(no_shows_total, 0) * 15
        - coalesce(disputes_total, 0) * 10
      )::integer
    )
  );

  insert into public.profile_reputation (
    profile_id,
    role,
    trust_score,
    average_rating,
    reliability_score,
    communication_score,
    professionalism_score,
    completed_count,
    cancellations,
    no_shows,
    disputes
  )
  values (
    target_profile_id,
    review_role,
    trust_total,
    rating_avg,
    reliability_avg,
    communication_avg,
    professionalism_avg,
    coalesce(completed_total, 0),
    coalesce(cancellations_total, 0),
    coalesce(no_shows_total, 0),
    coalesce(disputes_total, 0)
  )
  on conflict (profile_id) do update
  set
    trust_score = excluded.trust_score,
    average_rating = excluded.average_rating,
    reliability_score = excluded.reliability_score,
    communication_score = excluded.communication_score,
    professionalism_score = excluded.professionalism_score,
    completed_count = excluded.completed_count,
    cancellations = excluded.cancellations,
    no_shows = excluded.no_shows,
    disputes = excluded.disputes,
    updated_at = now();

  if target_role = 'talent' then
    update public.talent_profiles
    set
      trust_score = trust_total,
      average_rating = rating_avg,
      reliability_score = reliability_avg,
      communication_score = communication_avg,
      professionalism_score = professionalism_avg
    where profile_id = target_profile_id;
  else
    update public.exhibitors
    set
      average_rating = rating_avg,
      reliability_score = reliability_avg,
      communication_score = communication_avg,
      professionalism_score = professionalism_avg
    where owner_id = target_profile_id;
  end if;
end;
$$;

create or replace function public.refresh_reputation_after_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.refresh_profile_reputation(new.reviewee_id);

  insert into public.reputation_events (profile_id, change_amount, reason, created_by)
  values (new.reviewee_id, 0, 'Review recalculated reputation scores', new.reviewer_id);

  return new;
end;
$$;

create trigger on_review_created
  after insert or update of rating, communication_rating, professionalism_rating, reliability_rating, visibility_status
  on public.placement_reviews
  for each row execute function public.refresh_reputation_after_review();

create or replace function public.refresh_reputation_after_placement_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  exhibitor_owner uuid;
begin
  select x.owner_id into exhibitor_owner
  from public.staffing_roles sr
  join public.events e on e.id = sr.event_id
  left join public.exhibitors x on x.id = e.exhibitor_id
  where sr.id = new.staffing_role_id;

  update public.talent_profiles
  set
    completed_placements = (
      select count(*) from public.placements
      where talent_id = new.talent_id and status = 'completed'
    ),
    cancellations = (
      select count(*) from public.placements
      where talent_id = new.talent_id and status = 'cancelled'
    )
  where profile_id = new.talent_id;

  if exhibitor_owner is not null then
    update public.exhibitors
    set
      completed_events = (
        select count(*)
        from public.placements p
        join public.staffing_roles sr on sr.id = p.staffing_role_id
        join public.events e on e.id = sr.event_id
        where e.exhibitor_id = exhibitors.id and p.status = 'completed'
      ),
      cancellations = (
        select count(*)
        from public.placements p
        join public.staffing_roles sr on sr.id = p.staffing_role_id
        join public.events e on e.id = sr.event_id
        where e.exhibitor_id = exhibitors.id and p.status = 'cancelled'
      )
    where owner_id = exhibitor_owner;
  end if;

  perform public.refresh_profile_reputation(new.talent_id);
  if exhibitor_owner is not null then
    perform public.refresh_profile_reputation(exhibitor_owner);
  end if;

  return new;
end;
$$;

create trigger on_placement_status_changed
  after insert or update of status on public.placements
  for each row execute function public.refresh_reputation_after_placement_status();

alter table public.profiles enable row level security;
alter table public.contact_details enable row level security;
alter table public.agencies enable row level security;
alter table public.exhibitors enable row level security;
alter table public.talent_profiles enable row level security;
alter table public.events enable row level security;
alter table public.staffing_roles enable row level security;
alter table public.applications enable row level security;
alter table public.placements enable row level security;
alter table public.profile_reputation enable row level security;
alter table public.placement_reviews enable row level security;
alter table public.reputation_events enable row level security;
alter table public.commission_records enable row level security;
alter table public.talent_recommendations enable row level security;

create policy "profiles read marketplace users"
on public.profiles for select
using (auth.uid() = id or public.is_admin() or verification_status = 'verified');

create policy "profiles update own profile or admin"
on public.profiles for update
using (auth.uid() = id or public.is_admin())
with check (auth.uid() = id or public.is_admin());

create policy "admins read private contact details"
on public.contact_details for select
using (public.is_admin());

create policy "users create own private contact details"
on public.contact_details for insert
with check (profile_id = auth.uid() or public.is_admin());

create policy "users update own private contact details"
on public.contact_details for update
using (profile_id = auth.uid() or public.is_admin())
with check (profile_id = auth.uid() or public.is_admin());

create policy "agencies manage own agency or admin"
on public.agencies for all
using (owner_id = auth.uid() or public.is_admin())
with check (owner_id = auth.uid() or public.is_admin());

create policy "exhibitors manage own company agency or admin"
on public.exhibitors for all
using (
  owner_id = auth.uid()
  or public.is_admin()
  or agency_id in (select id from public.agencies where owner_id = auth.uid())
)
with check (
  owner_id = auth.uid()
  or public.is_admin()
  or agency_id in (select id from public.agencies where owner_id = auth.uid())
);

create policy "verified event talent are visible"
on public.talent_profiles for select
using (
  profile_id = auth.uid()
  or public.is_admin()
  or exists (
    select 1 from public.profiles p
    where p.id = talent_profiles.profile_id and p.verification_status = 'verified'
  )
);

create policy "event talent update own staff profile"
on public.talent_profiles for update
using (profile_id = auth.uid() or public.is_admin())
with check (profile_id = auth.uid() or public.is_admin());

create policy "events readable to authenticated users"
on public.events for select
using (auth.role() = 'authenticated');

create policy "events managed by owner agency or admin"
on public.events for all
using (
  public.is_admin()
  or created_by = auth.uid()
  or agency_id in (select id from public.agencies where owner_id = auth.uid())
  or exhibitor_id in (select id from public.exhibitors where owner_id = auth.uid())
)
with check (
  public.is_admin()
  or created_by = auth.uid()
  or agency_id in (select id from public.agencies where owner_id = auth.uid())
  or exhibitor_id in (select id from public.exhibitors where owner_id = auth.uid())
);

create policy "open staffing roles readable to authenticated users"
on public.staffing_roles for select
using (auth.role() = 'authenticated');

create policy "staffing roles managed by event owners"
on public.staffing_roles for all
using (
  public.is_admin()
  or exists (
    select 1 from public.events e
    left join public.exhibitors x on x.id = e.exhibitor_id
    left join public.agencies a on a.id = e.agency_id
    where e.id = staffing_roles.event_id
      and (e.created_by = auth.uid() or x.owner_id = auth.uid() or a.owner_id = auth.uid())
  )
)
with check (
  public.is_admin()
  or exists (
    select 1 from public.events e
    left join public.exhibitors x on x.id = e.exhibitor_id
    left join public.agencies a on a.id = e.agency_id
    where e.id = staffing_roles.event_id
      and (e.created_by = auth.uid() or x.owner_id = auth.uid() or a.owner_id = auth.uid())
  )
);

create policy "applications visible to applicant and event owners"
on public.applications for select
using (
  talent_id = auth.uid()
  or public.is_admin()
  or exists (
    select 1 from public.staffing_roles sr
    join public.events e on e.id = sr.event_id
    left join public.exhibitors x on x.id = e.exhibitor_id
    left join public.agencies a on a.id = e.agency_id
    where sr.id = applications.staffing_role_id
      and (e.created_by = auth.uid() or x.owner_id = auth.uid() or a.owner_id = auth.uid())
  )
);

create policy "verified event talent can apply"
on public.applications for insert
with check (
  talent_id = auth.uid()
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'talent' and p.verification_status = 'verified'
  )
);

create policy "event owners manage application status"
on public.applications for update
using (
  public.is_admin()
  or exists (
    select 1 from public.staffing_roles sr
    join public.events e on e.id = sr.event_id
    left join public.exhibitors x on x.id = e.exhibitor_id
    left join public.agencies a on a.id = e.agency_id
    where sr.id = applications.staffing_role_id
      and (e.created_by = auth.uid() or x.owner_id = auth.uid() or a.owner_id = auth.uid())
  )
)
with check (true);

create policy "placements visible to related parties"
on public.placements for select
using (
  talent_id = auth.uid()
  or public.is_admin()
  or exists (
    select 1 from public.staffing_roles sr
    join public.events e on e.id = sr.event_id
    left join public.exhibitors x on x.id = e.exhibitor_id
    left join public.agencies a on a.id = e.agency_id
    where sr.id = placements.staffing_role_id
      and (e.created_by = auth.uid() or x.owner_id = auth.uid() or a.owner_id = auth.uid())
  )
);

create policy "event owners create placements"
on public.placements for insert
with check (
  public.is_admin()
  or exists (
    select 1 from public.staffing_roles sr
    join public.events e on e.id = sr.event_id
    left join public.exhibitors x on x.id = e.exhibitor_id
    left join public.agencies a on a.id = e.agency_id
    where sr.id = placements.staffing_role_id
      and (e.created_by = auth.uid() or x.owner_id = auth.uid() or a.owner_id = auth.uid())
  )
);

create policy "event owners update placements"
on public.placements for update
using (
  public.is_admin()
  or exists (
    select 1 from public.staffing_roles sr
    join public.events e on e.id = sr.event_id
    left join public.exhibitors x on x.id = e.exhibitor_id
    left join public.agencies a on a.id = e.agency_id
    where sr.id = placements.staffing_role_id
      and (e.created_by = auth.uid() or x.owner_id = auth.uid() or a.owner_id = auth.uid())
  )
)
with check (true);

create policy "reputation summaries visible to authenticated users"
on public.profile_reputation for select
using (auth.role() = 'authenticated');

create policy "published reviews visible to marketplace"
on public.placement_reviews for select
using (
  visibility_status = 'published'
  or reviewer_id = auth.uid()
  or reviewee_id = auth.uid()
  or public.is_admin()
);

create policy "placement counterparties create reviews"
on public.placement_reviews for insert
with check (
  exists (
    select 1
    from public.placements p
    join public.staffing_roles sr on sr.id = p.staffing_role_id
    join public.events e on e.id = sr.event_id
    left join public.exhibitors x on x.id = e.exhibitor_id
    where p.id = placement_reviews.placement_id
      and p.status = 'completed'
      and (
        (
          placement_reviews.reviewer_id = auth.uid()
          and placement_reviews.reviewer_id = p.talent_id
          and placement_reviews.reviewee_id = x.owner_id
          and placement_reviews.reviewee_role = 'exhibitor'
        )
        or (
          placement_reviews.reviewer_id = auth.uid()
          and placement_reviews.reviewer_id = x.owner_id
          and placement_reviews.reviewee_id = p.talent_id
          and placement_reviews.reviewee_role = 'talent'
        )
      )
  )
);

create policy "admins moderate reviews"
on public.placement_reviews for update
using (public.is_admin())
with check (public.is_admin());

create policy "reputation events visible to profile and admins"
on public.reputation_events for select
using (profile_id = auth.uid() or public.is_admin());

create policy "admins write reputation events"
on public.reputation_events for insert
with check (public.is_admin());

create policy "commission visible to agency exhibitor admin"
on public.commission_records for select
using (
  public.is_admin()
  or agency_id in (select id from public.agencies where owner_id = auth.uid())
  or exhibitor_id in (select id from public.exhibitors where owner_id = auth.uid())
);

create policy "agency or admin writes commission records"
on public.commission_records for all
using (
  public.is_admin()
  or agency_id in (select id from public.agencies where owner_id = auth.uid())
)
with check (
  public.is_admin()
  or agency_id in (select id from public.agencies where owner_id = auth.uid())
);

create policy "recommendations visible to agency event owner talent admin"
on public.talent_recommendations for select
using (
  public.is_admin()
  or talent_id = auth.uid()
  or agency_id in (select id from public.agencies where owner_id = auth.uid())
  or exists (
    select 1 from public.staffing_roles sr
    join public.events e on e.id = sr.event_id
    left join public.exhibitors x on x.id = e.exhibitor_id
    where sr.id = talent_recommendations.staffing_role_id
      and (e.created_by = auth.uid() or x.owner_id = auth.uid())
  )
);

create policy "agencies recommend verified talent"
on public.talent_recommendations for insert
with check (
  agency_id in (select id from public.agencies where owner_id = auth.uid())
  and exists (
    select 1 from public.profiles p
    where p.id = talent_id and p.role = 'talent' and p.verification_status = 'verified'
  )
);

create policy "agencies and event owners update recommendations"
on public.talent_recommendations for update
using (
  public.is_admin()
  or agency_id in (select id from public.agencies where owner_id = auth.uid())
  or exists (
    select 1 from public.staffing_roles sr
    join public.events e on e.id = sr.event_id
    left join public.exhibitors x on x.id = e.exhibitor_id
    where sr.id = talent_recommendations.staffing_role_id
      and (e.created_by = auth.uid() or x.owner_id = auth.uid())
  )
)
with check (true);
