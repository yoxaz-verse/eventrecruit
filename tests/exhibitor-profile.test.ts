import assert from "node:assert/strict";
import test from "node:test";
import { validateExhibitorProfile } from "../src/lib/exhibitor-profile";

function validForm(overrides: Record<string, string> = {}) {
  const data = new FormData();
  const values = { full_name: "Asha Rao", account_phone: "+91 98765 43210", company_name: "Expo Co", city: "Mumbai", ...overrides };
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

test("accepts a complete exhibitor profile and normalizes contact email", () => {
  const result = validateExhibitorProfile(validForm({ website: "https://example.com", contact_email: " SALES@EXAMPLE.COM " }));
  assert.equal(result.error, null);
  assert.equal(result.values?.contactEmail, "sales@example.com");
});

test("requires core account and company fields", () => {
  assert.match(validateExhibitorProfile(validForm({ full_name: "" })).error!, /account holder/i);
  assert.match(validateExhibitorProfile(validForm({ account_phone: "" })).error!, /phone/i);
  assert.match(validateExhibitorProfile(validForm({ company_name: "" })).error!, /company name/i);
  assert.match(validateExhibitorProfile(validForm({ city: "" })).error!, /city/i);
});

test("rejects malformed contact and website values", () => {
  assert.match(validateExhibitorProfile(validForm({ contact_email: "not-an-email" })).error!, /email/i);
  assert.match(validateExhibitorProfile(validForm({ website: "javascript:alert(1)" })).error!, /HTTP/i);
  assert.match(validateExhibitorProfile(validForm({ description: "x".repeat(5001) })).error!, /description/i);
});

