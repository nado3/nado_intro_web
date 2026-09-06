(() => {
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  if (!navToggle || !navLinks || navToggle.dataset.siteNavReady === 'true') return;

  navToggle.dataset.siteNavReady = 'true';
  navToggle.setAttribute('aria-expanded', 'false');

  if (!navLinks.querySelector('.nav-member-login')) {
    const loginItem = document.createElement('li');
    loginItem.innerHTML = '<a class="nav-member-login" href="login.html">학생 로그인</a>';
    const trialItem = navLinks.querySelector('.nav-trial')?.closest('li');
    navLinks.insertBefore(loginItem, trialItem || navLinks.lastElementChild);
  }

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

// Keep public plan copy aligned with the current Business English policy.
(() => {
  const standardCard = [...document.querySelectorAll('.tier-card')]
    .find(card => card.querySelector('.tier-name')?.textContent.trim() === '스탠다드');
  if (standardCard) {
    const englishLine = [...standardCard.querySelectorAll('.tier-features li')]
      .find(item => item.textContent.includes('가능 영어:'));
    if (englishLine) {
      englishLine.textContent = '가능 영어: 일상회화 · 여행영어 · 시험/면접 · 발음교정';
    }
  }

  document.querySelectorAll('.step-details-list li').forEach(item => {
    if (item.textContent.includes('학습 목표 (') && item.textContent.includes('비즈니스')) {
      item.textContent = '학습 목표 (일상회화 / 여행 / 시험 등 · 비즈니스 영어는 프리미엄만 가능)';
    }
  });
})();
