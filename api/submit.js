const FORM_ID = '262064236851052';
const DIRECTORY_RPC = 'get_public_teacher_directory_v2';
const DIRECT_MATCHING_TYPE = 'directory_selected';
const PREMIUM_INQUIRY_TYPE = 'premium_inquiry';
const LEGACY_SELECTED_MATCHING_TYPE = 'student_selected';
const MANUAL_MATCHING_TYPE = 'manual';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DAY_INDEX = Object.freeze({ '일': 0, '월': 1, '화': 2, '수': 3, '목': 4, '금': 5, '토': 6 });
const AGE_GROUPS = new Set(['초등학생', '초등학생 이하', '중고등학생', '20대', '30대', '40대', '50대 이상']);
const METADATA_LIMITS = Object.freeze({
  matching_type: 40,
  teacher_id: 80,
  teacher_name: 100,
  selection_source: 60,
  selection_source_kind: 20,
  selected_region: 20,
  selected_area: 500
});
const ALLOWED_JOTFORM_FIELDS = new Set([
  'submission[3]', 'submission[4][full]', 'submission[5]', 'submission[7]',
  'submission[8][]', 'submission[28]', 'submission[29][]', 'submission[30]',
  'submission[31]', 'submission[32]', 'submission[33]', 'submission[34]',
  'submission[35][]', 'submission[36]', 'submission[38]', 'submission[39]',
  'submission[40]', 'submission[41]', 'submission[43]', 'submission[44]',
  'submission[62]', 'submission[63]', 'submission[64]'
]);

function cleanText(value, maxLength) {
  if (typeof value !== 'string') return '';
  const normalized = value.normalize('NFKC').trim();
  if (!normalized || normalized.length > maxLength || /[\u0000-\u001f\u007f]/.test(normalized)) return '';
  return normalized;
}

function cleanOptionalText(value, maxLength) {
  if (typeof value !== 'string') return null;
  const normalized = value.normalize('NFKC').trim();
  if (normalized.length > maxLength || /[\u0000-\u001f\u007f]/.test(normalized)) return null;
  return normalized;
}

function comparableText(value) {
  return String(value || '').normalize('NFKC').trim().replace(/\s+/g, ' ');
}

function singleParam(params, key, maxLength) {
  const values = params.getAll(key);
  if (values.length !== 1) return '';
  return cleanText(values[0], maxLength);
}

function canonicalPlan(value) {
  const normalized = comparableText(value).toLowerCase();
  if (normalized === 'economy' || normalized === '이코노미') return 'economy';
  if (normalized === 'standard' || normalized === '스탠다드') return 'standard';
  if (normalized === 'premium' || normalized === '프리미엄') return 'premium';
  return '';
}

function isElementaryOrYounger(value) {
  const normalized = comparableText(value).replace(/\s+/g, '');
  return normalized === '초등학생' || normalized === '초등학생이하';
}

function studentPolicyError(message) {
  return {
    ok: false,
    status: 422,
    error: message || '나이대와 수업 방식을 다시 확인해주세요.'
  };
}

export function validateStudentPolicy(params) {
  if (!(params instanceof URLSearchParams)) return studentPolicyError();
  const ages = params.getAll('submission[5]');
  if (ages.length !== 1) return studentPolicyError('나이대를 하나만 선택해주세요.');
  const ageGroup = cleanText(ages[0], 40);
  if (!ageGroup || !AGE_GROUPS.has(ageGroup)) return studentPolicyError('나이대를 다시 선택해주세요.');
  if (!isElementaryOrYounger(ageGroup)) return { ok: true };

  const tierValues = params.getAll('submission[30]');
  const modeValues = params.getAll('submission[43]');
  if (tierValues.length !== 1 || modeValues.length !== 1) return studentPolicyError();
  const tierValue = cleanText(tierValues[0], 60);
  const modeValue = cleanText(modeValues[0], 40);
  const plan = canonicalPlan(tierValue.replace(/\([^)]*\)\s*$/, ''));
  if (modeValue === '무료 체험 신청') {
    return studentPolicyError('초등학생 이하는 무료 체험을 이용할 수 없습니다. Standard 1회 유료 체험을 선택해주세요.');
  }
  if (plan !== 'standard' || (modeValue !== '정규 신청' && modeValue !== '플랜 선택 체험 신청')) {
    return studentPolicyError('초등학생 이하는 Standard 수업만 신청할 수 있습니다.');
  }
  return { ok: true };
}

