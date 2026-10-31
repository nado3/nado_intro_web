const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const addon = fs.readFileSync(path.join(root, 'js/manual-teacher-preference.js'), 'utf8');
const policy = fs.readFileSync(path.join(root, 'lesson-time-policy.js'), 'utf8');

function section(start, end) {
  const from = source.indexOf(start);
  const to = source.indexOf(end, from);
  assert.ok(from >= 0 && to > from, 'Application section exists: ' + start);
  return source.slice(from, to);
}

const initialization = section('const DURATIONS', 'const ANALYTICS_FORM_ID');
const schedule = section('let firstLessonDateWindow', 'function renderHistory');
const matches = section('function teacherSchoolClass', 'async function startTeacherMatching');
const validation = section('function checkValid', 'function setNextState');
const nextHandler = section("nextBtn.addEventListener('click', () => {", "skipBtn.addEventListener('click'");
const backHandler = section("backBtn.addEventListener('click', () => {", 'function createSubmissionError');
const submissionError = section('function showSubmitError(message)', 'function compactFirstLessonSummary');
const submission = section('async function showSuccess(){', '\nrenderStep();');

// Parse only the ordinary HTML elements used by these screens. Click dispatch
// includes document capture so the addon's back interception runs before the app.
function createDocument() {
  const documentListeners = [];
  class Element {
    constructor(tagName) {
      this.tagName = tagName.toLowerCase();
      this.attributes = new Map();
      this.children = [];
      this.parentElement = null;
      this.dataset = {};
      this.style = {};
      this.listeners = [];
      this.disabled = false;
      this.hidden = false;
      this._text = '';
      this._html = '';
      this.classList = {
        contains: name => this.className.split(/\s+/).includes(name),
        add: (...names) => { this.className = [...new Set(this.className.split(/\s+/).filter(Boolean).concat(names))].join(' '); },
        remove: (...names) => { this.className = this.className.split(/\s+/).filter(name => name && !names.includes(name)).join(' '); },
        toggle: (name, force) => {
          const enabled = force === undefined ? !this.classList.contains(name) : Boolean(force);
          enabled ? this.classList.add(name) : this.classList.remove(name);
          return enabled;
        }
      };
    }
    get id() { return this.attributes.get('id') || ''; }
    set id(value) { this.attributes.set('id', String(value)); }
    get className() { return this.attributes.get('class') || ''; }
    set className(value) { this.attributes.set('class', String(value)); }
    get textContent() { return this._text + this.children.map(child => child.textContent).join(''); }
    set textContent(value) { this.children = []; this._text = String(value); }
    get innerHTML() { return this._html; }
    set innerHTML(value) {
      this.children.forEach(child => { child.parentElement = null; });
      this.children = [];
      this._text = '';
      this._html = String(value);
      const stack = [this];
      const tokens = /<\/?([a-z][\w-]*)([^>]*)>|([^<]+)/gi;
      let token;
      while ((token = tokens.exec(this._html))) {
        if (token[3] !== undefined) {
          stack[stack.length - 1]._text += token[3];
          continue;
        }
        if (token[0].startsWith('</')) {
          while (stack.length > 1 && stack[stack.length - 1].tagName !== token[1].toLowerCase()) stack.pop();
          if (stack.length > 1) stack.pop();
          continue;
        }
        const child = new Element(token[1]);
        const attributes = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
        let attribute;
        while ((attribute = attributes.exec(token[2]))) {
          child.setAttribute(attribute[1], attribute[2] ?? attribute[3] ?? attribute[4] ?? '');
        }
        stack[stack.length - 1].appendChild(child);
        if (!['input', 'img', 'br', 'hr', 'meta', 'link'].includes(child.tagName)) stack.push(child);
      }
    }
    setAttribute(name, value) {
      this.attributes.set(name, String(value));
      if (name.startsWith('data-')) {
        this.dataset[name.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] = String(value);
      }
      if (name === 'disabled') this.disabled = true;
      if (name === 'hidden') this.hidden = true;
    }
    getAttribute(name) { return this.attributes.get(name) ?? null; }
    appendChild(child) { child.parentElement = this; this.children.push(child); return child; }
    matches(selector) {
      if (selector.startsWith('#')) return this.id === selector.slice(1);
      if (selector.startsWith('.')) return this.classList.contains(selector.slice(1));
      return this.tagName === selector.toLowerCase();
    }
    querySelectorAll(selector) {
      return this.children.flatMap(child => [
        ...(child.matches(selector) ? [child] : []), ...child.querySelectorAll(selector)
      ]);
    }
    querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
    closest(selector) {
      for (let current = this; current; current = current.parentElement) {
        if (current.matches(selector)) return current;
      }
      return null;
    }
    addEventListener(type, handler) { this.listeners.push({ type, handler }); }
    focus() { document.activeElement = this; }
    scrollIntoView() {}
  }
  const document = {
    body: new Element('body'),
    head: new Element('head'),
    hidden: false,
    activeElement: null,
    createElement: tag => new Element(tag),
    getElementById(id) { return this.querySelector('#' + id); },
    querySelectorAll(selector) { return [...this.head.querySelectorAll(selector), ...this.body.querySelectorAll(selector)]; },
    querySelector(selector) { return this.querySelectorAll(selector)[0] || null; },
    addEventListener(type, handler, options) {
      documentListeners.push({ type, handler, capture: options === true || Boolean(options && options.capture) });
    }
  };
  async function click(target) {
    assert.ok(target, 'The requested control exists');
    const event = {
      target, defaultPrevented: false, propagationStopped: false,
      preventDefault() { this.defaultPrevented = true; },
      stopPropagation() { this.propagationStopped = true; }
    };
    if (target.disabled) return event;
    for (const listener of documentListeners.filter(item => item.type === 'click' && item.capture)) {
      await listener.handler(event);
      if (event.propagationStopped) return event;
    }
    for (let node = target; node && !event.propagationStopped; node = node.parentElement) {
      for (const listener of node.listeners.filter(item => item.type === 'click')) await listener.handler(event);
    }
    for (const listener of documentListeners.filter(item => item.type === 'click' && !item.capture)) {
      if (!event.propagationStopped) await listener.handler(event);
    }
    return event;
  }
  return { document, click };
}

