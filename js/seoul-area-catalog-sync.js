(() => {
  'use strict';

  // Both apply.html and trial.html already load this file after script.js.
  // Keep the mobile-only time range helper.
  if (!document.querySelector('script[data-mobile-time-range]')) {
    const mobileRangeScript = document.createElement('script');
    mobileRangeScript.src = 'js/mobile-time-range.js?v=1';
    mobileRangeScript.defer = true;
    mobileRangeScript.dataset.mobileTimeRange = 'true';
    document.head.appendChild(mobileRangeScript);
  }

  window.NADO_INCHEON_SERVICE_AREAS = window.NADO_INCHEON_SERVICE_AREAS || [];

  let client = null;
  let syncingSeoul = false;
  let syncingIncheon = false;
  let enhancingIncheon = false;
  let patchesInstalled = false;

  function getClient() {
    if (client) return client;
    const config = window.NADO_MEMBER_CONFIG || {};
    if (!window.supabase || !config.SUPABASE_URL || !config.SUPABASE_ANON_KEY) return null;
    client = window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
      auth: {
        storageKey: 'nado-apply-area-catalog',
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });
    return client;
  }

  function escapeHtml(value = '') {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function incheonAreaLabel(code) {
    const area = window.NADO_INCHEON_SERVICE_AREAS.find(item => item.code === code);
    return area ? area.label : (code || '');
  }

  function currentStep() {
    try {
      return Array.isArray(activeSteps) ? activeSteps[current] : null;
    } catch (_) {
      return null;
    }
  }

  function refreshNextState() {
    try {
      const step = currentStep();
      if (step && typeof setNextState === 'function') setNextState(step);
    } catch (_) {}
  }

  function installBehaviorPatches() {
    if (patchesInstalled) return;
    try {
      if (typeof checkValid !== 'function' || typeof matchingLocation !== 'function') return;

      const originalCheckValid = checkValid;
      checkValid = function(step) {
        try {
          if (step?.type === 'rank' && answers?.placeType === '인천 원하는 장소') {
            return Array.isArray(answers.place) && answers.place.length > 0 && !!answers.areaCode;
          }
        } catch (_) {}
        return originalCheckValid(step);
      };

      const originalMatchingLocation = matchingLocation;
      matchingLocation = function() {
        try {
          if (answers?.placeType === '인천 원하는 장소') {
            return { region: 'Incheon', area: answers.areaCode || null };
          }
        } catch (_) {}
        return originalMatchingLocation();
      };

      if (typeof placeLabel === 'function') {
        const originalPlaceLabel = placeLabel;
        placeLabel = function(a) {
          try {
            if (a?.placeType === '인천 원하는 장소') {
              const area = incheonAreaLabel(a.areaCode);
              const preferred = String(
                a.__incheonOriginalPreferredPlace !== undefined
                  ? a.__incheonOriginalPreferredPlace
                  : (a.preferredPlace || '')
              ).trim();
              return '인천 희망 장소'
                + (area ? ' · ' + area : '')
                + (preferred ? ' · ' + preferred : '')
                + ' (최종 장소 추후 조율)';
            }
          } catch (_) {}
          return originalPlaceLabel(a);
        };
      }

      // Jotform placeDetail currently reads preferredPlace for Incheon.
      // Before final submission, include the selected service area in that field too.
      if (typeof showSuccess === 'function') {
        const originalShowSuccess = showSuccess;
        showSuccess = async function(...args) {
          try {
            if (answers?.placeType === '인천 원하는 장소' && answers.areaCode && !answers.__incheonPlacePrepared) {
              const exact = String(answers.preferredPlace || '').trim();
              const area = incheonAreaLabel(answers.areaCode);
              answers.__incheonOriginalPreferredPlace = exact;
              answers.preferredPlace = [area, exact].filter(Boolean).join(' / ');
              answers.__incheonPlacePrepared = true;
            }
          } catch (_) {}
          return originalShowSuccess(...args);
        };
      }

      patchesInstalled = true;
      refreshNextState();
    } catch (error) {
      console.warn('인천 매칭 패치 적용 실패:', error);
    }
  }

  function enhanceIncheonPlaceUi(force = false) {
    if (enhancingIncheon) return;
    let wrap;
    try {
      if (typeof qcardWrap === 'undefined' || !qcardWrap) return;
      const rankOption = qcardWrap.querySelector('.opt.rank[data-value="인천 원하는 장소"]');
      const meta = rankOption?.querySelector('.place-option-meta');
      if (meta) meta.textContent = '가능 지역 선택 · 세부 장소는 추후 조율';

      if (typeof answers === 'undefined' || answers.placeType !== '인천 원하는 장소') {
        if (typeof answers !== 'undefined') {
          delete answers.__incheonPlacePrepared;
          delete answers.__incheonOriginalPreferredPlace;
        }
        return;
      }

      wrap = qcardWrap.querySelector('.incheon-service-area-wrap') || qcardWrap.querySelector('.preferred-place-wrap');
      if (!wrap) return;
      if (!force && wrap.classList.contains('incheon-service-area-wrap')) return;

      enhancingIncheon = true;
      const areas = window.NADO_INCHEON_SERVICE_AREAS;
      const exactPlace = String(
        answers.__incheonOriginalPreferredPlace !== undefined
          ? answers.__incheonOriginalPreferredPlace
          : (answers.preferredPlace || '')
      ).trim();

      if (answers.areaCode && !areas.some(area => area.code === answers.areaCode)) {
        answers.areaCode = '';
      }

      const next = document.createElement('div');
      next.className = 'service-area-wrap incheon-service-area-wrap';
      next.innerHTML = ''
        + '<div class="field-label">수업 가능한 지역을 선택해주세요</div>'
        + '<div class="service-area-options">'
        + (areas.length
          ? areas.map(area => '<button type="button" class="service-area-opt '
              + (answers.areaCode === area.code ? 'selected' : '')
              + '" data-incheon-area-code="' + escapeHtml(area.code) + '">'
              + escapeHtml(area.label) + '</button>').join('')
          : '<div class="preferred-place-help">인천 가능 지역을 불러오는 중이에요.</div>')
        + '</div>'
        + '<label class="field-label" for="preferredPlaceInput">구체적인 희망 장소 <span class="optional-label">선택</span></label>'
        + '<input type="text" id="preferredPlaceInput" placeholder="예: 구월동 예술회관역 근처 카페" value="' + escapeHtml(exactPlace) + '">'
        + '<div class="preferred-place-help">매칭에는 위 지역을 사용하고, 정확한 장소는 선생님과 조율해요.</div>';

      wrap.replaceWith(next);

      next.querySelectorAll('[data-incheon-area-code]').forEach(button => {
        button.addEventListener('click', () => {
          answers.areaCode = button.dataset.incheonAreaCode || '';
          answers.payment = false;
          delete answers.__incheonPlacePrepared;
          delete answers.__incheonOriginalPreferredPlace;
          next.querySelectorAll('[data-incheon-area-code]').forEach(el => el.classList.remove('selected'));
          button.classList.add('selected');
          refreshNextState();
        });
      });

      const input = next.querySelector('#preferredPlaceInput');
      if (input) {
        input.addEventListener('input', () => {
          answers.preferredPlace = input.value;
          answers.payment = false;
          delete answers.__incheonPlacePrepared;
          delete answers.__incheonOriginalPreferredPlace;
          refreshNextState();
        });
      }

      refreshNextState();
    } catch (error) {
      console.warn('인천 지역 선택 UI 적용 실패:', error);
    } finally {
      enhancingIncheon = false;
    }
  }

  async function syncSeoulCatalog() {
    if (syncingSeoul) return;
    if (typeof SEOUL_SERVICE_AREAS === 'undefined' || !Array.isArray(SEOUL_SERVICE_AREAS)) return;
    const sb = getClient();
    if (!sb) return;
    syncingSeoul = true;

    try {
      const { data, error } = await sb.rpc('get_seoul_service_area_catalog');
      if (error || !Array.isArray(data) || !data.length) return;

      const next = data.map(row => ({ code: row.code, label: row.label }));
      const changed = JSON.stringify(SEOUL_SERVICE_AREAS) !== JSON.stringify(next);
      if (!changed) return;

      SEOUL_SERVICE_AREAS.splice(0, SEOUL_SERVICE_AREAS.length, ...next);

      const optionsVisible = document.querySelector('.service-area-options');
      if (optionsVisible && typeof renderStep === 'function' && answers?.placeType === '서울 원하는 장소') {
        renderStep();
      }
    } catch (error) {
      console.warn('서울 지역 목록 동기화 실패:', error);
    } finally {
      syncingSeoul = false;
    }
  }

  async function syncIncheonCatalog() {
    if (syncingIncheon) return;
    const sb = getClient();
    if (!sb) return;
    syncingIncheon = true;

    try {
      const { data, error } = await sb.rpc('get_incheon_service_area_catalog');
      if (error || !Array.isArray(data) || !data.length) return;

      const next = data.map(row => ({ code: row.code, label: row.label }));
      const target = window.NADO_INCHEON_SERVICE_AREAS;
      const changed = JSON.stringify(target) !== JSON.stringify(next);
      if (changed) target.splice(0, target.length, ...next);

      if (typeof answers !== 'undefined' && answers.placeType === '인천 원하는 장소') {
        enhanceIncheonPlaceUi(true);
      }
    } catch (error) {
      console.warn('인천 지역 목록 동기화 실패:', error);
    } finally {
      syncingIncheon = false;
    }
  }

  function start() {
    installBehaviorPatches();
    syncSeoulCatalog();
    syncIncheonCatalog();
    enhanceIncheonPlaceUi();

    const root = document.getElementById('qcardWrap');
    if (root) {
      new MutationObserver(() => {
        installBehaviorPatches();
        enhanceIncheonPlaceUi();
      }).observe(root, { childList: true, subtree: true });
    }

    window.setInterval(() => {
      syncSeoulCatalog();
      syncIncheonCatalog();
    }, 30000);

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        syncSeoulCatalog();
        syncIncheonCatalog();
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
