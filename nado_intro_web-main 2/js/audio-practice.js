(() => {
  const api = window.NadoMember;
  if (!api) return;
  const $ = (id) => document.getElementById(id);
  const MAX_SECONDS = 180;
  const MAX_BYTES = 5 * 1024 * 1024;
  const state = {
    auth: null, student: null, assignment: null, consent: null, submissions: [], notifications: [],
    recorder: null, stream: null, chunks: [], blob: null, duration: 0,
    startedAt: 0, pausedAt: 0, pausedMs: 0, timer: null, previewUrl: null,
  };

  const statusLabel = (status) => ({
    uploaded: "업로드 완료", processing: "AI 분석 중", ready: "AI 분석 완료",
    reviewed: "선생님 확인", completed: "학습 완료", rerecord_requested: "재녹음 요청",
    failed: "처리 오류", deleted: "원본 삭제",
  }[status] || status);

  const statusHelp = (status) => ({
    uploaded: "곧 AI 분석이 시작됩니다.", processing: "전사와 학습 노트를 만들고 있어요.",
    ready: "선생님 피드백을 기다리고 있어요.", reviewed: "선생님 피드백을 확인해보세요.",
    completed: "이번 연습을 완료했어요.", rerecord_requested: "피드백을 참고해 다시 녹음해보세요.",
    failed: "다시 분석 버튼을 눌러주세요.", deleted: "90일 보관 기간이 지나 원본 음성이 삭제되었습니다.",
  }[status] || "");

  function formatTime(seconds) {
    const value = Math.max(0, Math.min(MAX_SECONDS, Math.floor(seconds || 0)));
    return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
  }

  function mimeChoice() {
    const choices = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm", "audio/ogg;codecs=opus"];
    return choices.find((type) => window.MediaRecorder?.isTypeSupported?.(type)) || "";
  }

  function extensionFor(type) {
    if (type.includes("mp4")) return "m4a";
    if (type.includes("ogg")) return "ogg";
    if (type.includes("wav")) return "wav";
    return "webm";
  }

  function setRecorderState(mode) {
    $("startRecording").classList.toggle("hidden", mode === "recording" || mode === "paused");
    $("pauseRecording").classList.toggle("hidden", mode !== "recording" && mode !== "paused");
    $("stopRecording").classList.toggle("hidden", mode !== "recording" && mode !== "paused");
    $("pauseRecording").textContent = mode === "paused" ? "계속 녹음" : "일시정지";
    $("recordingDot").classList.toggle("active", mode === "recording");
  }

  function stopStream() {
    state.stream?.getTracks().forEach((track) => track.stop());
    state.stream = null;
  }

  function clearTimer() {
    window.clearInterval(state.timer);
    state.timer = null;
  }

  function updateTimer() {
    if (!state.startedAt) return;
    const now = state.pausedAt || Date.now();
    state.duration = Math.min(MAX_SECONDS, (now - state.startedAt - state.pausedMs) / 1000);
    $("recordingTime").textContent = formatTime(state.duration);
    if (state.duration >= MAX_SECONDS && state.recorder?.state !== "inactive") state.recorder.stop();
  }

  async function startRecording() {
    if (!state.assignment) return api.toast("현재 활성 배정이 없어 녹음할 수 없습니다.", true);
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      return api.toast("이 브라우저는 음성 녹음을 지원하지 않습니다. 최신 Safari 또는 Chrome을 사용해주세요.", true);
    }
    try {
      resetRecording(false);
      state.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      const mimeType = mimeChoice();
      state.recorder = mimeType ? new MediaRecorder(state.stream, { mimeType }) : new MediaRecorder(state.stream);
      state.chunks = [];
      state.startedAt = Date.now(); state.pausedAt = 0; state.pausedMs = 0; state.duration = 0;
      state.recorder.addEventListener("dataavailable", (event) => { if (event.data.size) state.chunks.push(event.data); });
      state.recorder.addEventListener("stop", finishRecording, { once: true });
      state.recorder.start(500);
      setRecorderState("recording");
      state.timer = window.setInterval(updateTimer, 250);
      updateTimer();
    } catch (error) {
      stopStream(); clearTimer(); setRecorderState("idle");
      api.toast(error?.name === "NotAllowedError" ? "마이크 권한을 허용해주세요." : "녹음을 시작하지 못했습니다.", true);
    }
  }

  function pauseRecording() {
    if (!state.recorder) return;
    if (state.recorder.state === "recording") {
      state.recorder.pause(); state.pausedAt = Date.now(); setRecorderState("paused"); updateTimer();
    } else if (state.recorder.state === "paused") {
      state.pausedMs += Date.now() - state.pausedAt; state.pausedAt = 0; state.recorder.resume(); setRecorderState("recording");
    }
  }

  function stopRecording() {
    if (state.recorder && state.recorder.state !== "inactive") state.recorder.stop();
  }

  function finishRecording() {
    updateTimer(); clearTimer(); stopStream(); setRecorderState("idle");
    const type = state.recorder?.mimeType || state.chunks[0]?.type || "audio/webm";
    state.blob = new Blob(state.chunks, { type });
    if (state.blob.size > MAX_BYTES) {
      state.blob = null;
      return api.toast("녹음 파일이 5MB를 초과했습니다. 조금 더 짧게 녹음해주세요.", true);
    }
    if (state.previewUrl) URL.revokeObjectURL(state.previewUrl);
    state.previewUrl = URL.createObjectURL(state.blob);
    $("audioPreview").src = state.previewUrl;
    $("audioPreviewPanel").classList.remove("hidden");
  }

  function resetRecording(resetTime = true) {
    if (state.recorder && state.recorder.state !== "inactive") state.recorder.stop();
    clearTimer(); stopStream(); state.recorder = null; state.chunks = []; state.blob = null;
    if (state.previewUrl) URL.revokeObjectURL(state.previewUrl);
    state.previewUrl = null; $("audioPreview").removeAttribute("src"); $("audioPreviewPanel").classList.add("hidden");
    if (resetTime) { state.duration = 0; $("recordingTime").textContent = "00:00"; }
    setRecorderState("idle");
  }

  function expressionMarkup(items) {
    return Array.isArray(items) && items.length ? `<ul class="ai-expression-list">${items.map((item) => `<li><strong>${api.escapeHtml(item.expression)}</strong><span>${api.escapeHtml(item.meaning_ko)}</span><em>${api.escapeHtml(item.example)}</em></li>`).join("")}</ul>` : '<p class="audio-muted">추천 표현이 없습니다.</p>';
  }

  function correctionMarkup(items) {
    return Array.isArray(items) && items.length ? `<div class="ai-correction-list">${items.map((item) => `<div><del>${api.escapeHtml(item.original)}</del><strong>${api.escapeHtml(item.suggested)}</strong><span>${api.escapeHtml(item.explanation_ko)}</span></div>`).join("")}</div>` : '<p class="audio-muted">수정이 꼭 필요한 표현을 찾지 못했어요.</p>';
  }

  function submissionMarkup(item) {
    const processed = ["ready","reviewed","completed","rerecord_requested"].includes(item.status);
    return `<article class="audio-submission-card" data-submission-card="${api.escapeHtml(item.id)}">
      <div class="audio-submission-head"><div><span class="audio-status ${api.escapeHtml(item.status)}">${api.escapeHtml(statusLabel(item.status))}</span><h3>${api.escapeHtml(item.title)}</h3><p>${api.escapeHtml(api.formatDateTime(item.created_at))} · ${formatTime(item.duration_seconds)}</p></div>${item.raw_audio_deleted_at ? "" : `<button class="member-button secondary" data-play-audio="${api.escapeHtml(item.id)}" type="button">▶ 녹음 듣기</button>`}</div>
      <p class="audio-status-help">${api.escapeHtml(statusHelp(item.status))}</p>
      <div class="inline-audio-player" data-player-for="${api.escapeHtml(item.id)}"></div>
      ${item.topic ? `<div class="audio-topic"><strong>연습 주제</strong><p>${api.escapeHtml(item.topic)}</p></div>` : ""}
      ${processed ? `<details class="ai-result" open><summary>AI 학습 노트</summary>
        <div class="ai-result-grid"><section><h4>내용 요약</h4><p>${api.escapeHtml(item.summary_ko || "-")}</p></section><section><h4>영어 전사</h4><p class="transcript">${api.escapeHtml(item.transcript_en || "-")}</p></section><section><h4>유용한 표현</h4>${expressionMarkup(item.key_expressions)}</section><section><h4>더 자연스럽게</h4>${correctionMarkup(item.corrections)}</section></div>
        <p class="ai-disclaimer">AI가 만든 학습 보조 결과로 오류가 있을 수 있으며 발음 평가는 포함하지 않습니다.</p>
      </details>` : ""}
      ${item.teacher_feedback ? `<div class="teacher-feedback"><strong>선생님 피드백</strong><p>${api.escapeHtml(item.teacher_feedback)}</p><span>${api.escapeHtml(api.formatDateTime(item.feedback_at))}</span></div>` : ""}
      ${["failed","uploaded"].includes(item.status) ? `<div class="audio-error"><span>${api.escapeHtml(item.status === "failed" ? (item.ai_error || "AI 처리 중 오류가 발생했습니다.") : "분석이 시작되지 않았다면 아래 버튼을 눌러주세요.")}</span><button class="member-button secondary" data-retry-audio="${api.escapeHtml(item.id)}" type="button">AI 분석 시작</button></div>` : ""}
    </article>`;
  }

  function renderSubmissions() {
    $("studentAudioList").innerHTML = state.submissions.length
      ? state.submissions.map(submissionMarkup).join("")
      : '<div class="empty-box">아직 제출한 음성 연습이 없습니다.</div>';
  }

  function renderNotifications() {
    const target = $("studentNotificationList");
    if (!target) return;
    target.innerHTML = state.notifications.length ? state.notifications.slice(0, 8).map((item) => `<button class="notification-row ${item.read_at ? "read" : ""}" data-notification-id="${api.escapeHtml(item.id)}" data-open-view="audio" type="button"><span></span><div><strong>${api.escapeHtml(item.title)}</strong><p>${api.escapeHtml(item.body || "")}</p><small>${api.escapeHtml(api.formatDateTime(item.created_at))}</small></div></button>`).join("") : '<div class="empty-box">새 알림이 없습니다.</div>';
  }

  async function loadNotifications() {
    const { data, error } = await api.client.from("portal_notifications").select("*").order("created_at", { ascending: false }).limit(20);
    if (error) throw error;
    state.notifications = data || []; renderNotifications();
  }

  async function loadSubmissions() {
    if (!state.student) { state.submissions = []; return renderSubmissions(); }
    const { data, error } = await api.client.from("audio_submissions").select("*")
      .eq("student_id", state.student.id).order("created_at", { ascending: false });
    if (error) throw error;
    state.submissions = data || [];
    renderSubmissions();
  }

  async function initialize() {
    state.auth = await api.requireRole(["student"]);
    if (!state.auth) return;
    const userId = state.auth.session.user.id;
    const { data: student, error: studentError } = await api.client.from("student_records").select("*").eq("auth_user_id", userId).maybeSingle();
    if (studentError || !student) throw studentError || new Error("학생 정보를 찾지 못했습니다.");
    state.student = student;
    const [{ data: assignment, error: assignmentError }, { data: consent, error: consentError }] = await Promise.all([
      api.client.from("student_assignments").select("id,teacher_id,student_id,status,assignment_type").eq("student_id", student.id).eq("status", "active").eq("assignment_type", "regular").order("created_at", { ascending: false }).limit(1).maybeSingle(),
      api.client.from("audio_consents").select("*").eq("student_id", student.id).maybeSingle(),
    ]);
    if (assignmentError) throw assignmentError;
    if (consentError) throw consentError;
    state.assignment = assignment; state.consent = consent;
    $("audioConsentPanel").classList.toggle("hidden", Boolean(consent?.voice_ai_consent && !consent.withdrawn_at));
    $("audioRecorderPanel").classList.toggle("hidden", !consent?.voice_ai_consent || Boolean(consent.withdrawn_at));
    if (!assignment) $("audioRecorderPanel").classList.add("hidden");
    await Promise.all([loadSubmissions(), loadNotifications()]);
  }

  async function saveConsent() {
    if (!$("audioConsentCheck").checked) return api.toast("음성 및 AI 처리 동의를 확인해주세요.", true);
    const ageGroup = $("audioAgeGroup").value;
    if (!ageGroup) return api.toast("학생 연령을 선택해주세요.", true);
    if (ageGroup === "under14" && !$("guardianConsentCheck").checked) return api.toast("만 14세 미만 학생은 법정대리인 동의 확인이 필요합니다.", true);
    const button = $("saveAudioConsent"); button.disabled = true;
    const { data, error } = await api.client.rpc("save_audio_consent", { student_under_14: ageGroup === "under14", guardian_confirmed: $("guardianConsentCheck").checked });
    button.disabled = false;
    if (error) return api.toast("동의 내용을 저장하지 못했습니다.", true);
    state.consent = data;
    $("audioConsentPanel").classList.add("hidden"); $("audioRecorderPanel").classList.remove("hidden");
    api.toast("동의가 저장되었습니다. 이제 녹음할 수 있어요.");
  }

  async function submitRecording() {
    if (!state.blob || !state.assignment) return;
    const title = $("audioTitle").value.trim() || `음성 연습 ${new Date().toLocaleDateString("ko-KR")}`;
    const topic = $("audioTopic").value.trim();
    const button = $("submitRecording"); button.disabled = true; button.textContent = "업로드 중...";
    const ext = extensionFor(state.blob.type);
    const name = `nado-speaking-${Date.now()}.${ext}`;
    const path = `${state.assignment.id}/${state.auth.session.user.id}/${crypto.randomUUID()}.${ext}`;
    const contentType = (state.blob.type || "audio/webm").split(";")[0];
    const { error: uploadError } = await api.client.storage.from("audio-submissions").upload(path, state.blob, { contentType });
    if (uploadError) { button.disabled = false; button.textContent = "선생님께 제출"; return api.toast("녹음을 업로드하지 못했습니다.", true); }
    const { data: row, error: insertError } = await api.client.from("audio_submissions").insert({
      assignment_id: state.assignment.id,
      student_id: state.student.id,
      student_auth_user_id: state.auth.session.user.id,
      title, topic: topic || null, storage_path: path, original_name: name,
      content_type: contentType, size_bytes: state.blob.size,
      duration_seconds: Math.max(1, Math.min(MAX_SECONDS, Math.ceil(state.duration))), status: "uploaded",
    }).select("*").single();
    if (insertError) {
      await api.client.storage.from("audio-submissions").remove([path]);
      button.disabled = false; button.textContent = "선생님께 제출";
      return api.toast("제출 정보를 저장하지 못했습니다.", true);
    }
    state.submissions.unshift(row); renderSubmissions(); resetRecording(); $("audioTitle").value = ""; $("audioTopic").value = "";
    button.textContent = "AI 분석 중...";
    api.toast("제출됐습니다. AI 학습 노트를 만들고 있어요.");
    const { data, error } = await api.client.functions.invoke("process-audio", { body: { submission_id: row.id } });
    button.disabled = false; button.textContent = "선생님께 제출";
    if (error || data?.error) api.toast(data?.error || "AI 분석이 지연되고 있습니다. 기록에서 다시 시도할 수 있어요.", true);
    await loadSubmissions();
  }

  async function playAudio(id) {
    const item = state.submissions.find((row) => row.id === id);
    if (!item || item.raw_audio_deleted_at) return;
    const container = document.querySelector(`[data-player-for="${CSS.escape(id)}"]`);
    if (container?.querySelector("audio")) return container.querySelector("audio").play();
    const { data, error } = await api.client.storage.from("audio-submissions").createSignedUrl(item.storage_path, 300);
    if (error) return api.toast("녹음을 열지 못했습니다.", true);
    container.innerHTML = `<audio controls autoplay src="${api.escapeHtml(data.signedUrl)}"></audio>`;
  }

  async function retryAudio(id) {
    api.toast("AI 분석을 다시 시작합니다.");
    const { data, error } = await api.client.functions.invoke("process-audio", { body: { submission_id: id } });
    if (error || data?.error) api.toast(data?.error || "다시 분석하지 못했습니다.", true);
    await loadSubmissions();
  }

  $("saveAudioConsent").addEventListener("click", saveConsent);
  $("audioAgeGroup").addEventListener("change", () => {
    const under14 = $("audioAgeGroup").value === "under14";
    $("guardianConsentLabel").classList.toggle("hidden", !under14);
    if (!under14) $("guardianConsentCheck").checked = false;
  });
  $("startRecording").addEventListener("click", startRecording);
  $("pauseRecording").addEventListener("click", pauseRecording);
  $("stopRecording").addEventListener("click", stopRecording);
  $("resetRecording").addEventListener("click", () => resetRecording());
  $("submitRecording").addEventListener("click", submitRecording);
  $("refreshAudioList").addEventListener("click", () => loadSubmissions().catch(() => api.toast("기록을 새로고침하지 못했습니다.", true)));
  $("studentAudioList").addEventListener("click", (event) => {
    const play = event.target.closest("[data-play-audio]"); if (play) playAudio(play.dataset.playAudio);
    const retry = event.target.closest("[data-retry-audio]"); if (retry) retryAudio(retry.dataset.retryAudio);
  });
  $("studentNotificationList")?.addEventListener("click", async (event) => {
    const row = event.target.closest("[data-notification-id]"); if (!row) return;
    const item = state.notifications.find((entry) => entry.id === row.dataset.notificationId);
    if (item && !item.read_at) {
      await api.client.rpc("mark_portal_notification_read", { target_notification_id: item.id });
      item.read_at = new Date().toISOString(); renderNotifications();
    }
  });
  window.addEventListener("beforeunload", () => { clearTimer(); stopStream(); if (state.previewUrl) URL.revokeObjectURL(state.previewUrl); });

  initialize().catch((error) => {
    $("audioConsentPanel").classList.add("hidden"); $("audioRecorderPanel").classList.add("hidden");
    $("studentAudioList").innerHTML = `<div class="empty-box">${api.escapeHtml(error.message || "음성 연습 기능을 불러오지 못했습니다.")}<br>Supabase Phase 2 SQL 적용 여부를 확인해주세요.</div>`;
  });
})();
