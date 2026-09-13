import assert from "node:assert/strict";
import test from "node:test";
import { checkNewPassword, MIN_NEW_PASSWORD_LENGTH, MIN_NEW_PASSWORD_SCORE } from "../src/lib/password-strength";

test("new passwords require at least 15 characters", () => {
  assert.equal(MIN_NEW_PASSWORD_LENGTH, 15);
  const result = checkNewPassword("short phrase 1");
  assert.equal(result.strong, false);
  assert.match(result.reason, /at least 15 characters/);
});

test("length alone does not make a predictable password strong", () => {
  const result = checkNewPassword("aaaaaaaaaaaaaaa");
  assert.equal(result.strong, false);
  assert.ok(result.score < MIN_NEW_PASSWORD_SCORE);
  assert.ok(result.reason.length > 0);
});

test("long passphrases pass without a symbol or character-class requirement", () => {
  const result = checkNewPassword("correct horse battery staple");
  assert.equal(result.strong, true);
  assert.ok(result.score >= MIN_NEW_PASSWORD_SCORE);
});

test("length counts Unicode characters rather than UTF-16 code units", () => {
  const result = checkNewPassword("🚀".repeat(14));
  assert.equal(result.strong, false);
  assert.match(result.reason, /14\/15/);
});
