const DURATIONS = ['1시간','2시간'];
const PRICE_TABLE = {
  '이코노미': [140000,280000],
  '스탠다드': [180000,360000],
  '프리미엄': [220000,440000]
};
const SONGDO_LOCATION_DISCOUNT = 10000;
const FREQ_MULTIPLIER = { '주 1회': 1, '주 2회': 2, '체험 1회': 0.25 };
const TRIAL_DEPOSIT = 20000;
const PLAN_GROUP = { '이코노미': 'economy', '스탠다드': 'standard', '프리미엄': 'premium' };
const DAY_OF_WEEK = { '일': 0, '월': 1, '화': 2, '수': 3, '목': 4, '금': 5, '토': 6 };
const SEOUL_SERVICE_AREAS = [
  { code: 'Gangnam', label: '강남' },
  { code: 'Daechi', label: '대치' },
  { code: 'Jamsil', label: '잠실' },
  { code: 'Hanti', label: '한티' },
  { code: 'Hongdae', label: '홍대' },
  { code: 'Yongsan', label: '용산' },
  { code: 'Line 3 vicinity', label: '3호선 인근' }
];
const LOCAL_TEACHER_PHOTOS = {
  abhinay: 'img/abhinay.jpg',
  amelia: 'img/amelia.jpg',
  amy: 'img/amy.jpg',
  anniah: 'img/anniah.jpg',
  ej: 'img/ej.jpg',
  hara: 'img/hara.jpg',
  justina: 'img/justina.jpg',
  oscar: 'img/oscar.jpg',
  sophie: 'img/sophie.jpg',
  tae: 'img/tae.jpg',
  victoria: 'img/victoria.jpg',
  vita: 'img/vitalina.jpg',
  vitalina: 'img/vitalina.jpg'
};
function escapeApplicationHtml(value){
  const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(value == null ? '' : value).replace(/[&<>"']/g, character => entities[character]);
}
function serviceAreaLabel(code){
  const area = SEOUL_SERVICE_AREAS.find(item => item.code === code);
  return area ? area.label : (code || '');
}
function durationLabel(idx){
  return DURATIONS[idx] || DURATIONS[0];
}
function calcPrice(tier, idx, freq){
  if (!PRICE_TABLE[tier]) return 0;
  if (TRIAL_MODE) {
    return answers.trialType === '플랜 선택 체험' ? PRICE_TABLE[tier][idx] / 4 : 0;
  }
  const regularPrice = PRICE_TABLE[tier][idx] * FREQ_MULTIPLIER[freq];
  const songdoDiscount = answers.placeType === '송도 할인 장소'
    ? SONGDO_LOCATION_DISCOUNT
    : 0;
  return Math.max(0, regularPrice - songdoDiscount);
}
function freqLabel(freq){
  if (TRIAL_MODE) return answers.trialType || '체험수업';
  return freq;
}
function placeLabel(a){
  if (a.placeType === 'IGC 인천글로벌캠퍼스' || a.placeType === '송도 트리플스트리트') return a.placeType;
  if (a.placeType === '송도 할인 장소') {
    return '송도 지정 장소' + (a.songdoPlace ? ' · ' + a.songdoPlace : '');
  }
  if (a.placeType === '송도 원하는 장소' || a.placeType === '서울 원하는 장소') {
    const city = a.placeType === '송도 원하는 장소' ? '송도' : '서울';
    const preferredPlace = (a.preferredPlace || '').trim();
    const serviceArea = a.placeType === '서울 원하는 장소' ? serviceAreaLabel(a.areaCode) : '';
    return city + ' 희망 장소'
      + (serviceArea ? ' · ' + serviceArea : '')
      + (preferredPlace ? ' · ' + preferredPlace : '')
      ;
  }
  if (a.placeType === '송도') {
    const preferredSongdoPlace = (a.preferredPlace || '').trim();
    return '송도'
      + (preferredSongdoPlace ? ' · ' + preferredSongdoPlace : '')
      + ' · 세부 장소는 추후 조율';
  }
  return (a.place || []).join(', ') || '-';
}

function isElementaryOrYounger(value){
  const normalized = String(value || '').normalize('NFKC').replace(/\s+/g, '');
  return normalized === '초등학생' || normalized === '초등학생이하';
}

const steps = [
  {
    key: 'trialType', type: 'trialType', required: true,
    title: '체험수업 선택',
    sub: '방식과 장소를 선택해주세요.'
  },
  {
    key: 'ageGroup', type: 'single', required: true,
    title: '나이대가 어떻게 되시나요?',
    options: ['초등학생 이하','중고등학생','20대','30대','40대','50대 이상']
  },
  {
    key: 'tier', type: 'tier', required: true,
    title: '원하는 수업 방식을 선택하세요',
    sub: '맞춤형 커리큘럼을 원하시면 <strong>Standard 이상</strong>을 선택해주세요.',
    options: [
      {
        name: '이코노미',
        desc: '영어 회화 실력이 검증된 선생님과 부담 없이 시작하세요.',
        more: '· 나도가 제공하는 기본 커리큘럼 중 나의 목적과 맞는 자료로 진행<br>· 일상 회화와 말하기 자신감에 집중<br>· 서울 및 송도 지역에서 수업 가능<br>· 세부 장소는 선생님과 조율<br>· 송도 지정 장소 선택 시 월 1만원 할인<br>· 수업 타입: 일상회화 · 여행영어 · 시험/면접 · 발음교정'
      },
      {
        name: '스탠다드', badge: 'Most Popular',
        desc: '내 목표와 수준에 맞춘 체계적인 수업을 경험하세요.',
        more: '· 영어 수준·목표·관심사에 맞춘 커리큘럼<br>· 선생님이 자료와 수업 흐름을 개별적으로 준비<br>· 서울 및 송도 지역에서 수업 가능<br>· 세부 장소는 선생님과 조율<br>· 송도 지정 장소 선택 시 월 1만원 할인<br>· 수업 타입: 일상회화 · 여행영어 · 시험/면접 · 발음교정'
      },
      {
        name: '프리미엄',
        desc: '나도 최우수 선생님과 함께 비즈니스·전문 목표에 집중하세요.',
        more: '· 비즈니스 영어 및 전문적인 학습 목표 중심<br>· 신청 후 목표를 확인하고 적합한 선생님 안내<br>· 선생님의 진행 의사와 일정을 확인한 후 확정<br>· 서울 및 송도 지역에서 수업 가능<br>· 세부 장소는 선생님과 조율<br>· 송도 지정 장소 선택 시 월 1만원 할인<br>· 수업 타입: 일상회화 · 비즈니스 · 여행영어 · 시험/면접 · 발음교정'
      }
    ]
  },
  {
    key: 'duration', type: 'duration', required: true,
    title: '회당 수업 길이를 선택해주세요',
    sub: ''
  },
  {
    key: 'place', type: 'rank', required: true
  },


  {
    key: 'gender', type: 'single', required: true,
    title: '성별이 어떻게 되시나요?',
    options: ['남성','여성','응답하지 않음']
  },
  {
    key: 'level', type: 'single', required: true,
    title: '현재 영어 수준은 어느 정도인가요?',
    options: ['초급 (기초 단어·문장)','중급 (일상 대화 가능)','고급 (자유로운 회화)']
  },
  {
    key: 'goals', type: 'multi', required: true,
    title: '어떤 목표로 영어를 배우고 싶으신가요?',
    sub: '중복 선택 가능해요.',
    options: ['일상회화','비즈니스','여행영어','시험/면접 준비','발음교정','기타']
  },
  {
    key: 'schedule', type: 'firstlesson', required: true,
    title: '첫 수업 날짜·시간을 선택해주세요',
    sub: '가능한 시간을 <strong class="all-times-emphasis">모두</strong> 선택해주세요.'
  },
   {
    key: 'startDate', type: 'date', required: true,
    title: '언제부터 수업을 시작하고 싶으신가요?',
    sub: '희망하시는 첫 수업 날짜를 선택해주세요.<br>선생님 일정에 따라, 희망하신 날짜보다 첫 수업이 조금 늦어지거나 빨라질 수 있어요.'
  },
{
    key: 'referral', type: 'multi', required: true,
    title: '나도를 어떻게 알게 되셨나요?',
    sub: '중복 선택 가능해요.',
    options: ['당근마켓 광고','인스타그램','지인 추천','유튜브','구글 광고','기타']
  },
  {
    key: 'notes', type: 'text', required: false,
    title: '추가로 전달하고 싶은 내용이 있으신가요?',
    sub: '선택 사항이에요.',
    placeholder: '예: 발표 준비 때문에 비즈니스 표현 위주로 배우고 싶어요',
    quickFill: ''
  },
  {
    key: 'contact', type: 'contact', required: true,
    title: '마지막이에요! 연락처를 남겨주세요',
    sub: '신청 또는 상담 진행 상황을 이 번호로 안내드려요.'
  },
  {
    key: 'payment', type: 'payment', required: true,
    title: '결제 안내',
    sub: '신청 내용을 확인한 후 <strong style="color:var(--ink);">카카오톡으로</strong> 결제 또는 상담 절차를 안내해드릴 예정입니다.'
  }
];
const TRIAL_MODE = document.body.dataset.mode === 'trial';
const SITES_REVIEW_MODE = window.location.hostname.endsWith('.chatgpt.site');
const PRODUCTION_APPLICATION_HOSTS = ['hellonado.com', 'www.hellonado.com', 'nado-intro-web.vercel.app'];
// Preview copies complete the same UI flow without creating a real application.
const LOCAL_TEST_MODE = window.location.protocol === 'file:' ||
  !PRODUCTION_APPLICATION_HOSTS.includes(window.location.hostname);


const DIRECTORY_PLAN_LABELS = Object.freeze({
  economy: '이코노미',
  '이코노미': '이코노미',
  standard: '스탠다드',
  '스탠다드': '스탠다드',
  premium: '프리미엄',
  '프리미엄': '프리미엄'
});
const DIRECTORY_DAY_LABELS = Object.freeze({
  '0': '일', '일': '일', '일요일': '일', sunday: '일', sun: '일',
  '1': '월', '월': '월', '월요일': '월', monday: '월', mon: '월',
  '2': '화', '화': '화', '화요일': '화', tuesday: '화', tue: '화',
  '3': '수', '수': '수', '수요일': '수', wednesday: '수', wed: '수',
  '4': '목', '목': '목', '목요일': '목', thursday: '목', thu: '목',
  '5': '금', '금': '금', '금요일': '금', friday: '금', fri: '금',
  '6': '토', '토': '토', '토요일': '토', saturday: '토', sat: '토'
});
const DIRECTORY_DAY_INDEXES = Object.freeze({ '일': 0, '월': 1, '화': 2, '수': 3, '목': 4, '금': 5, '토': 6 });
const DIRECTORY_SEOUL_AREA_CODES = Object.freeze({
  '강남': 'Gangnam', '서초': 'Seocho', '대치': 'Daechi', '잠실': 'Jamsil', '한티': 'Hanti',
  '홍대': 'Hongdae', '합정': 'Hapjeong', '신촌': 'Sinchon', '용산': 'Yongsan',
  '영등포구': 'Yeongdeungpo-gu', '선유도': 'Seonyudo', '양천구': 'Yangcheon-gu', '양천': 'Yangcheon-gu',
  '3호선 인근': 'Line 3 vicinity'
});
const SONGDO_DISCOUNT_AREAS = Object.freeze(['IGC 인천글로벌캠퍼스', '송도 트리플스트리트']);

function directoryMapValue(map, key) {
  return Object.prototype.hasOwnProperty.call(map, key) ? map[key] : undefined;
}

function cleanDirectoryText(value, maxLength) {
  return String(value == null ? '' : value)
    .normalize('NFKC')
    .replace(/[\u0000-\u001F\u007F<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function normalizeDirectoryTime(value, allowMidnight) {
  const match = String(value || '').trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return '';
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (!Number.isInteger(hour) || !Number.isInteger(minute) || minute < 0 || minute > 59) return '';
  if (hour === 24) return allowMidnight && minute === 0 ? '24:00' : '';
  if (hour < 0 || hour > 23) return '';
  return String(hour).padStart(2, '0') + ':' + String(minute).padStart(2, '0');
}

function directoryTimeMinutes(value) {
  const parts = String(value || '').split(':').map(Number);
  if (parts.length !== 2 || !Number.isFinite(parts[0]) || !Number.isFinite(parts[1])) return NaN;
  return parts[0] * 60 + parts[1];
}

function localDateInputValue(value) {
  const date = value instanceof Date ? value : new Date();
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('-');
}

function parseLocalDateInput(value) {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}

function nextDirectoryWeekday(dayLabel, fromDate) {
  const targetDay = DIRECTORY_DAY_INDEXES[dayLabel];
  if (!Number.isInteger(targetDay)) return '';
  const source = fromDate instanceof Date ? fromDate : new Date();
  const date = new Date(source.getFullYear(), source.getMonth(), source.getDate());
  const daysAhead = (targetDay - date.getDay() + 7) % 7 || 7;
  date.setDate(date.getDate() + daysAhead);
  return localDateInputValue(date);
}

function isValidDirectoryStartDate(value, dayLabel, fromDate) {
  const selected = parseLocalDateInput(value);
  const targetDay = DIRECTORY_DAY_INDEXES[dayLabel];
  if (!selected || !Number.isInteger(targetDay) || selected.getDay() !== targetDay) return false;
  const source = fromDate instanceof Date ? fromDate : new Date();
  const today = new Date(source.getFullYear(), source.getMonth(), source.getDate());
  return selected >= today;
}

function isSongdoDiscountAreaList(areas) {
  return Array.isArray(areas)
    && areas.length > 0
    && areas.every(area => SONGDO_DISCOUNT_AREAS.includes(String(area || '').trim()));
}

function isTrialDirectoryAreaValue(value) {
  const areas = String(value || '').split('·').map(area => area.trim()).filter(Boolean);
  return areas.length > 0 && areas.every(area => (
    area.includes('IGC')
    || area.includes('인천글로벌캠퍼스')
    || area.includes('트리플스트리트')
  ));
}

function parseDirectorySelection(search, options) {
  const params = new URLSearchParams(search || '');
  if (params.get('source') !== 'teacher-directory') return null;

  const pageMode = options && options.pageMode === 'trial' ? 'trial' : 'regular';
  const mode = String(params.get('mode') || '').toLowerCase();
  const trialType = mode === 'trial'
    ? (String(params.get('trial_type') || 'free').toLowerCase() === 'paid' ? 'paid' : 'free')
    : '';
  const sourceKind = String(params.get('source_kind') || '').toLowerCase();
  if (mode !== pageMode || (sourceKind !== 'live' && sourceKind !== 'snapshot')) return null;
  if (sourceKind === 'snapshot' && !(options && options.localTestMode)) return null;

  const teacherId = cleanDirectoryText(params.get('teacher_id'), 80);
  const teacherName = cleanDirectoryText(params.get('teacher_name'), 80);
  const suppliedPlan = cleanDirectoryText(params.get('plan'), 30);
  const rawPlan = suppliedPlan.toLowerCase();
  const plan = directoryMapValue(DIRECTORY_PLAN_LABELS, rawPlan)
    || directoryMapValue(DIRECTORY_PLAN_LABELS, suppliedPlan);
  const rawPlanOptions = cleanDirectoryText(params.get('plan_options'), 60).toLowerCase();
  const planOptionKeys = /^(economy|standard)(,(economy|standard))*$/.test(rawPlanOptions)
    ? Array.from(new Set(rawPlanOptions.split(',')))
    : [];
  const planOptions = planOptionKeys.map(key => directoryMapValue(DIRECTORY_PLAN_LABELS, key));
  const hasPlanChoice = Boolean(plan) || ((mode === 'regular' || trialType === 'paid') && planOptions.length > 0);
  const rawRegion = cleanDirectoryText(params.get('region'), 20).toLowerCase();
  const region = rawRegion === 'songdo' || rawRegion === '송도'
    ? 'Songdo'
    : (rawRegion === 'seoul' || rawRegion === '서울' ? 'Seoul' : '');
  const rawDay = cleanDirectoryText(params.get('day'), 20).toLowerCase();
  const day = directoryMapValue(DIRECTORY_DAY_LABELS, rawDay) || '';
  const start = normalizeDirectoryTime(params.get('start'), false);
  const end = normalizeDirectoryTime(params.get('end'), true);
  const rawAvailableMinutes = String(params.get('available_minutes') || '').trim();
  const area = cleanDirectoryText(params.get('area'), 100);
  const liveTeacherIdIsValid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(teacherId);
  const snapshotTeacherIdIsValid = /^preview-[a-z0-9_-]{1,60}$/i.test(teacherId);
  const startMinutes = directoryTimeMinutes(start);
  const endMinutes = directoryTimeMinutes(end);
  const availableMinutes = /^\d{1,4}$/.test(rawAvailableMinutes) ? Number(rawAvailableMinutes) : NaN;

  if (!teacherName || !hasPlanChoice || !region || !day || !start || !end || !area) return null;
  if (mode === 'trial' && trialType === 'free' && !plan) return null;
  if (!Number.isFinite(startMinutes) || !Number.isFinite(endMinutes) || endMinutes <= startMinutes) return null;
  if (!Number.isInteger(availableMinutes) || availableMinutes < 60 || availableMinutes !== endMinutes - startMinutes) return null;
  if (sourceKind === 'live' && !liveTeacherIdIsValid) return null;
  if (sourceKind === 'snapshot' && !snapshotTeacherIdIsValid) return null;
  if (mode === 'trial' && trialType === 'free' && (
    region !== 'Songdo'
    || plan !== '이코노미'
    || !isTrialDirectoryAreaValue(area)
  )) return null;

  return {
    sourceKind,
    teacherId,
    teacherName,
    plan,
    planOptions,
    trialType,
    region,
    day,
    start,
    end,
    area,
    timeLabel: day + '요일 ' + start + '–' + end,
    availableMinutes
  };
}

function directoryReturnHrefFor(selection, trialMode, trialAnswer) {
  const region = selection?.region || '';
  const type = selection?.trialType || (trialAnswer === '플랜 선택 체험' ? 'paid' : 'free');
  const plan = selection?.plan
    ? Object.keys(DIRECTORY_PLAN_LABELS).find(key => DIRECTORY_PLAN_LABELS[key] === selection.plan && /^[a-z]+$/.test(key))
    : '';
  const params = new URLSearchParams();
  if (trialMode) {
    params.set('finder', 'trial');
    params.set('trial_type', type);
  }
  if (plan) params.set('plan', plan);
  if (region) params.set('region', region);
  const hash = region ? '#teacherDirectory' : (trialMode ? '#teacher-finder' : '#teacherRegionPicker');
  return 'teachers.html' + (params.toString() ? '?' + params.toString() : '') + hash;
}

const DIRECTORY_SELECTION = parseDirectorySelection(window.location.search, {
  pageMode: TRIAL_MODE ? 'trial' : 'regular',
  localTestMode: LOCAL_TEST_MODE
});

const DIRECTORY_TIME_CHOICES = (() => {
  if (!DIRECTORY_SELECTION) return [];
  try {
    const raw = JSON.parse(new URLSearchParams(location.search).get('time_choices') || '[]');
    if (!Array.isArray(raw)) return [];
    return raw.slice(0,150).map(query => {
      const slot = parseDirectorySelection(query,{pageMode:TRIAL_MODE?'trial':'regular',localTestMode:LOCAL_TEST_MODE});
      const time = new URLSearchParams(query).get('preferred_time');
      if (!slot || slot.teacherId!==DIRECTORY_SELECTION.teacherId || slot.region!==DIRECTORY_SELECTION.region || slot.area!==DIRECTORY_SELECTION.area || slot.plan!==DIRECTORY_SELECTION.plan || !/^\d{2}:(00|30)$/.test(time || '')) return null;
      if(directoryTimeMinutes(time)<directoryTimeMinutes(slot.start)||directoryTimeMinutes(time)+60>directoryTimeMinutes(slot.end))return null;
      return {...slot,preferredTime:time};
    }).filter(Boolean);
  } catch (_) { return []; }
})();
function directorySlots() { return DIRECTORY_TIME_CHOICES.length ? DIRECTORY_TIME_CHOICES : DIRECTORY_SELECTION ? [DIRECTORY_SELECTION] : []; }
function slotForOption(option) {
  const start=directoryTimeMinutes(option.time), duration=answers.duration?.index===1?120:60;
  return directorySlots().find(slot=>isValidDirectoryStartDate(option.date,slot.day) && start>=directoryTimeMinutes(slot.start) && start+duration<=directoryTimeMinutes(slot.end) && (!slot.preferredTime || slot.preferredTime===option.time));
}

function directoryReturnHref() {
  return directoryReturnHrefFor(DIRECTORY_SELECTION, TRIAL_MODE, answers.trialType);
}

let current = 0;
const answers = {
  frequency: TRIAL_MODE ? '체험 1회' : '주 1회',
  duration: { index: 0 },
  preferredPlace: '',
  areaCode: ''
};

if (!DIRECTORY_SELECTION) {
  const initialParams = new URLSearchParams(window.location.search);
  const initialPlan = directoryMapValue(DIRECTORY_PLAN_LABELS, cleanDirectoryText(initialParams.get('plan'), 30).toLowerCase());
  if (initialPlan) answers.tier = initialPlan;
  if (TRIAL_MODE) {
    const initialTrialType = cleanDirectoryText(initialParams.get('trial_type'), 10).toLowerCase();
    if (initialTrialType === 'free') {
      answers.trialType = '무료 체험';
      answers.tier = '이코노미';
    } else if (initialTrialType === 'paid') {
      answers.trialType = '플랜 선택 체험';
    }
  }
}

if (DIRECTORY_SELECTION) {
  const isSongdo = DIRECTORY_SELECTION.region === 'Songdo';
  const normalizedAreas = Array.from(new Set(DIRECTORY_SELECTION.area.split('·').map(value => {
    const area = value.trim();
    if (area.indexOf('IGC') > -1) return 'IGC 인천글로벌캠퍼스';
    if (area.indexOf('트리플') > -1) return '송도 트리플스트리트';
    return area;
  }).filter(Boolean)));
  const areaNeedsConfirmation = normalizedAreas.length > 1;
  const songdoDiscountApplies = isSongdo && isSongdoDiscountAreaList(normalizedAreas);
  const isFreeDirectoryTrial = TRIAL_MODE && DIRECTORY_SELECTION.trialType === 'free';
  const isPaidDirectoryTrial = TRIAL_MODE && DIRECTORY_SELECTION.trialType === 'paid';
  const areaConfirmationLabel = isSongdo && !songdoDiscountApplies && !TRIAL_MODE
    ? '신청 후 최종 장소 조율'
    : '신청 후 한 곳 확정';
  let selectedAreaDisplay = normalizedAreas.join(' 또는 ')
    + (areaNeedsConfirmation ? ' (' + areaConfirmationLabel + ')' : '');
  if (isSongdo && !songdoDiscountApplies && !TRIAL_MODE && !/(확정|조율)/.test(selectedAreaDisplay)) {
    selectedAreaDisplay += ' (최종 장소 조율)';
  }
  const songdoArea = selectedAreaDisplay;
  const seoulAreaCode = directoryMapValue(DIRECTORY_SEOUL_AREA_CODES, DIRECTORY_SELECTION.area) || DIRECTORY_SELECTION.area;
  const trialPlaceType = areaNeedsConfirmation ? '송도 무료 체험 가능 장소' : songdoArea;
  const regularPlaceType = isSongdo
    ? (songdoDiscountApplies ? '송도 할인 장소' : '송도')
    : '서울 원하는 장소';
  const paidTrialPlaceType = isSongdo ? songdoArea : '서울 원하는 장소';
  const premiumInquiry = DIRECTORY_SELECTION.plan === '프리미엄';

  Object.assign(answers, {
    matching_type: premiumInquiry ? 'premium_inquiry' : 'directory_selected',
    teacher_id: DIRECTORY_SELECTION.teacherId,
    teacher_name: DIRECTORY_SELECTION.teacherName,
    tier: DIRECTORY_SELECTION.plan,
    schedule: [DIRECTORY_SELECTION.timeLabel],
    duration: { index: 0 },
    trialType: isFreeDirectoryTrial ? '무료 체험' : (isPaidDirectoryTrial ? '플랜 선택 체험' : undefined),
    place: [isFreeDirectoryTrial ? songdoArea : (isPaidDirectoryTrial ? paidTrialPlaceType : regularPlaceType)],
    placeType: isFreeDirectoryTrial ? trialPlaceType : (isPaidDirectoryTrial ? paidTrialPlaceType : regularPlaceType),
    songdoPlace: isSongdo && (isFreeDirectoryTrial || (!TRIAL_MODE && songdoDiscountApplies)) ? songdoArea : '',
    preferredPlace: isPaidDirectoryTrial
      ? selectedAreaDisplay
      : (isSongdo && !isFreeDirectoryTrial && !songdoDiscountApplies ? selectedAreaDisplay : ''),
    areaCode: isSongdo ? '' : seoulAreaCode,
    selection_source: 'teacher-directory',
    selection_source_kind: DIRECTORY_SELECTION.sourceKind,
    selected_region: DIRECTORY_SELECTION.region,
    selected_area: selectedAreaDisplay
  });
}

function elementaryPolicyViolation(){
  if (!isElementaryOrYounger(answers.ageGroup)) return '';
  if (TRIAL_MODE && answers.trialType === '무료 체험') return 'free-trial';
  if (DIRECTORY_SELECTION && DIRECTORY_SELECTION.plan && DIRECTORY_SELECTION.plan !== '스탠다드') {
    return TRIAL_MODE ? 'trial-plan' : 'regular-plan';
  }
  if (answers.tier && answers.tier !== '스탠다드') {
    return TRIAL_MODE ? 'trial-plan' : 'regular-plan';
  }
  return '';
}

function elementaryAlternativeHref(){
  return TRIAL_MODE
    ? 'teachers.html?finder=trial&trial_type=paid&plan=standard#teacher-finder'
    : 'teachers.html?finder=region&plan=standard#teacherRegionPicker';
}

function applyStudentAgePolicy(){
  if (!isElementaryOrYounger(answers.ageGroup)) return;
  answers.payment = false;
  if (Array.isArray(answers.goals)) {
    answers.goals = answers.goals.filter(goal => goal !== '비즈니스');
  }
  const fixedDirectoryPlan = Boolean(DIRECTORY_SELECTION && DIRECTORY_SELECTION.plan);
  const freeTrial = TRIAL_MODE && answers.trialType === '무료 체험';
  if (!fixedDirectoryPlan && !freeTrial && answers.tier && answers.tier !== '스탠다드') {
    answers.tier = '';
    if (!DIRECTORY_SELECTION) {
      answers.place = [];
      answers.placeType = '';
      answers.preferredPlace = '';
      answers.areaCode = '';
      answers.songdoPlace = '';
    }
  }
}

function buildLessonSteps(){
  if (DIRECTORY_SELECTION) {
    const skipped = new Set(['trialType', 'place', 'startDate']);
    if (TRIAL_MODE) skipped.add('duration');
    if (DIRECTORY_SELECTION.plan) skipped.add('tier');
    return steps.filter(step => !skipped.has(step.key));
  }
  if (!TRIAL_MODE) return steps.filter(s => s.key !== 'trialType' && s.key !== 'startDate');
  if (!answers.trialType) return steps.filter(s => s.key === 'trialType');
  if (answers.trialType === '플랜 선택 체험') {
    return steps.filter(s => s.key !== 'duration' && s.key !== 'startDate');
  }
  return steps.filter(s => s.key !== 'startDate' && s.key !== 'tier' && s.key !== 'place' && s.key !== 'duration');
}
function buildActiveSteps() {
  const options = ['정규 수업', '체험 수업'];
  if (DIRECTORY_SELECTION?.region === 'Songdo' && isTrialDirectoryAreaValue(DIRECTORY_SELECTION.area) && (DIRECTORY_SELECTION.plan === '이코노미' || DIRECTORY_SELECTION.planOptions.includes('이코노미'))) options.push('송도 무료 체험');
  return [{key:'lessonKind',type:'single',required:true,title:'어떤 수업을 신청하시겠어요?',options}, ...buildLessonSteps()];
}
function lessonKindUrl(kind) {
  const url = new URL(location.href);
  const trial = kind !== '정규 수업';
  url.pathname = url.pathname.replace(/[^/]*$/,trial ? 'trial.html' : 'apply.html');
  url.searchParams.set('lesson_kind',trial ? 'trial' : 'regular');
  url.searchParams.set('mode',trial ? 'trial' : 'regular');
  if (kind === '송도 무료 체험') { url.searchParams.set('trial_type','free'); url.searchParams.set('plan','economy'); }
  else if (trial && DIRECTORY_SELECTION) url.searchParams.set('trial_type','paid');
  else url.searchParams.delete('trial_type');
  return url.href;
}
const initialLessonKind = new URL(location.href).searchParams.get('lesson_kind');
answers.lessonKind = initialLessonKind === 'trial' ? (DIRECTORY_SELECTION?.trialType === 'free' ? '송도 무료 체험' : '체험 수업') : initialLessonKind === 'regular' ? '정규 수업' : '';
let activeSteps = buildActiveSteps();
if (answers.lessonKind) current = 1;
if (DIRECTORY_TIME_CHOICES.length) {
  answers.firstLessonOptions = DIRECTORY_TIME_CHOICES.map(slot=>({date:nextDirectoryWeekday(slot.day,new Date()),time:slot.preferredTime})).filter((option,index,all)=>all.findIndex(other=>other.date===option.date&&other.time===option.time)===index).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
  syncFirstLessonOptions();
}
const ANALYTICS_FORM_ID = TRIAL_MODE ? 'nado_trial_application' : 'nado_regular_application';
let formStartTracked = false;
let matchingViewActive = false;
let matchingInProgress = false;
let matchingClient = null;
let matchingRequestId = 0;
const historyEl = document.getElementById('history');
const qcardWrap = document.getElementById('qcardWrap');
const progressFill = document.getElementById('progressFill');
const nextBtn = document.getElementById('nextBtn');
const skipBtn = document.getElementById('skipBtn');
const backBtn = document.getElementById('backBtn');
const dragState = { isDragging: false, mode: true };
if (LOCAL_TEST_MODE) {
  document.body.classList.add('local-test-mode');
}

function renderDirectorySelectionSummary() {
  if (!DIRECTORY_SELECTION) return;
  const summary = document.getElementById('directorySelectionSummary');
  if (!summary) return;

  document.body.classList.add('has-directory-selection');
  summary.hidden = false;
  const isPremiumSelection = DIRECTORY_SELECTION.plan === '프리미엄';
  const selectionTypeLabel = TRIAL_MODE
    ? (DIRECTORY_SELECTION.trialType === 'paid' ? '1회 유료 체험' : '송도 무료 체험')
    : DIRECTORY_SELECTION.plan;
  const values = {
    directorySelectionPlan: DIRECTORY_SELECTION.plan
      ? selectionTypeLabel + (TRIAL_MODE ? ' · ' + DIRECTORY_SELECTION.plan : '') + ' · ' + durationLabel(answers.duration.index)
      : '',
    directorySelectionTime: DIRECTORY_SELECTION.timeLabel,
    directorySelectionArea: (DIRECTORY_SELECTION.region === 'Songdo' ? '송도' : '서울') + ' · ' + answers.selected_area
  };
  Object.keys(values).forEach(id => {
    const element = document.getElementById(id);
    if (element) { element.textContent = values[id]; element.parentElement.hidden = !values[id]; }
  });
  const selectionTitle = document.getElementById('directorySelectionTitle');
  if (selectionTitle) selectionTitle.textContent = DIRECTORY_SELECTION.teacherName + ' 선생님';

  const returnLink = summary.querySelector('[data-directory-return]');
  if (returnLink) returnLink.href = directoryReturnHref();

  const durationPicker = summary.querySelector('#directoryDurationPicker');
  if (durationPicker) {
    durationPicker.hidden = true;
    const help = durationPicker.querySelector('#directoryDurationHelp');
    const buttons = Array.from(durationPicker.querySelectorAll('[data-directory-duration]'));
    buttons.forEach(button => {
      const index = Number(button.dataset.directoryDuration);
      const unavailable = index === 1 && DIRECTORY_SELECTION.availableMinutes < 120;
      button.disabled = unavailable;
      button.setAttribute('aria-disabled', String(unavailable));
      button.addEventListener('click', () => {
        if (unavailable) return;
        answers.duration = { index };
        buttons.forEach(item => item.setAttribute('aria-pressed', String(Number(item.dataset.directoryDuration) === index)));
        const plan = document.getElementById('directorySelectionPlan');
        if (plan) plan.textContent = DIRECTORY_SELECTION.plan + ' · ' + durationLabel(index);
      });
    });
    if (help) {
      const hasDurationConstraint = DIRECTORY_SELECTION.availableMinutes < 120;
      help.hidden = !hasDurationConstraint;
      help.textContent = hasDurationConstraint
        ? '선택한 가능 시간대에서는 1시간 수업만 신청할 수 있어요.'
        : '';
    }
  }

  const confirmation = summary.querySelector(':scope > p');
  if (confirmation && isPremiumSelection) {
    confirmation.textContent = '이 단계에서는 수업·일정·결제가 확정되지 않아요. 목표 확인 후 선생님의 의사와 일정을 확인해 안내해드려요.';
  }

  const closeLink = document.querySelector('.topbar .icon-btn[href]');
  if (closeLink) closeLink.href = directoryReturnHref();
}

renderDirectorySelectionSummary();
document.addEventListener('mouseup', () => { dragState.isDragging = false; });
let scheduleActiveDay = '월';

function updateProgress(){
  const pct = Math.round((current / activeSteps.length) * 100);
  progressFill.style.width = pct + '%';
}
function labelFor(step, value){
  if (step.type === 'trialType') return value || '';
  if (step.type === 'multi') return Array.isArray(value) && value.length ? value.join(', ') : '';
  if (step.type === 'rank') return Array.isArray(value) && value.length ? placeLabel(answers) : '';
  if (step.type === 'firstlesson') return answers.firstLessonOptions?.length ? answers.firstLessonOptions.map(firstLessonOptionLabel).join(', ') : '';
  if (step.type === 'gridtime') return Array.isArray(value) && value.length ? value.length + '개 시간대 선택' : '';
  if (step.type === 'contact') return value && value.name ? value.name + ' · ' + (value.phone || '') : '';
  if (step.type === 'payment') return value === true ? '확인 완료' : '';
  if (step.type === 'duration') return value ? durationLabel(value.index, answers.tier) + (value.isKid ? ' · 초등학생 이하' : '') : '';  return value || '';
}

let firstLessonDateWindow = 90;
let firstLessonCalendarDate = '';
function availableFirstLessonDates() {
  const options = [];
  const today = new Date();
  for (let offset = 0; offset < firstLessonDateWindow; offset++) {
    const date = new Date(today.getFullYear(),today.getMonth(),today.getDate()+offset);
    const value = localDateInputValue(date);
    if (!DIRECTORY_SELECTION || directorySlots().some(slot=>isValidDirectoryStartDate(value,slot.day))) options.push(value);
  }
  return options;
}
function firstLessonOptionLabel(option) {
  const day = ['일','월','화','수','목','금','토'][new Date(option.date + 'T12:00:00').getDay()];
  return option.date + ' (' + day + ') ' + option.time;
}
function validFirstLessonOption(option) {
  if (!option || !parseLocalDateInput(option.date) || option.date < localDateInputValue(new Date()) || !/^\d{2}:\d{2}$/.test(option.time)) return false;
  const [hour, minute] = option.time.split(':').map(Number);
  const start = hour * 60 + minute;
  const duration = answers.duration?.index === 1 ? 120 : 60;
  if (![0,30].includes(minute) || start < 540 || start + duration > 1440) return false;
  if (DIRECTORY_SELECTION) {
    const toMinutes = value => { const parts = value.split(':').map(Number); return parts[0] * 60 + parts[1]; };
    return Boolean(slotForOption(option));
  }
  return true;
}
function syncFirstLessonOptions() {
  const options = answers.firstLessonOptions || [];
  answers.startDate = options[0]?.date || '';
  if (DIRECTORY_SELECTION && options[0]) {
    const slot=slotForOption(options[0]); if(slot) answers.schedule=[slot.timeLabel];
  }
  if (!DIRECTORY_SELECTION) answers.schedule = Array.from(new Set(options.map(option => {
    const day = ['일','월','화','수','목','금','토'][new Date(option.date + 'T12:00:00').getDay()];
    return day + ' ' + option.time;
  })));
  answers.payment = false;
}

function renderHistory(){
  const planSummary = document.getElementById('directorySelectionPlan');
  if (planSummary && DIRECTORY_SELECTION) {
    const durationStep = activeSteps.findIndex(step => step.key === 'duration');
    const durationChosen = TRIAL_MODE || (durationStep >= 0 && current > durationStep);
    planSummary.textContent = answers.tier ? answers.tier + (durationChosen && answers.duration ? ' · ' + durationLabel(answers.duration.index) : '') : '';
    planSummary.parentElement.hidden = !answers.tier;
  }
  historyEl.innerHTML = '';
  for (let i = 0; i < current; i++){
    const step = activeSteps[i];
    const val = answers[step.key];
    const text = labelFor(step, val);
    if (!text) continue;
    const item = document.createElement('div');
    item.className = 'history-item';
    const bubble = document.createElement('span');
    bubble.className = 'history-bubble';
    bubble.textContent = text;
    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.className = 'history-edit';
    editButton.dataset.idx = String(i);
    editButton.setAttribute('aria-label', text + ' 답변 수정');
    editButton.append(bubble);
    item.append(editButton);
    historyEl.appendChild(item);
  }
  const frequencyStep = activeSteps.findIndex(step => step.key === 'tier');
  const durationStep = activeSteps.findIndex(step => step.key === 'duration');
  if (!TRIAL_MODE && answers.frequency && current > (frequencyStep >= 0 ? frequencyStep : durationStep)) {
    const item = document.createElement('div');
    item.className = 'history-item';
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'history-edit';
    button.dataset.idx = String(Math.max(0, frequencyStep >= 0 ? frequencyStep : durationStep));
    button.dataset.frequency = 'true';
    button.setAttribute('aria-label', answers.frequency + ' 수업 횟수 수정');
    const bubble = document.createElement('span'); bubble.className = 'history-bubble'; bubble.textContent = answers.frequency;
    button.append(bubble); item.append(button); historyEl.append(item);
  }
  if (historyEl.children.length) {
    const details = document.createElement('details');
    details.className = 'history-details';
    const summary = document.createElement('summary');
    summary.textContent = '선택한 내용 확인·수정';
    const list = document.createElement('div'); list.className = 'history-compact-list';
    while (historyEl.firstChild) list.append(historyEl.firstChild);
    details.append(summary, list); historyEl.append(details);
  }
  historyEl.querySelectorAll('.history-edit').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.frequency && !matchingViewActive) {
        answers.frequency = answers.frequency === '주 1회' ? '주 2회' : '주 1회';
        answers.payment = false; renderStep(); return;
      }
      if (matchingViewActive) {
        matchingRequestId++;
        matchingViewActive = false;
        matchingInProgress = false;
        answers.teacher_id = null;
        answers.teacher_name = '';
        answers.matching_type = 'manual';
        delete nextBtn.dataset.submitted;
        document.getElementById('bottombar').style.display = 'block';
      }
      current = parseInt(btn.dataset.idx);
      renderStep();
      centerCurrentQuestion();
    });
  });
}

