import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(new URL("../supabase/migrations/028_auth_performance.sql", import.meta.url), "utf8");
const actions = readFileSync(new URL("../src/app/actions/auth.ts", import.meta.url), "utf8");

test("optimized signup is atomic, serialized by email, and service-role only", () => {
  assert.match(migration, /create or replace function public\.prepare_app_signup/);
  assert.match(migration, /pg_advisory_xact_lock\(hashtextextended\('app-signup:' \|\| p_email/);
  assert.match(migration, /insert into public\.app_accounts/);
  assert.match(migration, /insert into public\.profiles/);
  assert.match(migration, /insert into public\.talent_profiles/);
  assert.match(migration, /insert into public\.profile_reputation/);
  assert.match(migration, /insert into public\.verification_requests/);
  assert.match(migration, /revoke all on function public\.prepare_app_signup[\s\S]*from public, anon, authenticated/);
  assert.match(migration, /grant execute on function public\.prepare_app_signup[\s\S]*to service_role/);
});

test("signup and resend prepare an OTP in one RPC before confirmed delivery", () => {
  const preparation = readFileSync(new URL("../src/lib/app-auth/otp-preparation.ts", import.meta.url), "utf8");
  assert.match(preparation, /client\.rpc\("prepare_app_signup"/);
  assert.match(preparation, /client\.rpc\("prepare_existing_app_otp"/);
  assert.match(preparation, /await sendAuthEmail\(email, code, prepared\.purpose\)/);
  assert.match(preparation, /app_otp_challenges/);
  assert.match(actions, /measure\("database_preparation"/);
  assert.match(actions, /measure\("email_delivery"/);
});

test("OTP verification and session creation share one transaction with legacy-code compatibility", () => {
  assert.match(migration, /create or replace function public\.verify_app_otp_and_create_session/);
  assert.match(migration, /v\.code_hash <> p_hash and v\.code_hash <> p_legacy_hash/);
  assert.match(migration, /update public\.app_accounts set email_verified_at/);
  assert.match(migration, /insert into public\.app_sessions/);
  assert.match(actions, /measure\("verification_and_session"/);
  assert.match(actions, /onboardingPath\(verifiedRole\)/);
});

test("auth performance logs contain stages but no authentication payloads", () => {
  const performance = readFileSync(new URL("../src/lib/app-auth/performance.ts", import.meta.url), "utf8");
  assert.match(performance, /event: "auth_performance"/);
  assert.match(performance, /stages_ms: stages/);
  for (const sensitive of ["email", "password", "token", "code"]) {
    assert.doesNotMatch(performance, new RegExp(`${sensitive}:`));
  }
});
