const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const apiSource = fs.readFileSync(path.join(root, 'api', 'submit.js'), 'utf8');
const apiModulePromise = import('data:text/javascript;base64,' + Buffer.from(apiSource).toString('base64'));
const TEACHER_ID = '123e4567-e89b-42d3-a456-426614174000';

function metadata(overrides = {}) {
  const values = {
    matching_type: 'directory_selected',
    teacher_id: TEACHER_ID,
    teacher_name: 'Amy',
    selection_source: 'teacher-directory',
    selection_source_kind: 'live',
    selected_region: 'Songdo',
    selected_area: 'IGC 인천글로벌캠퍼스',
    ...overrides
  };
  return [
    '학생 전달사항',
    '',
    '[매칭 정보]',
    ...Object.entries(values).map(([key, value]) => key + '=' + value)
  ].join('\n');
}

function directParams(overrides = {}) {
  const values = {
    'submission[5]': '20대',
    'submission[28]': metadata(),
    'submission[29][]': '송도 할인 장소',
    'submission[30]': '이코노미',
    'submission[32]': '월요일 13:00–15:00',
    'submission[33]': '송도 지정 장소 · IGC 인천글로벌캠퍼스',
    'submission[34]': '2099-01-05',
    'submission[41]': '1시간',
    'submission[43]': '정규 신청',
    'submission[44]': 'IGC 인천글로벌캠퍼스',
    'submission[62]': 'directory_selected',
    'submission[63]': 'Amy',
    'submission[64]': TEACHER_ID,
    ...overrides
  };
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    (Array.isArray(value) ? value : [value]).forEach(item => params.append(key, item));
  });
  return params;
}

function directoryRows(overrides = {}) {
  return [{
    teacher_id: TEACHER_ID,
    display_name: 'Amy',
    plan_groups: ['economy', 'standard'],
    availability: [
      { day_of_week: 1, start_time: '13:00', end_time: '15:00', area_label: 'IGC 인천글로벌캠퍼스' },
      { day_of_week: 1, start_time: '13:00', end_time: '15:00', area_label: '트리플스트리트' }
    ],
    ...overrides
  }];
}

function responseRecorder() {
  return {
    statusCode: 200,
    headers: {},
    payload: undefined,
    setHeader(key, value) { this.headers[key] = value; },
    status(value) { this.statusCode = value; return this; },
    json(value) { this.payload = value; return this; },
    end() { return this; }
  };
}

