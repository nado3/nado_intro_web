(() => {
  try {
    if (typeof SEOUL_SERVICE_AREAS === 'undefined' || !Array.isArray(SEOUL_SERVICE_AREAS)) return;

    const ensureArea = (code, label, afterCode = null) => {
      if (SEOUL_SERVICE_AREAS.some((area) => area.code === code)) return;
      const afterIndex = afterCode ? SEOUL_SERVICE_AREAS.findIndex((area) => area.code === afterCode) : -1;
      SEOUL_SERVICE_AREAS.splice(afterIndex >= 0 ? afterIndex + 1 : SEOUL_SERVICE_AREAS.length, 0, { code, label });
    };

    ensureArea('Seocho', '서초', 'Gangnam');
    ensureArea('Yangcheon-gu', '양천구', 'Hongdae');
    ensureArea('Yeongdeungpo-gu', '영등포구', 'Yangcheon-gu');
  } catch (error) {
    console.warn('서울 지역 확장 적용 실패:', error);
  }
})();
