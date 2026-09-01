(function () {
  const mobileQuery = window.matchMedia('(max-width: 599px)');
  const getRevealDelay = () => mobileQuery.matches ? 5000 : 10000;
  const getScrollThreshold = () => mobileQuery.matches ? 0.3 : 0.4;
  let revealed = false;

  window.Tawk_API = window.Tawk_API || {};

  const previousOnBeforeLoad = window.Tawk_API.onBeforeLoad;
  window.Tawk_API.onBeforeLoad = function () {
    if (typeof previousOnBeforeLoad === 'function') previousOnBeforeLoad();
    if (typeof window.Tawk_API.hideWidget === 'function') window.Tawk_API.hideWidget();
  };

  const revealChatButton = () => {
    if (revealed || typeof window.Tawk_API.showWidget !== 'function') return;
    revealed = true;
    window.Tawk_API.showWidget();
    if (typeof window.Tawk_API.minimize === 'function') window.Tawk_API.minimize();
  };

  const handleScroll = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollable > 0 && window.scrollY / scrollable >= getScrollThreshold()) {
      revealChatButton();
      window.removeEventListener('scroll', handleScroll);
    }
  };

  const previousOnLoad = window.Tawk_API.onLoad;
  window.Tawk_API.onLoad = function () {
    if (typeof previousOnLoad === 'function') previousOnLoad();

    window.Tawk_API.hideWidget();
    window.setTimeout(revealChatButton, getRevealDelay());
    window.addEventListener('scroll', handleScroll, { passive: true });
  };

  const resizeChat = () => {
    document.querySelectorAll('iframe').forEach((frame) => {
      const style = getComputedStyle(frame);
      const zIndex = Number(style.zIndex);
      if (style.position !== 'fixed' || zIndex < 1000000) return;

      const rect = frame.getBoundingClientRect();
      if (rect.width > 160 || rect.height > 160) return;

      const scale = '0.8';
      if (frame.style.getPropertyValue('transform') === `scale(${scale})`) return;
      frame.style.setProperty('transform', `scale(${scale})`, 'important');
      frame.style.setProperty('transform-origin', 'bottom right', 'important');
    });
  };

  const observer = new MutationObserver(resizeChat);
  observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] });
  resizeChat();
  window.addEventListener('load', resizeChat, { once: true });
  mobileQuery.addEventListener('change', resizeChat);
})();