function restoreEnvironment(saved) {
  for (const [key, value] of Object.entries(saved)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

test('metadata parser accepts only one complete bounded internal block', async () => {
  const api = await apiModulePromise;
  const parsed = api.parseMatchingMetadata(metadata());
  assert.equal(parsed.teacher_id, TEACHER_ID);
  assert.equal(parsed.selection_source_kind, 'live');
  assert.equal(api.parseMatchingMetadata(metadata() + '\n[매칭 정보]'), null);
  assert.equal(api.parseMatchingMetadata(metadata({ selection_source_kind: 'snapshot' })).selection_source_kind, 'snapshot');
  assert.equal(api.parseMatchingMetadata(metadata() + '\nunknown_key=value'), null);
  assert.equal(api.parseMatchingMetadata('x'.repeat(8001)), null);
});

test('direct selection parser cross-checks live source, identity, place, mode, and duration', async () => {
  const api = await apiModulePromise;
  const valid = api.parseDirectSelection(directParams());
  assert.equal(valid.ok, true);
  assert.equal(valid.direct, true);
  assert.equal(valid.selection.schedule.availableMinutes, 120);
  assert.equal(valid.selection.preferredDate, '2099-01-05');
  assert.equal(valid.selection.selectedAreas[0].canonical, 'igc');

  assert.equal(api.parseDirectSelection(directParams({
    'submission[28]': metadata({ selection_source_kind: 'snapshot' })
  })).ok, false);
  assert.equal(api.parseDirectSelection(directParams({ 'submission[63]': 'Another teacher' })).ok, false);
  assert.equal(api.parseDirectSelection(directParams({ 'submission[44]': '트리플스트리트' })).ok, false);
  assert.equal(api.parseDirectSelection(directParams({
    'submission[32]': '월요일 13:00–14:00',
    'submission[41]': '2시간'
  })).ok, false);
  assert.equal(api.parseDirectSelection(directParams({ 'submission[34]': '2099-01-06' })).ok, false);
  assert.equal(api.parseDirectSelection(directParams({ 'submission[34]': '2020-01-06' })).ok, false);
  assert.equal(api.parseDirectSelection(directParams({ 'submission[34]': '2099-02-30' })).ok, false);

  const seoulMultiArea = directParams({
    'submission[28]': metadata({
      selected_region: 'Seoul',
      selected_area: '강남 또는 홍대 (신청 후 한 곳 확정)'
    }),
    'submission[29][]': '서울 원하는 장소',
    'submission[33]': '서울 희망 장소 · 강남 · 홍대 (최종 장소 추후 조율)',
    'submission[44]': '강남 · 홍대'
  });
  assert.equal(api.parseDirectSelection(seoulMultiArea).ok, true);

  const ambiguousType = directParams();
  ambiguousType.append('submission[62]', 'student_selected');
  assert.equal(api.parseDirectSelection(ambiguousType).ok, false);

  const genericSongdo = directParams({
    'submission[28]': metadata({ selected_area: '송도 내 협의 (최종 장소 조율)' }),
    'submission[29][]': '송도',
    'submission[33]': '송도 · 송도 내 협의 (최종 장소 조율) · 세부 장소는 추후 조율',
    'submission[44]': '송도 내 협의 (최종 장소 조율)'
  });
  assert.equal(api.parseDirectSelection(genericSongdo).ok, true);
  assert.deepEqual(api.parseDirectSelection(new URLSearchParams('submission%5B62%5D=manual')), {
    ok: true,
    direct: false
  });
  assert.deepEqual(api.parseDirectSelection(new URLSearchParams('submission%5B62%5D=student_selected')), {
    ok: true,
    direct: false
  });
});

test('trial selections are restricted to live Songdo Economy slots at IGC or Triple Street', async () => {
  const api = await apiModulePromise;
  const trial = directParams({
    'submission[28]': metadata({ selected_area: 'IGC 인천글로벌캠퍼스 또는 트리플스트리트 (신청 후 한 곳 확정)' }),
    'submission[29][]': 'IGC 인천글로벌캠퍼스 또는 트리플스트리트 (신청 후 한 곳 확정)',
    'submission[30]': '이코노미(무료 체험)',
    'submission[33]': 'IGC 인천글로벌캠퍼스 또는 트리플스트리트 (신청 후 한 곳 확정)',
    'submission[43]': '무료 체험 신청',
    'submission[44]': 'IGC 인천글로벌캠퍼스 또는 트리플스트리트 (신청 후 한 곳 확정)'
  });
  const parsed = api.parseDirectSelection(trial);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.selection.mode, 'trial');
  assert.equal(api.validateSelectionAgainstDirectory(parsed.selection, directoryRows()).ok, true);

  const seoul = new URLSearchParams(trial);
  seoul.set('submission[28]', metadata({
    selected_region: 'Seoul',
    selected_area: '강남'
  }));
  seoul.set('submission[29][]', '강남');
  seoul.set('submission[33]', '강남');
  seoul.set('submission[44]', '강남');
  assert.equal(api.parseDirectSelection(seoul).ok, false);
});

test('paid trial accepts the selected plan in Seoul while free-trial restrictions stay separate', async () => {
  const api = await apiModulePromise;
  const paid = directParams({
    'submission[28]': metadata({ selected_region: 'Seoul', selected_area: '강남' }),
    'submission[29][]': '서울 원하는 장소',
    'submission[30]': '스탠다드(플랜 선택 체험)',
    'submission[33]': '서울 희망 장소 · 강남 (최종 장소 추후 조율)',
    'submission[43]': '플랜 선택 체험 신청',
    'submission[44]': '강남'
  });
  const parsed = api.parseDirectSelection(paid);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.selection.mode, 'trial');
  assert.equal(parsed.selection.trialType, 'paid');
  assert.equal(parsed.selection.plan, 'standard');
  assert.equal(api.validateSelectionAgainstDirectory(parsed.selection, directoryRows({
    plan_groups: ['economy', 'standard'],
    availability: [{ day_of_week: 1, start_time: '13:00', end_time: '15:00', area_label: '강남' }]
  })).ok, true);
});

