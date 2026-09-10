(() => {
  'use strict';

  if (!document.querySelector('script[data-duration-text-fix]')) {
    const script = document.createElement('script');
    script.src = 'js/duration-text-fix.js?v=1';
    script.defer = true;
    script.dataset.durationTextFix = 'true';
    document.head.appendChild(script);
  }

  let client = null;
  let syncing = false;

  function getClient() {
    if (client) return client;
    const config = window.NADO_MEMBER_CONFIG || {};
    if (!window.supabase || !config.SUPABASE_URL || !config.SUPABASE_ANON_KEY) return null;
    client = window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
    return client;
  }

  async function syncCatalog() {
    if (syncing) return;
    if (typeof SEOUL_SERVICE_AREAS === 'undefined' || !Array.isArray(SEOUL_SERVICE_AREAS)) return;
    const sb = getClient();
    if (!sb) return;
    syncing = true;

    try {
      const { data, error } = await sb.rpc('get_seoul_service_area_catalog');
      if (error || !Array.isArray(data) || !data.length) return;

      const next = data.map((row) => ({ code: row.code, label: row.label }));
      const changed = JSON.stringify(SEOUL_SERVICE_AREAS) !== JSON.stringify(next);
      if (!changed) return;

      SEOUL_SERVICE_AREAS.splice(0, SEOUL_SERVICE_AREAS.length, ...next);

      const optionsVisible = document.querySelector('.service-area-options');
      if (optionsVisible && typeof renderStep === 'function') {
        renderStep();
      }
    } catch (error) {
      console.warn('서울 지역 목록 동기화 실패:', error);
    } finally {
      syncing = false;
    }
  }

  function start() {
    syncCatalog();
    window.setInterval(syncCatalog, 30000);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) syncCatalog();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
