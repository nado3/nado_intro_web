const DURATIONS = ['1시간', '2시간'];

const PRICE_TABLE = {
  '이코노미': [140000, 280000],
  '스탠다드': [180000, 360000],
  '프리미엄': [220000, 440000]
};

const FREQ_MULTIPLIER = {
  '주 1회': 1,
  '주 2회': 2,
  '체험 1회': 0.25
};

const TRIAL_DEPOSIT = 20000;
const ECONOMY_SONGDO_DISCOUNT = 20000;


/* =========================================================
   HELPERS
========================================================= */

function durationLabel(idx) {
  return DURATIONS[idx] || DURATIONS[0];
}

function freqLabel(freq) {
  return freq === '체험 1회'
    ? '1회 무료 체험'
    : freq;
}

function placeLabel(a) {
  if (a.placeType === '송도 할인 장소') {
    return '송도 지정 장소' +
      (a.songdoPlace ? ' · ' + a.songdoPlace : '');
  }

  if (
    a.placeType === '인천 원하는 장소' ||
    a.placeType === '서울 원하는 장소'
  ) {
    const city =
      a.placeType === '인천 원하는 장소'
        ? '인천'
        : '서울';

    const preferredPlace =
      (a.preferredPlace || '').trim();

    return (
      city +
      ' 희망 장소' +
      (preferredPlace ? ' · ' + preferredPlace : '') +
      ' (최종 장소 추후 조율)'
    );
  }

  return (a.place || []).join(', ') || '-';
}


/* =========================================================
   STEPS
========================================================= */

const steps = [

  /* 1. PLAN */
  {
    key: 'tier',
    type: 'tier',
    required: true,
    title: '어떤 플랜을 원하시나요?',
    sub: '수업 시간은 다음 단계에서 선택하실 수 있어요.',
    options: [

      {
        name: '이코노미',
        desc: '영어 회화 실력이 검증된 선생님과 부담 없이 시작',

        more:
          '<span class="reco-badge">학생/직장인 추천</span><br>' +
          '· 학적 인증 완료 대학생 선생님<br>' +
          '· 인천에서 수업 가능<br>' +
          '· 일상 영어회화 중심<br>' +
          '· 송도 지정 장소 선택 시 월 2만원 할인'
      },

      {
        name: '스탠다드',
        badge: 'Most Popular',

        desc: '충분한 경험과 노하우가 있는 선생님',

        more:
          '<span class="reco-badge">학생/직장인 추천</span><br>' +
          '· 원하는 시간 우선 배치<br>' +
          '· 인천·송도에서 수업 가능<br>' +
          '· 세부 장소는 선생님과 조율<br>' +
          '· 비즈니스 영어 선택 가능<br>' +
          '· 해외 대학 + 영어회화 교육 경험이 많은 선생님<br>' +
          '· 학적 인증 완료 대학생 선생님'
      },

      {
        name: '프리미엄',

        desc: '나도 최우수 선생님 3명 중 선택',

        more:
          '<span class="reco-badge">뚜렷한 목적이 있고 영어 회화 실력 급상승이 필요한 분께 추천</span><br>' +
          '· 원하는 시간 우선 배치<br>' +
          '· 인천·송도에서 수업 가능<br>' +
          '· 세부 장소는 선생님과 조율<br>' +
          '· 비즈니스 영어 선택 가능<br>' +
          '· 학적 인증 완료 대학생 선생님<br>' +
          '· 나도 <strong>최우수 선생님</strong>' +
          '<span class="tip-icon">?' +
          '<span class="tip-bubble">' +
          '<u>최우수 선생님</u>은 학생 만족도, 수업 지속률, 피드백 평가 등을 종합하여 선정된 상위 선생님입니다.' +
          '</span>' +
          '</span> 3명 중 선택'
      }
    ]
  },


  /* 2. DURATION */
  {
    key: 'duration',
    type: 'duration',
    required: true,

    title: '수업 시간을 선택해주세요',

    sub:
      '1시간 또는 2시간을 선택하면 플랜·빈도에 따른 가격을 바로 확인할 수 있어요.'
  },


  /* 3. PLACE */
  {
    key: 'place',
    type: 'rank',
    required: true
  },


  /* 4. AGE */
  {
    key: 'ageGroup',
    type: 'single',
    required: true,

    title:
      '나이대가 어떻게 되시나요?',

    options: [
      '초등학생',
      '중고등학생',
      '20대',
      '30대',
      '40대',
      '50대 이상'
    ]
  },


  /* 5. GENDER */
  {
    key: 'gender',
    type: 'single',
    required: true,

    title:
      '성별이 어떻게 되시나요?',

    options: [
      '남성',
      '여성',
      '응답하지 않음'
    ]
  },


  /* 6. LEVEL */
  {
    key: 'level',
    type: 'single',
    required: true,

    title:
      '현재 영어 수준은 어느 정도인가요?',

    options: [
      '초급 (기초 단어·문장)',
      '중급 (일상 대화 가능)',
      '고급 (자유로운 회화)'
    ]
  },


  /* 7. GOALS */
  {
    key: 'goals',
    type: 'multi',
    required: true,

    title:
      '어떤 목표로 영어를 배우고 싶으신가요?',

    sub:
      '중복 선택 가능해요.',

    options: [
      '일상회화',
      '비즈니스',
      '여행영어',
      '시험/면접 준비',
      '발음교정',
      '기타'
    ]
  },


  /* 8. SCHEDULE */
  {
    key: 'schedule',
    type: 'gridtime',
    required: true,

    title:
      '가능한 시간대를 선택해주세요',

    sub:
      'PC에서는 드래그로, 모바일에서는 하나씩 눌러서 선택할 수 있어요.'
  },


  /* 9. START DATE */
  {
    key: 'startDate',
    type: 'date',
    required: true,

    title:
      '언제부터 수업을 시작하고 싶으신가요?',

    sub:
      '희망하시는 첫 수업 날짜를 선택해주세요.<br>' +
      '선생님 일정에 따라, 희망하신 날짜보다 첫 수업이 조금 늦어지거나 빨라질 수 있어요.'
  },


  /* 10. NOTES */
  {
    key: 'notes',
    type: 'text',
    required: false,

    title:
      '추가로 전달하고 싶은 내용이 있으신가요?',

    sub:
      '선택 사항이에요.',

    placeholder:
      '예: 발표 준비 때문에 비즈니스 표현 위주로 배우고 싶어요',

    quickFill:
      '선생님과 상담 시 논의할게요'
  },


  /* 11. REFERRAL */
  {
    key: 'referral',
    type: 'multi',
    required: true,

    title:
      '나도를 어떻게 알게 되셨나요?',

    sub:
      '중복 선택 가능해요.',

    options: [
      '당근마켓 광고',
      '인스타그램',
      '지인 추천',
      '유튜브',
      '구글 광고',
      '기타'
    ]
  },


  /* 12. CONTACT */
  {
    key: 'contact',
    type: 'contact',
    required: true,

    title:
      '마지막이에요! 연락처를 남겨주세요',

    sub:
      '매칭 결과를 이 번호로 안내드려요.'
  },


  /* 13. PAYMENT */
  {
    key: 'payment',
    type: 'payment',
    required: true,

    title:
      '결제 안내',

    sub:
      '결제 금액을 확인해주세요. 선생님 매칭이 완료된 후 ' +
      '<strong style="color:var(--ink);">카카오톡으로</strong> ' +
      '결제 방법을 안내해드릴 예정입니다.'
  }
];


/* =========================================================
   BASIC STATE
========================================================= */

const TRIAL_MODE =
  document.body.dataset.mode === 'trial';

const activeSteps =
  steps.filter(step =>
    !(TRIAL_MODE && step.key === 'tier')
  );

let current = 0;

const answers = {
  frequency:
    TRIAL_MODE
      ? '체험 1회'
      : '주 1회',
  preferredPlace: ''
};

if (TRIAL_MODE) {
  answers.tier = '이코노미';
}

const historyEl =
  document.getElementById('history');

const qcardWrap =
  document.getElementById('qcardWrap');

const progressFill =
  document.getElementById('progressFill');

