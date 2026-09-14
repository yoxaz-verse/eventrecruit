import assert from "node:assert/strict";
import test from "node:test";
import { sendMxrouteEmail, senderAddress, type MxrouteConfig } from "../src/lib/email/mxroute-api";
import { authEmailDiagnostic, AuthEmailStageError, classifyAuthEmailFailure } from "../src/lib/email/failure";

const config: MxrouteConfig = {
  server: "example.mxrouting.net",
  username: "no-reply@example.com",
  password: "private-password",
  from: "exporb <no-reply@example.com>",
};

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

test("extracts only one valid sender matching the authenticated mailbox", async () => {
  assert.equal(senderAddress(config.from), config.username);
  assert.equal(senderAddress('"exporb <no-reply@example.com>"'), config.username);
  assert.equal(senderAddress("exporb no-reply@example.com"), config.username);
  assert.throws(() => senderAddress("no-reply@example.com,other@example.com"), AuthEmailStageError);
  assert.throws(() => senderAddress("no-reply@example.com\r\nBcc: other@example.com"), AuthEmailStageError);
  await assert.rejects(sendMxrouteEmail({ ...config, from: "other@example.com" }, "recipient@example.com", "123456", "signup",
    (async () => { throw new Error("fetch should not happen"); }) as typeof fetch), { category: "mxroute_api_sender_mismatch" });
});

test("identifies missing production configuration without exposing values", async () => {
  const cases: Array<[Partial<MxrouteConfig>, string]> = [
    [{ server: "" }, "mxroute_api_server_missing"],
    [{ username: "" }, "mxroute_api_username_missing"],
    [{ password: "" }, "mxroute_api_password_missing"],
  ];
  for (const [overrides, category] of cases) {
    await assert.rejects(sendMxrouteEmail({ ...config, ...overrides }, "recipient@example.com", "123456", "login",
      (async () => { throw new Error("fetch should not happen"); }) as typeof fetch), { category });
  }
});

test("sends one HTTPS request with a bare sender and requires explicit provider success", async () => {
  let calls = 0;
  await sendMxrouteEmail(config, "recipient@example.com", "123456", "signup", (async (url, options) => {
    calls++;
    assert.equal(url, "https://smtpapi.mxroute.com/");
    assert.equal(options?.method, "POST");
    const body = JSON.parse(String(options?.body));
    assert.equal(body.from, config.username);
    assert.equal(body.to, "recipient@example.com");
    assert.equal(body.server, config.server);
    assert.equal(body.username, config.username);
    assert.equal(body.password, config.password);
    assert.match(body.body, /123456/);
    return response({ success: true, message: "Email sent successfully." });
  }) as typeof fetch);
  assert.equal(calls, 1);
});

test("classifies HTTPS response and network failures without exposing provider content", async () => {
  const cases: Array<[string, typeof fetch, string]> = [
    ["auth", (async () => response({ success: false, message: "Authentication failed: private-password" })) as typeof fetch, "mxroute_api_auth"],
    ["server", (async () => response({ success: false, message: "Invalid server specified." })) as typeof fetch, "mxroute_api_invalid_server"],
    ["rejected", (async () => response({ success: false, message: "recipient@example.com rejected" })) as typeof fetch, "mxroute_api_rejected"],
    ["http", (async () => response({ success: false }, 503)) as typeof fetch, "mxroute_api_http_failure"],
    ["http-auth", (async () => response({ success: false }, 401)) as typeof fetch, "mxroute_api_auth"],
    ["http-auth-empty", (async () => new Response(null, { status: 401 })) as typeof fetch, "mxroute_api_auth"],
    ["invalid", (async () => response({ ok: true })) as typeof fetch, "mxroute_api_invalid_response"],
    ["malformed", (async () => new Response("<html>error</html>")) as typeof fetch, "mxroute_api_invalid_response"],
    ["timeout", (async () => { throw new DOMException("private-password", "AbortError"); }) as typeof fetch, "mxroute_api_timeout"],
    ["connection", (async () => { throw new TypeError("private-password"); }) as typeof fetch, "mxroute_api_connection"],
  ];
  for (const [label, fetcher, category] of cases) {
    let calls = 0;
    await assert.rejects(
      sendMxrouteEmail(config, "recipient@example.com", "123456", "login", ((...args) => { calls++; return fetcher(...args); }) as typeof fetch),
      (error: unknown) => {
        assert.ok(error instanceof AuthEmailStageError, label);
        assert.deepEqual(authEmailDiagnostic(classifyAuthEmailFailure("smtp_delivery", error)), { stage: "smtp_delivery", category });
        assert.doesNotMatch(JSON.stringify(error), /private-password|recipient@example\.com|123456/);
        return true;
      },
    );
    assert.equal(calls, 1, label);
  }
});
