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

  function renderPreferenceStep() {
    preferenceViewActive = true;
    matchingViewActive = true;
    matchingInProgress = false;
    progressFill.style.width = '100%';
    backBtn.style.visibility = 'visible';
    document.getElementById('bottombar').style.display = 'none';

    const selected = answers.teacher_preference || '';
    qcardWrap.innerHTML = ''
      + '<div class="qcard teacher-preference-card">'
      + '<div class="qtitle">선호하는 선생님 유형이 있으신가요?</div>'
      + '<div class="qsub">선호도를 참고해 매칭해드리며, 가능한 선생님의 일정과 지역에 따라 다른 유형의 선생님을 제안드릴 수 있어요.</div>'
      + '<div class="opt-list teacher-preference-list">'
      + preferenceOption('foreign', '외국인 선생님', '다양한 문화권의 영어 사용자와 자연스럽게 대화하고 싶은 분께 추천해요.', selected)
      + preferenceOption('korean', '한국인 선생님', '한국어로도 편하게 질문하며 영어 회화를 배우고 싶은 분께 추천해요.', selected)
      + preferenceOption('no_preference', '상관없어요', '선호 유형 없이 일정과 조건이 가장 잘 맞는 선생님을 추천해드려요.', selected)
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
      submitButton.disabled = true;
      submitButton.textContent = '제출 중…';
      await originalShowSuccess();
    });
  }

  function preferenceOption(value, title, description, selected) {
    return ''
      + '<button type="button" class="opt teacher-preference-opt ' + (selected === value ? 'selected' : '') + '" data-value="' + value + '">'
      + '<div class="opt-dot"></div>'
      + '<div class="opt-label" style="text-align:left;">'
      + '<strong style="display:block;">' + title + '</strong>'
      + '<small style="display:block;margin-top:4px;color:var(--gray);font-size:.78rem;line-height:1.45;font-weight:600;">' + description + '</small>'
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
    if (!preferenceViewActive) return;
    const back = event.target.closest?.('#backBtn');
    if (!back) return;
    preferenceViewActive = false;
  }, true);
})();
