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
const accountGreeting = document.querySelector("#accountGreeting");
const accountName = document.querySelector("#accountName");
const semesterForm = document.querySelector("#semesterForm");
const semesterFormMessage = document.querySelector("#semesterFormMessage");
const semesterName = document.querySelector("#semesterName");
const semesterStartDate = document.querySelector("#semesterStartDate");
const semesterEndDate = document.querySelector("#semesterEndDate");
const semesterId = document.querySelector("#semesterId");
const semesterSubmit = document.querySelector("#semesterSubmit");
const cancelSemesterEdit = document.querySelector("#cancelSemesterEdit");
const semesterList = document.querySelector("#semesterList");
const semesterListToggle = document.querySelector("#semesterListToggle");

let users = [];
let semesters = [];

initializeAdmin();

async function initializeAdmin() {
  const response = await fetch("/api/session", {
    headers: {
      Accept: "application/json"
    }
  });
  if (!response.ok) {
    window.location.href = "/login";
    return;
  }

  const session = await response.json();
  accountName.textContent = session.name || session.username;
  accountGreeting.hidden = false;
  await Promise.all([loadUsers(), loadSemesters()]);
}

semesterForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setSemesterMessage("");

  const editingId = semesterId.value;
  const response = await fetch(editingId ? `/api/semesters/${encodeURIComponent(editingId)}` : "/api/semesters", {
    body: JSON.stringify({
      endDate: semesterEndDate.value,
      name: semesterName.value.trim(),
      startDate: semesterStartDate.value
    }),
    headers: {
      "Content-Type": "application/json"
    },
    method: editingId ? "PUT" : "POST"
  });
  const result = await response.json();
  if (!response.ok) {
    setSemesterMessage(result.error || "학기를 저장할 수 없습니다.", true);
    return;
  }

  resetSemesterForm();
  setSemesterMessage(editingId ? "학기를 수정했습니다." : "학기를 추가했습니다.");
  await loadSemesters();
  setSemesterListExpanded(true);
});

cancelSemesterEdit.addEventListener("click", resetSemesterForm);

semesterListToggle.addEventListener("click", () => {
  setSemesterListExpanded(semesterListToggle.getAttribute("aria-expanded") !== "true");
});

semesterList.addEventListener("click", async (event) => {
  const deleteButton = event.target.closest("[data-delete-semester]");
  if (deleteButton) {
    const semester = semesters.find((item) => item.id === deleteButton.dataset.deleteSemester);
    if (!semester) return;
    if (!confirm(`${semester.name}을(를) 삭제할까요?\n\n이 학기에 연결된 모든 사용자의 수업 시간표도 함께 삭제됩니다.`)) return;
    const response = await fetch(`/api/semesters/${encodeURIComponent(semester.id)}`, { method: "DELETE" });
    const result = await response.json();
    if (!response.ok) {
      setSemesterMessage(result.error || "학기를 삭제할 수 없습니다.", true);
      return;
    }
    if (semesterId.value === semester.id) resetSemesterForm();
    await loadSemesters();
    setSemesterListExpanded(true);
    setSemesterMessage(`${semester.name}을(를) 삭제했습니다. 연결된 수업 ${result.removedTimetableEntries || 0}개도 정리했습니다.`);
    return;
  }

  const button = event.target.closest("[data-edit-semester]");
  if (!button) return;
  const semester = semesters.find((item) => item.id === button.dataset.editSemester);
  if (!semester) return;
  semesterId.value = semester.id;
  semesterName.value = semester.name;
  semesterStartDate.value = semester.startDate;
  semesterEndDate.value = semester.endDate;
  semesterSubmit.textContent = "학기 수정";
  cancelSemesterEdit.classList.remove("hidden");
  semesterName.focus();
});

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

async function loadSemesters() {
  const response = await fetch("/api/semesters");
  if (!response.ok) {
    setSemesterMessage("학기 목록을 불러올 수 없습니다.", true);
    return;
  }
  const result = await response.json();
  semesters = result.semesters || [];
  renderSemesters();
}

function resetSemesterForm() {
  semesterForm.reset();
  semesterId.value = "";
  semesterSubmit.textContent = "학기 추가";
  cancelSemesterEdit.classList.add("hidden");
}

function renderSemesters() {
  updateSemesterListToggle();
  if (semesters.length === 0) {
    semesterList.innerHTML = '<div class="empty-state compact">등록된 학기가 없습니다.</div>';
    return;
  }
  semesterList.innerHTML = semesters.map((semester) => `
    <article class="semester-item">
      <div>
        <strong>${escapeHtml(semester.name)}</strong>
        <span>${formatDate(semester.startDate)} - ${formatDate(semester.endDate)}</span>
      </div>
      <div class="item-actions">
        <button type="button" class="action-button edit-button" data-edit-semester="${escapeHtml(semester.id)}">수정</button>
        <button type="button" class="action-button delete-button" data-delete-semester="${escapeHtml(semester.id)}">삭제</button>
      </div>
    </article>
  `).join("");
}

function setSemesterListExpanded(expanded) {
  semesterListToggle.setAttribute("aria-expanded", String(expanded));
  semesterList.classList.toggle("hidden", !expanded);
  updateSemesterListToggle();
}

function updateSemesterListToggle() {
  const expanded = semesterListToggle.getAttribute("aria-expanded") === "true";
  semesterListToggle.textContent = `학기 목록 ${semesters.length}개 ${expanded ? "접기" : "펼치기"}`;
}

function setSemesterMessage(message, isError = false) {
  semesterFormMessage.textContent = message;
  semesterFormMessage.classList.toggle("hidden", !message);
  semesterFormMessage.classList.toggle("error", isError);
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
        <div class="user-item-times">
          <span>가입 ${formatDateTime(user.createdAt)}</span>
          <span>마지막 접속 ${formatDateTime(user.lastAccessAt, "기록 없음")}</span>
        </div>
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

function formatDateTime(value, fallback = "-") {
  if (!value) return fallback;
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatDate(value) {
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(new Date(`${value}T00:00:00`));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