test('elementary students can use only Standard regular or paid-trial lessons', async () => {
  const api = await apiModulePromise;
  const regularStandard = directParams({
    'submission[5]': '초등학생 이하',
    'submission[30]': '스탠다드',
    'submission[43]': '정규 신청'
  });
  const paidStandard = directParams({
    'submission[5]': '초등학생',
    'submission[30]': '스탠다드(플랜 선택 체험)',
    'submission[43]': '플랜 선택 체험 신청'
  });
  assert.deepEqual(api.validateStudentPolicy(regularStandard), { ok: true });
  assert.deepEqual(api.validateStudentPolicy(paidStandard), { ok: true });
  assert.equal(
    api.canonicalizeSubmission(regularStandard, { kind: 'manual' }).get('submission[5]'),
    '초등학생',
    'the existing Jotform age option remains compatible'
  );

  for (const invalid of [
    directParams({ 'submission[5]': '초등학생 이하', 'submission[30]': '이코노미' }),
    directParams({ 'submission[5]': '초등학생 이하', 'submission[30]': '프리미엄', 'submission[43]': 'Premium 상담 요청' }),
    directParams({
      'submission[5]': '초등학생 이하',
      'submission[30]': '이코노미(무료 체험)',
      'submission[43]': '무료 체험 신청'
    }),
    directParams({ 'submission[5]': '초등학생 이하', 'submission[30]': '스탠다드', 'submission[43]': 'Premium 상담 요청' })
  ]) {
    assert.equal(api.validateStudentPolicy(invalid).ok, false);
  }

  const missingAge = directParams();
  missingAge.delete('submission[5]');
  assert.equal(api.validateStudentPolicy(missingAge).ok, false);
  const duplicateAge = directParams({ 'submission[5]': ['초등학생 이하', '20대'] });
  assert.equal(api.validateStudentPolicy(duplicateAge).ok, false);
  assert.equal(api.validateStudentPolicy(directParams({ 'submission[5]': '알 수 없음' })).ok, false);
});

test('forged elementary free-trial requests are rejected before any upstream call', async () => {
  const api = await apiModulePromise;
  const originalFetch = global.fetch;
  let calls = 0;
  global.fetch = async () => { calls += 1; throw new Error('must not fetch'); };
  try {
    const params = directParams({
      'submission[5]': '초등학생 이하',
      'submission[28]': metadata({ selected_area: 'IGC 인천글로벌캠퍼스' }),
      'submission[29][]': 'IGC 인천글로벌캠퍼스',
      'submission[30]': '이코노미(무료 체험)',
      'submission[33]': 'IGC 인천글로벌캠퍼스',
      'submission[43]': '무료 체험 신청',
      'submission[44]': 'IGC 인천글로벌캠퍼스'
    });
    const res = responseRecorder();
    await api.default({
      method: 'POST',
      headers: { origin: 'https://hellonado.com' },
      body: params.toString()
    }, res);
    assert.equal(res.statusCode, 422);
    assert.match(res.payload.error, /무료 체험/);
    assert.equal(calls, 0);

    const manualChildEconomy = new URLSearchParams({
      'submission[5]': '초등학생 이하',
      'submission[30]': '이코노미',
      'submission[43]': '정규 신청',
      'submission[62]': 'manual'
    });
    const manualRes = responseRecorder();
    await api.default({ method: 'POST', headers: {}, body: manualChildEconomy.toString() }, manualRes);
    assert.equal(manualRes.statusCode, 422);
    assert.match(manualRes.payload.error, /Standard/);
    assert.equal(calls, 0, 'an invalid manual application must not reach Jotform');
  } finally {
    global.fetch = originalFetch;
  }
});

