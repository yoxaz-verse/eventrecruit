create table public.auth_password_rate_limits (
  id bigint generated always as identity primary key,
  email_hash text not null check (email_hash ~ '^[a-f0-9]{64}$'),
  ip_hash text not null check (ip_hash ~ '^[a-f0-9]{64}$'),
  attempted_at timestamptz not null default now()
);
create index auth_password_rate_limits_email_time on public.auth_password_rate_limits (email_hash, attempted_at desc);
create index auth_password_rate_limits_ip_time on public.auth_password_rate_limits (ip_hash, attempted_at desc);
create index auth_password_rate_limits_cleanup on public.auth_password_rate_limits (attempted_at);
alter table public.auth_password_rate_limits enable row level security;
revoke all on public.auth_password_rate_limits from public, anon, authenticated;
grant all on public.auth_password_rate_limits to service_role;
grant usage, select on sequence public.auth_password_rate_limits_id_seq to service_role;

create function public.consume_auth_password_rate_limit(p_email_hash text, p_ip_hash text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_now timestamptz := clock_timestamp();
  v_oldest timestamptz;
  v_count integer;
  v_retry integer;
begin
  if p_email_hash !~ '^[a-f0-9]{64}$' or p_ip_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'Invalid rate-limit key';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('auth-password-email:' || p_email_hash, 0));
  perform pg_advisory_xact_lock(hashtextextended('auth-password-ip:' || p_ip_hash, 0));

  select count(*), min(attempted_at) into v_count, v_oldest
  from public.auth_password_rate_limits
  where email_hash = p_email_hash and attempted_at > v_now - interval '15 minutes';
  if v_count >= 5 then
    v_retry := greatest(1, ceil(extract(epoch from (v_oldest + interval '15 minutes' - v_now)))::integer);
    return jsonb_build_object('allowed', false, 'retry_after_seconds', v_retry);
  end if;

  select count(*), min(attempted_at) into v_count, v_oldest
  from public.auth_password_rate_limits
  where ip_hash = p_ip_hash and attempted_at > v_now - interval '15 minutes';
  if v_count >= 30 then
    v_retry := greatest(1, ceil(extract(epoch from (v_oldest + interval '15 minutes' - v_now)))::integer);
    return jsonb_build_object('allowed', false, 'retry_after_seconds', v_retry);
  end if;

  insert into public.auth_password_rate_limits (email_hash, ip_hash, attempted_at)
  values (p_email_hash, p_ip_hash, v_now);
  delete from public.auth_password_rate_limits where attempted_at < v_now - interval '24 hours';
  return jsonb_build_object('allowed', true, 'retry_after_seconds', 0);
end; $$;
revoke all on function public.consume_auth_password_rate_limit(text, text) from public, anon, authenticated;
grant execute on function public.consume_auth_password_rate_limit(text, text) to service_role;