const nextBtn =
  document.getElementById('nextBtn');

const skipBtn =
  document.getElementById('skipBtn');

const backBtn =
  document.getElementById('backBtn');

const dragState = {
  isDragging: false,
  mode: true
};

document.addEventListener(
  'mouseup',
  () => {
    dragState.isDragging = false;
  }
);

let scheduleActiveDay = '월';


/* =========================================================
   PRICE
========================================================= */

function calcPrice(tier, idx, freq) {

  if (TRIAL_MODE) {
    return 0;
  }

  if (!PRICE_TABLE[tier]) {
    return 0;
  }

  const multiplier =
    FREQ_MULTIPLIER[freq] || 1;

  let raw =
    PRICE_TABLE[tier][idx] *
    multiplier;


  /*
    정규 Economy에서
    송도 할인 장소를 선택한 경우만
    월 20,000원 할인
  */
  const songdoDiscountSelected =
    tier === '이코노미' &&
    answers.placeType ===
      '송도 할인 장소';


  if (songdoDiscountSelected) {
    raw -=
      ECONOMY_SONGDO_DISCOUNT;
  }

  return Math.max(raw, 0);
}


/* =========================================================
   PROGRESS
========================================================= */

function updateProgress() {

  const pct =
    Math.round(
      (
        current /
        activeSteps.length
      ) *
      100
    );

  progressFill.style.width =
    pct + '%';
}


/* =========================================================
   HISTORY LABEL
========================================================= */

function labelFor(step, value) {

  if (step.type === 'multi') {

    return (
      Array.isArray(value) &&
      value.length
    )
      ? value.join(', ')
      : '';
  }


  if (step.type === 'rank') {

    if (
      !Array.isArray(value) ||
      !value.length
    ) {
      return '';
    }


    if (TRIAL_MODE) {
      return placeLabel(answers);
    }


    if (
      answers.tier === '이코노미' &&
      answers.placeType ===
        '송도 할인 장소' &&
      answers.songdoPlace
    ) {

      return (
        '송도 할인 장소 · ' +
        answers.songdoPlace
      );
    }


    return value.join(', ');
  }


  if (step.type === 'gridtime') {

    return (
      Array.isArray(value) &&
      value.length
    )
      ? value.length +
          '개 시간대 선택'
      : '';
  }


  if (step.type === 'contact') {

    return (
      value &&
      value.name
    )
      ? value.name +
          ' · ' +
          (
            value.phone ||
            ''
          )
      : '';
  }


  if (step.type === 'payment') {

    return value === true
      ? '확인 완료'
      : '';
  }


  if (step.type === 'duration') {

    return value
      ? durationLabel(
          value.index
        )
      : '';
  }


  return value || '';
}


/* =========================================================
   HISTORY
========================================================= */

function renderHistory() {

  historyEl.innerHTML = '';


  for (
    let i = 0;
    i < current;
    i++
  ) {

    const step =
      activeSteps[i];

    const val =
      answers[step.key];

    const text =
      labelFor(
        step,
        val
      );


    if (!text) {
      continue;
    }


    const item =
      document.createElement(
        'div'
      );

    item.className =
      'history-item';


    item.innerHTML =
      '<div class="history-bubble">' +
      text +
      '</div>' +

      '<button class="history-edit" data-idx="' +
      i +
      '">' +
      '수정' +
      '</button>';


    historyEl.appendChild(
      item
    );
  }


  historyEl
    .querySelectorAll(
      '.history-edit'
    )
    .forEach(btn => {

      btn.addEventListener(
        'click',
        () => {

          current =
            parseInt(
              btn.dataset.idx,
              10
            );

          renderStep();
        }
      );
    });
}


/* =========================================================
   VALIDATION
========================================================= */

function checkValid(step) {

  const v =
    answers[step.key];


  if (!step.required) {
    return true;
  }


  if (step.type === 'single') {
    return !!v;
  }


  if (step.type === 'tier') {
    return !!v;
  }


  if (step.type === 'multi') {

    return (
      Array.isArray(v) &&
      v.length > 0
    );
  }


  if (step.type === 'rank') {

    if (
      !Array.isArray(v) ||
      v.length === 0
    ) {
      return false;
    }


    if (
      TRIAL_MODE &&
      (
        answers.placeType ===
          '인천 원하는 장소' ||
        answers.placeType ===
          '서울 원하는 장소'
      )
    ) {

      return !!(
        answers.preferredPlace &&
        answers.preferredPlace.trim()
      );
    }


    /*
      정규 Economy에서
      송도 할인 장소를 선택했다면

      IGC 또는 트리플스트리트까지
      골라야 다음 버튼 활성화
    */
    if (
      (TRIAL_MODE || answers.tier === '이코노미') &&
      answers.placeType ===
        '송도 할인 장소'
    ) {

      return !!answers.songdoPlace;
    }


    return true;
  }


  if (step.type === 'date') {
    return !!v;
  }


  if (step.type === 'gridtime') {

    return (
      Array.isArray(v) &&
      v.length > 0
    );
  }


  if (step.type === 'duration') {

    return (
      v &&
      typeof v.index ===
        'number'
    );
  }


  if (step.type === 'text') {
    return true;
  }


  if (step.type === 'contact') {

    return (
      v &&
      v.name &&
      v.name.trim() &&
      v.phoneValid &&
      v.consent === true
    );
  }


  if (step.type === 'payment') {

    return v === true;
  }


  return false;
}


/* =========================================================
   NEXT BUTTON
========================================================= */

function setNextState(step) {

  const valid =
    checkValid(step);


  nextBtn.classList.toggle(
    'active',
    valid
  );


  nextBtn.disabled =
    !valid;


  nextBtn.textContent =
    current ===
      activeSteps.length - 1

      ? '제출하기'
      : '다음';


  skipBtn.style.display =
    step.required
      ? 'none'
      : 'block';
}


/* =========================================================
   RENDER STEP
========================================================= */