test('an elementary Standard paid trial is validated and forwarded with the compatible age value', async () => {
  const api = await apiModulePromise;
  const originalFetch = global.fetch;
  const saved = {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_PUBLISHABLE_KEY,
    JOTFORM_API_KEY: process.env.JOTFORM_API_KEY
  };
  process.env.SUPABASE_URL = 'https://project.supabase.co';
  process.env.SUPABASE_ANON_KEY = 'anon-test';
  delete process.env.SUPABASE_PUBLISHABLE_KEY;
  process.env.JOTFORM_API_KEY = 'jotform-test';
  const calls = [];
  global.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    if (String(url).includes('supabase.co')) {
      return {
        ok: true,
        json: async () => directoryRows({
          availability: [{ day_of_week: 1, start_time: '13:00', end_time: '15:00', area_label: '강남' }]
        })
      };
    }
    return { ok: true, json: async () => ({ responseCode: 200 }) };
  };
  try {
    const params = directParams({
      'submission[5]': '초등학생 이하',
      'submission[28]': metadata({ selected_region: 'Seoul', selected_area: '강남' }),
      'submission[29][]': '서울 원하는 장소',
      'submission[30]': '스탠다드(플랜 선택 체험)',
      'submission[33]': '서울 희망 장소 · 강남 (최종 장소 추후 조율)',
      'submission[43]': '플랜 선택 체험 신청',
      'submission[44]': '강남'
    });
    const res = responseRecorder();
    await api.default({
      method: 'POST',
      headers: { origin: 'https://hellonado.com' },
      body: params.toString()
    }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(calls.length, 2);
    assert.equal(calls[1].init.body.get('submission[5]'), '초등학생');
    assert.equal(calls[1].init.body.get('submission[30]'), '스탠다드(플랜 선택 체험)');
  } finally {
    global.fetch = originalFetch;
    restoreEnvironment(saved);
  }
});

test('Premium directory choices are consultation requests, not direct bookings', async () => {
  const api = await apiModulePromise;
  const premium = directParams({
    'submission[28]': metadata({ matching_type: 'premium_inquiry' }),
    'submission[30]': '프리미엄',
    'submission[43]': 'Premium 상담 요청',
    'submission[62]': 'premium_inquiry'
  });
  const parsed = api.parseDirectSelection(premium);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.selection.plan, 'premium');
  assert.equal(parsed.selection.consultation, true);
  assert.equal(api.validateSelectionAgainstDirectory(parsed.selection, directoryRows({
    plan_groups: ['standard', 'premium']
  })).ok, true);

  const staleApproval = api.validateSelectionAgainstDirectory(parsed.selection, directoryRows({
    plan_groups: ['economy', 'standard']
  }));
  assert.equal(staleApproval.ok, false);
});

test('manual Premium consultation preserves its distinct submission type', async () => {
  const api = await apiModulePromise;
  const premium = new URLSearchParams();
  premium.set('submission[28]', [
    '상담 메모',
    '',
    '[매칭 정보]',
    'matching_type=premium_inquiry',
    'teacher_id=',
    'teacher_name=',
    'selection_source=',
    'selection_source_kind=',
    'selected_region=',
    'selected_area='
  ].join('\n'));
  premium.set('submission[30]', '프리미엄');
  premium.set('submission[43]', 'Premium 상담 요청');
  premium.set('submission[62]', 'premium_inquiry');
  premium.set('submission[63]', '');
  premium.set('submission[64]', '');

  const classification = api.classifyMatchingSubmission(premium);
  assert.equal(classification.ok, true);
  assert.equal(classification.kind, 'premium-inquiry');
  assert.equal(classification.direct, false);
  const canonical = api.canonicalizeSubmission(premium, classification);
  assert.equal(canonical.get('submission[62]'), 'premium_inquiry');
  assert.equal(canonical.get('submission[28]'), '상담 메모');
});

test('submission classifier separates directory, cached selected-teacher, and manual payloads', async () => {
  const api = await apiModulePromise;
  const direct = api.classifyMatchingSubmission(directParams());
  assert.equal(direct.ok, true);
  assert.equal(direct.kind, 'directory-selected');
  assert.equal(direct.selected, true);

  const cachedNotes = [
    '기존 신청 메모',
    '',
    '[매칭 정보]',
    'matching_type=student_selected',
    'teacher_id=' + TEACHER_ID,
    'teacher_name=Amy'
  ].join('\n');
  const cached = new URLSearchParams();
  cached.set('submission[28]', cachedNotes);
  cached.set('submission[62]', 'student_selected');
  cached.set('submission[63]', 'Amy');
  cached.set('submission[64]', TEACHER_ID);
  assert.deepEqual(api.classifyMatchingSubmission(cached, { allowLegacySelectedPayloads: true }), {
    ok: true,
    direct: false,
    selected: true,
    kind: 'legacy-selected'
  });

  const currentLegacy = new URLSearchParams(cached);
  currentLegacy.set('submission[28]', [
    '[매칭 정보]',
    'matching_type=student_selected',
    'teacher_id=' + TEACHER_ID,
    'teacher_name=Amy',
    'selection_source=',
    'selection_source_kind=',
    'selected_region=',
    'selected_area='
  ].join('\n'));
  assert.equal(api.classifyMatchingSubmission(currentLegacy).ok, true);

  const retainedDirectorySource = new URLSearchParams(currentLegacy);
  retainedDirectorySource.set('submission[28]', retainedDirectorySource.get('submission[28]').replace(
    'selection_source=',
    'selection_source=teacher-directory'
  ));
  assert.equal(api.classifyMatchingSubmission(retainedDirectorySource).ok, false);

  const markerMissing = new URLSearchParams(cached);
  markerMissing.set('submission[28]', '학생 메모만 있음');
  assert.equal(api.classifyMatchingSubmission(markerMissing).ok, false);
  assert.equal(api.classifyMatchingSubmission(markerMissing, { allowLegacySelectedPayloads: true }).ok, true);

  const duplicate = new URLSearchParams(cached);
  duplicate.append('submission[62]', 'manual');
  assert.equal(api.classifyMatchingSubmission(duplicate).ok, false);

  const unknown = new URLSearchParams(cached);
  unknown.set('submission[62]', 'unknown');
  assert.equal(api.classifyMatchingSubmission(unknown).ok, false);
});

