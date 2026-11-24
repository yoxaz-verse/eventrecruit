import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const migration = read("supabase/migrations/029_sponsors_and_organizer_workforce.sql");
const sponsorshipActions = read("src/app/actions/sponsorships.ts");
const workforceActions = read("src/app/actions/workforce.ts");
const publicEvent = read("src/app/events/[id]/page.tsx");
const signup = read("src/components/auth/signup-form.tsx");

test("sponsor agencies are a verified account role with managed brands", () => {
  assert.match(migration, /alter type public\.user_role add value if not exists 'sponsor_agency'/);
  assert.match(migration, /create table if not exists public\.sponsor_agencies/);
  assert.match(migration, /create table if not exists public\.sponsor_brands/);
  assert.match(signup, /value: "sponsor_agency"/);
  assert.match(sponsorshipActions, /verification_status !== "verified"/);
});

test("sponsorship proposals preserve revisions and require mutual confirmation", () => {
  assert.match(migration, /sponsorship_proposal_revisions/);
  assert.match(migration, /accepted_revision <> p\.revision/);
  assert.match(migration, /used_slots >= pkg\.available_slots/);
  assert.match(sponsorshipActions, /status: "organizer_accepted"|next === "organizer_accepted"/);
  assert.match(sponsorshipActions, /confirm_sponsorship/);
});

test("only finalized active sponsors are shown publicly", () => {
  assert.match(migration, /create table if not exists public\.event_sponsors/);
  assert.match(publicEvent, /from\('event_sponsors'\)/);
  assert.match(publicEvent, /\.eq\('status','active'\)/);
  assert.match(publicEvent, /sponsor_brand/);
});

test("organizer workforce supports paid staff and unpaid volunteers", () => {
  assert.match(workforceActions, /\["paid", "volunteer"\]/);
  assert.match(workforceActions, /opportunityType === "paid"/);
  assert.match(workforceActions, /volunteer \? null : min/);
  assert.match(workforceActions, /payer_type: "organizer"/);
  assert.match(migration, /payer_type in \('exhibitor','agency','organizer'\)/);
  assert.match(migration, /payer_organizer_company_id/);
});
