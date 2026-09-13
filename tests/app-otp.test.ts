import { test } from "node:test";
import { strict as assert } from "node:assert";
import { generateOtp, validOtp } from "../src/lib/app-auth/otp-code";

test("app-generated OTPs fit the six-digit email and form contract", () => {
  for (let i = 0; i < 1000; i++) {
    const code = generateOtp();
    assert.equal(code.length, 6);
    assert.equal(validOtp(code), true);
  }
  assert.equal(validOtp("12345"), false);
  assert.equal(validOtp("1234567"), false);
  assert.equal(validOtp("12a456"), false);
  assert.equal(validOtp(" 123456"), false);
});