function centerCurrentQuestion(){
  window.requestAnimationFrame(() => {
    const card = qcardWrap.querySelector('.qcard');
    const question = card && card.querySelector('#questionTitle');
    if (!card) return;
    if (question) question.focus({ preventScroll: true });
    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const block = card.getBoundingClientRect().height < window.innerHeight * 0.72 ? 'center' : 'start';
    card.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block });
  });
}

function checkValid(step){
  const v = answers[step.key];
  if (!step.required) return true;
  if (step.type === 'single') {
    if (!v) return false;
    if (step.key === 'ageGroup') return !elementaryPolicyViolation();
    return true;
  }
  if (step.type === 'tier') {
    if (!v) return false;
    return !isElementaryOrYounger(answers.ageGroup) || v === '스탠다드';
  }
  if (step.type === 'trialType') {
    if (!v) return false;
    if (v === '무료 체험') {
      if (!Array.isArray(answers.place) || answers.place.length === 0) return false;
      return answers.placeType === 'IGC 인천글로벌캠퍼스' || answers.placeType === '송도 트리플스트리트';
    }
    return true;
  }
  if (step.type === 'multi') {
    if (!Array.isArray(v) || v.length === 0) return false;
    if (step.key === 'goals' && answers.tier !== '프리미엄' && v.includes('비즈니스')) return false;
    return true;
  }
  if (step.type === 'rank') {
    if (!Array.isArray(v) || v.length === 0) return false;
    if (answers.placeType === '서울 원하는 장소') return !!answers.areaCode;
    if (answers.placeType === '송도 원하는 장소') {
      return true; // Songdo is selected; the exact meeting place is optional.
    }
    if (answers.placeType === '송도 할인 장소') return !!answers.songdoPlace;
    return true;
  }
  if (step.type === 'date') {
    if (!v) return false;
    return DIRECTORY_SELECTION ? isValidDirectoryStartDate(v, DIRECTORY_SELECTION.day) : true;
  }
  if (step.type === 'firstlesson') return Array.isArray(answers.firstLessonOptions) && answers.firstLessonOptions.length > 0 && answers.firstLessonOptions.every(validFirstLessonOption);
  if (step.type === 'gridtime') return Array.isArray(v) && v.length > 0;
  if (step.type === 'duration') return v && typeof v.index === 'number';
  if (step.type === 'text') return true;
  if (step.type === 'contact') return v && v.name && v.name.trim() && v.phoneValid && v.consent === true;
  if (step.type === 'payment') return v === true;
  return false;
}