function normalizeTime(value, allowEndOfDay) {
  const match = String(value || '').trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!match) return '';
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (allowEndOfDay && hours === 24 && minutes === 0) return '24:00';
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return '';
  return String(hours).padStart(2, '0') + ':' + String(minutes).padStart(2, '0');
}

function timeMinutes(value, allowEndOfDay) {
  const normalized = normalizeTime(value, allowEndOfDay);
  if (!normalized) return NaN;
  if (normalized === '24:00') return 24 * 60;
  const [hours, minutes] = normalized.split(':').map(Number);
  return hours * 60 + minutes;
}

function canonicalArea(value) {
  const normalized = comparableText(value)
    .replace(/\s*\(신청 후 한 곳 확정\)\s*$/, '')
    .replace(/[\s_-]+/g, '')
    .toLowerCase();
  if (!normalized) return '';
  if (normalized === 'igc' || normalized.includes('인천글로벌캠퍼스')) return 'igc';
  if (normalized.includes('트리플스트리트') || normalized === 'triplestreet') return 'triple-street';
  if (normalized === 'songdo' || normalized === '송도' || normalized.includes('송도내협의')) return 'songdo';
  return normalized;
}

function parseSelectedAreas(value) {
  const text = cleanText(value, METADATA_LIMITS.selected_area);
  if (!text) return [];
  const withoutConfirmation = text.replace(/\s*\(신청 후 한 곳 확정\)\s*$/, '');
  const parts = withoutConfirmation.split(/\s*(?:또는|·|\/|,)\s*/).filter(Boolean);
  if (!parts.length || parts.length > 8) return [];
  const areas = [];
  for (const part of parts) {
    const label = cleanText(part, 100);
    const canonical = canonicalArea(label);
    if (!label || !canonical) return [];
    if (!areas.some(area => area.canonical === canonical)) areas.push({ label, canonical });
  }
  return areas;
}

function sameAreaSet(left, right) {
  if (!left.length || left.length !== right.length) return false;
  const rightValues = new Set(right.map(area => area.canonical));
  return left.every(area => rightValues.has(area.canonical));
}

function parseMetadataBlock(value) {
  if (typeof value !== 'string' || value.length > 8000) return null;
  const lines = value.split(/\r?\n/);
  if (lines.length > 100) return null;
  const markerIndexes = [];
  lines.forEach((line, index) => {
    if (line.trim() === '[매칭 정보]') markerIndexes.push(index);
  });
  if (markerIndexes.length !== 1) return null;

  const metadata = {};
  for (const rawLine of lines.slice(markerIndexes[0] + 1)) {
    const line = rawLine.trim();
    if (!line) continue;
    const match = line.match(/^([a-z_]{1,40})=(.*)$/);
    if (!match || !Object.hasOwn(METADATA_LIMITS, match[1]) || Object.hasOwn(metadata, match[1])) return null;
    const valueText = cleanOptionalText(match[2], METADATA_LIMITS[match[1]]);
    if (valueText === null) return null;
    metadata[match[1]] = valueText;
  }

  return metadata;
}

function hasExactKeys(metadata, keys) {
  if (!metadata || Object.keys(metadata).length !== keys.length) return false;
  return keys.every(key => Object.hasOwn(metadata, key));
}

export function parseMatchingMetadata(value) {
  const metadata = parseMetadataBlock(value);
  const keys = Object.keys(METADATA_LIMITS);
  if (!hasExactKeys(metadata, keys) || keys.some(key => !metadata[key])) return null;
  return metadata;
}

export function parseSchedule(value) {
  const text = cleanText(value, 80);
  const match = text.match(/^(일|월|화|수|목|금|토)요일\s+(\d{1,2}:\d{2})\s*[-–~]\s*(\d{1,2}:\d{2})$/);
  if (!match) return null;
  const start = normalizeTime(match[2], false);
  const end = normalizeTime(match[3], true);
  const startMinutes = timeMinutes(start, false);
  const endMinutes = timeMinutes(end, true);
  if (!start || !end || !Number.isFinite(startMinutes) || !Number.isFinite(endMinutes) || endMinutes <= startMinutes) return null;
  return {
    dayLabel: match[1],
    dayOfWeek: DAY_INDEX[match[1]],
    start,
    end,
    availableMinutes: endMinutes - startMinutes
  };
}

function currentKstDate(now) {
  const timestamp = Number(now === undefined ? Date.now() : now);
  if (!Number.isFinite(timestamp)) return '';
  return new Date(timestamp + (9 * 60 * 60 * 1000)).toISOString().slice(0, 10);
}

