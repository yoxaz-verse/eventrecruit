import { test } from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import fs from 'node:fs';
const moduleOutput = { exports: {} };
new Function('exports', ts.transpileModule(fs.readFileSync('src/lib/organizer.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(moduleOutput.exports);
const { eventPhase, validDate, indiaToday, validStaffingNeeds, validBookingSlot, validSpaceOffer, validSpaceAttachment } = moduleOutput.exports;
test('event date boundaries include start and end days', () => {
 const e = { status:'published', starts_at:'2026-09-06', ends_at:'2026-09-08' };
 assert.equal(eventPhase(e,'2026-09-05'),'upcoming');
 assert.equal(eventPhase(e,'2026-09-06'),'ongoing');
 assert.equal(eventPhase(e,'2026-09-08'),'ongoing');
 assert.equal(eventPhase(e,'2026-09-09'),'past');
 assert.equal(eventPhase({...e,status:'draft'},'2026-09-09'),'draft');
 assert.equal(eventPhase({...e,status:'cancelled'},'2026-09-05'),'cancelled');
});
test('booking slots require a valid India-time event date, increasing times, and capacity', () => {
 const slot={slot_date:'2026-10-05',start_time:'09:00',end_time:'10:00',capacity:25};
 assert.equal(validBookingSlot(slot,'2026-10-01','2026-10-10'),true);
 for (const changed of [{slot_date:'2026-09-30'},{start_time:'10:00'},{end_time:'08:00'},{capacity:0},{capacity:1.5},{capacity:100001}]) assert.equal(validBookingSlot({...slot,...changed},'2026-10-01','2026-10-10'),false);
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
test('space offers support fixed, per-square-foot, and quoted pricing', () => {
 const base={name:'Bare space',description:'',inclusions:'',area_sqft:null,unit_count:null,price_type:'quote',price_inr:null};
 assert.equal(validSpaceOffer(base),true);
 assert.equal(validSpaceOffer({...base,price_type:'fixed',price_inr:25000}),true);
 assert.equal(validSpaceOffer({...base,price_type:'per_sqft',price_inr:300,area_sqft:100,unit_count:3}),true);
 for(const changed of [{name:''},{price_type:'fixed'},{price_type:'quote',price_inr:10},{area_sqft:0},{unit_count:1.5},{price_inr:-1,price_type:'per_sqft'}]) assert.equal(validSpaceOffer({...base,...changed}),false);
});
test('space asset size and mime limits', () => {
 assert.equal(validSpaceAttachment({size:1024,type:'application/pdf'}),true);
 assert.equal(validSpaceAttachment({size:0,type:'image/png'}),false);
 assert.equal(validSpaceAttachment({size:5*1024*1024+1,type:'image/png'}),false);
 assert.equal(validSpaceAttachment({size:1024,type:'image/svg+xml'}),false);
});