test('manual canonicalization removes selected-teacher downgrade data', async () => {
  const api = await apiModulePromise;
  const downgraded = directParams({ 'submission[62]': 'manual' });
  const classification = api.classifyMatchingSubmission(downgraded);
  assert.equal(classification.kind, 'manual');
  const canonical = api.canonicalizeSubmission(downgraded, classification);
  assert.equal(canonical.get('submission[62]'), 'manual');
  assert.equal(canonical.get('submission[63]'), '');
  assert.equal(canonical.get('submission[64]'), '');
  assert.equal(canonical.get('submission[28]'), '학생 전달사항');
  assert.doesNotMatch(canonical.get('submission[28]'), /\[매칭 정보\]/);
  assert.doesNotMatch(canonical.get('submission[28]'), /selection_source=teacher-directory/);
});

test('directory comparison rejects stale teacher, plan, time, and area data', async () => {
  const api = await apiModulePromise;
  const selection = api.parseDirectSelection(directParams()).selection;
  const standardSelection = api.parseDirectSelection(directParams({ 'submission[30]': '스탠다드' })).selection;
  assert.equal(api.validateSelectionAgainstDirectory(selection, directoryRows()).ok, true);
  assert.equal(api.validateSelectionAgainstDirectory(standardSelection, directoryRows()).ok, true);
  assert.equal(api.validateSelectionAgainstDirectory(standardSelection, directoryRows({ plan_groups: ['economy'] })).ok, false);
  assert.equal(api.validateSelectionAgainstDirectory(selection, directoryRows({ display_name: 'Amy Updated' })).ok, false);
  assert.equal(api.validateSelectionAgainstDirectory(selection, directoryRows({ plan_groups: ['standard'] })).ok, false);
  assert.equal(api.validateSelectionAgainstDirectory(selection, directoryRows({ plan_groups: ['economy', 'premium'] })).ok, true);
  assert.equal(api.validateSelectionAgainstDirectory(selection, directoryRows({ plan_groups: ['standard', 'premium'] })).ok, false);
  assert.equal(api.validateSelectionAgainstDirectory(selection, directoryRows({
    availability: [{ day_of_week: 2, start_time: '13:00', end_time: '15:00', area_label: 'IGC 인천글로벌캠퍼스' }]
  })).ok, false);
  assert.equal(api.validateSelectionAgainstDirectory(selection, directoryRows({
    availability: [{ day_of_week: 1, start_time: '13:00', end_time: '15:00', area_label: '트리플스트리트' }]
  })).ok, false);
  assert.equal(api.validateSelectionAgainstDirectory(selection, directoryRows({ availability: 'not-json' })).status, 503);
  assert.equal(api.validateSelectionAgainstDirectory(selection, [{ unexpected: true }]).status, 503);
});

test('direct POST without Origin is rejected before either upstream is contacted', async () => {
  const api = await apiModulePromise;
  const originalFetch = global.fetch;
  let calls = 0;
  global.fetch = async () => { calls += 1; throw new Error('must not fetch'); };
  try {
    const res = responseRecorder();
    await api.default({ method: 'POST', headers: {}, body: directParams().toString() }, res);
    assert.equal(res.statusCode, 403);
    assert.equal(calls, 0);
  } finally {
    global.fetch = originalFetch;
  }
});

