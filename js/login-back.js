document.querySelector('.login-back').addEventListener('click', event => {
  let localReferrer = false;
  try { localReferrer = new URL(document.referrer).origin === location.origin; } catch (_) {}
  if (localReferrer && history.length > 1) { event.preventDefault(); history.back(); }
});
