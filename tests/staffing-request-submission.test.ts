import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const workflow = readFileSync(new URL("../src/app/actions/workflow.ts", import.meta.url), "utf8");
const form = readFileSync(new URL("../src/components/staffing-request-form.tsx", import.meta.url), "utf8");
const eventCatalog = readFileSync(new URL("../src/lib/exhibitor-events.ts", import.meta.url), "utf8");

test("successful staffing request submissions redirect to the owner's request list", () => {
  const createStaffingRole = workflow.slice(
    workflow.indexOf("export async function createStaffingRole"),
    workflow.indexOf("export async function applyForRole"),
  );

  assert.match(createStaffingRole, /redirect\(source === "agency"/);
  assert.match(createStaffingRole, /\/dashboard\/agency\/requests\?client=/);
  assert.match(createStaffingRole, /\/dashboard\/exhibitor\/requests/);
  assert.doesNotMatch(createStaffingRole, /return \{ error: "", success:/);
});

test("staffing requests offer locked existing events and inline location selection", () => {
  assert.match(form, />Use existing event</);
  assert.match(form, />Enter missing event</);
  assert.match(form, />Change event</);
  assert.match(form, /These event details are inherited and cannot be changed/);
  assert.match(form, /<VenueLocationPicker/);
  assert.match(form, /onConfirmedLocationChange=\{handleConfirmedLocation\}/);
});

test("inline event locations are validated and persisted while catalog fields remain authoritative", () => {
  const createStaffingRole = workflow.slice(
    workflow.indexOf("export async function createStaffingRole"),
    workflow.indexOf("export async function applyForRole"),
  );

  assert.match(createStaffingRole, /parseLockedLocation\(formData\)/);
  assert.match(createStaffingRole, /resolveActiveLocations\(\[locationId\]\)/);
  assert.match(createStaffingRole, /location_label:lockedLocation\.locationLabel/);
  assert.match(createStaffingRole, /selected\.location_label/);
  assert.match(eventCatalog, /location_id,location_label,map_url/);
});
