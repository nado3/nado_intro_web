(function (root) {
  'use strict';

  const HOUR_MS = 60 * 60 * 1000;
  const message = '첫 수업은 현재 시각으로부터 5시간이 지난 시간부터 선택할 수 있어요.';

  function today(now = Date.now()) {
    return new Date(Number(now) + 9 * HOUR_MS).toISOString().slice(0, 10);
  }

  function isAllowed(date, time, now = Date.now()) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || '')) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(String(time || ''))) return false;
    const timestamp = Date.parse(date + 'T' + time + ':00+09:00');
    if (!Number.isFinite(timestamp) || !Number.isFinite(Number(now))) return false;
    // Reject impossible calendar dates that Date.parse would otherwise normalize.
    if (today(timestamp) !== date) return false;
    return timestamp > Number(now) + 5 * HOUR_MS;
  }

  const policy = Object.freeze({ isAllowed, today, message });
  if (typeof module !== 'undefined' && module.exports) module.exports = policy;
  root.NADO_LESSON_TIME_POLICY = policy;
})(typeof window !== 'undefined' ? window : globalThis);
