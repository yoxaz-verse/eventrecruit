import assert from "node:assert/strict";
import test from "node:test";
import { hasCoreProfile, validateOnboarding } from "../src/lib/onboarding-rules";

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

test("each role requires only its own core fields", () => {
  const shared = { city: "Delhi", phone: "9876543210" };
  assert.equal(validateOnboarding("talent", form({ ...shared, headline: "Host", skills: "Greeting" })), null);
  assert.equal(validateOnboarding("agency", form({ ...shared, business_name: "Crew Co", commission_type: "percentage" })), null);
  assert.equal(validateOnboarding("exhibitor", form({ ...shared, business_name: "Expo Co" })), null);
  assert.match(validateOnboarding("talent", form({ ...shared, business_name: "Wrong role" }))!, /headline/);
  assert.match(validateOnboarding("agency", form({ ...shared, headline: "Wrong role", commission_type: "percentage" }))!, /agency name/);
  assert.match(validateOnboarding("exhibitor", form({ ...shared, headline: "Wrong role" }))!, /company name/);
});

test("legacy profile completion requires stored contact and role details", () => {
  assert.equal(hasCoreProfile("talent", "Delhi", "9876543210", { headline: "Host", skills: ["Greeting"] }), true);
  assert.equal(hasCoreProfile("talent", "Delhi", "9876543210", { headline: "Host", skills: [] }), false);
  assert.equal(hasCoreProfile("agency", "Delhi", "", { name: "Crew Co" }), false);
  assert.equal(hasCoreProfile("exhibitor", "Delhi", "9876543210", { company_name: "Expo Co" }), true);
});
