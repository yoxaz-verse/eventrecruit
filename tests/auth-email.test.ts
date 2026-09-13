import assert from "node:assert/strict";
import test from "node:test";
import { buildAuthEmail } from "../src/lib/email/message";
import { deliverAuthCode } from "../src/lib/email/delivery";
import { getAppUrl } from "../src/lib/supabase/env";
import { sendSignupCode } from "../src/lib/email/signup-code";

test("sends a new signup code and recovers an existing account with an activation code", async () => {
  const sent: string[] = [];
  const sendNew = async (code: string) => { sent.push(`signup:${code}`); };
  const sendExisting = async () => { sent.push("activation"); };

  assert.equal(
    await sendSignupCode(
      async () => ({ data: { properties: { email_otp: "123456" } }, error: null }),
      sendNew,
      sendExisting,
    ),
    "signup",
  );
  assert.equal(
    await sendSignupCode(
      async () => ({ data: null, error: Object.assign(new Error("Already registered"), { code: "email_exists" }) }),
      sendNew,
      sendExisting,
    ),
    "activation",
  );
  assert.deepEqual(sent, ["signup:123456", "activation"]);
});

test("signup code errors cannot be mistaken for successful delivery", async () => {
  const unexpected = Object.assign(new Error("Provider unavailable"), { code: "unexpected_failure" });
  await assert.rejects(
    sendSignupCode(async () => ({ data: null, error: unexpected }), async () => {}, async () => {}),
    unexpected,
  );
  await assert.rejects(
    sendSignupCode(async () => ({ data: { properties: {} }, error: null }), async () => {}, async () => {}),
    { code: "SUPABASE_OTP_MISSING" },
  );
  await assert.rejects(
    sendSignupCode(
      async () => ({ data: null, error: Object.assign(new Error("Already registered"), { code: "email_exists" }) }),
      async () => {},
      async () => { throw Object.assign(new Error("SMTP unavailable"), { code: "ETIMEDOUT" }); },
    ),
    { code: "ETIMEDOUT" },
  );
});

test("builds code-only branded messages for every authentication purpose", () => {
  for (const purpose of ["signup", "login", "activation", "recovery"] as const) {
    const message = buildAuthEmail("123456", purpose);
    assert.match(message.subject, /EventRecruit/);
    assert.match(message.text, /123456/);
    assert.match(message.html, /123456/);
    assert.doesNotMatch(message.text, /https?:\/\//);
    assert.doesNotMatch(message.html, /href=/);
  }
});

test("rejects malformed OTP values before constructing an email", () => {
  assert.throws(() => buildAuthEmail("12345", "signup"));
  assert.throws(() => buildAuthEmail("12345<", "recovery"));
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

test("waits for SMTP acceptance and rejects unaccepted recipients", async () => {
  let resolved = false;
  const accepted = deliverAuthCode(
    { async sendMail() { await new Promise((resolve) => setTimeout(resolve, 5)); resolved = true; return { accepted: ["person@example.com"] }; } },
    "EventRecruit <no-reply@example.com>", "person@example.com", "123456", "signup",
  );
  assert.equal(resolved, false);
  await accepted;
  assert.equal(resolved, true);

  await assert.rejects(
    deliverAuthCode(
      { async sendMail() { return { accepted: ["different@example.com"] }; } },
      "EventRecruit <no-reply@example.com>", "person@example.com", "123456", "login",
    ),
    { code: "SMTP_RECIPIENT_NOT_ACCEPTED" },
  );
});

test("propagates SMTP timeout without leaking message contents", async () => {
  await assert.rejects(
    deliverAuthCode(
      { async sendMail() { throw Object.assign(new Error("Connection timed out"), { code: "ETIMEDOUT" }); } },
      "EventRecruit <no-reply@example.com>", "person@example.com", "123456", "recovery",
    ),
    { code: "ETIMEDOUT" },
  );
});
