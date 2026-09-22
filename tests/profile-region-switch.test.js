const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../teacher-directory.js'), 'utf8');
const fn = source.slice(source.indexOf('  function bindProfileRegions('), source.indexOf('  function openTeacherDialog('));
function setup(fetch) {
  const panel = {innerHTML: '', isConnected: true};
  const buttons = ['Songdo', 'Seoul'].map(region => ({dataset: {profileRegion: region}, setAttribute(k,v) {this[k]=v;}, addEventListener(_,cb) {this.click=cb;}}));
  const state = {sourceKind: 'live', region: 'Songdo'};
  const ctx = {state, dialogContent: {querySelector: () => panel, querySelectorAll: () => buttons},
    REGION_LABELS: {Songdo:'송도',Seoul:'서울'}, escapeHtml: s=>s,
    areasMarkup: a=>a.join(','), timetableMarkup: t=>t.region+' schedule', bindTimetable() {}, fetchLiveTeachers:fetch,
    teachersForRegion:()=>[], global:{NADO_TEACHER_DIRECTORY_FALLBACK:[]}};
  vm.createContext(ctx);vm.runInContext(fn,ctx);
  ctx.bindProfileRegions({id:'a', name:'Justina',region:'Songdo',areas:['IGC'],availability:[{}]});
  return {panel,buttons,state};
}
test('profile switches schedules and leaves the listing region unchanged', async()=>{
  const {panel,buttons,state}=setup(async()=>[{id:'a',name:'Justina',region:'Seoul',areas:['강남'],availability:[{}]}]);
  assert.match(panel.innerHTML,/Songdo schedule/);
  await buttons[1].click();
  assert.match(panel.innerHTML,/강남/);assert.match(panel.innerHTML,/Seoul schedule/);
  assert.equal(state.region,'Songdo');
  await buttons[0].click();assert.match(panel.innerHTML,/Songdo schedule/);
});
test('unavailable region gives a region-specific alternative without a timetable',async()=>{
  const {panel,buttons}=setup(async()=>[]);await buttons[1].click();
  assert.match(panel.innerHTML,/현재 서울에서 수업을 진행하지/);
  assert.match(panel.innerHTML,/teachers.html\?region=Seoul/);
  assert.doesNotMatch(panel.innerHTML,/schedule/);
});
test('late response cannot overwrite the region chosen most recently',async()=>{
  let resolve;const {panel,buttons}=setup(()=>new Promise(r=>resolve=r));
  const pending=buttons[1].click();await buttons[0].click();resolve([]);await pending;
  assert.match(panel.innerHTML,/Songdo schedule/);assert.equal(buttons[0]['aria-pressed'],'true');
});
test('network failure is not presented as confirmed lack of service',async()=>{
  const {panel,buttons}=setup(async()=>{throw new Error('offline');});await buttons[1].click();
  assert.match(panel.innerHTML,/불러오지 못했어요/);assert.doesNotMatch(panel.innerHTML,/수업을 진행하지/);
});
