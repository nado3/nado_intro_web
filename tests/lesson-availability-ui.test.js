const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const policySource = fs.readFileSync(path.join(root, 'lesson-time-policy.js'), 'utf8');

function section(start, end, after = 0) {
  const from = source.indexOf(start, after);
  const to = source.indexOf(end, from);
  assert.ok(from >= 0 && to > from, 'Application section exists: ' + start);
  return source.slice(from, to);
}

const initialization = section('const DURATIONS', 'const ANALYTICS_FORM_ID');
const scheduleFunctions = section('let firstLessonDateWindow', 'function renderHistory');
const validation = section('function checkValid', 'function focusRenderedChoice');
const availabilityContext = section('function matchingLocation()', 'function loadFirstLessonDirectory');
const eventMarker = "} else if (step.type === 'firstlesson') {\n    const dateInput";
const eventStart = source.indexOf(eventMarker, source.indexOf('function renderStep'));
assert.ok(eventStart >= 0, 'The rendered schedule event-binding block exists');
const scheduleEvents = section(
  "    const dateInput = document.getElementById('firstLessonDate');",
  "} else if (step.type === 'gridtime'){",
  eventStart
);

function element(id) {
  const attributes = new Map();
  const classes = new Set();
  const listeners = new Map();
  return {
    id, value: '', textContent: '', innerHTML: '', dataset: {}, style: {},
    hidden: false, disabled: false,
    classList: {
      toggle(name, enabled) { enabled ? classes.add(name) : classes.delete(name); },
      contains(name) { return classes.has(name); }
    },
    setAttribute(name, value) { attributes.set(name, String(value)); },
    getAttribute(name) { return attributes.get(name) ?? null; },
    removeAttribute(name) { attributes.delete(name); },
    addEventListener(name, handler) {
      if (!listeners.has(name)) listeners.set(name, []);
      listeners.get(name).push(handler);
    },
    emit(name, event = {}) {
      for (const handler of listeners.get(name) || []) handler(event);
    },
    querySelector() { return { focus() {} }; }
  };
}

function directTeacherParams() {
  return {
    source: 'teacher-directory', source_kind: 'live',
    teacher_id: '123e4567-e89b-42d3-a456-426614174000', teacher_name: 'Amy',
    plan: 'standard', region: 'Songdo', area: '트리플스트리트',
    day: '토요일', start: '09:00', end: '20:00', available_minutes: '660', mode: 'regular'
  };
}

