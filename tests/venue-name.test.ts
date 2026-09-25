import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

test("event forms own a required venue name field", () => {
  const exhibitor = read("../src/components/exhibitor-event-form.tsx");
  const organizer = read("../src/components/organizer/forms.tsx");
  for (const source of [exhibitor, organizer]) {
    assert.match(source, /Venue name/);
    assert.match(source, /name="venue" required maxLength=\{200\}/);
  }
});

test("the map picker submits address metadata without overwriting venue name", () => {
  const picker = read("../src/components/venue-location-picker.tsx");
  assert.match(picker, /Venue address/);
  assert.match(picker, /name="location_label"/);
  assert.doesNotMatch(picker, /name="venue"/);
});

test("event actions validate the manual venue name", () => {
  assert.match(read("../src/app/actions/exhibitor-events.ts"), /Enter a venue name within 200 characters/);
  assert.match(read("../src/app/actions/organizer.ts"), /Enter a venue name within 200 characters/);
});
