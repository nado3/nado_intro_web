const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('age is collected before plan and elementary users see only Standard', () => {
  const source = read('script.js');
  const ageIndex = source.indexOf("key: 'ageGroup'");
  const tierIndex = source.indexOf("key: 'tier'");
  assert.ok(ageIndex >= 0 && tierIndex >= 0 && ageIndex < tierIndex);
  assert.match(source, /options:\s*\['초등학생 이하','중고등학생'/);
  assert.match(source, /isElementaryOrYounger\(answers\.ageGroup\)[\s\S]*?tierOptions = tierOptions\.filter\(option => option\.name === '스탠다드'\)/);
  assert.match(source, /step\.key === 'ageGroup'[\s\S]*?applyStudentAgePolicy\(\)/);
  assert.match(source, /step\.key === 'ageGroup'\) return !elementaryPolicyViolation\(\)/);
  assert.match(source, /answers\.tier = '';[\s\S]*?if \(!DIRECTORY_SELECTION\) \{[\s\S]*?answers\.place = \[\]/);
  assert.match(source, /초등학생 이하는 Standard 수업만 선택할 수 있어요/);
});

test('elementary free trials and fixed non-Standard selections have a blocking route', () => {
  const source = read('script.js');
  assert.match(source, /answers\.trialType === '무료 체험'\) return 'free-trial'/);
  assert.match(source, /무료 체험은 중학생 이상부터 이용할 수 있어요/);
  assert.match(source, /teachers\.html\?finder=trial&trial_type=paid&plan=standard/);
  assert.match(source, /teachers\.html\?finder=region&plan=standard/);
  assert.match(source, /async function showSuccess\(\)\{[\s\S]*?elementaryPolicyViolation\(\)/);
  assert.match(source, /params\.append\('submission\[5\]', a\.ageGroup\)/);
});

test('public trial, pricing, FAQ, and terms copy state the elementary policy', () => {
  const teachers = read('teachers.html');
  const how = read('faq.html');
  const terms = read('terms.html');
  const runtime = read('js/member-config.js') + read('homepage-teacher-finder.js') + read('teacher-directory.js');

  const freeTrialCard = teachers.match(/data-trial-type="free"[\s\S]*?<\/button>/)?.[0] || '';
  assert.doesNotMatch(freeTrialCard, /초등학생 이하/);
  assert.match(read('js/member-config.js'), /초등학생 이하는 Standard만 가능/);
  assert.match(read('index.html'), /초등학생 이하는 Standard 요금제만 신청 가능합니다/);
  assert.match(how, /초등학생 이하는 무료 체험을 이용할 수 없으며, Standard 1회 유료 체험/);
  assert.match(terms, /초등학생 이하 학습자는 Standard 방식의 정규 수업 또는 Standard 1회 유료 체험만 신청/);
  assert.match(terms, /2026년 9월 15일 이후의 신규 신청과 갱신부터 적용/);
  assert.doesNotMatch(runtime, /<strong>대상<\/strong>/);
  assert.match(runtime, /초등학생 이하는 Standard/);
});