test('direct POST fails closed on missing Supabase config and stale slots', async () => {
  const api = await apiModulePromise;
  const originalFetch = global.fetch;
  const saved = {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_PUBLISHABLE_KEY,
    JOTFORM_API_KEY: process.env.JOTFORM_API_KEY
  };
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_ANON_KEY;
  delete process.env.SUPABASE_PUBLISHABLE_KEY;
  process.env.JOTFORM_API_KEY = 'jotform-test';
  let calls = 0;
  global.fetch = async () => { calls += 1; throw new Error('must not fetch'); };
  try {
    let res = responseRecorder();
    await api.default({
      method: 'POST',
      headers: { origin: 'https://hellonado.com' },
      body: directParams().toString()
    }, res);
    assert.equal(res.statusCode, 503);
    assert.equal(calls, 0);

    process.env.SUPABASE_URL = 'https://project.supabase.co';
    process.env.SUPABASE_ANON_KEY = 'anon-test';
    global.fetch = async url => {
      calls += 1;
      assert.match(String(url), /get_public_teacher_directory_v2$/);
      return { ok: true, json: async () => [] };
    };
    calls = 0;
    res = responseRecorder();
    await api.default({
      method: 'POST',
      headers: { origin: 'https://hellonado.com' },
      body: directParams().toString()
    }, res);
    assert.equal(res.statusCode, 409);
    assert.equal(calls, 1, 'a stale selection must not be forwarded to Jotform');
  } finally {
    global.fetch = originalFetch;
    restoreEnvironment(saved);
  }
});

test('validated direct POST checks Supabase first and forwards only allowlisted Jotform fields', async () => {
  const api = await apiModulePromise;
  const originalFetch = global.fetch;
  const saved = {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_PUBLISHABLE_KEY,
    JOTFORM_API_KEY: process.env.JOTFORM_API_KEY
  };
  process.env.SUPABASE_URL = 'https://project.supabase.co';
  process.env.SUPABASE_ANON_KEY = 'anon-test';
  delete process.env.SUPABASE_PUBLISHABLE_KEY;
  process.env.JOTFORM_API_KEY = 'jotform-test';
  const params = directParams({ 'submission[3]': '신청자', injected: 'do-not-forward' });
  const calls = [];
  global.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    if (String(url).includes('supabase.co')) return { ok: true, json: async () => directoryRows() };
    return { ok: true, json: async () => ({ responseCode: 200 }) };
  };
  try {
    const res = responseRecorder();
    await api.default({
      method: 'POST',
      headers: { origin: 'https://hellonado.com' },
      body: params.toString()
    }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(calls.length, 2);
    assert.deepEqual(JSON.parse(calls[0].init.body), { p_region: 'Songdo' });
    assert.equal(calls[1].init.body.get('submission[3]'), '신청자');
    assert.equal(calls[1].init.body.has('injected'), false);
    assert.equal(calls[1].init.body.get('submission[28]'), '학생 전달사항');
    assert.doesNotMatch(calls[1].init.body.get('submission[28]'), /\[매칭 정보\]/);
  } finally {
    global.fetch = originalFetch;
    restoreEnvironment(saved);
  }
});

test('legacy manual POST remains server-to-server compatible and skips Supabase', async () => {
  const api = await apiModulePromise;
  const originalFetch = global.fetch;
  const saved = {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_PUBLISHABLE_KEY,
    JOTFORM_API_KEY: process.env.JOTFORM_API_KEY
  };
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_ANON_KEY;
  delete process.env.SUPABASE_PUBLISHABLE_KEY;
  process.env.JOTFORM_API_KEY = 'jotform-test';
  const calls = [];
  global.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return { ok: true, json: async () => ({ responseCode: 200 }) };
  };
  try {
    const res = responseRecorder();
    await api.default({
      method: 'POST',
      headers: {},
      body: 'submission%5B3%5D=Legacy&submission%5B5%5D=20%EB%8C%80&submission%5B62%5D=manual&submission%5B63%5D=Forged&submission%5B64%5D=' + TEACHER_ID + '&not_submission=blocked'
    }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(calls.length, 1);
    assert.match(calls[0].url, /api\.jotform\.com/);
    assert.equal(calls[0].init.body.get('submission[3]'), 'Legacy');
    assert.equal(calls[0].init.body.get('submission[62]'), 'manual');
    assert.equal(calls[0].init.body.get('submission[63]'), '');
    assert.equal(calls[0].init.body.get('submission[64]'), '');
    assert.equal(calls[0].init.body.get('submission[28]'), '');
    assert.equal(calls[0].init.body.has('not_submission'), false);
  } finally {
    global.fetch = originalFetch;
    restoreEnvironment(saved);
  }
});

