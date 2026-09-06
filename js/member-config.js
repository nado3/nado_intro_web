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
  };

  const start = () => {
    syncCurrentPolicyCopy();
    const root = document.getElementById('qcardWrap');
    if (root) new MutationObserver(syncCurrentPolicyCopy).observe(root, { childList: true, subtree: true });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
