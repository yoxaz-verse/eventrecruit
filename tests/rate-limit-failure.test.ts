import assert from "node:assert/strict";
import test from "node:test";
import { authEmailDiagnostic } from "../src/lib/email/failure";
import { classifyRateLimitFailure } from "../src/lib/email/rate-limit-failure";

test("rate-limit failures identify the actionable server stage without leaking provider details", () => {
  const secret = "private@example.com password 123456";
  const cases: Array<[unknown, string]> = [
    [{ code: "PGRST202", message: secret }, "migration_missing"],
    [{ code: "42883", message: secret }, "migration_missing"],
    [{ status: 401, message: secret }, "database_auth_rejected"],
    [{ code: "42501", message: secret }, "database_auth_rejected"],
    [{ code: "AUTH_EMAIL_RATE_LIMIT_UNAVAILABLE", message: secret }, "invalid_database_response"],
    [new Error(secret), "database_connection_failed"],
    [{ code: "XX000", message: secret }, "database_error"],
  ];
  for (const [error, category] of cases) {
    const diagnostic = authEmailDiagnostic(classifyRateLimitFailure(error));
    assert.deepEqual(diagnostic, { stage: "rate_limit", category });
    assert.doesNotMatch(JSON.stringify(diagnostic), /private@example|password|123456/);
  }
});
