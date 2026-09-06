create table public.organizer_companies (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null unique references public.profiles(id),
 name text not null check (length(trim(name)) between 2 and 160),
 city text not null check (length(trim(city)) between 1 and 120),
 description text not null check (length(trim(description)) between 1 and 5000),
 website text not null default '' check (website = '' or website ~ '^https?://'),
 created_at timestamptz not null default now()
);
create table public.organizer_events (
 id uuid primary key default gen_random_uuid(),
 company_id uuid not null references public.organizer_companies(id),
 title text not null check (length(trim(title)) between 1 and 160),
 description text not null default '' check (length(description) <= 10000),
 venue text not null default '' check (length(venue) <= 200),
 city text not null default '' check (length(city) <= 120),
 starts_at date,
 ends_at date,
 status text not null default 'draft' check (status in ('draft','published','cancelled')),
 published_at timestamptz,
 created_at timestamptz not null default now(),
 check (ends_at >= starts_at),
 check (status <> 'published' or (starts_at is not null and ends_at is not null and length(trim(description)) > 0 and length(trim(venue)) > 0 and length(trim(city)) > 0))
);
create index organizer_events_company on public.organizer_events(company_id);
create index organizer_events_directory on public.organizer_events(status, starts_at, ends_at);

create function public.owns_organizer_company(company uuid) returns boolean
language sql stable security definer set search_path = public as $$
 select exists(select 1 from organizer_companies where id = company and owner_id = auth.uid());
$$;
create function public.verified_organizer() returns boolean
language sql stable security definer set search_path = public as $$
 select exists(select 1 from auth.users u join profiles p on p.id = u.id
 where u.id = auth.uid() and u.email_confirmed_at is not null and p.role = 'organizer');
$$;
alter table public.organizer_companies enable row level security;
alter table public.organizer_events enable row level security;
create policy "public company information" on public.organizer_companies for select using (true);
create policy "organizer creates company" on public.organizer_companies for insert with check (owner_id = auth.uid() and public.verified_organizer());
create policy "owner updates company" on public.organizer_companies for update using (owner_id = auth.uid() or public.is_admin()) with check (owner_id = auth.uid() or public.is_admin());
create policy "event visibility" on public.organizer_events for select using (status = 'published' or (status = 'cancelled' and published_at is not null) or public.owns_organizer_company(company_id) or public.is_admin());
create policy "create own event" on public.organizer_events for insert with check ((public.verified_organizer() and public.owns_organizer_company(company_id)) or public.is_admin());
create policy "update own event" on public.organizer_events for update using ((public.verified_organizer() and public.owns_organizer_company(company_id)) or public.is_admin()) with check ((public.verified_organizer() and public.owns_organizer_company(company_id)) or public.is_admin());
-- Public API exposes only public company columns, never account identifiers.
revoke select on public.organizer_companies from anon;
grant select (id, name, city, description, website) on public.organizer_companies to anon;
grant select on public.organizer_events to anon;
grant select, insert, update on public.organizer_companies, public.organizer_events to authenticated;

create function public.guard_organizer_event() returns trigger language plpgsql as $$
begin
 if TG_OP = 'UPDATE' and new.company_id <> old.company_id then raise exception 'Event ownership cannot change'; end if;
 if TG_OP = 'INSERT' then new.published_at := null; else new.published_at := old.published_at; end if;
 if new.status = 'published' and new.published_at is null then new.published_at := now(); end if;
 return new;
end;
$$;
create trigger guard_organizer_event before insert or update on public.organizer_events for each row execute function public.guard_organizer_event();
create function public.guard_profile_role() returns trigger language plpgsql set search_path = public as $$
begin
 if TG_OP = 'INSERT' and new.role = 'admin' and current_user not in ('postgres', 'supabase_admin') then raise exception 'Admin registration is disabled'; end if;
 if TG_OP = 'UPDATE' and (new.role <> old.role or new.verification_status <> old.verification_status) and auth.uid() is not null and not public.is_admin() then raise exception 'Only administrators can change account permissions'; end if;
 return new;
end;
$$;
create trigger guard_profile_role before insert or update on public.profiles for each row execute function public.guard_profile_role();
-- Reject privileged signup metadata before the existing security-definer profile trigger runs.
create function public.guard_signup_role() returns trigger language plpgsql as $$
begin
 if current_user not in ('postgres', 'supabase_admin') and coalesce(new.raw_user_meta_data->>'role', 'talent') not in ('talent','agency','exhibitor','organizer') then raise exception 'Invalid signup account type'; end if;
 return new;
end;
$$;
create trigger guard_signup_role before insert on auth.users for each row execute function public.guard_signup_role();
