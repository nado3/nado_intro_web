(function (root) {
  'use strict';

  const PLANS = new Set(['economy', 'standard', 'premium']);
  const SONGDO_AREAS = new Set(['igc', 'triplestreet', 'songdo']);

  function areaKey(value) {
    return String(value == null ? '' : value).trim().toLowerCase().replace(/[\s_-]+/g, '');
  }

  function minutes(value, allowEndOfDay) {
    const match = String(value == null ? '' : value).trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}(?:\.\d+)?))?$/);
    if (!match) return NaN;
    const hour = Number(match[1]);
    const minute = Number(match[2]);
    const second = Number(match[3] || 0);
    if (minute >= 60 || second >= 60) return NaN;
    if (hour === 24) return allowEndOfDay && minute === 0 && second === 0 ? 1440 : NaN;
    return hour < 24 ? hour * 60 + minute + second / 60 : NaN;
  }

  function weekday(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return null;
    const date = new Date(value + 'T12:00:00Z');
    if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) return null;
    return date.getUTCDay();
  }

  function matchesArea(slot, context) {
    const code = areaKey(slot.area_code);
    if (context.region === 'Songdo') {
      return SONGDO_AREAS.has(code)
        && (!context.songdoPlace || code === areaKey(context.songdoPlace));
    }
    const selectedCode = areaKey(context.areaCode);
    if (selectedCode && code) return code === selectedCode;
    const selectedLabel = areaKey(context.areaLabel);
    return Boolean(selectedLabel && selectedLabel === areaKey(slot.area_label));
  }

  function countTeachersAt(rows, context, time) {
    if (!Array.isArray(rows) || !context || !PLANS.has(context.plan)) return null;
    if (!['Seoul', 'Songdo'].includes(context.region) || ![60, 120].includes(context.duration)) return null;
    if (context.region === 'Seoul' && !areaKey(context.areaCode) && !areaKey(context.areaLabel)) return null;
    if (context.region === 'Songdo' && context.songdoPlace
      && !['igc', 'triplestreet'].includes(areaKey(context.songdoPlace))) return null;
    const day = weekday(context.date);
    const start = minutes(time, false);
    if (day === null || !Number.isFinite(start) || start + context.duration > 1440) return null;

    const selectedTeacher = String(context.teacherId || '').trim();
    const eligible = new Set();
    rows.forEach(row => {
      if (!row || typeof row !== 'object' || Array.isArray(row)) return;
      const id = String(row.teacher_id || '').trim();
      if (!id || (selectedTeacher && id !== selectedTeacher)) return;
      if (!Array.isArray(row.plan_groups) || !row.plan_groups.includes(context.plan)) return;
      if (context.businessOnly
        && row.business_english !== true && String(row.business_english).toLowerCase() !== 'true') return;
      if (!Array.isArray(row.availability)) return;
      const available = row.availability.some(slot => {
        if (!slot || typeof slot !== 'object' || slot.day_of_week === null || slot.day_of_week === '') return false;
        if (Number(slot.day_of_week) !== day || !matchesArea(slot, context)) return false;
        const from = minutes(slot.start_time, false);
        let to = minutes(slot.end_time, true);
        if (to === 0 && start > 0) to = 1440;
        // One interval must cover the complete lesson, as in the final matching guard.
        return Number.isFinite(from) && Number.isFinite(to)
          && from <= start && to >= start + context.duration;
      });
      if (available) eligible.add(id);
    });
    return eligible.size;
  }

  function density(count) {
    if (!Number.isInteger(count) || count < 0) return 'unknown';
    return count >= 4 ? 'high' : count >= 2 ? 'medium' : 'low';
  }

  function isMissingDirectoryV3Error(error) {
    if (!error || typeof error !== 'object') return false;
    const code = String(error.code || '').trim().toUpperCase();
    const message = String(error.message || error.details || '').toLowerCase();
    return code === 'PGRST202' || code === '42883'
      || (message.includes('get_public_teacher_directory_v3')
        && (message.includes('could not find') || message.includes('does not exist')));
  }

  function directoryError(message, code) {
    const error = new Error(message);
    error.code = code;
    return error;
  }

  function createDirectoryLoader(rpc, options) {
    if (typeof rpc !== 'function') throw new TypeError('A directory RPC function is required.');
    const settings = options || {};
    const ttlMs = Number.isFinite(settings.ttlMs) && settings.ttlMs >= 0 ? settings.ttlMs : 60000;
    const timeoutMs = Number.isFinite(settings.timeoutMs) && settings.timeoutMs > 0 ? settings.timeoutMs : 8000;
    const now = typeof settings.now === 'function' ? settings.now : Date.now;
    const cache = new Map();
    const inFlight = new Map();

    async function call(name, region) {
      const response = await rpc(name, { p_region: region });
      if (response && response.error) throw response.error;
      if (!response || !Array.isArray(response.data)) {
        throw directoryError('The teacher directory returned an invalid response.', 'INVALID_DIRECTORY_RESPONSE');
      }
      return response.data;
    }

    async function fetchDirectory(region) {
      try {
        return await call('get_public_teacher_directory_v3', region);
      } catch (error) {
        if (!isMissingDirectoryV3Error(error)) throw error;
        return call('get_public_teacher_directory_v2', region);
      }
    }

    function load(region) {
      if (!['Seoul', 'Songdo'].includes(region)) {
        return Promise.reject(directoryError('The teacher directory region is invalid.', 'INVALID_DIRECTORY_REGION'));
      }
      if (inFlight.has(region)) return inFlight.get(region);
      const saved = cache.get(region);
      if (saved && now() - saved.savedAt < ttlMs) return Promise.resolve(saved.rows);

      let timer;
      const timeout = new Promise((resolve, reject) => {
        timer = setTimeout(() => reject(directoryError('The teacher directory request timed out.', 'DIRECTORY_TIMEOUT')), timeoutMs);
      });
      const request = Promise.race([fetchDirectory(region), timeout])
        .then(rows => {
          // This runs after the timeout race, so a late response cannot enter the cache.
          cache.set(region, { rows, savedAt: now() });
          return rows;
        })
        .finally(() => {
          clearTimeout(timer);
          if (inFlight.get(region) === request) inFlight.delete(region);
        });
      inFlight.set(region, request);
      return request;
    }

    return Object.freeze({ load });
  }

  const api = Object.freeze({ countTeachersAt, density, createDirectoryLoader });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.NADO_LESSON_AVAILABILITY = api;
})(typeof window !== 'undefined' ? window : globalThis);
