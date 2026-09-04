const DURATIONS = ['1시간','2시간'];
const PRICE_TABLE = {
  '이코노미': [140000,280000],
  '스탠다드': [180000,360000],
  '프리미엄': [220000,440000]
};
const KID_SURCHARGE = 1500;
const FREQ_MULTIPLIER = { '주 1회': 1, '주 2회': 2, '체험 1회': 0.25 };
const TRIAL_DEPOSIT = 20000;
function durationLabel(idx){
  return DURATIONS[idx] || DURATIONS[0];
}
function calcPrice(tier, idx, freq){
  if (!PRICE_TABLE[tier]) return 0;
  if (TRIAL_MODE) {
    return answers.trialType === '플랜 선택 체험' ? PRICE_TABLE[tier][idx] / 4 : 0;
  }
  return PRICE_TABLE[tier][idx] * FREQ_MULTIPLIER[freq];
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
  if (a.placeType === '인천 원하는 장소' || a.placeType === '서울 원하는 장소') {
    const city = a.placeType === '인천 원하는 장소' ? '인천' : '서울';
    const preferredPlace = (a.preferredPlace || '').trim();
    return city + ' 희망 장소' + (preferredPlace ? ' · ' + preferredPlace : '') + ' (최종 장소 추후 조율)';
  }
  if (a.placeType === '송도') return '송도 · 세부 장소는 추후 조율';
  return (a.place || []).join(', ') || '-';
}

const steps = [
  {
    key: 'trialType', type: 'trialType', required: true,
    title: '체험수업 선택',
    sub: '방식과 장소를 선택해주세요.'
  },
  {
    key: 'tier', type: 'tier', required: true,
    title: '어떤 플랜을 원하시나요?',
    sub: '수업 시간은 다음 단계에서 선택하실 수 있어요.',
    options: [
      {
        name: '이코노미',
        desc: '영어 회화 실력이 검증된 선생님과 부담 없이 시작',
        more: '<span class="reco-badge">학생/직장인 추천</span><br>· 학적 인증 완료 대학생 선생님<br>· 인천·서울 희망 장소에서 수업 가능<br>· 세부 장소는 선생님과 조율<br>'
      },
      {
        name: '스탠다드', badge: 'Most Popular',
        desc: '충분한 경험과 노하우가 있는 선생님',
        more: '<span class="reco-badge">학생/직장인 추천</span><br>· 원하는 시간 우선 배치<br>· 인천·서울 희망 장소에서 수업 가능<br>· 세부 장소는 선생님과 조율<br>· 해외 대학 + 영어회화 교육 경험이 많은 선생님<br>· 학적 인증 완료 대학생 선생님'
      },
      {
        name: '프리미엄',
        desc: '나도 최우수 선생님 3명 중 선택',
        more: '<span class="reco-badge">뚜렷한 목적이 있고 영어 회화 실력 급상승이 필요한 분께 추천</span><br>· 원하는 시간 우선 배치<br>· 인천·서울 희망 장소에서 수업 가능<br>· 세부 장소는 선생님과 조율<br>· 학적 인증 완료 대학생 선생님<br>· 나도 <strong>최우수 선생님</strong><span class="tip-icon">?<span class="tip-bubble"><u>최우수 선생님</u>은 학생 만족도, 수업 지속률, 피드백 평가 등을 종합하여 선정된 상위 선생님입니다.</span></span> 3명 중 선택'
      }
    ]
  },
  {
    key: 'place', type: 'rank', required: true
  },
  {
    key: 'duration', type: 'duration', required: true,
    title: '수업 시간을 선택해주세요',
    sub: '1시간 또는 2시간을 선택하면 플랜·빈도에 따른 가격을 바로 확인할 수 있어요.'
  },

  {
    key: 'ageGroup', type: 'single', required: true,
    title: '나이대가 어떻게 되시나요?',
    options: ['초등학생','중고등학생','20대','30대','40대','50대 이상']
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
    key: 'schedule', type: 'gridtime', required: true,
    title: '가능한 시간대를 선택해주세요',
    sub: 'PC에서는 드래그로, 모바일에서는 하나씩 눌러서 선택할 수 있어요.'
  },
   {
    key: 'startDate', type: 'date', required: true,
    title: '언제부터 수업을 시작하고 싶으신가요?',
    sub: '희망하시는 첫 수업 날짜를 선택해주세요.<br>선생님 일정에 따라, 희망하신 날짜보다 첫 수업이 조금 늦어지거나 빨라질 수 있어요.'
  },
  {
    key: 'notes', type: 'text', required: false,
    title: '추가로 전달하고 싶은 내용이 있으신가요?',
    sub: '선택 사항이에요.',
    placeholder: '예: 발표 준비 때문에 비즈니스 표현 위주로 배우고 싶어요',
    quickFill: '선생님과 상담 시 논의할게요'
  },
{
    key: 'referral', type: 'multi', required: true,
    title: '나도를 어떻게 알게 되셨나요?',
    sub: '중복 선택 가능해요.',
    options: ['당근마켓 광고','인스타그램','지인 추천','유튜브','구글 광고','기타']
  },
  {
    key: 'contact', type: 'contact', required: true,
    title: '마지막이에요! 연락처를 남겨주세요',
    sub: '매칭 결과를 이 번호로 안내드려요.'
  },
  {
    key: 'payment', type: 'payment', required: true,
    title: '결제 안내',
    sub: '결제 금액을 확인해주세요. 선생님 매칭이 완료된 후 <strong style="color:var(--ink);">카카오톡으로</strong> 결제 방법을 안내해드릴 예정입니다.'
  }
];
const TRIAL_MODE = document.body.dataset.mode === 'trial';
let current = 0;
const answers = {
  frequency: TRIAL_MODE ? '체험 1회' : '주 1회',
  preferredPlace: ''
};
function buildActiveSteps(){
  if (!TRIAL_MODE) return steps.filter(s => s.key !== 'trialType');
  if (!answers.trialType) return steps.filter(s => s.key === 'trialType');
  if (answers.trialType === '플랜 선택 체험') {
    return steps.filter(s => s.key !== 'place' && s.key !== 'duration');
  }
  return steps.filter(s => s.key !== 'tier' && s.key !== 'place' && s.key !== 'duration');
}
let activeSteps = buildActiveSteps();
const ANALYTICS_FORM_ID = TRIAL_MODE ? 'nado_trial_application' : 'nado_regular_application';
let formStartTracked = false;
const historyEl = document.getElementById('history');
const qcardWrap = document.getElementById('qcardWrap');
const progressFill = document.getElementById('progressFill');
const nextBtn = document.getElementById('nextBtn');
const skipBtn = document.getElementById('skipBtn');
const backBtn = document.getElementById('backBtn');
const dragState = { isDragging: false, mode: true };
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
  if (step.type === 'gridtime') return Array.isArray(value) && value.length ? value.length + '개 시간대 선택' : '';
  if (step.type === 'contact') return value && value.name ? value.name + ' · ' + (value.phone || '') : '';
  if (step.type === 'payment') return value === true ? '확인 완료' : '';
  if (step.type === 'duration') return value ? durationLabel(value.index, answers.tier) + (value.isKid ? ' · 초등학생 이하' : '') : '';  return value || '';
}