function createApplication({ direct = false, date = '2026-10-30', now = '2026-10-29T08:00:00+09:00' } = {}) {
  const clock = { now: Date.parse(now) };
  class ClockDate extends Date {
    constructor(...args) { super(...(args.length ? args : [clock.now])); }
    static now() { return clock.now; }
  }
  const location = new URL('https://hellonado.com/apply.html');
  if (direct) location.search = new URLSearchParams(directTeacherParams()).toString();
  const elements = new Map();
  const requests = [];
  const counted = [];
  let currentView;
  let timerId = 0;
  const nextBtn = element('nextBtn');
  const skipBtn = element('skipBtn');
  const context = vm.createContext({
    URL, URLSearchParams, Date: ClockDate, location, nextBtn, skipBtn,
    window: {
      location,
      setInterval() { return ++timerId; },
      clearInterval() {},
      NADO_LESSON_AVAILABILITY: {
        countTeachersAt(rows, filters, time) {
          counted.push({ rows, filters, time });
          return rows.count;
        },
        // The UI consumes the three levels; counting and thresholds have their own tests.
        density(count) { return count === 0 ? 'low' : count === 1 ? 'medium' : 'high'; }
      }
    },
    document: {
      hidden: false,
      body: { dataset: {} },
      addEventListener() {},
      getElementById(id) { return elements.get(id) || null; }
    },
    qcardWrap: {
      querySelectorAll(selector) { return selector === '[data-first-time]' ? currentView.buttons : []; }
    },
    loadFirstLessonDirectory(region) {
      return new Promise((resolve, reject) => requests.push({ region, resolve, reject }));
    }
  });
  vm.runInContext(policySource, context, { timeout: 1000 });
  vm.runInContext([
    initialization, scheduleFunctions, validation, availabilityContext,
    'function bindScheduleForTest() { const step = activeSteps[current];', scheduleEvents, '}'
  ].join('\n'), context, { timeout: 1000 });
  const run = code => vm.runInContext(code, context, { timeout: 1000 });
  run("current = activeSteps.findIndex(step => step.key === 'schedule');");
  if (!direct) run("answers.tier = '스탠다드'; answers.placeType = '송도 원하는 장소';");

  function mount(nextDate = date) {
    elements.clear();
    const view = {};
    for (const id of ['firstLessonDate', 'firstLessonCalendar', 'firstLessonError']) {
      view[id] = element(id);
      elements.set(id, view[id]);
    }
    if (!direct) {
      for (const id of ['lessonAvailabilityLegend', 'lessonAvailabilityHelp', 'lessonAvailabilityStatus']) {
        view[id] = element(id);
        view[id].hidden = id !== 'lessonAvailabilityStatus';
        elements.set(id, view[id]);
      }
    }
    view.buttons = ['09:00', '09:30', '18:00', '18:30'].map(time => {
      const button = element(time);
      button.dataset.firstTime = time;
      return button;
    });
    currentView = view;
    run('firstLessonCalendarDate = ' + JSON.stringify(nextDate));
    run('bindScheduleForTest();');
    return view;
  }

  mount();
  return {
    requests, counted, nextBtn, run, mount,
    get view() { return currentView; },
    answers() { return JSON.parse(run('JSON.stringify(answers)')); },
    button(time) { return currentView.buttons.find(button => button.dataset.firstTime === time); },
    clickTime(time) { this.button(time).emit('click'); },
    clickDate(value) {
      currentView.firstLessonCalendar.emit('click', {
        target: {
          closest(selector) {
            return selector === '[data-calendar-date]'
              ? { disabled: false, dataset: { calendarDate: value } }
              : null;
          }
        }
      });
    },
    refresh() { run('refreshFirstLessonCalendar();'); }
  };
}

const settle = () => new Promise(resolve => setImmediate(resolve));

test('late success or failure from an earlier date cannot replace the current date hints', async () => {
  for (const outcome of ['success', 'failure']) {
    const app = createApplication();
    app.clickDate('2026-10-31');
    assert.equal(app.requests.length, 2);
    app.requests[1].resolve({ count: 8 });
    await settle();
    assert.equal(app.view.firstLessonDate.value, '2026-10-31');
    assert.ok(app.view.buttons.every(button => button.dataset.availability === 'high'));
    const countCalls = app.counted.length;

    if (outcome === 'success') app.requests[0].resolve({ count: 0 });
    else app.requests[0].reject(new Error('Old request failed'));
    await settle();
    assert.ok(app.view.buttons.every(button => button.dataset.availability === 'high'));
    assert.equal(app.counted.length, countCalls);
    assert.equal(app.view.lessonAvailabilityLegend.hidden, false);
    assert.equal(app.view.lessonAvailabilityStatus.textContent, '');
  }
});

test('a response for a previous schedule render cannot affect a newly mounted schedule with the same date', async () => {
  for (const outcome of ['success', 'failure']) {
    const app = createApplication();
    const previous = app.view;
    const previousStatus = previous.lessonAvailabilityStatus.textContent;
    app.mount();
    app.requests[1].resolve({ count: 8 });
    await settle();
    if (outcome === 'success') app.requests[0].resolve({ count: 0 });
    else app.requests[0].reject(new Error('Detached view request failed'));
    await settle();

    assert.ok(app.view.buttons.every(button => button.dataset.availability === 'high'));
    assert.equal(app.view.lessonAvailabilityStatus.textContent, '');
    assert.equal(previous.lessonAvailabilityLegend.hidden, true);
    assert.equal(previous.lessonAvailabilityStatus.textContent, previousStatus);
    assert.ok(previous.buttons.every(button => button.dataset.availability === undefined));
  }
});

test('a pending result is discarded if lesson duration changes before it resolves', async () => {
  const app = createApplication();
  app.run('answers.duration.index = 1;');
  app.requests[0].resolve({ count: 8 });
  await settle();
  assert.equal(app.counted.length, 0);
  assert.ok(app.view.buttons.every(button => button.dataset.availability === undefined));

  app.refresh();
  app.requests[1].resolve({ count: 0 });
  await settle();
  assert.ok(app.view.buttons.every(button => button.dataset.availability === 'low'));
  assert.ok(app.counted.every(call => call.filters.duration === 120));
});

