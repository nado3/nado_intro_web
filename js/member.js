(() => {
  const api = window.NadoMember;
  const state = { auth: null, student: null, assignment: null, teacher: null, files: [], resources: [] };
  const allowedExtensions = ["pdf","doc","docx","ppt","pptx","xls","xlsx","jpg","jpeg","png","webp","mp3","m4a","wav"];

  const byId = (id) => document.getElementById(id);
  const initials = (name) => String(name || "T").trim().split(/\s+/).map((part) => part[0]).join("").slice(0,2).toUpperCase();

  function switchView(name) {
    document.querySelectorAll(".member-view").forEach((node) => node.classList.toggle("active", node.id === `view-${name}`));
    document.querySelectorAll("[data-member-view]").forEach((node) => node.classList.toggle("active", node.dataset.memberView === name));
    const titles = {
      dashboard: [state.student ? `${state.student.full_name}님, 안녕하세요!` : "안녕하세요!", "오늘도 NADO와 함께 편하게 영어를 시작해보세요."],
      resources: ["NADO 회원 자료실", "활성 회원에게만 제공되는 영어 학습 자료입니다."],
      classroom: ["선생님 공유 공간", "담당 선생님과 수업 자료를 안전하게 주고받으세요."]
    };
    byId("pageTitle").textContent = titles[name][0];
    byId("pageSubtitle").textContent = titles[name][1];
  }

  function renderProfile() {
    const { student, assignment, teacher } = state;
    byId("sidebarStudentName").textContent = student.full_name;
    byId("sidebarStudentEmail").textContent = student.email;
    byId("accountStatus").textContent = api.statusLabel(student.status);
    byId("pageTitle").textContent = `${student.full_name}님, 안녕하세요!`;
    if (!assignment || !teacher) {
      byId("teacherProfile").innerHTML = '<div class="empty-box">현재 활성화된 담당 선생님이 없습니다. NADO 운영팀에 문의해주세요.</div>';
      byId("lessonMetrics").innerHTML = '<div class="empty-box">수업 배정 정보가 없습니다.</div>';
      byId("studentFileForm").classList.add("hidden");
      return;
    }
    byId("teacherProfile").innerHTML = `
      <div class="teacher-profile">
        <span class="teacher-avatar">${api.escapeHtml(initials(teacher.full_name))}</span>
        <div><strong>${api.escapeHtml(teacher.full_name || "담당 선생님")}</strong><span>${api.escapeHtml([teacher.school, teacher.major].filter(Boolean).join(" · ") || "NADO Teacher")}</span></div>
      </div>
      ${teacher.bio ? `<p class="member-help">${api.escapeHtml(teacher.bio)}</p>` : ""}`;
    byId("lessonMetrics").innerHTML = `
      <div class="member-metric"><span>이용 플랜</span><strong>${api.escapeHtml(api.planLabel(assignment.plan || student.plan))}</strong></div>
      <div class="member-metric"><span>수업 빈도</span><strong>주 ${Number(assignment.weekly_frequency || 1)}회</strong></div>
      <div class="member-metric"><span>수업 시작일</span><strong>${api.escapeHtml(api.formatDate(assignment.first_lesson_date))}</strong></div>`;
    byId("classroomDescription").textContent = `${teacher.full_name || "담당 선생님"} 선생님과 파일을 안전하게 공유합니다.`;
  }

  function resourceMarkup(item) {
    const tag = item.storage_path ? "button" : "a";
    const target = item.storage_path
      ? `type="button" data-resource-storage="${api.escapeHtml(item.storage_path)}"`
      : `href="${api.escapeHtml(item.file_url)}" target="_blank" rel="noopener"`;
    return `<${tag} class="resource-item" ${target}>
      <span class="type">${api.escapeHtml(item.category || "RESOURCE")}</span>
      <strong>${api.escapeHtml(item.title)}</strong><span>${api.escapeHtml(item.description || "자료 열기")}</span>
    </${tag}>`;
  }

  function renderResources() {
    byId("resourceGrid").innerHTML = state.resources.length
      ? state.resources.map(resourceMarkup).join("")
      : '<div class="empty-box">현재 등록된 회원 자료가 없습니다.</div>';
  }

  function fileMarkup(file) {
    const who = file.uploader_id === state.auth.session.user.id ? "내가 업로드" : "선생님 업로드";
    return `<div class="file-row"><div><strong>${api.escapeHtml(file.original_name)}</strong><span>${who} · ${api.formatBytes(file.size_bytes)} · ${api.escapeHtml(api.formatDateTime(file.created_at))}</span></div><button type="button" data-download-file="${api.escapeHtml(file.id)}">다운로드</button></div>`;
  }

  function renderFiles() {
    const all = state.files.length ? state.files.map(fileMarkup).join("") : '<div class="empty-box">아직 공유된 파일이 없습니다.</div>';
    byId("classroomFileList").innerHTML = all;
    byId("recentFileList").innerHTML = state.files.length ? state.files.slice(0,3).map(fileMarkup).join("") : '<div class="empty-box">아직 공유된 파일이 없습니다.</div>';
  }

  async function loadData() {
    state.auth = await api.requireRole(["student"]);
    if (!state.auth) return;
    const userId = state.auth.session.user.id;
    const { data: student, error: studentError } = await api.client.from("student_records").select("*").eq("auth_user_id", userId).maybeSingle();
    if (studentError || !student) throw new Error("학생 등록 정보를 찾지 못했습니다. NADO 운영팀에 문의해주세요.");
    if (student.status !== "active") throw new Error("현재 이용이 정지되었거나 종료된 학생 계정입니다.");
    state.student = student;
    api.client.rpc("mark_student_invitation_accepted").then(() => {}).catch(() => {});

    const [assignmentResult, resourceResult] = await Promise.all([
      api.client.from("student_assignments").select("id, teacher_id, student_id, student_name, student_email, plan, weekly_frequency, lesson_duration_minutes, first_lesson_date, settlement_date, status").eq("student_id", student.id).eq("status", "active").eq("assignment_type", "regular").order("created_at", { ascending: false }).limit(1).maybeSingle(),
      api.client.from("resources").select("id,title,description,category,file_url,storage_path,original_name,size_bytes,sort_order").eq("is_active", true).order("sort_order")
    ]);
    if (assignmentResult.error) throw assignmentResult.error;
    if (resourceResult.error) throw resourceResult.error;
    state.assignment = assignmentResult.data;
    state.resources = resourceResult.data || [];

    if (state.assignment) {
      const [teacherResult, fileResult] = await Promise.all([
        api.client.from("profiles").select("id,full_name,school,major,bio").eq("id", state.assignment.teacher_id).maybeSingle(),
        api.client.from("assignment_files").select("*").eq("assignment_id", state.assignment.id).order("created_at", { ascending: false })
      ]);
      if (teacherResult.error) throw teacherResult.error;
      if (fileResult.error) throw fileResult.error;
      state.teacher = teacherResult.data;
      state.files = fileResult.data || [];
    }
    renderProfile();
    renderResources();
    renderFiles();
  }

  async function downloadFile(id) {
    const file = state.files.find((item) => item.id === id);
    if (!file) return;
    const { data, error } = await api.client.storage.from("assignment-files").createSignedUrl(file.storage_path, 60);
    if (error) return api.toast("파일을 열지 못했습니다.", true);
    window.open(data.signedUrl, "_blank", "noopener");
  }

  async function downloadResource(path) {
    const { data, error } = await api.client.storage.from("member-resources").createSignedUrl(path, 60);
    if (error) return api.toast("자료를 열지 못했습니다.", true);
    window.open(data.signedUrl, "_blank", "noopener");
  }

  byId("studentFileForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!state.assignment) return api.toast("활성 배정이 없어 파일을 올릴 수 없습니다.", true);
    const file = byId("studentFileInput").files[0];
    if (!file) return;
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    if (!allowedExtensions.includes(ext)) return api.toast("허용되지 않는 파일 형식입니다.", true);
    if (file.size > api.config.MAX_FILE_BYTES) return api.toast("파일은 50MB 이하만 업로드할 수 있습니다.", true);
    const button = byId("studentUploadButton");
    button.disabled = true;
    button.textContent = "업로드 중...";
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100);
    const path = `${state.assignment.id}/${crypto.randomUUID()}-${safeName}`;
    const { error: uploadError } = await api.client.storage.from("assignment-files").upload(path, file, { upsert: false, contentType: file.type || "application/octet-stream" });
    if (uploadError) {
      button.disabled = false; button.textContent = "파일 업로드";
      return api.toast("파일 업로드에 실패했습니다.", true);
    }
    const { data: row, error: rowError } = await api.client.from("assignment_files").insert({
      assignment_id: state.assignment.id, uploader_id: state.auth.session.user.id, original_name: file.name,
      storage_path: path, content_type: file.type || null, size_bytes: file.size
    }).select("*").single();
    button.disabled = false; button.textContent = "파일 업로드";
    if (rowError) {
      await api.client.storage.from("assignment-files").remove([path]);
      return api.toast("파일 정보를 저장하지 못했습니다.", true);
    }
    byId("studentFileInput").value = "";
    state.files.unshift(row);
    renderFiles();
    api.toast("파일을 공유 공간에 업로드했습니다.");
  });

  document.addEventListener("click", (event) => {
    const viewButton = event.target.closest("[data-member-view],[data-open-view]");
    if (viewButton) switchView(viewButton.dataset.memberView || viewButton.dataset.openView);
    const downloadButton = event.target.closest("[data-download-file]");
    if (downloadButton) downloadFile(downloadButton.dataset.downloadFile);
    const resourceButton = event.target.closest("[data-resource-storage]");
    if (resourceButton) downloadResource(resourceButton.dataset.resourceStorage);
  });
  byId("logoutButton").addEventListener("click", api.signOut);
  byId("mobileLogoutButton").addEventListener("click", api.signOut);

  loadData().catch((error) => {
    api.toast(error.message || "학생 포털을 불러오지 못했습니다.", true);
    document.querySelector(".member-content").innerHTML = `<div class="empty-box">${api.escapeHtml(error.message || "학생 정보를 불러오지 못했습니다.")}<br><a href="${api.escapeHtml(api.config.SUPPORT_URL)}">NADO 운영팀에 문의하기</a></div>`;
  });
})();