function setNextState(step){
  const valid = checkValid(step);
  nextBtn.classList.toggle('active', valid);
  nextBtn.disabled = !valid;
  nextBtn.textContent = current === activeSteps.length - 1
    ? (answers.tier === '프리미엄'
      ? '상담 요청하기'
      : '제출하기')
    : '다음';
  skipBtn.style.display = step.required ? 'none' : 'block';
}

function focusRenderedChoice(selector, datasetKey, value){
  const replacement = Array.from(qcardWrap.querySelectorAll(selector))
    .find(element => element.dataset[datasetKey] === value);
  if (replacement) replacement.focus({ preventScroll: true });
}

function renderStep(){
  if (current >= activeSteps.length){ showSuccess(); return; }
  const step = activeSteps[current];
  const topbarTitle = document.querySelector('.topbar-title');
  if (topbarTitle) {
    topbarTitle.textContent = answers.tier === '프리미엄'
      ? (TRIAL_MODE ? 'Premium 체험 상담 신청' : 'Premium 상담 신청')
      : (TRIAL_MODE ? '나도 체험수업 신청' : '나도 영어 회화 신청');
  }
  updateProgress();
  renderHistory();
  backBtn.style.visibility = current === 0 ? 'hidden' : 'visible';

  let title = step.title;
  let sub = step.sub;
  const isFreeTrial = TRIAL_MODE && answers.trialType === '무료 체험';
  const isPaidTrial = TRIAL_MODE && answers.trialType === '플랜 선택 체험';
  const isPremiumConsultation = answers.tier === '프리미엄';
    const RANK_OPTIONS = isFreeTrial
    ? ['IGC 인천글로벌캠퍼스', '송도 트리플스트리트']
    : (TRIAL_MODE
      ? ['서울 원하는 장소', '송도 원하는 장소']
      : ['서울 원하는 장소', '송도 원하는 장소', '송도 할인 장소']);
  if (step.type === 'rank') {
    if (isFreeTrial) {
      title = '무료 체험 장소 선택';
      sub = 'IGC 인천글로벌캠퍼스와 송도 트리플스트리트 중 한 곳을 선택해주세요.';
    } else if (isPaidTrial) {
      title = '수업 장소를 선택해주세요';
      sub = '서울 또는 송도에서 희망하는 장소를 선택해주세요.';
    } else {
      title = '수업 장소를 선택해주세요';
      sub = answers.tier === '이코노미'
        ? ''
        : '';
    }
  }
  if (isPaidTrial && step.type === 'tier') {
    title = '플랜 선택';
    sub = '체험할 플랜을 선택해주세요.';
  }
  if (isFreeTrial && step.type === 'duration') {
    title = '무료 체험 수업 안내';
    sub = '이코노미 플랜으로 1시간 동안 진행해드려요.';
  } else if (isPaidTrial && step.type === 'duration') {
    title = '1회 수업 시간을 선택해주세요';
    sub = '선택한 플랜의 월 수강료를 1회분으로 환산한 금액이 적용됩니다.';
  }
  if (isFreeTrial && step.type === 'payment') {
    title = '노쇼 방지 보증금 안내';
    sub = '체험 수업 자체는 무료이지만, 노쇼 방지를 위해 소정의 보증금을 받고 있어요.';
  } else if (isPaidTrial && step.type === 'payment') {
    title = '1회 수업 결제 안내';
    sub = '선택한 플랜의 1회 체험 금액을 확인해주세요.';
  }
  if (isPremiumConsultation && step.type === 'payment') {
    title = TRIAL_MODE ? 'Premium 체험 상담 안내' : 'Premium 상담 안내';
    sub = '이 단계에서는 결제가 진행되지 않습니다. 상담 절차와 예상 금액을 확인해주세요.';
  }

  if (step.type === 'payment') { title='신청 내용'; sub='선생님 연결과 일정 확정 후, <strong class="kakao-emphasis">카카오톡</strong>으로 결제를 안내드려요.'; }
  let inner = '<div class="qcard" role="group" aria-labelledby="questionTitle"><div class="qtitle" id="questionTitle" role="heading" aria-level="1" tabindex="-1">' + title + '</div>';

  if (sub) inner += '<div class="qsub">' + sub + '</div>';

if (step.type === 'trialType'){
      const selectedType = answers.trialType || '';
      inner += '<div class="opt-list" role="group" aria-labelledby="questionTitle">'
        + '<button type="button" class="tier-opt ' + (selectedType === '무료 체험' ? 'selected' : '') + '" data-trial-type="무료 체험" aria-pressed="' + (selectedType === '무료 체험') + '">'
        + '<span class="tier-opt-top"><span class="tier-opt-name">송도 지정장소 무료체험</span><span class="tier-opt-price">무료</span></span>'
        + '<span class="tier-opt-desc">이코노미 플랜으로 진행 · IGC 또는 트리플스트리트 · 초등학생 이하 이용 불가</span></button>';

      if (selectedType === '무료 체험') {
        inner += '<div class="trial-place-group">'
          + '<div class="field-label" id="trialPlaceLabel">장소 선택</div>'
          + '<div class="opt-list" role="group" aria-labelledby="trialPlaceLabel">'
          + '<button type="button" class="opt trial-place-opt ' + (answers.placeType === 'IGC 인천글로벌캠퍼스' ? 'selected' : '') + '" data-value="IGC 인천글로벌캠퍼스" aria-pressed="' + (answers.placeType === 'IGC 인천글로벌캠퍼스') + '"><span class="opt-dot" aria-hidden="true"></span><span class="opt-label">IGC 인천글로벌캠퍼스</span></button>'
          + '<button type="button" class="opt trial-place-opt ' + (answers.placeType === '송도 트리플스트리트' ? 'selected' : '') + '" data-value="송도 트리플스트리트" aria-pressed="' + (answers.placeType === '송도 트리플스트리트') + '"><span class="opt-dot" aria-hidden="true"></span><span class="opt-label">송도 트리플스트리트</span></button>'
          + '</div></div>';
      }

      inner += '<button type="button" class="tier-opt ' + (selectedType === '플랜 선택 체험' ? 'selected' : '') + '" data-trial-type="플랜 선택 체험" aria-pressed="' + (selectedType === '플랜 선택 체험') + '">'
        + '<span class="tier-opt-top"><span class="tier-opt-name">서울 및 송도 지역 희망 장소</span><span class="tier-opt-price">월 수강료 1회분</span></span>'
        + '<span class="tier-opt-desc">세부 장소는 선생님과 조율 · 초등학생 이하는 Standard만 가능</span></button>';

      inner += '</div>';
    } else if (step.type === 'tier'){
      const showFrequencyScheduleHelp = Boolean(DIRECTORY_SELECTION && answers.frequency === '주 2회');
      if (!TRIAL_MODE) {
        inner += ''
          + '<div style="display:flex;justify-content:flex-end;margin-bottom:1rem;">'
          + '<button type="button" id="freqToggle" aria-label="수업 횟수: ' + answers.frequency + '. 눌러서 변경"' + (showFrequencyScheduleHelp ? ' aria-describedby="frequencyScheduleHelp"' : '') + ' style="background:var(--navy);color:#fff;border:none;padding:.5rem 1.1rem;border-radius:2rem;font-weight:800;font-size:.85rem;cursor:pointer;display:flex;align-items:center;gap:.35rem;">'
          + answers.frequency
          + '<span style="font-size:.68rem;opacity:.75;">↻ 변경</span>'
          + '</button>'
          + '</div>';
      }
      inner += '<div class="opt-list" role="group" aria-labelledby="questionTitle">';
      let tierOptions = DIRECTORY_SELECTION && !DIRECTORY_SELECTION.plan
        ? step.options.filter(option => DIRECTORY_SELECTION.planOptions.includes(option.name))
        : step.options;
      if (isElementaryOrYounger(answers.ageGroup)) {
        tierOptions = tierOptions.filter(option => option.name === '스탠다드');
      }
      tierOptions.forEach((opt, idx) => {
        const isSel = answers.tier === opt.name;
        let card = ''
          + '<button type="button" class="tier-opt ' + (isSel?'selected':'') + '" data-value="' + opt.name + '" aria-pressed="' + isSel + '">'
          + (!TRIAL_MODE && opt.badge ? '<span class="tier-opt-badge">' + opt.badge + '</span>' : '')
          + '<span class="tier-opt-top">'
          + '<span class="tier-opt-name">' + opt.name + '</span>'
          + '<span class="tier-opt-price">₩' + calcPrice(opt.name, 0, answers.frequency).toLocaleString() + (TRIAL_MODE ? '' : '~') + '</span>'          + '</span>'
          + (TRIAL_MODE ? '' : '<span class="tier-opt-desc">' + (opt.name === '프리미엄' ? '<span class="plan-phrase">나도 최우수 선생님과 함께</span> <span class="plan-phrase">비즈니스·전문 목표에 집중하세요.</span>' : opt.desc) + '</span>')
          + (TRIAL_MODE ? '' : '<span class="tier-more ' + (isSel?'open':'') + '" id="tierMore' + idx + '">'
            + opt.more.replace(/(?:<br>\s*)?(?:·\s*)?(?:가능 영어|수업 타입):([^<]*)/, (_, types) => '<span class="plan-lesson-types"><strong>수업 타입</strong>' + types.trim().split(/\s*·\s*/).map(type => '<span class="plan-type-item">' + type + '</span>').join(' · ') + '</span>')
            + (opt.moreCaption ? '<span class="tier-more-caption">' + opt.moreCaption + '</span>' : '')
            + '</span>')
          + '</button>';
        if (opt.name === '프리미엄' && !TRIAL_MODE) {
          // Keep the selection control separate from the visible Premium explanation.
          card = card.replace(/^<button type="button"/, '<div role="group"')
            .replace(/ aria-pressed="(?:true|false)"/, '')
            .replace(/<\/button>$/, '</div>')
            .replace('<span class="tier-opt-top">', '<button type="button" class="premium-tier-select" aria-pressed="' + isSel + '"><span class="tier-opt-top">')
            .replace('<span class="tier-more ', '</button><span class="tier-more ')
            .replace('· 비즈니스 영어 및 전문적인 학습 목표 중심', '<span class="premium-assignment">· 나도 <strong>최우수 선생님 배정</strong> <button type="button" class="premium-help-toggle" aria-label="최우수 선생님 배정 안내" aria-expanded="false" aria-controls="premiumPlanHelp">?</button></span><span id="premiumPlanHelp" class="premium-plan-help" hidden>최우수 선생님은 학생 만족도, 수업 지속률, 피드백 평가 등을 종합하여 선정된 상위 선생님입니다.</span>· 비즈니스 영어 및 전문적인 학습 목표 중심');
        }
        inner += card;
      });
      inner += '</div>';
      if (!TRIAL_MODE) inner += '<p class="frequency-schedule-help"><span>* 주 3회 이상은 우측 하단 카카오톡 상담 채팅으로 문의해주세요.</span><span>* 초등학생 이하는 스탠다드 요금제만 <span class="keep-phrase">이용할 수 있습니다.</span></span></p>';
      if (showFrequencyScheduleHelp) {
        inner += '<p class="frequency-schedule-help" id="frequencyScheduleHelp" role="note"><strong>주 2회</strong>는 일주일의 수업 횟수예요. 지금은 첫 번째 수업 시간대만 신청해 주세요. 두 번째 수업 시간은 선생님 확정 시 조율합니다.</p>';
      }
    } else if (step.type === 'duration'){
      const tier = answers.tier;
      const requiresExplicitDuration = Boolean(DIRECTORY_SELECTION && !TRIAL_MODE && !answers.duration);
      let v = answers.duration || { index: requiresExplicitDuration ? -1 : 0 };
      if (v.index < -1 || v.index >= DURATIONS.length) v = { index: requiresExplicitDuration ? -1 : 0 };
      if (isFreeTrial || (DIRECTORY_SELECTION && DIRECTORY_SELECTION.availableMinutes < 120)) v = { index: 0 };
      if (v.index >= 0) answers.duration = v;
      else delete answers.duration;
      const price = v.index >= 0 ? calcPrice(tier, v.index, answers.frequency) : 0;
      if (isFreeTrial) {
        inner += ''
          + '<div style="background:var(--accent-light);border-radius:1.1rem;padding:1.4rem 1.2rem;display:flex;align-items:center;justify-content:space-between;gap:1rem;">'
          + '<div>'
          + '<div style="font-size:1.15rem;font-weight:800;color:var(--accent-deep);">1시간 무료 체험 수업</div>'
          + '</div>'
          + '<div style="font-size:1.2rem;font-weight:900;color:var(--accent-deep);white-space:nowrap;">무료</div>'
          + '</div>';
      } else {
        const twoHoursAvailable = !DIRECTORY_SELECTION || DIRECTORY_SELECTION.availableMinutes >= 120;
        inner += ''
          + '<div class="duration-options" role="group" aria-labelledby="questionTitle">'
          + '<button type="button" class="duration-opt ' + (v.index === 0 ? 'selected' : '') + '" data-index="0" aria-pressed="' + (v.index === 0) + '">'
          + '<span class="duration-opt-time">1시간</span><span class="duration-opt-desc">꾸준히 집중해서 배우기</span></button>'
          + '<button type="button" class="duration-opt ' + (v.index === 1 ? 'selected' : '') + '" data-index="1" aria-pressed="' + (v.index === 1) + '" '
          + (twoHoursAvailable ? '' : 'disabled aria-disabled="true"') + '>'
          + '<span class="duration-opt-time">2시간</span><span class="duration-opt-desc">'
          + (twoHoursAvailable ? '한 번에 깊이 있게 배우기' : '선택한 시간대에는 신청 불가')
          + '</span></button>'
          + '</div>'
          + '<div style="display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin:1.2rem 0 .8rem;">'
          + '<span style="font-size:.85rem;color:var(--gray);font-weight:600;">' + (isPaidTrial ? '월 수강료의 1회분' : answers.frequency + ' · 월 ' + (answers.frequency === '주 2회' ? '8' : '4') + '회 기준') + '</span>'
          + '<span id="durPrice" style="font-size:1.1rem;font-weight:800;">'
          + (v.index >= 0
            ? '<span style="font-size:.72rem;color:var(--gray);font-weight:600;margin-right:3px;">총액</span>₩' + price.toLocaleString()
            : '<span style="font-size:.82rem;color:var(--gray);font-weight:700;">수업 시간을 선택해주세요</span>')
          + '</span>'
          + '</div>';
      }
    } else if (step.type === 'date'){
      const today = DIRECTORY_SELECTION ? localDateInputValue(new Date()) : new Date().toISOString().split('T')[0];
      const nextSelectedWeekday = DIRECTORY_SELECTION ? nextDirectoryWeekday(DIRECTORY_SELECTION.day, new Date()) : today;
      const val = answers[step.key] || nextSelectedWeekday;
      if (DIRECTORY_SELECTION && !answers[step.key]) answers[step.key] = val;
      const describedBy = DIRECTORY_SELECTION ? ' aria-describedby="directoryDateGuidance directoryDateError"' : '';
      inner += '<input type="date" id="dateInput" min="' + escapeApplicationHtml(today) + '" value="' + escapeApplicationHtml(val) + '" aria-labelledby="questionTitle"' + describedBy + '>';
      if (DIRECTORY_SELECTION) {
        inner += '<p class="directory-date-guidance" id="directoryDateGuidance">선택한 가능 시간에 맞춰 다음 ' + DIRECTORY_SELECTION.day + '요일로 설정했어요. ' + DIRECTORY_SELECTION.day + '요일 날짜만 선택할 수 있어요.</p>'
          + '<p class="directory-date-error" id="directoryDateError" role="alert" aria-live="polite"></p>';
      }
    } else if (step.type === 'rank'){
      inner += '<div class="opt-list" role="group" aria-labelledby="questionTitle">';
      const selected = answers[step.key] || [];
      if (answers.placeType) inner += '<div class="place-selection-summary"><strong>' + escapeApplicationHtml(placeLabel(answers)) + '</strong><button type="button" id="changePlaceSelection">변경</button></div>';
      RANK_OPTIONS.forEach(opt => {
        if (answers.placeType && opt !== answers.placeType) return;
        const isSel = selected.includes(opt);
        let optionTitle = opt;
        let optionMeta = '';

        if (opt === '송도 원하는 장소') {
          optionTitle = '송도에서 희망하는 장소';
          optionMeta = '<span class="place-option-meta">대략적인 장소 입력 · 추후 조율</span>';
        } else if (opt === '서울 원하는 장소') {
          optionTitle = '서울에서 희망하는 장소';
          optionMeta = '<span class="place-option-meta">가능 지역 선택 · 세부 장소는 추후 조율</span>';
        } else if (opt === '송도 할인 장소') {
          optionTitle = '송도 지정 장소';
          optionMeta = '<span class="place-option-meta">IGC·트리플스트리트 · 월 <strong class="songdo-discount-highlight">1만원 할인</strong></span>';
        } else if (opt === '송도') {
          optionTitle = '송도에서 진행';
          optionMeta = '<span class="place-option-meta">세부 장소는 선생님과 추후 조율</span>';
        }

        if (!answers.placeType) inner += '<button type="button" class="opt rank ' + (isSel?'selected':'') + '" data-value="' + opt + '" aria-pressed="' + isSel + '">'
          + '<span class="opt-rank-badge" aria-hidden="true">' + (isSel ? '✓' : '') + '</span>'
          + '<span class="opt-label">' + optionTitle + optionMeta + '</span></button>';

        if (isSel && opt === '송도 원하는 장소') {
                    const placeholder = '예: 송도 센트럴파크역 근처 카페';
          inner += '<div class="preferred-place-wrap">'
            + '<label class="field-label" for="preferredPlaceInput">송도 내 구체적인 희망 장소 <span class="optional-label">선택</span></label>'
            + '<input type="text" id="preferredPlaceInput" placeholder="' + placeholder + '" value="' + escapeApplicationHtml(answers.preferredPlace || '') + '">'
            + '<div class="preferred-place-help">최종 장소는 선생님과 조율해요.</div>'
            + '</div>';
        } else if (isSel && opt === '서울 원하는 장소') {
          inner += '<div class="service-area-wrap">'
            + '<div class="field-label" id="serviceAreaLabel">수업 가능한 지역을 선택해주세요</div>'
            + '<div class="service-area-options" role="group" aria-labelledby="serviceAreaLabel">'
            + SEOUL_SERVICE_AREAS.filter(area => !answers.areaCode || area.code === answers.areaCode).map(area => '<button type="button" class="service-area-opt ' + (answers.areaCode === area.code ? 'selected' : '') + '" data-area-code="' + area.code + '" aria-pressed="' + (answers.areaCode === area.code) + '">' + area.label + '</button>').join('')
            + '</div>'
            + '<label class="field-label" for="preferredPlaceInput">구체적인 희망 장소 <span class="optional-label">선택</span></label>'
            + '<input type="text" id="preferredPlaceInput" placeholder="예: 강남역 3번 출구 근처 카페" value="' + escapeApplicationHtml(answers.preferredPlace || '') + '">'
            + '<div class="preferred-place-help">매칭에는 위 지역을 사용하고, 정확한 장소는 선생님과 조율해요.</div>'
            + '</div>';
        }
      });
      inner += '</div>';

      if (answers.placeType === '송도 할인 장소') {
        inner += '<div id="songdoPlaceWrap" style="margin-top:1.2rem;">'
          + '<div class="field-label" id="songdoPlaceLabel">송도에서 수업할 장소를 선택해주세요</div>'
          + '<div class="qsub" style="margin-top:-.2rem;">' + (TRIAL_MODE
            ? '무료 체험은 아래 두 곳 중에서 진행됩니다.'
            : '아래 두 송도 지정 장소에서 진행하면 월 <strong class="songdo-discount-highlight">1만원 할인</strong>됩니다.') + '</div>'
          + '<div class="opt-list" role="group" aria-labelledby="songdoPlaceLabel">'
          + '<button type="button" class="opt songdo-sub-place ' + (answers.songdoPlace === 'IGC 인천글로벌캠퍼스' ? 'selected' : '') + '" data-value="IGC 인천글로벌캠퍼스" aria-pressed="' + (answers.songdoPlace === 'IGC 인천글로벌캠퍼스') + '"><span class="opt-dot" aria-hidden="true"></span><span class="opt-label">IGC 인천글로벌캠퍼스</span></button>'
          + '<button type="button" class="opt songdo-sub-place ' + (answers.songdoPlace === '송도 트리플스트리트' ? 'selected' : '') + '" data-value="송도 트리플스트리트" aria-pressed="' + (answers.songdoPlace === '송도 트리플스트리트') + '"><span class="opt-dot" aria-hidden="true"></span><span class="opt-label">송도 트리플스트리트</span></button>'
          + '</div></div>';
      }
    } else if (step.type === 'single' || step.type === 'multi'){
      inner += '<div class="opt-list" role="group" aria-labelledby="questionTitle">';

    const selected = answers[step.key] || (step.type === 'multi' ? [] : null);
    const visibleOptions = step.key === 'goals' && answers.tier !== '프리미엄'
      ? step.options.filter(opt => opt !== '비즈니스')
      : step.options;
    visibleOptions.forEach(opt => {
      const isSel = step.type === 'multi' ? selected.includes(opt) : selected === opt;
      inner += '<button type="button" class="opt ' + (step.type==='multi'?'multi':'') + ' ' + (isSel?'selected':'') + '" data-value="' + opt + '" aria-pressed="' + isSel + '"><span class="opt-dot" aria-hidden="true"></span><span class="opt-label">' + opt + '</span></button>';
    });
    inner += '</div>';
    if (step.key === 'ageGroup' && isElementaryOrYounger(selected)) {
      const violation = elementaryPolicyViolation();
      if (violation) {
        const message = violation === 'free-trial'
          ? '무료 체험은 중학생 이상부터 이용할 수 있어요. 초등학생 이하는 Standard 1회 유료 체험을 이용해주세요.'
          : (TRIAL_MODE
            ? '초등학생 이하는 Standard 1회 유료 체험만 신청할 수 있어요.'
            : '초등학생 이하는 Standard 정규 수업만 신청할 수 있어요.');
        inner += '<div class="student-policy-notice student-policy-notice--blocked" role="alert">'
          + '<strong>선택하신 수업을 변경해주세요</strong><span>' + message + '</span>'
          + '<a href="' + elementaryAlternativeHref() + '">' + (TRIAL_MODE ? 'Standard 1회 체험 보기' : 'Standard 선생님 다시 보기') + '</a>'
          + '</div>';
      } else {
        inner += '<div class="student-policy-notice" role="note">초등학생 이하는 Standard 수업만 선택할 수 있어요.</div>';
      }
    }
    if (step.key === 'referral') {
      const showOther = selected.includes('기타');
      inner += '<div id="referralOtherWrap" style="margin-top:.8rem;' + (showOther?'':'display:none;') + '"><label class="sr-only" for="referralOtherInput">나도를 알게 된 기타 경로</label><input type="text" id="referralOtherInput" placeholder="어떻게 알게 되셨는지 적어주세요" value="' + escapeApplicationHtml(answers.referralOther || '') + '"></div>';
    }
    if (step.key === 'goals') {
      const showOther = selected.includes('기타');
      inner += '<div id="goalsOtherWrap" style="margin-top:.8rem;' + (showOther?'':'display:none;') + '"><label class="sr-only" for="goalsOtherInput">기타 영어 학습 목표</label><input type="text" id="goalsOtherInput" placeholder="원하시는 목표를 적어주세요" value="' + escapeApplicationHtml(answers.goalsOther || '') + '"></div>';
    }
  } else if (step.type === 'firstlesson') {
    inner += '<div class="sr-only" id="firstLessonDateLabel">첫 수업 날짜</div><input type="hidden" id="firstLessonDate"><div class="lesson-calendar" id="firstLessonCalendar" role="group" aria-labelledby="firstLessonDateLabel"></div>';
    inner += '<label class="field-label" id="firstLessonTimeLabel">시작 시간</label><p class="time-drag-hint">드래그로 여러 시간 선택 가능</p><input type="hidden" id="firstLessonTime"><div class="first-lesson-time-buttons" role="group" aria-labelledby="firstLessonTimeLabel">';
    for (let minutes = 540; minutes <= 1440 - (answers.duration?.index === 1 ? 120 : 60); minutes += 30) {
      const label = String(Math.floor(minutes / 60)).padStart(2, '0') + ':' + String(minutes % 60).padStart(2, '0');
      if (DIRECTORY_SELECTION) {
        const toMinutes = value => { const parts = value.split(':').map(Number); return parts[0] * 60 + parts[1]; };
        if (!directorySlots().some(slot=>minutes>=toMinutes(slot.start) && minutes+(answers.duration?.index===1?120:60)<=toMinutes(slot.end) && (!slot.preferredTime || slot.preferredTime===label))) continue;
      }
      inner += '<button type="button" class="first-lesson-time" data-first-time="' + label + '" aria-pressed="false">' + label + '</button>';
    }
    inner += '</div><div class="time-selection-actions"><button type="button" id="selectAllTimes">모두 선택</button><button type="button" id="clearAllTimes">선택 해제</button></div><p id="firstLessonError" role="status" aria-live="polite"></p>';
    inner += '<p class="followup-schedule-note">이후 수업 일정은 선생님과 자유롭게 조율해요.</p>';
  } else if (step.type === 'gridtime'){
    const days = ['월','화','수','목','금','토','일'];
    const slots = [];
    for (let h = 9; h < 24; h++){ slots.push(h + ':00'); slots.push(h + ':30'); }
    slots.push('24:00');
    const selectedArr = answers[step.key] || [];
    const activeDay = scheduleActiveDay;

    inner += '<div class="day-tabs" id="dayTabs" role="group" aria-label="요일 선택">';
    days.forEach(d => {
      const count = selectedArr.filter(v => v.indexOf(d + ' ') === 0).length;
      inner += '<button type="button" class="day-tab ' + (d === activeDay ? 'active' : '') + '" data-day="' + d + '" aria-pressed="' + (d === activeDay) + '">'
        + d
        + (count > 0 ? '<span class="day-tab-badge" aria-hidden="true">' + count + '</span>' : '')
        + '</button>';
    });
    inner += '</div>';

    inner += '<div class="time-slot-grid" id="timeSlotGrid" role="group" aria-label="' + activeDay + '요일 가능한 시간 선택">';
    slots.forEach(t => {
      const key = activeDay + ' ' + t;
      const isSel = selectedArr.indexOf(key) > -1;
      inner += '<button type="button" class="time-slot ' + (isSel ? 'selected' : '') + '" data-key="' + key + '" aria-pressed="' + isSel + '">' + t + '</button>';
    });
    inner += '</div>';
    inner += '<div class="field-label" style="margin-top:1rem;">30분 단위로 가능한 시간을 <strong class="all-times-emphasis">모두</strong> 선택해주세요.<br>요일 탭을 눌러 다른 요일도 선택할 수 있어요.</div>';
  } else if (step.type === 'text'){
    const val = answers[step.key] || '';
    inner += '<textarea id="textInput" aria-labelledby="questionTitle" placeholder="' + escapeApplicationHtml(step.placeholder || '') + '">' + escapeApplicationHtml(val) + '</textarea>';
    if (step.quickFill) inner += '<button type="button" class="quick-fill" id="quickFillBtn">"' + step.quickFill + '"</button>';
  } else if (step.type === 'contact'){
    const v = answers[step.key] || {name:'', phone:'', consent:false};
    inner += ''
      + '<label class="field-label" for="nameInput">이름</label>'
      + '<input type="text" id="nameInput" placeholder="홍길동" value="' + escapeApplicationHtml(v.name) + '">'
      + '<label class="field-label" for="phoneInput">연락처</label>'
      + '<input type="tel" id="phoneInput" placeholder="010-0000-0000" value="' + escapeApplicationHtml(v.phone) + '">'
      + '<div class="consent-box">'
      + '<label class="consent-row">'
      + '<input type="checkbox" id="consentCheck" ' + (v.consent ? 'checked' : '') + '>'
      + '<span>개인정보 수집·이용에 동의합니다 <span class="required-mark">(필수)</span></span>'
      + '</label>'
      + '<button type="button" class="consent-toggle" id="consentToggle">자세히 보기</button>'
      + '<div class="consent-detail" id="consentDetail" style="display:none;">'
      + '<strong>수집 항목</strong> 이름, 연락처, 영어 수준, 학습 목표, 희망 시간대, 진행 방식, 문의사항<br>'
      + '<strong>수집 목적</strong> 선생님 매칭 및 상담을 위한 연락<br>'
      + '<strong>보유 기간</strong> 목적 달성 시 지체 없이 파기 (관련 법령에 따른 보관 예외 있음)<br>'
      + '동의를 거부하실 수 있으며, 다만 동의하지 않으실 경우 매칭 서비스 신청이 어렵습니다.<br><br>'
      + '자세한 내용은 <a href="privacy.html" target="_blank" style="color:var(--accent);font-weight:700;">개인정보처리방침</a> 및 <a href="terms.html" target="_blank" style="color:var(--accent);font-weight:700;">이용약관</a> 전문을 확인해주세요.'
      + '</div>'
      + '</div>';
  } else if (step.type === 'payment'){
    inner += applicationSummaryMarkup();
    if (isPremiumConsultation) {
      const d = answers.duration || { index: 0 };
      const estimatedPrice = calcPrice('프리미엄', d.index, answers.frequency);
      inner += ''
        + '<div class="pay-box premium-consultation-box">'
        + '<div class="pay-row"><span>수업 방식</span><strong>Premium' + (TRIAL_MODE ? ' 1회 체험' : '') + '</strong></div>'
        + '<div class="pay-row"><span>희망 수업 시간</span><strong>' + durationLabel(d.index) + '</strong></div>'
        + '<div class="pay-row"><span>예상 수업료</span><strong>₩' + estimatedPrice.toLocaleString() + (TRIAL_MODE ? '' : '부터') + '</strong></div>'
        + '</div>'
        + '<div class="qsub premium-consultation-note"><strong>아직 수업이나 결제가 확정되는 단계가 아니에요.</strong><br>'
        + 'NADO가 목표와 준비 범위를 확인한 뒤, 담당 선생님의 수업 의사와 일정을 확인합니다. 진행 가능하면 수업 구성과 최종 일정을 안내한 후 결제를 진행해요.</div>'
        + '<ol class="premium-consultation-steps"><li>상담 요청 접수</li><li>목표·일정 검토</li><li>선생님 의사 확인</li><li>수업안·결제 안내</li></ol>'
        + '<div class="consent-box"><label class="consent-row">'
        + '<input type="checkbox" id="paymentAckCheck" ' + (answers.payment ? 'checked' : '') + '>'
        + '<span>Premium 상담 절차를 확인했습니다 <span class="required-mark">(필수)</span></span>'
        + '</label></div>';
    } else if (isFreeTrial) {
      inner += ''
        + '<div class="pay-box">'
        + '<div class="pay-row"><span>선택 플랜</span><strong>이코노미(체험)</strong></div>'
        + '<div class="pay-row"><span>수업 시간</span><strong>1시간</strong></div>'
        + '<div class="pay-row"><span>노쇼 방지 보증금</span><strong>₩' + TRIAL_DEPOSIT.toLocaleString() + '</strong></div>'
        + '</div>'
        + '<div class="qsub" style="margin-top:-.4rem;">'
        + '<strong style="color:var(--ink);">수업에 참석하시면 보증금은 전액 환불</strong>됩니다. 다만 사전 연락 없이 노쇼하실 경우 환불되지 않아요.<br>'
        + '선생님의 최종 확인 후 카카오톡으로 입금 계좌를 안내해드려요.'
        + '</div>'
        + '<div class="consent-box">'
        + '<label class="consent-row">'
        + '<input type="checkbox" id="paymentAckCheck" ' + (answers.payment ? 'checked' : '') + '>'
        + '<span>위 보증금 안내를 확인했습니다 <span class="required-mark">(필수)</span></span>'
        + '</label>'
        + '</div>';
    } else {
      const tierName = answers.tier || '-';
      const d = answers.duration || { index: 0 };
      const price = PRICE_TABLE[answers.tier] ? calcPrice(answers.tier, d.index, answers.frequency) : 0;
      inner += ''
        + '<div class="pay-box">'
        + '<div class="pay-row"><span>선택 플랜</span><strong>' + tierName + '</strong></div>'
        + '<div class="pay-row"><span>수업 횟수</span><strong>' + (isPaidTrial ? '1회' : answers.frequency) + '</strong></div>'
        + '<div class="pay-row"><span>수업 시간</span><strong>' + durationLabel(d.index, answers.tier) + '</strong></div>'
        + (!TRIAL_MODE && answers.placeType === '송도 할인 장소' ? '<div class="pay-row pay-discount"><span>송도 지정 장소 할인</span><strong>−₩' + SONGDO_LOCATION_DISCOUNT.toLocaleString() + '</strong></div>' : '')
        + '<div class="pay-row application-payment-amount"><span>결제 금액</span><strong>₩' + price.toLocaleString() + '</strong></div>'
        + '</div>'
        + '<div class="consent-box">'
        + '<label class="consent-row">'
        + '<input type="checkbox" id="paymentAckCheck" ' + (answers.payment ? 'checked' : '') + '>'
        + '<span>위 결제 금액 안내를 확인했습니다 <span class="required-mark">(필수)</span></span>'
        + '</label>'
        + '</div>';
    }
  }

  inner += '</div>';
  qcardWrap.innerHTML = inner;

if (step.type === 'trialType'){
    qcardWrap.querySelectorAll('[data-trial-type]').forEach(el => {
      el.addEventListener('click', () => {
        const nextType = el.dataset.trialType;
        if (answers.trialType !== nextType) {
          answers.trialType = nextType;
          answers.tier = nextType === '무료 체험' ? '이코노미' : '';
          answers.duration = { index: 0 };
          answers.place = [];
          answers.placeType = '';
          answers.preferredPlace = '';
          answers.areaCode = '';
          answers.songdoPlace = '';
          answers.payment = false;
          if (nextType === '무료 체험' && Array.isArray(answers.goals)) {
            answers.goals = answers.goals.filter(goal => goal !== '비즈니스');
          }
        }
        activeSteps = buildActiveSteps();
        renderStep();
        focusRenderedChoice('[data-trial-type]', 'trialType', nextType);
      });
    });

    qcardWrap.querySelectorAll('.trial-place-opt').forEach(el => {
      el.addEventListener('click', () => {
        const val = el.dataset.value;
        if (answers.placeType !== val) answers.preferredPlace = '';
        answers.place = [val];
        answers.placeType = val;
        answers.payment = false;
        renderStep();
        focusRenderedChoice('.trial-place-opt', 'value', val);
      });
    });

    const trialPreferredPlaceInput = document.getElementById('preferredPlaceInput');
    if (trialPreferredPlaceInput) {
      trialPreferredPlaceInput.addEventListener('input', () => {
        answers.preferredPlace = trialPreferredPlaceInput.value;
        answers.payment = false;
        setNextState(step);
      });
    }
} else if (step.type === 'tier'){
    const freqToggle = document.getElementById('freqToggle');
    if (freqToggle) {
      freqToggle.addEventListener('click', () => {
        answers.frequency = answers.frequency === '주 1회' ? '주 2회' : '주 1회';
        renderStep();
      });
    }
    qcardWrap.querySelectorAll('.tier-opt').forEach(el => {
      el.addEventListener('click', () => {
        const tierChanged = answers.tier !== el.dataset.value;
        if (tierChanged) answers.payment = false;
        if (!DIRECTORY_SELECTION && !TRIAL_MODE && tierChanged) {
          answers.place = [];   // 요금제가 바뀌면 장소 선택 초기화
          answers.placeType = '';
          answers.preferredPlace = '';
          answers.areaCode = '';
          answers.songdoPlace = '';
        }
        answers.tier = el.dataset.value;
        if (answers.tier !== '프리미엄' && Array.isArray(answers.goals)) {
          answers.goals = answers.goals.filter(goal => goal !== '비즈니스');
        }
        renderStep();
        const selectedPlan = document.getElementById('directorySelectionPlan');
        if (selectedPlan && DIRECTORY_SELECTION && !DIRECTORY_SELECTION.plan) {
          selectedPlan.textContent = answers.tier + ' · ' + durationLabel(answers.duration.index);
        }
        focusRenderedChoice('.tier-opt', 'value', answers.tier);
        qcardWrap.querySelector('.tier-opt.selected .premium-tier-select')?.focus({preventScroll:true});
      });
    });
    qcardWrap.querySelector('.premium-help-toggle')?.addEventListener('click', event => {
      event.stopPropagation();
      const help = document.getElementById('premiumPlanHelp');
      if (!help) return;
      help.hidden = !help.hidden;
      event.currentTarget.setAttribute('aria-expanded', String(!help.hidden));
    });
    qcardWrap.querySelector('#premiumPlanHelp')?.addEventListener('click', event => event.stopPropagation());
    qcardWrap.querySelectorAll('.tip-icon').forEach(tip => {
      tip.addEventListener('click', (e) => {
        e.stopPropagation();
        qcardWrap.querySelectorAll('.tip-icon').forEach(t => { if (t !== tip) t.classList.remove('open'); });
        tip.classList.toggle('open');
      });
    });

} else if (step.type === 'duration'){
      qcardWrap.querySelectorAll('.duration-opt').forEach(option => {
        option.addEventListener('click', () => {
          if (option.disabled) return;
          const idx = parseInt(option.dataset.index);
          answers.payment = false;
        answers.duration = { index: idx };
          qcardWrap.querySelectorAll('.duration-opt').forEach(el => {
            el.classList.remove('selected');
            el.setAttribute('aria-pressed', 'false');
          });
          option.classList.add('selected');
          option.setAttribute('aria-pressed', 'true');
          document.getElementById('durPrice').innerHTML = isFreeTrial ? '<span style="color:var(--accent-deep);">무료</span>' : '<span style="font-size:.72rem;color:var(--gray);font-weight:600;margin-right:3px;">총액</span>₩' + calcPrice(answers.tier, idx, answers.frequency).toLocaleString();
          if (DIRECTORY_SELECTION) {
            const summaryPlan = document.getElementById('directorySelectionPlan');
            if (summaryPlan) summaryPlan.textContent = answers.tier + ' · ' + durationLabel(idx);
          }
          setNextState(step);
        });
      });

  } else if (step.type === 'date'){
    const dateInput = document.getElementById('dateInput');
    if (!answers[step.key]) { answers[step.key] = dateInput.value; }
    const syncDirectoryDateValidation = () => {
      if (!DIRECTORY_SELECTION) return;
      const error = document.getElementById('directoryDateError');
      const valid = isValidDirectoryStartDate(dateInput.value, DIRECTORY_SELECTION.day);
      dateInput.setCustomValidity(valid ? '' : DIRECTORY_SELECTION.day + '요일이면서 오늘 이후인 날짜를 선택해주세요.');
      dateInput.setAttribute('aria-invalid', valid ? 'false' : 'true');
      if (error) error.textContent = valid ? '' : DIRECTORY_SELECTION.day + '요일이면서 오늘 이후인 날짜를 선택해주세요.';
    };
    dateInput.addEventListener('input', () => {
      answers[step.key] = dateInput.value;
      syncDirectoryDateValidation();
      setNextState(step);
    });
    syncDirectoryDateValidation();
  } else if (step.type === 'rank'){
  document.getElementById('changePlaceSelection')?.addEventListener('click', () => {
    answers.place = []; answers.placeType = ''; answers.areaCode = ''; answers.preferredPlace = ''; answers.songdoPlace = ''; answers.payment = false;
    renderStep();
  });
  qcardWrap.querySelectorAll('.opt.rank').forEach(el => {
    el.addEventListener('click', () => {
      const val = el.dataset.value;
      if (answers.placeType !== val) {
        answers.preferredPlace = '';
        answers.areaCode = '';
      }
      answers.place = [val];
      answers.placeType = val;
      if (val !== '송도 할인 장소') answers.songdoPlace = '';
      answers.payment = false;
      renderStep();
      document.getElementById('changePlaceSelection')?.focus({ preventScroll:true });
    });
  });

  qcardWrap.querySelectorAll('.songdo-sub-place').forEach(el => {
    if (answers.songdoPlace && el.dataset.value !== answers.songdoPlace) el.hidden = true;
    el.addEventListener('click', () => {
      answers.songdoPlace = el.dataset.value;
      answers.payment = false;
      renderStep();
      document.getElementById('changePlaceSelection')?.focus({ preventScroll:true });
    });
  });

  qcardWrap.querySelectorAll('.service-area-opt').forEach(el => {
    el.addEventListener('click', () => {
      answers.areaCode = el.dataset.areaCode;
      answers.payment = false;
      renderStep();
      document.getElementById('changePlaceSelection')?.focus({ preventScroll:true });
    });
  });

  const preferredPlaceInput = document.getElementById('preferredPlaceInput');
  if (preferredPlaceInput) {
    preferredPlaceInput.addEventListener('input', () => {
      answers.preferredPlace = preferredPlaceInput.value;
      answers.payment = false;
      setNextState(step);
    });
  }
} else if (step.type === 'single' || step.type === 'multi'){
    qcardWrap.querySelectorAll('.opt').forEach(el => {
      el.addEventListener('click', () => {
        const val = el.dataset.value;
        if (step.key === 'lessonKind' && ((val !== '정규 수업') !== TRIAL_MODE || (val === '송도 무료 체험' && answers.trialType !== '무료 체험') || (DIRECTORY_SELECTION && val === '체험 수업' && answers.trialType === '무료 체험'))) {
          location.assign(lessonKindUrl(val)); return;
        }
        if (step.type === 'single'){
          answers[step.key] = val;
          if (step.key === 'ageGroup') applyStudentAgePolicy();
          qcardWrap.querySelectorAll('.opt').forEach(o => {
            o.classList.remove('selected');
            o.setAttribute('aria-pressed', 'false');
          });
          el.classList.add('selected');
          el.setAttribute('aria-pressed', 'true');
          if (step.key === 'ageGroup') {
            activeSteps = buildActiveSteps();
            renderStep();
            focusRenderedChoice('.opt', 'value', val);
            return;
          }
        } else {
          const arr = answers[step.key] || [];
          const idx = arr.indexOf(val);
          if (idx > -1) arr.splice(idx,1); else arr.push(val);
          answers[step.key] = arr;
          el.classList.toggle('selected');
          el.setAttribute('aria-pressed', String(arr.includes(val)));
        }
   if (step.key === 'referral') {
             const wrap = document.getElementById('referralOtherWrap');
             const input = document.getElementById('referralOtherInput');
             const show = (answers.referral||[]).includes('기타');
             if (wrap) wrap.style.display = show ? 'block' : 'none';
             if (input && !input.dataset.bound) {
               input.dataset.bound = '1';
               input.addEventListener('input', () => { answers.referralOther = input.value; });
             }
           }
           if (step.key === 'goals') {
             const wrap = document.getElementById('goalsOtherWrap');
             const input = document.getElementById('goalsOtherInput');
             const show = (answers.goals||[]).includes('기타');
             if (wrap) wrap.style.display = show ? 'block' : 'none';
             if (input && !input.dataset.bound) {
               input.dataset.bound = '1';
               input.addEventListener('input', () => { answers.goalsOther = input.value; });
             }
           }
           setNextState(step);
      });
    });
} else if (step.type === 'firstlesson') {
    const dateInput = document.getElementById('firstLessonDate');
    const timeButtons = [...qcardWrap.querySelectorAll('[data-first-time]')];
    const timeGrid = qcardWrap.querySelector('.first-lesson-time-buttons');
    let selectedTimes = new Set();
    const paintTimes = (save=true) => {
      timeButtons.forEach(button => button.setAttribute('aria-pressed',String(selectedTimes.has(button.dataset.firstTime))));
      if(save) {
        const date=dateInput.value;
        const options=[...selectedTimes].map(time=>({date,time}));
        if(!date || options.some(option=>!validFirstLessonOption(option))) {
          document.getElementById('firstLessonError').textContent='먼저 가능한 날짜를 선택해주세요.';return;
        }
        answers.firstLessonOptions=[...(answers.firstLessonOptions||[]).filter(item=>item.date!==date),...options].sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
        syncFirstLessonOptions();setNextState(step);renderCalendar();
        document.getElementById('firstLessonError').textContent='선택한 시간은 자동으로 반영됩니다.';
      }
    };
    const loadDateTimes = () => {
      timeButtons.forEach(button=>{ button.disabled=Boolean(DIRECTORY_SELECTION)&&!validFirstLessonOption({date:dateInput.value,time:button.dataset.firstTime}); });
      selectedTimes = new Set((answers.firstLessonOptions || []).filter(item => item.date === dateInput.value).map(item => item.time));
      paintTimes(false);
    };
    const calendar=document.getElementById('firstLessonCalendar');
    const today=localDateInputValue(new Date());
    const canSelectDate=date=>date>=today && timeButtons.some(button=>validFirstLessonOption({date,time:button.dataset.firstTime}));
    const initialDate=firstLessonCalendarDate || answers.firstLessonOptions?.[0]?.date || today;
    dateInput.value=canSelectDate(initialDate) ? initialDate : (availableFirstLessonDates().find(canSelectDate) || '');
    let visibleMonth=(dateInput.value || today).slice(0,7);
    function renderCalendar() {
      const [year,month]=visibleMonth.split('-').map(Number);
      const first=new Date(year,month-1,1);
      const count=new Date(year,month,0).getDate();
      const chosenDates=new Set((answers.firstLessonOptions||[]).map(option=>option.date));
      calendar.innerHTML='<div class="lesson-calendar-heading"><strong aria-live="polite">'+year+'년 '+month+'월</strong><div><button type="button" data-calendar-month="-1" aria-label="이전 달" '+(visibleMonth<=today.slice(0,7)?'disabled':'')+'>‹</button><button type="button" data-calendar-month="1" aria-label="다음 달">›</button></div></div>'
        +'<div class="lesson-calendar-week" aria-hidden="true">'+['일','월','화','수','목','금','토'].map(day=>'<span>'+day+'</span>').join('')+'</div>'
        +'<div class="lesson-calendar-days">'+Array.from({length:first.getDay()},()=>'<span aria-hidden="true"></span>').join('')
        +Array.from({length:count},(_,i)=>{
          const date=visibleMonth+'-'+String(i+1).padStart(2,'0');
          return '<button type="button" data-calendar-date="'+date+'" aria-label="'+date+(chosenDates.has(date)?' 시간 선택됨':'')+'" aria-pressed="'+(date===dateInput.value)+'" '+(date===today?'aria-current="date" ':'')+(canSelectDate(date)?'':'disabled')+' class="'+(chosenDates.has(date)?'has-selected-times':'')+'">'+(i+1)+'</button>';
        }).join('')+'</div><p class="lesson-calendar-note">한국 시간 기준</p>';
    }
    calendar.addEventListener('click',event=>{
      const day=event.target.closest('[data-calendar-date]');
      if(day && !day.disabled) {
        dateInput.value=day.dataset.calendarDate;firstLessonCalendarDate=dateInput.value;
        document.getElementById('firstLessonError').textContent='';
        loadDateTimes();renderCalendar();
        calendar.querySelector('[data-calendar-date="'+dateInput.value+'"]')?.focus({preventScroll:true});
      }
      const nav=event.target.closest('[data-calendar-month]');
      if(nav && !nav.disabled) {
        const delta=Number(nav.dataset.calendarMonth);
        const [year,month]=visibleMonth.split('-').map(Number);
        visibleMonth=localDateInputValue(new Date(year,month-1+delta,1)).slice(0,7);renderCalendar();
        calendar.querySelector('[data-calendar-month="'+delta+'"]')?.focus({preventScroll:true});
      }
    });
    dateInput.addEventListener('change',loadDateTimes);
    loadDateTimes();renderCalendar();
    let drag = null;
    const paintRange = index => {
      selectedTimes = new Set(drag.before);
      for (let i=Math.min(drag.start,index); i<=Math.max(drag.start,index); i++) {
        if(timeButtons[i].disabled)continue;
        const value = timeButtons[i].dataset.firstTime;
        if (drag.add) selectedTimes.add(value); else selectedTimes.delete(value);
      }
      paintTimes();
    };
    timeGrid.addEventListener('pointerdown', event => {
      const button = event.target.closest('[data-first-time]');
      if (!button || button.disabled || (event.pointerType === 'mouse' && event.button !== 0)) return;
      event.preventDefault();
      drag = {start:timeButtons.indexOf(button),before:new Set(selectedTimes),add:!selectedTimes.has(button.dataset.firstTime)};
      timeGrid.setPointerCapture?.(event.pointerId); paintRange(drag.start);
    });
    timeGrid.addEventListener('pointermove', event => {
      if (!drag) return;
      const button = document.elementFromPoint(event.clientX,event.clientY)?.closest('[data-first-time]');
      const index = timeButtons.indexOf(button); if (index>=0) paintRange(index);
    });
    timeGrid.addEventListener('pointerup', () => {drag=null;});
    timeGrid.addEventListener('pointercancel', () => {if(drag){selectedTimes=drag.before;paintTimes();}drag=null;});
    timeButtons.forEach(button => button.addEventListener('click', event => {
      if(event.detail !== 0 || button.disabled) return;
      const value=button.dataset.firstTime;
      if(selectedTimes.has(value))selectedTimes.delete(value);else selectedTimes.add(value);
      paintTimes();
    }));
    document.getElementById('selectAllTimes').onclick=()=>{selectedTimes=new Set(timeButtons.filter(button=>!button.disabled).map(button=>button.dataset.firstTime));paintTimes();};
    document.getElementById('clearAllTimes').onclick=()=>{selectedTimes.clear();paintTimes();};

} else if (step.type === 'gridtime'){
    const selectedArr = answers[step.key] || [];

    const buildSlots = () => {
      const slots = [];
      for (let h = 9; h < 24; h++){ slots.push(h + ':00'); slots.push(h + ':30'); }
      slots.push('24:00');
      return slots;
    };

    const renderTabs = () => {
      document.querySelectorAll('.day-tab').forEach(tab => {
        const d = tab.dataset.day;
        const isActive = d === scheduleActiveDay;
        tab.classList.toggle('active', isActive);
        tab.setAttribute('aria-pressed', String(isActive));
        const count = selectedArr.filter(v => v.indexOf(d + ' ') === 0).length;
        tab.setAttribute('aria-label', d + '요일' + (count > 0 ? ', 선택한 시간 ' + count + '개' : ''));
        let badge = tab.querySelector('.day-tab-badge');
        if (count > 0) {
          if (!badge) {
            badge = document.createElement('span');
            badge.className = 'day-tab-badge';
            badge.setAttribute('aria-hidden', 'true');
            tab.appendChild(badge);
          }
          badge.textContent = count;
        } else if (badge) {
          badge.remove();
        }
      });
    };

    const applySlot = (key, shouldSelect) => {
      const idx = selectedArr.indexOf(key);
      if (shouldSelect && idx === -1) selectedArr.push(key);
      else if (!shouldSelect && idx > -1) selectedArr.splice(idx, 1);
      answers[step.key] = selectedArr;
      qcardWrap.querySelectorAll('.time-slot').forEach(slot => {
        if (slot.dataset.key !== key) return;
        slot.classList.toggle('selected', shouldSelect);
        slot.setAttribute('aria-pressed', String(shouldSelect));
      });
      renderTabs();
      setNextState(step);
    };

    const bindSlotEvents = () => {
      const grid = document.getElementById('timeSlotGrid');
      if (grid.dataset.dragBound) return;
      grid.dataset.dragBound = 'true';
      let pointerId = null;
      let lastIndex = -1;
      let mode = true;
      const cells = () => Array.from(grid.querySelectorAll('.time-slot'));
      const paint = cell => {
        if (!cell || !grid.contains(cell)) return;
        const list = cells();
        const index = list.indexOf(cell);
        if (index < 0) return;
        const from = lastIndex < 0 ? index : Math.min(lastIndex, index);
        const to = lastIndex < 0 ? index : Math.max(lastIndex, index);
        for (let i = from; i <= to; i++) applySlot(list[i].dataset.key, mode);
        lastIndex = index;
      };
      grid.addEventListener('pointerdown', event => {
        const cell = event.target.closest('.time-slot');
        if (!cell || event.button !== 0 || event.isPrimary === false) return;
        event.preventDefault();
        pointerId = event.pointerId;
        lastIndex = -1;
        mode = !selectedArr.includes(cell.dataset.key);
        paint(cell);
        cell.focus({ preventScroll: true });
        grid.setPointerCapture?.(event.pointerId);
      });
      grid.addEventListener('pointermove', event => {
        if (pointerId !== event.pointerId) return;
        event.preventDefault();
        paint(document.elementFromPoint(event.clientX, event.clientY)?.closest('.time-slot'));
      });
      const finish = event => {
        if (pointerId !== event.pointerId) return;
        pointerId = null;
        lastIndex = -1;
        if (grid.hasPointerCapture?.(event.pointerId)) grid.releasePointerCapture(event.pointerId);
      };
      grid.addEventListener('pointerup', finish);
      grid.addEventListener('pointercancel', finish);
      grid.addEventListener('lostpointercapture', finish);
      grid.addEventListener('click', event => {
        if (event.detail !== 0) return;
        const cell = event.target.closest('.time-slot');
        if (cell) applySlot(cell.dataset.key, !selectedArr.includes(cell.dataset.key));
      });
    };

    const rebuildSlotGrid = () => {
      const grid = document.getElementById('timeSlotGrid');
      grid.setAttribute('aria-label', scheduleActiveDay + '요일 가능한 시간 선택');
      grid.innerHTML = buildSlots().map(t => {
        const key = scheduleActiveDay + ' ' + t;
        const isSel = selectedArr.indexOf(key) > -1;
        return '<button type="button" class="time-slot ' + (isSel ? 'selected' : '') + '" data-key="' + key + '" aria-pressed="' + isSel + '">' + t + '</button>';
      }).join('');
      bindSlotEvents();
    };

    document.querySelectorAll('.day-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        scheduleActiveDay = tab.dataset.day;
        renderTabs();
        rebuildSlotGrid();
      });
    });

    bindSlotEvents();
  } else if (step.type === 'text'){
    const ta = document.getElementById('textInput');
    ta.addEventListener('input', () => { answers[step.key] = ta.value; });
    const qf = document.getElementById('quickFillBtn');
    if (qf) qf.addEventListener('click', () => { ta.value = step.quickFill; answers[step.key] = step.quickFill; });
  } else if (step.type === 'contact'){
    const nameInput = document.getElementById('nameInput');
    const phoneInput = document.getElementById('phoneInput');
    const consentCheck = document.getElementById('consentCheck');
    const consentToggle = document.getElementById('consentToggle');
    const consentDetail = document.getElementById('consentDetail');
    const sync = () => {
    const phoneValid = /^01[0-9]-?\d{3,4}-?\d{4}$/.test(phoneInput.value.replace(/\s/g, ''));
    phoneInput.style.borderColor = (phoneInput.value && !phoneValid) ? '#E85C5C' : '';
    answers[step.key] = {
      name: nameInput.value,
      phone: phoneInput.value,
      phoneValid,
      consent: consentCheck.checked
    };
    setNextState(step);
  };
    nameInput.addEventListener('input', sync);
    phoneInput.addEventListener('input', sync);
    consentCheck.addEventListener('change', sync);
    consentToggle.addEventListener('click', () => {
      consentDetail.style.display = consentDetail.style.display === 'none' ? 'block' : 'none';
    });
  } else if (step.type === 'payment'){
    const ack = document.getElementById('paymentAckCheck');
    ack.addEventListener('change', () => {
      answers.payment = ack.checked;
      setNextState(step);
    });
  }

  setNextState(step);
}

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function isSongdoMatchingLocation(value) {
  const key=String(value || '').toLowerCase().replace(/\s+/g,'');
  return ['igc','igc인천글로벌캠퍼스','인천글로벌캠퍼스','triplestreet','트리플스트리트','송도트리플스트리트','songdo','송도','송도내협의','송도내협의가능'].includes(key);
}

