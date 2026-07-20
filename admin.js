const userForm = document.querySelector("#userForm");
const userFormMessage = document.querySelector("#userFormMessage");
const userList = document.querySelector("#userList");
const newUsername = document.querySelector("#newUsername");
const newPassword = document.querySelector("#newPassword");
const newName = document.querySelector("#newName");
const newEmail = document.querySelector("#newEmail");
const newRole = document.querySelector("#newRole");

loadUsers();

userForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setMessage("");

  const payload = {
    email: newEmail.value.trim(),
    name: newName.value.trim(),
    password: newPassword.value,
    role: newRole.value,
    username: newUsername.value.trim()
  };

  const response = await fetch("/api/users", {
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json"
    },
    method: "POST"
  });
  const result = await response.json();

  if (!response.ok) {
    setMessage(result.error || "계정을 만들 수 없습니다.");
    return;
  }

  userForm.reset();
  newRole.value = "user";
  await loadUsers();
});

async function loadUsers() {
  const response = await fetch("/api/users");
  if (response.status === 401 || response.status === 403) {
    window.location.href = "/";
    return;
  }

  const result = await response.json();
  renderUsers(result.users || []);
}

function renderUsers(users) {
  if (users.length === 0) {
    userList.innerHTML = '<div class="empty-state compact">등록된 계정이 없습니다.</div>';
    return;
  }

  userList.innerHTML = users.map((user) => `
    <article class="user-item">
      <div>
        <strong>${escapeHtml(user.username)}</strong>
        <span>${escapeHtml(user.name || "-")} · ${escapeHtml(user.email || "-")} · ${formatRole(user.role)}</span>
      </div>
      <time>${formatDateTime(user.createdAt)}</time>
    </article>
  `).join("");
}

function setMessage(message) {
  userFormMessage.textContent = message;
  userFormMessage.classList.toggle("hidden", !message);
}

function formatRole(role) {
  return role === "admin" ? "관리자" : "일반";
}

function formatDateTime(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
