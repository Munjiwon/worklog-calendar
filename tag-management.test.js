const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname,'app.js'),'utf8');
function setup(approve = true) {
  const context = { DEFAULT_TAG:'미지정', shifts:[{tag:'A',date:'2026-10-05',start:'09:00',end:'10:00'}], tagColors:{A:{bg:'blue'}}, tagTargetMinutes:{A:2400}, tagMealSettings:{A:{lunch:{start:720,end:780}}}, hiddenCalendarTags:new Set(['A']), collapsedTags:new Set(['A']), storageKeys:{weekClipboard:'clipboard'}, editTag:{value:'A'}, clipboard:[{tag:'A'}], warning:'' };
  context.normalizeTag = t => t || '미지정'; context.getShiftTag = s => s.tag || '미지정';
  context.getKnownTags = () => ['미지정',...Object.keys(context.tagColors)];
  context.getDefaultTagColor = () => ({bg:'default'});
  context.loadWeekClipboard = () => context.clipboard;
  context.localStorage = {setItem:(key,value)=>{context.clipboard=JSON.parse(value);}};
  context.confirm = text => {context.warning=text;return approve;};
  for(const fn of ['ensureTagColor','saveTagColors','saveTagTargetMinutes','saveTagMealSettings','saveHiddenCalendarTags','saveShifts','render']) context[fn]=()=>{};
  vm.createContext(context);
  vm.runInContext(source.slice(source.indexOf('function renameTag('),source.indexOf('function startTitleEdit(')),context);
  return context;
}
test('renaming migrates shifts, targets, settings, filters and clipboard',()=>{
  const c=setup(); c.renameTag('A','B');
  assert.equal(c.shifts[0].tag,'B'); assert.equal(c.tagTargetMinutes.B,2400);
  assert.equal(c.tagColors.B.bg,'blue'); assert.equal(c.tagMealSettings.B.lunch.start,720);
  assert.equal(c.clipboard[0].tag,'B'); assert.ok(c.hiddenCalendarTags.has('B')); assert.ok(!Object.hasOwn(c.tagColors,'A'));
});
test('deletion warns about schedules, preserves them and removes settings',()=>{
  const c=setup(); c.deleteTag('A');
  assert.match(c.warning,/일정 1개/); assert.equal(c.shifts.length,1); assert.equal(c.shifts[0].tag,'미지정');
  assert.equal(c.clipboard[0].tag,'미지정'); assert.ok(!Object.hasOwn(c.tagTargetMinutes,'A'));
});
test('cancel deletion leaves schedule and settings intact',()=>{
  const c=setup(false); c.deleteTag('A'); assert.equal(c.shifts[0].tag,'A'); assert.equal(c.tagTargetMinutes.A,2400);
});