function directTeacherParams() {
  return {
    source: 'teacher-directory', source_kind: 'live',
    teacher_id: '123e4567-e89b-42d3-a456-426614174000', teacher_name: 'Fixture Teacher',
    plan: 'standard', region: 'Seoul', area: '강남',
    day: '월요일', start: '18:00', end: '21:00', available_minutes: '180', mode: 'regular'
  };
}

function createApplication({ direct = false, premium = false, failFirstSubmission = false } = {}) {
  const { document, click } = createDocument();
  document.body.innerHTML = '<div class="topbar"><button id="backBtn">뒤로</button><div id="progressFill"></div></div>'
    + '<main id="formMain"><div id="history"></div><div id="qcardWrap"></div></main>'
    + '<div id="bottombar"><button id="nextBtn">다음</button></div>'
    + '<div id="successWrap"><h2 class="success-title"></h2><p class="success-text"></p><div class="next-process-steps"></div></div>';
  const qcardWrap = document.getElementById('qcardWrap');
  const clock = { now: Date.parse('2026-10-30T18:00:00+09:00') };
  class ClockDate extends Date {
    constructor(...args) { super(...(args.length ? args : [clock.now])); }
    static now() { return clock.now; }
  }
  const location = new URL('https://hellonado.com/apply.html');
  if (direct) location.search = new URLSearchParams(directTeacherParams()).toString();
  const submissions = [];
  const matchingStarts = [];
  const renderedSteps = [];
  const context = vm.createContext({
    URL, URLSearchParams, Date: ClockDate, document, location,
    window: { location },
    console: { log() {}, warn() {}, error() {} },
    fetch() { throw new Error('Network access is forbidden in this test'); },
    qcardWrap,
    historyEl: document.getElementById('history'),
    progressFill: document.getElementById('progressFill'),
    nextBtn: document.getElementById('nextBtn'),
    backBtn: document.getElementById('backBtn'),
    matchingViewActive: false, matchingInProgress: false, matchingRequestId: 0,
    alreadySubmitted: false, submissionInProgress: false, formStartTracked: false,
    teacherPhotoMarkup() { return ''; },
    bindTeacherPhotoFallbacks() {},
    escapeHtml(value) { return String(value || ''); },
    centerCurrentQuestion() {},
    trackFormEvent() {},
    trackGoogleAdsApplication() {},
    submissionErrorAnalyticsParams() { return {}; },
    async startTeacherMatching() { matchingStarts.push(true); },
    renderStep() {
      const key = vm.runInContext('activeSteps[current]?.key', context);
      renderedSteps.push(key);
      qcardWrap.innerHTML = '<div class="qcard" data-step="' + key + '"><div id="firstLessonError"></div></div>';
    },
    async submitToJotform(answers) {
      submissions.push(JSON.parse(JSON.stringify(answers)));
      if (failFirstSubmission && submissions.length === 1) throw new Error('Fixture temporary save failure');
      return { success: true, submission_id: 'fixture-submission' };
    }
  });
  const run = code => vm.runInContext(code, context, { timeout: 1000 });
  run(policy);
  run([initialization, schedule, matches, validation, nextHandler, backHandler, submissionError, submission].join('\n'));
  run('current = activeSteps.length - 1;');
  run('Object.assign(answers, ' + JSON.stringify({
    ageGroup: '30대', tier: premium ? '프리미엄' : '스탠다드',
    duration: { index: 0 }, frequency: '주 1회',
    placeType: '서울 원하는 장소', place: ['서울 원하는 장소'], areaCode: 'Gangnam',
    preferredPlace: 'Fixture cafe', level: '초급 (기초 단어·문장)', goals: ['일상회화'],
    firstLessonOptions: [{ date: '2026-11-02', time: '18:30' }],
    contact: { name: 'Fixture Student', phone: '010-0000-0000', phoneValid: true, consent: true },
    notes: 'Fixture lesson request', payment: true
  }) + ');');
  run(addon);
  renderedSteps.length = 0;
  const teachers = [
    { id: 'fixture-teacher-a', name: 'Alpha', university: '', major: '', tags: [], overlaps: ['월 18:30'] },
    { id: 'fixture-teacher-b', name: 'Beta', university: '', major: '', tags: [], overlaps: ['월 18:30'] }
  ];
  context.fixtureTeachers = teachers;
  return {
    document, run, click, submissions, matchingStarts, renderedSteps, teachers,
    answers() { return JSON.parse(run('JSON.stringify(answers)')); },
    showMatches() { run('renderTeacherMatches(fixtureTeachers);'); },
    recommend() { return qcardWrap.querySelector('.teacher-recommend-btn'); },
    preference(value) { return qcardWrap.querySelectorAll('.teacher-preference-opt').find(option => option.dataset.value === value); },
    finish() { return document.getElementById('teacherPreferenceSubmit'); },
    back() { return click(document.getElementById('backBtn')); },
    cards() { return qcardWrap.querySelectorAll('.teacher-match-card'); },
    expire() { clock.now += 31 * 60 * 1000; },
    conditions() {
      const answers = this.answers();
      return Object.fromEntries(['ageGroup', 'tier', 'duration', 'frequency', 'placeType', 'place', 'areaCode',
        'preferredPlace', 'level', 'goals', 'firstLessonOptions', 'contact', 'notes'].map(key => [key, answers[key]]));
    }
  };
}

