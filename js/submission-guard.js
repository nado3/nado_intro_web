(() => {
  'use strict';

  const STORAGE_KEY = 'nado:last-successful-application:v2';
  const DUPLICATE_WINDOW_MS = 12 * 60 * 60 * 1000;
  const RECENT_BANNER_WINDOW_MS = 24 * 60 * 60 * 1000;
  const SUBMIT_ENDPOINT = 'https://nado-intro-web.vercel.app/api/submit';
  const originalFetch = window.fetch.bind(window);

  function readRecentSubmission() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function saveRecentSubmission(record) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    } catch (error) {
      // localStorage can be unavailable in some private browsing modes.
    }
  }

  function isRecent(record, windowMs) {
    return Boolean(
      record
      && Number.isFinite(Number(record.submittedAt))
      && Date.now() - Number(record.submittedAt) >= 0
      && Date.now() - Number(record.submittedAt) <= windowMs
    );
  }

  function normalize(value) {
    return String(value || '').trim().replace(/\s+/g, ' ');
  }

  function paramsFromBody(body) {
    if (body instanceof URLSearchParams) return body;
    if (typeof body === 'string') return new URLSearchParams(body);
    return null;
  }

  function applicationSignature(params) {
    if (!params) return '';

    // Identity + lesson choices only. Matching results are intentionally excluded:
    // the same student/application should not become a second submission merely
    // because a different teacher was returned by the live matching step.
    const fields = [
      'submission[3]',          // name
      'submission[4][full]',   // phone
      'submission[30]',        // plan
      'submission[32]',        // schedule
      'submission[33]',        // place
      'submission[34]',        // start date
      'submission[40]',        // frequency
      'submission[41]',        // duration
      'submission[43]'         // regular / trial
    ];

    return fields
      .map(key => key + '=' + normalize(params.get(key)))
      .join('&');
  }

  function hashString(value) {
    let hash = 2166136261;
    for (let i = 0; i < value.length; i += 1) {
      hash ^= value.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
  }

  function fingerprintFromBody(body) {
    const signature = applicationSignature(paramsFromBody(body));
    return signature ? hashString(signature) : '';
  }

  function makeDuplicateSuccessResponse(record) {
    return new Response(JSON.stringify({
      success: true,
      duplicatePrevented: true,
      submittedAt: record.submittedAt
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  window.fetch = async function guardedFetch(input, init) {
    const url = typeof input === 'string' ? input : (input && input.url) || '';
    const method = String((init && init.method) || 'GET').toUpperCase();

    if (url !== SUBMIT_ENDPOINT || method !== 'POST') {
      return originalFetch(input, init);
    }

    const fingerprint = fingerprintFromBody(init && init.body);
    const recent = readRecentSubmission();

    if (
      fingerprint
      && recent
      && recent.fingerprint === fingerprint
      && isRecent(recent, DUPLICATE_WINDOW_MS)
    ) {
      window.__NADO_DUPLICATE_SUBMISSION_PREVENTED__ = true;
      return makeDuplicateSuccessResponse(recent);
    }

    window.__NADO_DUPLICATE_SUBMISSION_PREVENTED__ = false;
    const response = await originalFetch(input, init);

    if (response.ok && fingerprint) {
      try {
        const result = await response.clone().json();
        if (result && result.success === true) {
          saveRecentSubmission({
            fingerprint,
            submittedAt: Date.now()
          });
        }
      } catch (error) {
        // The normal submit flow will handle malformed responses.
      }
    }

    return response;
  };

  function addRecentApplicationBanner() {
    const recent = readRecentSubmission();
    if (!isRecent(recent, RECENT_BANNER_WINDOW_MS)) return;

    const main = document.getElementById('formMain');
    if (!main || document.getElementById('recentApplicationBanner')) return;

    const style = document.createElement('style');
    style.textContent = [
      '.recent-application-banner{margin:16px auto 4px;max-width:720px;padding:14px 16px;border:1px solid #dfe7df;border-radius:14px;background:#f7fbf7;font-size:14px;line-height:1.55;color:#263127;}',
      '.recent-application-banner strong{display:block;margin-bottom:2px;font-size:15px;}',
      '.recent-application-banner span{display:block;color:#566158;}'
    ].join('');
    document.head.appendChild(style);

    const banner = document.createElement('div');
    banner.id = 'recentApplicationBanner';
    banner.className = 'recent-application-banner';
    banner.setAttribute('role', 'status');
    banner.innerHTML = '<strong>최근 신청이 정상적으로 접수되었습니다 ✓</strong>'
      + '<span>같은 신청이라면 다시 작성하지 않으셔도 됩니다. 다른 내용으로 새로 신청하는 경우에는 그대로 작성해주세요.</span>';

    const heading = main.querySelector('h1');
    if (heading && heading.nextSibling) {
      main.insertBefore(banner, heading.nextSibling);
    } else {
      main.insertBefore(banner, main.firstChild);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addRecentApplicationBanner, { once: true });
  } else {
    addRecentApplicationBanner();
  }
})();
