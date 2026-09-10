(() => {
  'use strict';

  function fixDurationText(root = document) {
    root.querySelectorAll?.('.duration-opt-desc').forEach((el) => {
      // Important: once fixed, do not rewrite innerHTML again.
      // Rewriting it inside the MutationObserver callback would trigger
      // the same observer forever and freeze the application form.
      if (el.querySelector('.duration-no-break')) return;

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

  function observe(root) {
    fixDurationText(root);
    const observer = new MutationObserver(() => fixDurationText(root));
    observer.observe(root, { childList: true, subtree: true });
  }

  const root = document.getElementById('qcardWrap');
  if (root) {
    observe(root);
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      const q = document.getElementById('qcardWrap');
      if (q) observe(q);
    }, { once: true });
  }
})();
