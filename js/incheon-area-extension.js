(() => {
  'use strict';

  let areas = [];
  let loading = false;

  const config = window.NADO_MEMBER_CONFIG || {};

  function escapeHtml(value = '') {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  async function loadAreas() {
    if (loading || !config.SUPABASE_URL || !config.SUPABASE_ANON_KEY) return;
    loading = true;
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
      if (Array.isArray(data)) {
        areas = data.map(row => ({ code: row.code, label: row.label }));
        enhance();
      }
    } catch (error) {
      console.warn('인천 지역 목록을 불러오지 못했습니다:', error);
    } finally {
      loading = false;
    }
  }

  function enhance() {
    try {
      const root = document.getElementById('qcardWrap');
      if (!root || typeof answers === 'undefined') return;
      if (answers.placeType !== '인천 원하는 장소') return;

      const oldWrap = root.querySelector('.preferred-place-wrap');
      if (!oldWrap || oldWrap.dataset.incheonEnhanced === '1') return;

      oldWrap.dataset.incheonEnhanced = '1';
      const currentCode = answers.areaCode || '';
      const currentLabel = areas.find(a => a.code === currentCode)?.label || '';
      const rawPreferred = String(answers.preferredPlace || '');
      const exactPlace = currentLabel && rawPreferred.startsWith(currentLabel + ' / ')
        ? rawPreferred.slice((currentLabel + ' / ').length)
        : (rawPreferred === currentLabel ? '' : rawPreferred);

      const wrap = document.createElement('div');
      wrap.className = 'service-area-wrap';
      wrap.innerHTML = `
        <div class="field-label">수업 가능한 지역을 선택해주세요</div>
        <div class="service-area-options">
          ${areas.length
            ? areas.map(area => `<button type="button" class="service-area-opt ${currentCode === area.code ? 'selected' : ''}" data-incheon-area-code="${escapeHtml(area.code)}">${escapeHtml(area.label)}</button>`).join('')
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
          const area = areas.find(item => item.code === code);
          answers.areaCode = code;
          window.NADO_INCHEON_SELECTED_AREA = code;
          wrap.querySelectorAll('[data-incheon-area-code]').forEach(el => el.classList.remove('selected'));
          button.classList.add('selected');
          const input = wrap.querySelector('#preferredPlaceInput');
          const exact = String(input?.value || '').trim();
          answers.preferredPlace = [area?.label || code, exact].filter(Boolean).join(' / ');
          answers.payment = false;
          if (typeof setNextState === 'function' && typeof activeSteps !== 'undefined' && typeof current !== 'undefined') {
            setNextState(activeSteps[current]);
          }
        });
      });

      const input = wrap.querySelector('#preferredPlaceInput');
      if (input) {
        input.addEventListener('input', () => {
          const area = areas.find(item => item.code === answers.areaCode);
          const exact = String(input.value || '').trim();
          answers.preferredPlace = [area?.label || answers.areaCode || '', exact].filter(Boolean).join(' / ');
          answers.payment = false;
          if (typeof setNextState === 'function' && typeof activeSteps !== 'undefined' && typeof current !== 'undefined') {
            setNextState(activeSteps[current]);
          }
        });
      }

      if (answers.areaCode) {
        window.NADO_INCHEON_SELECTED_AREA = answers.areaCode;
        const area = areas.find(item => item.code === answers.areaCode);
        answers.preferredPlace = [area?.label || answers.areaCode, exactPlace.trim()].filter(Boolean).join(' / ');
        if (typeof setNextState === 'function' && typeof activeSteps !== 'undefined' && typeof current !== 'undefined') {
          setNextState(activeSteps[current]);
        }
      }
    } catch (error) {
      console.warn('인천 지역 선택 UI 적용 실패:', error);
    }
  }

  function start() {
    loadAreas();
    enhance();
    const root = document.getElementById('qcardWrap');
    if (root) {
      new MutationObserver(() => enhance()).observe(root, { childList: true, subtree: true });
    }
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) loadAreas();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
