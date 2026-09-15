-- Agency-managed exhibitor workspaces. Portal access remains server-only.
create type public.exhibitor_kind as enum ('platform','external');
create type public.agency_exhibitor_relationship_status as enum ('pending','active','declined','revoked');

alter table public.exhibitors
  add column kind public.exhibitor_kind not null default 'platform',
  add column created_by_agency_id uuid references public.agencies(id) on delete restrict,
  add column claim_email text,
  add column claimed_at timestamptz;
alter table public.exhibitors alter column owner_id drop not null;
create unique index exhibitors_external_claim_email on public.exhibitors(lower(claim_email))
  where kind='external' and claim_email is not null and owner_id is null;
alter table public.exhibitors add constraint exhibitors_identity_check check (
  (kind='platform' and owner_id is not null) or
  (kind='external' and created_by_agency_id is not null)
);
alter table public.exhibitors add constraint exhibitors_claim_email_normalized check (
  claim_email is null or claim_email=lower(trim(claim_email))
);

create table public.agency_exhibitor_relationships (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  exhibitor_id uuid not null references public.exhibitors(id) on delete cascade,
  status public.agency_exhibitor_relationship_status not null default 'pending',
  invited_email text,
  invited_by uuid not null references public.profiles(id),
  responded_by uuid references public.profiles(id),
  responded_at timestamptz,
  revoked_by uuid references public.profiles(id),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(agency_id, exhibitor_id),
  check(invited_email is null or invited_email=lower(trim(invited_email)))
);
create index agency_exhibitor_relationships_agency on public.agency_exhibitor_relationships(agency_id,status);
create index agency_exhibitor_relationships_exhibitor on public.agency_exhibitor_relationships(exhibitor_id,status);

insert into public.agency_exhibitor_relationships(agency_id,exhibitor_id,status,invited_by,responded_by,responded_at)
select x.agency_id,x.id,'active',a.owner_id,x.owner_id,now()
from public.exhibitors x join public.agencies a on a.id=x.agency_id
where x.agency_id is not null
on conflict(agency_id,exhibitor_id) do nothing;
alter table public.exhibitors drop column agency_id;

alter table public.events add column actor_id uuid references public.profiles(id);
update public.events set actor_id=created_by where actor_id is null;
alter table public.events alter column actor_id set not null;

alter table public.exhibitor_event_submissions add column actor_id uuid references public.profiles(id);
update public.exhibitor_event_submissions s set actor_id=x.owner_id
from public.exhibitors x where x.id=s.exhibitor_id and s.actor_id is null;
alter table public.exhibitor_event_submissions alter column actor_id set not null;

alter table public.event_space_inquiries drop constraint if exists event_space_inquiries_exhibitor_id_fkey;
update public.event_space_inquiries i set exhibitor_id=x.id
from public.exhibitors x where x.owner_id=i.exhibitor_id;
alter table public.event_space_inquiries add constraint event_space_inquiries_exhibitor_id_fkey
  foreign key(exhibitor_id) references public.exhibitors(id) on delete cascade;
alter table public.event_space_inquiries add column actor_id uuid references public.profiles(id);
update public.event_space_inquiries i set actor_id=x.owner_id
from public.exhibitors x where x.id=i.exhibitor_id and i.actor_id is null;
alter table public.event_space_inquiries alter column actor_id set not null;

create table public.exhibitor_reputation (
  exhibitor_id uuid primary key references public.exhibitors(id) on delete cascade,
  trust_score integer not null default 100,
  average_rating numeric(3,2) not null default 0,
  reliability_score integer not null default 100,
  communication_score integer not null default 100,
  professionalism_score integer not null default 100,
  completed_count integer not null default 0,
  cancellations integer not null default 0,
  disputes integer not null default 0,
  updated_at timestamptz not null default now()
);
insert into public.exhibitor_reputation(exhibitor_id,trust_score,average_rating,reliability_score,communication_score,professionalism_score,completed_count,cancellations,disputes,updated_at)
select x.id,r.trust_score,r.average_rating,r.reliability_score,r.communication_score,r.professionalism_score,r.completed_count,r.cancellations,r.disputes,r.updated_at
from public.exhibitors x join public.profile_reputation r on r.profile_id=x.owner_id
on conflict(exhibitor_id) do nothing;
insert into public.exhibitor_reputation(exhibitor_id) select id from public.exhibitors on conflict do nothing;

