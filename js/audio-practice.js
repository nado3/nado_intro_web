(() => {
  const api = window.NadoMember;
  if (!api?.client) return;

  const $ = (id) => document.getElementById(id);
  const MAX_BYTES = 5 * 1024 * 1024;
  const cssEscape = (value) => window.CSS?.escape ? window.CSS.escape(String(value)) : String(value).replace(/[^a-zA-Z0-9_-]/g, "\\$&");
  const levelLabel = (level) => ({ starter: "Starter", basic: "Basic", intermediate: "Intermediate" }[level] || level || "-");
  const planRank = (plan) => ({ economy: 1, standard: 2, premium: 3 }[plan] || 1);
  const asArray = (value) => Array.isArray(value) ? value : [];

  const state = {
    auth: null,
    student: null,
    assignment: null,
    consent: null,
    access: null,
    modules: [],
    progress: [],
    submissions: [],
    notifications: [],
    selectedModule: null,
    retryParent: null,
    recorder: null,
    stream: null,
    chunks: [],
    blob: null,
    duration: 0,
    startedAt: 0,
    pausedAt: 0,
    pausedMs: 0,
    timer: null,
    previewUrl: null,
    cancelledRecorders: new WeakSet(),
  };

  const statusLabel = (status) => ({
    uploaded: "업로드 완료",
    processing: "AI 분석 중",
    ready: "AI 피드백 완료",
    reviewed: "선생님 확인",
    completed: "학습 완료",
    rerecord_requested: "재녹음 요청",
    failed: "처리 오류",
    deleted: "원본 삭제",
  }[status] || status || "-");

  const statusHelp = (item) => {
    if (item.status === "uploaded") return "곧 AI 분석이 시작됩니다.";
    if (item.status === "processing") return "전사와 맞춤 학습 피드백을 만들고 있어요.";
    if (item.status === "ready") return item.teacher_review_requested
      ? "AI 피드백이 준비됐고 선생님 검토를 기다리고 있어요."
      : "AI 피드백을 확인하고 같은 질문에 다시 말해보세요.";
    if (item.status === "reviewed") return "선생님 피드백도 확인해보세요.";
    if (item.status === "completed") return "이번 연습을 완료했어요.";
    if (item.status === "rerecord_requested") return "피드백을 참고해 다시 말해보세요.";
    if (item.status === "failed") return "AI 재분석 버튼으로 다시 시도할 수 있어요.";
    if (item.status === "deleted") return "원본 음성은 삭제됐지만 학습 결과는 유지됩니다.";
    return "";
  };

  function friendlyError(error, fallback) {
    const message = String(error?.message || error || "").toLowerCase();
    if (message.includes("weekly speaking practice limit reached")) return "이번 주 AI 말하기 연습 한도를 모두 사용했습니다. 다음 주 월요일에 다시 시작됩니다.";
    if (message.includes("recording exceeds the plan limit")) return "현재 플랜의 최대 녹음 시간을 초과했습니다.";
    if (message.includes("voice and ai consent required")) return "음성 및 AI 처리 동의가 필요합니다.";
    if (message.includes("active regular assignment required")) return "현재 활성 정규 수업 배정이 없어 AI 연습을 이용할 수 없습니다.";
    if (message.includes("not included in the current plan")) return "이 커리큘럼은 현재 플랜에 포함되지 않습니다.";
    if (message.includes("function") && message.includes("does not exist")) return "Phase 1 Supabase SQL이 아직 적용되지 않았습니다.";
    return error?.message || fallback;
  }

  function formatTime(seconds, limit = Number(state.access?.max_recording_seconds || 60)) {
    const value = Math.max(0, Math.min(limit, Math.floor(Number(seconds || 0))));
    return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
  }

  function formatShortDate(value) {
    if (!value) return "-";
    return new Date(`${value}T00:00:00+09:00`).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
  }

  function moduleById(id) {
    return state.modules.find((item) => item.id === id) || null;
  }

  function progressByModule(id) {
    return state.progress.find((item) => item.practice_module_id === id) || null;
  }

  function renderAccess() {
    const access = state.access;
    if (!access) {
      $("practicePlanLabel").textContent = "이용 불가";
      $("practiceUsageLabel").textContent = "-";
      $("practiceRemainingLabel").textContent = "-";
      $("practiceUsageBar").style.width = "0%";
      return;
    }
    const limit = Number(access.weekly_limit || 0);
    const used = Number(access.used || 0);
    const remaining = Number(access.remaining || 0);
    $("practicePlanLabel").textContent = api.planLabel(access.plan);
    $("practiceUsageLabel").textContent = `${used} / ${limit}회`;
    $("practiceRemainingLabel").textContent = `${remaining}회`;
    $("practiceWeekLabel").textContent = `${formatShortDate(access.week_start)}–${formatShortDate(access.week_end)} · 월요일 초기화`;
    $("practiceUsageBar").style.width = `${limit ? Math.min(100, Math.round((used / limit) * 100)) : 100}%`;
    $("maxRecordingLabel").textContent = `최대 ${formatTime(access.max_recording_seconds, access.max_recording_seconds)}`;
    $("teacherReviewOption").classList.toggle("hidden", !access.teacher_review_enabled);
  }

  function renderCategoryFilter() {
    const select = $("practiceCategoryFilter");
    const current = select.value || "all";
    const categories = [...new Set(state.modules.map((item) => item.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ko"));
    select.innerHTML = `<option value="all">전체 주제</option>${categories.map((item) => `<option value="${api.escapeHtml(item)}">${api.escapeHtml(item)}</option>`).join("")}`;
    select.value = categories.includes(current) ? current : "all";
  }

  function renderModules() {
    const level = $("practiceLevelFilter").value;
    const category = $("practiceCategoryFilter").value;
    const currentPlan = state.access?.plan || "economy";
    const filtered = state.modules.filter((item) => {
      if (level !== "all" && item.level !== level) return false;
      if (category !== "all" && item.category !== category) return false;
      return true;
    });
    const activeModuleIds = new Set(state.modules.map((item) => item.id));
    const completed = state.progress.filter((item) => item.status === "completed" && activeModuleIds.has(item.practice_module_id)).length;
    $("practiceCompletedLabel").textContent = `완료 ${completed} / ${state.modules.length}`;

    $("practiceModuleGrid").innerHTML = filtered.length ? filtered.map((item) => {
      const progress = progressByModule(item.id);
      const locked = planRank(currentPlan) < planRank(item.min_plan);
      const selected = state.selectedModule?.id === item.id;
      return `<button class="practice-module-card ${selected ? "selected" : ""} ${locked ? "locked" : ""} ${progress?.status === "completed" ? "completed" : ""}" data-select-practice="${api.escapeHtml(item.id)}" type="button" ${locked ? "aria-disabled=\"true\"" : ""}>
        <span class="practice-module-top"><span class="practice-level ${api.escapeHtml(item.level)}">${api.escapeHtml(levelLabel(item.level))}</span><span>${api.escapeHtml(item.category)}</span></span>
        <strong>${api.escapeHtml(item.title_ko)}</strong>
        <p>${api.escapeHtml(item.objective_ko)}</p>
        <span class="practice-module-foot">${locked ? `${api.escapeHtml(api.planLabel(item.min_plan))} 이상` : progress?.status === "completed" ? `✓ 완료 · ${Number(progress.attempts_count || 0)}회` : progress ? `${Number(progress.attempts_count || 0)}회 연습` : `약 ${Number(item.estimated_seconds || 45)}초`}</span>
      </button>`;
    }).join("") : '<div class="empty-box">선택한 조건에 맞는 커리큘럼이 없습니다.</div>';
  }

  function renderSelectedModule() {
    const item = state.selectedModule;
    const panel = $("selectedPracticePanel");
    if (!item) {
      panel.classList.add("hidden");
      return;
    }
    panel.classList.remove("hidden");
    $("selectedPracticeTags").innerHTML = `<span>${api.escapeHtml(levelLabel(item.level))}</span><span>${api.escapeHtml(item.category)}</span><span>${api.escapeHtml(api.planLabel(item.min_plan))} 이상</span>`;
    $("selectedPracticeTitle").textContent = item.title_ko;
    $("selectedPracticeObjective").textContent = item.objective_ko;
    $("selectedPracticePromptEn").textContent = item.prompt_en;
    $("selectedPracticePromptKo").textContent = item.prompt_ko || item.situation_ko || "";

    $("selectedPracticeExpressions").innerHTML = asArray(item.key_expressions).length
      ? asArray(item.key_expressions).map((entry) => `<div><strong>${api.escapeHtml(entry.expression)}</strong><span>${api.escapeHtml(entry.meaning_ko || "")}</span><em>${api.escapeHtml(entry.example || "")}</em></div>`).join("")
      : '<p class="audio-muted">등록된 핵심 표현이 없습니다.</p>';
    $("selectedPracticeFramework").innerHTML = asArray(item.answer_framework).length
      ? asArray(item.answer_framework).map((entry) => `<li>${api.escapeHtml(entry)}</li>`).join("")
      : '<li>질문에 맞춰 자유롭게 답해보세요.</li>';
    $("selectedPracticeSample").textContent = item.sample_answer_en || "예시 답변이 없습니다.";
    $("selectedPracticeFollowups").innerHTML = asArray(item.follow_up_questions).length
      ? asArray(item.follow_up_questions).map((entry) => `<li>${api.escapeHtml(entry)}</li>`).join("")
      : '<li>추가 질문이 없습니다.</li>';

    $("teacherReviewRequested").checked = Boolean(state.retryParent?.teacher_review_requested);
    $("practiceAttemptNote").textContent = state.retryParent
      ? `${Number(state.retryParent.attempt_number || 1) + 1}번째 시도입니다. 이전 AI 피드백 한 가지를 적용해 답해보세요.`
      : "첫 번째 답변입니다. 피드백을 받은 뒤 같은 질문에 다시 답해볼 수 있어요.";
    renderModules();
  }

  function selectModule(id, parent = null) {
    const item = moduleById(id);
    if (!item) return;
    if (planRank(state.access?.plan) < planRank(item.min_plan)) {
      return api.toast(`${api.planLabel(item.min_plan)} 이상 플랜에서 이용할 수 있습니다.`, true);
    }
    if (Number(state.access?.remaining || 0) <= 0) {
      return api.toast("이번 주 AI 말하기 연습 한도를 모두 사용했습니다.", true);
    }
    state.selectedModule = item;
    state.retryParent = parent;
    resetRecording(false);
    renderSelectedModule();
    window.setTimeout(() => $("selectedPracticePanel").scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  function closeSelectedModule() {
    state.selectedModule = null;
    state.retryParent = null;
    resetRecording(false);
    renderSelectedModule();
  }

  function mimeChoice() {
    const choices = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm", "audio/ogg;codecs=opus"];
    return choices.find((type) => window.MediaRecorder?.isTypeSupported?.(type)) || "";
  }

  function extensionFor(type) {
    if (type.includes("mp4")) return "m4a";
    if (type.includes("ogg")) return "ogg";
    if (type.includes("wav")) return "wav";
    if (type.includes("mpeg")) return "mp3";
    return "webm";
  }

  function newUuid() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    if (window.crypto?.getRandomValues) {
      const bytes = new Uint8Array(16);
      window.crypto.getRandomValues(bytes);
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      bytes[8] = (bytes[8] & 0x3f) | 0x80;
      const hex = [...bytes].map((value) => value.toString(16).padStart(2, "0"));
      return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10).join("")}`;
    }
    throw new Error("이 브라우저에서는 안전한 업로드 ID를 만들 수 없습니다. 최신 Safari 또는 Chrome을 사용해주세요.");
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
    const limit = Number(state.access?.max_recording_seconds || 60);
    const now = state.pausedAt || Date.now();
    state.duration = Math.min(limit, (now - state.startedAt - state.pausedMs) / 1000);
    $("recordingTime").textContent = formatTime(state.duration, limit);
    if (state.duration >= limit && state.recorder?.state !== "inactive") state.recorder.stop();
  }

  async function startRecording() {
    if (!state.assignment) return api.toast("현재 활성 정규 배정이 없어 녹음할 수 없습니다.", true);
    if (!state.selectedModule) return api.toast("먼저 연습할 커리큘럼을 선택해주세요.", true);
    if (Number(state.access?.remaining || 0) <= 0) return api.toast("이번 주 AI 말하기 연습 한도를 모두 사용했습니다.", true);
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      return api.toast("이 브라우저는 음성 녹음을 지원하지 않습니다. 최신 Safari 또는 Chrome을 사용해주세요.", true);
    }
    try {
      resetRecording(false);
      state.stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      const mimeType = mimeChoice();
      const recorder = mimeType ? new MediaRecorder(state.stream, { mimeType }) : new MediaRecorder(state.stream);
      state.recorder = recorder;
      state.chunks = [];
      state.startedAt = Date.now();
      state.pausedAt = 0;
      state.pausedMs = 0;
      state.duration = 0;
      recorder.addEventListener("dataavailable", (event) => {
        if (recorder === state.recorder && !state.cancelledRecorders.has(recorder) && event.data.size) state.chunks.push(event.data);
      });
      recorder.addEventListener("stop", () => finishRecording(recorder), { once: true });
      recorder.start(500);
      setRecorderState("recording");
      state.timer = window.setInterval(updateTimer, 250);
      updateTimer();
    } catch (error) {
      stopStream();
      clearTimer();
      setRecorderState("idle");
      api.toast(error?.name === "NotAllowedError" ? "마이크 권한을 허용해주세요." : "녹음을 시작하지 못했습니다.", true);
    }
  }

  function pauseRecording() {
    if (!state.recorder) return;
    if (state.recorder.state === "recording") {
      state.recorder.pause();
      state.pausedAt = Date.now();
      setRecorderState("paused");
      updateTimer();
    } else if (state.recorder.state === "paused") {
      state.pausedMs += Date.now() - state.pausedAt;
      state.pausedAt = 0;
      state.recorder.resume();
      setRecorderState("recording");
    }
  }

  function stopRecording() {
    if (state.recorder && state.recorder.state !== "inactive") state.recorder.stop();
  }

  function finishRecording(recorder) {
    if (state.cancelledRecorders.has(recorder) || recorder !== state.recorder) {
      state.cancelledRecorders.delete(recorder);
      return;
    }
    updateTimer();
    clearTimer();
    stopStream();
    setRecorderState("idle");
    const type = recorder?.mimeType || state.chunks[0]?.type || "audio/webm";
    state.blob = new Blob(state.chunks, { type });
    if (state.duration < 2) {
      state.blob = null;
      return api.toast("2초 이상 말한 뒤 녹음을 종료해주세요.", true);
    }
    if (state.blob.size > MAX_BYTES) {
      state.blob = null;
      return api.toast("녹음 파일이 5MB를 초과했습니다. 조금 더 짧게 녹음해주세요.", true);
    }
    if (state.previewUrl) URL.revokeObjectURL(state.previewUrl);
    state.previewUrl = URL.createObjectURL(state.blob);
    $("audioPreview").src = state.previewUrl;
    $("audioPreviewPanel").classList.remove("hidden");
  }

  function resetRecording(clearRetry = false) {
    const recorder = state.recorder;
    if (recorder && recorder.state !== "inactive") {
      state.cancelledRecorders.add(recorder);
      recorder.stop();
    }
    clearTimer();
    stopStream();
    if (state.previewUrl) URL.revokeObjectURL(state.previewUrl);
    state.recorder = null;
    state.chunks = [];
    state.blob = null;
    state.duration = 0;
    state.startedAt = 0;
    state.pausedAt = 0;
    state.pausedMs = 0;
    state.previewUrl = null;
    if ($("audioPreview")) $("audioPreview").removeAttribute("src");
    if ($("audioPreviewPanel")) $("audioPreviewPanel").classList.add("hidden");
    if ($("recordingTime")) $("recordingTime").textContent = "00:00";
    setRecorderState("idle");
    if (clearRetry) state.retryParent = null;
  }

  function expressionsMarkup(items) {
    return asArray(items).length ? `<ul class="ai-expression-list">${asArray(items).map((item) => `<li><strong>${api.escapeHtml(item.expression)}</strong><span>${api.escapeHtml(item.meaning_ko || "")}</span><em>${api.escapeHtml(item.example || "")}</em></li>`).join("")}</ul>` : '<p class="audio-muted">이번 답변에서는 별도로 추천할 표현이 없습니다.</p>';
  }

  function correctionsMarkup(items) {
    return asArray(items).length ? `<div class="ai-correction-list">${asArray(items).map((item) => `<div><del>${api.escapeHtml(item.original)}</del><strong>${api.escapeHtml(item.suggested)}</strong><span>${api.escapeHtml(item.explanation_ko || "")}</span></div>`).join("")}</div>` : '<p class="audio-muted">꼭 고쳐야 할 주요 표현은 발견되지 않았어요.</p>';
  }

  function listMarkup(items, emptyText) {
    return asArray(items).length ? `<ul class="practice-feedback-list">${asArray(items).map((item) => `<li>${api.escapeHtml(item)}</li>`).join("")}</ul>` : `<p class="audio-muted">${api.escapeHtml(emptyText)}</p>`;
  }

  function quizMarkup(module, submission) {
    const questions = asArray(module?.quiz_items);
    if (!questions.length || !["ready", "reviewed", "completed", "rerecord_requested"].includes(submission.status)) return "";
    return `<details class="practice-quiz"><summary>이 주제 복습 퀴즈 풀기</summary><div class="practice-quiz-body">${questions.map((question, index) => `<form class="practice-quiz-question" data-quiz-form data-module-id="${api.escapeHtml(module.id)}" data-submission-id="${api.escapeHtml(submission.id)}" data-question-index="${index}"><strong>${index + 1}. ${api.escapeHtml(question.question || "문제")}</strong><div>${asArray(question.choices).map((choice) => `<label><input type="radio" name="quiz-${api.escapeHtml(submission.id)}-${index}" value="${api.escapeHtml(choice)}" /> ${api.escapeHtml(choice)}</label>`).join("")}</div><button class="member-button secondary" type="submit">정답 확인</button><p class="practice-quiz-result" aria-live="polite"></p></form>`).join("")}</div></details>`;
  }

  function submissionMarkup(item) {
    const module = moduleById(item.practice_module_id);
    const feedback = item.feedback_json && typeof item.feedback_json === "object" ? item.feedback_json : {};
    const comparison = item.comparison_json && typeof item.comparison_json === "object" ? item.comparison_json : {};
    const ready = ["ready", "reviewed", "completed", "rerecord_requested"].includes(item.status);
    const canRetry = Boolean(module && ready && Number(state.access?.remaining || 0) > 0 && Number(item.attempt_number || 1) < 10);
    const plan = item.plan_at_submission || state.access?.plan;
    return `<article class="audio-submission-card" data-audio-card="${api.escapeHtml(item.id)}">
      <div class="audio-submission-head"><div>
        <div class="practice-record-badges"><span class="audio-status ${api.escapeHtml(item.status)}">${api.escapeHtml(statusLabel(item.status))}</span>${module ? `<span>${api.escapeHtml(levelLabel(module.level))}</span><span>${api.escapeHtml(module.category)}</span>` : `<span>이전 자유 연습</span>`}${item.attempt_number > 1 ? `<span>${Number(item.attempt_number)}번째 시도</span>` : ""}${item.teacher_review_requested ? `<span class="review-requested">선생님 검토 요청</span>` : ""}</div>
        <h3>${api.escapeHtml(module?.title_ko || item.title)}</h3>
        <p>${api.escapeHtml(api.formatDateTime(item.created_at))} · ${formatTime(item.duration_seconds, 9999)} · ${api.escapeHtml(api.planLabel(plan))}</p>
        <span class="audio-status-help">${api.escapeHtml(statusHelp(item))}</span>
      </div><div class="table-actions">${item.raw_audio_deleted_at ? "" : `<button class="member-button secondary" data-play-audio="${api.escapeHtml(item.id)}" type="button">▶ 녹음 듣기</button>`}${canRetry ? `<button class="member-button primary" data-retry-practice="${api.escapeHtml(item.id)}" type="button">다시 말하기</button>` : ""}</div></div>
      <div class="inline-audio-player" data-player-for="${api.escapeHtml(item.id)}"></div>
      ${module ? `<div class="audio-topic"><strong>질문</strong><p>${api.escapeHtml(module.prompt_en)}</p></div>` : item.topic ? `<div class="audio-topic"><strong>연습 주제</strong><p>${api.escapeHtml(item.topic)}</p></div>` : ""}
      ${ready ? `<details class="ai-result" open><summary>AI 맞춤 피드백</summary><div class="ai-result-grid">
        <section><h4>내가 말한 내용</h4><p class="transcript">${api.escapeHtml(item.transcript_en || "-")}</p></section>
        <section><h4>답변 요약</h4><p>${api.escapeHtml(item.summary_ko || "-")}</p>${feedback.answer_overview_ko ? `<p class="feedback-overview">${api.escapeHtml(feedback.answer_overview_ko)}</p>` : ""}</section>
        <section><h4>잘한 점</h4>${listMarkup(feedback.strengths_ko, "잘한 점을 정리 중입니다.")}</section>
        <section><h4>다음에 적용할 것</h4>${listMarkup(feedback.next_steps_ko, "다음 단계 제안이 없습니다.")}</section>
        <section><h4>유용한 표현</h4>${expressionsMarkup(item.key_expressions)}</section>
        <section><h4>더 자연스럽게</h4>${correctionsMarkup(item.corrections)}</section>
      </div>
      ${feedback.retry_mission_ko ? `<div class="practice-retry-mission"><strong>다시 말하기 미션</strong><p>${api.escapeHtml(feedback.retry_mission_ko)}</p></div>` : ""}
      ${comparison.comparison_ko ? `<div class="practice-comparison"><strong>이전 시도와 비교</strong><p>${api.escapeHtml(comparison.comparison_ko)}</p>${listMarkup(comparison.improved_points_ko, "")}</div>` : ""}
      <p class="ai-disclaimer">전사 텍스트를 바탕으로 한 학습 보조 피드백이며 발음 점수나 공식 수준 평가가 아닙니다.</p></details>` : ""}
      ${item.status === "processing" ? '<div class="empty-box compact">AI가 전사와 피드백을 만들고 있어요. 잠시 후 새로고침해주세요.</div>' : ""}
      ${["failed", "uploaded"].includes(item.status) ? `<div class="audio-error"><span>${api.escapeHtml(item.status === "failed" ? (item.ai_error || "AI 처리 오류가 발생했습니다.") : "분석이 아직 시작되지 않았습니다.")}</span><button class="member-button secondary" data-reprocess-audio="${api.escapeHtml(item.id)}" type="button">AI 재분석</button></div>` : ""}
      ${item.teacher_feedback ? `<div class="teacher-feedback"><strong>선생님 피드백</strong><p>${api.escapeHtml(item.teacher_feedback)}</p><span>${api.escapeHtml(api.formatDateTime(item.feedback_at))}</span></div>` : ""}
      ${quizMarkup(module, item)}
    </article>`;
  }

  function renderSubmissions() {
    $("studentAudioList").innerHTML = state.submissions.length
      ? state.submissions.map(submissionMarkup).join("")
      : '<div class="empty-box">아직 AI 말하기 연습 기록이 없습니다. 위에서 첫 커리큘럼을 선택해보세요.</div>';
  }

  function renderNotifications() {
    const target = $("studentNotificationList");
    if (!target) return;
    target.innerHTML = state.notifications.length
      ? state.notifications.slice(0, 8).map((item) => `<button class="notification-row ${item.read_at ? "read" : ""}" data-notification-id="${api.escapeHtml(item.id)}" data-open-view="audio" type="button"><span></span><div><strong>${api.escapeHtml(item.title)}</strong><p>${api.escapeHtml(item.body || "")}</p><small>${api.escapeHtml(api.formatDateTime(item.created_at))}</small></div></button>`).join("")
      : '<div class="empty-box">새 알림이 없습니다.</div>';
  }

  async function loadAccess() {
    const { data, error } = await api.client.rpc("get_practice_access_summary");
    if (error) throw error;
    state.access = data;
    renderAccess();
  }

  async function loadModulesAndProgress() {
    const [modules, progress] = await Promise.all([
      api.client.from("practice_modules").select("*").eq("is_active", true).order("level").order("sort_order"),
      api.client.from("practice_progress").select("*").order("last_practiced_at", { ascending: false }),
    ]);
    if (modules.error) throw modules.error;
    if (progress.error) throw progress.error;
    const order = { starter: 1, basic: 2, intermediate: 3 };
    state.modules = (modules.data || []).sort((a, b) => (order[a.level] - order[b.level]) || Number(a.sort_order || 0) - Number(b.sort_order || 0) || a.title_ko.localeCompare(b.title_ko, "ko"));
    state.progress = progress.data || [];
    renderCategoryFilter();
    renderModules();
  }

  async function loadNotifications() {
    const { data, error } = await api.client.from("portal_notifications").select("*").order("created_at", { ascending: false }).limit(20);
    if (error) throw error;
    state.notifications = data || [];
    renderNotifications();
  }

  async function loadSubmissions() {
    if (!state.student) {
      state.submissions = [];
      return renderSubmissions();
    }
    const { data, error } = await api.client.from("audio_submissions").select("*")
      .eq("student_id", state.student.id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    state.submissions = data || [];
    renderSubmissions();
  }

  async function refreshPracticeData() {
    await Promise.all([loadAccess(), loadModulesAndProgress(), loadSubmissions(), loadNotifications()]);
    // Records depend on both module metadata and current plan access.
    // Re-render after all parallel queries, regardless of their completion order.
    renderSubmissions();
    renderSelectedModule();
  }

  async function initialize() {
    state.auth = await api.requireRole(["student"]);
    if (!state.auth) return;
    const userId = state.auth.session.user.id;
    const { data: student, error: studentError } = await api.client.from("student_records").select("*").eq("auth_user_id", userId).maybeSingle();
    if (studentError || !student) throw studentError || new Error("학생 정보를 찾지 못했습니다.");
    state.student = student;

    const [assignmentResult, consentResult] = await Promise.all([
      api.client.from("student_assignments")
        .select("id,teacher_id,student_id,status,assignment_type,plan")
        .eq("student_id", student.id)
        .eq("status", "active")
        .eq("assignment_type", "regular")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      api.client.from("audio_consents").select("*").eq("student_id", student.id).maybeSingle(),
    ]);
    if (assignmentResult.error) throw assignmentResult.error;
    if (consentResult.error) throw consentResult.error;
    state.assignment = assignmentResult.data;
    state.consent = consentResult.data;

    if (!state.assignment) {
      $("audioConsentPanel").classList.add("hidden");
      $("practiceAppPanel").classList.add("hidden");
      $("studentAudioList").innerHTML = '<div class="empty-box">활성 정규 수업 배정이 확인되지 않아 AI 연습을 시작할 수 없습니다. NADO 운영팀에 문의해주세요.</div>';
      return;
    }

    const consented = Boolean(state.consent?.voice_ai_consent && !state.consent?.withdrawn_at && (!state.consent?.is_under_14 || state.consent?.guardian_consent_confirmed));
    $("audioConsentPanel").classList.toggle("hidden", consented);
    $("practiceAppPanel").classList.toggle("hidden", !consented);

    await Promise.all([loadAccess(), loadModulesAndProgress(), loadSubmissions(), loadNotifications()]);
    renderSubmissions();
    const requestedModule = new URLSearchParams(location.search).get("module");
    if (requestedModule && state.modules.some((m) => m.id === requestedModule)) selectModule(requestedModule);
  }

  async function saveConsent() {
    if (!$("audioConsentCheck").checked) return api.toast("음성 및 AI 처리 동의를 확인해주세요.", true);
    const ageGroup = $("audioAgeGroup").value;
    if (!ageGroup) return api.toast("학생 연령을 선택해주세요.", true);
    if (ageGroup === "under14" && !$("guardianConsentCheck").checked) return api.toast("만 14세 미만 학생은 법정대리인 동의 확인이 필요합니다.", true);
    const button = $("saveAudioConsent");
    button.disabled = true;
    const { data, error } = await api.client.rpc("save_audio_consent", {
      student_under_14: ageGroup === "under14",
      guardian_confirmed: $("guardianConsentCheck").checked,
    });
    button.disabled = false;
    if (error) return api.toast("동의 내용을 저장하지 못했습니다.", true);
    state.consent = data;
    $("audioConsentPanel").classList.add("hidden");
    $("practiceAppPanel").classList.remove("hidden");
    try {
      await refreshPracticeData();
      api.toast("동의가 저장되었습니다. 이제 커리큘럼을 선택해 연습할 수 있어요.");
    } catch (loadError) {
      api.toast(friendlyError(loadError, "AI 연습 정보를 불러오지 못했습니다."), true);
    }
  }

  async function submitRecording() {
    if (!state.blob || !state.assignment || !state.selectedModule) return;
    if (Number(state.access?.remaining || 0) <= 0) return api.toast("이번 주 AI 말하기 연습 한도를 모두 사용했습니다.", true);

    const button = $("submitRecording");
    button.disabled = true;
    button.textContent = "업로드 중...";
    const ext = extensionFor(state.blob.type);
    const name = `nado-practice-${state.selectedModule.slug}-${Date.now()}.${ext}`;
    const path = `${state.assignment.id}/${state.auth.session.user.id}/${newUuid()}.${ext}`;
    const contentType = (state.blob.type || "audio/webm").split(";")[0];

    const { error: uploadError } = await api.client.storage.from("audio-submissions").upload(path, state.blob, {
      contentType,
      upsert: false,
    });
    if (uploadError) {
      button.disabled = false;
      button.textContent = "AI 피드백 받기";
      return api.toast("녹음을 업로드하지 못했습니다.", true);
    }

    const { data: row, error: createError } = await api.client.rpc("create_practice_submission", {
      target_module_id: state.selectedModule.id,
      target_storage_path: path,
      target_original_name: name,
      target_content_type: contentType,
      target_size_bytes: state.blob.size,
      target_duration_seconds: Math.max(1, Math.min(Number(state.access.max_recording_seconds), Math.ceil(state.duration))),
      target_parent_submission_id: state.retryParent?.id || null,
      request_teacher_review: Boolean($("teacherReviewRequested").checked),
    });

    if (createError) {
      await api.client.storage.from("audio-submissions").remove([path]);
      button.disabled = false;
      button.textContent = "AI 피드백 받기";
      return api.toast(friendlyError(createError, "연습 정보를 저장하지 못했습니다."), true);
    }

    resetRecording(false);
    state.retryParent = null;
    button.textContent = "AI 분석 중...";
    api.toast("녹음이 저장됐습니다. AI 피드백을 만들고 있어요.");

    const { data: processResult, error: processError } = await api.client.functions.invoke("process-audio", {
      body: { submission_id: row.id },
    });
    button.disabled = false;
    button.textContent = "AI 피드백 받기";

    if (processError || processResult?.error) {
      api.toast(processResult?.error || "AI 분석이 지연되고 있습니다. 기록에서 다시 시도할 수 있어요.", true);
    } else {
      api.toast("AI 맞춤 피드백이 준비됐습니다.");
    }

    await refreshPracticeData();
    $("studentAudioList").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function playAudio(id, adminPrefix = "") {
    const item = state.submissions.find((row) => row.id === id);
    if (!item || item.raw_audio_deleted_at) return api.toast("원본 음성 보관 기간이 종료되었습니다.", true);
    const container = document.querySelector(`[data-${adminPrefix}player-for="${cssEscape(id)}"]`);
    if (container?.querySelector("audio")) return container.querySelector("audio").play();
    const { data, error } = await api.client.storage.from("audio-submissions").createSignedUrl(item.storage_path, 300);
    if (error) return api.toast("녹음을 열지 못했습니다.", true);
    if (container) container.innerHTML = `<audio controls autoplay src="${api.escapeHtml(data.signedUrl)}"></audio>`;
  }

  async function reprocessAudio(id) {
    api.toast("AI 분석을 다시 시작합니다.");
    const { data, error } = await api.client.functions.invoke("process-audio", { body: { submission_id: id } });
    if (error || data?.error) api.toast(data?.error || "다시 분석하지 못했습니다.", true);
    await Promise.all([loadSubmissions(), loadNotifications()]);
  }

  async function submitQuiz(form) {
    const selected = form.querySelector("input[type='radio']:checked")?.value;
    const resultNode = form.querySelector(".practice-quiz-result");
    if (!selected) {
      resultNode.textContent = "답을 하나 선택해주세요.";
      resultNode.className = "practice-quiz-result wrong";
      return;
    }
    const button = form.querySelector("button[type='submit']");
    button.disabled = true;
    const { data, error } = await api.client.rpc("save_practice_quiz_attempt", {
      target_module_id: form.dataset.moduleId,
      target_audio_submission_id: form.dataset.submissionId,
      target_question_index: Number(form.dataset.questionIndex),
      target_selected_answer: selected,
    });
    button.disabled = false;
    if (error) {
      resultNode.textContent = "퀴즈 결과를 저장하지 못했습니다.";
      resultNode.className = "practice-quiz-result wrong";
      return;
    }
    resultNode.textContent = data.is_correct
      ? `정답입니다. ${data.explanation_ko || ""}`
      : `다시 확인해보세요. 정답: ${data.correct_answer}. ${data.explanation_ko || ""}`;
    resultNode.className = `practice-quiz-result ${data.is_correct ? "correct" : "wrong"}`;
  }

  $("saveAudioConsent").addEventListener("click", saveConsent);
  $("audioAgeGroup").addEventListener("change", () => {
    const under14 = $("audioAgeGroup").value === "under14";
    $("guardianConsentLabel").classList.toggle("hidden", !under14);
    if (!under14) $("guardianConsentCheck").checked = false;
  });
  $("practiceLevelFilter").addEventListener("change", renderModules);
  $("practiceCategoryFilter").addEventListener("change", renderModules);
  $("refreshPracticeModules").addEventListener("click", () => refreshPracticeData().catch((error) => api.toast(friendlyError(error, "새로고침하지 못했습니다."), true)));
  $("closeSelectedPractice").addEventListener("click", closeSelectedModule);
  $("startRecording").addEventListener("click", startRecording);
  $("pauseRecording").addEventListener("click", pauseRecording);
  $("stopRecording").addEventListener("click", stopRecording);
  $("resetRecording").addEventListener("click", () => resetRecording(false));
  $("submitRecording").addEventListener("click", submitRecording);
  $("refreshAudioList").addEventListener("click", () => refreshPracticeData().catch((error) => api.toast(friendlyError(error, "기록을 새로고침하지 못했습니다."), true)));

  $("practiceModuleGrid").addEventListener("click", (event) => {
    const button = event.target.closest("[data-select-practice]");
    if (button) selectModule(button.dataset.selectPractice);
  });

  $("studentAudioList").addEventListener("click", (event) => {
    const play = event.target.closest("[data-play-audio]");
    if (play) playAudio(play.dataset.playAudio);
    const reprocess = event.target.closest("[data-reprocess-audio]");
    if (reprocess) reprocessAudio(reprocess.dataset.reprocessAudio);
    const retry = event.target.closest("[data-retry-practice]");
    if (retry) {
      const item = state.submissions.find((row) => row.id === retry.dataset.retryPractice);
      if (item?.practice_module_id) selectModule(item.practice_module_id, item);
    }
  });

  $("studentAudioList").addEventListener("submit", (event) => {
    const form = event.target.closest("[data-quiz-form]");
    if (!form) return;
    event.preventDefault();
    submitQuiz(form);
  });

  $("studentNotificationList")?.addEventListener("click", async (event) => {
    const row = event.target.closest("[data-notification-id]");
    if (!row) return;
    const item = state.notifications.find((entry) => entry.id === row.dataset.notificationId);
    if (item && !item.read_at) {
      await api.client.rpc("mark_portal_notification_read", { target_notification_id: item.id });
      item.read_at = new Date().toISOString();
      renderNotifications();
    }
  });

  window.addEventListener("beforeunload", () => {
    clearTimer();
    stopStream();
    if (state.previewUrl) URL.revokeObjectURL(state.previewUrl);
  });

  initialize().catch((error) => {
    $("audioConsentPanel").classList.add("hidden");
    $("practiceAppPanel").classList.add("hidden");
    $("studentAudioList").innerHTML = `<div class="empty-box">${api.escapeHtml(friendlyError(error, "AI 말하기 연습을 불러오지 못했습니다."))}<br>Phase 1 SQL과 Edge Function 배포 여부를 확인해주세요.</div>`;
  });
})();
