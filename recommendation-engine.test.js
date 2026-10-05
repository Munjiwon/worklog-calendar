const { test } = require('node:test');
const assert = require('node:assert/strict');
const { plan } = require('./recommendation-engine');
const minutes = t => Number(t.slice(0,2))*60+Number(t.slice(3));
const net = s => minutes(s.end)-minutes(s.start);
const base = { dates:['2026-10-05'], existing:[], history:[], tag:'A', target:120, dailyMax:240, start:540, end:780, allowed:[], classes:()=>[], holiday:()=>false, net };
test('excludes classes and stops at exact target', () => {
  const r=plan({...base, classes:()=>[{start:'09:00',end:'11:00'}]});
  assert.equal(r.missing,0); assert.equal(r.items[0].start,'11:00'); assert.equal(r.items[0].minutes,120);
});
test('uses free time before permitted overlap and rejects unapproved tags', () => {
  const existing=[{date:base.dates[0],start:'09:00',end:'12:00',tag:'B'}];
  const r=plan({...base,existing,allowed:['B']});
  assert.equal(r.missing,0); assert.equal(r.items.filter(s=>s.overlapTags.length===0).reduce((n,s)=>n+s.minutes,0),60);
  assert.equal(plan({...base,existing}).missing,60);
  assert.equal(plan({...base,existing:[...existing,{...existing[0],tag:'C'}],allowed:['B']}).missing,60);
});
test('respects holiday and daily cap including existing time', () => {
  assert.equal(plan({...base,holiday:()=>true}).missing,120);
  const r=plan({...base,dailyMax:120,existing:[{date:base.dates[0],start:'08:00',end:'09:00',tag:'A'}]});
  assert.equal(r.missing,60);
});
test('deducts meals and prefers historical weekdays and start times', () => {
  const mealNet=s=>net(s)-Math.max(0,Math.min(minutes(s.end),780)-Math.max(minutes(s.start),720));
  const r=plan({...base,dates:['2026-10-05','2026-10-06'],end:900, history:[{date:'2026-09-29',start:'11:00',end:'14:00'}],net:mealNet});
  assert.equal(r.items[0].date,'2026-10-06'); assert.equal(r.items.reduce((n,s)=>n+s.minutes,0),120);
});
