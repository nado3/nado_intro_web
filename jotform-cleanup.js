(function () {
  'use strict';

  // Connect the existing Google tag to Google Ads as well as GA4.
  // The base gtag.js snippet is already loaded by the page.
  if (typeof window.gtag === 'function') {
    window.gtag('config', 'AW-18355423972');
  }

  // Existing Jotform cleanup behavior.
  const observer = new MutationObserver(() => {
    document.querySelectorAll('iframe[src*="jotform.com"], iframe[src*="jotform.io"]').forEach((iframe) => {
      iframe.setAttribute('title', iframe.getAttribute('title') || 'NADO application form');
    });
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
