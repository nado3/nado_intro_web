const DURATIONS = ['1시간','2시간'];
const PRICE_TABLE = {
  '이코노미': [140000,280000],
  '스탠다드': [180000,360000],
  '프리미엄': [220000,440000]
};
const KID_SURCHARGE = 1500;
const FREQ_MULTIPLIER = { '주 1회': 1, '주 2회': 2, '체험 1회': 0.25 };
function durationLabel(idx){
  return DURATIONS[idx] || DURATIONS[0];
}
function calcPrice(tier, idx, freq){
  if (TRIAL_MODE) return 0;
  const raw = PRICE_TABLE[tier][idx] * FREQ_MULTIPLIER[freq];
  return raw;
}
function freqLabel(freq){
  return freq === '체험 1회' ? '1회 무료 체험' : freq;
}

const steps = [
  {
    key: 'tier', type: 'tier', required: true,
    title: '어떤 플랜을 원하시나요?',
    sub: '수업 시간은 다음 단계에서 선택하실 수 있어요.',
    options: [
      {
        name: '이코노미',
        desc: '영어 회화 실력이 검증된 선생님과 부담 없이 시작',
        more: '<span class="reco-badge">학생/직장인 추천</span><br>· 학적 인증 완료 대학생 선생님 <br>· IGC인천글로벌캠퍼스 카페 · 송도 트리플스트리트 카페<br>'
      },
      {
        name: '스탠다드', badge: 'Most Popular',
        desc: '충분한 경험과 노하우가 있는 선생님',
        more: '<span class="reco-badge">학생/직장인 추천</span><br>· 원하는 시간 우선 배치 <br>· 송도 원하는 곳 어디서든<br>· 해외 대학 + 영어회화 교육 경험이 많은 선생님<br>· 학적 인증 완료 대학생 선생님'
      },
      {
        name: '프리미엄',
        desc: '나도 최우수 선생님 3명 중 선택',
        more: '<span class="reco-badge">뚜렷한 목적이 있고 영어 회화 실력 급상승이 필요한 분께 추천</span><br>· 원하는 시간 우선 배치 <br>· 송도 원하는 곳 어디서든<br>· 학적 인증 완료 대학생 선생님<br>· 나도 <strong>최우수 선생님</strong><span class="tip-icon">?<span class="tip-bubble"><u>최우수 선생님</u>은 학생 만족도, 수업 지속률, 피드백 평가 등을 종합하여 선정된 상위 선생님입니다.</span></span> 3명 중 선택'
      }
    ]
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
    key: 'place', type: 'rank', required: true
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
const activeSteps = steps.filter(s => !(TRIAL_MODE && (s.key === 'tier' || s.key === 'payment')));

let current = 0;
const answers = { frequency: TRIAL_MODE ? '체험 1회' : '주 1회' };
if (TRIAL_MODE) answers.tier = '이코노미';
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
  if (step.type === 'multi') return Array.isArray(value) && value.length ? value.join(', ') : '';
  if (step.type === 'rank') return Array.isArray(value) && value.length ? value.map((v,i)=>(i+1)+'.'+v).join(', ') : '';
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
  if (step.type === 'multi') return Array.isArray(v) && v.length > 0;
  if (step.type === 'rank') return Array.isArray(v) && v.length > 0;
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
  const isEconomy = answers.tier === '이코노미';
  const RANK_OPTIONS = isEconomy
    ? ['IGC인천글로벌캠퍼스 내에서 만나고 싶어요', '송도 트리플스트리트 내에서 만나고 싶어요']
    : ['IGC인천글로벌캠퍼스 내에서 만나고 싶어요', '송도 트리플스트리트 내에서 만나고 싶어요', '선생님과 협의할게요'];
  if (step.type === 'rank') {
    title = isEconomy ? '이코노미는 정해진 두 곳 중에서 진행돼요' : '송도에서 어떻게 진행하고 싶으신가요?';
    sub = isEconomy
      ? '선택하신 곳을 우선 배치해드리지만, 선생님 일정에 따라 조율될 수 있어요.'
      : '선택하신 순위대로 우선 배치해드리지만, 선생님 일정에 따라 조율될 수 있어요.';
  }
  if (TRIAL_MODE && step.type === 'duration') {
    title = '무료 체험 수업 시간을 선택해주세요';
    sub = '이코노미 플랜(30분~50분) 중 원하시는 시간을 골라주세요. 체험 수업은 무료로 진행돼요.';
  }

  let inner = '<div class="qcard"><div class="qtitle">' + title + '</div>';
  if (sub) inner += '<div class="qsub">' + sub + '</div>';

if (step.type === 'tier'){
      if (!TRIAL_MODE) {
        inner += ''
          + '<div style="display:flex;justify-content:flex-end;margin-bottom:1rem;">'
          + '<button type="button" id="freqToggle" style="background:var(--navy);color:#fff;border:none;padding:.5rem 1.1rem;border-radius:2rem;font-weight:800;font-size:.85rem;cursor:pointer;display:flex;align-items:center;gap:.35rem;">'
          + answers.frequency
          + '<span style="font-size:.68rem;opacity:.75;">↻ 변경</span>'
          + '</button>'
          + '</div>';
      } else {
        inner += ''
          + '<div style="display:flex;justify-content:flex-end;margin-bottom:1rem;">'
          + '<span style="background:var(--accent-light);color:var(--accent-deep);padding:.5rem 1.1rem;border-radius:2rem;font-weight:800;font-size:.85rem;">체험 1회</span>'
          + '</div>';
      }
      inner += '<div class="opt-list">';
      step.options.forEach((opt, idx) => {
        const isSel = answers.tier === opt.name;
        inner += ''
          + '<div class="tier-opt ' + (isSel?'selected':'') + '" data-value="' + opt.name + '">'
          + (opt.badge ? '<div class="tier-opt-badge">' + opt.badge + '</div>' : '')
          + '<div class="tier-opt-top">'
          + '<div class="tier-opt-name">' + opt.name + '</div>'
          + '<div class="tier-opt-price">₩' + calcPrice(opt.name, 0, answers.frequency).toLocaleString() + '~</div>'          + '</div>'
          + '<div class="tier-opt-desc">' + opt.desc + '</div>'
          + '<div class="tier-more ' + (isSel?'open':'') + '" id="tierMore' + idx + '">'
          + opt.more
          + (opt.moreCaption ? '<div class="tier-more-caption">' + opt.moreCaption + '</div>' : '')
          + '</div>'
          + '</div>';
      });
      inner += '</div>';
      inner += TRIAL_MODE
        ? '<div style="font-size:.75rem;color:var(--gray);margin-top:.5rem;">체험 수업은 1회만 진행돼요. 마음에 드셨다면 정규 수업은 매칭 후 안내해드릴게요.</div>'
        : '<div style="font-size:.75rem;color:var(--gray);margin-top:.5rem;">주 3회 이상 수업을 원하시면 홈페이지 우측 하단 상담 채팅으로 문의해주세요.</div>';
    } else if (step.type === 'duration'){
      const tier = answers.tier;
      let v = answers.duration || { index: 0 };
      if (v.index < 0 || v.index >= DURATIONS.length) v = { index: 0 };
      answers.duration = v;
      const price = calcPrice(tier, v.index, answers.frequency);
      inner += ''
        + '<div class="duration-options">'
        + '<button type="button" class="duration-opt ' + (v.index === 0 ? 'selected' : '') + '" data-index="0">'
        + '<span class="duration-opt-time">1시간</span><span class="duration-opt-desc">꾸준히 집중해서 배우기</span></button>'
        + '<button type="button" class="duration-opt ' + (v.index === 1 ? 'selected' : '') + '" data-index="1">'
        + '<span class="duration-opt-time">2시간</span><span class="duration-opt-desc">한 번에 깊이 있게 배우기</span></button>'
        + '</div>'
        + '<div style="display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin:1.2rem 0 .8rem;">'
        + '<span style="font-size:.85rem;color:var(--gray);font-weight:600;">' + (answers.frequency === '체험 1회' ? '무료 체험 기준' : (answers.frequency + ' · 월 ' + (answers.frequency === '주 2회' ? '8' : '4') + '회 기준')) + '</span>'
        + '<span id="durPrice" style="font-size:1.1rem;font-weight:800;">' + (TRIAL_MODE ? '<span style="color:var(--accent-deep);">무료</span>' : '<span style="font-size:.72rem;color:var(--gray);font-weight:600;margin-right:3px;">총액</span>₩' + price.toLocaleString()) + '</span>'
        + '</div>';
    } else if (step.type === 'date'){
      const today = new Date().toISOString().split('T')[0];
      const val = answers[step.key] || today;
      inner += '<input type="date" id="dateInput" min="' + today + '" value="' + val + '">';
    } else if (step.type === 'rank'){
      inner += '<div class="opt-list">';
      const selected = answers[step.key] || [];
      RANK_OPTIONS.forEach(opt => {
        const rankIdx = selected.indexOf(opt);
        const isSel = rankIdx > -1;
        inner += '<div class="opt rank ' + (isSel?'selected':'') + '" data-value="' + opt + '"><div class="opt-rank-badge">' + (isSel ? (rankIdx+1) : '') + '</div><div class="opt-label">' + opt + '</div></div>';
      });
      inner += '</div>';

      const negotiateSelected = selected.includes('선생님과 협의할게요');
      inner += ''
        + '<div id="negotiateLocationWrap" style="margin-top:1.2rem;' + (negotiateSelected ? '' : 'display:none;') + '">'
        + '<div class="field-label" style="margin-top:0;">선생님을 만나고 싶으신 대략적인 위치를 알려주세요</div>'
        + '<div class="qsub" style="margin-top:-.2rem;margin-bottom:.7rem;">'
        + '대략적으로 원하시는 동네 및 랜드마크를 적어주세요. <br> 이 정보를 바탕으로 선생님이 이동 가능한 거리인지 확인합니다.'
        + '</div>'
        + '<textarea id="negotiateLocationInput" placeholder="예: 인천대입구역 인근 카페, 송도에듀포레푸르지오 근처 등">' + (answers.negotiateLocation || '') + '</textarea>'
        + '<div style="font-size:.78rem;color:#E85C5C;font-weight:700;line-height:1.6;margin-top:.6rem;">'
        + '⚠️ 대략적인 위치를 꼭 입력해주세요. 미입력 시 매칭이 취소될 수 있습니다.'
        + '</div>'
        + '</div>';
    } else if (step.type === 'single' || step.type === 'multi'){
      inner += '<div class="opt-list">';

    const selected = answers[step.key] || (step.type === 'multi' ? [] : null);
    step.options.forEach(opt => {
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
    const tierName = answers.tier || '-';
    const d = answers.duration || { index: 0 };
    const price = PRICE_TABLE[answers.tier] ? calcPrice(answers.tier, d.index, answers.frequency) : 0;    inner += ''
      + '<div class="pay-box">'
      + '<div class="pay-row"><span>선택 플랜</span><strong>' + tierName + '</strong></div>'
      + '<div class="pay-row"><span>수업 빈도</span><strong>' + answers.frequency + '</strong></div>'
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

  inner += '</div>';
  qcardWrap.innerHTML = inner;

if (step.type === 'tier'){
    const freqToggle = document.getElementById('freqToggle');
    if (freqToggle) {
      freqToggle.addEventListener('click', () => {
        answers.frequency = answers.frequency === '주 1회' ? '주 2회' : '주 1회';
        renderStep();
      });
    }
    qcardWrap.querySelectorAll('.tier-opt').forEach(el => {
      el.addEventListener('click', () => {
        if (answers.tier !== el.dataset.value) {
          answers.place = [];   // 요금제가 바뀌면 장소 선택 초기화
        }
        answers.tier = el.dataset.value;
        qcardWrap.querySelectorAll('.tier-opt').forEach(o => {
          o.classList.remove('selected');
          o.querySelector('.tier-more').classList.remove('open');
        });
        el.classList.add('selected');
        el.querySelector('.tier-more').classList.add('open');
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
          document.getElementById('durPrice').innerHTML = TRIAL_MODE ? '<span style="color:var(--accent-deep);">무료</span>' : '<span style="font-size:.72rem;color:var(--gray);font-weight:600;margin-right:3px;">총액</span>₩' + calcPrice(answers.tier, idx, answers.frequency).toLocaleString();
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
  const negotiateWrap = document.getElementById('negotiateLocationWrap');
  const negotiateInput = document.getElementById('negotiateLocationInput');
  if (negotiateInput) {
    negotiateInput.addEventListener('input', () => { answers.negotiateLocation = negotiateInput.value; });
  }
  qcardWrap.querySelectorAll('.opt').forEach(el => {
    el.addEventListener('click', () => {
      const val = el.dataset.value;
      const arr = answers[step.key] || [];
      const idx = arr.indexOf(val);
      if (idx > -1) { arr.splice(idx, 1); } else { arr.push(val); }
      answers[step.key] = arr;
      qcardWrap.querySelectorAll('.opt').forEach(o => {
        const rIdx = arr.indexOf(o.dataset.value);
        const sel = rIdx > -1;
        o.classList.toggle('selected', sel);
        o.querySelector('.opt-rank-badge').textContent = sel ? (rIdx + 1) : '';
      });
      if (negotiateWrap) {
        const show = arr.includes('선생님과 협의할게요');
        negotiateWrap.style.display = show ? 'block' : 'none';
        if (!show) { answers.negotiateLocation = ''; if (negotiateInput) negotiateInput.value = ''; }
      }
      setNextState(step);
    });
  });
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
  (a.place || []).forEach(p => params.append('submission[29][]', p)); // 진행방식 (다중)
  params.append('submission[30]', TRIAL_MODE ? '이코노미(체험)' : (a.tier || ''));  // 선택 플랜
  params.append('submission[31]', TRIAL_MODE ? '결제 불필요(무료)' : (a.payment ? '완료' : ''));  // 결제확인
  params.append(
    'submission[32]',
    (a.schedule || []).join(', ')
  );                                                          // 희망시간대
  params.append(
      'submission[33]',
      (a.place || []).map((p,i)=>(i+1)+'순위: '+p).join(' / ')
    );                                                                  // 진행방식 순위
    params.append('submission[34]', a.startDate || '');                 // 희망 시작일
    (a.referral || []).forEach(r => params.append('submission[35][]', r)); // 유입경로 (다중)
    params.append('submission[36]', a.gender || '');                    // 성별
    params.append('submission[38]', a.referralOther || '');             // 유입경로 기타 직접입력
    params.append('submission[39]', a.goalsOther || '');                // 학습목표 기타 직접입력
    params.append('submission[40]', a.frequency || '');                 // 수업 빈도
    params.append('submission[41]', a.duration ? durationLabel(a.duration.index, a.tier) : ''); // 수업 시간
    params.append('submission[43]', TRIAL_MODE ? '체험 신청' : '정규 신청');        // 신청 구분
    params.append('submission[28]', a.notes || '');                      // 문의사항
    params.append('submission[44]', a.negotiateLocation || '');          // 협의 희망 위치                                         
 try {
    await fetch('https://api.jotform.com/form/' + FORM_ID + '/submissions?apiKey=' + API_KEY, {
      method: 'POST',
      body: params
    });
  } catch (err) {
    console.error('Jotform 제출 실패:', err);
  }
}

let alreadySubmitted = false;
function showSuccess(){
  if (alreadySubmitted) return;
  alreadySubmitted = true;
  document.getElementById('formMain').style.display = 'none';
  document.getElementById('bottombar').style.display = 'none';
  document.querySelector('.topbar').style.display = 'none';
  const wrap = document.getElementById('successWrap');
  wrap.style.display = 'block';

  const a = answers;
document.getElementById('summaryBox').innerHTML = ''
    + '<strong>선택 플랜</strong> · ' + (a.tier || '-') + ' · ' + freqLabel(a.frequency || '-') + ' · ' + (a.duration ? durationLabel(a.duration.index, a.tier) : '-') + '<br>'
    + '<strong>나이대</strong> · ' + (a.ageGroup || '-') + '<br>'
    + '<strong>영어 수준</strong> · ' + (a.level || '-') + '<br>'
    + '<strong>학습 목표</strong> · ' + ((a.goals||[]).map(g => g === '기타' && a.goalsOther ? '기타(' + a.goalsOther + ')' : g).join(', ') || '-') + '<br>'
    + '<strong>희망 시간대</strong> · ' + ((a.schedule||[]).join(', ') || '-') + '<br>'
    + '<strong>진행 방식</strong> · ' + ((a.place||[]).length ? (a.place||[]).map((p,i)=>(i+1)+'.'+p).join(', ') : '-') + '<br>'
    + (a.negotiateLocation ? '<strong>협의 희망 위치</strong> · ' + a.negotiateLocation + '<br>' : '')
    + '<strong>유입 경로</strong> · ' + ((a.referral||[]).join(', ') || '-') + '<br>'
    + '<strong>연락처</strong> · ' + (a.contact ? a.contact.name + ' · ' + a.contact.phone : '-');
  submitToJotform(a);
  console.log('신청 데이터:', a);
}

renderStep();