export function parsePreferredDate(value, expectedDayOfWeek, now) {
  const text = cleanText(value, 10);
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match || !Number.isInteger(expectedDayOfWeek) || expectedDayOfWeek < 0 || expectedDayOfWeek > 6) return '';
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const timestamp = Date.UTC(year, month - 1, day);
  const date = new Date(timestamp);
  if (
    date.getUTCFullYear() !== year
    || date.getUTCMonth() !== month - 1
    || date.getUTCDate() !== day
    || date.getUTCDay() !== expectedDayOfWeek
    || text < currentKstDate(now)
  ) return '';
  return text;
}

function directError(message) {
  return {
    ok: false,
    direct: true,
    status: 409,
    error: message || '선택한 선생님 또는 시간 정보가 변경되었습니다. 목록에서 다시 선택해주세요.'
  };
}

function directoryError() {
  return {
    ok: false,
    direct: true,
    status: 503,
    error: '현재 선생님 가능 시간을 확인할 수 없습니다. 잠시 후 다시 시도해주세요.'
  };
}

export function parseDirectSelection(params, options = {}) {
  if (!(params instanceof URLSearchParams)) return directError();
  const matchingValues = params.getAll('submission[62]');
  if (!matchingValues.includes(DIRECT_MATCHING_TYPE) && !matchingValues.includes(PREMIUM_INQUIRY_TYPE)) {
    return { ok: true, direct: false };
  }

  const matchingType = singleParam(params, 'submission[62]', 40);
  const teacherName = singleParam(params, 'submission[63]', 100);
  const teacherId = singleParam(params, 'submission[64]', 80);
  const notes = params.getAll('submission[28]');
  const scheduleValue = singleParam(params, 'submission[32]', 80);
  const durationValue = singleParam(params, 'submission[41]', 20);
  const tierValue = singleParam(params, 'submission[30]', 60);
  const modeValue = singleParam(params, 'submission[43]', 40);
  const placeLabel = singleParam(params, 'submission[33]', 700);
  const placeDetail = singleParam(params, 'submission[44]', 600);
  const preferredDateValue = singleParam(params, 'submission[34]', 10);

  if (
    (matchingType !== DIRECT_MATCHING_TYPE && matchingType !== PREMIUM_INQUIRY_TYPE) || notes.length !== 1 || !teacherName
    || !UUID_PATTERN.test(teacherId) || !scheduleValue || !durationValue
    || !tierValue || !modeValue || !placeLabel || !placeDetail || !preferredDateValue
  ) return directError();

  const metadata = parseMatchingMetadata(notes[0]);
  const schedule = parseSchedule(scheduleValue);
  const preferredDate = schedule
    ? parsePreferredDate(preferredDateValue, schedule.dayOfWeek, options.now)
    : '';
  if (!metadata || !schedule || !preferredDate) return directError();
  if (
    metadata.matching_type !== matchingType
    || metadata.selection_source !== 'teacher-directory'
    || metadata.selection_source_kind !== 'live'
    || metadata.teacher_id !== teacherId
    || comparableText(metadata.teacher_name) !== comparableText(teacherName)
  ) return directError();

  const region = metadata.selected_region;
  if (region !== 'Songdo' && region !== 'Seoul') return directError();
  const selectedAreas = parseSelectedAreas(metadata.selected_area);
  const placeDetailAreas = parseSelectedAreas(placeDetail);
  if (!selectedAreas.length || !sameAreaSet(selectedAreas, placeDetailAreas)) return directError();
  if (!selectedAreas.every(area => comparableText(placeLabel).includes(comparableText(area.label)))) return directError();

  const placeOptions = params.getAll('submission[29][]').map(value => cleanText(value, 600));
  if (!placeOptions.length || placeOptions.some(value => !value)) return directError();

  let mode;
  let plan;
  let durationMinutes;
  let trialType = '';
  const cleanTierPlan = canonicalPlan(tierValue.replace(/\([^)]*\)$/, ''));
  if (modeValue === '정규 신청' || modeValue === 'Premium 상담 요청') {
    mode = 'regular';
    plan = cleanTierPlan;
    durationMinutes = durationValue === '1시간' ? 60 : (durationValue === '2시간' ? 120 : 0);
    const songdoDiscountApplies = selectedAreas.every(area => area.canonical === 'igc' || area.canonical === 'triple-street');
    const expectedPlace = region === 'Songdo'
      ? (songdoDiscountApplies ? '송도 할인 장소' : '송도')
      : '서울 원하는 장소';
    if (!plan || !durationMinutes || !placeOptions.includes(expectedPlace)) return directError();
    if ((matchingType === PREMIUM_INQUIRY_TYPE) !== (plan === 'premium' && modeValue === 'Premium 상담 요청')) return directError();
  } else if (modeValue === '무료 체험 신청') {
    mode = 'trial';
    trialType = 'free';
    plan = tierValue === '이코노미(무료 체험)' ? 'economy' : '';
    durationMinutes = durationValue === '1시간' ? 60 : 0;
    if (
      region !== 'Songdo' || plan !== 'economy' || !durationMinutes
      || !placeOptions.includes(metadata.selected_area)
      || selectedAreas.some(area => area.canonical !== 'igc' && area.canonical !== 'triple-street')
    ) return directError();
    if (matchingType !== DIRECT_MATCHING_TYPE) return directError();
  } else if (modeValue === '플랜 선택 체험 신청' || modeValue === 'Premium 체험 상담 요청') {
    mode = 'trial';
    trialType = 'paid';
    plan = cleanTierPlan;
    durationMinutes = durationValue === '1시간' ? 60 : 0;
    const expectedPlace = region === 'Songdo' ? metadata.selected_area : '서울 원하는 장소';
    if (!plan || !durationMinutes || !placeOptions.includes(expectedPlace)) return directError();
    if ((matchingType === PREMIUM_INQUIRY_TYPE) !== (plan === 'premium' && modeValue === 'Premium 체험 상담 요청')) return directError();
  } else {
    return directError();
  }

  if (durationMinutes > schedule.availableMinutes) return directError();
  return {
    ok: true,
    direct: true,
    selection: {
      teacherId,
      teacherName,
      region,
      plan,
      mode,
      trialType,
      consultation: matchingType === PREMIUM_INQUIRY_TYPE,
      schedule,
      preferredDate,
      durationMinutes,
      selectedAreas
    }
  };
}

