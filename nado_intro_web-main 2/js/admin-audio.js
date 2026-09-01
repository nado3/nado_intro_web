(() => {
  const api = window.NadoMember;
  if (!api) return;
  const $ = (id) => document.getElementById(id);
  const state = { auth: null, submissions: [], students: [], assignments: [], teachers: [], usage: [] };
  const statusLabel = (status) => ({ uploaded:"업로드 완료",processing:"AI 분석 중",ready:"피드백 대기",reviewed:"피드백 완료",completed:"학습 완료",rerecord_requested:"재녹음 요청",failed:"처리 오류",deleted:"원본 삭제" }[status] || status);

  function render() {
    const studentMap = new Map(state.students.map((row) => [row.id, row]));
    const assignmentMap = new Map(state.assignments.map((row) => [row.id, row]));
    const teacherMap = new Map(state.teachers.map((row) => [row.id, row]));
    $("adminAudioCount").textContent = `${state.submissions.length}개`;
    $("adminAudioPendingCount").textContent = `${state.submissions.filter((row) => row.status === "ready").length}개`;
    $("adminAudioFailedCount").textContent = `${state.submissions.filter((row) => row.status === "failed").length}개`;
    $("adminAudioMinutes").textContent = `${Math.ceil(state.submissions.reduce((sum, row) => sum + Number(row.duration_seconds || 0), 0) / 60)}분`;
    $("adminAiCallCount").textContent = `${state.usage.length}회`;
    $("adminAudioList").innerHTML = state.submissions.length ? state.submissions.map((row) => {
      const student = studentMap.get(row.student_id);
      const assignment = assignmentMap.get(row.assignment_id);
      const teacher = teacherMap.get(assignment?.teacher_id);
      return `<article class="audio-submission-card"><div class="audio-submission-head"><div><span class="audio-status ${api.escapeHtml(row.status)}">${api.escapeHtml(statusLabel(row.status))}</span><h3>${api.escapeHtml(row.title)}</h3><p>${api.escapeHtml(student?.full_name || assignment?.student_name || "학생 미확인")} · ${api.escapeHtml(teacher?.full_name || "선생님 미확인")} · ${api.escapeHtml(api.formatDateTime(row.created_at))}</p></div><div class="table-actions">${row.raw_audio_deleted_at ? "" : `<button class="member-button secondary" data-admin-play-audio="${api.escapeHtml(row.id)}" type="button">▶ 재생</button>`}${["failed","uploaded","processing"].includes(row.status) ? `<button class="member-button secondary" data-admin-retry-audio="${api.escapeHtml(row.id)}" type="button">AI 재처리</button>` : ""}<button class="member-button danger" data-admin-delete-audio="${api.escapeHtml(row.id)}" type="button">삭제</button></div></div>
        <div class="inline-audio-player" data-admin-player="${api.escapeHtml(row.id)}"></div>
        <div class="audio-admin-meta"><span>길이 ${Math.floor(row.duration_seconds / 60)}분 ${row.duration_seconds % 60}초</span><span>크기 ${api.formatBytes(row.size_bytes)}</span><span>원본 만료 ${api.escapeHtml(api.formatDateTime(row.raw_audio_expires_at))}</span><span>${row.raw_audio_deleted_at ? `원본 삭제 ${api.escapeHtml(api.formatDateTime(row.raw_audio_deleted_at))}` : "원본 보관 중"}</span></div>
        ${row.ai_error ? `<div class="audio-error"><span>${api.escapeHtml(row.ai_error)}</span></div>` : ""}
        ${row.summary_ko ? `<details class="ai-result"><summary>AI 결과 확인</summary><div class="ai-result-grid"><section><h4>요약</h4><p>${api.escapeHtml(row.summary_ko)}</p></section><section><h4>전사</h4><p class="transcript">${api.escapeHtml(row.transcript_en || "-")}</p></section></div></details>` : ""}
        ${row.teacher_feedback ? `<div class="teacher-feedback"><strong>선생님 피드백</strong><p>${api.escapeHtml(row.teacher_feedback)}</p></div>` : ""}</article>`;
    }).join("") : '<div class="empty-box">아직 음성 제출물이 없습니다.</div>';
  }

  async function load() {
    state.auth = state.auth || await api.requireRole(["admin"]);
    if (!state.auth) return;
    const [submissions, students, assignments, teachers, usage] = await Promise.all([
      api.client.from("audio_submissions").select("*").order("created_at", { ascending: false }),
      api.client.from("student_records").select("id,full_name,email"),
      api.client.from("student_assignments").select("id,teacher_id,student_id,student_name"),
      api.client.from("profiles").select("id,full_name").eq("role", "teacher"),
      api.client.from("ai_usage_logs").select("id,operation,success,created_at"),
    ]);
    const failed = [submissions,students,assignments,teachers,usage].find((result) => result.error);
    if (failed) throw failed.error;
    state.submissions = submissions.data || []; state.students = students.data || [];
    state.assignments = assignments.data || []; state.teachers = teachers.data || []; state.usage = usage.data || []; render();
  }

  async function play(id) {
    const row = state.submissions.find((item) => item.id === id); if (!row) return;
    const target = document.querySelector(`[data-admin-player="${CSS.escape(id)}"]`);
    if (target.querySelector("audio")) return target.querySelector("audio").play();
    const { data, error } = await api.client.storage.from("audio-submissions").createSignedUrl(row.storage_path, 300);
    if (error) return api.toast("녹음을 열지 못했습니다.", true);
    target.innerHTML = `<audio controls autoplay src="${api.escapeHtml(data.signedUrl)}"></audio>`;
  }

  async function retry(id) {
    api.toast("AI 재처리를 시작합니다.");
    const { data, error } = await api.client.functions.invoke("process-audio", { body: { submission_id: id } });
    if (error || data?.error) api.toast(data?.error || "AI 재처리에 실패했습니다.", true);
    await load();
  }

  async function remove(id) {
    const row = state.submissions.find((item) => item.id === id);
    if (!row || !confirm("이 음성 제출물과 AI 결과, 선생님 피드백을 모두 삭제할까요? 되돌릴 수 없습니다.")) return;
    if (!row.raw_audio_deleted_at) {
      const { error: storageError } = await api.client.storage.from("audio-submissions").remove([row.storage_path]);
      if (storageError) return api.toast("원본 음성을 삭제하지 못했습니다.", true);
    }
    const { error } = await api.client.from("audio_submissions").delete().eq("id", id);
    if (error) return api.toast("제출 기록을 삭제하지 못했습니다.", true);
    state.submissions = state.submissions.filter((item) => item.id !== id); render(); api.toast("음성 제출물을 삭제했습니다.");
  }

  async function cleanup() {
    if (!confirm("보관 만료일이 지난 원본 음성을 삭제할까요? 전사·요약·피드백 기록은 유지됩니다.")) return;
    const { data, error } = await api.client.functions.invoke("cleanup-audio", { body: {} });
    if (error || data?.error) return api.toast(data?.error || "만료 원본 정리에 실패했습니다.", true);
    api.toast(`만료된 원본 ${data.deleted || 0}개를 정리했습니다.`); await load();
  }

  $("adminRefreshAudio").addEventListener("click", () => load().catch((error) => api.toast(error.message, true)));
  $("adminCleanupAudio").addEventListener("click", cleanup);
  $("adminAudioList").addEventListener("click", (event) => {
    const playButton = event.target.closest("[data-admin-play-audio]"); if (playButton) play(playButton.dataset.adminPlayAudio);
    const retryButton = event.target.closest("[data-admin-retry-audio]"); if (retryButton) retry(retryButton.dataset.adminRetryAudio);
    const deleteButton = event.target.closest("[data-admin-delete-audio]"); if (deleteButton) remove(deleteButton.dataset.adminDeleteAudio);
  });
  load().catch((error) => { $("adminAudioList").innerHTML = `<div class="empty-box">${api.escapeHtml(error.message || "음성 현황을 불러오지 못했습니다.")}<br>Phase 2 SQL 적용 여부를 확인해주세요.</div>`; });
})();
