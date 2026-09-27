import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { activeApplicantsFirst, deriveTalentPresence, filterActiveApplicants } from "../src/lib/talent-presence";

const now = new Date("2026-09-27T18:00:00.000Z");

test("online presence expires at two minutes and respects privacy", () => {
  assert.deepEqual(deriveTalentPresence({available_for_work:true,presence_visible:true,last_seen_at:"2026-09-27T17:58:01.000Z"},now),{availableForWork:true,onlineNow:true,activeNow:true});
  assert.equal(deriveTalentPresence({available_for_work:true,presence_visible:true,last_seen_at:"2026-09-27T17:58:00.000Z"},now).onlineNow,false);
  assert.equal(deriveTalentPresence({available_for_work:true,presence_visible:false,last_seen_at:"2026-09-27T17:59:59.000Z"},now).onlineNow,false);
  assert.equal(deriveTalentPresence({available_for_work:false,presence_visible:true,last_seen_at:"2026-09-27T17:59:59.000Z"},now).activeNow,false);
});

test("applicants are filtered and stably sorted by combined active state", () => {
  const applicants=[{id:"new-inactive",active:false,created:3},{id:"old-active",active:true,created:1},{id:"new-active",active:true,created:2}];
  const presence=(item:typeof applicants[number])=>({availableForWork:item.active,onlineNow:item.active,activeNow:item.active});
  const sorted=activeApplicantsFirst(applicants,presence,(a,b)=>b.created-a.created);
  assert.deepEqual(sorted.map(item=>item.id),["new-active","old-active","new-inactive"]);
  assert.deepEqual(filterActiveApplicants(sorted,presence,true).map(item=>item.id),["new-active","old-active"]);
  assert.deepEqual(applicants.map(item=>item.id),["new-inactive","old-active","new-active"]);
});

test("presence migration preserves availability and updates alert matching", () => {
  const migration=readFileSync(new URL("../supabase/migrations/027_talent_presence.sql",import.meta.url),"utf8");
  assert.match(migration,/rename column is_online to available_for_work/i);
  assert.match(migration,/presence_visible boolean not null default true/i);
  assert.match(migration,/last_seen_at timestamptz/i);
  assert.match(migration,/create index talent_job_preferences_visible_last_seen/i);
  assert.match(migration,/pref\.available_for_work/i);
});

test("presence remains recruiter-only and raw timestamps are not rendered", () => {
  const route=readFileSync(new URL("../src/app/api/talent/presence/route.ts",import.meta.url),"utf8");
  const badges=readFileSync(new URL("../src/components/talent-presence-badges.tsx",import.meta.url),"utf8");
  const clientReview=readFileSync(new URL("../src/app/client-review/[token]/page.tsx",import.meta.url),"utf8");
  assert.match(route,/profile\.role !== "talent"/);
  assert.match(route,/status: 403/);
  assert.doesNotMatch(badges,/last_seen_at/);
  assert.doesNotMatch(clientReview,/talent_job_preferences|last_seen_at|onlineNow/);
});

test("recruiter views expose both badges and preserve agency filters", () => {
  const badges=readFileSync(new URL("../src/components/talent-presence-badges.tsx",import.meta.url),"utf8");
  const agency=readFileSync(new URL("../src/app/dashboard/agency/applicants/page.tsx",import.meta.url),"utf8");
  assert.match(badges,/Available for work/);
  assert.match(badges,/Online now/);
  assert.match(agency,/query\.set\("client", params\.client\)/);
  assert.match(agency,/query\.set\("status", params\.status\)/);
  assert.match(agency,/activeOnly\?"No applicants are both available for work and online now/);
});