function selectedSubmissionError(message) {
  return {
    ok: false,
    direct: false,
    selected: true,
    status: 409,
    error: message || '선생님 선택 정보를 확인할 수 없습니다. 신청 화면에서 다시 선택해주세요.'
  };
}

function parseLegacySelectedSubmission(params, options = {}) {
  const matchingType = singleParam(params, 'submission[62]', 40);
  const teacherName = singleParam(params, 'submission[63]', 100);
  const teacherId = singleParam(params, 'submission[64]', 80);
  const notes = params.getAll('submission[28]');
  if (
    matchingType !== LEGACY_SELECTED_MATCHING_TYPE
    || !teacherName
    || !UUID_PATTERN.test(teacherId)
    || notes.length !== 1
  ) return selectedSubmissionError();

  const metadata = parseMetadataBlock(notes[0]);
  const legacyKeys = ['matching_type', 'teacher_id', 'teacher_name'];
  const currentKeys = Object.keys(METADATA_LIMITS);
  if (!metadata) {
    return options.allowLegacySelectedPayloads
      ? { ok: true, direct: false, selected: true, kind: 'legacy-selected' }
      : selectedSubmissionError();
  }
  const oldSchema = options.allowLegacySelectedPayloads && hasExactKeys(metadata, legacyKeys);
  const currentSchema = hasExactKeys(metadata, currentKeys)
    && ['selection_source', 'selection_source_kind', 'selected_region', 'selected_area']
      .every(key => metadata[key] === '');
  if (
    (!oldSchema && !currentSchema)
    || metadata.matching_type !== LEGACY_SELECTED_MATCHING_TYPE
    || metadata.teacher_id !== teacherId
    || comparableText(metadata.teacher_name) !== comparableText(teacherName)
  ) return selectedSubmissionError();

  return { ok: true, direct: false, selected: true, kind: 'legacy-selected' };
}