test('directory errors preserve valid selections and never enable times rejected by the 24-hour policy', async () => {
  const app = createApplication({ now: '2026-10-29T10:15:00+09:00' });
  assert.equal(app.button('09:00').disabled, true);
  assert.equal(app.button('18:00').disabled, false);
  app.clickTime('18:00');
  assert.equal(app.nextBtn.disabled, false);
  app.requests[0].reject(new Error('Network unavailable'));
  await settle();

  assert.equal(app.button('09:00').disabled, true);
  assert.equal(app.button('18:00').disabled, false);
  assert.equal(app.button('18:00').getAttribute('aria-pressed'), 'true');
  assert.equal(app.nextBtn.disabled, false);
  assert.equal(app.view.lessonAvailabilityLegend.hidden, true);
  assert.equal(app.view.lessonAvailabilityHelp.hidden, true);
  assert.match(app.view.lessonAvailabilityStatus.textContent, /시간 선택은 가능/);
  app.clickTime('18:30');
  assert.deepEqual(app.answers().firstLessonOptions, [{ date: '2026-10-30', time: '18:30' }]);
  assert.equal(app.nextBtn.disabled, false);
});

test('zero teacher supply remains selectable and supplies an accessible low-density hint', async () => {
  const app = createApplication();
  app.requests[0].resolve({ count: 0 });
  await settle();
  assert.ok(app.view.buttons.every(button => !button.disabled && button.dataset.availability === 'low'));
  assert.match(app.button('09:00').getAttribute('aria-label'), /09:00.*적음.*신청 가능/);
  assert.equal(app.view.lessonAvailabilityHelp.hidden, false);
  assert.equal(app.nextBtn.disabled, true);

  app.clickTime('09:00');
  assert.deepEqual(app.answers().firstLessonOptions, [{ date: '2026-10-30', time: '09:00' }]);
  assert.equal(app.button('09:00').getAttribute('aria-pressed'), 'true');
  assert.equal(app.nextBtn.disabled, false);
});

test('a directly selected teacher never triggers a broad directory request or receives supply hints', async () => {
  const app = createApplication({ direct: true, date: '2026-10-31' });
  assert.equal(app.run('Boolean(DIRECTORY_SELECTION)'), true);
  assert.equal(app.requests.length, 0);
  app.clickTime('09:00');
  assert.equal(app.nextBtn.disabled, false);
  app.clickDate('2026-11-07');
  app.refresh();
  await settle();

  assert.equal(app.requests.length, 0);
  assert.equal(app.counted.length, 0);
  assert.ok(app.view.buttons.every(button => button.dataset.availability === undefined));
  app.clickTime('18:00');
  assert.deepEqual(app.answers().firstLessonOptions, [{ date: '2026-11-07', time: '18:00' }]);
  assert.equal(app.nextBtn.disabled, false);
});

test('selected time and Next remain enabled through loading, high, low, and unavailable hints', async () => {
  const app = createApplication();
  app.clickTime('18:00');
  const assertSelection = () => {
    assert.deepEqual(app.answers().firstLessonOptions, [{ date: '2026-10-30', time: '18:00' }]);
    assert.equal(app.button('18:00').getAttribute('aria-pressed'), 'true');
    assert.equal(app.button('18:00').disabled, false);
    assert.equal(app.nextBtn.disabled, false);
    assert.equal(app.nextBtn.classList.contains('active'), true);
  };
  assertSelection();
  app.requests[0].resolve({ count: 8 });
  await settle();
  assert.equal(app.button('18:00').dataset.availability, 'high');
  assertSelection();

  app.refresh();
  assertSelection();
  app.requests[1].resolve({ count: 0 });
  await settle();
  assert.equal(app.button('18:00').dataset.availability, 'low');
  assertSelection();

  app.refresh();
  app.requests[2].reject(new Error('Refresh failed'));
  await settle();
  assert.equal(app.button('18:00').dataset.availability, undefined);
  assert.equal(app.button('18:00').getAttribute('aria-label'), null);
  assertSelection();
});
