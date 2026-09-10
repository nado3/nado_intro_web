(() => {
  'use strict';

  // Individual time-slot selection is handled by script.js.
  // Keep only the text-wrapping fix that prevents Korean words from splitting awkwardly.
  const style = document.createElement('style');
  style.id = 'nadoDurationWrapFix';
  style.textContent = `
    .duration-opt-desc {
      word-break: keep-all !important;
      overflow-wrap: normal !important;
      white-space: normal !important;
      text-wrap: balance;
    }
  `;
  document.head.appendChild(style);
})();
