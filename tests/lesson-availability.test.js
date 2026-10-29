const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const { countTeachersAt, density, createDirectoryLoader } = require('../lesson-availability.js');

const context = {
  date: '2026-11-02', duration: 60, plan: 'economy', region: 'Seoul',
  areaCode: 'Gangnam', areaLabel: '강남', songdoPlace: null, businessOnly: false
};

function slot(overrides = {}) {
  return { day_of_week: 1, start_time: '18:00', end_time: '21:00', area_code: 'Gangnam', area_label: '강남', ...overrides };
}

function teacher(id, availability = [slot()], overrides = {}) {
  return { teacher_id: id, plan_groups: ['economy', 'standard'], business_english: false, availability, ...overrides };
}

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

test('counts distinct teachers with the correct plan and weekday, without mutating rows', () => {
  const rows = [
    teacher('one', [slot(), slot()]), teacher('one'), teacher('two'),
    teacher('wrong-day', [slot({ day_of_week: 2 })]),
    teacher('wrong-plan', [slot()], { plan_groups: ['premium'] }),
    teacher('', [slot()]), null
  ];
  const before = JSON.stringify(rows);
  assert.equal(countTeachersAt(rows, context, '18:30'), 2);
  assert.equal(JSON.stringify(rows), before);
  assert.equal(countTeachersAt(rows, { ...context, teacherId: 'two' }, '18:30'), 1);
  assert.equal(countTeachersAt(rows, { ...context, teacherId: 'missing' }, '18:30'), 0);
});

test('Seoul availability must match the individual slot, not a teacher-wide service area', () => {
  const rows = [
    teacher('elsewhere', [slot({ area_code: 'Hongdae', area_label: '홍대' })], { service_areas: ['강남', '홍대'] }),
    teacher('correct'),
    teacher('contradictory-label', [slot({ area_code: 'Hongdae', area_label: '강남' })]),
    teacher('legacy-label', [slot({ area_code: null })])
  ];
  assert.equal(countTeachersAt(rows, context, '18:30'), 2);
  assert.equal(countTeachersAt(rows, { ...context, areaCode: null, areaLabel: null }, '18:30'), null);
});

test('Songdo designated places remain separate and duplicate places count only one teacher', () => {
  const songdo = { ...context, region: 'Songdo', areaCode: null, areaLabel: null };
  const rows = [
    teacher('igc', [slot({ area_code: 'IGC' })]),
    teacher('triple', [slot({ area_code: 'Triple Street' })]),
    teacher('both', [slot({ area_code: 'IGC' }), slot({ area_code: 'Triple Street' })]),
    teacher('general', [slot({ area_code: 'Songdo' })]),
    teacher('outside', [slot({ area_code: 'Incheon' })])
  ];
  assert.equal(countTeachersAt(rows, songdo, '18:30'), 4);
  assert.equal(countTeachersAt(rows, { ...songdo, songdoPlace: 'IGC' }, '18:30'), 2);
  assert.equal(countTeachersAt(rows, { ...songdo, songdoPlace: 'Triple Street' }, '18:30'), 2);
});

test('a single interval must cover the whole 60 or 120 minute lesson', () => {
  const rows = [
    teacher('long', [slot({ end_time: '20:00' })]),
    teacher('short', [slot({ end_time: '19:00' })]),
    teacher('adjacent', [slot({ end_time: '19:00' }), slot({ start_time: '19:00', end_time: '20:00' })]),
    teacher('later', [slot({ start_time: '18:30', end_time: '20:30' })])
  ];
  assert.equal(countTeachersAt(rows, context, '18:00'), 3);
  assert.equal(countTeachersAt(rows, { ...context, duration: 120 }, '18:00'), 1);
  assert.equal(countTeachersAt(rows, { ...context, duration: 120 }, '18:30'), 1);
  assert.equal(countTeachersAt(rows, { ...context, duration: 120 }, '19:00'), 0);
});

test('midnight endpoints normalize without admitting lessons after midnight', () => {
  const rows = [
    teacher('zero', [slot({ start_time: '22:00:00', end_time: '00:00:00' })]),
    teacher('twenty-four', [slot({ start_time: '22:00', end_time: '24:00' })]),
    teacher('invalid', [slot({ start_time: '22:00', end_time: '24:30' })])
  ];
  assert.equal(countTeachersAt(rows, { ...context, duration: 120 }, '22:00'), 2);
  assert.equal(countTeachersAt(rows, context, '23:00'), 2);
  assert.equal(countTeachersAt(rows, context, '23:30'), null);
  assert.equal(countTeachersAt(rows, context, '24:00'), null);
});

test('business goals and an already selected teacher constrain the same candidates', () => {
  const rows = [teacher('plain'), teacher('business', [slot()], { business_english: true }),
    teacher('string-true', [slot()], { business_english: 'true' }),
    teacher('string-false', [slot()], { business_english: 'false' })];
  assert.equal(countTeachersAt(rows, { ...context, businessOnly: true }, '18:00'), 2);
  assert.equal(countTeachersAt(rows, { ...context, businessOnly: true, teacherId: 'plain' }, '18:00'), 0);
});

test('unknown data and invalid context are distinct from a verified empty result', () => {
  assert.equal(countTeachersAt(null, context, '18:00'), null);
  assert.equal(countTeachersAt(undefined, context, '18:00'), null);
  assert.equal(countTeachersAt([], context, '18:00'), 0);
  for (const date of ['2026-02-30', '2026-13-01', '2026-2-02', '']) {
    assert.equal(countTeachersAt([], { ...context, date }, '18:00'), null);
  }
  assert.equal(countTeachersAt([], { ...context, duration: 90 }, '18:00'), null);
  assert.equal(countTeachersAt([], { ...context, region: 'Incheon' }, '18:00'), null);
  assert.equal(countTeachersAt([], context, '18:60'), null);
  assert.equal(countTeachersAt([teacher('one')], { ...context, date: '2026-11-03' }, '18:00'), 0);
});

