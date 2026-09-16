import assert from "node:assert/strict";
import { test } from "node:test";
import { talentMatchesJob, workDaysOverlap } from "../src/lib/talent-jobs";

test("booking conflicts include shared boundary days but not adjacent days",()=>{
  const booked={work_starts_on:"2026-10-01",work_ends_on:"2026-10-03"};
  assert.equal(workDaysOverlap(booked,{work_starts_on:"2026-10-03",work_ends_on:"2026-10-04"}),true);
  assert.equal(workDaysOverlap(booked,{work_starts_on:"2026-10-04",work_ends_on:"2026-10-05"}),false);
});

test("alerts require verified online talent in a matching location", () => {
  const talent = { preferredLocationIds: ["loc_delhi"], verified: true, online: true };
  assert.equal(talentMatchesJob(talent, { locationId: "loc_delhi" }), true);
  assert.equal(talentMatchesJob(talent, { locationId: "loc_mumbai" }), false);
  assert.equal(talentMatchesJob({ ...talent, online: false }, { locationId: "loc_delhi" }), false);
});
