(function () {
  'use strict';

  // Connect the existing Google tag to Google Ads as well as GA4.
  if (typeof window.gtag === 'function') {
    window.gtag('config', 'AW-18355423972');
  }

  // Keep Jotform hidden from the customer-facing UI. The form is submitted
  // through the site's own application flow/API rather than embedded directly.
  const removeJotformArtifacts = () => {
    document.querySelectorAll('iframe[src*="jotform"], [id*="jotform" i], [class*="jotform" i]').forEach((el) => {
      if (el.tagName === 'SCRIPT') return;
      el.remove();
    });
  };

  removeJotformArtifacts();
  const observer = new MutationObserver(removeJotformArtifacts);
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
