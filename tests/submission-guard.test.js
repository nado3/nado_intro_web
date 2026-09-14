const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const guardSource = fs.readFileSync(path.join(__dirname, '..', 'js', 'submission-guard.js'), 'utf8');

function createHarness(mode = 'regular') {
  const storage = new Map();
  let requestCount = 0;
  const localStorage = {
    getItem: key => storage.has(key) ? storage.get(key) : null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: key => storage.delete(key)
  };
  const document = {
    body: { dataset: mode === 'trial' ? { mode: 'trial' } : {}, classList: { add() {} } },
    getElementById() { return null; },
    querySelector() { return null; }
  };
  const window = {
    localStorage,
    fetch: async () => {
      requestCount += 1;
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    },
    addEventListener() {},
    location: { reload() {} }
  };
  const context = vm.createContext({
    window,
    document,
    URLSearchParams,
    Response,
    Intl,
    Date,
    Number,
    String,
    Math,
    JSON,
    Boolean,
    console,
    requestAnimationFrame: callback => callback()
  });
  vm.runInContext(guardSource, context);
  return { window, storage, requestCount: () => requestCount };
}

function applicationBody(name = '홍길동') {
  const params = new URLSearchParams();
  params.append('submission[3]', name);
  params.append('submission[4][full]', '010-1234-5678');
  params.append('submission[30]', '스탠다드');
  params.append('submission[32]', '일 11:00, 화 11:00');
  params.append('submission[33]', '서울 희망 장소 · 용산');
  params.append('submission[34]', '2026-09-20');
  params.append('submission[40]', '주 1회');
  params.append('submission[41]', '1시간');
  params.append('submission[43]', '정규 신청');
  return params;
}

test('the same application is sent once within 24 hours', async () => {
  const harness = createHarness();
  const input = 'https://nado-intro-web.vercel.app/api/submit';
  const init = { method: 'POST', body: applicationBody() };

  const first = await harness.window.fetch(input, init);
  assert.equal((await first.json()).success, true);
  assert.equal(harness.requestCount(), 1);

  const second = await harness.window.fetch(input, init);
  const duplicate = await second.json();
  assert.equal(duplicate.success, true);
  assert.equal(duplicate.duplicatePrevented, true);
  assert.equal(harness.requestCount(), 1);
});

test('stored receipts contain masked contact details', async () => {
  const harness = createHarness();
  await harness.window.fetch('https://nado-intro-web.vercel.app/api/submit', {
    method: 'POST',
    body: applicationBody()
  });
  const record = JSON.parse(harness.storage.get('nado:successful-application:v3:regular'));
  assert.match(JSON.stringify(record.rows), /010-••••-5678/);
  assert.doesNotMatch(JSON.stringify(record.rows), /010-1234-5678/);
});

test('a changed application is allowed through', async () => {
  const harness = createHarness();
  const input = 'https://nado-intro-web.vercel.app/api/submit';
  await harness.window.fetch(input, { method: 'POST', body: applicationBody('홍길동') });
  await harness.window.fetch(input, { method: 'POST', body: applicationBody('김나도') });
  assert.equal(harness.requestCount(), 2);
});

test('regular and trial receipts use separate storage keys', async () => {
  const regular = createHarness('regular');
  regular.window.NADO_SUBMISSION_GUARD.recordAndRender({ mode: 'regular', answers: { contact: { name: '정규' } } });
  assert.equal(regular.storage.has('nado:successful-application:v3:regular'), true);
  assert.equal(regular.storage.has('nado:successful-application:v3:trial'), false);

  const trial = createHarness('trial');
  trial.window.NADO_SUBMISSION_GUARD.recordAndRender({ mode: 'trial', answers: { contact: { name: '체험' } } });
  assert.equal(trial.storage.has('nado:successful-application:v3:trial'), true);
  assert.equal(trial.storage.has('nado:successful-application:v3:regular'), false);
});