test('the recommendation button opens preferences, preserves conditions, and does not submit', async () => {
  const app = createApplication();
  app.showMatches();
  app.run("answers.teacher_id = 'old-choice'; answers.teacher_name = 'Old choice'; nextBtn.dataset.submitted = '1';");
  const before = app.conditions();
  const requestBefore = app.run('matchingRequestId');
  await app.click(app.recommend());

  assert.ok(app.finish());
  assert.equal(app.finish().disabled, true);
  assert.equal(app.answers().teacher_id, null);
  assert.equal(app.answers().teacher_name, '');
  assert.equal(app.answers().matching_type, 'manual');
  assert.equal(app.run('nextBtn.dataset.submitted'), undefined);
  assert.equal(app.run('matchingRequestId'), requestBefore + 1);
  assert.deepEqual(app.conditions(), before);
  assert.equal(app.submissions.length, 0);
  assert.equal(app.renderedSteps.length, 0);
});

test('back restores the same teacher list and re-entry restores preferences without automatic submission', async () => {
  const app = createApplication();
  app.showMatches();
  const originalCards = app.cards().map(card => card.textContent);
  const before = app.conditions();
  await app.click(app.recommend());
  await app.click(app.preference('korean'));
  assert.equal(app.submissions.length, 0);
  const back = await app.back();

  assert.equal(back.defaultPrevented, true);
  assert.equal(back.propagationStopped, true);
  assert.deepEqual(app.cards().map(card => card.textContent), originalCards);
  assert.equal(app.document.activeElement, app.recommend());
  assert.equal(app.renderedSteps.length, 0);
  assert.equal(app.submissions.length, 0);

  await app.click(app.recommend());
  assert.equal(app.preference('korean').classList.contains('selected'), true);
  assert.equal(app.finish().disabled, false);
  assert.deepEqual(app.conditions(), before);
  assert.equal(app.submissions.length, 0);
});

