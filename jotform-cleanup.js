(() => {
  'use strict';

  // Existing Google tag (GA4) is already loaded in the page head.
  // Add the Google Ads destination so conversion event snippets can be attributed.
  if (typeof window.gtag === 'function') {
    window.gtag('config', 'AW-18355423972');
  }

  // Preserve the existing cleanup contract: remove any leftover embedded Jotform
  // elements if they appear in the customer-facing application flow.
  function cleanup() {
    document.querySelectorAll('iframe[src*="jotform"], iframe[src*="form.jotform"], .jotform-form').forEach((el) => {
      el.remove();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', cleanup, { once: true });
  } else {
    cleanup();
  }
})();
