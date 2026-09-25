import assert from "node:assert/strict";
import { test } from "node:test";
import { applicantCountLabel, newestApplicationsFirst, talentRequirementLabel } from "../src/lib/staffing-request-view";

test("staffing request labels distinguish talent requirements from applicants", () => {
  assert.equal(talentRequirementLabel(1), "Talent requirement: 1");
  assert.equal(talentRequirementLabel(2), "Talent requirement: 2");
  assert.equal(applicantCountLabel(0), "0 applicants");
  assert.equal(applicantCountLabel(1), "1 applicant");
  assert.equal(applicantCountLabel(2), "2 applicants");
});

test("applications are shown newest first without mutating query results", () => {
  const applications = [
    { id: "first", created_at: "2026-09-20T10:00:00Z" },
    { id: "latest", created_at: "2026-09-25T10:00:00Z" },
  ];
  assert.deepEqual(newestApplicationsFirst(applications).map(item => item.id), ["latest", "first"]);
  assert.deepEqual(applications.map(item => item.id), ["first", "latest"]);
});
