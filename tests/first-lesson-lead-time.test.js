const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const policy = require(path.join(root, 'lesson-time-policy.js'));
const policySource = fs.readFileSync(path.join(root, 'lesson-time-policy.js'), 'utf8');
const source = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const NOW = '2026-10-16T09:00:00+09:00';

function section(start, end) {
  const from = source.indexOf(start);
  const to = source.indexOf(end, from);
  assert.ok(from >= 0 && to > from, 'Application section exists: ' + start);
  return source.slice(from, to);
}

const initialization = section('const DURATIONS', 'const ANALYTICS_FORM_ID');
const scheduleFunctions = section('let firstLessonDateWindow', 'function renderHistory');
const validation = section('function checkValid', 'function setNextState');
const matching = section('async function startTeacherMatching', "nextBtn.addEventListener('click'");
const submission = section('async function showSuccess', '\nrenderStep();');

function createApplication({ now = NOW, trial = false, params = {} } = {}) {
  const clock = { now: Date.parse(now) };
  class ClockDate extends Date {
    constructor(...args) { super(...(args.length ? args : [clock.now])); }
    static now() { return clock.now; }
  }
  const location = new URL(trial ? 'https://hellonado.com/trial.html' : 'https://hellonado.com/apply.html');
  location.search = new URLSearchParams(params).toString();
  const elements = new Map();
  const context = vm.createContext({
    URL, URLSearchParams, Date: ClockDate, location,
    window: { location },
    document: {
      body: { dataset: trial ? { mode: 'trial' } : {} },
      addEventListener() {},
      getElementById(id) {
        if (!elements.has(id)) elements.set(id, { style: {}, textContent: '' });
        return elements.get(id);
      }
    }
  });
  vm.runInContext(policySource, context, { timeout: 1000 });
  vm.runInContext(initialization + '\n' + scheduleFunctions + '\n' + validation + `
    let matchingRequestId = 0;
    let matchingViewActive = false;
    let matchingInProgress = false;
    let alreadySubmitted = false;
    let submissionInProgress = false;
    let renderCount = 0;
    const nextBtn = { dataset: {} };
    function renderStep() { renderCount++; }
  ` + matching + '\n' + submission, context, { timeout: 1000 });
  return {
    clock,
    elements,
    run(code) { return vm.runInContext(code, context, { timeout: 1000 }); },
    data(code) { return JSON.parse(vm.runInContext('JSON.stringify(' + code + ')', context)); },
    valid(date, time) {
      return vm.runInContext('validFirstLessonOption(' + JSON.stringify({ date, time }) + ')', context);
    }
  };
}

function directoryParams({ preferredDate, preferredTime = '15:00', end = '18:00', trial = false } = {}) {
  const selection = {
    source: 'teacher-directory', source_kind: 'live',
    teacher_id: '123e4567-e89b-42d3-a456-426614174000', teacher_name: 'Amy',
    plan: 'standard', region: 'Songdo', area: '트리플스트리트',
    day: '금요일', start: '13:00', end,
    available_minutes: String((Number(end.slice(0, 2)) - 13) * 60),
    mode: trial ? 'trial' : 'regular'
  };
  if (preferredDate === undefined) return selection;
  return {
    ...selection,
    preferred_date: preferredDate,
    time_choices: JSON.stringify([new URLSearchParams({ ...selection, preferred_time: preferredTime }).toString()])
  };
}

test('the shared policy rejects before and exactly five hours, and permits later starts', () => {
  const now = Date.parse(NOW);
  assert.equal(policy.isAllowed('2026-10-16', '13:59', now), false);
  assert.equal(policy.isAllowed('2026-10-16', '14:00', now), false);
  assert.equal(policy.isAllowed('2026-10-16', '14:01', now), true);
  assert.equal(policy.isAllowed('2026-10-16', '14:00', now - 1), true);
  assert.equal(policy.isAllowed('2026-10-16', '14:00', now + 1), false);
});

test('five-hour cutoff and today roll over using Korea time', () => {
  const now = Date.parse('2026-10-16T23:30:00+09:00');
  assert.equal(policy.today(now), '2026-10-16');
  assert.equal(policy.today(Date.parse('2026-10-16T15:00:00Z')), '2026-10-17');
  assert.equal(policy.isAllowed('2026-10-16', '23:59', now), false);
  assert.equal(policy.isAllowed('2026-10-17', '04:30', now), false);
  assert.equal(policy.isAllowed('2026-10-17', '04:31', now), true);
  const app = createApplication({ now: '2026-10-16T15:00:00Z' });
  assert.equal(app.run('availableFirstLessonDates()[0]'), '2026-10-17');
  assert.equal(app.valid('2026-10-16', '23:00'), false);
  assert.equal(app.valid('2026-10-17', '09:00'), true);
});

test('invalid calendar dates, malformed times, and invalid clocks are rejected', () => {
  const now = Date.parse('2026-01-01T00:00:00+09:00');
  for (const date of ['2026-02-29', '2026-02-30', '2026-13-01', '2026-10-00', '2026-2-01', '']) {
    assert.equal(policy.isAllowed(date, '15:00', now), false, date);
  }
  for (const time of ['24:00', '15:60', '9:00', '15:00:00', '', null]) {
    assert.equal(policy.isAllowed('2026-10-16', time, now), false, String(time));
  }
  assert.equal(policy.isAllowed('2026-10-16', '15:00', NaN), false);
  assert.equal(policy.isAllowed('2028-02-29', '15:00', now), true);
});