test('density exposes only the specified qualitative levels', () => {
  for (const count of [null, undefined, -1, NaN, 1.5, '4']) assert.equal(density(count), 'unknown');
  for (const count of [0, 1]) assert.equal(density(count), 'low');
  for (const count of [2, 3]) assert.equal(density(count), 'medium');
  for (const count of [4, 5, 100]) assert.equal(density(count), 'high');
});

test('the browser build exports the module without requiring a document or CommonJS', () => {
  const sandbox = { window: {}, setTimeout, clearTimeout };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'lesson-availability.js'), 'utf8'), sandbox);
  assert.equal(sandbox.window.NADO_LESSON_AVAILABILITY.density(4), 'high');
  assert.equal(typeof sandbox.window.NADO_LESSON_AVAILABILITY.createDirectoryLoader, 'function');
});

test('loader deduplicates in-flight requests and caches successes separately by region', async () => {
  const pending = deferred();
  const calls = [];
  const loader = createDirectoryLoader((name, args) => {
    calls.push([name, args]);
    return args.p_region === 'Seoul' ? pending.promise : Promise.resolve({ data: [], error: null });
  });
  const first = loader.load('Seoul');
  const same = loader.load('Seoul');
  assert.strictEqual(first, same);
  const rows = [teacher('one')];
  pending.resolve({ data: rows, error: null });
  assert.strictEqual(await first, rows);
  assert.strictEqual(await loader.load('Seoul'), rows);
  assert.deepEqual(await loader.load('Songdo'), []);
  assert.deepEqual(calls, [
    ['get_public_teacher_directory_v3', { p_region: 'Seoul' }],
    ['get_public_teacher_directory_v3', { p_region: 'Songdo' }]
  ]);
});

test('loader cache expires at the configured TTL and a successful empty list is cacheable', async () => {
  let now = 1000;
  let calls = 0;
  const loader = createDirectoryLoader(async () => { calls++; return { data: [], error: null }; },
    { ttlMs: 60, now: () => now });
  await loader.load('Seoul');
  now = 1059;
  await loader.load('Seoul');
  assert.equal(calls, 1);
  now = 1060;
  await loader.load('Seoul');
  assert.equal(calls, 2);
});

test('loader falls back only for the existing missing-v3 function errors', async () => {
  for (const error of [
    { code: 'PGRST202' }, { code: '42883' },
    { message: 'Could not find the function get_public_teacher_directory_v3 in the schema cache' }
  ]) {
    const calls = [];
    const loader = createDirectoryLoader(async name => {
      calls.push(name);
      return name.endsWith('_v3') ? { data: null, error } : { data: [], error: null };
    });
    assert.deepEqual(await loader.load('Songdo'), []);
    assert.deepEqual(calls, ['get_public_teacher_directory_v3', 'get_public_teacher_directory_v2']);
  }
});

test('network, permission and malformed responses are not hidden by fallbacks or cached', async () => {
  for (const failure of [
    { data: null, error: { code: '42501', message: 'permission denied' } },
    { data: null, error: { message: 'network unavailable' } },
    { data: { teachers: [] }, error: null },
    null
  ]) {
    const calls = [];
    const loader = createDirectoryLoader(async name => { calls.push(name); return calls.length === 1 ? failure : { data: [], error: null }; });
    await assert.rejects(loader.load('Seoul'));
    assert.deepEqual(await loader.load('Seoul'), []);
    assert.deepEqual(calls, ['get_public_teacher_directory_v3', 'get_public_teacher_directory_v3']);
  }
});

test('synchronous RPC failures release the in-flight entry for a retry', async () => {
  let calls = 0;
  const loader = createDirectoryLoader(() => {
    if (++calls === 1) throw new Error('connection unavailable');
    return { data: [], error: null };
  });
  await assert.rejects(loader.load('Seoul'), /connection unavailable/);
  assert.deepEqual(await loader.load('Seoul'), []);
  assert.equal(calls, 2);
});

test('timeouts allow retry and a late response cannot replace newer cached data', async () => {
  const pending = deferred();
  const oldRows = [teacher('old')];
  const newRows = [teacher('new')];
  let calls = 0;
  const loader = createDirectoryLoader(() => ++calls === 1 ? pending.promise : { data: newRows, error: null }, { timeoutMs: 10 });
  await assert.rejects(loader.load('Seoul'), error => error.code === 'DIRECTORY_TIMEOUT');
  assert.strictEqual(await loader.load('Seoul'), newRows);
  pending.resolve({ data: oldRows, error: null });
  await Promise.resolve();
  await Promise.resolve();
  assert.strictEqual(await loader.load('Seoul'), newRows);
  assert.equal(calls, 2);
});

test('a failing v2 fallback is rejected and invalid regions never reach the RPC', async () => {
  let calls = 0;
  const loader = createDirectoryLoader(async name => {
    calls++;
    return { data: null, error: { code: name.endsWith('_v3') ? 'PGRST202' : '42501' } };
  });
  await assert.rejects(loader.load('Seoul'), error => error.code === '42501');
  assert.equal(calls, 2);
  await assert.rejects(loader.load('Incheon'), error => error.code === 'INVALID_DIRECTORY_REGION');
  assert.equal(calls, 2);
});
