import assert from "node:assert/strict";
import test from "node:test";
import { isSelectableCatalogEvent, isUpcomingDateRange, parseCatalogSelection } from "../src/lib/event-selection";

const id = "11111111-1111-4111-8111-111111111111";

test("only namespaced catalog UUIDs can be submitted", () => {
  assert.deepEqual(parseCatalogSelection(`organizer:${id}`), { kind: "organizer", id });
  assert.deepEqual(parseCatalogSelection(`exhibitor:${id}`), { kind: "exhibitor", id });
  for (const invalid of ["", id, `admin:${id}`, "organizer:../../admin", `organizer:${id}:extra`, "organizer:bad"]) assert.equal(parseCatalogSelection(invalid), null);
});

test("submitted events must still be current when submitted or approved", () => {
  assert.equal(isUpcomingDateRange("2026-09-14", "2026-09-15", "2026-09-15"), true);
  assert.equal(isUpcomingDateRange("2026-09-14", "2026-09-14", "2026-09-15"), false);
  assert.equal(isUpcomingDateRange("2026-09-16", "2026-09-15", "2026-09-15"), false);
});

test("only approved or published unexpired events can back requests", () => {
  const event = { status: "approved", starts_at: "2026-09-14", ends_at: "2026-09-15" };
  assert.equal(isSelectableCatalogEvent(event, "exhibitor", "2026-09-15"), true);
  assert.equal(isSelectableCatalogEvent({ ...event, status: "pending" }, "exhibitor", "2026-09-14"), false);
  assert.equal(isSelectableCatalogEvent({ ...event, status: "rejected" }, "exhibitor", "2026-09-14"), false);
  assert.equal(isSelectableCatalogEvent(event, "exhibitor", "2026-09-16"), false);
  assert.equal(isSelectableCatalogEvent({ ...event, status: "published" }, "organizer", "2026-09-14"), true);
  assert.equal(isSelectableCatalogEvent(event, "organizer", "2026-09-14"), false);
});
