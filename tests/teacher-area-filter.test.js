const test = require('node:test');
const assert = require('node:assert/strict');
require('../teacher-directory.js');
const {teachersForArea, teachersForView, directApplicationParams} = global.NADO_TEACHER_DIRECTORY_TESTING;
const teachers = [
 {id:'one',name:'One',region:'Seoul',planGroups:['economy','standard'],areas:['강남','대치'],availability:[{areas:['강남'],dayLabel:'월요일',startTime:'13:00',endTime:'16:00'}]},
 {id:'two',name:'Two',region:'Seoul',planGroups:['standard'],areas:['용산'],availability:[{areas:['용산'],dayLabel:'화요일',startTime:'13:00',endTime:'16:00'}]}
];
test('Seoul area filter matches exact places and preserves all when cleared',()=>{
 assert.deepEqual(teachersForArea(teachers,'강남').map(t=>t.id),['one']);
 assert.deepEqual(teachersForArea(teachers,'용산').map(t=>t.id),['two']);
 assert.equal(teachersForArea(teachers,'강').length,0);
 assert.equal(teachersForArea(teachers,'').length,2);
 assert.equal(teachersForArea(teachersForView(teachers,{mode:'trial',trialType:'paid',planFilter:'economy'}),'용산').length,0);
});
test('paid direct selection keeps teacher, one-lesson mode, plan and region',()=>{
 const teacher=teachers[0];
 const params=directApplicationParams(teacher,teacher.availability[0],{mode:'trial',trialType:'paid',plan:'standard',sourceKind:'live'});
 assert.equal(params.get('trial_type'),'paid');
 assert.equal(params.get('mode'),'trial');
 assert.equal(params.get('teacher_id'),'one');
 assert.equal(params.get('plan'),'standard');
 assert.equal(params.get('region'),'Seoul');
});
