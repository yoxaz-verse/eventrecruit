import assert from "node:assert/strict";
import test from "node:test";
import { isIndiaCoordinate, normalizePhotonCollection, normalizePhotonFeature, parseLockedLocation } from "../src/lib/location";

const indianFeature = {
  geometry: { type: "Point", coordinates: [77.209, 28.6139] },
  properties: { osm_type: "W", osm_id: 123, name: "Pragati Maidan", city: "New Delhi", state: "Delhi", country: "India", countrycode: "in" },
};

test("normalizes an Indian Photon point", () => {
  assert.deepEqual(normalizePhotonFeature(indianFeature), {
    id: "W:123", venue: "Pragati Maidan", city: "New Delhi", label: "Pragati Maidan, New Delhi, Delhi, India",
    latitude: 28.6139, longitude: 77.209, countryCode: "IN",
  });
});

test("filters malformed and non-Indian Photon results and enforces the limit", () => {
  const outside = { ...indianFeature, properties: { ...indianFeature.properties, countrycode: "US" } };
  assert.deepEqual(normalizePhotonCollection({ features: [outside, indianFeature, indianFeature] }, 1), [normalizePhotonFeature(indianFeature)]);
  assert.deepEqual(normalizePhotonCollection({ nope: [] }), []);
});

test("validates India coordinate bounds", () => {
  assert.equal(isIndiaCoordinate(28.6139, 77.209), true);
  assert.equal(isIndiaCoordinate(51.5072, -0.1276), false);
  assert.equal(isIndiaCoordinate(Number.NaN, 77), false);
});

test("requires an explicitly locked complete location", () => {
  const form = new FormData();
  form.set("latitude", "28.6139"); form.set("longitude", "77.209"); form.set("location_label", "Pragati Maidan, New Delhi"); form.set("location_country_code", "IN");
  assert.equal(parseLockedLocation(form).valid, false);
  form.set("location_locked", "1");
  assert.equal(parseLockedLocation(form).valid, true);
  form.set("location_country_code", "US");
  assert.equal(parseLockedLocation(form).valid, false);
});