test('only an explicit preference completion click calls the existing submission once', async () => {
  const app = createApplication();
  app.showMatches();
  await app.click(app.recommend());
  await app.click(app.finish());
  assert.equal(app.submissions.length, 0);
  await app.click(app.preference('foreign'));
  assert.equal(app.submissions.length, 0);
  const button = app.finish();
  await app.click(button);

  assert.equal(app.submissions.length, 1);
  assert.equal(app.submissions[0].matching_type, 'manual');
  assert.equal(app.submissions[0].teacher_id, null);
  assert.equal(app.submissions[0].teacher_preference, 'foreign');
  assert.match(app.submissions[0].notes, /teacher_preference=foreign/);
  assert.equal(app.answers().notes, 'Fixture lesson request');
  assert.equal(app.run('alreadySubmitted'), true);
  await app.click(button);
  await app.run('showSuccess();');
  assert.equal(app.submissions.length, 1);
});

test('selecting a teacher after returning to the list clears manual preferences before student-selected submission', async () => {
  const app = createApplication();
  app.showMatches();
  await app.click(app.recommend());
  await app.click(app.preference('korean'));
  await app.back();
  await app.click(app.cards()[0]);
  assert.equal(app.submissions.length, 0);
  await app.click(app.document.querySelector('.teacher-select-btn'));

  assert.equal(app.submissions.length, 1);
  assert.equal(app.submissions[0].matching_type, 'student_selected');
  assert.equal(app.submissions[0].teacher_id, 'fixture-teacher-a');
  assert.equal(app.submissions[0].teacher_name, 'Alpha');
  assert.equal(app.submissions[0].teacher_preference, undefined);
  assert.doesNotMatch(app.submissions[0].notes, /teacher_preference|\[선생님 유형 선호\]/);
  assert.equal(app.answers().teacher_preference, undefined);
});

test('the existing no-match preference route lets Back reach the original final-step handler', async () => {
  const app = createApplication();
  app.run("answers.matching_type = 'manual'; answers.teacher_id = null;");
  const lastStep = app.run('activeSteps[current].key');
  const current = app.run('current');
  await app.run('showSuccess();');
  assert.ok(app.finish());
  assert.equal(app.submissions.length, 0);
  const back = await app.back();

  assert.equal(back.defaultPrevented, false);
  assert.equal(back.propagationStopped, false);
  assert.deepEqual(app.renderedSteps, [lastStep]);
  assert.equal(app.run('current'), current);
  assert.equal(app.run('matchingViewActive'), false);
  assert.equal(app.document.getElementById('bottombar').style.display, 'block');
  assert.equal(app.recommend(), null);
  assert.equal(app.submissions.length, 0);
});

