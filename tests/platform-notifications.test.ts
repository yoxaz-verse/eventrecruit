import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const migration = fs.readFileSync(new URL("../supabase/migrations/030_role_responsibilities_notifications.sql", import.meta.url), "utf8");

test("shared notifications are deduplicated, indexed, and server-only", () => {
  assert.match(migration, /unique\(profile_id, deduplication_key\)/i);
  assert.match(migration, /platform_notifications_inbox_idx/i);
  assert.match(migration, /revoke all on public\.platform_notifications, public\.workflow_activity from public, anon, authenticated/i);
});

test("workflow activity retains actor, transition, and reason", () => {
  for (const field of ["actor_id", "previous_status", "next_status", "reason", "created_at"]) assert.match(migration, new RegExp(field));
});
