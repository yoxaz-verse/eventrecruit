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

test("event location migration stores validated Indian coordinates", () => {
  const sql = readFileSync(new URL("../supabase/migrations/017_event_locations.sql", import.meta.url), "utf8");
  for (const table of ["organizer_events", "exhibitor_event_submissions"]) assert.match(sql, new RegExp(`alter table public\\.${table}`, "i"));
  for (const column of ["latitude", "longitude", "location_label", "location_country_code"]) assert.match(sql, new RegExp(`add column ${column}`, "i"));
  assert.match(sql, /location_country_code\s*=\s*'IN'/i);
  assert.match(sql, /create or replace function public\.save_organizer_event_with_slots/i);
});

test("amenities migration covers both event catalogs and organizer persistence", () => {
  const sql = readFileSync(new URL("../supabase/migrations/019_event_amenities.sql", import.meta.url), "utf8");
  for (const table of ["organizer_events", "exhibitor_event_submissions"]) assert.match(sql, new RegExp(`alter table public\\.${table}`, "i"));
  assert.match(sql, /create or replace function public\.save_organizer_event_with_slots/i);
  assert.match(sql, /custom_amenities=custom/i);
});
