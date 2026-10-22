const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const policy = require('../lesson-time-policy.js');
const source = fs.readFileSync(path.join(__dirname, '../teacher-directory.js'), 'utf8');
const bindSource = source.slice(source.indexOf('  function bindTimetable('), source.indexOf('  function bindProfileRegions('));

function setup({ now = '2026-10-15T15:30:00+09:00', entries } = {}) {
  let currentTime = Date.parse(now);
  class ClockDate extends Date {
    constructor(...args) { super(...(args.length ? args : [currentTime])); }
    static now() { return currentTime; }
  }
  const element = () => ({
    markup: '', markupWrites: 0, textContent: '', disabled: true, isConnected: true, listeners: {},
    get innerHTML() { return this.markup; },
    set innerHTML(value) { this.markup = value; this.markupWrites += 1; },
    addEventListener(name, listener) { this.listeners[name] = listener; },
    querySelector() { return { focus() {} }; }
  });
  const calendar = element();
  const times = element();
  const summary = element();
  const apply = element();
  const elements = {
    '[data-timetable-calendar]': calendar,
    '[data-timetable-times]': times,
    '.timetable-selection': summary,
    '.timetable-apply': apply
  };
  const scheduled = entries || ['15:00', '15:30', '16:00'].map(time => ({
    dayOfWeek: 5, time, url: '?teacher_id=sample&preferred_time=' + time
  }));
  const events = {};
  const documentEvents = {};
  const intervals = new Map();
  let timerId = 0;
  const destinations = [];
  const context = {
    Date: ClockDate,
    URL,
    state: { sourceKind: 'live' },
    timetableEntries: () => scheduled,
    timetableCleanup: null,
    dialogContent: { querySelector: selector => elements[selector] },
    escapeHtml: value => value,
    applicationPage: () => 'apply.html',
    location: { href: 'https://hellonado.com/teachers.html', assign: url => destinations.push(url) },
    global: {
      NADO_LESSON_TIME_POLICY: policy,
      setInterval(callback) { intervals.set(++timerId, callback); return timerId; },
      clearInterval(id) { intervals.delete(id); },
      addEventListener(name, callback) { events[name] = callback; },
      removeEventListener(name, callback) { if (events[name] === callback) delete events[name]; }
    },
    document: {
      addEventListener(name, callback) { documentEvents[name] = callback; },
      removeEventListener(name, callback) { if (documentEvents[name] === callback) delete documentEvents[name]; }
    }
  };
  vm.runInNewContext(bindSource, context);
  context.bindTimetable({});
  const clickTime = index => times.listeners.click({
    target: { closest: () => ({ dataset: { timetableEntry: String(index) }, disabled: false }) }
  });
  const clickDate = date => calendar.listeners.click({
    target: { closest: selector => selector === '[data-timetable-date]'
      ? { dataset: { timetableDate: date }, disabled: false } : null }
  });
  return {
    calendar, times, summary, apply, clickTime, clickDate, destinations, events,
    documentEvents, intervals,
    setTime(value) { currentTime = Date.parse(value); },
    tick() { [...intervals.values()].forEach(callback => callback()); },
    cleanup() { context.timetableCleanup(); }
  };
}

test('directory disables starts below 24 hours and accepts the exact 24-hour boundary', () => {
  const ui = setup();
  assert.match(ui.times.innerHTML, /data-timetable-entry="0"[^>]*disabled>15:00/);
  assert.match(ui.times.innerHTML, /data-timetable-entry="1"[^>]*aria-pressed="false" >15:30/);
  ui.clickTime(0);
  assert.equal(ui.apply.disabled, true);
  ui.clickTime(1);
  assert.equal(ui.summary.textContent, '2026-10-16 · 15:30');
  assert.equal(ui.apply.disabled, false);
  ui.apply.listeners.click();
  const destination = new URL(ui.destinations[0]);
  assert.equal(destination.searchParams.get('preferred_date'), '2026-10-16');
  assert.equal(destination.searchParams.get('preferred_time'), '15:30');
});

