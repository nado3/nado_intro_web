(() => {
  'use strict';

  function syncTierSelection() {
    const root = document.getElementById('qcardWrap');
    const next = document.getElementById('nextBtn');
    if (!root || !next) return;

    const selected = root.querySelector('.tier-opt.selected[data-value]');
    if (!selected) return;

    try {
      if (typeof answers !== 'undefined') {
        answers.tier = selected.dataset.value || answers.tier;
      }
    } catch (_) {}

    try {
      if (
        typeof activeSteps !== 'undefined' &&
        typeof current !== 'undefined' &&
        activeSteps?.[current]?.type === 'tier'
      ) {
        next.disabled = false;
        next.classList.add('active');
        next.textContent = '다음';
      }
    } catch (_) {
      next.disabled = false;
      next.classList.add('active');
    }
  }

  document.addEventListener('click', (event) => {
    if (!event.target.closest?.('.tier-opt[data-value]')) return;
    window.setTimeout(syncTierSelection, 0);
  }, true);

  const root = document.getElementById('qcardWrap');
  if (root) {
    new MutationObserver(syncTierSelection).observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
    });
  }
})();
