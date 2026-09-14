import assert from "node:assert/strict";
import test from "node:test";
import { currentExhibitorRoles, todayInIndia, type ExhibitorListingEvent } from "../src/lib/exhibitor-listings";

function event(overrides: Partial<ExhibitorListingEvent> = {}): ExhibitorListingEvent {
  return {
    id: "event-1",
    title: "Expo",
    venue: "Hall A",
    city: "Delhi",
    starts_at: "2026-09-13",
    ends_at: "2026-09-15",
    created_at: "2026-09-10T12:00:00Z",
    exhibitors: { company_name: "Another Exhibitor" },
    staffing_roles: [{
      id: "role-1", title: "Host", headcount: 3, hourly_rate: 250,
      shift_start: "09:00", shift_end: "17:00", required_skills: ["English"], status: "open",
    }],
    ...overrides,
  };
}

test("includes open roles from another exhibitor and events ending today", () => {
  const roles = currentExhibitorRoles([event({ ends_at: "2026-09-14" })], "2026-09-14");
  assert.equal(roles.length, 1);
  assert.equal(roles[0].company, "Another Exhibitor");
  assert.equal(roles[0].rate, 250);
  assert.equal(roles[0].eventTitle, "Expo");
});

test("excludes agency-only, ended, filled and closed listings", () => {
  const roles = currentExhibitorRoles([
    event({ id: "agency", exhibitors: null }),
    event({ id: "past", ends_at: "2026-09-13" }),
    event({ id: "inactive", staffing_roles: [
      { ...event().staffing_roles[0], id: "filled", status: "filled" },
      { ...event().staffing_roles[0], id: "closed", status: "closed" },
    ] }),
  ], "2026-09-14");
  assert.deepEqual(roles, []);
});

test("returns each open role as a card, with newest event first", () => {
  const older = event({ id: "old", created_at: "2026-09-01T12:00:00Z" });
  const newer = event({ id: "new", created_at: "2026-09-12T12:00:00Z", staffing_roles: [
    { ...event().staffing_roles[0], id: "new-1" },
    { ...event().staffing_roles[0], id: "new-2" },
  ] });
  assert.deepEqual(currentExhibitorRoles([older, newer], "2026-09-14").map((role) => role.id), ["new-1", "new-2", "role-1"]);
  assert.deepEqual(currentExhibitorRoles([], "2026-09-14"), []);
});

test("today uses India's calendar date", () => {
  assert.equal(todayInIndia(new Date("2026-09-13T20:00:00Z")), "2026-09-14");
});