function parseManualPremiumInquiry(params) {
  const matchingType = singleParam(params, 'submission[62]', 40);
  const teacherName = singleParam(params, 'submission[63]', 100);
  const teacherId = singleParam(params, 'submission[64]', 80);
  const tierValue = singleParam(params, 'submission[30]', 60);
  const modeValue = singleParam(params, 'submission[43]', 40);
  const notes = params.getAll('submission[28]');
  const plan = canonicalPlan(tierValue.replace(/\([^)]*\)$/, ''));
  if (
    matchingType !== PREMIUM_INQUIRY_TYPE
    || teacherName
    || teacherId
    || plan !== 'premium'
    || (modeValue !== 'Premium 상담 요청' && modeValue !== 'Premium 체험 상담 요청')
    || notes.length !== 1
  ) return selectedSubmissionError('Premium 상담 요청 정보를 확인할 수 없습니다. 다시 신청해주세요.');

  const metadata = parseMetadataBlock(notes[0]);
  const keys = Object.keys(METADATA_LIMITS);
  if (
    !hasExactKeys(metadata, keys)
    || metadata.matching_type !== PREMIUM_INQUIRY_TYPE
    || keys.filter(key => key !== 'matching_type').some(key => metadata[key] !== '')
  ) return selectedSubmissionError('Premium 상담 요청 정보를 확인할 수 없습니다. 다시 신청해주세요.');

  return { ok: true, direct: false, selected: false, kind: 'premium-inquiry' };
}

export function classifyMatchingSubmission(params, options = {}) {
  if (!(params instanceof URLSearchParams)) return selectedSubmissionError();
  const values = params.getAll('submission[62]');
  if (values.length > 1) return selectedSubmissionError();
  const matchingType = values.length ? cleanText(values[0], 40) : MANUAL_MATCHING_TYPE;
  if (!matchingType || matchingType === MANUAL_MATCHING_TYPE) {
    return { ok: true, direct: false, selected: false, kind: 'manual' };
  }
  if (matchingType === DIRECT_MATCHING_TYPE) {
    const direct = parseDirectSelection(params);
    return Object.assign({}, direct, { selected: true, kind: 'directory-selected' });
  }
  if (matchingType === PREMIUM_INQUIRY_TYPE) {
    const teacherId = singleParam(params, 'submission[64]', 80);
    if (teacherId) {
      const direct = parseDirectSelection(params);
      return Object.assign({}, direct, { selected: true, kind: 'premium-inquiry' });
    }
    return parseManualPremiumInquiry(params);
  }
  if (matchingType === LEGACY_SELECTED_MATCHING_TYPE) return parseLegacySelectedSubmission(params, options);
  return selectedSubmissionError();
}

function stripMatchingBlock(value) {
  const lines = String(value || '').split(/\r?\n/);
  const marker = lines.findIndex(line => line.trim() === '[매칭 정보]');
  return (marker === -1 ? lines : lines.slice(0, marker)).join('\n').trim();
}

export function canonicalizeSubmission(params, classification) {
  const output = new URLSearchParams(params instanceof URLSearchParams ? params.toString() : '');
  if (output.get('submission[5]') === '초등학생 이하') {
    // Keep the existing Jotform option compatible while the public label is clearer.
    output.set('submission[5]', '초등학생');
  }
  const userNotes = output.getAll('submission[28]')
    .map(stripMatchingBlock)
    .filter(Boolean)
    .join('\n\n')
    .slice(0, 7000);
  if (classification && (classification.kind === 'manual' || (classification.kind === 'premium-inquiry' && !classification.selected))) {
    output.set('submission[62]', classification.kind === 'premium-inquiry' ? PREMIUM_INQUIRY_TYPE : MANUAL_MATCHING_TYPE);
    output.set('submission[63]', '');
    output.set('submission[64]', '');
  }
  output.delete('submission[28]');
  output.set('submission[28]', userNotes);
  return output;
}

function boundedJsonArray(value, maxLength, maxItems) {
  let parsed = value;
  if (typeof parsed === 'string') {
    if (parsed.length > maxLength) return null;
    try {
      parsed = JSON.parse(parsed);
    } catch (error) {
      return null;
    }
  }
  if (!Array.isArray(parsed) || parsed.length > maxItems) return null;
  return parsed;
}

function availabilityValues(row) {
  if (!row || typeof row !== 'object' || Array.isArray(row)) return null;
  const day = Number(row.day_of_week ?? row.dayOfWeek);
  const start = normalizeTime(row.start_time ?? row.startTime, false);
  const end = normalizeTime(row.end_time ?? row.endTime, true);
  const areaLabel = cleanText(String(row.area_label ?? row.areaLabel ?? ''), 100);
  if (!Number.isInteger(day) || day < 0 || day > 6 || !start || !end || !areaLabel) return null;
  return { day, start, end, areaLabel, canonicalArea: canonicalArea(areaLabel) };
}

