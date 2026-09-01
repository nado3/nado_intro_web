(() => {
  const api = window.NadoMember;
  const form = document.getElementById("memberLoginForm");
  const emailInput = document.getElementById("memberEmail");
  const passwordInput = document.getElementById("memberPassword");
  const errorNode = document.getElementById("loginError");
  const loginButton = document.getElementById("loginButton");
  const resetButton = document.getElementById("resetPasswordButton");

  function showError(message) { errorNode.textContent = message || ""; }
  function setBusy(busy, text = "로그인 중...") {
    loginButton.disabled = busy;
    loginButton.textContent = busy ? text : "로그인";
  }

  async function routeExistingSession() {
    if (!api.configured) return showError("로그인 설정을 불러오지 못했습니다. 운영팀에 문의해주세요.");
    const session = await api.getSession();
    if (!session) return;
    try {
      const profile = await api.getProfile(session.user.id);
      await api.goByRole(profile);
    } catch (_) {
      await api.client.auth.signOut({ scope: "local" });
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    showError("");
    if (!api.configured) return showError("로그인 설정을 불러오지 못했습니다.");
    setBusy(true);
    const { data, error } = await api.client.auth.signInWithPassword({
      email: emailInput.value.trim().toLowerCase(),
      password: passwordInput.value
    });
    if (error) {
      setBusy(false);
      return showError("이메일 또는 비밀번호를 확인해주세요. 초대받지 않은 이메일은 로그인할 수 없습니다.");
    }
    try {
      const profile = await api.getProfile(data.user.id);
      await api.goByRole(profile);
    } catch (error) {
      await api.client.auth.signOut({ scope: "local" });
      setBusy(false);
      showError(error.message || "이 계정으로는 학생 포털을 이용할 수 없습니다.");
    }
  });

  resetButton.addEventListener("click", async () => {
    const email = emailInput.value.trim().toLowerCase();
    if (!email) {
      emailInput.focus();
      return showError("먼저 초대받은 이메일을 입력해주세요.");
    }
    resetButton.disabled = true;
    const redirectTo = new URL("member-welcome.html?mode=reset", window.location.href).href;
    const { error } = await api.client.auth.resetPasswordForEmail(email, { redirectTo });
    resetButton.disabled = false;
    if (error) return showError("재설정 이메일을 보내지 못했습니다. 운영팀에 문의해주세요.");
    api.toast("계정이 존재하는 경우 비밀번호 재설정 이메일이 발송됩니다.");
  });

  const params = new URLSearchParams(window.location.search);
  if (params.get("error") === "access") showError("현재 이 계정은 학생 포털을 이용할 수 없습니다.");
  routeExistingSession().catch(() => {});
})();
