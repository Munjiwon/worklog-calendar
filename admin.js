const userForm = document.querySelector("#userForm");
const userFormMessage = document.querySelector("#userFormMessage");
const userList = document.querySelector("#userList");
const newUsername = document.querySelector("#newUsername");
const newPassword = document.querySelector("#newPassword");
const newName = document.querySelector("#newName");
const newEmail = document.querySelector("#newEmail");
const newRole = document.querySelector("#newRole");
const editUserModal = document.querySelector("#editUserModal");
const editUserForm = document.querySelector("#editUserForm");
const editUserFormMessage = document.querySelector("#editUserFormMessage");
const closeEditUserModal = document.querySelector("#closeEditUserModal");
const editUsername = document.querySelector("#editUsername");
const editUsernameDisplay = document.querySelector("#editUsernameDisplay");
const editPassword = document.querySelector("#editPassword");
const editName = document.querySelector("#editName");
const editEmail = document.querySelector("#editEmail");
const editRole = document.querySelector("#editRole");

let users = [];

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

userList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-edit-user]");
  if (!button) return;
  const user = users.find((item) => item.username === button.dataset.editUser);
  if (user) openEditUserModal(user);
});

editUserForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setEditMessage("");

  const payload = {
    email: editEmail.value.trim(),
    name: editName.value.trim(),
    password: editPassword.value,
    role: editRole.value
  };

  const response = await fetch(`/api/users/${encodeURIComponent(editUsername.value)}`, {
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json"
    },
    method: "PUT"
  });
  const result = await response.json();

  if (!response.ok) {
    setEditMessage(result.error || "회원 정보를 수정할 수 없습니다.");
    return;
  }

  closeEditModal();
  await loadUsers();
});

closeEditUserModal.addEventListener("click", closeEditModal);
editUserModal.addEventListener("click", (event) => {
  if (event.target === editUserModal || event.target.closest("[data-edit-user-cancel]")) {
    closeEditModal();
  }
});

async function loadUsers() {
  const response = await fetch("/api/users");
  if (response.status === 401 || response.status === 403) {
    window.location.href = "/";
    return;
  }

  const result = await response.json();
  users = result.users || [];
  renderUsers(users);
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
      <div class="user-item-actions">
        <time>${formatDateTime(user.createdAt)}</time>
        <button type="button" class="action-button edit-button" data-edit-user="${escapeHtml(user.username)}">수정</button>
      </div>
    </article>
  `).join("");
}

function openEditUserModal(user) {
  setEditMessage("");
  editUsername.value = user.username;
  editUsernameDisplay.value = user.username;
  editPassword.value = "";
  editName.value = user.name || "";
  editEmail.value = user.email || "";
  editRole.value = user.role;
  editUserModal.classList.remove("hidden");
  editName.focus();
  editName.select();
}

function closeEditModal() {
  editUserModal.classList.add("hidden");
  editUserForm.reset();
  setEditMessage("");
}

function setMessage(message) {
  userFormMessage.textContent = message;
  userFormMessage.classList.toggle("hidden", !message);
}

function setEditMessage(message) {
  editUserFormMessage.textContent = message;
  editUserFormMessage.classList.toggle("hidden", !message);
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