function directoryPlanGroups(teacher) {
  const plural = teacher && (teacher.plan_groups ?? teacher.planGroups);
  if (plural !== undefined && plural !== null) {
    const values = boundedJsonArray(plural, 2000, 3);
    if (!values || !values.length) return null;
    const plans = Array.from(new Set(values.map(canonicalPlan)));
    if (plans.some(plan => !plan) || plans.length !== values.length) return null;
    return plans;
  }
  const legacyPlan = canonicalPlan(teacher && (teacher.plan_group ?? teacher.planGroup));
  return legacyPlan ? [legacyPlan] : null;
}

export function validateSelectionAgainstDirectory(selection, rows) {
  if (!selection || !Array.isArray(rows) || rows.length > 500) return directoryError();
  if (rows.some(row => (
    !row || typeof row !== 'object' || Array.isArray(row)
    || !cleanText(String(row.teacher_id ?? row.teacherId ?? ''), 80)
  ))) return directoryError();
  const matchingRows = rows.filter(row => row && String(row.teacher_id ?? row.teacherId ?? '') === selection.teacherId);
  if (!matchingRows.length) return directError();
  if (matchingRows.length !== 1) return directoryError();
  const teacher = matchingRows[0];
  const currentName = cleanText(String(teacher.display_name ?? teacher.displayName ?? ''), 100);
  const currentPlans = directoryPlanGroups(teacher);
  if (!currentName || !currentPlans) return directoryError();
  if (comparableText(currentName) !== comparableText(selection.teacherName) || !currentPlans.includes(selection.plan)) return directError();
  if (selection.mode === 'trial' && selection.trialType === 'free' && (selection.region !== 'Songdo' || selection.plan !== 'economy')) return directError();
  if (selection.mode === 'trial' && selection.trialType !== 'free' && selection.trialType !== 'paid') return directError();

  const availability = boundedJsonArray(teacher.availability, 1000000, 1000);
  if (!availability) return directoryError();
  const sameWindowAreas = new Set();
  for (const rawSlot of availability) {
    const slot = availabilityValues(rawSlot);
    if (!slot || !slot.canonicalArea) return directoryError();
    if (
      slot.day === selection.schedule.dayOfWeek
      && slot.start === selection.schedule.start
      && slot.end === selection.schedule.end
    ) sameWindowAreas.add(slot.canonicalArea);
  }
  if (!sameWindowAreas.size) return directError();
  if (!selection.selectedAreas.every(area => sameWindowAreas.has(area.canonical))) return directError();
  if (selection.mode === 'trial' && selection.trialType === 'free' && selection.selectedAreas.some(area => area.canonical !== 'igc' && area.canonical !== 'triple-street')) return directError();
  if (selection.durationMinutes > selection.schedule.availableMinutes) return directError();
  return { ok: true, direct: true };
}

export function paramsFromBody(body) {
  const params = new URLSearchParams();
  if (typeof body === 'string') {
    new URLSearchParams(body).forEach((value, key) => params.append(key, value));
    return params;
  }
  Object.entries(body || {}).forEach(([key, value]) => {
    (Array.isArray(value) ? value : [value]).forEach(item => {
      if (item !== undefined && item !== null) params.append(key, String(item));
    });
  });
  return params;
}

export function jotformParams(params) {
  const sanitized = new URLSearchParams();
  params.forEach((value, key) => {
    if (ALLOWED_JOTFORM_FIELDS.has(key)) sanitized.append(key, value);
  });
  return sanitized;
}

function createRequestId() {
  return 'sub_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
}

function boundedLogText(value, maxLength) {
  return String(value || '')
    .normalize('NFKC')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

export function submissionLogContext(params, classification) {
  if (!(params instanceof URLSearchParams)) {
    return { region: '', plan: '', matching_type: '', teacher_id: '', teacher_name: '' };
  }

  const matchingType = singleParam(params, 'submission[62]', 40) || MANUAL_MATCHING_TYPE;
  const teacherId = singleParam(params, 'submission[64]', 80);
  const teacherName = singleParam(params, 'submission[63]', 100);
  const tierValue = singleParam(params, 'submission[30]', 60);
  const plan = canonicalPlan(tierValue.replace(/\([^)]*\)\s*$/, ''));

  let region = classification && classification.selection
    ? boundedLogText(classification.selection.region, 20)
    : '';

  if (!region) {
    const notes = params.getAll('submission[28]');
    if (notes.length === 1) {
      const metadata = parseMetadataBlock(notes[0]);
      if (metadata && metadata.selected_region) region = boundedLogText(metadata.selected_region, 20);
    }
  }

  if (!region) {
    const placeText = params.getAll('submission[29][]').join(' ');
    if (/서울/.test(placeText)) region = 'Seoul';
    else if (/송도|IGC|트리플/.test(placeText)) region = 'Songdo';
  }

  return {
    region,
    plan,
    matching_type: boundedLogText(matchingType, 40),
    teacher_id: boundedLogText(teacherId, 80),
    teacher_name: boundedLogText(teacherName, 100)
  };
}

