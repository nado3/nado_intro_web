(function () {
  window.setupTeacherCarousel = function (container, alwaysMove = false) {
    if (!container || (!alwaysMove && !window.matchMedia('(max-width: 900px)').matches)) return;
    if (container.dataset.carouselReady === 'true') return;

    const cards = Array.from(container.children);
    if (!cards.length) return;

    container.dataset.carouselReady = 'true';
    container.classList.add('mobile-teacher-carousel', 'auto-teacher-carousel');

    const clones = cards.map(card => {
      const clone = card.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      clone.classList.remove('fade-in');
      clone.classList.add('visible');
      container.appendChild(clone);
      return clone;
    });

    const step = 1;
    const interval = 20;

    const moveContinuously = () => {
      const loopWidth = clones[0].offsetLeft - cards[0].offsetLeft;

      if (loopWidth > 0) {
        container.scrollLeft += step;
        if (container.scrollLeft >= loopWidth) container.scrollLeft -= loopWidth;
      }
    };

    window.setInterval(moveContinuously, interval);
  };
})();