function renderStep() {

  if (
    current >=
    activeSteps.length
  ) {

    showSuccess();

    return;
  }


  const step =
    activeSteps[current];


  updateProgress();
  renderHistory();


  backBtn.style.visibility =
    current === 0
      ? 'hidden'
      : 'visible';


  let title =
    step.title;

  let sub =
    step.sub;


  const isEconomy =
    answers.tier ===
      '이코노미';


  /* =========================================================
     FREE TRIAL — BUSINESS DISABLED
  ========================================================= */

  if (
    TRIAL_MODE &&
    step.key === 'goals'
  ) {

    sub =
      '중복 선택 가능해요. 무료 체험에서는 비즈니스 영어가 제공되지 않습니다.';
  }


  /* =========================================================
     PLACE OPTIONS
  ========================================================= */

  let RANK_OPTIONS = [];


  /*
    무료체험

    인천/서울 원하는 장소 또는 송도 할인 장소
  */
  if (TRIAL_MODE) {

    RANK_OPTIONS = [
      '인천 원하는 장소',
      '서울 원하는 장소',
      '송도 할인 장소'
    ];
  }


  /*
    정규 Economy

    1. 인천 원하는 장소
    2. 송도 할인 장소
  */
  else if (isEconomy) {

    RANK_OPTIONS = [
      '인천 원하는 장소',
      '송도 할인 장소'
    ];
  }


  /*
    Standard / Premium
  */
  else {

    RANK_OPTIONS = [
      '인천',
      '송도'
    ];
  }


  /* =========================================================
     PLACE TITLE
  ========================================================= */

  if (
    step.type === 'rank'
  ) {


    if (TRIAL_MODE) {

      title =
        '무료 체험 장소 선택';

      sub =
        '인천·서울은 희망 장소를 입력하고, 송도는 지정 장소를 선택해주세요.';
    }


    else if (isEconomy) {

      title =
        '수업 장소를 선택해주세요';

      sub =
        '인천의 원하는 장소에서 진행하거나, 송도 지정 장소를 선택하면 월 2만원 할인받을 수 있어요.';
    }


    else {

      title =
        '수업 지역을 선택해주세요';

      sub =
        '인천 또는 송도를 선택해주세요. 세부 장소는 매칭 후 선생님과 조율합니다.';
    }
  }


  /* =========================================================
     TRIAL TITLE
  ========================================================= */

  if (
    TRIAL_MODE &&
    step.type ===
      'duration'
  ) {

    title =
      '무료 체험 수업 안내';

    sub =
      '이코노미 플랜으로 1시간 동안 무료 체험 수업을 진행해드려요.';
  }


  if (
    TRIAL_MODE &&
    step.type ===
      'payment'
  ) {

    title =
      '노쇼 방지 보증금 안내';

    sub =
      '체험 수업 자체는 무료이지만, 노쇼 방지를 위해 소정의 보증금을 받고 있어요.';
  }


  /* =========================================================
     CARD
  ========================================================= */

  let inner =
    '<div class="qcard">' +

    '<div class="qtitle">' +
    title +
    '</div>';


  if (sub) {

    inner +=
      '<div class="qsub">' +
      sub +
      '</div>';
  }


  /* =========================================================
     TIER
  ========================================================= */

  if (
    step.type === 'tier'
  ) {


    inner +=
      '<div style="display:flex;justify-content:flex-end;margin-bottom:1rem;">' +

      '<button type="button" id="freqToggle" style="background:var(--navy);color:#fff;border:none;padding:.5rem 1.1rem;border-radius:2rem;font-weight:800;font-size:.85rem;cursor:pointer;display:flex;align-items:center;gap:.35rem;">' +

      answers.frequency +

      '<span style="font-size:.68rem;opacity:.75;">↻ 변경</span>' +

      '</button>' +

      '</div>';


    inner +=
      '<div class="opt-list">';


    step.options.forEach(
      (opt, idx) => {


        const businessSelected =
          (
            answers.goals ||
            []
          ).includes(
            '비즈니스'
          );


        const isDisabled =
          businessSelected &&
          opt.name ===
            '이코노미';


        const isSel =
          answers.tier ===
            opt.name;


        const displayPrice =
          PRICE_TABLE[
            opt.name
          ][0] *
          (
            FREQ_MULTIPLIER[
              answers.frequency
            ] ||
            1
          );


        inner +=
          '<div class="tier-opt ' +

          (
            isSel
              ? 'selected '
              : ''
          ) +

          (
            isDisabled
              ? 'disabled'
              : ''
          ) +

          '" data-value="' +
          opt.name +

          '" data-disabled="' +
          isDisabled +

          '">' +


          (
            opt.badge

              ? '<div class="tier-opt-badge">' +
                opt.badge +
                '</div>'

              : ''
          ) +


          '<div class="tier-opt-top">' +


          '<div class="tier-opt-name">' +
          opt.name +
          '</div>' +


          '<div class="tier-opt-price">₩' +
          displayPrice.toLocaleString() +
          '~</div>' +


          '</div>' +


          '<div class="tier-opt-desc">' +
          opt.desc +
          '</div>' +


          (
            isDisabled

              ? '<div style="margin-top:.45rem;color:#E85C5C;font-size:.8rem;font-weight:700;">' +
                '비즈니스 영어는 스탠다드 이상에서 이용할 수 있어요.' +
                '</div>'

              : ''
          ) +


          '<div class="tier-more ' +
          (
            isSel
              ? 'open'
              : ''
          ) +
          '" id="tierMore' +
          idx +
          '">' +


          opt.more +


          '</div>' +
          '</div>';
      }
    );


    inner +=
      '</div>';


    inner +=
      '<div style="font-size:.75rem;color:var(--gray);margin-top:.5rem;">' +
      '주 3회 이상 수업을 원하시면 홈페이지 우측 하단 상담 채팅으로 문의해주세요.' +
      '</div>';
  }


  /* =========================================================
     DURATION
  ========================================================= */

  else if (
    step.type === 'duration'
  ) {


    const tier =
      answers.tier;


    let v =
      answers.duration || {
        index: 0
      };


    if (
      v.index < 0 ||
      v.index >=
        DURATIONS.length
    ) {

      v = {
        index: 0
      };
    }


    if (TRIAL_MODE) {

      v = {
        index: 0
      };
    }


    answers.duration =
      v;


    if (TRIAL_MODE) {


      inner +=
        '<div style="background:var(--accent-light);border-radius:1.1rem;padding:1.4rem 1.2rem;display:flex;align-items:center;justify-content:space-between;gap:1rem;">' +

        '<div>' +

        '<div style="font-size:1.15rem;font-weight:800;color:var(--accent-deep);">' +
        '1시간 무료 체험 수업' +
        '</div>' +

        '</div>' +

        '<div style="font-size:1.2rem;font-weight:900;color:var(--accent-deep);white-space:nowrap;">무료</div>' +

        '</div>';
    }


    else {


      const basePrice =
        PRICE_TABLE[tier][
          v.index
        ] *
        (
          FREQ_MULTIPLIER[
            answers.frequency
          ] ||
          1
        );


      inner +=
        '<div class="duration-options">' +


        '<button type="button" class="duration-opt ' +
        (
          v.index === 0
            ? 'selected'
            : ''
        ) +
        '" data-index="0">' +

        '<span class="duration-opt-time">1시간</span>' +
        '<span class="duration-opt-desc">꾸준히 집중해서 배우기</span>' +

        '</button>' +


        '<button type="button" class="duration-opt ' +
        (
          v.index === 1
            ? 'selected'
            : ''
        ) +
        '" data-index="1">' +

        '<span class="duration-opt-time">2시간</span>' +
        '<span class="duration-opt-desc">한 번에 깊이 있게 배우기</span>' +

        '</button>' +


        '</div>' +


        '<div style="display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin:1.2rem 0 .8rem;">' +


        '<span style="font-size:.85rem;color:var(--gray);font-weight:600;">' +

        answers.frequency +

        ' · 월 ' +

        (
          answers.frequency ===
          '주 2회'
            ? '8'
            : '4'
        ) +

        '회 기준</span>' +


        '<span id="durPrice" style="font-size:1.1rem;font-weight:800;">' +

        '<span style="font-size:.72rem;color:var(--gray);font-weight:600;margin-right:3px;">총액</span>' +

        '₩' +
        basePrice.toLocaleString() +

        '</span>' +


        '</div>';


      if (
        tier ===
          '이코노미'
      ) {

        inner +=
          '<div style="font-size:.78rem;color:var(--accent-deep);font-weight:700;margin-top:.4rem;">' +

          '송도 지정 장소를 선택하면 월 2만원 할인됩니다.' +

          '</div>';
      }
    }
  }


  /* =========================================================
     PLACE
  ========================================================= */

  else if (
    step.type === 'rank'
  ) {


    const selected =
      answers[step.key] ||
      [];


    inner +=
      '<div class="opt-list">';


    RANK_OPTIONS.forEach(
      opt => {


        const isSel =
          selected.includes(opt);


        let extra = '';

        let optionTitle =
          opt;

        let optionMeta = '';


        if (TRIAL_MODE) {

          if (opt === '인천 원하는 장소') {
            optionTitle =
              '인천에서 희망하는 장소';

            optionMeta =
              '<div class="place-option-meta">' +
              '대략적인 장소 입력 · 추후 조율' +
              '</div>';
          }


          else if (opt === '서울 원하는 장소') {
            optionTitle =
              '서울에서 희망하는 장소';

            optionMeta =
              '<div class="place-option-meta">' +
              '대략적인 장소 입력 · 추후 조율' +
              '</div>';
          }


          else if (opt === '송도 할인 장소') {
            optionTitle =
              '송도 지정 장소';

            optionMeta =
              '<div class="place-option-meta">' +
              'IGC·트리플스트리트' +
              '</div>' +
              '<div class="place-discount-badge">' +
              '정규 등록 시 월 2만원 할인' +
              '</div>';
          }
        }


        /*
          Economy
          인천 원하는 장소
        */
        if (
          !TRIAL_MODE &&
          isEconomy &&
          opt ===
            '인천 원하는 장소'
        ) {


          const normalPrice =
            PRICE_TABLE[
              '이코노미'
            ][
              answers.duration
                ? answers.duration.index
                : 0
            ] *
            (
              FREQ_MULTIPLIER[
                answers.frequency
              ] ||
              1
            );


          extra =
            '<div style="font-size:.82rem;color:var(--gray);margin-top:.3rem;">' +

            '세부 장소는 선생님과 조율 · ₩' +

            normalPrice.toLocaleString() +

            '</div>';
        }


        /*
          Economy
          송도 할인
        */
        if (
          !TRIAL_MODE &&
          isEconomy &&
          opt ===
            '송도 할인 장소'
        ) {


          const discountedPrice =
            Math.max(
              (
                PRICE_TABLE[
                  '이코노미'
                ][
                  answers.duration
                    ? answers.duration.index
                    : 0
                ] *
                (
                  FREQ_MULTIPLIER[
                    answers.frequency
                  ] ||
                  1
                )
              ) -

              ECONOMY_SONGDO_DISCOUNT,

              0
            );


          extra =
            '<div style="font-size:.82rem;color:var(--accent-deep);font-weight:700;margin-top:.3rem;">' +

            'IGC 또는 트리플스트리트 · ₩' +

            discountedPrice.toLocaleString() +

            ' · 월 2만원 할인' +

            '</div>';
        }


        inner +=
          '<div class="opt rank ' +

          (
            isSel
              ? 'selected'
              : ''
          ) +

          '" data-value="' +
          opt +
          '">' +


          '<div class="opt-rank-badge">' +

          (
            isSel
              ? '✓'
              : ''
          ) +

          '</div>' +


          '<div class="opt-label">' +

          optionTitle +

          optionMeta +

          extra +

          '</div>' +


          '</div>';


        if (
          TRIAL_MODE &&
          isSel &&
          (
            opt === '인천 원하는 장소' ||
            opt === '서울 원하는 장소'
          )
        ) {

          const preferredCity =
            opt === '인천 원하는 장소'
              ? '인천'
              : '서울';

          const preferredPlaceholder =
            preferredCity === '인천'
              ? '예: 부평역 근처 카페'
              : '예: 홍대입구역 근처 카페';


          inner +=
            '<div class="preferred-place-wrap">' +

            '<label class="sr-only" for="preferredPlaceInput">' +
            preferredCity +
            ' 희망 장소' +
            '</label>' +

            '<input type="text" id="preferredPlaceInput" placeholder="' +
            preferredPlaceholder +
            '" value="' +
            (answers.preferredPlace || '') +
            '">' +

            '<div class="preferred-place-help">' +
            '최종 장소는 선생님과 조율해요.' +
            '</div>' +

            '</div>';
        }
      }
    );


    inner +=
      '</div>';


    /*
      무료체험 또는 정규 Economy

      송도 할인 장소 선택 후
      두 지정 장소 중 선택
    */
    if (
      (TRIAL_MODE || isEconomy) &&
      answers.placeType ===
        '송도 할인 장소'
    ) {


      inner +=
        '<div id="songdoPlaceWrap" style="margin-top:1.2rem;">' +


        '<div class="field-label">' +
        '송도에서 수업할 장소를 선택해주세요' +
        '</div>' +


        '<div class="qsub" style="margin-top:-.2rem;">' +
        (TRIAL_MODE
          ? '무료 체험 장소를 아래 두 곳 중에서 선택해주세요. 정규 수업 등록 후에도 이 장소를 이용하면 월 2만원 할인됩니다.'
          : '송도 할인은 아래 두 지정 장소에서 진행할 때 적용됩니다.') +
        '</div>' +


        '<div class="opt-list">' +


        '<div class="opt songdo-sub-place ' +

        (
          answers.songdoPlace ===
          'IGC 인천글로벌캠퍼스'

            ? 'selected'
            : ''
        ) +

        '" data-value="IGC 인천글로벌캠퍼스">' +


        '<div class="opt-dot"></div>' +

        '<div class="opt-label">' +
        'IGC 인천글로벌캠퍼스' +
        '</div>' +

        '</div>' +


        '<div class="opt songdo-sub-place ' +

        (
          answers.songdoPlace ===
          '송도 트리플스트리트'

            ? 'selected'
            : ''
        ) +

        '" data-value="송도 트리플스트리트">' +


        '<div class="opt-dot"></div>' +

        '<div class="opt-label">' +
        '송도 트리플스트리트' +
        '</div>' +


        '</div>' +


        '</div>' +
        '</div>';
    }


  }


  /* =========================================================
     DATE
  ========================================================= */

  else if (
    step.type === 'date'
  ) {


    const now =
      new Date();


    const today =
      new Date(
        now.getTime() -
        now.getTimezoneOffset() *
        60000
      )
        .toISOString()
        .split('T')[0];


    const val =
      answers[step.key] ||
      today;


    inner +=
      '<input type="date" id="dateInput" min="' +
      today +
      '" value="' +
      val +
      '">';
  }


  /* =========================================================
     SINGLE / MULTI
  ========================================================= */

  else if (
    step.type === 'single' ||
    step.type === 'multi'
  ) {


    const selected =
      answers[step.key] ||
      (
        step.type === 'multi'
          ? []
          : null
      );


    const visibleOptions =
      TRIAL_MODE &&
      step.key === 'goals'

        ? step.options.filter(
            opt =>
              opt !==
              '비즈니스'
          )

        : step.options;


    inner +=
      '<div class="opt-list">';


    visibleOptions.forEach(
      opt => {


        const isSel =
          step.type === 'multi'

            ? selected.includes(opt)

            : selected === opt;


        inner +=
          '<div class="opt ' +

          (
            step.type ===
            'multi'
              ? 'multi'
              : ''
          ) +

          ' ' +

          (
            isSel
              ? 'selected'
              : ''
          ) +

          '" data-value="' +
          opt +
          '">' +


          '<div class="opt-dot"></div>' +

          '<div class="opt-label">' +
          opt +
          '</div>' +

          '</div>';
      }
    );


    inner +=
      '</div>';


    if (
      step.key ===
        'referral'
    ) {


      const showOther =
        selected.includes(
          '기타'
        );


      inner +=
        '<div id="referralOtherWrap" style="margin-top:.8rem;' +

        (
          showOther
            ? ''
            : 'display:none;'
        ) +

        '">' +

        '<input type="text" id="referralOtherInput" placeholder="어떻게 알게 되셨는지 적어주세요" value="' +

        (
          answers.referralOther ||
          ''
        ) +

        '">' +

        '</div>';
    }


    if (
      step.key ===
        'goals'
    ) {


      const showOther =
        selected.includes(
          '기타'
        );


      inner +=
        '<div id="goalsOtherWrap" style="margin-top:.8rem;' +

        (
          showOther
            ? ''
            : 'display:none;'
        ) +

        '">' +

        '<input type="text" id="goalsOtherInput" placeholder="원하시는 목표를 적어주세요" value="' +

        (
          answers.goalsOther ||
          ''
        ) +

        '">' +

        '</div>';
    }
  }


  /* =========================================================
     GRID TIME
  ========================================================= */

  else if (
    step.type === 'gridtime'
  ) {


    const days = [
      '월',
      '화',
      '수',
      '목',
      '금',
      '토',
      '일'
    ];


    const slots = [];


    for (
      let h = 9;
      h < 24;
      h++
    ) {

      slots.push(
        h + ':00'
      );

      slots.push(
        h + ':30'
      );
    }


    slots.push(
      '24:00'
    );


    const selectedArr =
      answers[step.key] ||
      [];


    inner +=
      '<div class="day-tabs" id="dayTabs">';


    days.forEach(
      d => {


        const count =
          selectedArr.filter(
            v =>
              v.indexOf(
                d + ' '
              ) === 0
          ).length;


        inner +=
          '<button type="button" class="day-tab ' +

          (
            d ===
            scheduleActiveDay

              ? 'active'
              : ''
          ) +

          '" data-day="' +
          d +
          '">' +


          d +


          (
            count > 0

              ? '<span class="day-tab-badge">' +
                count +
                '</span>'

              : ''
          ) +


          '</button>';
      }
    );


    inner +=
      '</div>';


    inner +=
      '<div class="time-slot-grid" id="timeSlotGrid">';


    slots.forEach(
      t => {


        const key =
          scheduleActiveDay +
          ' ' +
          t;


        const isSel =
          selectedArr.indexOf(
            key
          ) > -1;


        inner +=
          '<div class="time-slot ' +

          (
            isSel
              ? 'selected'
              : ''
          ) +

          '" data-key="' +
          key +
          '">' +

          t +

          '</div>';
      }
    );


    inner +=
      '</div>';


    inner +=
      '<div class="field-label" style="margin-top:1rem;">' +

      '30분 단위로 가능한 시간을 모두 선택해주세요.<br>' +

      '요일 탭을 눌러 다른 요일도 선택할 수 있어요.' +

      '</div>';
  }


  /* =========================================================
     TEXT
  ========================================================= */

  else if (
    step.type === 'text'
  ) {


    const val =
      answers[step.key] ||
      '';


    inner +=
      '<textarea id="textInput" placeholder="' +

      (
        step.placeholder ||
        ''
      ) +

      '">' +

      val +

      '</textarea>';


    if (
      step.quickFill
    ) {

      inner +=
        '<button class="quick-fill" id="quickFillBtn">"' +

        step.quickFill +

        '"</button>';
    }
  }


  /* =========================================================
     CONTACT
  ========================================================= */

  else if (
    step.type === 'contact'
  ) {


    const v =
      answers[step.key] || {

        name: '',
        phone: '',
        consent: false
      };


    inner +=

      '<div class="field-label">이름</div>' +

      '<input type="text" id="nameInput" placeholder="홍길동" value="' +

      (
        v.name ||
        ''
      ) +

      '">' +


      '<div class="field-label">연락처</div>' +

      '<input type="tel" id="phoneInput" placeholder="010-0000-0000" value="' +

      (
        v.phone ||
        ''
      ) +

      '">' +


      '<div class="consent-box">' +


      '<label class="consent-row">' +


      '<input type="checkbox" id="consentCheck" ' +

      (
        v.consent
          ? 'checked'
          : ''
      ) +

      '>' +


      '<span>개인정보 수집·이용에 동의합니다 <span class="required-mark">(필수)</span></span>' +


      '</label>' +


      '<button type="button" class="consent-toggle" id="consentToggle">자세히 보기</button>' +


      '<div class="consent-detail" id="consentDetail" style="display:none;">' +


      '<strong>수집 항목</strong> 이름, 연락처, 영어 수준, 학습 목표, 희망 시간대, 수업 장소, 문의사항<br>' +


      '<strong>수집 목적</strong> 선생님 매칭 및 상담을 위한 연락<br>' +


      '<strong>보유 기간</strong> 목적 달성 시 지체 없이 파기 (관련 법령에 따른 보관 예외 있음)<br>' +


      '동의를 거부하실 수 있으며, 다만 동의하지 않으실 경우 매칭 서비스 신청이 어렵습니다.<br><br>' +


      '자세한 내용은 ' +


      '<a href="privacy.html" target="_blank" style="color:var(--accent);font-weight:700;">개인정보처리방침</a>' +


      ' 및 ' +


      '<a href="terms.html" target="_blank" style="color:var(--accent);font-weight:700;">이용약관</a>' +


      ' 전문을 확인해주세요.' +


      '</div>' +

      '</div>';
  }


  /* =========================================================
     PAYMENT
  ========================================================= */

  else if (
    step.type === 'payment'
  ) {


    /*
      FREE TRIAL
    */
    if (TRIAL_MODE) {


      const trialPlace = placeLabel(answers);


      inner +=

        '<div class="pay-box">' +


        '<div class="pay-row">' +

        '<span>선택 플랜</span>' +

        '<strong>이코노미(체험)</strong>' +

        '</div>' +

        (
          answers.placeType === '송도 할인 장소'
            ? '<div class="pay-row">' +
              '<span>정규 수업 등록 시 할인</span>' +
              '<strong style="color:var(--accent-deep);">월 -₩' +
              ECONOMY_SONGDO_DISCOUNT.toLocaleString() +
              '</strong>' +
              '</div>'
            : ''
        ) +


        '<div class="pay-row">' +

        '<span>수업 시간</span>' +

        '<strong>1시간</strong>' +

        '</div>' +


        '<div class="pay-row">' +

        '<span>수업 장소</span>' +

        '<strong>' +
        trialPlace +
        '</strong>' +

        '</div>' +


        '<div class="pay-row">' +

        '<span>노쇼 방지 보증금</span>' +

        '<strong>₩' +
        TRIAL_DEPOSIT.toLocaleString() +
        '</strong>' +

        '</div>' +


        '</div>' +


        '<div class="qsub" style="margin-top:-.4rem;">' +


        '<strong style="color:var(--ink);">수업에 참석하시면 보증금은 전액 환불</strong>됩니다. ' +


        '다만 사전 연락 없이 노쇼하실 경우 환불되지 않아요.<br>' +


        '매칭이 완료되면 카카오톡으로 입금 계좌를 안내해드려요.' +


        '</div>' +


        '<div class="consent-box">' +

        '<label class="consent-row">' +


        '<input type="checkbox" id="paymentAckCheck" ' +

        (
          answers.payment
            ? 'checked'
            : ''
        ) +

        '>' +


        '<span>위 보증금 안내를 확인했습니다 <span class="required-mark">(필수)</span></span>' +


        '</label>' +

        '</div>';
    }


    /*
      REGULAR
    */
    else {


      const d =
        answers.duration ||
        {
          index: 0
        };


      const price =
        calcPrice(
          answers.tier,
          d.index,
          answers.frequency
        );


      let placeText =
        '-';


      /*
        ECONOMY
      */
      if (
        answers.tier ===
        '이코노미'
      ) {


        if (
          answers.placeType ===
          '송도 할인 장소'
        ) {


          placeText =
            '송도 할인 장소 · ' +

            (
              answers.songdoPlace ||
              '-'
            );
        }


        else {


          placeText =
            '인천 원하는 장소';
        }
      }


      /*
        STANDARD / PREMIUM
      */
      else {


        placeText =
          (
            answers.place ||
            []
          ).join(', ') ||
          '-';
      }


      inner +=

        '<div class="pay-box">' +


        '<div class="pay-row">' +

        '<span>선택 플랜</span>' +

        '<strong>' +
        (
          answers.tier ||
          '-'
        ) +
        '</strong>' +

        '</div>' +


        '<div class="pay-row">' +

        '<span>수업 빈도</span>' +

        '<strong>' +
        answers.frequency +
        '</strong>' +

        '</div>' +


        '<div class="pay-row">' +

        '<span>수업 시간</span>' +

        '<strong>' +
        durationLabel(
          d.index
        ) +
        '</strong>' +

        '</div>' +


        '<div class="pay-row">' +

        '<span>수업 장소</span>' +

        '<strong>' +
        placeText +
        '</strong>' +

        '</div>' +


        (
          answers.tier ===
            '이코노미' &&

          answers.placeType ===
            '송도 할인 장소'


            ? '<div class="pay-row">' +

              '<span>송도 장소 할인</span>' +

              '<strong style="color:var(--accent-deep);">-₩' +

              ECONOMY_SONGDO_DISCOUNT.toLocaleString() +

              '</strong>' +

              '</div>'


            : ''
        ) +


        '<div class="pay-row">' +

        '<span>결제 금액</span>' +

        '<strong>₩' +
        price.toLocaleString() +
        '</strong>' +

        '</div>' +


        '</div>' +


        '<div class="consent-box">' +

        '<label class="consent-row">' +


        '<input type="checkbox" id="paymentAckCheck" ' +

        (
          answers.payment
            ? 'checked'
            : ''
        ) +

        '>' +


        '<span>위 결제 금액 안내를 확인했습니다 <span class="required-mark">(필수)</span></span>' +


        '</label>' +

        '</div>';
    }
  }


  /* =========================================================
     END CARD
  ========================================================= */

  inner +=
    '</div>';


  qcardWrap.innerHTML =
    inner;


  /* =========================================================
     EVENTS — TIER
  ========================================================= */

  if (
    step.type ===
    'tier'
  ) {


    const freqToggle =
      document.getElementById(
        'freqToggle'
      );


    if (freqToggle) {


      freqToggle.addEventListener(
        'click',
        () => {


          answers.frequency =
            answers.frequency ===
              '주 1회'

              ? '주 2회'
              : '주 1회';


          renderStep();
        }
      );
    }


    qcardWrap
      .querySelectorAll(
        '.tier-opt'
      )
      .forEach(el => {


        el.addEventListener(
          'click',
          () => {


            if (
              el.dataset.disabled ===
              'true'
            ) {

              return;
            }


            if (
              answers.tier !==
              el.dataset.value
            ) {


              answers.place = [];

              answers.placeType = '';

              answers.songdoPlace = '';

              answers.payment = false;
            }


            answers.tier =
              el.dataset.value;


            qcardWrap
              .querySelectorAll(
                '.tier-opt'
              )
              .forEach(o => {


                o.classList.remove(
                  'selected'
                );


                const more =
                  o.querySelector(
                    '.tier-more'
                  );


                if (more) {

                  more.classList.remove(
                    'open'
                  );
                }
              });


            el.classList.add(
              'selected'
            );


            const more =
              el.querySelector(
                '.tier-more'
              );


            if (more) {

              more.classList.add(
                'open'
              );
            }


            setNextState(step);
          }
        );
      });


    qcardWrap
      .querySelectorAll(
        '.tip-icon'
      )
      .forEach(tip => {


        tip.addEventListener(
          'click',
          e => {


            e.stopPropagation();


            qcardWrap
              .querySelectorAll(
                '.tip-icon'
              )
              .forEach(t => {


                if (
                  t !== tip
                ) {

                  t.classList.remove(
                    'open'
                  );
                }
              });


            tip.classList.toggle(
              'open'
            );
          }
        );
      });
  }


  /* =========================================================
     EVENTS — DURATION
  ========================================================= */

  else if (
    step.type ===
    'duration'
  ) {


    qcardWrap
      .querySelectorAll(
        '.duration-opt'
      )
      .forEach(option => {


        option.addEventListener(
          'click',
          () => {


            const idx =
              parseInt(
                option.dataset.index,
                10
              );


            answers.duration =
              {
                index: idx
              };


            qcardWrap
              .querySelectorAll(
                '.duration-opt'
              )
              .forEach(el => {


                el.classList.remove(
                  'selected'
                );
              });


            option.classList.add(
              'selected'
            );


            const durPrice =
              document.getElementById(
                'durPrice'
              );


            if (
              durPrice &&
              !TRIAL_MODE
            ) {


              const price =
                PRICE_TABLE[
                  answers.tier
                ][idx] *

                (
                  FREQ_MULTIPLIER[
                    answers.frequency
                  ] ||
                  1
                );


              durPrice.innerHTML =

                '<span style="font-size:.72rem;color:var(--gray);font-weight:600;margin-right:3px;">총액</span>₩' +

                price.toLocaleString();
            }


            setNextState(step);
          }
        );
      });
  }


  /* =========================================================
     EVENTS — PLACE
  ========================================================= */

  else if (
    step.type ===
    'rank'
  ) {


    /*
      MAIN LOCATION
    */
    qcardWrap
      .querySelectorAll(
        '.opt.rank'
      )
      .forEach(el => {


        el.addEventListener(
          'click',
          () => {


            const val =
              el.dataset.value;

            const previousPlaceType =
              answers.placeType;


            answers[step.key] =
              [
                val
              ];


            /*
              FREE TRIAL / REGULAR ECONOMY
            */
            if (
              TRIAL_MODE ||
              answers.tier === '이코노미'
            ) {


              answers.placeType =
                val;


              if (
                TRIAL_MODE &&
                previousPlaceType !== val
              ) {

                answers.preferredPlace =
                  '';
              }


              /*
                송도 → 인천/서울로 바꾸면
                기존 IGC / 트스 삭제
              */
              if (
                val !==
                '송도 할인 장소'
              ) {


                answers.songdoPlace =
                  '';
              }
            }


            answers.payment =
              false;


            /*
              송도 선택 시
              IGC / 트스가 나타나야 하므로
              다시 렌더
            */
            renderStep();
          }
        );
      });


    /*
      SONGDO SUB PLACE
    */
    qcardWrap
      .querySelectorAll(
        '.songdo-sub-place'
      )
      .forEach(el => {


        el.addEventListener(
          'click',
          () => {


            answers.songdoPlace =
              el.dataset.value;


            qcardWrap
              .querySelectorAll(
                '.songdo-sub-place'
              )
              .forEach(o => {


                o.classList.remove(
                  'selected'
                );
              });


            el.classList.add(
              'selected'
            );


            answers.payment =
              false;


            setNextState(step);
          }
        );
      });


    const preferredPlaceInput =
      document.getElementById(
        'preferredPlaceInput'
      );


    if (preferredPlaceInput) {

      preferredPlaceInput.addEventListener(
        'input',
        () => {

          answers.preferredPlace =
            preferredPlaceInput.value;

          answers.payment =
            false;

          setNextState(step);
        }
      );
    }
  }


  /* =========================================================
     EVENTS — DATE
  ========================================================= */

  else if (
    step.type ===
    'date'
  ) {


    const dateInput =
      document.getElementById(
        'dateInput'
      );


    if (
      !answers[step.key]
    ) {

      answers[step.key] =
        dateInput.value;
    }


    dateInput.addEventListener(
      'input',
      () => {


        answers[step.key] =
          dateInput.value;


        setNextState(step);
      }
    );
  }


  /* =========================================================
     EVENTS — SINGLE / MULTI
  ========================================================= */

  else if (
    step.type ===
      'single' ||

    step.type ===
      'multi'
  ) {


    qcardWrap
      .querySelectorAll(
        '.opt'
      )
      .forEach(el => {


        el.addEventListener(
          'click',
          () => {


            const val =
              el.dataset.value;


            if (
              step.type ===
                'single'
            ) {


              answers[step.key] =
                val;


              qcardWrap
                .querySelectorAll(
                  '.opt'
                )
                .forEach(o => {


                  o.classList.remove(
                    'selected'
                  );
                });


              el.classList.add(
                'selected'
              );
            }


            else {


              const arr =
                answers[step.key] ||
                [];


              const idx =
                arr.indexOf(
                  val
                );


              if (idx > -1) {


                arr.splice(
                  idx,
                  1
                );
              }


              else {


                arr.push(
                  val
                );
              }


              answers[step.key] =
                arr;


              el.classList.toggle(
                'selected'
              );
            }


            /*
              REFERRAL OTHER
            */
            if (
              step.key ===
                'referral'
            ) {


              const wrap =
                document.getElementById(
                  'referralOtherWrap'
                );


              const input =
                document.getElementById(
                  'referralOtherInput'
                );


              const show =
                (
                  answers.referral ||
                  []
                ).includes(
                  '기타'
                );


              if (wrap) {

                wrap.style.display =
                  show
                    ? 'block'
                    : 'none';
              }


              if (!show) {

                answers.referralOther =
                  '';
              }


              if (
                input &&
                !input.dataset.bound
              ) {


                input.dataset.bound =
                  '1';


                input.addEventListener(
                  'input',
                  () => {


                    answers.referralOther =
                      input.value;
                  }
                );
              }
            }


            /*
              GOALS
            */
            if (
              step.key ===
                'goals'
            ) {


              /*
                Economy + Business 불가
              */
              if (
                !TRIAL_MODE &&

                (
                  answers.goals ||
                  []
                ).includes(
                  '비즈니스'
                ) &&

                answers.tier ===
                  '이코노미'
              ) {


                answers.tier =
                  '';


                answers.place =
                  [];


                answers.placeType =
                  '';


                answers.songdoPlace =
                  '';


                answers.payment =
                  false;


                const tierIndex =
                  activeSteps.findIndex(
                    s =>
                      s.key ===
                        'tier'
                  );


                if (
                  tierIndex > -1
                ) {


                  current =
                    tierIndex;


                  renderStep();


                  return;
                }
              }


              const wrap =
                document.getElementById(
                  'goalsOtherWrap'
                );


              const input =
                document.getElementById(
                  'goalsOtherInput'
                );


              const show =
                (
                  answers.goals ||
                  []
                ).includes(
                  '기타'
                );


              if (wrap) {

                wrap.style.display =
                  show
                    ? 'block'
                    : 'none';
              }


              if (!show) {

                answers.goalsOther =
                  '';
              }


              if (
                input &&
                !input.dataset.bound
              ) {


                input.dataset.bound =
                  '1';


                input.addEventListener(
                  'input',
                  () => {


                    answers.goalsOther =
                      input.value;
                  }
                );
              }
            }


            setNextState(step);
          }
        );
      });
  }


  /* =========================================================
     EVENTS — SCHEDULE
  ========================================================= */

  else if (
    step.type ===
    'gridtime'
  ) {


    const selectedArr =
      answers[step.key] ||
      [];


    const buildSlots =
      () => {


        const slots =
          [];


        for (
          let h = 9;
          h < 24;
          h++
        ) {


          slots.push(
            h + ':00'
          );


          slots.push(
            h + ':30'
          );
        }


        slots.push(
          '24:00'
        );


        return slots;
      };


    const renderTabs =
      () => {


        document
          .querySelectorAll(
            '.day-tab'
          )
          .forEach(tab => {


            const d =
              tab.dataset.day;


            tab.classList.toggle(
              'active',
              d ===
                scheduleActiveDay
            );


            const count =
              selectedArr.filter(
                v =>
                  v.indexOf(
                    d + ' '
                  ) === 0
              ).length;


            let badge =
              tab.querySelector(
                '.day-tab-badge'
              );


            if (
              count > 0
            ) {


              if (!badge) {


                badge =
                  document.createElement(
                    'span'
                  );


                badge.className =
                  'day-tab-badge';


                tab.appendChild(
                  badge
                );
              }


              badge.textContent =
                count;
            }


            else if (badge) {


              badge.remove();
            }
          });
      };


    const applySlot =
      (
        key,
        shouldSelect
      ) => {


        const idx =
          selectedArr.indexOf(
            key
          );


        if (
          shouldSelect &&
          idx === -1
        ) {


          selectedArr.push(
            key
          );
        }


        else if (
          !shouldSelect &&
          idx > -1
        ) {


          selectedArr.splice(
            idx,
            1
          );
        }


        answers[step.key] =
          selectedArr;


        renderTabs();


        setNextState(step);
      };


    const bindSlotEvents =
      () => {


        qcardWrap
          .querySelectorAll(
            '.time-slot'
          )
          .forEach(cell => {


            cell.addEventListener(
              'mousedown',
              e => {


                e.preventDefault();


                dragState.isDragging =
                  true;


                dragState.mode =
                  selectedArr.indexOf(
                    cell.dataset.key
                  ) === -1;


                cell.classList.toggle(
                  'selected',
                  dragState.mode
                );


                applySlot(
                  cell.dataset.key,
                  dragState.mode
                );
              }
            );


            cell.addEventListener(
              'mouseenter',
              () => {


                if (
                  !dragState.isDragging
                ) {

                  return;
                }


                cell.classList.toggle(
                  'selected',
                  dragState.mode
                );


                applySlot(
                  cell.dataset.key,
                  dragState.mode
                );
              }
            );


            cell.addEventListener(
              'touchend',
              e => {


                e.preventDefault();


                const shouldSelect =
                  selectedArr.indexOf(
                    cell.dataset.key
                  ) === -1;


                cell.classList.toggle(
                  'selected',
                  shouldSelect
                );


                applySlot(
                  cell.dataset.key,
                  shouldSelect
                );
              }
            );
          });
      };


    const rebuildSlotGrid =
      () => {


        const grid =
          document.getElementById(
            'timeSlotGrid'
          );


        grid.innerHTML =
          buildSlots()
            .map(t => {


              const key =
                scheduleActiveDay +
                ' ' +
                t;


              const isSel =
                selectedArr.indexOf(
                  key
                ) > -1;


              return (

                '<div class="time-slot ' +

                (
                  isSel
                    ? 'selected'
                    : ''
                ) +

                '" data-key="' +
                key +
                '">' +

                t +

                '</div>'
              );
            })
            .join('');


        bindSlotEvents();
      };


    document
      .querySelectorAll(
        '.day-tab'
      )
      .forEach(tab => {


        tab.addEventListener(
          'click',
          () => {


            scheduleActiveDay =
              tab.dataset.day;


            renderTabs();


            rebuildSlotGrid();
          }
        );
      });


    bindSlotEvents();
  }


  /* =========================================================
     EVENTS — TEXT
  ========================================================= */

  else if (
    step.type ===
    'text'
  ) {


    const ta =
      document.getElementById(
        'textInput'
      );


    if (ta) {


      ta.addEventListener(
        'input',
        () => {


          answers[step.key] =
            ta.value;
        }
      );
    }


    const qf =
      document.getElementById(
        'quickFillBtn'
      );


    if (
      qf &&
      ta
    ) {


      qf.addEventListener(
        'click',
        () => {


          ta.value =
            step.quickFill;


          answers[step.key] =
            step.quickFill;
        }
      );
    }
  }


  /* =========================================================
     EVENTS — CONTACT
  ========================================================= */

  else if (
    step.type ===
    'contact'
  ) {


    const nameInput =
      document.getElementById(
        'nameInput'
      );


    const phoneInput =
      document.getElementById(
        'phoneInput'
      );


    const consentCheck =
      document.getElementById(
        'consentCheck'
      );


    const consentToggle =
      document.getElementById(
        'consentToggle'
      );


    const consentDetail =
      document.getElementById(
        'consentDetail'
      );


    const sync =
      () => {


        const phoneValid =
          /^01[0-9]-?\d{3,4}-?\d{4}$/.test(

            phoneInput.value.replace(
              /\s/g,
              ''
            )
          );


        phoneInput.style.borderColor =
          (
            phoneInput.value &&
            !phoneValid
          )
            ? '#E85C5C'
            : '';


        answers[step.key] = {


          name:
            nameInput.value,


          phone:
            phoneInput.value,


          phoneValid,


          consent:
            consentCheck.checked
        };


        setNextState(step);
      };


    nameInput.addEventListener(
      'input',
      sync
    );


    phoneInput.addEventListener(
      'input',
      sync
    );


    consentCheck.addEventListener(
      'change',
      sync
    );


    consentToggle.addEventListener(
      'click',
      () => {


        consentDetail.style.display =
          consentDetail.style.display ===
          'none'

            ? 'block'
            : 'none';
      }
    );
  }


  /* =========================================================
     EVENTS — PAYMENT
  ========================================================= */

  else if (
    step.type ===
    'payment'
  ) {


    const ack =
      document.getElementById(
        'paymentAckCheck'
      );


    if (ack) {


      ack.addEventListener(
        'change',
        () => {


          answers.payment =
            ack.checked;


          setNextState(step);
        }
      );
    }
  }


  setNextState(step);
}


