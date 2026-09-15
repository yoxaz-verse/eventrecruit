import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { hasExhibitorAccess } from "../src/lib/agency-access";

const migration=fs.readFileSync(new URL("../supabase/migrations/014_agency_managed_exhibitors.sql",import.meta.url),"utf8");
test("agency relationships are many-to-many and status constrained",()=>{assert.match(migration,/create table public\.agency_exhibitor_relationships/i);assert.match(migration,/unique\(agency_id, exhibitor_id\)/i);assert.match(migration,/\('pending','active','declined','revoked'\)/i)});
test("legacy agency links and exhibitor-owned inquiries are backfilled",()=>{assert.match(migration,/insert into public\.agency_exhibitor_relationships/i);assert.match(migration,/update public\.event_space_inquiries/i);assert.match(migration,/foreign key\(exhibitor_id\) references public\.exhibitors/i)});
test("external clients and actor attribution are represented",()=>{assert.match(migration,/exhibitor_kind as enum \('platform','external'\)/i);assert.match(migration,/created_by_agency_id/i);assert.match(migration,/add column actor_id/i);assert.match(migration,/placement_reviews_exhibitor_principal_unique/i)});
test("new workspace tables remain server-only",()=>{assert.match(migration,/revoke all on public\.agency_exhibitor_relationships, public\.exhibitor_reputation from public, anon, authenticated/i);assert.match(migration,/grant select,insert,update on public\.agency_exhibitor_relationships to service_role/i)});
test("owners and only active matching agencies receive access",()=>{const base={actorId:"actor",ownerId:"owner",agencyId:"agency",relationshipAgencyId:"agency"};assert.equal(hasExhibitorAccess({...base,actorId:"owner",relationshipStatus:"revoked"}),true);assert.equal(hasExhibitorAccess({...base,relationshipStatus:"active"}),true);for(const status of ["pending","declined","revoked",null])assert.equal(hasExhibitorAccess({...base,relationshipStatus:status}),false);assert.equal(hasExhibitorAccess({...base,relationshipStatus:"active",relationshipAgencyId:"other"}),false)});