test('both application modes combine the lead time with half-hour and operating-hour limits', () => {
  for (const trial of [false, true]) {
    const app = createApplication({ trial });
    assert.equal(app.valid('2026-10-16', '13:30'), false);
    assert.equal(app.valid('2026-10-16', '14:00'), false);
    assert.equal(app.valid('2026-10-16', '14:01'), false);
    assert.equal(app.valid('2026-10-16', '14:30'), true);
    assert.equal(app.valid('2026-10-17', '08:30'), false);
    assert.equal(app.valid('2026-10-17', '09:00'), true);
    assert.equal(app.valid('2026-10-17', '23:00'), true);
    assert.equal(app.valid('2026-10-17', '23:30'), false);
  }
});

test('lesson duration must fit before midnight and inside a selected teacher window', () => {
  const app = createApplication();
  app.run('answers.duration.index = 1');
  assert.equal(app.valid('2026-10-16', '22:00'), true);
  assert.equal(app.valid('2026-10-16', '22:30'), false);

  const directory = createApplication({ params: directoryParams({ end: '16:00' }) });
  assert.equal(directory.valid('2026-10-16', '15:00'), true);
  directory.run('answers.duration.index = 1');
  assert.equal(directory.valid('2026-10-16', '14:30'), false);
  assert.equal(directory.valid('2026-10-16', '15:00'), false);
  assert.equal(directory.valid('2026-10-23', '14:00'), true);
});

test('teacher-selected applications still enforce weekday, time window, and chosen start time', () => {
  const app = createApplication({ params: directoryParams() });
  assert.equal(app.valid('2026-10-16', '15:00'), true);
  assert.equal(app.valid('2026-10-17', '15:00'), false);
  assert.equal(app.valid('2026-10-23', '12:30'), false);
  assert.equal(app.valid('2026-10-23', '17:30'), false);
  const fixed = createApplication({ params: directoryParams({ preferredDate: '2026-10-16' }) });
  assert.equal(fixed.valid('2026-10-16', '15:00'), true);
  assert.equal(fixed.valid('2026-10-16', '15:30'), false);
});

test('stale or exact-cutoff preferred-date URLs must retain the schedule question', () => {
  for (const trial of [false, true]) {
    for (const [preferredDate, preferredTime] of [
      ['2026-10-09', '15:00'], ['2026-10-16', '13:30'], ['2026-10-16', '14:00']
    ]) {
      const app = createApplication({ trial, params: directoryParams({ preferredDate, preferredTime, trial }) });
      assert.equal(app.run('DIRECTORY_PREFERRED_DATE'), '');
      assert.equal(app.run("activeSteps.some(step => step.key === 'schedule')"), true);
    }
    const valid = createApplication({ trial, params: directoryParams({ preferredDate: '2026-10-16', trial }) });
    assert.equal(valid.run('DIRECTORY_PREFERRED_DATE'), '2026-10-16');
    assert.equal(valid.run("activeSteps.some(step => step.key === 'schedule')"), false);
    assert.equal(valid.run('answers.firstLessonOptions.every(validFirstLessonOption)'), true);
  }
});

test('a selected time is revalidated as time passes and returns to schedule selection on expiry', () => {
  const app = createApplication();
  app.run(`
    answers.firstLessonOptions = [{ date: '2026-10-16', time: '15:00' }];
    syncFirstLessonOptions();
    answers.payment = true;
    nextBtn.dataset.submitted = '1';
    matchingViewActive = true;
    matchingInProgress = true;
  `);
  assert.equal(app.run("checkValid({ key: 'schedule', type: 'firstlesson', required: true })"), true);
  assert.equal(app.run('ensureFirstLessonSelection()'), true);
  app.clock.now = Date.parse('2026-10-16T10:00:00+09:00');
  assert.equal(app.run("checkValid({ key: 'schedule', type: 'firstlesson', required: true })"), false);
  assert.equal(app.run('ensureFirstLessonSelection()'), false);
  assert.deepEqual(app.data('answers.firstLessonOptions'), []);
  assert.equal(app.run('answers.startDate'), '');
  assert.equal(app.run('answers.payment'), false);
  assert.equal(app.run('activeSteps[current].key'), 'schedule');
  assert.equal(app.run('matchingViewActive || matchingInProgress'), false);
  assert.equal(app.run('nextBtn.dataset.submitted'), undefined);
  assert.equal(app.elements.get('bottombar').style.display, 'block');
  assert.match(app.elements.get('firstLessonError').textContent, /5시간/);
});

test('an expiring preferred URL restores the previously skipped schedule question', () => {
  const app = createApplication({ params: directoryParams({ preferredDate: '2026-10-16' }) });
  assert.equal(app.run("activeSteps.some(step => step.key === 'schedule')"), false);
  app.clock.now = Date.parse('2026-10-16T10:00:00+09:00');
  assert.equal(app.run('ensureFirstLessonSelection()'), false);
  assert.equal(app.run('activeSteps[current].key'), 'schedule');
  assert.equal(app.run("buildActiveSteps().some(step => step.key === 'schedule')"), true);
  assert.equal(app.run('answers.teacher_name'), 'Amy');
});

test('matching and final submission stop before external work when a selected time has expired', async () => {
  for (const method of ['startTeacherMatching', 'showSuccess']) {
    const app = createApplication();
    app.run(`answers.firstLessonOptions = [{ date: '2026-10-16', time: '14:00' }];`);
    await app.run(method + '()');
    assert.equal(app.run('activeSteps[current].key'), 'schedule');
    assert.equal(app.run('submissionInProgress'), false);
    assert.equal(app.run('matchingInProgress'), false);
    assert.equal(app.run('alreadySubmitted'), false);
  }
});