function renderHistory(){
  historyEl.innerHTML = '';
  for (let i = 0; i < current; i++){
    const step = activeSteps[i];
    const val = answers[step.key];
    const text = labelFor(step, val);
    if (!text) continue;
    const item = document.createElement('div');
    item.className = 'history-item';
    item.innerHTML = '<div class="history-bubble">' + text + '</div><button class="history-edit" data-idx="' + i + '">수정</button>';
    historyEl.appendChild(item);
  }
  historyEl.querySelectorAll('.history-edit').forEach(btn => {
    btn.addEventListener('click', () => { current = parseInt(btn.dataset.idx); renderStep(); });
  });
}

function checkValid(step){
  const v = answers[step.key];
  if (!step.required) return true;
  if (step.type === 'single') return !!v;
  if (step.type === 'tier') return !!v;
  if (step.type === 'trialType') {
    if (!v || !Array.isArray(answers.place) || answers.place.length === 0) return false;
    if (v === '무료 체험') {
      return answers.placeType === 'IGC 인천글로벌캠퍼스' || answers.placeType === '송도 트리플스트리트';
    }
    return (answers.placeType === '인천 원하는 장소' || answers.placeType === '서울 원하는 장소')
      && !!(answers.preferredPlace && answers.preferredPlace.trim());
  }
  if (step.type === 'multi') return Array.isArray(v) && v.length > 0;
  if (step.type === 'rank') {
    if (!Array.isArray(v) || v.length === 0) return false;
    if (answers.placeType === '인천 원하는 장소' || answers.placeType === '서울 원하는 장소') {
      return !!(answers.preferredPlace && answers.preferredPlace.trim());
    }
    if (answers.placeType === '송도 할인 장소') return !!answers.songdoPlace;
    return true;
  }
  if (step.type === 'date') return !!v;
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
  nextBtn.textContent = current === activeSteps.length - 1 ? '제출하기' : '다음';
  skipBtn.style.display = step.required ? 'none' : 'block';
}

