import assert from "node:assert/strict";
import test from "node:test";
import { rankDiscoveryEvents } from "../src/lib/discovery-events";

test("approved exhibitor events rank before organizer events", () => {
  const exhibitor = [
    { id: "later-approved", title: "Later approved", starts_at: "2027-02-01" },
    { id: "first-approved", title: "First approved", starts_at: "2027-01-01" },
  ];
  const organizer = [
    { id: "earlier-organizer", title: "Earlier organizer", starts_at: "2026-12-01" },
  ];

  assert.deepEqual(
    rankDiscoveryEvents(exhibitor, organizer).map(item => `${item.source}:${item.event.id}`),
    ["exhibitor:first-approved", "exhibitor:later-approved", "organizer:earlier-organizer"],
  );
});

test("discovery ranking does not mutate query results", () => {
  const exhibitor = [
    { id: "second", title: "Second", starts_at: "2027-02-01" },
    { id: "first", title: "First", starts_at: "2027-01-01" },
  ];
  rankDiscoveryEvents(exhibitor, []);
  assert.deepEqual(exhibitor.map(event => event.id), ["second", "first"]);
});
