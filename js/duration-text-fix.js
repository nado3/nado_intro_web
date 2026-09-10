(() => {
  'use strict';

  function fixDurationText(root = document) {
    root.querySelectorAll?.('.duration-opt-desc').forEach((el) => {
      const text = (el.textContent || '').trim();
      if (text === '꾸준히 집중해서 배우기') {
        el.innerHTML = '꾸준히 집중해서 <span class="duration-no-break">배우기</span>';
      } else if (text === '한 번에 깊이 있게 배우기') {
        el.innerHTML = '한 번에 깊이 있게 <span class="duration-no-break">배우기</span>';
      }
    });
  }

  const style = document.createElement('style');
  style.textContent = `
    body.form-page .duration-opt-desc {
      word-break: keep-all !important;
      overflow-wrap: normal !important;
      word-wrap: normal !important;
      white-space: normal !important;
      text-wrap: initial !important;
    }
    body.form-page .duration-no-break {
      white-space: nowrap !important;
    }
  `;
  document.head.appendChild(style);

  const root = document.getElementById('qcardWrap');
  if (root) {
    fixDurationText(root);
    new MutationObserver(() => fixDurationText(root)).observe(root, { childList: true, subtree: true });
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      const q = document.getElementById('qcardWrap');
      if (!q) return;
      fixDurationText(q);
      new MutationObserver(() => fixDurationText(q)).observe(q, { childList: true, subtree: true });
    }, { once: true });
  }
})();