/* =========================================================
   NEXT
========================================================= */

nextBtn.addEventListener(
  'click',
  () => {


    const step =
      activeSteps[current];


    if (
      !checkValid(step)
    ) {

      return;
    }


    if (
      current ===
      activeSteps.length - 1
    ) {


      if (
        nextBtn.dataset.submitted
      ) {

        return;
      }


      nextBtn.dataset.submitted =
        '1';
    }


    current++;


    renderStep();
  }
);


/* =========================================================
   SKIP
========================================================= */

skipBtn.addEventListener(
  'click',
  () => {


    current++;


    renderStep();
  }
);


/* =========================================================
   BACK
========================================================= */

backBtn.addEventListener(
  'click',
  () => {


    if (
      current > 0
    ) {


      current--;


      renderStep();
    }
  }
);


/* =========================================================
   JOTFORM
========================================================= */

async function submitToJotform(a) {
  const FORM_ID =
    '262064236851052';

  const API_KEY =
    '32abecc4b70bf065c8adf25c9b02b7cb';

  const params =
    new URLSearchParams();

  params.append(
    'submission[3]',
    a.contact
      ? a.contact.name
      : ''
  );


  params.append(
    'submission[4][full]',
    a.contact
      ? a.contact.phone
      : ''
  );


  params.append(
    'submission[5]',
    a.ageGroup || ''
  );


  params.append(
    'submission[7]',
    a.level || ''
  );


  (
    a.goals ||
    []
  ).forEach(g => {


    params.append(
      'submission[8][]',
      g
    );
  });


  params.append(
    'submission[30]',
    TRIAL_MODE

      ? '이코노미(체험)'

      : (
          a.tier ||
          ''
        )
  );


  params.append(
    'submission[31]',
    TRIAL_MODE

      ? (
          a.payment
            ? '보증금 안내 확인'
            : ''
        )

      : (
          a.payment
            ? '완료'
            : ''
        )
  );


  params.append(
    'submission[32]',
    (
      a.schedule ||
      []
    ).join(', ')
  );


  /*
    장소 전체 정보
  */
  let jotformPlace = '';


  if (TRIAL_MODE) {


    jotformPlace = placeLabel(a).replace(/ · /g, ' / ');
  }


  else if (
    a.tier ===
    '이코노미'
  ) {


    if (
      a.placeType ===
      '송도 할인 장소'
    ) {


      jotformPlace =
        '송도 할인 장소 / ' +

        (
          a.songdoPlace ||
          ''
        );
    }


    else {


      jotformPlace =
        '인천 원하는 장소';
    }
  }


  else {


    jotformPlace =
      (
        a.place ||
        []
      ).join(', ');
  }


  /*
    Jotform Question ID 33
    → "수업 장소"
  */
  params.append(
    'submission[33]',
    jotformPlace
  );


  params.append(
    'submission[34]',
    a.startDate || ''
  );


  (
    a.referral ||
    []
  ).forEach(r => {


    params.append(
      'submission[35][]',
      r
    );
  });


  params.append(
    'submission[36]',
    a.gender || ''
  );


  params.append(
    'submission[38]',
    a.referralOther || ''
  );


  params.append(
    'submission[39]',
    a.goalsOther || ''
  );


  params.append(
    'submission[40]',
    a.frequency || ''
  );


  params.append(
    'submission[41]',
    a.duration

      ? durationLabel(
          a.duration.index
        )

      : ''
  );


  params.append(
    'submission[43]',
    TRIAL_MODE

      ? '체험 신청'
      : '정규 신청'
  );


  params.append(
    'submission[28]',
    a.notes || ''
  );


  /*
    Question ID 44
    → "송도 지정 장소"

    Economy 송도 할인일 때:
    IGC / 트리플스트리트

    무료체험도 같은 값 저장 가능
  */
  let detailedSongdoPlace = '';


  if (
    !TRIAL_MODE &&
    a.placeType ===
      '송도 할인 장소'
  ) {


    detailedSongdoPlace =
      a.songdoPlace ||
      '';
  }


  else if (TRIAL_MODE && a.placeType === '송도 할인 장소') {


    detailedSongdoPlace =
      a.songdoPlace || '';
  }


  params.append(
    'submission[44]',
    detailedSongdoPlace
  );


  /*
    Jotform에
    "결제 예정 금액" 필드를 새로 만든다면:

    const finalPrice =
      TRIAL_MODE
        ? 0
        : calcPrice(
            a.tier,
            a.duration
              ? a.duration.index
              : 0,
            a.frequency
          );

    params.append(
      'submission[실제_QUESTION_ID]',
      finalPrice.toString()
    );
  */


  try {


    await fetch(

      'https://api.jotform.com/form/' +
      FORM_ID +
      '/submissions?apiKey=' +
      API_KEY,

      {
        method:
          'POST',

        body:
          params
      }
    );
  }


  catch (err) {


    console.error(
      'Jotform 제출 실패:',
      err
    );
  }
}


