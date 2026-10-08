const { test } = require('node:test');
const assert = require('node:assert/strict');
const { plan } = require('./recommendation-engine');
const minutes = t => Number(t.slice(0,2))*60+Number(t.slice(3));
const net = s => minutes(s.end)-minutes(s.start);
const base = { dates:['2026-10-05'], existing:[], history:[], tag:'A', target:120, dailyMax:240, start:540, end:780, allowed:[], classes:()=>[], holiday:()=>false, net };

test('prefers one four-hour block over earlier fragments and short history', () => {
  const r=plan({...base,target:240,end:1020,
    classes:()=>[{start:'11:00',end:'13:00'}],
    history:[{date:'2026-09-28',start:'09:00',end:'10:00',tag:'A'}]});
  assert.equal(r.missing,0);
  assert.equal(r.items.length,1);
  assert.equal(r.items[0].start,'13:00');
  assert.equal(r.items[0].end,'17:00');
});

test('splits only when needed and never crosses blocked classes', () => {
  const r=plan({...base,target:240,end:960,classes:()=>[{start:'11:00',end:'14:00'}]});
  assert.equal(r.missing,0);
  assert.equal(r.items.length,2);
  assert.deepEqual(r.items.map(s=>[s.start,s.end]),[['09:00','11:00'],['14:00','16:00']]);
});

test('chooses an intact block on another date before a preferred fragment', () => {
  const r=plan({...base,dates:['2026-10-05','2026-10-06'],target:240,
    history:[{date:'2026-09-28',start:'09:00',end:'10:00',tag:'A'}],
    classes:d=>d==='2026-10-05'?[{start:'11:00',end:'13:00'}]:[]});
  assert.equal(r.items.length,1);
  assert.equal(r.items[0].date,'2026-10-06');
  assert.equal(r.items[0].minutes,240);
});

const mealNet = s => net(s) - [[720,780],[1080,1140]].reduce((sum,[start,end]) =>
  sum + Math.max(0, Math.min(minutes(s.end),end)-Math.max(minutes(s.start),start)), 0);

test('skips lunch starts even when history and AI prefer them', () => {
  for (const target of [60,240]) {
    const r=plan({...base,start:735,end:1020,target,net:mealNet,
      history:[{date:'2026-09-28',start:'12:15',end:'17:00',tag:'A'}],
      preferences:[{day:1,start:735}]});
    assert.equal(r.missing,0);
    assert.equal(r.items[0].start,'13:00');
    assert.equal(r.items[0].end,target===60?'14:00':'17:00');
  }
});

test('skips dinner starts and reports shortage for meal-only availability', () => {
  const r=plan({...base,start:1080,end:1200,target:60,net:mealNet});
  assert.equal(r.items[0].start,'19:00');
  assert.equal(r.missing,0);
  const mealOnly=plan({...base,start:720,end:780,net:mealNet});
  assert.equal(mealOnly.items.length,0);
  assert.equal(mealOnly.missing,120);
});

test('preserves shifts spanning meals and follows custom tag meal deductions', () => {
  const r=plan({...base,start:660,end:840,target:120,net:mealNet});
  assert.equal(r.items[0].start,'11:00');
  assert.equal(r.items[0].end,'14:00');
  assert.equal(r.items[0].minutes,120);
  const custom=s=>net(s)-(s.tag==='A'?Math.max(0,Math.min(minutes(s.end),810)-Math.max(minutes(s.start),750)):0);
  const customResult=plan({...base,start:750,end:870,target:60,net:custom});
  assert.equal(customResult.items[0].start,'13:30');
  assert.equal(plan({...base,start:750,end:870,target:60,net:custom,tag:'B'}).items[0].start,'12:30');
});
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