function matchingLocation() {
  const placeType = answers.placeType || '';
  const isSeoul = placeType.indexOf('서울') > -1;
  const region = isSeoul ? 'Seoul' : 'Incheon';
  const area = isSeoul ? (answers.areaCode || null) : null;
  return { region, area };
}

function normalizeTeacher(row, overlapSlots) {
  const source = Object.assign({}, row && row.teacher ? row.teacher : {}, row || {});
  const teacherId = source.teacher_id || source.id || source.teacher_uuid || source.teacher_user_id || source.profile_id || '';
  const teacherName = source.teacher_name || source.display_name || source.full_name || source.name || source.english_name || '선생님';
  const tags = source.tags || source.specialties || source.strengths || source.keywords || [];
  return {
    id: String(teacherId),
    name: String(teacherName),
    photoPath: source.profile_photo_path || source.profile_photo_url || source.photo_url || source.avatar_url || '',
    videoUrl: source.introduction_video_url || source.intro_video_url || source.self_intro_video_url || source.video_url || source.profile_video_url || '',
    bio: source.bio || source.short_bio || source.introduction || source.self_introduction || source.profile_intro || source.description || '',
    university: source.university || source.school || source.university_name || '',
    major: source.major || source.major_name || '',
    experience: source.experience || source.teaching_experience || source.career || '',
    languages: source.languages || source.language || '',
    tags: Array.isArray(tags) ? tags : String(tags || '').split(',').map(v => v.trim()).filter(Boolean),
    overlaps: Array.from(new Set(overlapSlots || [])),
    raw: source
  };
}

