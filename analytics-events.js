(function () {
  'use strict';

  const LIVE_HOSTS = new Set(['hellonado.com', 'www.hellonado.com']);

  function isLiveAnalyticsHost() {
    return LIVE_HOSTS.has(window.location.hostname);
  }

  function sendEvent(eventName, params) {
    if (!isLiveAnalyticsHost()) return;
    if (typeof window.gtag !== 'function') return;
    window.gtag('event', eventName, Object.assign({
      page_path: window.location.pathname,
      page_location: window.location.href
    }, params || {}));
  }

  function cleanText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim().slice(0, 100);
  }

  function getHref(element) {
    if (!element) return '';
    try {
      return new URL(element.getAttribute('href') || '', window.location.href).href;
    } catch (_) {
      return element.getAttribute('href') || '';
    }
  }

  function applicationTypeFromPage() {
    if (/\/trial\.html$/i.test(window.location.pathname)) return 'trial';
    if (/\/apply\.html$/i.test(window.location.pathname)) return 'regular';
    return '';
  }

  function kakaoLocation(link) {
    if (link.classList.contains('success-kakao-btn')) return 'submission_success';
    if (link.classList.contains('kakao-chat-button')) return 'floating_button';
    return 'other';
  }

  function trackApplicationPageView() {
    const applicationType = applicationTypeFromPage();
    if (!applicationType) return;

    const params = new URLSearchParams(window.location.search);
    sendEvent('application_page_view', {
      application_type: applicationType,
      lesson_kind: cleanText(params.get('lesson_kind') || applicationType),
      teacher: cleanText(params.get('teacher') || params.get('teacher_name') || ''),
      trial_type: cleanText(params.get('trial_type') || '')
    });
  }

  function trackClick(event) {
    const link = event.target.closest('a');
    if (!link) return;

    if (link.matches('.hero-buttons .btn-primary')) {
      sendEvent('hero_regular_cta_click', {
        cta_location: 'hero',
        cta_text: cleanText(link.textContent),
        destination: getHref(link)
      });
      return;
    }

    if (link.matches('.hero-buttons .btn-text')) {
      sendEvent('hero_trial_cta_click', {
        cta_location: 'hero',
        cta_text: cleanText(link.textContent),
        destination: getHref(link)
      });
      return;
    }

    if (link.matches('.tier-card .tier-cta')) {
      const card = link.closest('.tier-card');
      const planName = cleanText(card && card.querySelector('.tier-name')?.textContent);
      sendEvent('plan_cta_click', {
        cta_location: 'pricing',
        cta_text: cleanText(link.textContent),
        plan_name: planName,
        destination: getHref(link)
      });
      return;
    }

    if (link.matches('.home-final-buttons a')) {
      const isTrial = link.classList.contains('home-trial-button') || /trial\.html/i.test(link.getAttribute('href') || '');
      sendEvent('bottom_cta_click', {
        cta_location: 'bottom',
        cta_type: isTrial ? 'trial' : 'regular',
        cta_text: cleanText(link.textContent),
        destination: getHref(link)
      });
      return;
    }

    if (link.matches('a[href*="pf.kakao.com"]')) {
      sendEvent('kakao_click', {
        cta_location: kakaoLocation(link),
        cta_text: cleanText(link.textContent),
        destination: getHref(link),
        application_type: applicationTypeFromPage()
      });
    }
  }

  document.addEventListener('click', trackClick);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', trackApplicationPageView, { once: true });
  } else {
    trackApplicationPageView();
  }
}());
