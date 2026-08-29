(() => {
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  if (!navToggle || !navLinks || navToggle.dataset.siteNavReady === 'true') return;

  navToggle.dataset.siteNavReady = 'true';
  navToggle.setAttribute('aria-expanded', 'false');

  const closeMenu = () => {
    navLinks.classList.remove('mobile-open');
    navToggle.textContent = '☰';
    navToggle.setAttribute('aria-expanded', 'false');
  };

  navToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('mobile-open');
    navToggle.textContent = isOpen ? '✕' : '☰';
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  navLinks.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
})();
