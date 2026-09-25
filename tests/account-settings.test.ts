import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { existingEmailError } from "../src/lib/app-auth/email-eligibility";

test("disabled accounts are rejected for login and recovery eligibility", () => {
  const disabled = { email_verified_at: new Date().toISOString(), disabled_at: new Date().toISOString() };
  assert.match(existingEmailError("login", disabled) ?? "", /disabled/i);
  assert.match(existingEmailError("recovery", disabled) ?? "", /disabled/i);
});

test("every dashboard role exposes profile and settings navigation", () => {
  const source = readFileSync(new URL("../src/lib/navigation.ts", import.meta.url), "utf8");
  for (const role of ["admin", "organizer", "agency", "exhibitor", "talent"]) {
    assert.match(source, new RegExp(`/dashboard/${role}/profile`));
    assert.match(source, new RegExp(`/dashboard/${role}/settings`));
  }
});

test("account settings migration retains records during reviewed deactivation", () => {
  const migration = readFileSync(new URL("../supabase/migrations/025_account_profiles_and_settings.sql", import.meta.url), "utf8");
  assert.match(migration, /disabled_at timestamptz/);
  assert.match(migration, /account_notification_preferences/);
  assert.match(migration, /account_deletion_requests/);
  assert.match(migration, /where status='pending'/);
});

test("exhibitors use company branding instead of a personal photo", () => {
  const profilePage = readFileSync(new URL("../src/app/dashboard/exhibitor/profile/page.tsx", import.meta.url), "utf8");
  const shell = readFileSync(new URL("../src/components/dashboard-shell.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(profilePage, /kind="Profile picture"/);
  assert.match(profilePage, /kind="Exhibitor logo"/);
  assert.match(shell, /active === "exhibitor"/);
  assert.match(shell, /api\/media\/exhibitor/);
  assert.match(shell, /exhibitor\?\.company_name/);
});
