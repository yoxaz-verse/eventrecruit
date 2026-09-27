import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  talentApplicationGroup,
  talentApplicationStatusMeta,
} from "../src/lib/talent-applications";
import type { ApplicationStatus } from "../src/lib/types";

const active: ApplicationStatus[] = [
  "applied",
  "under_review",
  "shortlisted",
  "documents_requested",
  "approved",
  "assigned",
];
const past: ApplicationStatus[] = [
  "completed",
  "rejected",
  "withdrawn",
  "no_response",
  "cancelled",
  "closed",
];

test("talent application statuses have complete user-facing metadata", () => {
  assert.deepEqual(Object.keys(talentApplicationStatusMeta).sort(), [...active, ...past].sort());
  for (const status of [...active, ...past]) {
    assert.ok(talentApplicationStatusMeta[status].label);
    assert.ok(talentApplicationStatusMeta[status].description);
  }
});

test("talent applications are grouped into active and past updates", () => {
  for (const status of active) assert.equal(talentApplicationGroup(status), "active");
  for (const status of past) assert.equal(talentApplicationGroup(status), "past");
});

test("talent navigation exposes the applications page", () => {
  const navigation = readFileSync(new URL("../src/lib/navigation.ts", import.meta.url), "utf8");
  assert.match(navigation, /href: ["']\/dashboard\/talent\/applications["'], label: ["']My applications["']/);
});

test("application cards link to an authenticated application detail route", () => {
  const listPage = readFileSync(new URL("../src/app/dashboard/talent/applications/page.tsx", import.meta.url), "utf8");
  const detailPage = readFileSync(new URL("../src/app/dashboard/talent/applications/[id]/page.tsx", import.meta.url), "utf8");
  assert.match(listPage, /\/dashboard\/talent\/applications\/\$\{application\.id\}/);
  assert.match(detailPage, /\.eq\(["']id["'], id\)[\s\S]*\.eq\(["']talent_id["'], talent\.id\)/);
  assert.match(detailPage, /if \(!data\) notFound\(\)/);
});

test("application details omit internal workflow and settlement fields", () => {
  const detailPage = readFileSync(new URL("../src/app/dashboard/talent/applications/[id]/page.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(detailPage, /operation_status|final_client_charge|agency_share|staffing_settlements|applicant_count/);
  assert.match(detailPage, /View public event/);
  assert.match(detailPage, /special_instructions/);
  assert.match(detailPage, /application_deadline/);
});
