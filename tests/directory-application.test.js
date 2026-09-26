const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const applicationSource = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const helperStart = applicationSource.indexOf('const DIRECTORY_PLAN_LABELS');
const helperEnd = applicationSource.indexOf('const DIRECTORY_SELECTION');
const helperSource = applicationSource.slice(helperStart, helperEnd)
  + '\nthis.parseDirectorySelectionForTest = parseDirectorySelection;'
  + '\nthis.nextDirectoryWeekdayForTest = nextDirectoryWeekday;'
  + '\nthis.isValidDirectoryStartDateForTest = isValidDirectoryStartDate;'
  + '\nthis.isSongdoDiscountAreaListForTest = isSongdoDiscountAreaList;'
  + '\nthis.directoryReturnHrefForTest = directoryReturnHrefFor;';
const context = vm.createContext({ Object, String, Number, Date, Array, Set, URLSearchParams });
vm.runInContext(helperSource, context);

function selection(overrides = {}, options = {}) {
  const params = new URLSearchParams({
    source: 'teacher-directory',
    teacher_id: 'preview-amy',
    teacher_name: 'Amy',
    plan: 'economy',
    region: 'Songdo',
    day: '월요일',
    start: '13:00',
    end: '15:00',
    available_minutes: '120',
    area: '트리플스트리트',
    mode: 'regular',
    source_kind: 'snapshot',
    ...overrides
  });
  return context.parseDirectorySelectionForTest('?' + params.toString(), {
    pageMode: 'regular',
    localTestMode: true,
    ...options
  });
}

test('a local snapshot selection is normalized into safe application data', () => {
  const result = selection();
  assert.equal(result.teacherId, 'preview-amy');
  assert.equal(result.plan, '이코노미');
  assert.equal(result.region, 'Songdo');
  assert.equal(result.day, '월');
  assert.equal(result.timeLabel, '월요일 13:00–15:00');
  assert.equal(result.availableMinutes, 120);
});

test('a regular teacher time can defer Economy or Standard selection to the form', () => {
  const result = selection({ plan: '', plan_options: 'economy,standard' });
  assert.equal(result.plan, undefined);
  assert.deepEqual(Array.from(result.planOptions), ['이코노미', '스탠다드']);
  assert.equal(selection({ plan: '', plan_options: 'economy,premium' }), null);
  assert.equal(selection({ mode: 'trial', plan: '', plan_options: 'economy,standard' }, { pageMode: 'trial' }), null);
});

test('prototype property names cannot become directory plans or weekdays', () => {
  assert.equal(selection({ plan: 'constructor' }), null);
  assert.equal(selection({ plan: 'toString' }), null);
  assert.equal(selection({ day: 'constructor' }), null);
  assert.equal(selection({ day: 'toString' }), null);
});

test('snapshot teacher selections are rejected outside local test mode', () => {
  assert.equal(selection({}, { localTestMode: false }), null);
});

test('live teacher selections require a UUID and matching application mode', () => {
  const uuid = '123e4567-e89b-42d3-a456-426614174000';
  assert.equal(selection({ source_kind: 'live', teacher_id: uuid }, { localTestMode: false }).teacherId, uuid);
  assert.equal(selection({ source_kind: 'live', teacher_id: 'preview-amy' }, { localTestMode: false }), null);
  assert.equal(selection({ mode: 'trial' }, { pageMode: 'regular' }), null);
});

test('trial directory selections are limited to Songdo and valid time ranges', () => {
  assert.ok(selection({ mode: 'trial' }, { pageMode: 'trial' }));
  assert.equal(selection({ mode: 'trial', region: 'Seoul' }, { pageMode: 'trial' }), null);
  assert.equal(selection({ mode: 'trial', plan: 'standard' }, { pageMode: 'trial' }), null);
  assert.equal(selection({ mode: 'trial', area: '송도 내 협의' }, { pageMode: 'trial' }), null);
  assert.equal(selection({ end: '12:30', available_minutes: '120' }), null);
  assert.equal(selection({ end: '13:45', available_minutes: '45' }), null);

  const paidSeoul = selection({
    mode: 'trial',
    trial_type: 'paid',
    plan: 'standard',
    region: 'Seoul',
    area: '강남'
  }, { pageMode: 'trial' });
  assert.equal(paidSeoul.trialType, 'paid');
  assert.equal(paidSeoul.plan, '스탠다드');
});

test('available minutes must match the selected time window', () => {
  assert.equal(selection({ available_minutes: '60' }), null);
  assert.equal(selection({ end: '14:00', available_minutes: '60' }).availableMinutes, 60);
});

test('direct applications use the next local matching weekday and reject other weekdays', () => {
  const localTuesday = new Date(2026, 8, 15, 23, 30);
  assert.equal(context.nextDirectoryWeekdayForTest('목', localTuesday), '2026-09-17');
  assert.equal(context.nextDirectoryWeekdayForTest('화', localTuesday), '2026-09-22');
  assert.equal(context.isValidDirectoryStartDateForTest('2026-09-17', '목', localTuesday), true);
  assert.equal(context.isValidDirectoryStartDateForTest('2026-09-18', '목', localTuesday), false);
  assert.equal(context.isValidDirectoryStartDateForTest('2026-09-10', '목', localTuesday), false);
});

test('Songdo discount applies only when every possible area is designated', () => {
  assert.equal(context.isSongdoDiscountAreaListForTest(['IGC 인천글로벌캠퍼스']), true);
  assert.equal(context.isSongdoDiscountAreaListForTest(['IGC 인천글로벌캠퍼스', '송도 트리플스트리트']), true);
  assert.equal(context.isSongdoDiscountAreaListForTest(['송도 내 협의']), false);
  assert.equal(context.isSongdoDiscountAreaListForTest(['IGC 인천글로벌캠퍼스', '송도 내 협의']), false);
});