function publicStorageUrl(path) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  const config = window.NADO_MEMBER_CONFIG || {};
  const base = String(config.SUPABASE_URL || '').replace(/\/$/, '');
  if (!base) return '';
  const cleanPath = String(path).replace(/^\/+/, '');
  if (cleanPath.indexOf('storage/v1/object/public/') === 0) return base + '/' + cleanPath;
  const bucket = config.PROFILE_PHOTO_BUCKET || 'teacher-profile-photos';
  const objectPath = cleanPath.indexOf(bucket + '/') === 0 ? cleanPath : bucket + '/' + cleanPath;
  return base + '/storage/v1/object/public/' + objectPath.split('/').map(encodeURIComponent).join('/');
}

function localTeacherPhoto(name) {
  const key = String(name || '').trim().split(/\s+/)[0].toLowerCase();
  return Object.prototype.hasOwnProperty.call(LOCAL_TEACHER_PHOTOS, key) ? LOCAL_TEACHER_PHOTOS[key] : '';
}

function teacherPhotoMarkup(teacher, compact) {
  const photoUrl = publicStorageUrl(teacher.photoPath);
  const fallbackUrl = localTeacherPhoto(teacher.name);
  const initialUrl = photoUrl || fallbackUrl;
  const initial = escapeHtml((teacher.name || 'T').trim().charAt(0).toUpperCase());
  return '<div class="teacher-match-photo ' + (compact ? 'compact' : '') + '">'
    + (initialUrl ? '<img src="' + escapeHtml(initialUrl) + '" data-fallback-src="' + escapeHtml(photoUrl ? fallbackUrl : '') + '" alt="' + escapeHtml(teacher.name) + ' 선생님 프로필 사진">' : '')
    + '<span class="teacher-photo-fallback"' + (initialUrl ? ' hidden' : '') + '>' + initial + '</span>'
    + '</div>';
}

