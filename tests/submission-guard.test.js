const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const guardSource = fs.readFileSync(path.join(__dirname, '..', 'js', 'submission-guard.js'), 'utf8');
const cleanupSource = fs.readFileSync(path.join(__dirname, '..', 'jotform-cleanup.js'), 'utf8');

function createHarness(mode = 'regular', options = {}) {
  const storage = new Map();
  let requestCount = 0;
  let lastRequest = null;
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
    fetch: async (input, init) => {
      requestCount += 1;
      lastRequest = { input, init };
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    },
    addEventListener() {},
    location: { reload() {}, search: options.search || '' }
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
  if (options.loadCleanup) vm.runInContext(cleanupSource, context);
  return { window, storage, requestCount: () => requestCount, lastRequest: () => lastRequest };
}

function applicationBody(name = '홍길동', teacherId = '', ageGroup = '20대') {
  const params = new URLSearchParams();
  params.append('submission[3]', name);
  params.append('submission[4][full]', '010-1234-5678');
  params.append('submission[5]', ageGroup);
  params.append('submission[30]', '스탠다드');
  params.append('submission[32]', '일 11:00, 화 11:00');
  params.append('submission[33]', '서울 희망 장소 · 용산');
  params.append('submission[34]', '2026-09-20');
  params.append('submission[40]', '주 1회');
  params.append('submission[41]', '1시간');
  params.append('submission[43]', '정규 신청');
  params.append('submission[64]', teacherId);
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

test('an application with a changed age group is not treated as a duplicate', async () => {
  const harness = createHarness();
  const input = 'https://nado-intro-web.vercel.app/api/submit';
  await harness.window.fetch(input, { method: 'POST', body: applicationBody('홍길동', '', '20대') });
  await harness.window.fetch(input, { method: 'POST', body: applicationBody('홍길동', '', '초등학생 이하') });
  assert.equal(harness.requestCount(), 2);
});

test('the same lesson choice for a different selected teacher is allowed through', async () => {
  const harness = createHarness();
  const input = 'https://nado-intro-web.vercel.app/api/submit';
  await harness.window.fetch(input, { method: 'POST', body: applicationBody('홍길동', 'teacher-a') });
  await harness.window.fetch(input, { method: 'POST', body: applicationBody('홍길동', 'teacher-b') });
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

test('a directory navigation does not restore an older same-mode receipt', () => {
  const harness = createHarness('regular', { search: '?source=teacher-directory&teacher_id=another-teacher' });
  harness.storage.set('nado:successful-application:v3:regular', JSON.stringify({
    version: 3,
    mode: 'regular',
    fingerprint: 'old-selection',
    submittedAt: Date.now(),
    rows: [{ label: '선택 선생님', value: '기존 선생님' }]
  }));

  assert.equal(harness.window.NADO_SUBMISSION_GUARD.restoreRecentReceipt(), false);
});

test('browser wrapper chain preserves directory metadata until server validation', async () => {
  const harness = createHarness('regular', { loadCleanup: true });
  const body = applicationBody('신청자', '123e4567-e89b-42d3-a456-426614174000');
  const notes = [
    '학생 메모',
    '',
    '[매칭 정보]',
    'matching_type=directory_selected',
    'teacher_id=123e4567-e89b-42d3-a456-426614174000',
    'teacher_name=Amy',
    'selection_source=teacher-directory',
    'selection_source_kind=live',
    'selected_region=Songdo',
    'selected_area=IGC 인천글로벌캠퍼스'
  ].join('\n');
  body.set('submission[28]', notes);
  body.set('submission[62]', 'directory_selected');
  await harness.window.fetch('https://nado-intro-web.vercel.app/api/submit', { method: 'POST', body });
  assert.equal(harness.requestCount(), 1);
  assert.equal(harness.lastRequest().init.body.get('submission[28]'), notes);
  const applyHtml = fs.readFileSync(path.join(__dirname, '..', 'apply.html'), 'utf8');
  const trialHtml = fs.readFileSync(path.join(__dirname, '..', 'trial.html'), 'utf8');
  assert.match(applyHtml, /jotform-cleanup\.js\?v=2/);
  assert.match(trialHtml, /jotform-cleanup\.js\?v=2/);
});

test('Premium inquiries are stored and presented as consultation receipts', async () => {
  const harness = createHarness('regular');
  const body = applicationBody('프리미엄 신청자', 'teacher-oscar');
  body.set('submission[30]', '프리미엄');
  body.set('submission[43]', 'Premium 상담 요청');
  body.set('submission[62]', 'premium_inquiry');
  body.set('submission[63]', 'Oscar');

  await harness.window.fetch('https://nado-intro-web.vercel.app/api/submit', { method: 'POST', body });
  const record = JSON.parse(harness.storage.get('nado:successful-application:v3:regular'));
  assert.equal(record.kind, 'premium-inquiry');
  assert.deepEqual(
    record.rows.find(row => row.label === '상담 희망 선생님'),
    { label: '상담 희망 선생님', value: 'Oscar' }
  );
  assert.equal(record.rows.some(row => row.label === '선택 선생님'), false);
});

test('Premium receipt clearly stays unconfirmed and shows four stages', () => {
  const start = guardSource.indexOf("if (record.kind === 'premium-inquiry')");
  const end = guardSource.indexOf('if (statusPill)', start);
  const block = guardSource.slice(start, end);
  assert.ok(start >= 0 && end > start);
  assert.match(block, /아직 수업이나 결제가 확정된 상태는 아닙니다/);
  assert.match(block, /process\.classList\.add\('is-premium'\)/);
  assert.equal((block.match(/class="next-process-step/g) || []).length, 4);
  ['상담 요청 접수', '목표·일정', '선생님 의사', '수업안·결제'].forEach(label => assert.ok(block.includes(label)));
});

test('manual Premium inquiries show NADO review instead of automatic matching', () => {
  const harness = createHarness('regular');
  const record = harness.window.NADO_SUBMISSION_GUARD.recordAndRender({
    mode: 'regular',
    answers: {
      tier: '프리미엄',
      matching_type: 'premium_inquiry',
      contact: { name: '상담 신청자', phone: '010-1234-5678' }
    },
    details: { teacherPreference: '나도 추천 매칭' }
  });
  const teacherRow = record.rows.find(row => row.label === '담당 선생님');
  assert.equal(teacherRow?.label, '담당 선생님');
  assert.equal(teacherRow?.value, 'NADO 확인 예정');
  assert.equal(JSON.stringify(record.rows).includes('나도 추천 매칭'), false);
});
