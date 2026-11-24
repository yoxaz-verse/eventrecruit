import assert from "node:assert/strict";
import test from "node:test";
import { buildResponsibilityChecklist, hasCapability, roleDefinitions } from "../src/lib/role-capabilities";

test("every platform role has responsibilities and profile management", () => {
  for (const [role, definition] of Object.entries(roleDefinitions)) {
    assert.ok(definition.responsibilities.length >= 3, `${role} should explain its responsibilities`);
    assert.equal(hasCapability(role as keyof typeof roleDefinitions, "manage_profile"), true);
  }
});

test("capabilities keep privileged administration separate", () => {
  assert.equal(hasCapability("admin", "moderate_platform"), true);
  for (const role of ["talent", "organizer", "agency", "sponsor_agency", "exhibitor"] as const) assert.equal(hasCapability(role, "moderate_platform"), false);
  assert.equal(hasCapability("talent", "apply_for_roles"), true);
  assert.equal(hasCapability("organizer", "apply_for_roles"), false);
});

test("responsibility checklist explains verification blockers", () => {
  const pending = buildResponsibilityChecklist({ role: "talent", verificationStatus: "pending_verification", profileComplete: false });
  assert.equal(pending.find((item) => item.id === "profile")?.state, "action_required");
  assert.equal(pending.find((item) => item.id === "verification")?.state, "blocked");
  const verified = buildResponsibilityChecklist({ role: "agency", verificationStatus: "verified", profileComplete: true });
  assert.equal(verified.filter((item) => item.state === "complete").length, 2);
});
