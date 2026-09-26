import assert from "node:assert/strict";
import test from "node:test";
import { countStatuses, firstRelated, flattenStaffingRoles, indexBy } from "../src/lib/dashboard-read-models";

test("normalizes nullable and array-shaped relationships", () => {
  assert.equal(firstRelated(null), null);
  assert.equal(firstRelated([]), null);
  assert.deepEqual(firstRelated([{ id: "one" }, { id: "two" }]), { id: "one" });
  assert.deepEqual(firstRelated({ id: "one" }), { id: "one" });
});

test("flattens staffing roles while retaining their event", () => {
  const events: Array<{ id: string; title: string; staffing_roles: Array<{ id: string; status: string }> | null }> = [
    { id: "event-1", title: "Expo", staffing_roles: [{ id: "role-1", status: "open" }, { id: "role-2", status: "closed" }] },
    { id: "event-2", title: "Launch", staffing_roles: null },
  ];
  const rows = flattenStaffingRoles(events);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].event.id, "event-1");
  assert.equal(rows[1].id, "role-2");
});

test("indexes rows and counts selected statuses", () => {
  const rows = [{ id: "a", status: "assigned" }, { id: "b", status: "applied" }, { id: "c", status: "assigned" }];
  assert.equal(indexBy(rows, (row) => row.id).get("b")?.status, "applied");
  assert.equal(countStatuses(rows, ["assigned"]), 2);
});
