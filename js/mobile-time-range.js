(() => {
  const MOBILE_QUERY = '(hover: none), (pointer: coarse)';
  let pendingStart = null;

  const isMobileRangeMode = () => window.matchMedia(MOBILE_QUERY).matches;

  const slotMinutes = (key) => {
    const parts = String(key || '').split(' ');
    const time = parts[1] || '';
    const [hour, minute] = time.split(':').map(Number);
    return (hour * 60) + minute;
  };

  const slotDay = (key) => String(key || '').split(' ')[0] || '';

  const getSchedule = () => {
    if (!Array.isArray(answers.schedule)) answers.schedule = [];
    return answers.schedule;
  };

  const refreshMobileCopy = () => {
    if (!isMobileRangeMode()) return;
    const grid = document.getElementById('timeSlotGrid');
    if (!grid) return;

    const qsub = document.querySelector('.qsub');
    const desiredSub = pendingStart
      ? '끝 시간을 선택해주세요.'
      : '시작 시간을 누른 뒤 끝 시간을 눌러주세요.';

    if (qsub && qsub.textContent !== desiredSub) {
      qsub.textContent = desiredSub;
    }

    const desiredHelp = '첫 번째 탭은 시작 시간, 두 번째 탭은 끝 시간이에요.<br>선택한 범위가 30분 단위로 자동 선택돼요.';
    const labels = grid.parentElement ? grid.parentElement.querySelectorAll('.field-label') : [];
    labels.forEach((label) => {
      if (
        label.textContent.includes('30분 단위로 가능한 시간을') &&
        label.innerHTML !== desiredHelp
      ) {
        label.innerHTML = desiredHelp;
      }
    });
  };

  const clearPendingVisual = () => {
    document.querySelectorAll('.time-slot.range-start').forEach((cell) => {
      cell.classList.remove('range-start');
    });
    pendingStart = null;
    refreshMobileCopy();
  };

  const commitRange = (startKey, endKey) => {
    const day = slotDay(startKey);
    if (!day || day !== slotDay(endKey)) return;

    const start = slotMinutes(startKey);
    const end = slotMinutes(endKey);
    const min = Math.min(start, end);
    const max = Math.max(start, end);
    const schedule = getSchedule();
    const startWasSelected = schedule.includes(startKey);

    document.querySelectorAll('.time-slot').forEach((cell) => {
      const key = cell.dataset.key || '';
      if (slotDay(key) !== day) return;
      const minutes = slotMinutes(key);
      if (minutes < min || minutes > max) return;

      const idx = schedule.indexOf(key);
      if (startWasSelected) {
        if (idx > -1) schedule.splice(idx, 1);
      } else if (idx === -1) {
        schedule.push(key);
      }
    });

    schedule.sort((a, b) => {
      const dayOrder = ['월','화','수','목','금','토','일'];
      const dayDiff = dayOrder.indexOf(slotDay(a)) - dayOrder.indexOf(slotDay(b));
      return dayDiff || (slotMinutes(a) - slotMinutes(b));
    });

    pendingStart = null;
    renderStep();
  };

  const handleMobileSlotTap = (cell) => {
    const key = cell.dataset.key;
    if (!key) return;

    if (!pendingStart) {
      pendingStart = key;
      cell.classList.add('range-start');
      refreshMobileCopy();
      return;
    }

    if (pendingStart === key) {
      clearPendingVisual();
      return;
    }

    commitRange(pendingStart, key);
  };

  document.addEventListener('touchend', (event) => {
    if (!isMobileRangeMode()) return;
    const cell = event.target.closest && event.target.closest('.time-slot');
    if (!cell) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    handleMobileSlotTap(cell);
  }, { capture: true, passive: false });

  document.addEventListener('mousedown', (event) => {
    if (!isMobileRangeMode()) return;
    const cell = event.target.closest && event.target.closest('.time-slot');
    if (!cell) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  }, true);

  document.addEventListener('click', (event) => {
    if (!isMobileRangeMode()) return;
    const tab = event.target.closest && event.target.closest('.day-tab');
    if (!tab) return;
    clearPendingVisual();
    setTimeout(refreshMobileCopy, 0);
  }, true);

  const style = document.createElement('style');
  style.textContent = `
    /* Keep Korean duration descriptions from breaking inside words. */
    .duration-opt-desc {
      word-break: keep-all !important;
      overflow-wrap: normal !important;
      text-wrap: balance;
    }

    @media (hover: none), (pointer: coarse) {
      .time-slot.range-start {
        position: relative;
        border-color: var(--accent-deep) !important;
        background: #fff !important;
        color: var(--accent-deep) !important;
        box-shadow: inset 0 0 0 2px var(--accent-deep);
      }
      .time-slot.range-start::after {
        content: '시작';
        position: absolute;
        right: 4px;
        bottom: 3px;
        font-size: .52rem;
        line-height: 1;
        font-weight: 900;
        color: var(--accent-deep);
      }
    }
  `;
  document.head.appendChild(style);

  const qcardWrapEl = document.getElementById('qcardWrap');
  if (qcardWrapEl) {
    const observer = new MutationObserver(() => {
      if (!document.getElementById('timeSlotGrid')) {
        pendingStart = null;
        return;
      }
      refreshMobileCopy();
    });

    observer.observe(qcardWrapEl, {
      childList: true,
      subtree: false
    });
  }

  window.addEventListener('resize', () => {
    if (!isMobileRangeMode()) {
      pendingStart = null;
      document.querySelectorAll('.time-slot.range-start').forEach((cell) => {
        cell.classList.remove('range-start');
      });
      return;
    }
    refreshMobileCopy();
  });

  refreshMobileCopy();
})();