test('return links preserve the selected region and reopen the teacher list', () => {
  const regular = selection({ plan: '', plan_options: 'economy,standard' });
  assert.equal(
    context.directoryReturnHrefForTest(regular, false, ''),
    'teachers.html?region=Songdo#teacherDirectory'
  );

  const paidTrial = selection({
    mode: 'trial',
    trial_type: 'paid',
    plan: 'standard',
    region: 'Seoul',
    area: '강남'
  }, { pageMode: 'trial' });
  assert.equal(
    context.directoryReturnHrefForTest(paidTrial, true, '플랜 선택 체험'),
    'teachers.html?finder=trial&trial_type=paid&plan=standard&region=Seoul#teacherDirectory'
  );
});

test('direct directory applications have a visible summary and bypass matching search', () => {
  const applyHtml = fs.readFileSync(path.join(root, 'apply.html'), 'utf8');
  const trialHtml = fs.readFileSync(path.join(root, 'trial.html'), 'utf8');
  assert.match(applyHtml, /id="directorySelectionSummary"/);
  assert.match(trialHtml, /id="directorySelectionSummary"/);
  assert.match(applyHtml, /teachers\.html\?finder=region#teacherRegionPicker" data-directory-return/);
  assert.match(trialHtml, /teachers\.html\?finder=trial#teacher-finder" data-directory-return/);
  assert.match(applyHtml, /directory-application\.css\?v=13/);
  assert.match(applyHtml, /style\.css\?v=47/);
  assert.match(trialHtml, /style\.css\?v=47/);
  assert.match(applyHtml, /responsive-overrides\.css\?v=7/);
  assert.match(applyHtml, /script\.js\?v=48/);
  assert.match(trialHtml, /script\.js\?v=48/);
  assert.match(applyHtml, /@supabase\/supabase-js@2\.57\.4/);
  assert.match(trialHtml, /@supabase\/supabase-js@2\.57\.4/);
  assert.match(applicationSource, /else if \(DIRECTORY_SELECTION\) \{\s*showSuccess\(\);/);
  assert.match(applicationSource, /new Set\(\['trialType', 'place', 'startDate'\]\)/);
  assert.match(applicationSource, /if \(DIRECTORY_SELECTION\.plan\) skipped\.add\('tier'\)/);
  assert.match(applicationSource, /DIRECTORY_SELECTION\.planOptions\.includes\(option\.name\)/);
  assert.match(applicationSource, /duration: \{ index: 0 \}/);
  assert.match(applyHtml, /id="directoryDurationPicker"/);
  assert.match(applicationSource, /selectionTypeLabel[\s\S]*durationLabel\(answers\.duration\.index\)/);
  assert.match(applicationSource, /DIRECTORY_SELECTION\.availableMinutes < 120/);
  assert.doesNotMatch(applicationSource, /DIRECTORY_SELECTION\.plan \+ ' · 수업 시간 선택'/);
  assert.doesNotMatch(applicationSource, /1시간으로 선택되어 있어요/);
  assert.doesNotMatch(applicationSource, /기본은 1시간이에요/);
  assert.match(applicationSource, /selectionTitle\.textContent = DIRECTORY_SELECTION\.teacherName \+ ' 선생님'/);
  assert.doesNotMatch(applyHtml, /id="directorySelectionTeacher"/);
  assert.match(applicationSource, /const tierChanged = answers\.tier !== el\.dataset\.value;\s*if \(tierChanged\) answers\.payment = false;/);
  assert.match(applicationSource, /s\.key !== 'trialType'/);
  assert.doesNotMatch(applicationSource, /class="inline-duration-picker"/);
  assert.match(applicationSource, /DIRECTORY_SELECTION\.availableMinutes >= 120/);
  assert.match(applicationSource, /disabled aria-disabled="true"/);
  assert.match(applicationSource, /selectedAreaDisplay = normalizedAreas\.join\(' 또는 '\)/);
  assert.match(applicationSource, /\(최종 장소 조율\)/);
  assert.match(applicationSource, /bubble\.textContent = text/);
  assert.match(applicationSource, /text \+ ' 답변 수정'/);
  assert.doesNotMatch(applicationSource, /history-edit-label/);
  assert.doesNotMatch(applicationSource, /editLabel\.textContent = '수정'/);
  assert.match(applicationSource, /return directoryReturnHrefFor\(DIRECTORY_SELECTION, TRIAL_MODE, answers\.trialType\)/);
  assert.match(applicationSource, /centerCurrentQuestion\(\)/);
  assert.match(applicationSource, /첫 번째 수업 시간대만 신청해 주세요/);
  assert.match(applicationSource, /두 번째 수업 시간은 선생님 확정 시 조율합니다/);
  assert.doesNotMatch(applicationSource, /item\.innerHTML = '<div class="history-bubble">'/);
  assert.match(applicationSource, /isValidDirectoryStartDate\(v, DIRECTORY_SELECTION\.day\)/);
  assert.match(applicationSource, /요일 날짜만 선택할 수 있어요/);
  assert.match(applicationSource, /showSubmitError\(err && err\.message\)/);
  assert.match(applicationSource, /선생님 목록에서 다시 선택하기/);
  assert.doesNotMatch(applyHtml, /<script async src="https:\/\/www\.googletagmanager\.com/);
  assert.doesNotMatch(trialHtml, /<script async src="https:\/\/www\.googletagmanager\.com/);
  assert.match(applyHtml, /\['hellonado\.com', 'www\.hellonado\.com'\]\.includes/);
  assert.match(trialHtml, /\['hellonado\.com', 'www\.hellonado\.com'\]\.includes/);
});
