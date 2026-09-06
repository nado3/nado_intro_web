window.NADO_MEMBER_CONFIG = {
  SUPABASE_URL: "https://ouanvcvzrjbzbpefslgd.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_CiXs7pxX70my52mglC4ecg_hTGc8G5R",
  PROFILE_PHOTO_BUCKET: "teacher-profile-photos",
  TEACHERS_SITE_URL: "https://nadomeokgo.github.io/nado_teachers_web/index.html",
  TEACHERS_ADMIN_URL: "https://nadomeokgo.github.io/nado_teachers_web/admin.html",
  SUPPORT_URL: "https://open.kakao.com/o/sCZAMCGi",
  MAX_FILE_BYTES: 50 * 1024 * 1024
};

// Keep the application flow aligned with current public policies.
(() => {
  const syncCurrentPolicyCopy = () => {
    document.querySelectorAll('.tier-opt[data-value="스탠다드"] .tier-more').forEach(el => {
      const oldText = '가능 영어: 일상회화 · 비즈니스 · 여행영어 · 시험/면접 · 발음교정';
      if (el.innerHTML.includes(oldText)) {
        el.innerHTML = el.innerHTML.replace(oldText, '가능 영어: 일상회화 · 여행영어 · 시험/면접 · 발음교정');
      }
    });

    const notes = document.getElementById('textInput');
    if (notes?.placeholder?.includes('비즈니스 표현')) {
      notes.placeholder = '예: 해외여행 전에 실전 표현을 집중적으로 배우고 싶어요';
    }

    const qcard = document.querySelector('#qcardWrap .qcard');
    const qtitle = qcard?.querySelector('.qtitle')?.textContent.trim();

    if (qtitle === '마지막이에요! 연락처를 남겨주세요') {
      const qsub = qcard.querySelector('.qsub');
      if (qsub) qsub.textContent = '신청 결과와 수업 관련 안내를 이 번호로 보내드려요.';
    }

    if (document.body?.dataset.mode !== 'trial' && qtitle === '결제 안내') {
      const qsub = qcard.querySelector('.qsub');
      if (qsub) {
        qsub.textContent = '결제 금액을 확인해주세요. 선생님 연결 후 첫 수업 일정이 확정되면 카카오톡으로 입금 방법을 안내드립니다.';
      }

      const oldNote = qcard.querySelector('#firstMonthPaymentNote');
      if (oldNote) oldNote.remove();
    }

    if (document.body?.dataset.mode === 'trial' && qcard) {
      const freeTrial = qcard.querySelector('[data-trial-type="무료 체험"]');
      const paidTrial = qcard.querySelector('[data-trial-type="플랜 선택 체험"]');

      if (freeTrial && paidTrial) {
        const title = qcard.querySelector('.qtitle');
        const sub = qcard.querySelector('.qsub');
        if (title) title.textContent = '어떤 체험수업을 원하시나요?';
        if (sub) sub.textContent = '무료 체험 또는 원하는 장소에서 진행하는 1회 체험 중 선택해주세요.';

        const freeName = freeTrial.querySelector('.tier-opt-name');
        const freePrice = freeTrial.querySelector('.tier-opt-price');
        const freeDesc = freeTrial.querySelector('.tier-opt-desc');
        if (freeName) freeName.textContent = '무료 체험';
        if (freePrice) freePrice.textContent = '무료';
        if (freeDesc) freeDesc.textContent = '이코노미 · 1시간 · IGC 또는 트리플스트리트 · 보증금 2만원(참석 시 전액 환불)';

        const paidName = paidTrial.querySelector('.tier-opt-name');
        const paidPrice = paidTrial.querySelector('.tier-opt-price');
        const paidDesc = paidTrial.querySelector('.tier-opt-desc');
        if (paidName) paidName.textContent = '원하는 장소에서 1회 체험';
        if (paidPrice) paidPrice.textContent = '1회 수업료';
        if (paidDesc) paidDesc.textContent = '원하는 플랜 · 1시간 · 서울 또는 인천 · 세부 장소는 선생님과 조율';
      }

      if (qtitle === '1회 수업 결제 안내') {
        const title = qcard.querySelector('.qtitle');
        if (title) title.textContent = '1회 체험 결제 안내';
      }
    }
  };

  const syncTrialSuccessCopy = () => {
    if (document.body?.dataset.mode !== 'trial') return;
    const summary = document.getElementById('summaryBox');
    const successText = document.querySelector('.success-text');
    if (!summary || !successText) return;

    if (summary.textContent.includes('무료 체험')) {
      successText.innerHTML = '<span>보증금 입금 안내와 선생님 연락 연결은<br class="success-mobile-break">신청하신 연락처로 안내드려요.</span><span>수업에 참석하시면 보증금은 전액 환불됩니다.</span>';
    } else if (summary.textContent.includes('플랜 선택 체험')) {
      successText.innerHTML = '<span>1회 체험 결제 안내와 선생님 연락 연결은<br class="success-mobile-break">신청하신 연락처로 안내드려요.</span><span>문의사항이 있다면 카카오톡으로 편하게 문의해주세요.</span>';
    }
  };

  const start = () => {
    syncCurrentPolicyCopy();
    syncTrialSuccessCopy();

    const root = document.getElementById('qcardWrap');
    if (root) new MutationObserver(syncCurrentPolicyCopy).observe(root, { childList: true, subtree: true });

    const successWrap = document.getElementById('successWrap');
    if (successWrap) new MutationObserver(syncTrialSuccessCopy).observe(successWrap, { childList: true, subtree: true, attributes: true });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
