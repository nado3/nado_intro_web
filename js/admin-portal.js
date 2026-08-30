(() => {
  const api = window.NadoMember;
  const state = { auth: null, students: [], assignments: [], files: [], teachers: [] };
  const byId = (id) => document.getElementById(id);

  function switchView(name) {
    document.querySelectorAll("[id^='admin-view-']").forEach((node) => node.classList.toggle("active", node.id === `admin-view-${name}`));
    document.querySelectorAll("[data-admin-view]").forEach((node) => node.classList.toggle("active", node.dataset.adminView === name));
    const titles = { overview: "NADO 운영 현황", students: "학생 계정 관리", assignments: "전체 학생 배정", files: "전체 공유 파일" };
    byId("adminPageTitle").textContent = titles[name] || "NADO 관리자";
  }

  const table = (head, rows) => rows.length
    ? `<table class="admin-table"><thead><tr>${head.map((item) => `<th>${item}</th>`).join("")}</tr></thead><tbody>${rows.join("")}</tbody></table>`
    : '<div class="empty-box">표시할 데이터가 없습니다.</div>';

  function studentRow(student, compact = false) {
    const status = api.statusLabel(student.status);
    return `<tr><td><strong>${api.escapeHtml(student.full_name)}</strong><span>${api.escapeHtml(student.email)} · ${api.escapeHtml(student.invitation_status === "active" ? "가입 완료" : student.invitation_status === "sent" ? "초대 발송" : "초대 전")}</span></td><td>${api.escapeHtml(api.planLabel(student.plan))}</td><td><span class="status-chip ${api.escapeHtml(student.status)}">${api.escapeHtml(status)}</span></td><td>${api.escapeHtml(api.formatDate(student.access_start))}</td>${compact ? "" : `<td><div class="table-actions">${student.status === "active" ? `<button data-student-status="suspended" data-student-id="${student.id}">일시 정지</button><button data-student-status="expired" data-student-id="${student.id}">이용 종료</button>` : `<button data-student-status="active" data-student-id="${student.id}">재활성화</button>`}</div></td>`}</tr>`;
  }

  function render() {
    const activeAssignments = state.assignments.filter((item) => item.status === "active" && item.assignment_type === "regular");
    byId("activeStudentCount").textContent = `${state.students.filter((item) => item.status === "active").length}명`;
    byId("activeAssignmentCount").textContent = `${activeAssignments.length}건`;
    byId("sharedFileCount").textContent = `${state.files.length}개`;
    byId("recentStudentTable").innerHTML = table(["학생", "플랜", "상태", "시작일"], state.students.slice(0,5).map((item) => studentRow(item, true)));
    byId("studentTable").innerHTML = table(["학생", "플랜", "상태", "시작일", "관리"], state.students.map((item) => studentRow(item)));

    const studentMap = new Map(state.students.map((item) => [item.id, item]));
    const teacherMap = new Map(state.teachers.map((item) => [item.id, item]));
    byId("assignmentTable").innerHTML = table(["학생", "담당 선생님", "플랜", "상태", "시작일"], state.assignments.map((item) => {
      const student = studentMap.get(item.student_id);
      const teacher = teacherMap.get(item.teacher_id);
      return `<tr><td><strong>${api.escapeHtml(item.student_name || student?.full_name)}</strong><span>${api.escapeHtml(item.student_email || student?.email)}</span></td><td>${api.escapeHtml(teacher?.full_name || "-")}</td><td>${api.escapeHtml(api.planLabel(item.plan))}</td><td><span class="status-chip ${api.escapeHtml(item.status)}">${api.escapeHtml(api.statusLabel(item.status))}</span></td><td>${api.escapeHtml(api.formatDate(item.first_lesson_date))}</td></tr>`;
    }));
    byId("adminFileList").innerHTML = state.files.length ? state.files.map((file) => {
      const assignment = state.assignments.find((item) => item.id === file.assignment_id);
      return `<div class="file-row"><div><strong>${api.escapeHtml(file.original_name)}</strong><span>${api.escapeHtml(assignment?.student_name || "학생 미확인")} · ${api.formatBytes(file.size_bytes)} · ${api.escapeHtml(api.formatDateTime(file.created_at))}</span></div><button data-admin-download="${api.escapeHtml(file.id)}" type="button">다운로드</button></div>`;
    }).join("") : '<div class="empty-box">아직 공유된 파일이 없습니다.</div>';
  }

  async function load() {
    state.auth = await api.requireRole(["admin"]);
    if (!state.auth) return;
    byId("adminName").textContent = state.auth.profile.full_name || "NADO 관리자";
    byId("adminEmail").textContent = state.auth.profile.email || state.auth.session.user.email;
    const [students, assignments, files, teachers] = await Promise.all([
      api.client.from("student_records").select("*").order("created_at", { ascending: false }),
      api.client.from("student_assignments").select("id,teacher_id,student_id,student_name,student_email,assignment_type,plan,status,first_lesson_date,created_at").order("created_at", { ascending: false }),
      api.client.from("assignment_files").select("*").order("created_at", { ascending: false }),
      api.client.from("profiles").select("id,full_name,email").eq("role", "teacher").order("full_name")
    ]);
    const firstError = [students, assignments, files, teachers].find((result) => result.error)?.error;
    if (firstError) throw firstError;
    state.students = students.data || [];
    state.assignments = assignments.data || [];
    state.files = files.data || [];
    state.teachers = teachers.data || [];
    render();
  }

  async function setStudentStatus(studentId, status) {
    if (!confirm(status === "active" ? "이 학생의 이용 권한을 다시 활성화할까요?" : "이 학생의 이용 권한을 변경할까요?")) return;
    const { error } = await api.client.rpc("admin_set_student_status", { target_student_id: studentId, next_status: status });
    if (error) return api.toast("학생 상태를 변경하지 못했습니다.", true);
    const student = state.students.find((item) => item.id === studentId);
    if (student) student.status = status;
    render();
    api.toast("학생 이용 상태를 변경했습니다.");
  }

  async function download(id) {
    const file = state.files.find((item) => item.id === id);
    if (!file) return;
    const { data, error } = await api.client.storage.from("assignment-files").createSignedUrl(file.storage_path, 60);
    if (error) return api.toast("파일을 열지 못했습니다.", true);
    window.open(data.signedUrl, "_blank", "noopener");
  }

  document.addEventListener("click", (event) => {
    const view = event.target.closest("[data-admin-view]");
    if (view) switchView(view.dataset.adminView);
    const status = event.target.closest("[data-student-status]");
    if (status) setStudentStatus(status.dataset.studentId, status.dataset.studentStatus);
    const downloadButton = event.target.closest("[data-admin-download]");
    if (downloadButton) download(downloadButton.dataset.adminDownload);
  });
  byId("adminLogout").addEventListener("click", api.signOut);
  byId("mobileAdminLogout").addEventListener("click", api.signOut);
  load().catch((error) => {
    api.toast("관리자 데이터를 불러오지 못했습니다.", true);
    document.querySelector(".member-content").innerHTML = `<div class="empty-box">${api.escapeHtml(error.message || "관리자 데이터를 불러오지 못했습니다.")}<br>Supabase 회원 포털 업데이트 SQL이 적용되었는지 확인해주세요.</div>`;
  });
})();