function directoryErrorType(error) {
  if (error && error.message === 'directory_config') return 'teacher_directory_config';
  if (error && error.name === 'AbortError') return 'teacher_directory_timeout';
  return 'teacher_directory_upstream';
}

async function writeSubmissionErrorLog(options) {
  const env = options.env || {};
  const supabaseUrl = boundedLogText(env.SUPABASE_URL, 500);
  const secretKey = boundedLogText(env.SUPABASE_SECRET_KEY, 1200);
  if (!supabaseUrl || !secretKey) return false;

  let endpoint;
  try {
    endpoint = new URL('/rest/v1/submission_error_logs', supabaseUrl);
  } catch (error) {
    console.warn('submission_error_logs: invalid SUPABASE_URL');
    return false;
  }
  if (endpoint.protocol !== 'https:') return false;

  const context = submissionLogContext(options.params, options.classification);
  const payload = {
    request_id: boundedLogText(options.requestId, 100),
    status_code: Number(options.statusCode) || 500,
    error_type: boundedLogText(options.errorType, 80) || 'unknown_error',
    error_message: boundedLogText(options.errorMessage, 300),
    region: context.region || null,
    plan: context.plan || null,
    matching_type: context.matching_type || null,
    teacher_id: context.teacher_id || null,
    teacher_name: context.teacher_name || null,
    upstream_status: Number.isFinite(Number(options.upstreamStatus)) ? Number(options.upstreamStatus) : null,
    upstream_code: options.upstreamCode === undefined || options.upstreamCode === null
      ? null
      : boundedLogText(options.upstreamCode, 80),
    environment: boundedLogText(env.VERCEL_ENV || 'unknown', 40)
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1500);
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        apikey: secretKey,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    if (!response.ok) {
      console.warn('submission_error_logs insert failed:', response.status);
      return false;
    }
    return true;
  } catch (error) {
    console.warn('submission_error_logs write failed:', error && error.name ? error.name : 'unknown');
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

async function respondWithSubmissionError(res, options) {
  await writeSubmissionErrorLog(options);
  return res.status(options.statusCode).json({
    success: false,
    error: options.errorMessage,
    error_type: options.errorType,
    request_id: options.requestId
  });
}

async function loadPublicDirectory(region, env) {
  const supabaseUrl = cleanText(String(env.SUPABASE_URL || ''), 500);
  const supabaseKey = cleanText(String(env.SUPABASE_ANON_KEY || env.SUPABASE_PUBLISHABLE_KEY || ''), 1000);
  if (!supabaseUrl || !supabaseKey) throw new Error('directory_config');

  let endpoint;
  try {
    endpoint = new URL('/rest/v1/rpc/' + DIRECTORY_RPC, supabaseUrl);
  } catch (error) {
    throw new Error('directory_config');
  }
  if (endpoint.protocol !== 'https:') throw new Error('directory_config');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  let response;
  let data;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        apikey: supabaseKey,
        Authorization: 'Bearer ' + supabaseKey,
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ p_region: region }),
      signal: controller.signal
    });
    if (!response.ok) throw new Error('directory_upstream');
    data = await response.json().catch(() => null);
  } finally {
    clearTimeout(timeout);
  }
  if (!Array.isArray(data) || data.length > 500) throw new Error('directory_upstream');
  return data;
}

export const __testing = Object.freeze({ canonicalArea, canonicalPlan, parseSelectedAreas, normalizeTime, timeMinutes });