function bindTeacherPhotoFallbacks(scope) {
  scope.querySelectorAll('.teacher-match-photo img').forEach(img => {
    img.addEventListener('error', () => {
      const fallbackUrl = img.dataset.fallbackSrc;
      if (fallbackUrl && img.src.indexOf(fallbackUrl) === -1) {
        img.dataset.fallbackSrc = '';
        img.src = fallbackUrl;
        return;
      }
      img.hidden = true;
      const fallback = img.parentElement.querySelector('.teacher-photo-fallback');
      if (fallback) fallback.hidden = false;
    });
  });
}

async function runWithConcurrency(items, limit, worker) {
  const output = new Array(items.length);
  let cursor = 0;
  async function runner() {
    while (cursor < items.length) {
      const index = cursor++;
      output[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, runner));
  return output;
}

async function fetchAvailableTeachers() {
  const config = window.NADO_MEMBER_CONFIG || {};
  if (!window.supabase || !config.SUPABASE_URL || !config.SUPABASE_ANON_KEY) throw new Error('선생님 조회 연결을 준비하지 못했어요. 잠시 후 다시 시도해주세요.');
  if (!matchingClient) matchingClient = window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);

  const plan = PLAN_GROUP[answers.tier];
  const location = matchingLocation();
  const selectedSlots = Array.from(new Set(answers.schedule || []));
  if (!plan || selectedSlots.length === 0) return [];

  const failures = [];
  const batches = await runWithConcurrency(selectedSlots, 6, async slot => {
    const separator = slot.indexOf(' ');
    const day = separator > -1 ? slot.slice(0, separator) : '';
    const time = separator > -1 ? slot.slice(separator + 1) : '';
    try {
      const response = await matchingClient.rpc('get_available_teachers', {
        p_plan: plan,
        p_region: location.region,
        p_day: DAY_OF_WEEK[day],
        p_time: time,
        p_area: location.area
      });
      if (response.error) throw response.error;
      let rows = Array.isArray(response.data)
        ? response.data
        : (response.data && Array.isArray(response.data.teachers) ? response.data.teachers : []);
      const chosenSongdoPlace = answers.songdoPlace || answers.placeType || '';
      const isFixedSongdoPlace = answers.placeType === '송도 할인 장소'
        || answers.placeType === 'IGC 인천글로벌캠퍼스'
        || answers.placeType === '송도 트리플스트리트';
      if (location.region === 'Incheon') {
        // Legacy RPC region code is retained, but only explicit Songdo locations qualify.
        rows = rows.filter(row => isSongdoMatchingLocation(row.location || row.available_location || ''));
      }
      if (isFixedSongdoPlace) {
        const requiredLocation = chosenSongdoPlace.indexOf('IGC') > -1 ? 'IGC' : '트리플스트리트';
        rows = rows.filter(row => String(row.location || row.available_location || '').indexOf(requiredLocation) > -1);
      }
      return rows.map(row => ({ row, slot }));
    } catch (error) {
      failures.push(error);
      return [];
    }
  });

  if (failures.length) throw new Error('가능한 선생님을 모두 확인하지 못했어요. 다시 조회해주세요.');
  const merged = new Map();
  batches.flat().forEach(item => {
    const provisional = normalizeTeacher(item.row, [item.slot]);
    const key = provisional.id || provisional.name.toLowerCase();
    if (!key) return;
    if (!merged.has(key)) {
      merged.set(key, provisional);
      return;
    }
    const previous = merged.get(key);
    previous.overlaps = Array.from(new Set(previous.overlaps.concat(item.slot)));
    previous.raw = Object.assign({}, previous.raw, provisional.raw);
  });

  return Array.from(merged.values());
}

