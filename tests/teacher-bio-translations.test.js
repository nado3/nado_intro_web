const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root=path.join(__dirname,'..');
const ctx={};ctx.window=ctx;vm.createContext(ctx);
for(const file of ['teacher-directory-data.js','teacher-bio-translations.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx);
test('all 18 public introductions have English defaults and Korean translations',()=>{
 assert.equal(ctx.NADO_TEACHER_DIRECTORY_FALLBACK.length,18);
 for(const teacher of ctx.NADO_TEACHER_DIRECTORY_FALLBACK){
  const bio=ctx.nadoTeacherBio(teacher);assert.ok(bio,teacher.displayName);
  assert.match(bio.en,/[A-Za-z]/);assert.doesNotMatch(bio.en,/[가-힣]/);assert.match(bio.ko,/[가-힣]/);
 }
});
test('edited live introductions never receive a stale translation',()=>{
 const teacher=ctx.NADO_TEACHER_DIRECTORY_FALLBACK[0];
 assert.equal(ctx.nadoTeacherBio({...teacher,bio:teacher.bio+' Updated.'}),null);
 assert.ok(ctx.nadoTeacherBio({...teacher,name:teacher.displayName,bio:'  '+teacher.bio+'\n'}));
});

test('Abhinay live wording supports translation even with English-only teaching languages',()=>{
 const row=ctx.NADO_TEACHER_DIRECTORY_FALLBACK.find(t=>t.displayName==='Abhinay');
 const live={name:'Abhinay',languages:['English'],bio:row.bio.replace('at George Mason University','in George Mason University Korea')};
 assert.ok(ctx.nadoTeacherBio(live)?.ko);
});
