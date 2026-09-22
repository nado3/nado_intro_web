(function () {
  'use strict';

  const deck = document.getElementById('randomTeachers');
  if (!deck) return;

  const source = Array.isArray(window.NADO_TEACHER_DIRECTORY_FALLBACK)
    ? window.NADO_TEACHER_DIRECTORY_FALLBACK
    : [];
  const teachers = source.filter(teacher => (
    teacher
    && teacher.displayName
    && teacher.profilePhotoPath
    && teacher.regions
    && Object.values(teacher.regions).some(region => (
      region && Array.isArray(region.availability) && region.availability.length
    ))
  ));

  if (!teachers.length) {
    deck.closest('.hero-right')?.setAttribute('hidden', '');
    return;
  }

  function escapeHtml(value) {
    return String(value || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function shuffled(items) {
    const copy = items.slice();
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
    }
    return copy;
  }

  function schoolClass(value) {
    const school = String(value || '').toLocaleLowerCase();
    if (school.includes('mason')) return ' teach-school--mason';
    if (school.includes('utah')) return ' teach-school--utah';
    return '';
  }

  function planLabel(value) {
    return ({ economy: 'Economy', standard: 'Standard', premium: 'Premium' })[value] || '';
  }

  const orderedTeachers = shuffled(teachers);
  deck.innerHTML = orderedTeachers.map((teacher, index) => {
    const isFlag=label=>/^[\u{1F1E6}-\u{1F1FF}]{2}$/u.test(label);
    const keywords=(window.nadoTeacherProfile?.(teacher).keywords || teacher.tags || []).filter(label=>label&&!isFlag(label));
    const isLevel=label=>/초급|중급|고급/.test(label);
    const badge=label=>`<span class="tag">${escapeHtml(label)}</span>`;
    const badges='<div class="teacher-keyword-meta">'+keywords.filter(isLevel).map(badge).join('')+'</div>'
      +'<div class="teacher-keyword-strengths">'+keywords.filter(label=>!isLevel(label)).slice(0,2).map(badge).join('')+'</div>';
    const roomy = String(teacher.major || "").length <= 24 && keywords.filter(label=>!isLevel(label)).slice(0,2).join("").length <= 16;
    const compactKeywords = String(teacher.displayName || '').trim().toLocaleLowerCase() === 'hayden';
    return `<article class="teach-card flip-teacher-card${roomy ? " teacher-keywords-roomy" : ""}${compactKeywords ? " teacher-keywords-compact" : ""}" data-position="${index}" data-home-teacher="${index}" role="button" tabindex="${index === 0 ? '0' : '-1'}" aria-label="${escapeHtml(teacher.displayName)} 선생님. 상세 프로필 보기" aria-hidden="${index === 0 ? 'false' : 'true'}">
      <div class="flip-teacher-hint">선생님 자세히 알아보기 <span aria-hidden="true">↗</span></div>
      <div class="teach-avatar"><img src="${escapeHtml(teacher.profilePhotoPath)}" alt="${escapeHtml(teacher.displayName)} 선생님" loading="${index === 0 ? 'eager' : 'lazy'}"${index === 0 ? ' fetchpriority="high"' : ''} decoding="async" data-homepage-teacher-photo></div>
      <div class="teach-name">${escapeHtml(teacher.displayName)}</div>
      <div class="teach-school${schoolClass(teacher.school)}">${escapeHtml(teacher.school)}</div>
      <div class="teach-major${String(teacher.major || "").length > 24 ? " teach-major--long" : ""}">${escapeHtml(teacher.major)}</div>

      <div class="teach-tags" aria-label="선생님 키워드">${badges}</div>
    </article>`;
  }).join('');

  deck.querySelectorAll('[data-homepage-teacher-photo]').forEach(photo => {
    photo.addEventListener('error', () => { photo.hidden = true; }, { once: true });
  });

  const cards = Array.from(deck.children);
  let activeIndex = 0;

  function render() {
    cards.forEach((card, index) => {
      const position = (index - activeIndex + cards.length) % cards.length;
      card.dataset.position = String(position);
      card.tabIndex = position === 0 ? 0 : -1;
      card.setAttribute('aria-hidden', position === 0 ? 'false' : 'true');
    });
  }

  function showNext(options) {
    activeIndex = (activeIndex + 1) % cards.length;
    render();
    if (options && options.focus) cards[activeIndex].focus({ preventScroll: true });
  }

  window.NADOOpenHomeTeacher = (index) => {
    const teacher = orderedTeachers[index];
    if (!teacher) return;
    const region = ['Songdo', 'Seoul'].find(key => teacher.regions[key]?.availability?.length);
    const url = new URL('teachers.html', location.href);
    url.searchParams.set('region', region || 'Songdo');
    url.searchParams.set('teacher', teacher.displayName);
    location.assign(url.href);
  };
  deck.addEventListener('click', event => {
    const card = event.target.closest('[data-home-teacher]');
    if (card) window.NADOOpenHomeTeacher(Number(card.dataset.homeTeacher), card);
  });
  deck.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      event.target.click();
    }
  });

  render();
}());
