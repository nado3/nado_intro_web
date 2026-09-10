(() => {
  'use strict';

  let installed = false;

  function install() {
    if (installed) return;
    if (typeof checkValid !== 'function' || typeof setNextState !== 'function') {
      setTimeout(install, 50);
      return;
    }

    const originalCheckValid = checkValid;
    checkValid = function(step) {
      try {
        if (step?.type === 'rank' && answers?.placeType === '인천 원하는 장소') {
          return Array.isArray(answers.place) && answers.place.length > 0 && !!answers.areaCode;
        }
      } catch (_) {}
      return originalCheckValid(step);
    };

    installed = true;
  }

  function syncIncheonSelection(button) {
    try {
      if (typeof answers === 'undefined') return;
      const code = button?.dataset?.incheonAreaCode || '';
      if (!code) return;

      answers.areaCode = code;
      window.NADO_INCHEON_SELECTED_AREA = code;

      const label = String(button.textContent || code).trim();
      const input = document.getElementById('preferredPlaceInput');
      const exact = String(input?.value || '').trim();
      answers.preferredPlace = [label, exact].filter(Boolean).join(' / ');
      answers.payment = false;

      if (typeof activeSteps !== 'undefined' && typeof current !== 'undefined') {
        setNextState(activeSteps[current]);
      }
    } catch (_) {}
  }

  document.addEventListener('click', (event) => {
    const areaButton = event.target.closest?.('[data-incheon-area-code]');
    if (areaButton) {
      syncIncheonSelection(areaButton);
      setTimeout(() => syncIncheonSelection(areaButton), 0);
      return;
    }

    if (event.target.closest?.('#nextBtn')) {
      try {
        if (typeof answers !== 'undefined' && answers.placeType === '인천 원하는 장소' && answers.areaCode) {
          const selected = document.querySelector('[data-incheon-area-code].selected');
          if (selected) syncIncheonSelection(selected);
        }
      } catch (_) {}
    }
  }, true);

  install();
})();
