create table public.auth_email_rate_limits (
  id bigint generated always as identity primary key,
  email_hash text not null check (email_hash ~ '^[a-f0-9]{64}$'),
  ip_hash text not null check (ip_hash ~ '^[a-f0-9]{64}$'),
  requested_at timestamptz not null default now()
);

create index auth_email_rate_limits_email_time
  on public.auth_email_rate_limits (email_hash, requested_at desc);
create index auth_email_rate_limits_ip_time
  on public.auth_email_rate_limits (ip_hash, requested_at desc);
create index auth_email_rate_limits_cleanup
  on public.auth_email_rate_limits (requested_at);

alter table public.auth_email_rate_limits enable row level security;
revoke all on public.auth_email_rate_limits from public, anon, authenticated;

create or replace function public.auth_user_exists(p_email text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from auth.users
    where lower(email) = lower(trim(p_email))
  );
$$;

create or replace function public.consume_auth_email_rate_limit(
  p_email_hash text,
  p_ip_hash text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_last timestamptz;
  v_oldest timestamptz;
  v_count integer;
  v_retry integer;
begin
  if p_email_hash !~ '^[a-f0-9]{64}$' or p_ip_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'Invalid rate-limit key';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('auth-email:' || p_email_hash, 0));
  perform pg_advisory_xact_lock(hashtextextended('auth-ip:' || p_ip_hash, 0));

  select max(requested_at) into v_last
  from public.auth_email_rate_limits
  where email_hash = p_email_hash;

  if v_last is not null and v_last > v_now - interval '60 seconds' then
    v_retry := greatest(1, ceil(extract(epoch from (v_last + interval '60 seconds' - v_now)))::integer);
    return jsonb_build_object('allowed', false, 'retry_after_seconds', v_retry);
  end if;

  select count(*), min(requested_at) into v_count, v_oldest
  from public.auth_email_rate_limits
  where email_hash = p_email_hash and requested_at > v_now - interval '1 hour';

  if v_count >= 5 then
    v_retry := greatest(1, ceil(extract(epoch from (v_oldest + interval '1 hour' - v_now)))::integer);
    return jsonb_build_object('allowed', false, 'retry_after_seconds', v_retry);
  end if;

  select count(*), min(requested_at) into v_count, v_oldest
  from public.auth_email_rate_limits
  where ip_hash = p_ip_hash and requested_at > v_now - interval '1 hour';

  if v_count >= 20 then
    v_retry := greatest(1, ceil(extract(epoch from (v_oldest + interval '1 hour' - v_now)))::integer);
    return jsonb_build_object('allowed', false, 'retry_after_seconds', v_retry);
  end if;

  insert into public.auth_email_rate_limits (email_hash, ip_hash, requested_at)
  values (p_email_hash, p_ip_hash, v_now);

  delete from public.auth_email_rate_limits
  where requested_at < v_now - interval '24 hours';

  return jsonb_build_object('allowed', true, 'retry_after_seconds', 0);
end;
$$;

revoke all on function public.auth_user_exists(text) from public, anon, authenticated;
revoke all on function public.consume_auth_email_rate_limit(text, text) from public, anon, authenticated;
grant execute on function public.auth_user_exists(text) to service_role;
grant execute on function public.consume_auth_email_rate_limit(text, text) to service_role;
