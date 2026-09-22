(() => {
  'use strict';

  window.NADO_MATCH_DURATION_MINUTES = 60;
  window.NADO_INCHEON_SELECTED_AREA = window.NADO_INCHEON_SELECTED_AREA || '';

  document.addEventListener('click', (event) => {
    const option = event.target.closest?.('.duration-opt[data-index], [data-inline-duration]');
    if (!option || option.disabled) return;
    const index = Number(option.dataset.inlineDuration ?? option.dataset.index);
    window.NADO_MATCH_DURATION_MINUTES = index === 1 ? 120 : 60;
  }, true);

  function minutes(value) {
    const text = String(value || '').slice(0, 5);
    const parts = text.split(':').map(Number);
    if (parts.length < 2 || !Number.isFinite(parts[0]) || !Number.isFinite(parts[1])) return NaN;
    if (parts[0] === 24) return 1440 + parts[1];
    return parts[0] * 60 + parts[1];
  }

  function filterRows(rows, args) {
    if (!Array.isArray(rows)) return rows;
    const start = minutes(args?.p_time);
    if (!Number.isFinite(start)) return rows;
    let required = Number(window.NADO_MATCH_DURATION_MINUTES) === 120 ? 120 : 60;
    try { if (typeof answers !== 'undefined') required = answers.duration?.index === 1 ? 120 : 60; } catch (_) {}
    return rows.filter((row) => {
      let end = minutes(row?.end_time);
      if (!Number.isFinite(end)) return false;
      if (end === 0 && start > 0) end = 1440;
      return end >= start + required;
    });
  }

  const supabaseLib = window.supabase;
  if (!supabaseLib?.createClient || supabaseLib.__nadoDurationGuardInstalled) return;
  const originalCreateClient = supabaseLib.createClient.bind(supabaseLib);
  supabaseLib.createClient = function(...createArgs) {
    const client = originalCreateClient(...createArgs);
    if (!client?.rpc || client.__nadoDurationGuardInstalled) return client;
    const originalRpc = client.rpc.bind(client);
    client.rpc = async function(name, args, options) {
      let effectiveArgs = args;

      const result = await originalRpc(name, effectiveArgs, options);
      if (name === 'get_available_teachers' && result && !result.error) {
        if (Array.isArray(result.data)) {
          result.data = filterRows(result.data, effectiveArgs);
        } else if (Array.isArray(result.data?.teachers)) {
          result.data.teachers = filterRows(result.data.teachers, effectiveArgs);
        }
      }
      return result;
    };
    client.__nadoDurationGuardInstalled = true;
    return client;
  };
  supabaseLib.__nadoDurationGuardInstalled = true;
})();
