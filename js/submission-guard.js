(() => {
  'use strict';

  const STORAGE_PREFIX = 'nado:successful-application:v3:';
  const DUPLICATE_WINDOW_MS = 24 * 60 * 60 * 1000;
  const SUBMIT_ENDPOINT = 'https://nado-intro-web.vercel.app/api/submit';
  const originalFetch = window.fetch.bind(window);
  let mostRecentFingerprint = '';

  function applicationMode() {
    return document.body?.dataset.mode === 'trial' ? 'trial' : 'regular';
  }

  function storageKey(mode) {
    return STORAGE_PREFIX + (mode || applicationMode());
  }

  function readRecord(mode) {
    try {
      const raw = window.localStorage.getItem(storageKey(mode));
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function saveRecord(record) {
    try {
      window.localStorage.setItem(storageKey(record.mode), JSON.stringify(record));
    } catch (error) {
      // The receipt still appears for the current page when storage is unavailable.
    }
    return record;
  }

  function clearRecord(mode) {
    try {
      window.localStorage.removeItem(storageKey(mode));
    } catch (error) {
      // A reload still gives the user a fresh form if storage is unavailable.
    }
  }

  function isRecent(record, windowMs = DUPLICATE_WINDOW_MS) {
    const age = Date.now() - Number(record?.submittedAt);
    return Boolean(record && Number.isFinite(age) && age >= 0 && age <= windowMs);
  }

  function normalize(value) {
    return String(value || '').trim().replace(/\s+/g, ' ');
  }

  function paramsFromBody(body) {
    if (body instanceof URLSearchParams) return body;
    if (typeof body === 'string') return new URLSearchParams(body);
    return null;
  }

  function applicationSignature(params) {
    if (!params) return '';

    // Identity and lesson choices are stable even when live matching returns a
    // different teacher. That prevents a refresh from creating another lead.
    const fields = [
      'submission[3]',
      'submission[4][full]',
      'submission[30]',
      'submission[32]',
      'submission[33]',
      'submission[34]',
      'submission[40]',
      'submission[41]',
      'submission[43]'
    ];

    return fields
      .map(key => key + '=' + normalize(params.get(key)))
      .join('&');
  }

  function hashString(value) {
    let hash = 2166136261;
    for (let i = 0; i < value.length; i += 1) {
      hash ^= value.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
  }

  function fingerprintFromBody(body) {
    const signature = applicationSignature(paramsFromBody(body));
    return signature ? hashString(signature) : '';
  }

  function fingerprintFromAnswers(answers, mode) {
    const contact = answers?.contact || {};
    const signature = [
      mode,
      normalize(contact.name),
      normalize(contact.phone),
      normalize(answers?.tier),
      normalize((answers?.schedule || []).join(', ')),
      normalize(answers?.placeType),
      normalize(answers?.preferredPlace || answers?.songdoPlace),
      normalize(answers?.startDate),
      normalize(answers?.frequency),
      normalize(answers?.duration?.index),
      normalize(answers?.trialType)
    ].join('|');
    return hashString(signature);
  }

  function maskPhone(value) {
    const digits = String(value || '').replace(/\D/g, '');
    if (digits.length === 11) return digits.slice(0, 3) + '-••••-' + digits.slice(-4);
    if (digits.length === 10) return digits.slice(0, 3) + '-•••-' + digits.slice(-4);
    if (digits.length >= 7) return '•••-••••-' + digits.slice(-4);
    return value || '-';
  }

  function compactRows(rows) {
    return rows
      .filter(row => row && normalize(row.label) && normalize(row.value) && normalize(row.value) !== '-')
      .map(row => ({ label: normalize(row.label), value: normalize(row.value) }))
      .slice(0, 8);
  }

  function rowsFromParams(params) {
    if (!params) return [];
    const name = params.get('submission[3]') || '';
    const phone = params.get('submission[4][full]') || '';
    const planParts = [
      params.get('submission[30]'),
      params.get('submission[40]'),
      params.get('submission[41]')
    ].filter(Boolean);

    return compactRows([
      { label: '신청자', value: [name, maskPhone(phone)].filter(Boolean).join(' · ') },
      { label: '플랜', value: planParts.join(' · ') },
      { label: '희망 시간', value: params.get('submission[32]') },
      { label: '수업 장소', value: params.get('submission[33]') },
      { label: '시작 희망일', value: params.get('submission[34]') },
      { label: '선택 선생님', value: params.get('submission[63]') }
    ]);
  }

  function makeDuplicateSuccessResponse(record) {
    return new Response(JSON.stringify({
      success: true,
      duplicatePrevented: true,
      submittedAt: record.submittedAt
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  window.fetch = async function guardedFetch(input, init) {
    const url = typeof input === 'string' ? input : (input && input.url) || '';
    const method = String((init && init.method) || 'GET').toUpperCase();

    if (url !== SUBMIT_ENDPOINT || method !== 'POST') {
      return originalFetch(input, init);
    }

    const params = paramsFromBody(init && init.body);
    const fingerprint = fingerprintFromBody(init && init.body);
    const mode = applicationMode();
    const recent = readRecord(mode);
    mostRecentFingerprint = fingerprint;

    if (
      fingerprint
      && recent
      && recent.fingerprint === fingerprint
      && isRecent(recent)
    ) {
      window.__NADO_DUPLICATE_SUBMISSION_PREVENTED__ = true;
      return makeDuplicateSuccessResponse(recent);
    }

    window.__NADO_DUPLICATE_SUBMISSION_PREVENTED__ = false;
    const response = await originalFetch(input, init);

    if (response.ok && fingerprint) {
      try {
        const result = await response.clone().json();
        if (result && result.success === true) {
          saveRecord({
            version: 3,
            mode,
            fingerprint,
            submittedAt: Date.now(),
            rows: rowsFromParams(params)
          });
        }
      } catch (error) {
        // The normal submit flow handles an invalid server response.
      }
    }

    return response;
  };

  function formatSubmittedAt(timestamp) {
    try {
      return new Intl.DateTimeFormat('ko-KR', {
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).format(new Date(Number(timestamp))).replace('24:', '00:') + ' 접수';
    } catch (error) {
      return '접수 완료';
    }
  }

  function renderRows(summary, rows) {
    if (!summary) return;
    summary.replaceChildren();

    compactRows(rows).forEach(row => {
      const wrapper = document.createElement('div');
      wrapper.className = 'receipt-row';
      const term = document.createElement('dt');
      const description = document.createElement('dd');
      term.textContent = row.label;
      description.textContent = row.value;
      wrapper.append(term, description);
      summary.appendChild(wrapper);
    });

    if (!summary.children.length) {
      const wrapper = document.createElement('div');
      wrapper.className = 'receipt-row';
      const term = document.createElement('dt');
      const description = document.createElement('dd');
      term.textContent = '접수 상태';
      description.textContent = '정상 접수 완료';
      wrapper.append(term, description);
      summary.appendChild(wrapper);
    }
  }

  function showReceipt(record, state = {}) {
    const wrap = document.getElementById('successWrap');
    if (!wrap) return;

    document.getElementById('formMain')?.style.setProperty('display', 'none');
    document.getElementById('bottombar')?.style.setProperty('display', 'none');
    document.querySelector('.topbar')?.style.setProperty('display', 'none');
    document.querySelector('.kakao-chat-button')?.style.setProperty('display', 'none');
    document.body.classList.add('application-complete');
    wrap.classList.add('is-visible');
    wrap.style.display = 'block';

    const statusPill = document.getElementById('successStatusPill');
    const title = wrap.querySelector('.success-title');
    const restoredNote = document.getElementById('successRestoredNote');
    const receiptTime = document.getElementById('receiptTime');
    const summary = document.getElementById('summaryBox');

    if (statusPill) statusPill.textContent = state.restored || state.duplicate ? '접수 확인됨' : '접수 완료';
    if (receiptTime) receiptTime.textContent = formatSubmittedAt(record.submittedAt);
    renderRows(summary, record.rows || []);

    if (state.restored || state.duplicate) {
      if (title) title.textContent = '이미 접수된 신청을 불러왔어요';
      if (restoredNote) {
        restoredNote.textContent = state.duplicate
          ? '같은 내용은 다시 전송하지 않고 기존 접수 내역을 보여드렸어요.'
          : '최근 접수 기록이 있어 새 신청 대신 완료 화면을 다시 보여드렸어요.';
        restoredNote.classList.add('is-visible');
      }
    } else if (restoredNote) {
      restoredNote.classList.remove('is-visible');
      restoredNote.textContent = '';
    }

    requestAnimationFrame(() => wrap.focus({ preventScroll: true }));
  }

  function recordAndRender(options = {}) {
    const answers = options.answers || {};
    const mode = options.mode || applicationMode();
    const result = options.result || {};
    const details = options.details || {};
    const existing = readRecord(mode);
    const fingerprint = mostRecentFingerprint || fingerprintFromAnswers(answers, mode);
    const duplicate = Boolean(result.duplicatePrevented || window.__NADO_DUPLICATE_SUBMISSION_PREVENTED__);
    const submittedAt = duplicate && isRecent(existing)
      ? existing.submittedAt
      : (Number(result.submittedAt) || (existing?.fingerprint === fingerprint && isRecent(existing) ? existing.submittedAt : Date.now()));

    const contact = answers.contact || {};
    const planParts = [answers.tier, details.frequency, details.duration].filter(Boolean);
    const matchLabel = answers.matching_type === 'student_selected'
      ? answers.teacher_name
      : details.teacherPreference;

    const rows = compactRows([
      { label: '신청자', value: [contact.name, maskPhone(contact.phone)].filter(Boolean).join(' · ') },
      { label: mode === 'trial' ? '체험 방식' : '플랜', value: mode === 'trial' ? (answers.trialType || planParts.join(' · ')) : planParts.join(' · ') },
      ...(mode === 'trial' && answers.trialType ? [{ label: '플랜', value: planParts.join(' · ') }] : []),
      { label: '희망 시간', value: (answers.schedule || []).join(', ') },
      { label: '수업 장소', value: details.place },
      { label: '시작 희망일', value: answers.startDate },
      { label: answers.matching_type === 'student_selected' ? '선택 선생님' : '매칭 요청', value: matchLabel }
    ]);

    const record = saveRecord({
      version: 3,
      mode,
      fingerprint,
      submittedAt,
      rows: rows.length ? rows : (existing?.rows || [])
    });
    showReceipt(record, { duplicate });
    return record;
  }

  function restoreRecentReceipt() {
    const record = readRecord(applicationMode());
    if (!isRecent(record)) return false;
    showReceipt(record, { restored: true });
    return true;
  }

  function bindNewApplicationButton() {
    const button = document.getElementById('newApplicationButton');
    if (!button || button.dataset.bound === 'true') return;
    button.dataset.bound = 'true';
    button.addEventListener('click', () => {
      clearRecord(applicationMode());
      window.location.reload();
    });
  }

  function start() {
    bindNewApplicationButton();
    restoreRecentReceipt();
  }

  window.NADO_SUBMISSION_GUARD = {
    clearCurrent: () => clearRecord(applicationMode()),
    readCurrent: () => readRecord(applicationMode()),
    recordAndRender,
    restoreRecentReceipt
  };

  // This script is placed after the receipt markup, so restoring immediately
  // avoids flashing a blank application form before the receipt appears.
  start();

  window.addEventListener('pageshow', event => {
    if (event.persisted) restoreRecentReceipt();
  });
})();