export default async function handler(req, res) {
  const requestId = createRequestId();
  const allowedOrigins = new Set([
    'https://hellonado.com',
    'https://www.hellonado.com',
    'https://nado-intro-web.vercel.app'
  ]);
  const origin = req.headers.origin;

  if (origin && allowedOrigins.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }

  if (req.method === 'OPTIONS') {
    return origin && allowedOrigins.has(origin)
      ? res.status(204).end()
      : res.status(403).json({ success: false, error: '허용되지 않은 출처입니다' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'POST만 허용됩니다',
      error_type: 'method_not_allowed',
      request_id: requestId
    });
  }

  if (origin && !allowedOrigins.has(origin)) {
    return res.status(403).json({
      success: false,
      error: '허용되지 않은 출처입니다',
      error_type: 'origin_not_allowed',
      request_id: requestId
    });
  }

  let params;
  try {
    params = paramsFromBody(req.body);
  } catch (error) {
    return respondWithSubmissionError(res, {
      env: process.env,
      requestId,
      statusCode: 500,
      errorType: 'request_parse_error',
      errorMessage: '신청 처리 중 오류가 발생했습니다',
      params: null,
      classification: null
    });
  }

  const parsedSelection = classifyMatchingSubmission(params, {
    // Cached v1 pages removed their three-key matching block in the browser.
    // Keep this temporary compatibility path until the v2 cache window closes,
    // then set ALLOW_LEGACY_SELECTED_PAYLOADS=false in Vercel.
    allowLegacySelectedPayloads: process.env.ALLOW_LEGACY_SELECTED_PAYLOADS !== 'false'
  });
  if (parsedSelection.selected && !origin) {
    return res.status(403).json({
      success: false,
      error: '선생님 선택 신청은 웹사이트에서만 가능합니다',
      error_type: 'selected_origin_required',
      request_id: requestId
    });
  }
  if (!parsedSelection.ok) {
    return respondWithSubmissionError(res, {
      env: process.env,
      requestId,
      statusCode: parsedSelection.status,
      errorType: parsedSelection.status === 503 ? 'teacher_directory_payload_invalid' : 'teacher_selection_payload_invalid',
      errorMessage: parsedSelection.error,
      params,
      classification: parsedSelection
    });
  }

  const studentPolicy = validateStudentPolicy(params);
  if (!studentPolicy.ok) {
    return respondWithSubmissionError(res, {
      env: process.env,
      requestId,
      statusCode: studentPolicy.status,
      errorType: 'student_policy_invalid',
      errorMessage: studentPolicy.error,
      params,
      classification: parsedSelection
    });
  }

  if (parsedSelection.direct) {
    let directoryRows;
    try {
      directoryRows = await loadPublicDirectory(parsedSelection.selection.region, process.env);
    } catch (error) {
      return respondWithSubmissionError(res, {
        env: process.env,
        requestId,
        statusCode: 503,
        errorType: directoryErrorType(error),
        errorMessage: '현재 선생님 가능 시간을 확인할 수 없습니다. 잠시 후 다시 시도해주세요.',
        params,
        classification: parsedSelection
      });
    }
    const currentSelection = validateSelectionAgainstDirectory(parsedSelection.selection, directoryRows);
    if (!currentSelection.ok) {
      return respondWithSubmissionError(res, {
        env: process.env,
        requestId,
        statusCode: currentSelection.status,
        errorType: currentSelection.status === 503 ? 'teacher_directory_data_invalid' : 'teacher_selection_changed',
        errorMessage: currentSelection.error,
        params,
        classification: parsedSelection
      });
    }
  }

  const API_KEY = process.env.JOTFORM_API_KEY;
  if (!API_KEY) {
    return respondWithSubmissionError(res, {
      env: process.env,
      requestId,
      statusCode: 500,
      errorType: 'jotform_config_missing',
      errorMessage: '서버 설정이 완료되지 않았습니다',
      params,
      classification: parsedSelection
    });
  }

  try {
    const jotformRes = await fetch(
      `https://api.jotform.com/form/${FORM_ID}/submissions?apiKey=${API_KEY}`,
      { method: 'POST', body: jotformParams(canonicalizeSubmission(params, parsedSelection)) }
    );
    const data = await jotformRes.json().catch(() => null);
    const responseCode = data && Number(data.responseCode);
    if (!jotformRes.ok || !data || responseCode !== 200) {
      return respondWithSubmissionError(res, {
        env: process.env,
        requestId,
        statusCode: 502,
        errorType: 'jotform_upstream_error',
        errorMessage: '신청 저장에 실패했습니다',
        params,
        classification: parsedSelection,
        upstreamStatus: jotformRes.status,
        upstreamCode: data && data.responseCode
      });
    }
    return res.status(200).json({ success: true, request_id: requestId });
  } catch (error) {
    return respondWithSubmissionError(res, {
      env: process.env,
      requestId,
      statusCode: 500,
      errorType: error && error.name === 'AbortError' ? 'jotform_timeout' : 'jotform_network_error',
      errorMessage: '신청 처리 중 오류가 발생했습니다',
      params,
      classification: parsedSelection
    });
  }
}