function renderMatchingLoading() {
  matchingViewActive = true;
  progressFill.style.width = '100%';
  backBtn.style.visibility = 'visible';
  document.getElementById('bottombar').style.display = 'none';
  qcardWrap.innerHTML = '<div class="qcard matching-loading-card" role="status" aria-live="polite">'
    + '<div class="matching-spinner" aria-hidden="true"></div>'
    + '<div class="qtitle">매칭 중입니다...</div>'
    + '<div class="qsub">선택하신 장소와 희망 시간을 확인하고 있어요.</div>'
    + '</div>';
}

function teacherSchoolClass(school) {
  const value = String(school || '').toLowerCase();
  if (value.includes('mason')) return ' teacher-profile-school--mason';
  if (value.includes('utah')) return ' teacher-profile-school--utah';
  return '';
}

function openTeacherDetail(teacher, cardElements) {
  cardElements.forEach(card => card.classList.toggle('selected', Number(card.dataset.index) === teacher._index));
  document.querySelectorAll('.teacher-match-detail').forEach(panel => { panel.hidden = true; });
  const detail = document.getElementById('teacherMatchDetail-' + teacher._index);
  const extra = [teacher.languages, teacher.experience].filter(Boolean).join(' · ');
  detail.innerHTML = '<div class="teacher-detail-head">'
    + teacherPhotoMarkup(teacher, false)
    + '<div><div class="teacher-detail-name">' + escapeHtml(teacher.name) + ' 선생님</div>'
    + (teacher.university ? '<div class="teacher-profile-school' + teacherSchoolClass(teacher.university) + '">' + escapeHtml(teacher.university) + '</div>' : '')
    + (teacher.major ? '<div class="teacher-profile-major">' + escapeHtml(teacher.major) + '</div>' : '')
    + (extra ? '<div class="teacher-detail-meta">' + escapeHtml(extra) + '</div>' : '')
    + '</div></div>'
    + (teacher.bio ? '<p class="teacher-detail-bio">' + escapeHtml(teacher.bio) + '</p>' : '')
    + (teacher.tags.length ? '<div class="teacher-match-tags">' + teacher.tags.map(tag => '<span>' + escapeHtml(tag) + '</span>').join('') + '</div>' : '')
    + '<div class="teacher-overlap-box"><strong>함께 가능한 시간</strong><div>'
    + teacher.overlaps.map(slot => '<span>' + escapeHtml(slot) + '</span>').join('')
    + '</div></div>'
    + '<button type="button" class="teacher-select-btn">' + escapeHtml(teacher.name) + ' 선생님 선택하기</button>';
  detail.hidden = false;
  bindTeacherPhotoFallbacks(detail);
  const selectButton = detail.querySelector('.teacher-select-btn');
  if (selectButton) selectButton.addEventListener('click', () => selectTeacher(teacher));
  detail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function renderTeacherMatches(teachers) {
  matchingInProgress = false;
  matchingViewActive = true;
  delete nextBtn.dataset.submitted;
  const cards = teachers.map((teacher, index) => {
    teacher._index = index;
    return '<button type="button" class="teacher-match-card" data-index="' + index + '">'
      + teacherPhotoMarkup(teacher, true)
      + '<span class="teacher-match-copy"><strong>' + escapeHtml(teacher.name) + ' 선생님</strong>'
      + (teacher.university ? '<small class="teacher-profile-school' + teacherSchoolClass(teacher.university) + '">' + escapeHtml(teacher.university) + '</small>' : '')
      + (teacher.major ? '<small class="teacher-profile-major">' + escapeHtml(teacher.major) + '</small>' : '')
      + '<small class="teacher-overlap-summary">선택 시간과 ' + teacher.overlaps.length + '개 일치</small></span>'
      + '<span class="teacher-card-arrow" aria-hidden="true">›</span></button>'
      + '<div class="teacher-match-detail" id="teacherMatchDetail-' + index + '" hidden></div>';
  }).join('');
  qcardWrap.innerHTML = '<div class="qcard teacher-matches-card">'
    + '<div class="qtitle">가능한 선생님을 확인해보세요</div>'
    + '<div class="qsub">카드를 누르면 프로필과 함께 가능한 시간을 볼 수 있어요.</div>'
    + '<div class="teacher-match-list">' + cards + '</div>'
    + '</div>';
  const cardElements = Array.from(qcardWrap.querySelectorAll('.teacher-match-card'));
  cardElements.forEach(card => card.addEventListener('click', () => openTeacherDetail(teachers[Number(card.dataset.index)], cardElements)));
  bindTeacherPhotoFallbacks(qcardWrap);
}

async function selectTeacher(teacher) {
  if (submissionInProgress) return;
  answers.teacher_id = teacher.id || null;
  answers.teacher_name = teacher.name;
  answers.matching_type = 'student_selected';
  qcardWrap.innerHTML = '<div class="qcard matching-loading-card" role="status" aria-live="polite">'
    + '<div class="matching-spinner" aria-hidden="true"></div>'
    + '<div class="qtitle">신청 내용을 저장하고 있어요...</div></div>';
  await showSuccess();
}

async function startTeacherMatching() {
  if (matchingInProgress || alreadySubmitted) return;
  if (answers.tier === '프리미엄') {
    answers.matching_type = 'premium_inquiry';
    await showSuccess();
    return;
  }
  const requestId = ++matchingRequestId;
  matchingInProgress = true;
  answers.teacher_id = null;
  answers.teacher_name = '';
  answers.matching_type = 'manual';
  renderMatchingLoading();
  const minimumDelay = new Promise(resolve => setTimeout(resolve, 900));
  let teachers = [];
  try {
    teachers = await fetchAvailableTeachers();
  } catch (error) {
    if (requestId !== matchingRequestId || !matchingViewActive) return;
    matchingInProgress = false;
    qcardWrap.innerHTML = '<div class="qcard" role="alert"><h2 class="qtitle">선생님 조회를 다시 시도해주세요</h2><p class="qsub">' + escapeHtml(error.message || '일시적으로 조회에 실패했어요.') + '</p><button type="button" class="btn-next active" id="retryTeacherMatching">다시 조회하기</button></div>';
    document.getElementById('retryTeacherMatching').addEventListener('click', startTeacherMatching);
    return;
  }
  await minimumDelay;
  if (requestId !== matchingRequestId || !matchingViewActive) return;
  if (!teachers.length) {
    matchingInProgress = false;
    matchingViewActive = false;
    await showSuccess();
    return;
  }
  renderTeacherMatches(teachers);
}

nextBtn.addEventListener('click', () => {
  const step = activeSteps[current];
  if (!checkValid(step)) return;
  if (step.type === 'trialType' && answers.trialType === '플랜 선택 체험' && !DIRECTORY_SELECTION && window.NADOApplicationChooser) {
    window.NADOApplicationChooser.open({kind:'trial', trialType:'paid', trigger:nextBtn, onDirect:() => {
      current++;
      renderStep();
      centerCurrentQuestion();
    }});
    return;
  }
  if (!formStartTracked) {
    formStartTracked = true;
    trackFormEvent('form_start');
  }
  if (current === activeSteps.length - 1) {
    if (nextBtn.dataset.submitted) return;
    nextBtn.dataset.submitted = '1';
    if (answers.tier === '프리미엄') {
      answers.matching_type = 'premium_inquiry';
      showSuccess();
    } else if (DIRECTORY_SELECTION) {
      showSuccess();
    } else {
      startTeacherMatching();
    }
    return;
  }
  current++;
  renderStep();
  centerCurrentQuestion();
});

skipBtn.addEventListener('click', () => {
  current++;
  renderStep();
  centerCurrentQuestion();
});

backBtn.addEventListener('click', () => {
  if (matchingViewActive) {
    matchingRequestId++;
    matchingViewActive = false;
    matchingInProgress = false;
    answers.teacher_id = null;
    answers.teacher_name = '';
    answers.matching_type = 'manual';
    delete nextBtn.dataset.submitted;
    document.getElementById('bottombar').style.display = 'block';
    renderStep();
    centerCurrentQuestion();
    return;
  }
  if (current > 0){ current--; renderStep(); centerCurrentQuestion(); }
});

async function submitToJotform(a) {
  if (LOCAL_TEST_MODE) {
    await new Promise(resolve => setTimeout(resolve, 350));
    return { success: true, test: true, review: SITES_REVIEW_MODE, submittedAt: Date.now() };
  }
  const params = new URLSearchParams();
  params.append('submission[3]', a.contact.name);                     // 이름
  params.append('submission[4][full]', a.contact.phone);              // 연락처
  params.append('submission[5]', a.ageGroup);                         // 나이대
  params.append('submission[7]', a.level);                            // 영어 수준
  (a.goals || []).forEach(g => params.append('submission[8][]', g));  // 학습 목표 (다중)
  (a.place || []).forEach(p => params.append('submission[29][]', p)); // 진행방식
  params.append('submission[30]', TRIAL_MODE ? ((a.tier || '이코노미') + '(' + (a.trialType || '체험수업') + ')') : (a.tier || ''));  // 선택 플랜
  params.append('submission[31]', a.tier === '프리미엄'
    ? (a.payment ? 'Premium 상담 절차 확인' : '')
    : (TRIAL_MODE && a.trialType === '무료 체험' ? (a.payment ? '보증금 안내 확인' : '') : (a.payment ? '완료' : '')));  // 결제/상담 확인
  params.append(
    'submission[32]',
    (a.schedule || []).join(', ')
  );                                                          // 희망시간대
  params.append(
      'submission[33]',
      placeLabel(a).replace(/ · /g, ' / ')
    );                                                                  // 진행방식 순위
    params.append('submission[34]', a.startDate || '');                 // 희망 시작일
    (a.referral || []).forEach(r => params.append('submission[35][]', r)); // 유입경로 (다중)
    params.append('submission[36]', a.gender || '');                    // 성별
    params.append('submission[38]', a.referralOther || '');             // 유입경로 기타 직접입력
    params.append('submission[39]', a.goalsOther || '');                // 학습목표 기타 직접입력
    params.append('submission[40]', a.frequency || '');                 // 수업 빈도
    params.append('submission[41]', a.duration ? durationLabel(a.duration.index, a.tier) : ''); // 수업 시간
    params.append('submission[43]', a.tier === '프리미엄'
      ? (TRIAL_MODE ? 'Premium 체험 상담 요청' : 'Premium 상담 요청')
      : (TRIAL_MODE ? ((a.trialType || '체험수업') + ' 신청') : '정규 신청')); // 신청 구분
    const matchingMeta = [
      '[매칭 정보]',
      'matching_type=' + (a.matching_type || 'manual'),
      'teacher_id=' + (a.teacher_id || ''),
      'teacher_name=' + (a.teacher_name || ''),
      'selection_source=' + (a.selection_source || ''),
      'selection_source_kind=' + (a.selection_source_kind || ''),
      'selected_region=' + (a.selected_region || ''),
      'selected_area=' + (a.selected_area || '')
    ].join('\n');
    params.append('submission[28]', [a.notes || '', a.firstLessonOptions?.length ? '[첫 수업 희망 후보]\n' + a.firstLessonOptions.map(firstLessonOptionLabel).join('\n') : '', matchingMeta].filter(Boolean).join('\n\n')); // 문의사항 + 안전한 내부 매칭 정보
    params.append('submission[62]', a.matching_type || 'manual');     // 매칭 방식
    params.append('submission[63]', a.teacher_name || '');           // 선택 선생님 이름
    params.append('submission[64]', a.teacher_id || '');             // 선택 선생님 UUID
    const placeDetail = a.placeType === '서울 원하는 장소'
      ? [serviceAreaLabel(a.areaCode), a.preferredPlace || ''].filter(Boolean).join(' / ')
      : (a.preferredPlace || a.songdoPlace || '');
    params.append('submission[44]', placeDetail); // 매칭 지역 + 희망/지정 장소 세부정보
  if (navigator.onLine === false) throw new Error('인터넷 연결이 끊겨 있어요. 연결을 확인한 후 다시 제출해주세요. 입력 내용은 유지됩니다.');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  let response;
  try {
    response = await fetch('https://nado-intro-web.vercel.app/api/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body: params,
    signal: controller.signal
    });
  } catch (error) {
    const allowedHost = ['hellonado.com', 'www.hellonado.com', 'nado-intro-web.vercel.app'].includes(location.hostname);
    throw new Error(!allowedHost
      ? '현재 미리보기 주소에서는 실제 신청을 전송할 수 없어요. hellonado.com에서 신청해주세요.'
      : error.name === 'AbortError'
        ? '서버 응답이 지연되어 접수 여부를 확인하지 못했어요. 중복 신청을 피하려면 카카오톡으로 접수 여부를 먼저 확인해주세요. 입력 내용은 유지됩니다.'
        : '신청 서버에 연결하지 못해 접수 여부를 확인하지 못했어요. 인터넷 연결을 확인하고, 계속되면 카카오톡으로 접수 여부를 문의해주세요. 입력 내용은 유지됩니다.');
  } finally { clearTimeout(timeout); }
  const result = await response.json().catch(() => null);
  if (!response.ok || !result || result.success !== true) {
    throw new Error((result && (result.error || result.message)) || '신청 저장에 실패했습니다.');
  }
  return result;
}

