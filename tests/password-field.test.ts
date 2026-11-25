import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("password visibility control remains clickable while active", async () => {
  const [component, styles] = await Promise.all([
    readFile(new URL("../src/components/auth/password-field.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/globals.css", import.meta.url), "utf8"),
  ]);

  assert.match(component, /type=\{visible \? "text" : "password"\}/);
  assert.match(component, /type="button"/);
  assert.match(component, /setVisible\(\(current\) => !current\)/);
  assert.match(
    styles,
    /\.password-visibility:active\s*\{[^}]*transform:\s*translateY\(-50%\)\s+scale\(0\.97\)\s*!important;/s,
  );
});
