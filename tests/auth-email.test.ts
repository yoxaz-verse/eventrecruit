import assert from "node:assert/strict";
import test from "node:test";
import { buildAuthEmail } from "../src/lib/email/message";
import { getAppUrl } from "../src/lib/supabase/env";
import { atAuthEmailStage, authEmailDiagnostic, AuthEmailStageError, classifyAuthEmailFailure } from "../src/lib/email/failure";

test("builds code-only branded messages for every authentication purpose", () => {
  for (const purpose of ["signup", "login", "activation", "recovery"] as const) {
    const message = buildAuthEmail("123456", purpose);
    assert.match(message.subject, /exporb/);
    assert.match(message.text, /exporb/);
    assert.match(message.html, /exporb/);
    assert.doesNotMatch(`${message.subject}${message.text}${message.html}`, /EventRecruit/);
    assert.match(message.text, /123456/);
    assert.match(message.html, /123456/);
    assert.doesNotMatch(message.text, /https?:\/\//);
    assert.doesNotMatch(message.html, /href=/);
  }
});

test("rejects malformed OTP values before constructing an email", () => {
  assert.throws(() => buildAuthEmail("12345", "signup"), { code: "OTP_INVALID_FORMAT" });
  assert.throws(() => buildAuthEmail("12345<", "recovery"), { code: "OTP_INVALID_FORMAT" });
});

test("unexpected delivery errors remain sanitized", async () => {
  const secret = "secret-password@example.com 123456";
  await assert.rejects(
    atAuthEmailStage("smtp_delivery", () => { throw new Error(secret); }),
    (error: unknown) => {
      assert.ok(error instanceof AuthEmailStageError);
      assert.deepEqual(authEmailDiagnostic(error), { stage: "smtp_delivery", category: "mxroute_api_unexpected" });
      assert.doesNotMatch(JSON.stringify(authEmailDiagnostic(error)), /secret-password|123456|example\.com/);
      return true;
    },
  );
});

test("classifies database, configuration, and unanticipated signup failures safely", () => {
  const secret = "user@example.com 123456 smtp-password";
  const failures = [
    classifyAuthEmailFailure("otp_store", new Error(secret)),
    classifyAuthEmailFailure("otp_verify", new Error(secret)),
    classifyAuthEmailFailure("configuration", new Error(secret)),
    classifyAuthEmailFailure("unexpected", new Error(secret)),
    classifyAuthEmailFailure("smtp_delivery", new Error(secret)),
  ];
  assert.deepEqual(failures.map(authEmailDiagnostic), [
    { stage: "otp_store", category: "database_error" },
    { stage: "otp_verify", category: "database_error" },
    { stage: "configuration", category: "app_url_invalid" },
    { stage: "unexpected", category: "unexpected_error" },
    { stage: "smtp_delivery", category: "mxroute_api_unexpected" },
  ]);
  assert.doesNotMatch(JSON.stringify(failures.map(authEmailDiagnostic)), /user@example|123456|smtp-password/);
});

test("accepts only the production origin or a local development origin", () => {
  const previous = process.env.NEXT_PUBLIC_APP_URL;
  try {
    process.env.NEXT_PUBLIC_APP_URL = "https://eventrecruit.vercel.app/onboarding";
    assert.equal(getAppUrl(), "https://eventrecruit.vercel.app");
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
    assert.equal(getAppUrl(), "http://localhost:3000");
    process.env.NEXT_PUBLIC_APP_URL = "https://attacker.example";
    assert.throws(() => getAppUrl());
    delete process.env.NEXT_PUBLIC_APP_URL;
    assert.throws(() => getAppUrl("https://attacker.example"));
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
    else process.env.NEXT_PUBLIC_APP_URL = previous;
  }
});
