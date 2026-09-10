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

(() => {
  const setText = (root, selector, text) => {
    const el = root?.querySelector(selector);
    if (el) el.textContent = text;
  };

  // Business English: Premium only.
  const standardCard = [...document.querySelectorAll('.tier-card')]
    .find(card => card.querySelector('.tier-name')?.textContent.trim() === '스탠다드');
  if (standardCard) {
    const englishLine = [...standardCard.querySelectorAll('.tier-features li')]
      .find(item => item.textContent.includes('가능 영어:'));
    if (englishLine) englishLine.textContent = '가능 영어: 일상회화 · 여행영어 · 시험/면접 · 발음교정';
  }

  document.querySelectorAll('.step-details-list li').forEach(item => {
    if (item.textContent.includes('학습 목표 (') && item.textContent.includes('비즈니스')) {
      item.textContent = '학습 목표 (일상회화 / 여행 / 시험 등 · 비즈니스 영어는 프리미엄만 가능)';
    }
    if (item.textContent.includes('수업 만족도에 따라 선생님 유지/변경 가능')) {
      item.textContent = '선생님 변경이 필요하면 나도에 문의 가능';
    }
  });

  // Current teacher-selection flow.
  const matchFeature = [...document.querySelectorAll('.feature-card')]
    .find(card => card.querySelector('.feature-title')?.textContent.trim() === '맞춤형 매칭');
  if (matchFeature) {
    setText(matchFeature, '.feature-title', '조건에 맞는 선생님 선택');
    setText(matchFeature, '.feature-desc', '입력한 조건에 맞는 선생님을 직접 확인하고 선택할 수 있습니다.');
  }

  const whyTeacher = [...document.querySelectorAll('.why-point')]
    .find(point => point.querySelector('.why-point-title')?.textContent.trim() === '나에게 맞는 선생님');
  if (whyTeacher) {
    setText(whyTeacher, '.why-point-desc', '수업 조건에 맞는 선생님을 직접 확인하고 선택하세요. 가능한 선생님이 없으면 나도가 맞춤 추천을 도와드립니다.');
  }

  const homeSteps = [...document.querySelectorAll('.steps-grid .step')];
  const homeStep1 = homeSteps.find(step => step.querySelector('.step-num')?.textContent.trim() === '01');
  const homeStep2 = homeSteps.find(step => step.querySelector('.step-num')?.textContent.trim() === '02');
  if (homeStep1) {
    setText(homeStep1, '.step-title', '정보 입력');
    setText(homeStep1, '.step-desc', '원하는 플랜, 지역, 시간대와 학습 목표를 입력하면 조건에 맞는 선생님을 확인할 수 있습니다.');
  }
  if (homeStep2) {
    setText(homeStep2, '.step-title', '선생님 선택');
    setText(homeStep2, '.step-desc', '프로필과 함께 가능한 시간을 확인해 직접 선택하세요. 가능한 선생님이 없으면 신청 내용을 바탕으로 나도가 별도로 추천해드립니다.');
  }

  const howSteps = [...document.querySelectorAll('.step-item')];
  const howStep1 = howSteps.find(step => step.querySelector('.step-number')?.textContent.trim() === '01');
  const howStep2 = howSteps.find(step => step.querySelector('.step-number')?.textContent.trim() === '02');
  if (howStep1) {
    setText(howStep1, '.step-title', '정보 입력 및 신청');
    setText(howStep1, '.step-desc', '원하는 플랜, 수업 지역과 장소, 가능한 시간대, 학습 목표 등을 입력해주세요. 입력한 조건을 기준으로 가능한 선생님을 확인합니다.');
  }
  if (howStep2) {
    setText(howStep2, '.step-title', '선생님 선택 또는 맞춤 추천');
    setText(howStep2, '.step-desc', '조건에 맞는 선생님이 있으면 프로필과 함께 가능한 시간을 확인한 뒤 직접 선택할 수 있습니다. 바로 선택 가능한 선생님이 없으면 신청은 그대로 접수되며, 나도가 내용을 확인해 잘 맞는 선생님을 별도로 추천해드립니다.');
    setText(howStep2, '.step-details-title', '선생님 확인 기준');
    const list = howStep2.querySelector('.step-details-list');
    if (list) {
      list.innerHTML = [
        '선택한 플랜',
        '희망 지역 및 장소',
        '수업 가능 시간대 일치 여부',
        '학습 목표 및 요청사항',
        '가능한 선생님이 없으면 신청 내용 확인 후 나도가 별도 추천'
      ].map(text => '<li>' + text + '</li>').join('');
    }
    const note = howStep2.querySelector('.step-details p');
    if (note) note.textContent = '*표시되는 선생님은 선택한 플랜, 지역, 일정 등 신청 조건에 따라 달라질 수 있습니다.';
  }

  document.querySelectorAll('.info-text').forEach(el => {
    if (el.textContent.includes('대중교통 이용이 편리한 지역 우선 매칭')) {
      el.innerHTML = el.innerHTML
        .replace('선생님과 협의하여 최적의 장소 선정', '선생님과 협의하여 세부 장소 확정')
        .replace('대중교통 이용이 편리한 지역 우선 매칭', '선택한 희망 지역과 선생님 가능 범위 안에서 조율');
    }
  });

  const faqItems = [...document.querySelectorAll('.faq-item')];

  const teacherFaq = faqItems.find(item => item.querySelector('.faq-question')?.textContent.includes('선생님은 어떻게 매칭'));
  if (teacherFaq) {
    setText(teacherFaq, '.faq-question', 'Q. 선생님은 어떻게 선택하나요?');
    setText(teacherFaq, '.faq-answer', '신청 과정에서 선택한 플랜, 희망 지역과 장소, 가능한 시간대 등을 기준으로 조건에 맞는 선생님을 확인할 수 있습니다. 가능한 선생님이 있으면 프로필과 함께 겹치는 시간을 확인한 뒤 직접 선택합니다. 바로 선택 가능한 선생님이 없으면 신청은 정상적으로 접수되며, 나도가 확인 후 맞춤 추천을 안내해드립니다.');
  }

  const scheduleFaq = faqItems.find(item => item.querySelector('.faq-question')?.textContent.includes('수업 일정은 어떻게 정하나요'));
  if (scheduleFaq) {
    setText(scheduleFaq, '.faq-answer', '선택한 선생님과 직접 소통하여 서로 편한 시간에 수업 일정을 조율합니다. 평일 저녁이나 주말 등 서로 가능한 범위에서 유연하게 정할 수 있습니다.');
  }

  const changeFaq = faqItems.find(item => item.querySelector('.faq-question')?.textContent.includes('선생님을 바꿀 수 있나요'));
  if (changeFaq) {
    setText(changeFaq, '.faq-answer', '네, 가능합니다. 수업 진행 중 선생님 변경이 필요하면 나도에 문의해주세요. 현재 수업 진행 상황과 가능한 선생님 일정을 확인한 뒤 안내드립니다.');
  }

  const paymentFaq = faqItems.find(item => item.querySelector('.faq-question')?.textContent.includes('결제 방법'));
  if (paymentFaq) {
    setText(paymentFaq, '.faq-answer', '현재는 계좌이체로 진행합니다. 첫 달 수업료는 나도를 통해 결제하며, 선생님 연결 후 첫 수업 일정이 확정되면 카카오톡으로 입금 방법을 안내드립니다. 첫 달 이후부터 같은 선생님과 계속 수업하는 경우에는 수업료를 선생님에게 직접 지급합니다.');
  }

  if (document.querySelector('link[rel="canonical"]')?.href.endsWith('/how.html')) {
    const description = '서울 및 인천 지역에서 진행하는 나도 영어회화의 신청, 선생님 선택 또는 맞춤 추천, 첫 수업 과정을 확인하세요.';
    const metaDescription = document.querySelector('meta[name="description"]');
    const ogDescription = document.querySelector('meta[property="og:description"]');
    const twitterDescription = document.querySelector('meta[name="twitter:description"]');
    if (metaDescription) metaDescription.content = description;
    if (ogDescription) ogDescription.content = description;
    if (twitterDescription) twitterDescription.content = description;
  }

  // Terms cleanup.
  if (document.body.classList.contains('legal-page')) {
    document.querySelectorAll('.doc-card').forEach(card => {
      const heading = card.querySelector('h2')?.textContent.trim() || '';

      if (heading.startsWith('제2조')) {
        card.querySelectorAll('li').forEach(li => {
          if (li.textContent.includes('"요금제"')) {
            li.innerHTML = '<strong>"요금제"</strong>란 회사가 제공하는 이코노미, 스탠다드, 프리미엄 수업료 등급을 의미합니다. (제7조 참조)';
          }
          if (li.textContent.includes('"매칭비"')) li.remove();
          if (li.textContent.includes('"매칭"')) {
            li.innerHTML = '<strong>"선생님 선택 및 연결"</strong>이란 학생이 신청 조건에 맞는 선생님을 직접 선택하거나, 바로 선택 가능한 선생님이 없는 경우 회사가 적합한 선생님을 추천하여 연결하는 절차를 의미합니다.';
          }
        });
      }

      if (heading.startsWith('제3조')) {
        const items = card.querySelectorAll('li');
        if (items[1]) {
          items[1].textContent = '회사는 첫 달 수업료에 한하여 학생으로부터 수업료 전액을 수령한 후, 회사와 선생님 회원 간 정해진 기준에 따라 정산하는 방식으로 결제 절차에 관여합니다. 첫 달 이후 같은 선생님과 수업을 계속하는 경우 수업료는 학생이 선생님 회원에게 직접 지급합니다.';
        }
      }

      if (heading.startsWith('제5조')) {
        const items = card.querySelectorAll('li');
        if (items[1]) items[1].textContent = '회사는 인증된 선생님 회원만 학생의 선택 또는 추천 대상으로 제공합니다.';
      }

      if (heading.startsWith('제6조')) {
        const items = card.querySelectorAll('li');
        if (items[0]) {
          items[0].textContent = '학생이 신청 폼에 플랜, 영어 수준, 학습 목표, 희망 시간대와 장소 등을 제출하면 조건에 맞는 선생님을 확인하고 직접 선택할 수 있습니다. 바로 선택 가능한 선생님이 없는 경우 회사가 신청 내용을 확인하여 적합한 선생님을 별도로 추천할 수 있습니다.';
        }
        if (items[1]) {
          items[1].textContent = '선생님 선택 또는 추천 후 구체적인 수업 일정과 세부 장소는 학생과 선생님 회원이 직접 협의하여 정합니다.';
        }
        if (items[2]) {
          items[2].textContent = '바로 선택 가능한 선생님이 없더라도 신청은 정상적으로 접수되며, 회사는 신청 내용을 확인한 뒤 가능한 선생님 또는 진행 방법을 별도로 안내할 수 있습니다.';
        }
      }

      if (heading.startsWith('제7조')) {
        const title = card.querySelector('h2');
        if (title) title.textContent = '제7조 (요금제 및 결제)';
        const items = card.querySelectorAll(':scope > ol > li');
        if (items[1]) {
          items[1].textContent = '첫 달 수업료는 회사가 지정한 계좌로 이체합니다. 선생님 연결 후 첫 수업 일정이 확정되면 회사가 카카오톡 등으로 입금 방법을 안내합니다.';
        }
        if (items[2]) {
          items[2].textContent = '회사는 첫 달 결제 및 선생님 정산 절차를 운영하며, 선생님 회원에 대한 정산은 회사와 선생님 회원 간 별도 기준에 따라 이루어집니다.';
        }
        if (items[3]) {
          items[3].textContent = '동일한 선생님 회원과 수업을 계속하는 경우 첫 달 이후부터 학생이 해당 선생님 회원에게 수업료를 직접 지급합니다. 선생님 변경이 필요한 경우 나도를 통해 요청할 수 있으며, 가능한 선생님과 진행 방법은 개별 안내합니다.';
        }
      }

      if (heading.startsWith('제8조')) {
        const title = card.querySelector('h2');
        if (title) title.textContent = '제8조 (환불)';
        const items = card.querySelectorAll(':scope > ol > li');
        if (items[0]) items[0].textContent = '결제 취소 또는 환불이 필요한 경우 학생은 나도에 문의하여 처리 절차를 안내받을 수 있습니다.';
        if (items[1]) items[1].textContent = '회사의 귀책사유 또는 선생님 회원의 사정으로 수업 시작이 불가능해진 경우, 회사는 환불 또는 대체 선생님 연결 등 필요한 조치를 안내합니다.';
      }

      if (heading.startsWith('제9조')) {
        card.querySelectorAll('li').forEach(li => {
          if (li.textContent.includes('재매칭을 반복적으로 요청하며 매칭비 지급을 회피')) li.remove();
        });
      }

      if (heading.startsWith('제12조')) {
        const items = card.querySelectorAll('li');
        if (items[1]) items[1].textContent = '결제 및 서비스 이용과 관련하여 발생한 분쟁은 회원과 회사 간 협의를 통해 해결함을 원칙으로 합니다.';
      }
    });
  }

  // Child surcharge retired.
  const retiredCopy = '초등학생 이하 수업은 월 2만원 추가';
  document.querySelectorAll('.info-text, .faq-answer, .step-details-list li, .tier-features li').forEach(el => {
    if (!el.textContent.includes(retiredCopy)) return;
    if (el.tagName === 'LI' && el.textContent.trim() === retiredCopy) {
      el.remove();
      return;
    }
    el.innerHTML = el.innerHTML
      .replace(new RegExp('<br>\\s*' + retiredCopy, 'g'), '')
      .replace(new RegExp(retiredCopy + '\\s*<br>', 'g'), '')
      .replace(retiredCopy, '');
  });
})();

