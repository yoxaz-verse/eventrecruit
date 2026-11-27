import assert from "node:assert/strict";
import test from "node:test";
import {
  mxrouteConfigFromEnv,
  sendMxrouteEmail,
  senderAddress,
  verifyMxrouteConnection,
  type MailTransport,
  type MxrouteConfig,
} from "../src/lib/email/mxroute-smtp";
import { authEmailDiagnostic, AuthEmailStageError } from "../src/lib/email/failure";

const config: MxrouteConfig = {
  server: "example.mxrouting.net",
  port: 587,
  secure: false,
  username: "no-reply@example.com",
  password: "private-password",
  from: "Expoline <no-reply@example.com>",
};

function transport(overrides: Partial<MailTransport> = {}): MailTransport {
  return {
    async sendMail() {},
    async verify() {},
    ...overrides,
  };
}

test("extracts only one valid sender matching the authenticated mailbox", async () => {
  assert.equal(senderAddress(config.from), config.username);
  assert.equal(senderAddress('"Expoline <no-reply@example.com>"'), config.username);
  assert.equal(senderAddress("Expoline no-reply@example.com"), config.username);
  assert.throws(() => senderAddress("no-reply@example.com,other@example.com"), AuthEmailStageError);
  assert.throws(() => senderAddress("no-reply@example.com\r\nBcc: other@example.com"), AuthEmailStageError);
  await assert.rejects(
    sendMxrouteEmail({ ...config, from: "other@example.com" }, "recipient@example.com", "123456", "signup", transport()),
    { category: "smtp_sender_mismatch" },
  );
});

test("identifies missing SMTP configuration without exposing values", async () => {
  const cases: Array<[Partial<MxrouteConfig>, string]> = [
    [{ server: "" }, "smtp_server_missing"],
    [{ username: "" }, "smtp_username_missing"],
    [{ password: "" }, "smtp_password_missing"],
  ];
  for (const [overrides, category] of cases) {
    await assert.rejects(
      sendMxrouteEmail({ ...config, ...overrides }, "recipient@example.com", "123456", "login", transport()),
      { category },
    );
  }
});

test("reads port and STARTTLS settings from the environment", () => {
  const previous = {
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_SECURE: process.env.SMTP_SECURE,
    SMTP_AUTH_USER: process.env.SMTP_AUTH_USER,
    SMTP_AUTH_PASS: process.env.SMTP_AUTH_PASS,
    SMTP_FROM: process.env.SMTP_FROM,
  };
  try {
    process.env.SMTP_HOST = config.server;
    process.env.SMTP_PORT = "587";
    process.env.SMTP_SECURE = "false";
    process.env.SMTP_AUTH_USER = config.username;
    process.env.SMTP_AUTH_PASS = config.password;
    process.env.SMTP_FROM = config.from;
    assert.deepEqual(mxrouteConfigFromEnv(), config);
    process.env.SMTP_PORT = "invalid";
    assert.throws(() => mxrouteConfigFromEnv(), { category: "smtp_port_invalid" });
    process.env.SMTP_PORT = "587";
    process.env.SMTP_SECURE = "sometimes";
    assert.throws(() => mxrouteConfigFromEnv(), { category: "smtp_secure_invalid" });
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test("sends one SMTP message with the OTP and bare sender", async () => {
  let calls = 0;
  await sendMxrouteEmail(config, "recipient@example.com", "123456", "signup", transport({
    async sendMail(message) {
      calls++;
      assert.equal(message.from, config.username);
      assert.equal(message.to, "recipient@example.com");
      assert.match(message.html, /123456/);
      assert.match(message.text ?? "", /123456/);
    },
  }));
  assert.equal(calls, 1);
});

test("verifies SMTP authentication without sending an email", async () => {
  let verified = 0;
  let sent = 0;
  await verifyMxrouteConnection(config, transport({
    async verify() { verified++; },
    async sendMail() { sent++; },
  }));
  assert.equal(verified, 1);
  assert.equal(sent, 0);
});

test("classifies SMTP failures without exposing provider content", async () => {
  const cases: Array<[string, object, string]> = [
    ["auth", { code: "EAUTH", response: "private-password" }, "smtp_auth"],
    ["auth-response", { responseCode: 535 }, "smtp_auth"],
    ["timeout", { code: "ETIMEDOUT" }, "smtp_timeout"],
    ["connection", { code: "ECONNREFUSED" }, "smtp_connection"],
    ["rate-limit", { responseCode: 451 }, "smtp_rate_limit"],
    ["rejected", { responseCode: 550, response: "recipient@example.com rejected" }, "smtp_rejected"],
    ["unexpected", new Error("private-password recipient@example.com"), "smtp_unexpected"],
  ];
  for (const [label, failure, category] of cases) {
    await assert.rejects(
      sendMxrouteEmail(config, "recipient@example.com", "123456", "login", transport({
        async sendMail() { throw failure; },
      })),
      (error: unknown) => {
        assert.ok(error instanceof AuthEmailStageError, label);
        assert.deepEqual(authEmailDiagnostic(error), { stage: "smtp_delivery", category });
        assert.doesNotMatch(JSON.stringify(error), /private-password|recipient@example\.com|123456/);
        return true;
      },
    );
  }
});