/* =========================================================
   SUCCESS
========================================================= */

let alreadySubmitted =
  false;


function showSuccess() {


  if (
    alreadySubmitted
  ) {

    return;
  }


  alreadySubmitted =
    true;


  document.getElementById(
    'formMain'
  ).style.display =
    'none';


  document.getElementById(
    'bottombar'
  ).style.display =
    'none';


  const topbar =
    document.querySelector(
      '.topbar'
    );


  if (topbar) {


    topbar.style.display =
      'none';
  }


  const wrap =
    document.getElementById(
      'successWrap'
    );


  wrap.style.display =
    'block';


  const a =
    answers;


  let successPlace =
    '-';


  /*
    TRIAL
  */
  if (TRIAL_MODE) {


    successPlace = placeLabel(a);
  }


  /*
    ECONOMY
  */
  else if (
    a.tier ===
    '이코노미'
  ) {


    if (
      a.placeType ===
      '송도 할인 장소'
    ) {


      successPlace =
        '송도 할인 장소 · ' +

        (
          a.songdoPlace ||
          '-'
        );
    }


    else {


      successPlace =
        '인천 원하는 장소';
    }
  }


  /*
    STANDARD / PREMIUM
  */
  else {


    successPlace =
      (
        a.place ||
        []
      ).join(', ') ||
      '-';
  }


  const finalPrice =
    TRIAL_MODE

      ? 0

      : calcPrice(
          a.tier,

          a.duration
            ? a.duration.index
            : 0,

          a.frequency
        );


  document.getElementById(
    'summaryBox'
  ).innerHTML =


    '<strong>선택 플랜</strong> · ' +

    (
      TRIAL_MODE
        ? '이코노미(체험)'
        : (
            a.tier ||
            '-'
          )
    ) +

    ' · ' +

    freqLabel(
      a.frequency ||
      '-'
    ) +

    ' · ' +

    (
      a.duration
        ? durationLabel(
            a.duration.index
          )
        : '-'
    ) +

    '<br>' +


    '<strong>수업 장소</strong> · ' +

    successPlace +

    '<br>' +


    (
      TRIAL_MODE

        ? '<strong>노쇼 방지 보증금</strong> · ₩' +
          TRIAL_DEPOSIT.toLocaleString() +
          '<br>' +
          (a.placeType === '송도 할인 장소'
            ? '<strong>정규 수업 등록 시 송도 할인</strong> · 월 -₩' +
              ECONOMY_SONGDO_DISCOUNT.toLocaleString() + '<br>'
            : '')


        : (
            (
              a.tier ===
                '이코노미' &&

              a.placeType ===
                '송도 할인 장소'
            )

              ? '<strong>송도 장소 할인</strong> · -₩' +
                ECONOMY_SONGDO_DISCOUNT.toLocaleString() +
                '<br>'

              : ''
          ) +

          '<strong>예정 금액</strong> · ₩' +

          finalPrice.toLocaleString() +

          '<br>'
    ) +


    '<strong>나이대</strong> · ' +

    (
      a.ageGroup ||
      '-'
    ) +

    '<br>' +


    '<strong>영어 수준</strong> · ' +

    (
      a.level ||
      '-'
    ) +

    '<br>' +


    '<strong>학습 목표</strong> · ' +

    (
      (
        a.goals ||
        []
      )
        .map(g => {


          if (
            g ===
              '기타' &&

            a.goalsOther
          ) {


            return (
              '기타(' +
              a.goalsOther +
              ')'
            );
          }


          return g;
        })
        .join(', ') ||
      '-'
    ) +

    '<br>' +


    '<strong>희망 시간대</strong> · ' +

    (
      (
        a.schedule ||
        []
      ).join(', ') ||
      '-'
    ) +

    '<br>' +


    '<strong>희망 시작일</strong> · ' +

    (
      a.startDate ||
      '-'
    ) +

    '<br>' +


    '<strong>유입 경로</strong> · ' +

    (
      (
        a.referral ||
        []
      ).join(', ') ||
      '-'
    ) +

    '<br>' +


    '<strong>연락처</strong> · ' +

    (
      a.contact

        ? a.contact.name +
          ' · ' +
          a.contact.phone

        : '-'
    );


  submitToJotform(a);


  console.log(
    '신청 데이터:',
    a
  );
}


/* =========================================================
   START
========================================================= */

renderStep();
