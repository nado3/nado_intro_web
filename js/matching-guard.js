(() => {
  'use strict';

  window.NADO_MATCH_DURATION_MINUTES = 60;
  window.NADO_INCHEON_SELECTED_AREA = window.NADO_INCHEON_SELECTED_AREA || '';
  window.NADO_INCHEON_AREAS = window.NADO_INCHEON_AREAS || [];

  document.addEventListener('click', (event) => {
    const option = event.target.closest?.('.duration-opt[data-index]');
    if (!option) return;
    const index = Number(option.dataset.index);
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
    const required = Number(window.NADO_MATCH_DURATION_MINUTES) === 120 ? 120 : 60;
    return rows.filter((row) => {
      let end = minutes(row?.end_time);
      if (!Number.isFinite(end)) return false;
      if (end === 0 && start > 0) end = 1440;
      return end >= start + required;
    });
  }

  const supabaseLib = window.supabase;
  if (supabaseLib?.createClient && !supabaseLib.__nadoDurationGuardInstalled) {
    const originalCreateClient = supabaseLib.createClient.bind(supabaseLib);
    supabaseLib.createClient = function(...createArgs) {
      const client = originalCreateClient(...createArgs);
      if (!client?.rpc || client.__nadoDurationGuardInstalled) return client;
      const originalRpc = client.rpc.bind(client);
      client.rpc = async function(name, args, options) {
        let nextArgs = args;
        if (
          name === 'get_available_teachers' &&
          args?.p_region === 'Incheon' &&
          !args?.p_area &&
          window.NADO_INCHEON_SELECTED_AREA
        ) {
          nextArgs = { ...args, p_area: window.NADO_INCHEON_SELECTED_AREA };
        }

        const result = await originalRpc(name, nextArgs, options);
        if (name === 'get_available_teachers' && result && !result.error) {
          if (Array.isArray(result.data)) {
            result.data = filterRows(result.data, nextArgs);
          } else if (Array.isArray(result.data?.teachers)) {
            result.data.teachers = filterRows(result.data.teachers, nextArgs);
          }
        }
        return result;
      };
      client.__nadoDurationGuardInstalled = true;
      return client;
    };
    supabaseLib.__nadoDurationGuardInstalled = true;
  }

  function escapeHtml(value = '') {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function findArea(code) {
    return window.NADO_INCHEON_AREAS.find(area => area.code === code) || null;
  }

  function refreshNext() {
    try {
      if (typeof setNextState === 'function' && typeof activeSteps !== 'undefined' && typeof current !== 'undefined') {
        setNextState(activeSteps[current]);
      }
    } catch (_) {}
  }

  function updateAnswerValue(exactPlace = '') {
    try {
      if (typeof answers === 'undefined') return;
      const selectedCode = answers.areaCode || window.NADO_INCHEON_SELECTED_AREA || '';
      const area = findArea(selectedCode);
      const label = area?.label || selectedCode;
      const exact = String(exactPlace || '').trim();
      answers.preferredPlace = [label, exact].filter(Boolean).join(' / ');
      answers.payment = false;
    } catch (_) {}
  }

  function enhanceIncheonUi(force = false) {
    try {
      const root = document.getElementById('qcardWrap');
      if (!root) return;
      const incheonOption = root.querySelector('.opt.rank[data-value="인천 원하는 장소"]');
      if (!incheonOption) return;

      const meta = incheonOption.querySelector('.place-option-meta');
      if (meta) meta.textContent = '가능 지역 선택 · 세부 장소는 추후 조율';

      if (!incheonOption.classList.contains('selected')) {
        window.NADO_INCHEON_SELECTED_AREA = '';
        return;
      }

      const existing = root.querySelector('.incheon-service-area-wrap');
      if (existing && !force) return;

      const oldWrap = existing || root.querySelector('.preferred-place-wrap');
      if (!oldWrap) return;

      let selectedCode = '';
      let exactPlace = '';
      try {
        if (typeof answers !== 'undefined') {
          selectedCode = answers.areaCode || window.NADO_INCHEON_SELECTED_AREA || '';
          const selected = findArea(selectedCode);
          const stored = String(answers.preferredPlace || '');
          const prefix = selected?.label ? selected.label + ' / ' : '';
          exactPlace = prefix && stored.startsWith(prefix)
            ? stored.slice(prefix.length)
            : (stored === selected?.label ? '' : stored);
        }
      } catch (_) {}

      const wrap = document.createElement('div');
      wrap.className = 'service-area-wrap incheon-service-area-wrap';
      wrap.innerHTML = `
        <div class="field-label">수업 가능한 지역을 선택해주세요</div>
        <div class="service-area-options incheon-service-area-options">
          ${window.NADO_INCHEON_AREAS.length
            ? window.NADO_INCHEON_AREAS.map(area => `
                <button type="button" class="service-area-opt${selectedCode === area.code ? ' selected' : ''}" data-incheon-area-code="${escapeHtml(area.code)}">${escapeHtml(area.label)}</button>
              `).join('')
            : '<div class="preferred-place-help">인천 가능 지역을 불러오는 중이에요.</div>'}
        </div>
        <label class="field-label" for="preferredPlaceInput">구체적인 희망 장소 <span class="optional-label">선택</span></label>
        <input type="text" id="preferredPlaceInput" placeholder="예: 구월동 예술회관역 근처 카페" value="${escapeHtml(exactPlace)}">
        <div class="preferred-place-help">매칭에는 위 지역을 사용하고, 정확한 장소는 선생님과 조율해요.</div>
      `;
      oldWrap.replaceWith(wrap);

      wrap.querySelectorAll('[data-incheon-area-code]').forEach(button => {
        button.addEventListener('click', () => {
          const code = button.dataset.incheonAreaCode || '';
          window.NADO_INCHEON_SELECTED_AREA = code;
          try {
            if (typeof answers !== 'undefined') answers.areaCode = code;
          } catch (_) {}
          wrap.querySelectorAll('[data-incheon-area-code]').forEach(el => el.classList.remove('selected'));
          button.classList.add('selected');
          const input = wrap.querySelector('#preferredPlaceInput');
          updateAnswerValue(input?.value || '');
          refreshNext();
        });
      });

      const input = wrap.querySelector('#preferredPlaceInput');
      if (input) {
        input.addEventListener('input', () => {
          updateAnswerValue(input.value);
          refreshNext();
        });
      }

      if (selectedCode) {
        window.NADO_INCHEON_SELECTED_AREA = selectedCode;
        updateAnswerValue(input?.value || '');
      }
      refreshNext();
    } catch (error) {
      console.warn('인천 지역 선택 UI 적용 실패:', error);
    }
  }

  async function loadIncheonAreas() {
    const config = window.NADO_MEMBER_CONFIG || {};
    if (!config.SUPABASE_URL || !config.SUPABASE_ANON_KEY) return;
    try {
      const response = await fetch(`${config.SUPABASE_URL}/rest/v1/rpc/get_incheon_service_area_catalog`, {
        method: 'POST',
        headers: {
          apikey: config.SUPABASE_ANON_KEY,
          Authorization: `Bearer ${config.SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: '{}'
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (!Array.isArray(data)) return;
      window.NADO_INCHEON_AREAS.splice(
        0,
        window.NADO_INCHEON_AREAS.length,
        ...data.map(row => ({ code: row.code, label: row.label }))
      );
      enhanceIncheonUi(true);
    } catch (error) {
      console.warn('인천 지역 목록 동기화 실패:', error);
    }
  }

  function startIncheonSync() {
    loadIncheonAreas();
    enhanceIncheonUi();

    const root = document.getElementById('qcardWrap');
    if (root) {
      new MutationObserver(() => enhanceIncheonUi()).observe(root, { childList: true, subtree: true });
    }

    window.setInterval(loadIncheonAreas, 30000);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) loadIncheonAreas();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startIncheonSync, { once: true });
  } else {
    startIncheonSync();
  }
})();