test('legacy matched-teacher POST remains compatible and skips directory validation', async () => {
  const api = await apiModulePromise;
  const originalFetch = global.fetch;
  const saved = {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_PUBLISHABLE_KEY,
    JOTFORM_API_KEY: process.env.JOTFORM_API_KEY
  };
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_ANON_KEY;
  delete process.env.SUPABASE_PUBLISHABLE_KEY;
  process.env.JOTFORM_API_KEY = 'jotform-test';
  const calls = [];
  global.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return { ok: true, json: async () => ({ responseCode: 200 }) };
  };
  try {
    const params = new URLSearchParams();
    params.set('submission[3]', '기존 맞춤 신청자');
    params.set('submission[5]', '20대');
    params.set('submission[28]', [
      '[매칭 정보]',
      'matching_type=student_selected',
      'teacher_id=' + TEACHER_ID,
      'teacher_name=Amy',
      'selection_source=',
      'selection_source_kind=',
      'selected_region=',
      'selected_area='
    ].join('\n'));
    params.set('submission[62]', 'student_selected');
    params.set('submission[63]', 'Amy');
    params.set('submission[64]', TEACHER_ID);
    const res = responseRecorder();
    await api.default({
      method: 'POST',
      headers: { origin: 'https://hellonado.com' },
      body: params.toString()
    }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(calls.length, 1);
    assert.match(calls[0].url, /api\.jotform\.com/);
    assert.equal(calls[0].init.body.get('submission[62]'), 'student_selected');
  } finally {
    global.fetch = originalFetch;
    restoreEnvironment(saved);
  }
});

test('legacy matched-teacher POST without Origin is rejected', async () => {
  const api = await apiModulePromise;
  const originalFetch = global.fetch;
  let calls = 0;
  global.fetch = async () => { calls += 1; throw new Error('must not fetch'); };
  try {
    const params = new URLSearchParams();
    params.set('submission[28]', [
      '[매칭 정보]',
      'matching_type=student_selected',
      'teacher_id=' + TEACHER_ID,
      'teacher_name=Amy'
    ].join('\n'));
    params.set('submission[62]', 'student_selected');
    params.set('submission[63]', 'Amy');
    params.set('submission[64]', TEACHER_ID);
    const res = responseRecorder();
    await api.default({ method: 'POST', headers: {}, body: params.toString() }, res);
    assert.equal(res.statusCode, 403);
    assert.equal(calls, 0);
  } finally {
    global.fetch = originalFetch;
  }
});

test('cached metadata-stripped selected payload is allowed only during the rollout window', async () => {
  const api = await apiModulePromise;
  const originalFetch = global.fetch;
  const saved = {
    JOTFORM_API_KEY: process.env.JOTFORM_API_KEY,
    ALLOW_LEGACY_SELECTED_PAYLOADS: process.env.ALLOW_LEGACY_SELECTED_PAYLOADS
  };
  process.env.JOTFORM_API_KEY = 'jotform-test';
  const params = new URLSearchParams();
  params.set('submission[5]', '20대');
  params.set('submission[28]', '캐시된 구버전 사용자 메모');
  params.set('submission[62]', 'student_selected');
  params.set('submission[63]', 'Amy');
  params.set('submission[64]', TEACHER_ID);
  let calls = 0;
  global.fetch = async () => {
    calls += 1;
    return { ok: true, json: async () => ({ responseCode: 200 }) };
  };
  try {
    process.env.ALLOW_LEGACY_SELECTED_PAYLOADS = 'true';
    let res = responseRecorder();
    await api.default({
      method: 'POST',
      headers: { origin: 'https://hellonado.com' },
      body: params.toString()
    }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(calls, 1);

    process.env.ALLOW_LEGACY_SELECTED_PAYLOADS = 'false';
    calls = 0;
    res = responseRecorder();
    await api.default({
      method: 'POST',
      headers: { origin: 'https://hellonado.com' },
      body: params.toString()
    }, res);
    assert.equal(res.statusCode, 409);
    assert.equal(calls, 0);
  } finally {
    global.fetch = originalFetch;
    restoreEnvironment(saved);
  }
});
