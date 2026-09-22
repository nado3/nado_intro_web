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

  function isDirectDirectoryNavigation() {
    try {
      return new URLSearchParams(window.location?.search || '').get('source') === 'teacher-directory';
    } catch (error) {
      return false;
    }
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

    // Identity, lesson choices, and an explicitly selected teacher identify one
    // application. Manual matching keeps the teacher field empty and stable.
    const fields = [
      'submission[3]',
      'submission[4][full]',
      'submission[5]',
      'submission[30]',
      'submission[32]',
      'submission[33]',
      'submission[34]',
      'submission[28]',
      'submission[40]',
      'submission[41]',
      'submission[43]',
      'submission[64]'
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
      normalize(answers?.ageGroup),
      normalize(answers?.tier),
      normalize((answers?.schedule || []).join(', ')),
      JSON.stringify(answers?.firstLessonOptions || []),
      normalize(answers?.placeType),
      normalize(answers?.preferredPlace || answers?.songdoPlace),
      normalize(answers?.startDate),
      normalize(answers?.frequency),
      normalize(answers?.duration?.index),
      normalize(answers?.trialType),
      normalize(answers?.teacher_id)
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

    const premiumInquiry = params.get('submission[62]') === 'premium_inquiry';
    return compactRows([
      { label: '신청자', value: [name, maskPhone(phone)].filter(Boolean).join(' · ') },
      { label: '플랜', value: planParts.join(' · ') },
      { label: '희망 시간', value: params.get('submission[32]') },
      { label: '수업 장소', value: params.get('submission[33]') },
      { label: '시작 희망일', value: params.get('submission[34]') },
      { label: premiumInquiry ? '상담 희망 선생님' : '선택 선생님', value: params.get('submission[63]') }
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
            kind: params?.get('submission[62]') === 'premium_inquiry' ? 'premium-inquiry' : 'application',
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

    if (record.kind === 'premium-inquiry') {
      const successText = wrap.querySelector('.success-text');
      const process = wrap.querySelector('.next-process-steps');
      if (title && !state.restored && !state.duplicate) title.textContent = 'Premium 상담 요청이 접수됐어요';
      if (successText) successText.innerHTML = '<strong>아직 수업이나 결제가 확정된 상태는 아닙니다.</strong>목표와 희망 일정을 검토한 후 담당 선생님의 확인 결과를 카카오톡으로 안내해드려요.';
      if (process) {
        process.classList.add('is-premium');
        process.innerHTML = '<div class="next-process-step is-complete"><span class="process-number">✓</span>상담 요청 접수</div>'
          + '<div class="next-process-step"><span class="process-number">2</span>목표·일정<br>검토</div>'
          + '<div class="next-process-step"><span class="process-number">3</span>선생님 의사<br>확인</div>'
          + '<div class="next-process-step"><span class="process-number">4</span>수업안·결제<br>안내</div>';
      }
    }

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

    if (title && !state.restored && !state.duplicate) title.textContent = '신청이 접수됐어요';
    const message = wrap.querySelector('.success-text');
    if (message) message.innerHTML = '<strong>카카오톡 또는 문자로 안내드려요.</strong>매칭 안내를 놓치지 않도록 꼭 확인해주세요.';
    const processBox = wrap.querySelector('.next-process-box');
    if (processBox) processBox.hidden = false;
    const receipt = wrap.querySelector('.receipt-card'); if(receipt) receipt.hidden=true;
    requestAnimationFrame(() => { window.scrollTo(0, 0); wrap.focus({ preventScroll: true }); });
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
    const premiumInquiry = answers.matching_type === 'premium_inquiry';
    const teacherWasSelected = answers.matching_type === 'student_selected'
      || answers.matching_type === 'directory_selected'
      || (premiumInquiry && Boolean(answers.teacher_name));
    const matchLabel = premiumInquiry
      ? (teacherWasSelected ? answers.teacher_name : 'NADO 확인 예정')
      : (teacherWasSelected ? answers.teacher_name : details.teacherPreference);
    const matchRowLabel = premiumInquiry
      ? (teacherWasSelected ? '상담 희망 선생님' : '담당 선생님')
      : (teacherWasSelected ? '선택 선생님' : '매칭 요청');

    const rows = compactRows([
      { label: '신청자', value: [contact.name, maskPhone(contact.phone)].filter(Boolean).join(' · ') },
      { label: mode === 'trial' ? '체험 방식' : '플랜', value: mode === 'trial' ? (answers.trialType || planParts.join(' · ')) : planParts.join(' · ') },
      ...(mode === 'trial' && answers.trialType ? [{ label: '플랜', value: planParts.join(' · ') }] : []),
      { label: '첫 수업 희망 후보', value: answers.firstLessonOptions?.length ? answers.firstLessonOptions.map(option => option.date + ' ' + option.time).join(', ') : (answers.schedule || []).join(', ') },
      { label: '수업 장소', value: details.place },
      ...(!answers.firstLessonOptions?.length ? [{ label: '시작 희망일', value: answers.startDate }] : []),
      { label: matchRowLabel, value: matchLabel }
    ]);

    const record = {
      version: 3,
      test: Boolean(result.test),
      mode,
      kind: answers.matching_type === 'premium_inquiry' ? 'premium-inquiry' : 'application',
      fingerprint,
      submittedAt,
      rows: rows.length ? rows : (existing?.rows || [])
    };
    if (!result.test) saveRecord(record);
    showReceipt(record, { duplicate });
    return record;
  }

  function restoreRecentReceipt() {
    // A directory click represents a new explicit teacher/time choice. Do not
    // hide that form behind an older same-mode receipt; guardedFetch still
    // prevents an identical submission from being sent twice.
    if (isDirectDirectoryNavigation()) return false;
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
