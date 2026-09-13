import { test } from "node:test";
import { strict as assert } from "node:assert";
import { canApply, canModerate, ownsStaffingEvent } from "../src/lib/app-auth/authorization";

test("portal permissions reject another owner's record and non-admin moderation", () => {
  assert.equal(ownsStaffingEvent("owner", "owner"), true);
  assert.equal(ownsStaffingEvent("owner", "other"), false);
  assert.equal(ownsStaffingEvent(null, "other"), false);
  for (const role of ["talent", "exhibitor", "agency", "organizer"]) assert.equal(canModerate(role), false);
  assert.equal(canModerate("admin"), true);
});

test("applications require verified talent and an open role", () => {
  assert.equal(canApply("talent", "verified", "open"), true);
  assert.equal(canApply("talent", "pending_verification", "open"), false);
  assert.equal(canApply("talent", "verified", "closed"), false);
  assert.equal(canApply("exhibitor", "verified", "open"), false);
});
