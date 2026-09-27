import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";

const migration=readFileSync(new URL("../supabase/migrations/026_stalls_and_volunteers.sql",import.meta.url),"utf8");
const staffingAction=readFileSync(new URL("../src/app/actions/workflow.ts",import.meta.url),"utf8");
const stallAction=readFileSync(new URL("../src/app/actions/stalls.ts",import.meta.url),"utf8");
const stallForm=readFileSync(new URL("../src/components/stall-form.tsx",import.meta.url),"utf8");
const stallDetail=readFileSync(new URL("../src/app/dashboard/exhibitor/stalls/[id]/page.tsx",import.meta.url),"utf8");
const locationPicker=readFileSync(new URL("../src/components/venue-location-picker.tsx",import.meta.url),"utf8");
const volunteerAction=readFileSync(new URL("../src/app/actions/volunteers.ts",import.meta.url),"utf8");

test("stalls support multiple records per exhibitor event and protect ownership",()=>{
 assert.match(migration,/create table if not exists public\.exhibitor_stalls/i);
 assert.doesNotMatch(migration,/unique[^;]+exhibitor_stalls[^;]+exhibitor_id[^;]+event_id/i);
 assert.match(migration,/exhibitor_stalls_owner_event/i);
 assert.match(stallAction,/canManageExhibitor/);
 assert.match(stallAction,/event_mode/);
 assert.match(stallAction,/mode==="existing"/);
 assert.match(stallAction,/mode==="other"/);
});

test("stall creation confirms locations and reports invalid submissions",()=>{
 assert.match(locationPicker,/const confirmLocation/);
 assert.match(locationPicker,/Location confirmed\. You can now save the stall\./);
 assert.match(locationPicker,/selected city is unavailable/i);
 assert.match(stallForm,/form\.checkValidity\(\)/);
 assert.match(stallForm,/scrollIntoView/);
 assert.match(stallForm,/submittingRef/);
 assert.match(stallForm,/Confirm the venue location to enable saving\./);
});

test("stall pictures are not uploaded or displayed",()=>{
 assert.doesNotMatch(stallForm,/CompressedImageInput|name="image"/);
 assert.doesNotMatch(stallAction,/validBrandImageSignature|putR2Object|formData\.get\("image"\)/);
 assert.doesNotMatch(stallDetail,/next\/image|image_path|api\/media\/stall/);
});

test("new paid staffing requests require and persist a stall while legacy rows stay nullable",()=>{
 assert.match(migration,/add column if not exists stall_id uuid/);
 assert.doesNotMatch(migration,/stall_id uuid not null/i);
 assert.match(staffingAction,/eventMode==="stall"/);
 assert.match(staffingAction,/stall_id:stallId\|\|null/);
 assert.match(staffingAction,/opportunity_type:"paid"/);
});

test("volunteers are organizer-event opportunities without rates",()=>{
 assert.match(migration,/opportunity_type[\s\S]+paid[\s\S]+volunteer/i);
 assert.match(migration,/Volunteer openings cannot include payment rates/);
 assert.match(volunteerAction,/requireRole\(\["organizer"\]\)/);
 assert.match(volunteerAction,/opportunity_type:"volunteer"/);
 assert.match(volunteerAction,/hourly_rate:0/);
 assert.match(volunteerAction,/proposed_rate_min:null/);
});
