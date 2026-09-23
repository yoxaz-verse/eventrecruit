import assert from "node:assert/strict";
import test from "node:test";
import { matchingLocationId } from "../src/lib/location-options";

const locations = [
  { id: "ernakulam", name: "Ernakulam" },
  { id: "pathanamthitta", name: "Pathanamthitta" },
];

test("selects the catalog city that matches a venue result", () => {
  assert.equal(matchingLocationId("Ernakulam", locations), "ernakulam");
  assert.equal(matchingLocationId("Pathanamthitta", locations), "pathanamthitta");
});

test("maps Kochi and Cochin venue results to Ernakulam", () => {
  assert.equal(matchingLocationId("Kochi", locations), "ernakulam");
  assert.equal(matchingLocationId("Cochin", locations), "ernakulam");
});

test("requires manual city selection when a venue city is outside the catalog", () => {
  assert.equal(matchingLocationId("New Delhi", locations), "");
});
