import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("exhibitor submissions remain server-only after initial and follow-up migrations", () => {
  for (const migration of ["009_exhibitor_event_submissions.sql", "011_lock_down_exhibitor_submissions.sql"]) {
    const sql = readFileSync(new URL(`../supabase/migrations/${migration}`, import.meta.url), "utf8");
    assert.match(sql, /revoke all on public\.exhibitor_event_submissions from public, anon, authenticated/i);
    assert.match(sql, /grant select, insert, update on public\.exhibitor_event_submissions to service_role/i);
    assert.doesNotMatch(sql, /grant\s+(?:all|select|insert|update).*exhibitor_event_submissions\s+to\s+(?:public|anon|authenticated)/i);
  }
});
