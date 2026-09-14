import assert from "node:assert/strict";
import test from "node:test";
import { existingEmailError } from "../src/lib/app-auth/email-eligibility";

const pending = { email_verified_at: null };
const verified = { email_verified_at: "2026-09-14T00:00:00Z" };

test("login and recovery codes require a registered, verified account", () => {
  for (const purpose of ["login", "recovery"] as const) {
    assert.match(existingEmailError(purpose, null) ?? "", /not registered/);
    assert.match(existingEmailError(purpose, pending) ?? "", /not verified/);
    assert.equal(existingEmailError(purpose, verified), null);
  }
});

test("activation resend is only available to pending accounts", () => {
  assert.match(existingEmailError("activation", null) ?? "", /not registered/);
  assert.equal(existingEmailError("activation", pending), null);
  assert.match(existingEmailError("activation", verified) ?? "", /already verified/);
});
