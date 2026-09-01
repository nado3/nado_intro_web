(() => {
  const api = window.NadoMember;
  const form = document.getElementById("passwordSetupForm");
  const password = document.getElementById("newPassword");
  const confirmPassword = document.getElementById("confirmPassword");
  const errorNode = document.getElementById("setupError");
  const button = document.getElementById("setupButton");

  function showError(message) { errorNode.textContent = message || ""; }

  async function verifyInvite() {
    const session = await api.getSession();
    if (!session) {
      form.classList.add("hidden");
      document.getElementById("welcomeDescription").textContent = "초대 링크가 만료되었거나 올바르지 않습니다. NADO 운영팀에 초대 재발송을 요청해주세요.";
      showError("유효한 초대 세션을 찾지 못했습니다.");
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    showError("");
    if (password.value.length < 8) return showError("비밀번호는 8자 이상이어야 합니다.");
    if (password.value !== confirmPassword.value) return showError("비밀번호가 서로 일치하지 않습니다.");
    button.disabled = true;
    button.textContent = "설정 중...";
    const { data, error } = await api.client.auth.updateUser({ password: password.value });
    if (error) {
      button.disabled = false;
      button.textContent = "계정 설정 완료";
      return showError("비밀번호를 설정하지 못했습니다. 초대 링크를 다시 열어주세요.");
    }
    try {
      const profile = await api.getProfile(data.user.id);
      api.toast("계정 설정이 완료되었습니다.");
      window.setTimeout(() => api.goByRole(profile), 500);
    } catch (routeError) {
      showError(routeError.message || "계정 정보를 확인하지 못했습니다.");
    }
  });

  verifyInvite().catch(() => showError("초대 정보를 확인하지 못했습니다."));
})();
