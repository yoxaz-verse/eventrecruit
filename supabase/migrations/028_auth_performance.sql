-- Collapse authentication setup into transactional database calls. These
-- functions are intentionally service-role only; public clients must never be
-- able to create accounts, OTP challenges, or consume rate-limit capacity.

create or replace function public.prepare_app_signup(
  p_email text,
  p_email_hash text,
  p_ip_hash text,
  p_password_hash text,
  p_full_name text,
  p_role text,
  p_code_hash text,
  p_activation_code_hash text,
  p_expires_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_account public.app_accounts%rowtype;
  v_profile public.profiles%rowtype;
  v_limit jsonb;
  v_challenge_id uuid;
  v_status text;
begin
  if p_email <> lower(trim(p_email)) or length(p_email) > 254 then
    return jsonb_build_object('status', 'invalid');
  end if;
  if p_role not in ('talent', 'agency', 'exhibitor', 'organizer') then
    return jsonb_build_object('status', 'invalid');
  end if;
  if p_email_hash !~ '^[a-f0-9]{64}$' or p_ip_hash !~ '^[a-f0-9]{64}$'
     or p_code_hash !~ '^[a-f0-9]{64}$' or p_activation_code_hash !~ '^[a-f0-9]{64}$'
     or p_expires_at <= now() then
    return jsonb_build_object('status', 'invalid');
  end if;

  perform pg_advisory_xact_lock(hashtextextended('app-signup:' || p_email, 0));
  select * into v_account from public.app_accounts where email = p_email;

  if found and v_account.disabled_at is not null then
    return jsonb_build_object('status', 'disabled');
  end if;
  if found and v_account.email_verified_at is not null then
    return jsonb_build_object('status', 'already_verified');
  end if;
  if found then
    select * into v_profile from public.profiles where id = v_account.id;
    if not found then
      raise exception 'Pending account profile is missing';
    end if;
    if v_profile.role::text <> p_role then
      return jsonb_build_object('status', 'role_conflict');
    end if;
  end if;

  select public.consume_auth_email_rate_limit(p_email_hash, p_ip_hash) into v_limit;
  if not coalesce((v_limit->>'allowed')::boolean, false) then
    return jsonb_build_object(
      'status', 'rate_limited',
      'retry_after_seconds', greatest(1, coalesce((v_limit->>'retry_after_seconds')::integer, 60))
    );
  end if;

  if v_account.id is null then
    insert into public.app_accounts(email, password_hash)
      values (p_email, p_password_hash) returning * into v_account;
    insert into public.profiles(id, full_name, role)
      values (v_account.id, p_full_name, p_role::public.user_role);

    if p_role = 'talent' then
      insert into public.talent_profiles(profile_id) values (v_account.id);
      insert into public.profile_reputation(profile_id, role)
        values (v_account.id, 'talent');
    else
      insert into public.verification_requests(
        entity_type, entity_id, requester_id, status, notes
      ) values (
        'account', v_account.id, v_account.id, 'pending',
        'New ' || p_role || ' account verification'
      );
    end if;
    v_status := 'created';
  else
    update public.app_accounts set password_hash = p_password_hash where id = v_account.id;
    v_status := 'activation';
  end if;

  update public.app_otp_challenges set consumed_at = now()
    where account_id = v_account.id and consumed_at is null;
  insert into public.app_otp_challenges(account_id, purpose, code_hash, expires_at)
    values (
      v_account.id,
      case when v_status = 'created' then 'signup' else 'activation' end,
      case when v_status = 'created' then p_code_hash else p_activation_code_hash end,
      p_expires_at
    ) returning id into v_challenge_id;

  return jsonb_build_object(
    'status', v_status,
    'account_id', v_account.id,
    'challenge_id', v_challenge_id,
    'purpose', case when v_status = 'created' then 'signup' else 'activation' end,
    'role', p_role
  );
end;
$$;

create or replace function public.prepare_existing_app_otp(
  p_email text,
  p_email_hash text,
  p_ip_hash text,
  p_purpose text,
  p_code_hash text,
  p_expires_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_account public.app_accounts%rowtype;
  v_limit jsonb;
  v_challenge_id uuid;
begin
  if p_purpose not in ('activation', 'login', 'recovery')
     or p_email_hash !~ '^[a-f0-9]{64}$' or p_ip_hash !~ '^[a-f0-9]{64}$'
     or p_code_hash !~ '^[a-f0-9]{64}$' or p_expires_at <= now() then
    return jsonb_build_object('status', 'invalid');
  end if;

  perform pg_advisory_xact_lock(hashtextextended('app-otp:' || p_email, 0));
  select * into v_account from public.app_accounts where email = p_email;
  if not found then return jsonb_build_object('status', 'not_registered'); end if;
  if v_account.disabled_at is not null then return jsonb_build_object('status', 'disabled'); end if;
  if p_purpose = 'activation' and v_account.email_verified_at is not null then
    return jsonb_build_object('status', 'already_verified');
  end if;
  if p_purpose <> 'activation' and v_account.email_verified_at is null then
    return jsonb_build_object('status', 'not_verified');
  end if;

  select public.consume_auth_email_rate_limit(p_email_hash, p_ip_hash) into v_limit;
  if not coalesce((v_limit->>'allowed')::boolean, false) then
    return jsonb_build_object(
      'status', 'rate_limited',
      'retry_after_seconds', greatest(1, coalesce((v_limit->>'retry_after_seconds')::integer, 60))
    );
  end if;

  update public.app_otp_challenges set consumed_at = now()
    where account_id = v_account.id and consumed_at is null;
  insert into public.app_otp_challenges(account_id, purpose, code_hash, expires_at)
    values (v_account.id, p_purpose, p_code_hash, p_expires_at)
    returning id into v_challenge_id;

  return jsonb_build_object(
    'status', 'ready',
    'account_id', v_account.id,
    'challenge_id', v_challenge_id,
    'purpose', p_purpose
  );
end;
$$;

revoke all on function public.prepare_app_signup(text,text,text,text,text,text,text,text,timestamptz)
  from public, anon, authenticated;
revoke all on function public.prepare_existing_app_otp(text,text,text,text,text,timestamptz)
  from public, anon, authenticated;
grant execute on function public.prepare_app_signup(text,text,text,text,text,text,text,text,timestamptz)
  to service_role;
grant execute on function public.prepare_existing_app_otp(text,text,text,text,text,timestamptz)
  to service_role;

-- Accept the email-bound digest used by the optimized flow and the previous
-- account-bound digest so codes issued immediately before deployment continue
-- to verify normally.
create or replace function public.consume_app_otp_v2(
  p_account uuid,
  p_purpose text,
  p_hash text,
  p_legacy_hash text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare v public.app_otp_challenges%rowtype;
begin
  select * into v from public.app_otp_challenges
  where account_id = p_account and purpose = p_purpose
  order by created_at desc, id desc limit 1 for update;
  if not found or v.consumed_at is not null or v.expires_at <= now() or v.attempts >= 5 then
    return false;
  end if;
  if v.code_hash <> p_hash and v.code_hash <> p_legacy_hash then
    update public.app_otp_challenges set attempts = attempts + 1 where id = v.id;
    return false;
  end if;
  update public.app_otp_challenges set consumed_at = now() where id = v.id;
  return true;
end;
$$;

revoke all on function public.consume_app_otp_v2(uuid,text,text,text)
  from public, anon, authenticated;
grant execute on function public.consume_app_otp_v2(uuid,text,text,text)
  to service_role;

create or replace function public.verify_app_otp_and_create_session(
  p_account uuid,
  p_purpose text,
  p_hash text,
  p_legacy_hash text,
  p_token_hash text,
  p_session_purpose text,
  p_session_expires_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v public.app_otp_challenges%rowtype;
  v_role text;
begin
  if p_purpose not in ('signup', 'activation', 'login', 'recovery')
     or p_session_purpose not in ('session', 'reset')
     or (p_purpose = 'recovery') <> (p_session_purpose = 'reset')
     or p_token_hash !~ '^[a-f0-9]{64}$'
     or p_session_expires_at <= now() then
    return jsonb_build_object('verified', false);
  end if;
  if not exists (
    select 1 from public.app_accounts where id = p_account and disabled_at is null
  ) then return jsonb_build_object('verified', false); end if;

  select * into v from public.app_otp_challenges
  where account_id = p_account and purpose = p_purpose
  order by created_at desc, id desc limit 1 for update;
  if not found or v.consumed_at is not null or v.expires_at <= now() or v.attempts >= 5 then
    return jsonb_build_object('verified', false);
  end if;
  if v.code_hash <> p_hash and v.code_hash <> p_legacy_hash then
    update public.app_otp_challenges set attempts = attempts + 1 where id = v.id;
    return jsonb_build_object('verified', false);
  end if;

  update public.app_otp_challenges set consumed_at = now() where id = v.id;
  if p_purpose in ('signup', 'activation') then
    update public.app_accounts set email_verified_at = coalesce(email_verified_at, now())
      where id = p_account;
  end if;
  insert into public.app_sessions(token_hash, account_id, purpose, expires_at)
    values (p_token_hash, p_account, p_session_purpose, p_session_expires_at);
  select role::text into v_role from public.profiles where id = p_account;
  return jsonb_build_object('verified', true, 'role', v_role);
end;
$$;

revoke all on function public.verify_app_otp_and_create_session(uuid,text,text,text,text,text,timestamptz)
  from public, anon, authenticated;
grant execute on function public.verify_app_otp_and_create_session(uuid,text,text,text,text,text,timestamptz)
  to service_role;