create or replace function public.create_exhibitor_reputation()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.owner_id is not null then
    insert into public.profile_reputation(profile_id,role) values(new.owner_id,'exhibitor') on conflict(profile_id) do nothing;
  end if;
  insert into public.exhibitor_reputation(exhibitor_id) values(new.id) on conflict(exhibitor_id) do nothing;
  return new;
end $$;

alter table public.placement_reviews
  add column reviewer_exhibitor_id uuid references public.exhibitors(id) on delete cascade,
  add column reviewee_exhibitor_id uuid references public.exhibitors(id) on delete cascade,
  add column actor_id uuid references public.profiles(id);
update public.placement_reviews set actor_id=reviewer_id where actor_id is null;
update public.placement_reviews r set reviewer_exhibitor_id=x.id
from public.exhibitors x where x.owner_id=r.reviewer_id and r.reviewee_role='talent';
update public.placement_reviews r set reviewee_exhibitor_id=x.id
from public.exhibitors x where x.owner_id=r.reviewee_id and r.reviewee_role='exhibitor';
create unique index placement_reviews_exhibitor_principal_unique
  on public.placement_reviews(placement_id,reviewer_exhibitor_id,reviewee_id)
  where reviewer_exhibitor_id is not null;

create or replace function public.refresh_exhibitor_entity_reputation(target_exhibitor_id uuid)
returns void language plpgsql security definer set search_path=public as $$
declare rating_avg numeric(3,2); communication_avg integer; professionalism_avg integer; reliability_avg integer; completed_total integer;
begin
  select coalesce(round(avg(rating)::numeric,2),0),coalesce(round(avg(communication_rating)*20)::integer,100),
    coalesce(round(avg(professionalism_rating)*20)::integer,100),coalesce(round(avg(reliability_rating)*20)::integer,100)
  into rating_avg,communication_avg,professionalism_avg,reliability_avg
  from public.placement_reviews where reviewee_exhibitor_id=target_exhibitor_id and visibility_status='published';
  select count(*) into completed_total from public.placements p join public.staffing_roles r on r.id=p.staffing_role_id
    join public.events e on e.id=r.event_id where e.exhibitor_id=target_exhibitor_id and p.status='completed';
  insert into public.exhibitor_reputation(exhibitor_id,trust_score,average_rating,reliability_score,communication_score,professionalism_score,completed_count,updated_at)
  values(target_exhibitor_id,greatest(0,least(100,round(rating_avg*12+reliability_avg*.18+communication_avg*.10+professionalism_avg*.10+least(completed_total,30)*.4)::integer)),rating_avg,reliability_avg,communication_avg,professionalism_avg,completed_total,now())
  on conflict(exhibitor_id) do update set trust_score=excluded.trust_score,average_rating=excluded.average_rating,reliability_score=excluded.reliability_score,communication_score=excluded.communication_score,professionalism_score=excluded.professionalism_score,completed_count=excluded.completed_count,updated_at=now();
end $$;

create or replace function public.refresh_reputation_after_review()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.reviewee_exhibitor_id is not null then
    perform public.refresh_exhibitor_entity_reputation(new.reviewee_exhibitor_id);
  elsif new.reviewee_id is not null then
    perform public.refresh_profile_reputation(new.reviewee_id);
    insert into public.reputation_events(profile_id,change_amount,reason,created_by)
      values(new.reviewee_id,0,'Review recalculated reputation scores',new.actor_id);
  end if;
  return new;
end $$;

create or replace function public.refresh_exhibitor_reputation_after_placement()
returns trigger language plpgsql security definer set search_path=public as $$
declare target_exhibitor uuid;
begin
  select e.exhibitor_id into target_exhibitor from public.staffing_roles r join public.events e on e.id=r.event_id where r.id=new.staffing_role_id;
  if target_exhibitor is not null then perform public.refresh_exhibitor_entity_reputation(target_exhibitor); end if;
  return new;
end $$;
create trigger on_placement_entity_reputation after insert or update of status on public.placements
for each row execute function public.refresh_exhibitor_reputation_after_placement();

alter table public.agency_exhibitor_relationships enable row level security;
alter table public.exhibitor_reputation enable row level security;
revoke all on public.agency_exhibitor_relationships, public.exhibitor_reputation from public, anon, authenticated;
grant select,insert,update on public.agency_exhibitor_relationships to service_role;
grant select,insert,update on public.exhibitor_reputation to service_role;
