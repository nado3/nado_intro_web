(() => {
  'use strict';

  let installed = false;
  let attempts = 0;
  const MAX_ATTEMPTS = 40;

  function install() {
    if (installed) return;

    if (typeof checkValid !== 'function') {
      attempts += 1;
      if (attempts < MAX_ATTEMPTS) window.setTimeout(install, 50);
      return;
    }

    const originalCheckValid = checkValid;

    checkValid = function(step) {
      try {
        if (
          step?.type === 'rank' &&
          typeof answers !== 'undefined' &&
          answers.placeType === '인천 원하는 장소'
        ) {
          return Array.isArray(answers.place)
            && answers.place.length > 0
            && !!answers.areaCode;
        }
      } catch (_) {}

      return originalCheckValid(step);
    };

    installed = true;
  }

  install();
})();
