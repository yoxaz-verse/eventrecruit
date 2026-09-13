-- Fresh-start migration. This intentionally removes legacy Supabase Auth-linked
-- portal records; run only after reviewing the data-loss decision.
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists guard_signup_role on auth.users;
drop trigger if exists guard_profile_role on public.profiles;

truncate table public.profiles cascade;
delete from auth.users;

create table public.app_accounts (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email = lower(trim(email))),
  password_hash text not null,
  email_verified_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.profiles drop constraint if exists profiles_id_fkey;
alter table public.profiles add constraint profiles_app_account_fkey
  foreign key (id) references public.app_accounts(id) on delete cascade;

create table public.app_otp_challenges (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.app_accounts(id) on delete cascade,
  purpose text not null check (purpose in ('signup','activation','login','recovery')),
  code_hash text not null check (code_hash ~ '^[a-f0-9]{64}$'),
  expires_at timestamptz not null,
  attempts integer not null default 0 check (attempts between 0 and 5),
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);
create index app_otp_account_purpose on public.app_otp_challenges(account_id,purpose,created_at desc);

create table public.app_sessions (
  token_hash text primary key check (token_hash ~ '^[a-f0-9]{64}$'),
  account_id uuid not null references public.app_accounts(id) on delete cascade,
  purpose text not null check (purpose in ('session','reset')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index app_sessions_account on public.app_sessions(account_id);
grant all on public.app_accounts, public.app_otp_challenges, public.app_sessions to service_role;

-- The only OTP mutation in SQL is an atomic compare-and-consume operation.
-- Code creation, hashing, timing, policy and resulting auth state live in Next.js.
create function public.consume_app_otp(p_account uuid, p_purpose text, p_hash text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare v public.app_otp_challenges%rowtype;
begin
  select * into v from public.app_otp_challenges
  where account_id=p_account and purpose=p_purpose
  order by created_at desc, id desc limit 1 for update;
  if not found or v.consumed_at is not null or v.expires_at <= now() or v.attempts >= 5 then return false; end if;
  if v.code_hash <> p_hash then
    update public.app_otp_challenges set attempts=attempts+1 where id=v.id;
    return false;
  end if;
  update public.app_otp_challenges set consumed_at=now() where id=v.id;
  return true;
end; $$;

alter table public.app_accounts enable row level security;
alter table public.app_otp_challenges enable row level security;
alter table public.app_sessions enable row level security;
revoke all on public.app_accounts, public.app_otp_challenges, public.app_sessions from public, anon, authenticated;
revoke all on function public.consume_app_otp(uuid,text,text) from public, anon, authenticated;
grant execute on function public.consume_app_otp(uuid,text,text) to service_role;

-- Existing RLS policies use Supabase Auth claims. The app now queries only
-- through a server-only service client and performs authorization in Next.js.
-- Remove browser/API access to every portal table.
do $$ declare t text; p record; begin
  foreach t in array array[
    'profiles','contact_details','agencies','exhibitors','talent_profiles',
    'events','staffing_roles','applications','placements','placement_reviews',
    'talent_recommendations','organizer_companies','organizer_events',
    'profile_reputation','reputation_events','commission_records','auth_email_rate_limits'
  ] loop
    if to_regclass('public.'||t) is not null then
      execute format('revoke all on public.%I from public, anon, authenticated', t);
      for p in select policyname from pg_policies where schemaname='public' and tablename=t loop
        execute format('drop policy %I on public.%I', p.policyname, t);
      end loop;
    end if;
  end loop;
end $$;