// Home hero: convert the existing teacher pile into a continuous draggable marquee.
// This runs after index.html's inline teacher renderer, so the card contents stay exactly the same.
(() => {
  const initHeroTeacherMarquee = () => {
    const hero = document.querySelector('.hero');
    const heroInner = hero?.querySelector('.hero-inner');
    const heroLeft = hero?.querySelector('.hero-left');
    const heroRight = hero?.querySelector('.hero-right');
    const sourceDeck = document.getElementById('randomTeachers');
    if (!hero || !heroInner || !heroLeft || !heroRight || !sourceDeck || sourceDeck.dataset.marqueeConverted === 'true') return;

    const sourceCards = [...sourceDeck.querySelectorAll('.flip-teacher-card')];
    if (!sourceCards.length) return;
    sourceDeck.dataset.marqueeConverted = 'true';

    if (!document.getElementById('homeHeroTeacherMarqueeStyles')) {
      const style = document.createElement('style');
      style.id = 'homeHeroTeacherMarqueeStyles';
      style.textContent = `
        .hero .hero-inner {
          max-width: 1180px;
          grid-template-columns: minmax(0, .82fr) minmax(0, 1.18fr);
          gap: .6rem;
        }
        .hero .hero-right {
          min-width: 0;
          overflow: visible;
        }
        .home-hero-teacher-marquee-shell {
          width: 100%;
          overflow: hidden;
          padding: 6px 0 10px;
          -webkit-mask-image: linear-gradient(to right, transparent 0, #000 8%, #000 92%, transparent 100%);
          mask-image: linear-gradient(to right, transparent 0, #000 8%, #000 92%, transparent 100%);
        }
        .home-hero-teacher-marquee-track {
          display: flex;
          width: max-content;
          will-change: transform;
          cursor: grab;
          user-select: none;
          -webkit-user-select: none;
          touch-action: pan-y;
        }
        .home-hero-teacher-marquee-track.is-dragging { cursor: grabbing; }
        .home-hero-teacher-marquee-group {
          display: flex;
          gap: .65rem;
          padding-right: .65rem;
          flex-shrink: 0;
        }
        .home-hero-teacher-marquee-group .flip-teacher-card {
          position: relative;
          width: 290px;
          flex: 0 0 290px;
          min-width: 0;
          min-height: 430px;
          padding: 1.35rem;
          display: flex;
          flex-direction: column;
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: 1.5rem;
          box-shadow: 0 16px 36px rgba(36,74,120,.18);
          transform: none !important;
          opacity: 1 !important;
          pointer-events: auto !important;
          cursor: inherit;
        }
        .home-hero-teacher-marquee-group .teach-avatar {
          width: 128px;
          height: 128px;
          margin: 0 auto .5rem;
        }
        .home-hero-teacher-marquee-group .teach-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          pointer-events: none;
          -webkit-user-drag: none;
        }
        .home-hero-teacher-marquee-group .teach-name {
          font-size: 1.4rem;
          font-weight: 800;
        }
        .home-hero-teacher-marquee-group .teach-school {
          margin-top: .25rem;
          font-size: .92rem;
        }
        .home-hero-teacher-marquee-group .teach-major {
          margin: .1rem 0 0;
          font-size: .92rem;
        }
        .home-hero-teacher-marquee-group .hero-teacher-bio {
          min-height: 92px;
          margin: .55rem 0 0;
          color: var(--dark-gray);
          font-size: .92rem;
          line-height: 1.55;
          text-align: left;
          display: block;
          overflow: visible;
        }
        .home-hero-teacher-marquee-group .teach-tags {
          min-height: 29px;
          margin-top: auto;
          padding-top: .45rem;
          align-items: center;
        }
        .home-hero-teacher-marquee-group .flip-teacher-hint { display: none; }

        @media (max-width: 900px) {
          .hero {
            padding-left: 0 !important;
            padding-right: 0 !important;
          }
          .hero .hero-inner {
            display: block;
            max-width: none;
          }
          .hero .hero-left {
            padding-left: var(--page-gutter, 1.5rem);
            padding-right: var(--page-gutter, 1.5rem);
            max-width: 760px;
            margin: 0 auto .7rem;
          }
          .hero .hero-right { min-height: 0; }
          .home-hero-teacher-marquee-shell {
            width: 100vw;
            padding: 4px 0 10px;
            -webkit-mask-image: none;
            mask-image: none;
          }
        }

        @media (max-width: 599px) {
          .hero { padding-bottom: 1.3rem !important; }
          .hero .hero-left { margin-bottom: .3rem; }
          .home-hero-teacher-marquee-shell { padding: 2px 0 6px; }
          .home-hero-teacher-marquee-group .flip-teacher-card {
            width: 260px;
            flex-basis: 260px;
            min-height: 382px;
            padding: .9rem;
            border-radius: 1.25rem;
          }
          .home-hero-teacher-marquee-group .teach-avatar {
            width: 148px;
            height: 148px;
            margin: 0 auto .35rem;
          }
          .home-hero-teacher-marquee-group .teach-name {
            font-size: 1.22rem;
            margin-bottom: .15rem;
          }
          .home-hero-teacher-marquee-group .teach-school,
          .home-hero-teacher-marquee-group .teach-major {
            font-size: .84rem;
            line-height: 1.35;
          }
          .home-hero-teacher-marquee-group .teach-major { margin-bottom: 0; }
          .home-hero-teacher-marquee-group .hero-teacher-bio {
            min-height: 68px;
            margin: .45rem 0 0;
            font-size: .84rem;
            line-height: 1.45;
          }
          .home-hero-teacher-marquee-group .tag {
            padding: .23rem .55rem;
            font-size: .76rem;
          }
          .home-hero-teacher-marquee-group .teach-tags {
            min-height: 27px;
            padding-top: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }

    const cardsHtml = sourceCards.map(card => {
      const clone = card.cloneNode(true);
      clone.removeAttribute('data-position');
      clone.removeAttribute('role');
      clone.removeAttribute('tabindex');
      clone.removeAttribute('aria-hidden');
      clone.removeAttribute('aria-label');
      clone.querySelector('.flip-teacher-hint')?.remove();
      return clone.outerHTML;
    }).join('');

    heroRight.innerHTML = `
      <div class="home-hero-teacher-marquee-shell" aria-label="추천 선생님 카드">
        <div class="home-hero-teacher-marquee-track">
          <div class="home-hero-teacher-marquee-group">${cardsHtml}</div>
          <div class="home-hero-teacher-marquee-group" aria-hidden="true">${cardsHtml}</div>
        </div>
      </div>
    `;

    const shell = heroRight.querySelector('.home-hero-teacher-marquee-shell');
    const track = heroRight.querySelector('.home-hero-teacher-marquee-track');
    const firstGroup = heroRight.querySelector('.home-hero-teacher-marquee-group');
    if (!shell || !track || !firstGroup) return;

    let x = 0;
    let groupWidth = 0;
    let dragging = false;
    let lastPointerX = 0;
    let lastFrame = performance.now();
    let animationFrame = 0;

    const pixelsPerSecond = () => window.matchMedia('(max-width: 599px)').matches ? 18 : 20;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const normalizeX = () => {
      if (!groupWidth) return;
      while (x >= 0) x -= groupWidth;
      while (x < -groupWidth) x += groupWidth;
    };

    const renderTrack = () => {
      track.style.transform = `translate3d(${x}px, 0, 0)`;
    };

    const measure = () => {
      groupWidth = firstGroup.getBoundingClientRect().width;
      if (!groupWidth) return;
      if (!Number.isFinite(x) || x === 0) x = -groupWidth;
      normalizeX();
      renderTrack();
    };

    const animate = now => {
      const dt = Math.min((now - lastFrame) / 1000, .05);
      lastFrame = now;
      if (!dragging && groupWidth && !reducedMotion.matches) {
        x += pixelsPerSecond() * dt;
        normalizeX();
        renderTrack();
      }
      animationFrame = requestAnimationFrame(animate);
    };

    track.addEventListener('pointerdown', event => {
      dragging = true;
      lastPointerX = event.clientX;
      track.classList.add('is-dragging');
      track.setPointerCapture?.(event.pointerId);
    });

    track.addEventListener('pointermove', event => {
      if (!dragging) return;
      const dx = event.clientX - lastPointerX;
      lastPointerX = event.clientX;
      x += dx;
      normalizeX();
      renderTrack();
    });

    const endDrag = event => {
      if (!dragging) return;
      dragging = false;
      track.classList.remove('is-dragging');
      try { track.releasePointerCapture?.(event.pointerId); } catch (_) {}
    };

    track.addEventListener('pointerup', endDrag);
    track.addEventListener('pointercancel', endDrag);
    track.addEventListener('dragstart', event => event.preventDefault());
    window.addEventListener('resize', measure, { passive: true });

    requestAnimationFrame(() => {
      measure();
      lastFrame = performance.now();
      animationFrame = requestAnimationFrame(animate);
    });

    window.addEventListener('pagehide', () => cancelAnimationFrame(animationFrame), { once: true });
  };

  // index.html renders the source cards in the immediately following inline script.
  setTimeout(initHeroTeacherMarquee, 0);
})();
