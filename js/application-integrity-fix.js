(() => {
  'use strict';

  if (window.__NADO_APPLICATION_INTEGRITY_FIX__) return;
  window.__NADO_APPLICATION_INTEGRITY_FIX__ = true;

  function patchPlanCopy() {
    try {
      if (typeof steps === 'undefined' || !Array.isArray(steps)) return;
      const tierStep = steps.find(step => step && step.key === 'tier');
      if (!tierStep || !Array.isArray(tierStep.options)) return;

      tierStep.options.forEach(option => {
        if (!option || typeof option.more !== 'string') return;
        option.more = option.more.replace(/가능 영어:/g, '수업 타입:');
        if (option.name !== '프리미엄') {
          option.more = option.more.replace(/ · 비즈니스/g, '');
        }
      });

      if (typeof renderStep === 'function') renderStep();
    } catch (error) {
      console.warn('요금제 문구 보정 중 오류:', error);
    }
  }

  if (typeof checkValid === 'function') {
    const originalCheckValid = checkValid;
    checkValid = function(step) {
      if (
        step?.key === 'goals' &&
        typeof answers !== 'undefined' &&
        answers.tier !== '프리미엄' &&
        Array.isArray(answers.goals) &&
        answers.goals.includes('비즈니스')
      ) {
        return false;
      }
      return originalCheckValid(step);
    };
  }

  if (typeof fetchAvailableTeachers === 'function') {
    const originalFetchAvailableTeachers = fetchAvailableTeachers;
    fetchAvailableTeachers = async function() {
      let teachers = await originalFetchAvailableTeachers();
      const requiresBusinessEnglish =
        typeof answers !== 'undefined' &&
        Array.isArray(answers.goals) &&
        answers.goals.includes('비즈니스');

      if (requiresBusinessEnglish && Array.isArray(teachers)) {
        teachers = teachers.filter(teacher => {
          const value = teacher?.raw?.business_english;
          return value === true || String(value).toLowerCase() === 'true';
        });
      }
      return teachers;
    };
  }

  if (typeof trackFormEvent === 'function') {
    const originalTrackFormEvent = trackFormEvent;
    trackFormEvent = function(eventName, extraParams) {
      if (
        window.__NADO_DUPLICATE_SUBMISSION_PREVENTED__ === true &&
        (eventName === 'form_submit' || eventName === 'generate_lead')
      ) {
        return;
      }
      return originalTrackFormEvent(eventName, extraParams);
    };
  }

  if (typeof trackGoogleAdsApplication === 'function') {
    const originalTrackGoogleAdsApplication = trackGoogleAdsApplication;
    trackGoogleAdsApplication = function() {
      if (window.__NADO_DUPLICATE_SUBMISSION_PREVENTED__ === true) return;
      return originalTrackGoogleAdsApplication();
    };
  }

  patchPlanCopy();
})();
