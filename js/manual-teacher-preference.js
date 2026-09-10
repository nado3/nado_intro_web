(() => {
  'use strict';

  if (typeof showSuccess !== 'function' || typeof submitToJotform !== 'function') return;

  const originalShowSuccess = showSuccess;
  const originalSubmitToJotform = submitToJotform;
  let preferenceViewActive = false;

  const PREFERENCE_LABELS = {
    foreign: '외국인 선생님',
    korean: '한국인 선생님',
    no_preference: '상관없어요'
  };

  patchPlanCopy();
  injectPreferenceStyles();

  function patchPlanCopy() {
    try {
      if (typeof steps === 'undefined' || !Array.isArray(steps)) return;
      const tierStep = steps.find(step => step && step.key === 'tier');
      if (!tierStep || !Array.isArray(tierStep.options)) return;

      tierStep.options.forEach(option => {
        if (!option || typeof option.more !== 'string') return;
        option.more = option.more.replace(/가능 영어:/g, '수업 타입:');

        if (option.name === '프리미엄' && !option.more.includes('premium-best-teacher-help')) {
          option.more = option.more.replace(
            '· 나도 <strong>최우수 선생님 배정</strong>',
            '· 나도 <span class="premium-best-teacher-help"><strong>최우수 선생님 배정</strong><button type="button" class="premium-help-btn" aria-label="최우수 선생님 설명" aria-expanded="false">?</button><span class="premium-help-tooltip" role="tooltip">최우수 선생님은 학생 만족도, 수업 지속률, 피드백 평가 등을 종합하여 선정된 상위 선생님입니다.</span></span>'
          );
        }
      });

      if (typeof renderStep === 'function') renderStep();
    } catch (error) {
      console.warn('요금제 설명 보정 중 오류:', error);
    }
  }

  function injectPreferenceStyles() {
    if (document.getElementById('manualTeacherPreferenceStyles')) return;

    const style = document.createElement('style');
    style.id = 'manualTeacherPreferenceStyles';
    style.textContent = `
      .premium-best-teacher-help{
        position:relative;
        display:inline-flex;
        align-items:center;
        gap:5px;
        vertical-align:middle;
      }
      .premium-help-btn{
        width:18px;
        height:18px;
        min-width:18px;
        padding:0;
        border:1.5px solid #9aa8b8;
        border-radius:50%;
        background:#fff;
        color:#708196;
        font:800 11px/1 Pretendard, sans-serif;
        cursor:pointer;
        display:inline-flex;
        align-items:center;
        justify-content:center;
      }
      .premium-help-btn:hover,
      .premium-help-btn:focus-visible{
        border-color:var(--accent);
        color:var(--accent-deep);
        outline:none;
      }
      .premium-help-tooltip{
        display:none;
        position:absolute;
        left:auto;
        right:-18px;
        bottom:calc(100% + 9px);
        z-index:50;
        transform:none;
        width:210px;
        max-width:60vw;
        box-sizing:border-box;
        padding:8px 7px;
        border:1px solid #dce5ef;
        border-radius:12px;
        background:#fff;
        box-shadow:0 10px 28px rgba(22,50,79,.14);
        color:#526173;
        font-size:.78rem;
        line-height:1.5;
        font-weight:650;
        text-align:left;
        word-break:keep-all;
      }
      .premium-best-teacher-help.open .premium-help-tooltip{
        display:block;
      }
      .teacher-preference-card{
        padding:28px 22px 22px;
        border-radius:28px;
      }
      .teacher-preference-card .qtitle{
        font-size:clamp(1.55rem,5.4vw,2rem);
        line-height:1.3;
        font-weight:900;
        letter-spacing:-.03em;
        margin-bottom:10px;
        word-break:keep-all;
      }
      .teacher-preference-card .qsub{
        font-size:1rem;
        line-height:1.65;
        color:#7f8a98;
        font-weight:700;
        margin-bottom:18px;
        word-break:keep-all;
      }
      .teacher-preference-list{
        display:flex;
        flex-direction:column;
        gap:14px;
      }
      .teacher-preference-opt{
        width:100%;
        display:flex;
        align-items:flex-start;
        gap:14px;
        padding:18px 16px;
        border:2px solid #e5ebf2;
        border-radius:22px;
        background:#fff;
        text-align:left;
        transition:border-color .18s ease,box-shadow .18s ease,background .18s ease;
      }
      .teacher-preference-opt:hover{
        border-color:#c9d9ec;
        box-shadow:0 6px 16px rgba(22,50,79,.06);
      }
      .teacher-preference-opt.selected{
        border-color:var(--accent);
        background:#f7fbff;
        box-shadow:0 8px 18px rgba(74,144,226,.10);
      }
      .teacher-preference-opt .opt-dot{
        width:26px;
        height:26px;
        min-width:26px;
        border-radius:50%;
        border:2px solid #d6deea;
        margin-top:4px;
        position:relative;
        background:#fff;
      }
      .teacher-preference-opt.selected .opt-dot{
        border-color:var(--accent);
      }
      .teacher-preference-opt.selected .opt-dot::after{
        content:'';
        position:absolute;
        inset:5px;
        border-radius:50%;
        background:var(--accent);
      }
      .teacher-preference-text{
        flex:1;
        min-width:0;
      }
      .teacher-preference-title{
        display:block;
        font-size:1.22rem;
        line-height:1.35;
        font-weight:900;
        color:var(--ink);
        margin-bottom:6px;
        word-break:keep-all;
      }
      .teacher-preference-desc{
        display:block;
        font-size:.98rem;
        line-height:1.6;
        color:#7f8a98;
        font-weight:700;
        word-break:keep-all;
      }
      .teacher-preference-submit{
        width:100%;
        margin-top:18px;
        height:58px;
        border-radius:18px;
        font-size:1.05rem;
        font-weight:900;
      }
      .teacher-preference-submit:not(.active){
        opacity:1;
        background:#e3e8ef;
        color:#fff;
      }
      @media (max-width:480px){
        .premium-help-tooltip{
          left:auto;
          right:-18px;
          transform:none;
          width:190px;
          max-width:58vw;
          padding:7px 6px;
        }
        .teacher-preference-card{
          padding:24px 18px 18px;
          border-radius:24px;
        }
        .teacher-preference-card .qtitle{font-size:1.8rem;}
        .teacher-preference-card .qsub{font-size:1rem;}
        .teacher-preference-opt{
          padding:16px 14px;
          border-radius:20px;
        }
        .teacher-preference-title{font-size:1.15rem;}
        .teacher-preference-desc{font-size:.95rem;}
        .teacher-preference-submit{
          height:56px;
          font-size:1rem;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function setHistoryVisible(visible) {
    if (!historyEl) return;
    historyEl.style.display = visible ? '' : 'none';
  }

  function renderPreferenceStep() {
    preferenceViewActive = true;
    matchingViewActive = true;
    matchingInProgress = false;
    progressFill.style.width = '100%';
    backBtn.style.visibility = 'visible';
    document.getElementById('bottombar').style.display = 'none';
    setHistoryVisible(false);

    const selected = answers.teacher_preference || '';
    qcardWrap.innerHTML = ''
      + '<div class="qcard teacher-preference-card">'
      + '<div class="qtitle">선호하는 선생님 유형이 있으신가요?</div>'
      + '<div class="qsub">원하시는 스타일을 알려주시면 매칭에 참고할게요.</div>'
      + '<div class="opt-list teacher-preference-list">'
      + preferenceOption('foreign', '외국인 선생님', '자연스러운 영어 회화를 많이 연습하고 싶은 분께 추천해요.', selected)
      + preferenceOption('korean', '한국인 선생님', '기초 영어 레벨이거나, 설명을 한국어로도 함께 듣고 싶은 분께 추천해요.', selected)
      + preferenceOption('no_preference', '상관없어요', '일정과 조건이 가장 잘 맞는 선생님으로 추천해드려요.', selected)
      + '</div>'
      + '<button type="button" class="btn-next teacher-preference-submit" id="teacherPreferenceSubmit" disabled>신청 완료하기</button>'
      + '</div>';

    const submitButton = document.getElementById('teacherPreferenceSubmit');
    qcardWrap.querySelectorAll('.teacher-preference-opt').forEach(option => {
      option.addEventListener('click', () => {
        qcardWrap.querySelectorAll('.teacher-preference-opt').forEach(item => item.classList.remove('selected'));
        option.classList.add('selected');
        answers.teacher_preference = option.dataset.value;
        submitButton.disabled = false;
        submitButton.classList.add('active');
      });
    });

    if (selected) {
      submitButton.disabled = false;
      submitButton.classList.add('active');
    }

    submitButton.addEventListener('click', async () => {
      if (!answers.teacher_preference || submissionInProgress) return;
      preferenceViewActive = false;
      matchingViewActive = false;
      setHistoryVisible(true);
      submitButton.disabled = true;
      submitButton.textContent = '제출 중…';
      await originalShowSuccess();
    });
  }

  function preferenceOption(value, title, description, selected) {
    return ''
      + '<button type="button" class="opt teacher-preference-opt ' + (selected === value ? 'selected' : '') + '" data-value="' + value + '">'
      + '<div class="opt-dot"></div>'
      + '<div class="teacher-preference-text">'
      + '<strong class="teacher-preference-title">' + title + '</strong>'
      + '<span class="teacher-preference-desc">' + description + '</span>'
      + '</div>'
      + '</button>';
  }

  showSuccess = async function() {
    if (
      answers.matching_type === 'manual' &&
      !answers.teacher_preference &&
      !alreadySubmitted &&
      !submissionInProgress
    ) {
      renderPreferenceStep();
      return;
    }
    return originalShowSuccess();
  };

  submitToJotform = async function(a) {
    const originalNotes = a.notes;

    if (a.matching_type === 'manual' && a.teacher_preference) {
      const label = PREFERENCE_LABELS[a.teacher_preference] || a.teacher_preference;
      a.notes = [
        originalNotes || '',
        '[선생님 유형 선호]',
        'teacher_preference=' + a.teacher_preference + ' (' + label + ')'
      ].filter(Boolean).join('\n\n');
    }

    try {
      return await originalSubmitToJotform(a);
    } finally {
      a.notes = originalNotes;
    }
  };

  document.addEventListener('click', (event) => {
    const helpButton = event.target.closest?.('.premium-help-btn');
    if (helpButton) {
      event.preventDefault();
      event.stopPropagation();
      const wrap = helpButton.closest('.premium-best-teacher-help');
      const willOpen = !wrap.classList.contains('open');
      document.querySelectorAll('.premium-best-teacher-help.open').forEach(item => item.classList.remove('open'));
      wrap.classList.toggle('open', willOpen);
      helpButton.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      return;
    }

    document.querySelectorAll('.premium-best-teacher-help.open').forEach(item => {
      item.classList.remove('open');
      const button = item.querySelector('.premium-help-btn');
      if (button) button.setAttribute('aria-expanded', 'false');
    });

    if (!preferenceViewActive) return;
    const back = event.target.closest?.('#backBtn');
    if (!back) return;
    preferenceViewActive = false;
    setHistoryVisible(true);
  }, true);
})();
