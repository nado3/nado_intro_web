(() => {
  const originalFetch = window.fetch.bind(window);

  window.fetch = async function(input, init) {
    try {
      const url = typeof input === 'string' ? input : (input && input.url) || '';
      if (url.includes('/api/submit') && init && init.body instanceof URLSearchParams) {
        const body = new URLSearchParams(init.body.toString());
        const notes = body.get('submission[28]') || '';
        const cleanedNotes = notes
          .replace(/\n*\[매칭 정보\][\s\S]*$/m, '')
          .trim();

        body.set('submission[28]', cleanedNotes);
        init = Object.assign({}, init, { body });
      }
    } catch (error) {
      console.warn('Jotform 문의사항 정리 중 오류:', error);
    }

    return originalFetch(input, init);
  };
})();