let alreadySubmitted = false;
let submissionInProgress = false;

function trackFormEvent(eventName, extraParams) {
  if (LOCAL_TEST_MODE) return;
  if (typeof window.gtag !== 'function') return;
  window.gtag('event', eventName, Object.assign({
    form_id: ANALYTICS_FORM_ID,
    form_name: TRIAL_MODE ? '체험수업 신청' : '정규수업 신청',
    form_type: TRIAL_MODE ? 'trial' : 'regular'
  }, extraParams || {}));
}

function trackGoogleAdsApplication() {
  if (LOCAL_TEST_MODE) return;
  if (typeof window.gtag !== 'function') return;
  window.gtag('event', 'conversion', {
    send_to: 'AW-18355423972/rMOMCLz4vO0cEOSVxrBE',
    value: 1,
    currency: 'KRW'
  });
}

function showSubmitError(message) {
  matchingViewActive = false;
  matchingInProgress = false;
  current = Math.max(0, activeSteps.length - 1);
  document.getElementById('formMain').style.display = 'block';
  document.getElementById('bottombar').style.display = 'block';
  document.querySelector('.topbar').style.display = 'block';
  renderStep();
  delete nextBtn.dataset.submitted;
  nextBtn.disabled = false;
  nextBtn.textContent = '다시 제출하기';
  const card = qcardWrap.querySelector('.qcard');
  if (!card || document.getElementById('submitError')) return;
  const error = document.createElement('div');
  error.id = 'submitError';
  error.setAttribute('role', 'alert');
  error.style.cssText = 'margin-top:1rem;padding:.85rem 1rem;border-radius:.75rem;background:#fff0f0;color:#b3261e;font-weight:700;line-height:1.45;';
  error.textContent = String(message || '신청이 저장되지 않았어요. 인터넷 연결을 확인한 뒤 다시 제출해주세요.').slice(0, 240);
  if (DIRECTORY_SELECTION) {
    const backLink = document.createElement('a');
    backLink.href = directoryReturnHref();
    backLink.className = 'directory-error-back-link';
    backLink.textContent = '선생님 목록에서 다시 선택하기';
    error.appendChild(backLink);
  }
  card.appendChild(error);
}

// Ranges represent selected start times, not lesson end times.
function compactFirstLessonSummary(options) {
  const dates = new Map();
  options.forEach(({date,time}) => {
    if (!dates.has(date)) dates.set(date,new Set());
    dates.get(date).add(time);
  });
  return [...dates.keys()].sort().map(date => {
    const times=[...dates.get(date)].sort();
    const ranges=[];
    const minutes=time=>Number(time.slice(0,2))*60+Number(time.slice(3));
    let start=times[0], end=start;
    times.slice(1).forEach(time=>{
      if (minutes(time)-minutes(end)===30) end=time;
      else { ranges.push(start===end?start:start+'–'+end); start=end=time; }
    });
    ranges.push(start===end?start:start+'–'+end);
    const day=['일','월','화','수','목','금','토'][new Date(date+'T12:00:00').getDay()];
    return date+' ('+day+') '+ranges.join(', ');
  }).join('\n');
}

function applicationSummaryMarkup() {
  const labels={lessonKind:'수업 종류',ageGroup:'나이대',tier:'수업 플랜',duration:'수업 시간',place:'수업 장소',gender:'성별',level:'영어 수준',goals:'학습 목표',schedule:'희망 시작 시간',referral:'알게 된 경로',notes:'문의사항',contact:'신청자'};
  const rows=activeSteps.filter(step=>!['payment','tier','duration','gender','referral'].includes(step.key)).map(step=>{
    const value=step.type === 'firstlesson' ? compactFirstLessonSummary(answers.firstLessonOptions || []) : labelFor(step,answers[step.key]);
    return value ? '<div class="pay-row"><span>'+escapeApplicationHtml(labels[step.key]||'선택 내용')+'</span><strong>'+escapeApplicationHtml(value)+'</strong></div>' : '';
  }).join('');
  return '<div class="pay-box application-summary-box">'+rows+'</div>';
}
async function showSuccess(){
  if (elementaryPolicyViolation()) {
    matchingViewActive = false;
    matchingInProgress = false;
    const ageStepIndex = activeSteps.findIndex(step => step.key === 'ageGroup');
    current = ageStepIndex > -1 ? ageStepIndex : 0;
    document.getElementById('formMain').style.display = 'block';
    document.getElementById('bottombar').style.display = 'block';
    document.querySelector('.topbar').style.display = 'block';
    renderStep();
    return;
  }
  if (alreadySubmitted || submissionInProgress) return;
  submissionInProgress = true;
  nextBtn.disabled = true;
  nextBtn.textContent = '제출 중…';

  const a = answers;
  const isPremiumInquiry = a.matching_type === 'premium_inquiry' || a.tier === '프리미엄';
  const teacherWasSelected = a.matching_type === 'student_selected'
    || a.matching_type === 'directory_selected'
    || (isPremiumInquiry && Boolean(a.teacher_name));
  let submissionResult;
  try {
    submissionResult = await submitToJotform(a);
  } catch (err) {
    submissionInProgress = false;
    console.error('Jotform 제출 실패:', err);
    trackFormEvent('form_submit_error');
    showSubmitError(err && err.message);
    return;
  }

  alreadySubmitted = true;
  const duplicatePrevented = Boolean(submissionResult && submissionResult.duplicatePrevented);
  if (!duplicatePrevented) {
    trackFormEvent('form_submit');
    trackFormEvent('generate_lead', { currency: 'KRW', value: 1 });
    trackGoogleAdsApplication();
  }
  document.getElementById('formMain').style.display = 'none';
  document.getElementById('bottombar').style.display = 'none';
  document.querySelector('.topbar').style.display = 'none';
  const wrap = document.getElementById('successWrap');
  wrap.style.display = 'block';
  wrap.classList.add('is-visible');
  document.body.classList.add('application-complete');

  if (isPremiumInquiry) {
    document.querySelector('.success-title').textContent = TRIAL_MODE
      ? 'Premium 체험 상담 요청이 접수됐어요'
      : 'Premium 상담 요청이 접수됐어요';
    document.querySelector('.success-text').innerHTML = '<strong>아직 수업이나 결제가 확정된 상태는 아닙니다.</strong>목표와 희망 일정을 검토한 후 담당 선생님의 확인 결과를 카카오톡으로 안내해드려요.';
    const process = document.querySelector('.next-process-steps');
    if (process) {
      process.classList.add('is-premium');
      process.innerHTML = '<div class="next-process-step is-complete"><span class="process-number">✓</span>상담 요청 접수</div>'
        + '<div class="next-process-step"><span class="process-number">2</span>목표·일정<br>검토</div>'
        + '<div class="next-process-step"><span class="process-number">3</span>선생님 의사<br>확인</div>'
        + '<div class="next-process-step"><span class="process-number">4</span>수업안·결제<br>안내</div>';
    }
  } else if (teacherWasSelected) {
    document.querySelector('.success-title').textContent = TRIAL_MODE
      ? '체험수업 신청이 정상적으로 접수됐어요'
      : '신청이 정상적으로 접수됐어요';
    document.querySelector('.success-text').innerHTML = TRIAL_MODE
      ? '<strong>이 화면이 보이면 제출이 완료된 상태예요.</strong>선생님의 최종 확인 후 입력하신 연락처로 카카오톡 안내를 보내드려요.'
      : '<strong>이 화면이 보이면 제출이 완료된 상태예요.</strong>선생님의 최종 확인 후 입력하신 연락처로 카카오톡 안내를 보내드려요.';
  }

  if (!isPremiumInquiry && !teacherWasSelected && TRIAL_MODE) {
    const isFreeTrial = a.trialType === '무료 체험';
    document.querySelector('.success-title').textContent = '체험수업 신청이 정상적으로 접수됐어요';
    document.querySelector('.success-text').innerHTML = isFreeTrial
      ? '<strong>이 화면이 보이면 제출이 완료된 상태예요.</strong>24시간 내에 카카오톡으로 보증금 입금 계좌를 안내드려요. 수업 참석 시 전액 환불됩니다.'
      : '<strong>이 화면이 보이면 제출이 완료된 상태예요.</strong>24시간 내에 카카오톡으로 1회 수업 결제 방법을 안내드려요.';
  } else if (!isPremiumInquiry && !teacherWasSelected) {
    document.querySelector('.success-title').textContent = '신청이 정상적으로 접수됐어요';
    document.querySelector('.success-text').innerHTML = '<strong>이 화면이 보이면 제출이 완료된 상태예요.</strong>희망 조건을 확인한 뒤 24시간 내에 입력하신 연락처로 카카오톡 안내를 보내드려요.';
  }

  const preferenceLabels = {
    foreign: '외국인 선생님 선호',
    korean: '한국인 선생님 선호',
    no_preference: '선생님 유형 무관'
  };
  const receiptDetails = {
    frequency: freqLabel(a.frequency || '-'),
    duration: a.duration ? durationLabel(a.duration.index, a.tier) : '',
    place: placeLabel(a),
    teacherPreference: teacherWasSelected
      ? (a.teacher_name || '')
      : (isPremiumInquiry
        ? 'NADO 확인 예정'
        : ('나도 추천 매칭' + (a.teacher_preference ? ' · ' + (preferenceLabels[a.teacher_preference] || a.teacher_preference) : '')))
  };
  if (window.NADO_SUBMISSION_GUARD?.recordAndRender) {
    window.NADO_SUBMISSION_GUARD.recordAndRender({
      answers: a,
      mode: TRIAL_MODE ? 'trial' : 'regular',
      result: submissionResult,
      details: receiptDetails
    });
  }
  console.log('신청 데이터:', a);
}

renderStep();