function renderStep(){
  if (current >= activeSteps.length){ showSuccess(); return; }
  const step = activeSteps[current];
  updateProgress();
  renderHistory();
  backBtn.style.visibility = current === 0 ? 'hidden' : 'visible';

  let title = step.title;
  let sub = step.sub;
  const isFreeTrial = TRIAL_MODE && answers.trialType === '무료 체험';
  const isPaidTrial = TRIAL_MODE && answers.trialType === '플랜 선택 체험';
  const RANK_OPTIONS = isFreeTrial
    ? ['IGC 인천글로벌캠퍼스', '송도 트리플스트리트']
    : ['인천 원하는 장소', '서울 원하는 장소'];
  if (step.type === 'rank') {
    if (isFreeTrial) {
      title = '무료 체험 장소 선택';
      sub = 'IGC 인천글로벌캠퍼스와 송도 트리플스트리트 중 한 곳을 선택해주세요.';
    } else {
      title = '수업 장소를 선택해주세요';
      sub = '인천·서울 중 희망 지역을 선택하고 대략적인 장소를 입력해주세요.';
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

  let inner = '<div class="qcard"><div class="qtitle">' + title + '</div>';
  if (sub) inner += '<div class="qsub">' + sub + '</div>';

if (step.type === 'trialType'){
      const selectedType = answers.trialType || '';
      inner += '<div class="opt-list">'
        + '<div class="tier-opt ' + (selectedType === '무료 체험' ? 'selected' : '') + '" data-trial-type="무료 체험">'
        + '<div class="tier-opt-top"><div class="tier-opt-name">송도 지정 장소</div><div class="tier-opt-price">무료</div></div>'
        + '<div class="tier-opt-desc">이코노미 플랜으로 진행 · IGC 또는 트리플스트리트</div></div>';

      if (selectedType === '무료 체험') {
        inner += '<div class="trial-place-group">'
          + '<div class="field-label">장소 선택</div>'
          + '<div class="opt-list">'
          + '<div class="opt trial-place-opt ' + (answers.placeType === 'IGC 인천글로벌캠퍼스' ? 'selected' : '') + '" data-value="IGC 인천글로벌캠퍼스"><div class="opt-dot"></div><div class="opt-label">IGC 인천글로벌캠퍼스</div></div>'
          + '<div class="opt trial-place-opt ' + (answers.placeType === '송도 트리플스트리트' ? 'selected' : '') + '" data-value="송도 트리플스트리트"><div class="opt-dot"></div><div class="opt-label">송도 트리플스트리트</div></div>'
          + '</div></div>';
      }

      inner += '<div class="tier-opt ' + (selectedType === '플랜 선택 체험' ? 'selected' : '') + '" data-trial-type="플랜 선택 체험">'
        + '<div class="tier-opt-top"><div class="tier-opt-name">인천/서울 희망 장소</div><div class="tier-opt-price">월 수강료 1회분</div></div>'
        + '<div class="tier-opt-desc">인천 또는 서울</div></div>';

      if (selectedType === '플랜 선택 체험') {
        inner += '<div class="trial-place-group">'
          + '<div class="field-label">장소 선택</div>'
          + '<div class="opt-list">'
          + '<div class="opt trial-place-opt ' + (answers.placeType === '인천 원하는 장소' ? 'selected' : '') + '" data-value="인천 원하는 장소"><div class="opt-dot"></div><div class="opt-label">인천에서 희망하는 장소</div></div>';
        if (answers.placeType === '인천 원하는 장소') {
          inner += '<div class="preferred-place-wrap"><label class="sr-only" for="preferredPlaceInput">인천 희망 장소</label><input type="text" id="preferredPlaceInput" placeholder="예: 부평역 근처 카페" value="' + (answers.preferredPlace || '') + '"></div>';
        }
        inner += '<div class="opt trial-place-opt ' + (answers.placeType === '서울 원하는 장소' ? 'selected' : '') + '" data-value="서울 원하는 장소"><div class="opt-dot"></div><div class="opt-label">서울에서 희망하는 장소</div></div>';
        if (answers.placeType === '서울 원하는 장소') {
          inner += '<div class="preferred-place-wrap"><label class="sr-only" for="preferredPlaceInput">서울 희망 장소</label><input type="text" id="preferredPlaceInput" placeholder="예: 홍대입구역 근처 카페" value="' + (answers.preferredPlace || '') + '"></div>';
        }
        inner += '</div></div>';
      }

      inner += '</div>';
    } else if (step.type === 'tier'){
      if (!TRIAL_MODE) {
        inner += ''
          + '<div style="display:flex;justify-content:flex-end;margin-bottom:1rem;">'
          + '<button type="button" id="freqToggle" style="background:var(--navy);color:#fff;border:none;padding:.5rem 1.1rem;border-radius:2rem;font-weight:800;font-size:.85rem;cursor:pointer;display:flex;align-items:center;gap:.35rem;">'
          + answers.frequency
          + '<span style="font-size:.68rem;opacity:.75;">↻ 변경</span>'
          + '</button>'
          + '</div>';
      }
      inner += '<div class="opt-list">';
      step.options.forEach((opt, idx) => {
        const isSel = answers.tier === opt.name;
        inner += ''
          + '<div class="tier-opt ' + (isSel?'selected':'') + '" data-value="' + opt.name + '">'
          + (!TRIAL_MODE && opt.badge ? '<div class="tier-opt-badge">' + opt.badge + '</div>' : '')
          + '<div class="tier-opt-top">'
          + '<div class="tier-opt-name">' + opt.name + '</div>'
          + '<div class="tier-opt-price">₩' + calcPrice(opt.name, 0, answers.frequency).toLocaleString() + (TRIAL_MODE ? '' : '~') + '</div>'          + '</div>'
          + (TRIAL_MODE ? '' : '<div class="tier-opt-desc">' + opt.desc + '</div>')
          + (TRIAL_MODE ? '' : '<div class="tier-more ' + (isSel?'open':'') + '" id="tierMore' + idx + '">'
            + opt.more
            + (opt.moreCaption ? '<div class="tier-more-caption">' + opt.moreCaption + '</div>' : '')
            + '</div>')
          + '</div>';
      });
      inner += '</div>';
      if (!TRIAL_MODE) inner += '<div style="font-size:.75rem;color:var(--gray);margin-top:.5rem;">주 3회 이상 수업을 원하시면 홈페이지 우측 하단 상담 채팅으로 문의해주세요.</div>';
    } else if (step.type === 'duration'){
      const tier = answers.tier;
      let v = answers.duration || { index: 0 };
      if (v.index < 0 || v.index >= DURATIONS.length) v = { index: 0 };
      if (isFreeTrial) v = { index: 0 };
      answers.duration = v;
      const price = calcPrice(tier, v.index, answers.frequency);
      if (isFreeTrial) {
        inner += ''
          + '<div style="background:var(--accent-light);border-radius:1.1rem;padding:1.4rem 1.2rem;display:flex;align-items:center;justify-content:space-between;gap:1rem;">'
          + '<div>'
          + '<div style="font-size:1.15rem;font-weight:800;color:var(--accent-deep);">1시간 무료 체험 수업</div>'
          + '</div>'
          + '<div style="font-size:1.2rem;font-weight:900;color:var(--accent-deep);white-space:nowrap;">무료</div>'
          + '</div>';
      } else {
        inner += ''
          + '<div class="duration-options">'
          + '<button type="button" class="duration-opt ' + (v.index === 0 ? 'selected' : '') + '" data-index="0">'
          + '<span class="duration-opt-time">1시간</span><span class="duration-opt-desc">꾸준히 집중해서 배우기</span></button>'
          + '<button type="button" class="duration-opt ' + (v.index === 1 ? 'selected' : '') + '" data-index="1">'
          + '<span class="duration-opt-time">2시간</span><span class="duration-opt-desc">한 번에 깊이 있게 배우기</span></button>'
          + '</div>'
          + '<div style="display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin:1.2rem 0 .8rem;">'
          + '<span style="font-size:.85rem;color:var(--gray);font-weight:600;">' + (isPaidTrial ? '월 수강료의 1회분' : answers.frequency + ' · 월 ' + (answers.frequency === '주 2회' ? '8' : '4') + '회 기준') + '</span>'
          + '<span id="durPrice" style="font-size:1.1rem;font-weight:800;"><span style="font-size:.72rem;color:var(--gray);font-weight:600;margin-right:3px;">총액</span>₩' + price.toLocaleString() + '</span>'
          + '</div>';
      }
    } else if (step.type === 'date'){
      const today = new Date().toISOString().split('T')[0];
      const val = answers[step.key] || today;
      inner += '<input type="date" id="dateInput" min="' + today + '" value="' + val + '">';
    } else if (step.type === 'rank'){
      inner += '<div class="opt-list">';
      const selected = answers[step.key] || [];
      RANK_OPTIONS.forEach(opt => {
        const isSel = selected.includes(opt);
        let optionTitle = opt;
        let optionMeta = '';

        if (opt === '인천 원하는 장소') {
          optionTitle = '인천에서 희망하는 장소';
          optionMeta = '<div class="place-option-meta">대략적인 장소 입력 · 추후 조율</div>';
        } else if (opt === '서울 원하는 장소') {
          optionTitle = '서울에서 희망하는 장소';
          optionMeta = '<div class="place-option-meta">대략적인 장소 입력 · 추후 조율</div>';
        } else if (opt === '송도 할인 장소') {
          optionTitle = '송도 지정 장소';
          optionMeta = '<div class="place-option-meta">IGC·트리플스트리트</div>';
        } else if (opt === '송도') {
          optionTitle = '송도에서 진행';
          optionMeta = '<div class="place-option-meta">세부 장소는 선생님과 추후 조율</div>';
        }

        inner += '<div class="opt rank ' + (isSel?'selected':'') + '" data-value="' + opt + '">'
          + '<div class="opt-rank-badge">' + (isSel ? '✓' : '') + '</div>'
          + '<div class="opt-label">' + optionTitle + optionMeta + '</div></div>';

        if (isSel && (opt === '인천 원하는 장소' || opt === '서울 원하는 장소')) {
          const isIncheon = opt === '인천 원하는 장소';
          const placeholder = isIncheon ? '예: 부평역 근처 카페' : '예: 홍대입구역 근처 카페';
          inner += '<div class="preferred-place-wrap">'
            + '<label class="sr-only" for="preferredPlaceInput">' + (isIncheon ? '인천' : '서울') + ' 희망 장소</label>'
            + '<input type="text" id="preferredPlaceInput" placeholder="' + placeholder + '" value="' + (answers.preferredPlace || '') + '">'
            + '<div class="preferred-place-help">최종 장소는 선생님과 조율해요.</div>'
            + '</div>';
        }
      });
      inner += '</div>';

      if (answers.placeType === '송도 할인 장소') {
        inner += '<div id="songdoPlaceWrap" style="margin-top:1.2rem;">'
          + '<div class="field-label">송도에서 수업할 장소를 선택해주세요</div>'
          + '<div class="qsub" style="margin-top:-.2rem;">' + (TRIAL_MODE
            ? '무료 체험은 아래 두 곳 중에서 진행됩니다.'
            : '이코노미 송도 할인은 아래 두 지정 장소에서 진행할 때 적용됩니다.') + '</div>'
          + '<div class="opt-list">'
          + '<div class="opt songdo-sub-place ' + (answers.songdoPlace === 'IGC 인천글로벌캠퍼스' ? 'selected' : '') + '" data-value="IGC 인천글로벌캠퍼스"><div class="opt-dot"></div><div class="opt-label">IGC 인천글로벌캠퍼스</div></div>'
          + '<div class="opt songdo-sub-place ' + (answers.songdoPlace === '송도 트리플스트리트' ? 'selected' : '') + '" data-value="송도 트리플스트리트"><div class="opt-dot"></div><div class="opt-label">송도 트리플스트리트</div></div>'
          + '</div></div>';
      }
    } else if (step.type === 'single' || step.type === 'multi'){
      inner += '<div class="opt-list">';

    const selected = answers[step.key] || (step.type === 'multi' ? [] : null);
    const visibleOptions = step.key === 'goals' && answers.tier === '이코노미'
      ? step.options.filter(opt => opt !== '비즈니스')
      : step.options;
    visibleOptions.forEach(opt => {
      const isSel = step.type === 'multi' ? selected.includes(opt) : selected === opt;
      inner += '<div class="opt ' + (step.type==='multi'?'multi':'') + ' ' + (isSel?'selected':'') + '" data-value="' + opt + '"><div class="opt-dot"></div><div class="opt-label">' + opt + '</div></div>';
    });
    inner += '</div>';
    if (step.key === 'referral') {
      const showOther = selected.includes('기타');
      inner += '<div id="referralOtherWrap" style="margin-top:.8rem;' + (showOther?'':'display:none;') + '"><input type="text" id="referralOtherInput" placeholder="어떻게 알게 되셨는지 적어주세요" value="' + (answers.referralOther||'') + '"></div>';
    }
    if (step.key === 'goals') {
      const showOther = selected.includes('기타');
      inner += '<div id="goalsOtherWrap" style="margin-top:.8rem;' + (showOther?'':'display:none;') + '"><input type="text" id="goalsOtherInput" placeholder="원하시는 목표를 적어주세요" value="' + (answers.goalsOther||'') + '"></div>';
    }
  } else if (step.type === 'gridtime'){
    const days = ['월','화','수','목','금','토','일'];
    const slots = [];
    for (let h = 9; h < 24; h++){ slots.push(h + ':00'); slots.push(h + ':30'); }
    slots.push('24:00');
    const selectedArr = answers[step.key] || [];
    const activeDay = scheduleActiveDay;

    inner += '<div class="day-tabs" id="dayTabs">';
    days.forEach(d => {
      const count = selectedArr.filter(v => v.indexOf(d + ' ') === 0).length;
      inner += '<button type="button" class="day-tab ' + (d === activeDay ? 'active' : '') + '" data-day="' + d + '">'
        + d
        + (count > 0 ? '<span class="day-tab-badge">' + count + '</span>' : '')
        + '</button>';
    });
    inner += '</div>';

    inner += '<div class="time-slot-grid" id="timeSlotGrid">';
    slots.forEach(t => {
      const key = activeDay + ' ' + t;
      const isSel = selectedArr.indexOf(key) > -1;
      inner += '<div class="time-slot ' + (isSel ? 'selected' : '') + '" data-key="' + key + '">' + t + '</div>';
    });
    inner += '</div>';
    inner += '<div class="field-label" style="margin-top:1rem;">30분 단위로 가능한 시간을 모두 선택해주세요.<br>요일 탭을 눌러 다른 요일도 선택할 수 있어요.</div>';
  } else if (step.type === 'text'){
    const val = answers[step.key] || '';
    inner += '<textarea id="textInput" placeholder="' + (step.placeholder||'') + '">' + val + '</textarea>';
    if (step.quickFill) inner += '<button class="quick-fill" id="quickFillBtn">"' + step.quickFill + '"</button>';
  } else if (step.type === 'contact'){
    const v = answers[step.key] || {name:'', phone:'', consent:false};
    inner += ''
      + '<div class="field-label">이름</div>'
      + '<input type="text" id="nameInput" placeholder="홍길동" value="' + v.name + '">'
      + '<div class="field-label">연락처</div>'
      + '<input type="tel" id="phoneInput" placeholder="010-0000-0000" value="' + v.phone + '">'
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
    if (isFreeTrial) {
      inner += ''
        + '<div class="pay-box">'
        + '<div class="pay-row"><span>선택 플랜</span><strong>이코노미(체험)</strong></div>'
        + '<div class="pay-row"><span>수업 시간</span><strong>1시간</strong></div>'
        + '<div class="pay-row"><span>노쇼 방지 보증금</span><strong>₩' + TRIAL_DEPOSIT.toLocaleString() + '</strong></div>'
        + '</div>'
        + '<div class="qsub" style="margin-top:-.4rem;">'
        + '<strong style="color:var(--ink);">수업에 참석하시면 보증금은 전액 환불</strong>됩니다. 다만 사전 연락 없이 노쇼하실 경우 환불되지 않아요.<br>'
        + '매칭이 완료되면 카카오톡으로 입금 계좌를 안내해드려요.'
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
        + '<div class="pay-row"><span>결제 금액</span><strong>₩' + price.toLocaleString() + '</strong></div>'
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
          answers.songdoPlace = '';
          answers.payment = false;
          if (nextType === '무료 체험' && Array.isArray(answers.goals)) {
            answers.goals = answers.goals.filter(goal => goal !== '비즈니스');
          }
        }
        activeSteps = buildActiveSteps();
        renderStep();
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
        if (!TRIAL_MODE && answers.tier !== el.dataset.value) {
          answers.place = [];   // 요금제가 바뀌면 장소 선택 초기화
          answers.placeType = '';
          answers.preferredPlace = '';
          answers.songdoPlace = '';
          answers.payment = false;
        }
        answers.tier = el.dataset.value;
        if (answers.tier === '이코노미' && Array.isArray(answers.goals)) {
          answers.goals = answers.goals.filter(goal => goal !== '비즈니스');
        }
        qcardWrap.querySelectorAll('.tier-opt').forEach(o => {
          o.classList.remove('selected');
          const more = o.querySelector('.tier-more');
          if (more) more.classList.remove('open');
        });
        el.classList.add('selected');
        const selectedMore = el.querySelector('.tier-more');
        if (selectedMore) selectedMore.classList.add('open');
        setNextState(step);
      });
    });
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
          const idx = parseInt(option.dataset.index);
        answers.duration = { index: idx };
          qcardWrap.querySelectorAll('.duration-opt').forEach(el => el.classList.remove('selected'));
          option.classList.add('selected');
          document.getElementById('durPrice').innerHTML = isFreeTrial ? '<span style="color:var(--accent-deep);">무료</span>' : '<span style="font-size:.72rem;color:var(--gray);font-weight:600;margin-right:3px;">총액</span>₩' + calcPrice(answers.tier, idx, answers.frequency).toLocaleString();
          setNextState(step);
        });
      });

    } else if (step.type === 'date'){
    const dateInput = document.getElementById('dateInput');
    if (!answers[step.key]) { answers[step.key] = dateInput.value; }
    dateInput.addEventListener('input', () => {
      answers[step.key] = dateInput.value;
      setNextState(step);
    });
  } else if (step.type === 'rank'){
  qcardWrap.querySelectorAll('.opt.rank').forEach(el => {
    el.addEventListener('click', () => {
      const val = el.dataset.value;
      if (answers.placeType !== val) answers.preferredPlace = '';
      answers.place = [val];
      answers.placeType = val;
      if (val !== '송도 할인 장소') answers.songdoPlace = '';
      answers.payment = false;
      renderStep();
    });
  });

  qcardWrap.querySelectorAll('.songdo-sub-place').forEach(el => {
    el.addEventListener('click', () => {
      answers.songdoPlace = el.dataset.value;
      answers.payment = false;
      qcardWrap.querySelectorAll('.songdo-sub-place').forEach(o => o.classList.remove('selected'));
      el.classList.add('selected');
      setNextState(step);
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
        if (step.type === 'single'){
          answers[step.key] = val;
          qcardWrap.querySelectorAll('.opt').forEach(o => o.classList.remove('selected'));
          el.classList.add('selected');
        } else {
          const arr = answers[step.key] || [];
          const idx = arr.indexOf(val);
          if (idx > -1) arr.splice(idx,1); else arr.push(val);
          answers[step.key] = arr;
          el.classList.toggle('selected');
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
        tab.classList.toggle('active', d === scheduleActiveDay);
        const count = selectedArr.filter(v => v.indexOf(d + ' ') === 0).length;
        let badge = tab.querySelector('.day-tab-badge');
        if (count > 0) {
          if (!badge) {
            badge = document.createElement('span');
            badge.className = 'day-tab-badge';
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
      renderTabs();
      setNextState(step);
    };

    const bindSlotEvents = () => {
      qcardWrap.querySelectorAll('.time-slot').forEach(cell => {
        cell.addEventListener('mousedown', (e) => {
          e.preventDefault();
          dragState.isDragging = true;
          dragState.mode = selectedArr.indexOf(cell.dataset.key) === -1;
          cell.classList.toggle('selected', dragState.mode);
          applySlot(cell.dataset.key, dragState.mode);
        });
        cell.addEventListener('mouseenter', () => {
          if (dragState.isDragging) {
            cell.classList.toggle('selected', dragState.mode);
            applySlot(cell.dataset.key, dragState.mode);
          }
        });
        cell.addEventListener('touchend', (e) => {
          e.preventDefault();
          const shouldSelect = selectedArr.indexOf(cell.dataset.key) === -1;
          cell.classList.toggle('selected', shouldSelect);
          applySlot(cell.dataset.key, shouldSelect);
        });
      });
    };

    const rebuildSlotGrid = () => {
      const grid = document.getElementById('timeSlotGrid');
      grid.innerHTML = buildSlots().map(t => {
        const key = scheduleActiveDay + ' ' + t;
        const isSel = selectedArr.indexOf(key) > -1;
        return '<div class="time-slot ' + (isSel ? 'selected' : '') + '" data-key="' + key + '">' + t + '</div>';
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

nextBtn.addEventListener('click', () => {
  const step = activeSteps[current];
  if (!checkValid(step)) return;
  if (!formStartTracked) {
    formStartTracked = true;
    trackFormEvent('form_start');
  }
  if (current === activeSteps.length - 1) {
    if (nextBtn.dataset.submitted) return;
    nextBtn.dataset.submitted = '1';
  }
  current++;
  renderStep();
});

skipBtn.addEventListener('click', () => {
  current++;
  renderStep();
});

backBtn.addEventListener('click', () => {
  if (current > 0){ current--; renderStep(); }
});

async function submitToJotform(a) {
  const FORM_ID = '262064236851052';
  const API_KEY = '32abecc4b70bf065c8adf25c9b02b7cb';

  const params = new URLSearchParams();
  params.append('submission[3]', a.contact.name);                     // 이름
  params.append('submission[4][full]', a.contact.phone);              // 연락처
  params.append('submission[5]', a.ageGroup);                         // 나이대
  params.append('submission[7]', a.level);                            // 영어 수준
  (a.goals || []).forEach(g => params.append('submission[8][]', g));  // 학습 목표 (다중)
  (a.place || []).forEach(p => params.append('submission[29][]', p)); // 진행방식
  params.append('submission[30]', TRIAL_MODE ? ((a.tier || '이코노미') + '(' + (a.trialType || '체험수업') + ')') : (a.tier || ''));  // 선택 플랜
  params.append('submission[31]', TRIAL_MODE && a.trialType === '무료 체험' ? (a.payment ? '보증금 안내 확인' : '') : (a.payment ? '완료' : ''));  // 결제확인
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
    params.append('submission[43]', TRIAL_MODE ? ((a.trialType || '체험수업') + ' 신청') : '정규 신청'); // 신청 구분
    params.append('submission[28]', a.notes || '');                      // 문의사항
    params.append('submission[44]', a.preferredPlace || a.songdoPlace || ''); // 희망/지정 장소 세부정보
  const response = await fetch('https://api.jotform.com/form/' + FORM_ID + '/submissions?apiKey=' + API_KEY, {
    method: 'POST',
    body: params
  });
  const result = await response.json().catch(() => null);
  const responseCode = result && Number(result.responseCode);
  if (!response.ok || !result || responseCode !== 200) {
    throw new Error((result && result.message) || '신청 저장에 실패했습니다.');
  }
  return result;
}

let alreadySubmitted = false;
let submissionInProgress = false;

function trackFormEvent(eventName, extraParams) {
  if (typeof window.gtag !== 'function') return;
  window.gtag('event', eventName, Object.assign({
    form_id: ANALYTICS_FORM_ID,
    form_name: TRIAL_MODE ? '체험수업 신청' : '정규수업 신청',
    form_type: TRIAL_MODE ? 'trial' : 'regular'
  }, extraParams || {}));
}

function trackGoogleAdsApplication() {
  if (typeof window.gtag !== 'function') return;
  window.gtag('event', 'conversion', {
    send_to: 'AW-18355423972/rMOMCLz4vO0cEOSVxrBE',
    value: 1,
    currency: 'KRW'
  });
}

function showSubmitError() {
  current = Math.max(0, activeSteps.length - 1);
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
  error.textContent = '신청이 저장되지 않았어요. 인터넷 연결을 확인한 뒤 다시 제출해주세요.';
  card.appendChild(error);
}

async function showSuccess(){
  if (alreadySubmitted || submissionInProgress) return;
  submissionInProgress = true;
  nextBtn.disabled = true;
  nextBtn.textContent = '제출 중…';

  const a = answers;
  try {
    await submitToJotform(a);
  } catch (err) {
    submissionInProgress = false;
    console.error('Jotform 제출 실패:', err);
    trackFormEvent('form_submit_error');
    showSubmitError();
    return;
  }

  alreadySubmitted = true;
  trackFormEvent('form_submit');
  trackFormEvent('generate_lead', { currency: 'KRW', value: 1 });
  trackGoogleAdsApplication();
  document.getElementById('formMain').style.display = 'none';
  document.getElementById('bottombar').style.display = 'none';
  document.querySelector('.topbar').style.display = 'none';
  const wrap = document.getElementById('successWrap');
  wrap.style.display = 'block';

  if (TRIAL_MODE) {
    const isFreeTrial = a.trialType === '무료 체험';
    document.querySelector('.success-title').textContent = '체험수업 신청 완료!';
    document.querySelector('.success-text').innerHTML = isFreeTrial
      ? '매칭 준비 후 24시간 내에 카카오톡으로 보증금 입금 계좌를 안내드려요.<br>수업 참석 시 보증금은 전액 환불됩니다.'
      : '매칭 준비 후 24시간 내에 카카오톡으로 1회 수업 결제 방법을 안내드려요.';
  }
document.getElementById('summaryBox').innerHTML = ''
    + (TRIAL_MODE ? '<strong>체험 방식</strong> · ' + (a.trialType || '-') + '<br>' : '')
    + '<strong>선택 플랜</strong> · ' + (a.tier || '-') + ' · ' + freqLabel(a.frequency || '-') + ' · ' + (a.duration ? durationLabel(a.duration.index, a.tier) : '-') + '<br>'
    + (TRIAL_MODE && a.trialType === '플랜 선택 체험' ? '<strong>1회 체험 금액</strong> · ₩' + calcPrice(a.tier, a.duration ? a.duration.index : 0, a.frequency).toLocaleString() + '<br>' : '')
    + '<strong>나이대</strong> · ' + (a.ageGroup || '-') + '<br>'
    + '<strong>영어 수준</strong> · ' + (a.level || '-') + '<br>'
    + '<strong>학습 목표</strong> · ' + ((a.goals||[]).map(g => g === '기타' && a.goalsOther ? '기타(' + a.goalsOther + ')' : g).join(', ') || '-') + '<br>'
    + '<strong>희망 시간대</strong> · ' + ((a.schedule||[]).join(', ') || '-') + '<br>'
    + '<strong>수업 장소</strong> · ' + placeLabel(a) + '<br>'
    + '<strong>유입 경로</strong> · ' + ((a.referral||[]).join(', ') || '-') + '<br>'
    + '<strong>연락처</strong> · ' + (a.contact ? a.contact.name + ' · ' + a.contact.phone : '-');
  console.log('신청 데이터:', a);
}

renderStep();
