window.NADO_MEMBER_CONFIG = {
  SUPABASE_URL: "https://ouanvcvzrjbzbpefslgd.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_CiXs7pxX70my52mglC4ecg_hTGc8G5R",
  PROFILE_PHOTO_BUCKET: "teacher-profile-photos",
  TEACHERS_SITE_URL: "https://nadomeokgo.github.io/nado_teachers_web/index.html",
  TEACHERS_ADMIN_URL: "https://nadomeokgo.github.io/nado_teachers_web/admin.html",
  SUPPORT_URL: "https://open.kakao.com/o/sCZAMCGi",
  MAX_FILE_BYTES: 50 * 1024 * 1024
};

// Business English is available only on Premium.
(() => {
  const syncBusinessEnglishCopy = () => {
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
  };

  const start = () => {
    syncBusinessEnglishCopy();
    const root = document.getElementById('qcardWrap');
    if (root) new MutationObserver(syncBusinessEnglishCopy).observe(root, { childList: true, subtree: true });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
