// Matching metadata must reach /api/submit so the server can validate teacher
// selections first. The API removes this internal block immediately before it
// forwards the applicant's own notes to Jotform.
window.NADO_JOTFORM_CLEANUP_MODE = 'server';
