import { test } from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import fs from 'node:fs';
const moduleOutput = { exports: {} };
new Function('exports', ts.transpileModule(fs.readFileSync('src/lib/organizer.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(moduleOutput.exports);
const { eventPhase, validDate, indiaToday, validStaffingNeeds } = moduleOutput.exports;
test('event date boundaries include start and end days', () => {
 const e = { status:'published', starts_at:'2026-09-06', ends_at:'2026-09-08' };
 assert.equal(eventPhase(e,'2026-09-05'),'upcoming');
 assert.equal(eventPhase(e,'2026-09-06'),'ongoing');
 assert.equal(eventPhase(e,'2026-09-08'),'ongoing');
 assert.equal(eventPhase(e,'2026-09-09'),'past');
 assert.equal(eventPhase({...e,status:'draft'},'2026-09-09'),'draft');
 assert.equal(eventPhase({...e,status:'cancelled'},'2026-09-05'),'cancelled');
});
test('dates reject impossible calendar values', () => {
 for(const date of ['2026-02-29','2026-02-30','2026-13-01','bad','2026-9-6','']) assert.equal(validDate(date),false,date);
 assert.equal(validDate('2028-02-29'),true);
 assert.match(indiaToday(),/^\d{4}-\d{2}-\d{2}$/);
});
test('published staffing needs require complete positions and positive whole people counts', () => {
 assert.equal(validStaffingNeeds([{title:'Registration crew',people_needed:4},{title:'Host',people_needed:1}]),true);
 for (const needs of [[],[{title:'',people_needed:4}],[{title:'Host',people_needed:null}],[{title:'Host',people_needed:0}],[{title:'Host',people_needed:1.5}],[{title:'Host',people_needed:100001}]]) assert.equal(validStaffingNeeds(needs),false);
});
