(() => {
  const section = document.getElementById('curriculum');
  if (!section) return;

  const heading = section.querySelector('.home-heading') || section;
  const navigation = document.querySelector('.site-nav');
  let keepAligned = false;
  let pendingFrame = 0;

  const stopAlignment = () => {
    keepAligned = false;
    window.cancelAnimationFrame(pendingFrame);
    pendingFrame = 0;
  };

  const alignCurriculum = (behavior = 'instant') => {
    if (!keepAligned || window.location.hash !== '#curriculum') return;
    window.cancelAnimationFrame(pendingFrame);
    pendingFrame = window.requestAnimationFrame(() => {
      pendingFrame = 0;
      if (!keepAligned || window.location.hash !== '#curriculum') return;
      const navigationBottom = Math.max(0, navigation?.getBoundingClientRect().bottom || 0);
      const top = window.scrollY + heading.getBoundingClientRect().top - navigationBottom - 20;
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: Math.max(0, top), behavior: reduceMotion ? 'instant' : behavior });
    });
  };

  const startAlignment = (behavior = 'instant') => {
    keepAligned = true;
    alignCurriculum(behavior);
  };

  document.querySelectorAll('.site-nav a[href]').forEach(link => {
    const destination = new URL(link.href, window.location.href);
    const homePath = path => path.replace(/index\.html$/, '');
    if (destination.origin !== window.location.origin ||
        homePath(destination.pathname) !== homePath(window.location.pathname) ||
        destination.hash !== '#curriculum') return;

    link.addEventListener('click', event => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey ||
          event.shiftKey || event.altKey || (link.target && link.target !== '_self')) return;
      event.preventDefault();
      if (window.location.hash !== '#curriculum') {
        window.history.pushState(window.history.state, '', '#curriculum');
      }
      startAlignment('smooth');
    });
  });

  // Correct late carousel/font layout shifts only until the reader takes over.
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(() => alignCurriculum());
    const hero = document.querySelector('.hero');
    if (hero) observer.observe(hero);
    if (navigation) observer.observe(navigation);
  }
  document.fonts?.ready.then(() => alignCurriculum());
  window.addEventListener('load', () => alignCurriculum());
  window.addEventListener('pageshow', event => {
    if (!event.persisted) alignCurriculum();
  });
  window.addEventListener('hashchange', () => {
    stopAlignment();
    if (window.location.hash === '#curriculum') startAlignment();
  });
  ['wheel', 'touchstart', 'pointerdown'].forEach(type => {
    window.addEventListener(type, stopAlignment, { passive: true, capture: true });
  });
  window.addEventListener('keydown', event => {
    if (['Tab', 'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ', 'Spacebar'].includes(event.key)) {
      stopAlignment();
    }
  });

  if (window.location.hash === '#curriculum') startAlignment();
})();