test('directory date and cutoff are based on KST across the year boundary', () => {
  const ui = setup({
    now: '2026-12-31T20:00:00+09:00',
    entries: [
      { dayOfWeek: 4, time: '23:00', url: '?teacher_id=sample' },
      { dayOfWeek: 5, time: '19:30', url: '?teacher_id=sample' },
      { dayOfWeek: 5, time: '20:00', url: '?teacher_id=sample' }
    ]
  });
  assert.match(ui.calendar.innerHTML, /2027년 1월/);
  assert.match(ui.times.innerHTML, /data-timetable-entry="1"[^>]*disabled>19:30/);
  ui.clickTime(2);
  assert.equal(ui.summary.textContent, '2027-01-01 · 20:00');
  const midnight = setup({ now: '2026-10-16T00:05:00+09:00' });
  assert.match(midnight.calendar.innerHTML, /data-timetable-date="2026-10-16"[^>]*aria-current="date"/);
  assert.match(midnight.calendar.innerHTML, /data-timetable-date="2026-10-16"[^>]*disabled/);
  assert.match(midnight.calendar.innerHTML, /data-timetable-date="2026-10-15"[^>]*disabled/);
});

test('dates with no eligible teacher times are disabled and cannot be selected after waiting', () => {
  const ui = setup();
  ui.setTime('2026-10-15T16:00:00.001+09:00');
  ui.clickDate('2026-10-16');
  assert.match(ui.calendar.innerHTML, /data-timetable-date="2026-10-16"[^>]*disabled/);
  assert.equal(ui.apply.disabled, true);
  assert.equal(ui.summary.textContent, policy.message);
  ui.clickDate('2026-10-23');
  ui.clickTime(2);
  assert.equal(ui.summary.textContent, '2026-10-23 · 16:00');
});

test('a stale time click never silently selects a different time when eligible slots shrink', () => {
  const ui = setup();
  ui.setTime('2026-10-15T15:31:00+09:00');
  ui.clickTime(1);
  assert.equal(ui.apply.disabled, true);
  assert.equal(ui.summary.textContent, policy.message);
  ui.clickTime(2);
  assert.equal(ui.summary.textContent, '2026-10-16 · 16:00');
});

test('application navigation rechecks a previously selected time against the current cutoff', () => {
  const ui = setup();
  ui.clickTime(1);
  ui.setTime('2026-10-15T15:30:00.001+09:00');
  ui.apply.listeners.click();
  assert.equal(ui.destinations.length, 0);
  assert.equal(ui.apply.disabled, true);
  assert.equal(ui.summary.textContent, policy.message);
});

test('periodic and focus refresh remove stale selections and clean up detached timetables', () => {
  const ui = setup();
  ui.clickTime(1);
  ui.setTime('2026-10-15T15:30:00.001+09:00');
  ui.tick();
  assert.equal(ui.apply.disabled, true);
  assert.equal(ui.summary.textContent, policy.message);
  ui.clickTime(2);
  ui.setTime('2026-10-15T16:00:00.001+09:00');
  ui.events.focus();
  assert.equal(ui.apply.disabled, true);
  ui.calendar.isConnected = false;
  ui.tick();
  assert.equal(ui.intervals.size, 0);
  assert.deepEqual(Object.keys(ui.events), []);
  assert.deepEqual(Object.keys(ui.documentEvents), []);
});

test('refresh leaves unchanged buttons intact and explicit cleanup removes refresh listeners', () => {
  const ui = setup();
  const calendarWrites = ui.calendar.markupWrites;
  const timeWrites = ui.times.markupWrites;
  ui.tick();
  ui.events.focus();
  assert.equal(ui.calendar.markupWrites, calendarWrites);
  assert.equal(ui.times.markupWrites, timeWrites);
  ui.cleanup();
  assert.equal(ui.intervals.size, 0);
  assert.deepEqual(Object.keys(ui.events), []);
  assert.deepEqual(Object.keys(ui.documentEvents), []);
});
