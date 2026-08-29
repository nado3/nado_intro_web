(function () {
  const mobileQuery = window.matchMedia('(max-width: 599px)');
  const TAWK_REVEAL_DELAY = 15000;
  const TAWK_SCROLL_THRESHOLD = 0.3;
  let revealed = false;

  window.Tawk_API = window.Tawk_API || {};

  const revealChatButton = () => {
    if (revealed || typeof window.Tawk_API.showWidget !== 'function') return;
    revealed = true;
    window.Tawk_API.showWidget();
    if (typeof window.Tawk_API.minimize === 'function') window.Tawk_API.minimize();
  };

  const handleScroll = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollable > 0 && window.scrollY / scrollable >= TAWK_SCROLL_THRESHOLD) {
      revealChatButton();
      window.removeEventListener('scroll', handleScroll);
    }
  };

  const previousOnLoad = window.Tawk_API.onLoad;
  window.Tawk_API.onLoad = function () {
    if (typeof previousOnLoad === 'function') previousOnLoad();

    const hasOngoingChat = typeof window.Tawk_API.isChatOngoing === 'function' && window.Tawk_API.isChatOngoing();
    if (hasOngoingChat) {
      revealed = true;
      window.Tawk_API.showWidget();
      return;
    }

    window.Tawk_API.hideWidget();
    window.setTimeout(revealChatButton, TAWK_REVEAL_DELAY);
    window.addEventListener('scroll', handleScroll, { passive: true });
  };

  const resizeChat = () => {
    document.querySelectorAll('iframe').forEach((frame) => {
      const style = getComputedStyle(frame);
      const zIndex = Number(style.zIndex);
      if (style.position !== 'fixed' || zIndex < 1000000) return;

      const rect = frame.getBoundingClientRect();
      if (rect.width > 160 || rect.height > 160) return;

      const scale = mobileQuery.matches ? '0.72' : '0.82';
      if (frame.style.getPropertyValue('transform') === `scale(${scale})`) return;
      frame.style.setProperty('transform', `scale(${scale})`, 'important');
      frame.style.setProperty('transform-origin', 'bottom right', 'important');
    });
  };

  const observer = new MutationObserver(resizeChat);
  observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] });
  resizeChat();
  window.addEventListener('load', resizeChat, { once: true });
})();
