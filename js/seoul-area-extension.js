(() => {
  try {
    if (typeof SEOUL_SERVICE_AREAS === 'undefined' || !Array.isArray(SEOUL_SERVICE_AREAS)) return;
    if (!SEOUL_SERVICE_AREAS.some((area) => area.code === 'Seocho')) {
      const gangnamIndex = SEOUL_SERVICE_AREAS.findIndex((area) => area.code === 'Gangnam');
      SEOUL_SERVICE_AREAS.splice(gangnamIndex >= 0 ? gangnamIndex + 1 : SEOUL_SERVICE_AREAS.length, 0, {
        code: 'Seocho',
        label: '서초'
      });
    }
  } catch (error) {
    console.warn('서울 지역 확장 적용 실패:', error);
  }
})();
