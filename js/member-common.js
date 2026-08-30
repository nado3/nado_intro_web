(() => {
  const config = window.NADO_MEMBER_CONFIG || {};
  const configured = Boolean(config.SUPABASE_URL && config.SUPABASE_ANON_KEY && window.supabase);
  const client = configured
    ? window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      })
    : null;

  const escapeHtml = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  function toast(message, isError = false) {
    let node = document.getElementById("memberToast");
    if (!node) {
      node = document.createElement("div");
      node.id = "memberToast";
      node.className = "member-toast";
      document.body.appendChild(node);
    }
    node.textContent = message;
    node.classList.toggle("error", isError);
    node.classList.add("show");
    window.clearTimeout(toast.timer);
    toast.timer = window.setTimeout(() => node.classList.remove("show"), 3600);
  }

  async function getSession() {
    if (!client) return null;
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    return data.session;
  }

  async function getProfile(userId) {
    const { data, error } = await client.from("profiles").select("*").eq("id", userId).maybeSingle();
    if (error) throw error;
    return data;
  }

  function isProfileEnabled(profile) {
    return !profile?.account_status || ["active", "invited"].includes(profile.account_status);
  }

  async function goByRole(profile) {
    if (!profile) throw new Error("사용자 프로필을 찾지 못했습니다.");
    if (!isProfileEnabled(profile)) throw new Error("현재 이용이 정지되었거나 종료된 계정입니다.");
    if (profile.role === "admin") return window.location.replace("admin-portal.html");
    if (profile.role === "teacher") return window.location.replace(config.TEACHERS_SITE_URL || "../teachers/index.html");
    if (profile.role === "student") return window.location.replace("member.html");
    throw new Error("허용되지 않은 계정 유형입니다.");
  }

  async function requireRole(roles) {
    const session = await getSession();
    if (!session) {
      window.location.replace("login.html");
      return null;
    }
    const profile = await getProfile(session.user.id);
    if (!profile || !roles.includes(profile.role) || !isProfileEnabled(profile)) {
      await client.auth.signOut({ scope: "local" });
      window.location.replace("login.html?error=access");
      return null;
    }
    return { session, profile };
  }

  async function signOut() {
    if (client) await client.auth.signOut({ scope: "local" });
    window.location.replace("login.html");
  }

  const planLabel = (plan) => ({ economy: "이코노미", standard: "스탠다드", premium: "프리미엄" }[plan] || "미지정");
  const statusLabel = (status) => ({ active: "이용 중", invited: "초대 발송", suspended: "일시 정지", expired: "이용 종료", ended: "배정 종료" }[status] || status || "-");
  const formatDate = (value) => value ? new Date(`${value}T00:00:00`).toLocaleDateString("ko-KR") : "-";
  const formatDateTime = (value) => value ? new Date(value).toLocaleString("ko-KR") : "-";
  const formatBytes = (bytes) => {
    const number = Number(bytes || 0);
    if (number < 1024) return `${number} B`;
    if (number < 1024 ** 2) return `${(number / 1024).toFixed(1)} KB`;
    return `${(number / 1024 ** 2).toFixed(1)} MB`;
  };

  window.NadoMember = {
    config, client, configured, escapeHtml, toast, getSession, getProfile,
    goByRole, requireRole, signOut, planLabel, statusLabel, formatDate, formatDateTime, formatBytes
  };
})();
