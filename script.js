const DURATIONS = ['30분','35분','40분','45분','60분','1시간 10분','1시간 20분','1시간 30분','1시간 40분','1시간 50분','2시간'];
const PRICE_TABLE = {
  '이코노미': [80000,93333,106666,120000,140000,163332,186664,209996,233328,256660,280000],
  '스탠다드': [100000,116666,133332,150000,180000,210000,240000,270000,300000,330000,360000],
  '프리미엄': [120000,140000,160000,180000,220000,256668,293336,330004,366672,403340,440000]
};
const KID_SURCHARGE = 1500;
const FREQ_MULTIPLIER = { '주 1회': 1, '주 2회': 2 };
const TIER_DURATION_MAX_INDEX = { '이코노미': 4 }; // 이코노미는 30~50분(인덱스 0~4)까지만 선택 가능
function durationLabel(idx, tier){
  if (idx === 4) return tier === '이코노미' ? '50분' : '60분';
  return DURATIONS[idx];
}

const steps = [
  {
    key: 'tier', type: 'tier', required: true,
    title: '어떤 플랜를 원하시나요?',
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
    sub: '슬라이더를 움직이면 선택하신 플랜·빈도의 가격이 함께 표시돼요.'
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
    sub: '희망하시는 첫 수업 날짜를 선택해주세요.<br>선생님 일정에 따라, 희망하신 날짜보다 첫 수업이 조금 늦어질 수 있어요.'
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

let current = 0;
const answers = { frequency: '주 1회' };
const historyEl = document.getElementById('history');
const qcardWrap = document.getElementById('qcardWrap');
const progressFill = document.getElementById('progressFill');
const nextBtn = document.getElementById('nextBtn');
const skipBtn = document.getElementById('skipBtn');
const backBtn = document.getElementById('backBtn');
const dragState = { isDragging: false, mode: true };
document.addEventListener('mouseup', () => { dragState.isDragging = false; });

function updateProgress(){
  const pct = Math.round((current / steps.length) * 100);
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
    const step = steps[i];
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
  nextBtn.textContent = current === steps.length - 1 ? '제출하기' : '다음';
  skipBtn.style.display = step.required ? 'none' : 'block';
}

function renderStep(){
  if (current >= steps.length){ showSuccess(); return; }
  const step = steps[current];
  updateProgress();
  renderHistory();
  backBtn.style.visibility = current === 0 ? 'hidden' : 'visible';

  let title = step.title;
  let sub = step.sub;
  const isEconomy = answers.tier === '이코노미';
  const RANK_OPTIONS = isEconomy
    ? ['IGC인천글로벌캠퍼스 카페에서 만나고 싶어요', '송도 트리플스트리트 카페에서 만나고 싶어요']
    : ['IGC인천글로벌캠퍼스 카페에서 만나고 싶어요', '송도 트리플스트리트 카페에서 만나고 싶어요', '선생님과 협의할게요'];
  if (step.type === 'rank') {
    title = isEconomy ? '이코노미는 정해진 두 곳 중에서 진행돼요' : '송도에서 어떻게 진행하고 싶으신가요?';
    sub = isEconomy
      ? '선택하신 곳을 우선 배치해드리지만, 선생님 일정에 따라 조율될 수 있어요.'
      : '선택하신 순위대로 우선 배치해드리지만, 선생님 일정에 따라 조율될 수 있어요.';
  }

  let inner = '<div class="qcard"><div class="qtitle">' + title + '</div>';
  if (sub) inner += '<div class="qsub">' + sub + '</div>';

if (step.type === 'tier'){
      inner += ''
        + '<div style="display:flex;justify-content:flex-end;margin-bottom:1rem;">'
        + '<button type="button" id="freqToggle" style="background:var(--navy);color:#fff;border:none;padding:.5rem 1.1rem;border-radius:2rem;font-weight:800;font-size:.85rem;cursor:pointer;display:flex;align-items:center;gap:.35rem;">'
        + answers.frequency
        + '<span style="font-size:.68rem;opacity:.75;">↻ 변경</span>'
        + '</button>'
        + '</div>';
      inner += '<div class="opt-list">';
      step.options.forEach((opt, idx) => {
        const isSel = answers.tier === opt.name;
        inner += ''
          + '<div class="tier-opt ' + (isSel?'selected':'') + '" data-value="' + opt.name + '">'
          + (opt.badge ? '<div class="tier-opt-badge">' + opt.badge + '</div>' : '')
          + '<div class="tier-opt-top">'
          + '<div class="tier-opt-name">' + opt.name + '</div>'
          + '<div class="tier-opt-price">₩' + (PRICE_TABLE[opt.name][0] * FREQ_MULTIPLIER[answers.frequency]).toLocaleString() + '~</div>'
          + '</div>'
          + '<div class="tier-opt-desc">' + opt.desc + '</div>'
          + '<div class="tier-more ' + (isSel?'open':'') + '" id="tierMore' + idx + '">'
          + opt.more
          + (opt.moreCaption ? '<div class="tier-more-caption">' + opt.moreCaption + '</div>' : '')
          + '</div>'
          + '</div>';
      });
      inner += '</div>';
      inner += '<div style="font-size:.75rem;color:var(--gray);margin-top:.5rem;">주 3회 이상 수업을 원하시면 홈페이지 우측 하단 상담 채팅으로 문의해주세요.</div>';
    } else if (step.type === 'duration'){
      const tier = answers.tier;
      const maxIdx = TIER_DURATION_MAX_INDEX[tier] !== undefined ? TIER_DURATION_MAX_INDEX[tier] : 10;
      let v = answers.duration || { index: Math.min(4, maxIdx) };
      if (v.index > maxIdx) v = { index: maxIdx };
      answers.duration = v;
      const price = PRICE_TABLE[tier][v.index] * FREQ_MULTIPLIER[answers.frequency];
      const reasonFor = (idx) => {
        if (idx === 0) return '점심시간·저녁시간에 가볍게 짧고 굵게';
        if (idx === 4) {
          return tier === '이코노미'
            ? '이코노미에서 선택하실 수 있는 가장 넉넉한 시간이에요'
            : '단기간에 실력을 확 끌어올리고 싶은 분께';
        }
        return '';
      };
      const recoIdxList = [0, 4];
      let ticksHtml = '';
      recoIdxList.forEach(idx => {
        const pct = idx / maxIdx;
        ticksHtml += '<div class="dur-tick" style="left:calc(9px + (100% - 18px) * ' + pct + ');"></div>'
          + '<div class="dur-tick-badge" style="left:calc(9px + (100% - 18px) * ' + pct + ');">추천</div>';
      });
      inner += ''
        + '<div class="dur-track-wrap">'
        + '<div class="dur-tooltip" id="durTooltip">' + durationLabel(v.index, tier) + '</div>'
        + ticksHtml
        + '<input type="range" id="durSlider" min="0" max="' + maxIdx + '" step="1" value="' + v.index + '" style="width:100%;position:relative;z-index:1;">'
        + '</div>'
        + '<div style="display:flex;justify-content:space-between;font-size:.72rem;color:var(--gray);margin-top:2px;"><span>30분</span><span>' + durationLabel(maxIdx, tier) + '</span></div>'
        + '<div id="durReason" style="font-size:.8rem;color:var(--accent-deep);font-weight:700;margin-top:.7rem;min-height:1.2em;">' + reasonFor(v.index) + '</div>'
        + '<div style="display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin:.6rem 0 .8rem;">'
        + '<span style="font-size:.85rem;color:var(--gray);font-weight:600;">' + answers.frequency + ' · 월 ' + (answers.frequency === '주 2회' ? '8' : '4') + '회 기준</span>'
        + '<span id="durPrice" style="font-size:1.1rem;font-weight:800;"><span style="font-size:.72rem;color:var(--gray);font-weight:600;margin-right:3px;">총액</span>₩' + price.toLocaleString() + '</span>'
        + '</div>'
        + (tier === '이코노미'
          ? '<div style="font-size:.75rem;color:var(--ink);font-weight:700;border-top:1px solid var(--line);padding-top:.8rem;">이코노미 플랜은 30분~' + durationLabel(maxIdx, tier) + '까지 선택하실 수 있어요. <br> 더 긴 시간을 원하시면 스탠다드·프리미엄 플랜을 확인해보세요.</div>'
          : '<div style="font-size:.75rem;color:var(--ink);border-top:1px solid var(--line);padding-top:.8rem;">긴 시간을 한 번에 몰아 듣기 부담스러우시면, 이전 화면에서 주 2회로 나눠 진행하실 수도 있어요.</div>');
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
    const hours = ['9:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00','22:00','23:00','24:00'];
    const selectedArr = answers[step.key] || [];
    inner += '<div class="grid-wrap"><table class="time-grid" id="timeGrid"><thead><tr><th></th>';
    days.forEach(d => { inner += '<th>' + d + '</th>'; });
    inner += '</tr></thead><tbody>';
    hours.forEach(h => {
      inner += '<tr><td class="hour-label">' + h + '</td>';
      days.forEach(d => {
        const cellKey = d + ' ' + h;
        const isSel = selectedArr.indexOf(cellKey) > -1;
        inner += '<td class="grid-cell ' + (isSel ? 'selected' : '') + '" data-key="' + cellKey + '"></td>';
      });
      inner += '</tr>';
    });
    inner += '</tbody></table></div>';
    inner += ''
      + '<div class="field-label" style="margin-top:1rem;">표는 정각 시간만 보여드려요. 30분 단위(예: 9시 30분)로 가능하시면 아래에서 추가해주세요.<br>가능하신 시간을 전부 골라서 알려주시면 정확한 매칭에 더 도움이 돼요.<br> 선택 후 ➕를 눌러야 목록에 추가됩니다.</div>'
      + '<div id="noteChips" style="display:flex;flex-wrap:wrap;gap:.5rem;margin-bottom:.6rem;"></div>'
      + '<div class="note-add-row">'
      + '<select id="noteDay" style="flex:1;">'
      + '<option value="">요일</option>'
      + '<option>월요일</option><option>화요일</option><option>수요일</option><option>목요일</option><option>금요일</option><option>토요일</option><option>일요일</option>'
      + '</select>'
      + '<select id="noteHour" style="flex:1;"><option value="">30분 단위 시간</option></select>'
      + '<button type="button" class="note-add-btn" id="addNoteBtn">+</button>'
      + '</div>';
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
    const d = answers.duration || { index: 4 };
    const price = PRICE_TABLE[answers.tier] ? PRICE_TABLE[answers.tier][d.index] * FREQ_MULTIPLIER[answers.frequency] : 0;
    inner += ''
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
        const maxIdx = TIER_DURATION_MAX_INDEX[answers.tier] !== undefined ? TIER_DURATION_MAX_INDEX[answers.tier] : 10;
        if (answers.duration && answers.duration.index > maxIdx) {
          answers.duration = { index: maxIdx };
        }
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
      const durSlider = document.getElementById('durSlider');
      const maxIdx = parseInt(durSlider.max);
      const thumbW = 18;
      const leftForIdx = (idx) => {
        const trackW = durSlider.offsetWidth;
        const pct = idx / maxIdx;
        return thumbW / 2 + pct * (trackW - thumbW);
      };
      const reasonFor = (idx) => {
        if (idx === 0) return '점심시간·저녁시간에 가볍게 짧고 굵게';
        if (idx === 4) {
          return answers.tier === '이코노미'
            ? '이코노미에서 선택하실 수 있는 가장 넉넉한 시간이에요'
            : '단기간에 실력을 확 끌어올리고 싶은 분께';
        }
        return '';
      };
      const syncDuration = () => {
        const idx = parseInt(durSlider.value);
        answers.duration = { index: idx };
        document.getElementById('durTooltip').textContent = durationLabel(idx, answers.tier);
        document.getElementById('durTooltip').style.left = leftForIdx(idx) + 'px';
        document.getElementById('durReason').textContent = reasonFor(idx);
        document.getElementById('durPrice').innerHTML = '<span style="font-size:.72rem;color:var(--gray);font-weight:600;margin-right:3px;">총액</span>₩' + (PRICE_TABLE[answers.tier][idx] * FREQ_MULTIPLIER[answers.frequency]).toLocaleString();
        setNextState(step);
      };
      durSlider.addEventListener('input', syncDuration);
      document.getElementById('durTooltip').style.left = leftForIdx(parseInt(durSlider.value)) + 'px';

    } else if (step.type === 'date'){
    const dateInput = document.getElementById('dateInput');
    if (!answers[step.key]) { answers[step.key] = dateInput.value; }
    dateInput.addEventListener('input', () => {
      answers[step.key] = dateInput.value;
      setNextState(step);
    });
  } else if (step.type === 'rank'){
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
    const CHIP_DAYS = ['월요일','화요일','수요일','목요일','금요일','토요일','일요일'];
    const isChipEntry = v => CHIP_DAYS.some(d => v.indexOf(d) === 0);
    const syncAll = () => {
      qcardWrap.querySelectorAll('.grid-cell').forEach(c => {
        const sel = selectedArr.indexOf(c.dataset.key) > -1;
        c.classList.toggle('selected', sel);
      });
      const wrap = document.getElementById('noteChips');
      if (wrap) {
        const chipEntries = selectedArr.map((v,i)=>({v,i})).filter(o => isChipEntry(o.v));
        wrap.innerHTML = chipEntries.map(o => '<span class="note-chip">' + o.v + '<button type="button" data-i="' + o.i + '">✕</button></span>').join('');
        wrap.querySelectorAll('button').forEach(btn => {
          btn.addEventListener('click', () => {
            selectedArr.splice(parseInt(btn.dataset.i), 1);
            answers[step.key] = selectedArr;
            syncAll();
            setNextState(step);
          });
        });
      }
    };
    const applyCell = (cell, shouldSelect) => {
      const key = cell.dataset.key;
      const idx = selectedArr.indexOf(key);
      if (shouldSelect && idx === -1) { selectedArr.push(key); }
      else if (!shouldSelect && idx > -1) { selectedArr.splice(idx, 1); }
      answers[step.key] = selectedArr;
      syncAll();
      setNextState(step);
    };
    qcardWrap.querySelectorAll('.grid-cell').forEach(cell => {
      cell.addEventListener('mousedown', (e) => {
        e.preventDefault();
        dragState.isDragging = true;
        dragState.mode = selectedArr.indexOf(cell.dataset.key) === -1;
        applyCell(cell, dragState.mode);
      });
      cell.addEventListener('mouseenter', () => {
        if (dragState.isDragging) applyCell(cell, dragState.mode);
      });
      cell.addEventListener('touchend', (e) => {
        e.preventDefault();
        applyCell(cell, selectedArr.indexOf(cell.dataset.key) === -1);
      });
    });

    const noteDay = document.getElementById('noteDay');
    const noteHour = document.getElementById('noteHour');
    for (let h = 9; h <= 23; h++) {
      const opt = document.createElement('option');
      const label = h + ':30-' + (h + 1) + ':30';
      opt.value = label;
      opt.textContent = label;
      noteHour.appendChild(opt);
    }
    syncAll();
    document.getElementById('addNoteBtn').addEventListener('click', () => {
      if (noteDay.value && noteHour.value) {
        selectedArr.push(noteDay.value + ' ' + noteHour.value);
        answers[step.key] = selectedArr;
        noteDay.value = '';
        noteHour.value = '';
        syncAll();
        setNextState(step);
      }
    });
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
  const step = steps[current];
  if (!checkValid(step)) return;
  if (current === steps.length - 1) {
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
  params.append('submission[30]', a.tier || '');                      // 선택 플랜
  params.append('submission[31]', a.payment ? '완료' : '');           // 결제확인
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
    params.append('submission[41]', a.duration ? durationLabel(a.duration.index, a.tier) : ''); // 수업 시간    params.append('submission[28]', a.notes || '');                     // 문의사항
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
    + '<strong>선택 플랜</strong> · ' + (a.tier || '-') + ' · ' + (a.frequency || '-') + ' · ' + (a.duration ? durationLabel(a.duration.index, a.tier) : '-') + '<br>'    + '<strong>나이대</strong> · ' + (a.ageGroup || '-') + '<br>'
    + '<strong>영어 수준</strong> · ' + (a.level || '-') + '<br>'
    + '<strong>학습 목표</strong> · ' + ((a.goals||[]).map(g => g === '기타' && a.goalsOther ? '기타(' + a.goalsOther + ')' : g).join(', ') || '-') + '<br>'
    + '<strong>희망 시간대</strong> · ' + ((a.schedule||[]).join(', ') || '-') + '<br>'
    + '<strong>진행 방식</strong> · ' + ((a.place||[]).length ? (a.place||[]).map((p,i)=>(i+1)+'.'+p).join(', ') : '-') + '<br>'
    + '<strong>유입 경로</strong> · ' + ((a.referral||[]).join(', ') || '-') + '<br>'
    + '<strong>연락처</strong> · ' + (a.contact ? a.contact.name + ' · ' + a.contact.phone : '-');
  submitToJotform(a);
  console.log('신청 데이터:', a);
}

renderStep();