test('already-submitted and in-progress guards block recommendation entry and direct selection', async () => {
  for (const flag of ['alreadySubmitted', 'submissionInProgress']) {
    const app = createApplication();
    app.showMatches();
    app.run("answers.teacher_preference = 'korean';");
    app.run(flag + ' = true;');
    const before = app.answers();
    await app.click(app.recommend());
    assert.equal(app.finish(), null);
    assert.equal(app.submissions.length, 0);
    await app.run('selectTeacher(fixtureTeachers[0]);');
    assert.deepEqual(app.answers(), before);
    assert.equal(app.submissions.length, 0);
  }
});

test('completion still respects submitted and in-progress guards after the preference screen opens', async () => {
  for (const flag of ['alreadySubmitted', 'submissionInProgress']) {
    const app = createApplication();
    app.showMatches();
    await app.click(app.recommend());
    await app.click(app.preference('no_preference'));
    app.run(flag + ' = true;');
    await app.click(app.finish());
    assert.equal(app.submissions.length, 0);
  }
});

test('an expired schedule redirects to schedule selection at entry, completion, and return to the list', async () => {
  for (const action of ['entry', 'completion', 'back']) {
    const app = createApplication();
    app.showMatches();
    if (action !== 'entry') {
      await app.click(app.recommend());
      await app.click(app.preference('korean'));
    }
    app.expire();
    if (action === 'entry') await app.click(app.recommend());
    else if (action === 'completion') await app.click(app.finish());
    else await app.back();

    assert.equal(app.submissions.length, 0, action);
    assert.equal(app.run('activeSteps[current].key'), 'schedule', action);
    assert.deepEqual(app.answers().firstLessonOptions, [], action);
    assert.equal(app.finish(), null, action);
    assert.equal(app.recommend(), null, action);
    assert.match(app.document.getElementById('firstLessonError').textContent, /72시간/, action);
  }
});

test('premium, directory-selected, and empty result lists do not display the recommendation entry', () => {
  for (const options of [{ premium: true }, { direct: true }]) {
    const app = createApplication(options);
    app.showMatches();
    assert.equal(app.cards().length, 2);
    assert.equal(app.recommend(), null);
    assert.equal(app.submissions.length, 0);
  }
  const empty = createApplication();
  empty.run('renderTeacherMatches([]);');
  assert.equal(empty.recommend(), null);
  assert.equal(empty.submissions.length, 0);
});

test('retry after a manual save failure submits the same recommendation without another teacher search', async () => {
  const app = createApplication({ failFirstSubmission: true });
  app.showMatches();
  await app.click(app.recommend());
  await app.click(app.preference('korean'));
  const before = app.conditions();
  await app.click(app.finish());

  assert.equal(app.submissions.length, 1);
  assert.equal(app.run('alreadySubmitted'), false);
  assert.equal(app.run('submissionInProgress'), false);
  assert.match(app.document.getElementById('submitError').textContent, /Fixture temporary save failure/);
  const retry = app.document.getElementById('nextBtn');
  assert.equal(retry.textContent, '다시 제출하기');
  assert.equal(retry.disabled, false);
  assert.equal(app.submissions[0].matching_type, 'manual');
  assert.equal(app.answers().teacher_preference, 'korean');
  assert.deepEqual(app.conditions(), before);

  await app.click(retry);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(app.matchingStarts.length, 0);
  assert.equal(app.submissions.length, 2);
  assert.deepEqual(app.submissions[1], app.submissions[0]);
  assert.equal(app.run('alreadySubmitted'), true);
  assert.equal(app.answers().notes, 'Fixture lesson request');
});
