const MINUTES_IN_DAY = 24 * 60;
const VIEW_START_MINUTES = 9 * 60;
const VIEW_END_MINUTES = MINUTES_IN_DAY;
const HOUR_HEIGHT = 36;
const TIME_AXIS_PADDING = 12;
const SNAP_MINUTES = 60;
const TIME_LABEL_WIDTH = 42;
const CALENDAR_RIGHT_PADDING = 8;
const STORAGE_KEY = "worklog-calendar-prototype-shifts";
const WEEK_CLIPBOARD_KEY = "worklog-calendar-prototype-week-clipboard";
const TAG_COLORS_KEY = "worklog-calendar-prototype-tag-colors";
const HOLIDAYS_KEY = "worklog-calendar-prototype-holidays";
const TAG_TARGETS_KEY = "worklog-calendar-prototype-tag-targets";
const TAG_MEALS_KEY = "worklog-calendar-prototype-tag-meals";
const LEGACY_MIGRATION_KEY = "worklog-calendar-prototype-legacy-migrated-to-user";
const DEFAULT_TAG = "미지정";
const dayNames = ["월", "화", "수", "목", "금", "토", "일"];
const MEAL_WINDOWS = [
  { label: "점심", start: 12 * 60, end: 13 * 60 },
  { label: "저녁", start: 18 * 60, end: 19 * 60 }
];
const TAG_PALETTE = [
  { bg: "#d9f4ed", border: "#008f7a", text: "#063f36" },
  { bg: "#dbeafe", border: "#2563eb", text: "#173b86" },
  { bg: "#fdecc8", border: "#c47b00", text: "#664100" },
  { bg: "#fce7f3", border: "#db2777", text: "#831843" },
  { bg: "#e9d5ff", border: "#9333ea", text: "#581c87" },
  { bg: "#dcfce7", border: "#16a34a", text: "#14532d" },
  { bg: "#fee2e2", border: "#dc2626", text: "#7f1d1d" },
  { bg: "#e0f2fe", border: "#0284c7", text: "#075985" }
];

const calendar = document.querySelector("#calendar");
const shiftList = document.querySelector("#shiftList");
const template = document.querySelector("#shiftItemTemplate");
const weekLabel = document.querySelector("#weekLabel");
const totalNet = document.querySelector("#totalNet");
const totalMeal = document.querySelector("#totalMeal");
const overlapCount = document.querySelector("#overlapCount");
const shiftCount = document.querySelector("#shiftCount");
const monthSummary = document.querySelector("#monthSummary");
const mealSettings = document.querySelector("#mealSettings");
const tagSummary = document.querySelector("#tagSummary");
const createShift = document.querySelector("#createShift");
const clearAll = document.querySelector("#clearAll");
const adminLink = document.querySelector("#adminLink");
const prevWeek = document.querySelector("#prevWeek");
const nextWeek = document.querySelector("#nextWeek");
const todayWeek = document.querySelector("#todayWeek");
const copyWeek = document.querySelector("#copyWeek");
const pasteWeek = document.querySelector("#pasteWeek");
const copyTagsNextWeek = document.querySelector("#copyTagsNextWeek");
const prevMonth = document.querySelector("#prevMonth");
const nextMonth = document.querySelector("#nextMonth");
const thisMonth = document.querySelector("#thisMonth");
const monthCalendar = document.querySelector("#monthCalendar");
const monthCalendarLabel = document.querySelector("#monthCalendarLabel");
const editModal = document.querySelector("#editModal");
const editForm = document.querySelector("#editForm");
const closeEditModal = document.querySelector("#closeEditModal");
const editModalTitle = document.querySelector("#editModalTitle");
const copyModal = document.querySelector("#copyModal");
const copyForm = document.querySelector("#copyForm");
const closeCopyModal = document.querySelector("#closeCopyModal");
const tagCopyModal = document.querySelector("#tagCopyModal");
const tagCopyForm = document.querySelector("#tagCopyForm");
const closeTagCopyModal = document.querySelector("#closeTagCopyModal");
const copyTagChoices = document.querySelector("#copyTagChoices");
const selectAllCopyTags = document.querySelector("#selectAllCopyTags");
const editId = document.querySelector("#editId");
const editTitle = document.querySelector("#editTitle");
const editTag = document.querySelector("#editTag");
const editTagChoices = document.querySelector("#editTagChoices");
const editTagPalette = document.querySelector("#editTagPalette");
const editDate = document.querySelector("#editDate");
const editStart = document.querySelector("#editStart");
const editEnd = document.querySelector("#editEnd");
const copyId = document.querySelector("#copyId");
const copyDate = document.querySelector("#copyDate");
const copySummary = document.querySelector("#copySummary");

let currentWeekStart = startOfWeek(new Date());
let currentMonthStart = startOfMonth(currentWeekStart);
let storageKeys = makeStorageKeys("anonymous");
let currentSession = null;
let shifts = [];
let tagColors = {};
let holidays = new Set();
let tagTargetMinutes = {};
let tagMealSettings = {};
let draggingShiftId = null;
let creatingShift = null;
let resizingShift = null;
let monthDraggingShift = null;
let suppressMonthShiftClick = false;
let selectedShiftId = null;
let calendarDataSaveTimer = null;
const collapsedTags = new Set();

initializeApp();

createShift.addEventListener("click", () => {
  openCreateModal();
});

clearAll.addEventListener("click", () => {
  const weekShifts = getWeekShifts(currentWeekStart);
  if (weekShifts.length === 0) {
    alert("이번 주에 삭제할 일정이 없습니다.");
    return;
  }
  if (!confirm("현재 보고 있는 주차의 근무 일정만 삭제할까요?")) return;
  const weekIds = new Set(weekShifts.map((shift) => shift.id));
  shifts = shifts.filter((shift) => !weekIds.has(shift.id));
  if (selectedShiftId && weekIds.has(selectedShiftId)) selectedShiftId = null;
  saveShifts();
  render();
});

prevWeek.addEventListener("click", () => {
  currentWeekStart = addDays(currentWeekStart, -7);
  currentMonthStart = startOfMonth(currentWeekStart);
  render();
});

nextWeek.addEventListener("click", () => {
  currentWeekStart = addDays(currentWeekStart, 7);
  currentMonthStart = startOfMonth(currentWeekStart);
  render();
});

todayWeek.addEventListener("click", () => {
  const today = new Date();
  currentWeekStart = startOfWeek(today);
  currentMonthStart = startOfMonth(today);
  render();
});

prevMonth.addEventListener("click", () => {
  currentMonthStart = addMonths(currentMonthStart, -1);
  render();
});

nextMonth.addEventListener("click", () => {
  currentMonthStart = addMonths(currentMonthStart, 1);
  render();
});

thisMonth.addEventListener("click", () => {
  const today = new Date();
  currentWeekStart = startOfWeek(today);
  currentMonthStart = startOfMonth(today);
  render();
});

copyWeek.addEventListener("click", () => {
  const weekShifts = getWeekShifts(currentWeekStart);
  if (weekShifts.length === 0) {
    alert("복사할 주간 일정이 없습니다.");
    return;
  }

  const copied = weekShifts.map((shift) => ({
    title: shift.title,
    tag: getShiftTag(shift),
    dayOffset: getDayDiff(parseISODate(shift.date), currentWeekStart),
    start: shift.start,
    end: shift.end
  }));
  setWeekClipboard(copied);
  render();
  alert(`${copied.length}건의 주간 일정을 복사했습니다.`);
});

pasteWeek.addEventListener("click", () => {
  const copied = loadWeekClipboard();
  if (copied.length === 0) {
    alert("붙여넣을 주간 일정이 없습니다. 먼저 주간 복사를 해주세요.");
    return;
  }

  const pasted = copied.map((item) => makeShift(
    item.title,
    normalizeTag(item.tag),
    toISODate(addDays(currentWeekStart, item.dayOffset)),
    item.start,
    item.end
  ));
  shifts = [...shifts, ...pasted];
  selectedShiftId = null;
  saveShifts();
  render();
});

copyTagsNextWeek.addEventListener("click", openTagCopyModal);

calendar.addEventListener("click", (event) => {
  const button = event.target.closest("[data-holiday-toggle]");
  if (!button) return;
  const date = button.dataset.holidayToggle;
  if (holidays.has(date)) {
    holidays.delete(date);
  } else {
    holidays.add(date);
  }
  saveHolidays();
  render();
});

monthCalendar.addEventListener("click", (event) => {
  const chip = event.target.closest(".month-shift-chip");
  if (chip) {
    if (suppressMonthShiftClick) {
      suppressMonthShiftClick = false;
      return;
    }
    const shift = shifts.find((item) => item.id === chip.dataset.id);
    if (shift) openEditModal(shift);
    return;
  }
  const day = event.target.closest("[data-month-date]");
  if (!day) return;
  const date = parseISODate(day.dataset.monthDate);
  currentWeekStart = startOfWeek(date);
  currentMonthStart = startOfMonth(date);
  render();
});

monthCalendar.addEventListener("mousedown", (event) => {
  const chip = event.target.closest(".month-shift-chip");
  if (!chip) return;
  const shift = shifts.find((item) => item.id === chip.dataset.id);
  if (!shift || isHoliday(shift.date)) {
    event.preventDefault();
    return;
  }

  event.preventDefault();
  monthDraggingShift = {
    hasMoved: false,
    id: shift.id,
    startX: event.clientX,
    startY: event.clientY
  };
  selectedShiftId = shift.id;
  chip.classList.add("dragging");
});

shiftList.addEventListener("click", (event) => {
  const toggle = event.target.closest("[data-tag-toggle]");
  if (toggle) {
    const tag = toggle.dataset.tagToggle;
    if (collapsedTags.has(tag)) {
      collapsedTags.delete(tag);
    } else {
      collapsedTags.add(tag);
    }
    render();
    return;
  }

  const button = event.target.closest("[data-action]");
  if (!button) return;
  const shift = shifts.find((item) => item.id === button.dataset.id);
  if (!shift) return;

  if (button.dataset.action === "delete") {
    shifts = shifts.filter((item) => item.id !== button.dataset.id);
    if (selectedShiftId === button.dataset.id) selectedShiftId = null;
  }

  if (button.dataset.action === "edit") {
    openEditModal(shift);
    return;
  }

  if (button.dataset.action === "copy") {
    openCopyModal(shift);
    return;
  }

  saveShifts();
  render();
});

editForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const id = editId.value;
  const title = editTitle.value.trim();
  const tag = normalizeTag(editTag.value);
  const date = editDate.value;
  const start = editStart.value;
  const end = editEnd.value;

  if (timeToMinutes(end) <= timeToMinutes(start)) {
    alert("종료 시간은 시작 시간보다 늦어야 합니다.");
    return;
  }

  ensureTagColor(tag);
  if (id) {
    shifts = shifts.map((shift) => (
      shift.id === id ? { ...shift, title, tag, date, start, end } : shift
    ));
    selectedShiftId = id;
  } else {
    const shift = makeShift(title, tag, date, start, end);
    shifts.push(shift);
    selectedShiftId = shift.id;
  }
  currentWeekStart = startOfWeek(parseISODate(date));
  currentMonthStart = startOfMonth(parseISODate(date));
  saveTagColors();
  saveShifts();
  closeModal();
  render();
});

closeEditModal.addEventListener("click", closeModal);
editModal.addEventListener("click", (event) => {
  if (event.target === editModal || event.target.closest("[data-modal-cancel]")) {
    closeModal();
  }
});

copyForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const shift = shifts.find((item) => item.id === copyId.value);
  if (!shift || !copyDate.value) return;
  const copied = makeShift(`${shift.title} 복사`, getShiftTag(shift), copyDate.value, shift.start, shift.end);
  shifts.push(copied);
  selectedShiftId = copied.id;
  currentWeekStart = startOfWeek(parseISODate(copied.date));
  currentMonthStart = startOfMonth(parseISODate(copied.date));
  saveShifts();
  closeCopyModalDialog();
  render();
});

closeCopyModal.addEventListener("click", closeCopyModalDialog);
copyModal.addEventListener("click", (event) => {
  if (event.target === copyModal || event.target.closest("[data-copy-cancel]")) {
    closeCopyModalDialog();
  }
});

closeTagCopyModal.addEventListener("click", closeTagCopyModalDialog);
tagCopyModal.addEventListener("click", (event) => {
  if (event.target === tagCopyModal || event.target.closest("[data-tag-copy-cancel]")) {
    closeTagCopyModalDialog();
  }
});

selectAllCopyTags.addEventListener("click", () => {
  copyTagChoices.querySelectorAll("input[type='checkbox']").forEach((input) => {
    input.checked = true;
  });
});

tagCopyForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const selectedTags = new Set(
    [...copyTagChoices.querySelectorAll("input:checked")].map((input) => normalizeTag(input.value))
  );

  if (selectedTags.size === 0) {
    alert("다음 주로 복사할 태그를 하나 이상 선택해주세요.");
    return;
  }

  const weekShifts = getWeekShifts(currentWeekStart);
  const copied = weekShifts
    .filter((shift) => selectedTags.has(getShiftTag(shift)))
    .map((shift) => makeShift(
      shift.title,
      getShiftTag(shift),
      toISODate(addDays(parseISODate(shift.date), 7)),
      shift.start,
      shift.end
    ));

  if (copied.length === 0) {
    alert("선택한 태그에 해당하는 이번 주 일정이 없습니다.");
    return;
  }

  shifts = [...shifts, ...copied];
  selectedShiftId = null;
  saveShifts();
  closeTagCopyModalDialog();
  currentWeekStart = addDays(currentWeekStart, 7);
  currentMonthStart = startOfMonth(currentWeekStart);
  render();
  alert(`${copied.length}건의 일정을 다음 주로 복사했습니다.`);
});

editTag.addEventListener("input", () => renderTagControls());
editTag.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  const tag = normalizeTag(editTag.value);
  ensureTagColor(tag);
  saveTagColors();
  renderTagControls();
});
editTagChoices.addEventListener("click", handleTagChoiceClick);
editTagPalette.addEventListener("click", handlePaletteClick);

monthSummary.addEventListener("change", (event) => {
  const input = event.target.closest("[data-tag-target]");
  if (!input) return;
  const tag = normalizeTag(input.dataset.tagTarget);
  tagTargetMinutes[tag] = Math.max(0, Number(input.value || 0)) * 60;
  saveTagTargetMinutes();
  renderMonthSummary(currentWeekStart);
});

mealSettings.addEventListener("change", (event) => {
  const input = event.target.closest("[data-meal-tag]");
  if (!input) return;
  const tag = normalizeTag(input.dataset.mealTag);
  const meal = input.dataset.mealName;
  const edge = input.dataset.mealEdge;
  const settings = getTagMealSetting(tag);
  settings[meal][edge] = timeToMinutes(input.value);
  tagMealSettings[tag] = settings;
  saveTagMealSettings();
  render();
});

shiftList.addEventListener("dblclick", (event) => {
  const title = event.target.closest(".item-title");
  if (!title) return;
  startTitleEdit(title);
});

calendar.addEventListener("click", (event) => {
  const block = event.target.closest(".shift-block");
  if (!block) return;
  if (event.target.closest(".resize-handle")) return;
  selectedShiftId = block.dataset.id;
  render();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !editModal.classList.contains("hidden")) {
    closeModal();
    return;
  }
  if (event.key === "Escape" && !copyModal.classList.contains("hidden")) {
    closeCopyModalDialog();
    return;
  }
  if (event.key === "Escape" && !tagCopyModal.classList.contains("hidden")) {
    closeTagCopyModalDialog();
    return;
  }
  if (!editModal.classList.contains("hidden") || !copyModal.classList.contains("hidden") || !tagCopyModal.classList.contains("hidden")) return;
  if (event.key !== "Delete" || !selectedShiftId) return;
  if (isEditableElement(event.target)) return;

  const selected = shifts.find((shift) => shift.id === selectedShiftId);
  if (!selected) {
    selectedShiftId = null;
    return;
  }

  shifts = shifts.filter((shift) => shift.id !== selectedShiftId);
  selectedShiftId = null;
  saveShifts();
  render();
});

calendar.addEventListener("dragstart", (event) => {
  const block = event.target.closest(".shift-block");
  if (!block) return;
  if (event.target.closest(".resize-handle")) {
    event.preventDefault();
    return;
  }
  draggingShiftId = block.dataset.id;
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", block.dataset.id);
  block.classList.add("dragging");
});

calendar.addEventListener("dragend", (event) => {
  event.target.closest(".shift-block")?.classList.remove("dragging");
  draggingShiftId = null;
  clearDropPreview();
});

calendar.addEventListener("dragover", (event) => {
  const body = event.target.closest(".day-body");
  if (!body) return;
  event.preventDefault();
  if (isHoliday(body.dataset.date)) {
    clearDropPreview();
    return;
  }
  event.dataTransfer.dropEffect = "move";
  const shift = shifts.find((item) => item.id === draggingShiftId);
  if (!shift) return;
  const target = getDropTarget(body, event.clientY, shift);
  showDropPreview(body, target);
});

calendar.addEventListener("dragleave", (event) => {
  const body = event.target.closest(".day-body");
  if (!body || body.contains(event.relatedTarget)) return;
  body.classList.remove("drop-target");
  body.querySelector(".drop-preview")?.remove();
});

calendar.addEventListener("drop", (event) => {
  const body = event.target.closest(".day-body");
  if (!body) return;
  event.preventDefault();
  if (isHoliday(body.dataset.date)) {
    clearDropPreview();
    return;
  }

  const id = event.dataTransfer.getData("text/plain");
  const shift = shifts.find((item) => item.id === id);
  if (!shift) return;

  const target = getDropTarget(body, event.clientY, shift);
  clearDropPreview();

  shifts = shifts.map((item) => (
    item.id === id
      ? { ...item, date: body.dataset.date, start: minutesToTime(target.start), end: minutesToTime(target.end) }
      : item
  ));
  saveShifts();
  render();
});

calendar.addEventListener("mousedown", (event) => {
  const handle = event.target.closest(".resize-handle");
  if (handle) {
    const block = handle.closest(".shift-block");
    const shift = shifts.find((item) => item.id === block?.dataset.id);
    if (!shift || isHoliday(shift.date)) return;
    event.preventDefault();
    selectedShiftId = shift.id;
    resizingShift = {
      id: shift.id,
      edge: handle.dataset.edge,
      originalStart: timeToMinutes(shift.start),
      originalEnd: timeToMinutes(shift.end)
    };
    render();
    return;
  }

  const body = event.target.closest(".day-body");
  if (!body || event.button !== 0 || event.target.closest(".shift-block")) return;
  if (isHoliday(body.dataset.date)) return;

  const start = getSnappedTimeFromClientY(body, event.clientY);
  if (isTimeRangeOccupied(body.dataset.date, start, Math.min(start + SNAP_MINUTES, VIEW_END_MINUTES))) return;

  event.preventDefault();
  creatingShift = {
    body,
    date: body.dataset.date,
    start,
    end: Math.min(start + SNAP_MINUTES, VIEW_END_MINUTES),
    hasDragged: false
  };
});

window.addEventListener("mousemove", (event) => {
  if (monthDraggingShift) {
    const distance = Math.hypot(event.clientX - monthDraggingShift.startX, event.clientY - monthDraggingShift.startY);
    if (distance < 5 && !monthDraggingShift.hasMoved) return;
    monthDraggingShift.hasMoved = true;
    updateMonthDragTarget(event.clientX, event.clientY);
    return;
  }
  if (resizingShift) {
    resizeSelectedShift(event.clientY);
    return;
  }
  if (!creatingShift) return;
  const current = getSnappedTimeFromClientY(creatingShift.body, event.clientY);
  if (current === creatingShift.start && !creatingShift.hasDragged) return;
  creatingShift.hasDragged = true;
  const start = Math.min(creatingShift.start, current);
  const end = Math.max(creatingShift.start + SNAP_MINUTES, current);
  creatingShift.previewStart = clamp(start, VIEW_START_MINUTES, VIEW_END_MINUTES - SNAP_MINUTES);
  creatingShift.previewEnd = clamp(end, creatingShift.previewStart + SNAP_MINUTES, VIEW_END_MINUTES);
  showCreatePreview(creatingShift);
});

window.addEventListener("mouseup", () => {
  if (monthDraggingShift) {
    finishMonthDrag();
    return;
  }
  if (resizingShift) {
    resizingShift = null;
    saveShifts();
    render();
    return;
  }
  if (!creatingShift) return;
  if (!creatingShift.hasDragged) {
    creatingShift = null;
    clearCreatePreview();
    return;
  }
  const start = creatingShift.previewStart ?? creatingShift.start;
  const end = creatingShift.previewEnd ?? creatingShift.end;
  const title = "새 근무";
  const tag = DEFAULT_TAG;

  ensureTagColor(tag);
  shifts.push(makeShift(title, tag, creatingShift.date, minutesToTime(start), minutesToTime(end)));
  selectedShiftId = shifts.at(-1).id;
  saveTagColors();
  saveShifts();
  creatingShift = null;
  clearCreatePreview();
  render();
});

async function initializeApp() {
  currentSession = await loadCurrentSession();
  if (!currentSession) {
    window.location.href = "/login";
    return;
  }

  storageKeys = makeStorageKeys(currentSession.username);
  updateToolbarForSession(currentSession);
  migrateLegacyStorage(currentSession);
  const serverRecord = await loadServerCalendarData();
  const localData = readLocalCalendarData();
  const initialData = serverRecord.exists ? serverRecord.data : localData;
  applyCalendarData(initialData);
  if (!serverRecord.exists && hasCalendarData(localData)) {
    queueCalendarDataSave();
  }
  selectedShiftId = null;
  ensureTagColor(DEFAULT_TAG);
  saveTagColors();
  render();
  renderTagControls();
}

async function loadCurrentSession() {
  try {
    const response = await fetch("/api/session", {
      headers: {
        Accept: "application/json"
      }
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

function updateToolbarForSession(session) {
  if (!adminLink) return;
  adminLink.hidden = session.role !== "admin";
}

async function loadServerCalendarData() {
  try {
    const response = await fetch("/api/calendar-data", {
      headers: {
        Accept: "application/json"
      }
    });
    if (!response.ok) return { data: getEmptyCalendarData(), exists: false };
    const result = await response.json();
    return {
      data: normalizeCalendarData(result.data),
      exists: Boolean(result.exists)
    };
  } catch {
    return { data: getEmptyCalendarData(), exists: false };
  }
}

function makeStorageKeys(username) {
  const userKey = encodeURIComponent(String(username || "anonymous").trim().toLowerCase());
  const prefix = `worklog-calendar-prototype:${userKey}`;
  return {
    holidays: `${prefix}:holidays`,
    shifts: `${prefix}:shifts`,
    tagColors: `${prefix}:tag-colors`,
    tagMeals: `${prefix}:tag-meals`,
    tagTargets: `${prefix}:tag-targets`,
    weekClipboard: `${prefix}:week-clipboard`
  };
}

function readLocalCalendarData() {
  return {
    holidays: loadJsonFromStorage(storageKeys.holidays, []),
    shifts: loadJsonFromStorage(storageKeys.shifts, []),
    tagColors: loadJsonFromStorage(storageKeys.tagColors, {}),
    tagMealSettings: loadJsonFromStorage(storageKeys.tagMeals, {}),
    tagTargetMinutes: loadJsonFromStorage(storageKeys.tagTargets, {}),
    weekClipboard: loadJsonFromStorage(storageKeys.weekClipboard, [])
  };
}

function applyCalendarData(data) {
  const normalized = normalizeCalendarData(data);
  shifts = normalized.shifts;
  tagColors = normalized.tagColors;
  holidays = new Set(normalized.holidays);
  tagTargetMinutes = normalized.tagTargetMinutes;
  tagMealSettings = normalized.tagMealSettings;
  writeLocalCalendarData(normalized);
}

function writeLocalCalendarData(data) {
  localStorage.setItem(storageKeys.holidays, JSON.stringify(data.holidays || []));
  localStorage.setItem(storageKeys.shifts, JSON.stringify(data.shifts || []));
  localStorage.setItem(storageKeys.tagColors, JSON.stringify(data.tagColors || {}));
  localStorage.setItem(storageKeys.tagMeals, JSON.stringify(data.tagMealSettings || {}));
  localStorage.setItem(storageKeys.tagTargets, JSON.stringify(data.tagTargetMinutes || {}));
  localStorage.setItem(storageKeys.weekClipboard, JSON.stringify(data.weekClipboard || []));
}

function getCurrentCalendarData() {
  return {
    holidays: [...holidays],
    shifts,
    tagColors,
    tagMealSettings,
    tagTargetMinutes,
    weekClipboard: loadWeekClipboard()
  };
}

function getEmptyCalendarData() {
  return {
    holidays: [],
    shifts: [],
    tagColors: {},
    tagMealSettings: {},
    tagTargetMinutes: {},
    weekClipboard: []
  };
}

function normalizeCalendarData(data) {
  const source = data && typeof data === "object" && !Array.isArray(data) ? data : {};
  return {
    holidays: Array.isArray(source.holidays) ? source.holidays : [],
    shifts: Array.isArray(source.shifts) ? source.shifts : [],
    tagColors: isPlainObject(source.tagColors) ? source.tagColors : {},
    tagMealSettings: isPlainObject(source.tagMealSettings) ? source.tagMealSettings : {},
    tagTargetMinutes: isPlainObject(source.tagTargetMinutes) ? source.tagTargetMinutes : {},
    weekClipboard: Array.isArray(source.weekClipboard) ? source.weekClipboard : []
  };
}

function hasCalendarData(data) {
  const normalized = normalizeCalendarData(data);
  return normalized.shifts.length > 0
    || normalized.holidays.length > 0
    || normalized.weekClipboard.length > 0
    || Object.keys(normalized.tagColors).length > 0
    || Object.keys(normalized.tagMealSettings).length > 0
    || Object.keys(normalized.tagTargetMinutes).length > 0;
}

function queueCalendarDataSave() {
  if (!currentSession) return;
  window.clearTimeout(calendarDataSaveTimer);
  calendarDataSaveTimer = window.setTimeout(saveCalendarDataNow, 350);
}

async function saveCalendarDataNow() {
  if (!currentSession) return;
  try {
    await fetch("/api/calendar-data", {
      body: JSON.stringify(getCurrentCalendarData()),
      headers: {
        "Content-Type": "application/json"
      },
      method: "PUT"
    });
  } catch {
    // Local storage keeps the user's changes until the next successful server save.
  }
}

function loadJsonFromStorage(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function isPlainObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function migrateLegacyStorage(session) {
  if (!session || session.role !== "admin") return;
  if (localStorage.getItem(LEGACY_MIGRATION_KEY)) return;

  copyLegacyStorageValue(STORAGE_KEY, storageKeys.shifts);
  copyLegacyStorageValue(TAG_COLORS_KEY, storageKeys.tagColors);
  copyLegacyStorageValue(HOLIDAYS_KEY, storageKeys.holidays);
  copyLegacyStorageValue(TAG_TARGETS_KEY, storageKeys.tagTargets);
  copyLegacyStorageValue(TAG_MEALS_KEY, storageKeys.tagMeals);
  copyLegacyStorageValue(WEEK_CLIPBOARD_KEY, storageKeys.weekClipboard);
  localStorage.setItem(LEGACY_MIGRATION_KEY, session.username);
}

function copyLegacyStorageValue(sourceKey, targetKey) {
  if (localStorage.getItem(targetKey) !== null) return;
  const value = localStorage.getItem(sourceKey);
  if (value !== null) {
    localStorage.setItem(targetKey, value);
  }
}

function render() {
  const weekEnd = addDays(currentWeekStart, 6);
  const weekShifts = getWeekShifts(currentWeekStart);
  const countedShifts = getCountedShifts(weekShifts);
  const overlapIds = getOverlapIds(countedShifts);

  weekLabel.textContent = `${formatDate(currentWeekStart)} - ${formatDate(weekEnd)}`;
  pasteWeek.disabled = loadWeekClipboard().length === 0;
  renderSummary(countedShifts, overlapIds);
  renderMealSettings();
  renderMonthSummary(currentWeekStart);
  renderTagSummary(countedShifts);
  renderShiftList(weekShifts, overlapIds);
  renderCalendar(weekShifts, overlapIds);
  renderMonthCalendar();
  renderTagControls();
}

function getWeekShifts(weekStart) {
  const weekEnd = addDays(weekStart, 6);
  return shifts
    .filter((shift) => shift.date >= toISODate(weekStart) && shift.date <= toISODate(weekEnd))
    .sort((a, b) => `${a.date} ${a.start}`.localeCompare(`${b.date} ${b.start}`));
}

function renderSummary(weekShifts, overlapIds) {
  const net = weekShifts.reduce((sum, shift) => sum + getNetMinutes(shift), 0);
  const meals = weekShifts.reduce((sum, shift) => sum + getMealDeductionMinutes(shift), 0);

  totalNet.textContent = formatDuration(net);
  totalMeal.textContent = formatDuration(meals);
  overlapCount.textContent = `${countOverlapPairs(weekShifts)}건`;
  shiftCount.textContent = `${weekShifts.length}건`;

  overlapCount.closest(".metric").classList.toggle("warning", overlapIds.size > 0);
}

function renderMealSettings() {
  mealSettings.innerHTML = "";
  const tags = getAppliedTags();

  if (tags.length === 0) {
    mealSettings.innerHTML = '<div class="empty-state compact">전체 근무에 적용된 태그가 없습니다.</div>';
    return;
  }

  tags.forEach((tag) => {
    const color = getTagColor(tag);
    const setting = getTagMealSetting(tag);
    const item = document.createElement("article");
    item.className = "meal-setting-item";
    item.innerHTML = `
      <span class="tag-pill" style="--tag-bg: ${color.bg}; --tag-border: ${color.border}; --tag-text: ${color.text};">${escapeHtml(tag)}</span>
      <label>점심 시작<input type="time" value="${minutesToTime(setting.lunch.start)}" data-meal-tag="${escapeHtml(tag)}" data-meal-name="lunch" data-meal-edge="start"></label>
      <label>점심 종료<input type="time" value="${minutesToTime(setting.lunch.end)}" data-meal-tag="${escapeHtml(tag)}" data-meal-name="lunch" data-meal-edge="end"></label>
      <label>저녁 시작<input type="time" value="${minutesToTime(setting.dinner.start)}" data-meal-tag="${escapeHtml(tag)}" data-meal-name="dinner" data-meal-edge="start"></label>
      <label>저녁 종료<input type="time" value="${minutesToTime(setting.dinner.end)}" data-meal-tag="${escapeHtml(tag)}" data-meal-name="dinner" data-meal-edge="end"></label>
    `;
    mealSettings.append(item);
  });
}

function getAppliedTags() {
  return [...new Set(shifts.map((shift) => getShiftTag(shift)))]
    .sort((a, b) => a.localeCompare(b, "ko-KR"));
}

function renderMonthSummary(weekStart) {
  monthSummary.innerHTML = "";
  const months = getMonthsInWeek(weekStart);

  months.forEach((monthKey) => {
    const monthShifts = shifts.filter((shift) => (
      shift.date.startsWith(monthKey)
      && !isHoliday(shift.date)
    ));
    const total = monthShifts.reduce((sum, shift) => sum + getNetMinutes(shift), 0);
    const tagTotals = getTagTotals(monthShifts);
    const item = document.createElement("article");
    item.className = "summary-item month-summary-item";
    item.innerHTML = `
      <div class="summary-main">
        <span>${formatMonthKey(monthKey)}</span>
        <strong>${formatDuration(total)}</strong>
      </div>
      <div class="month-tag-list"></div>
    `;
    const tagList = item.querySelector(".month-tag-list");
    tagTotals.forEach(([tag, minutes]) => {
      const color = getTagColor(tag);
      const target = getTagTargetMinutes(tag);
      const remaining = Math.max(0, target - minutes);
      const met = target > 0 && minutes >= target;
      const percent = target > 0 ? Math.min(100, Math.round((minutes / target) * 100)) : 0;
      const row = document.createElement("div");
      row.className = `month-tag-row${met ? " target-met" : ""}`;
      row.innerHTML = `
        <div class="month-tag-label">
          <span class="tag-pill" style="--tag-bg: ${color.bg}; --tag-border: ${color.border}; --tag-text: ${color.text};">${escapeHtml(tag)}</span>
          <strong>${formatDuration(minutes)}</strong>
        </div>
        <label class="tag-target-control">
          충족
          <input type="number" min="0" step="1" value="${target / 60}" data-tag-target="${escapeHtml(tag)}">
        </label>
        <div class="target-result">${target > 0 ? (met ? `부합 · ${percent}%` : `${percent}% · 부족 ${formatDuration(remaining)}`) : "기준 없음"}</div>
      `;
      tagList.append(row);
    });
    monthSummary.append(item);
  });
}

function getTagTotals(items) {
  const totals = new Map();
  items.forEach((shift) => {
    const tag = getShiftTag(shift);
    totals.set(tag, (totals.get(tag) || 0) + getNetMinutes(shift));
  });
  return [...totals.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ko-KR"));
}

function renderTagSummary(weekShifts) {
  tagSummary.innerHTML = "";
  const totals = new Map();

  weekShifts.forEach((shift) => {
    const tag = getShiftTag(shift);
    totals.set(tag, (totals.get(tag) || 0) + getNetMinutes(shift));
  });

  if (totals.size === 0) {
    tagSummary.innerHTML = '<div class="empty-state compact">태그별로 집계할 일정이 없습니다.</div>';
    return;
  }

  [...totals.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ko-KR"))
    .forEach(([tag, minutes]) => {
    const item = document.createElement("article");
      const color = getTagColor(tag);
      item.className = "summary-item";
      item.innerHTML = `
        <span class="tag-pill" style="--tag-bg: ${color.bg}; --tag-border: ${color.border}; --tag-text: ${color.text};">${escapeHtml(tag)}</span>
        <strong>${formatDuration(minutes)}</strong>
      `;
      tagSummary.append(item);
    });
}

function getMonthsInWeek(weekStart) {
  const months = new Set();
  for (let index = 0; index < 7; index += 1) {
    months.add(toISODate(addDays(weekStart, index)).slice(0, 7));
  }
  return [...months].sort();
}

function formatMonthKey(monthKey) {
  const [year, month] = monthKey.split("-");
  return `${year}년 ${Number(month)}월`;
}

function renderShiftList(weekShifts, overlapIds) {
  shiftList.innerHTML = "";

  if (weekShifts.length === 0) {
    shiftList.innerHTML = '<div class="empty-state">이번 주에 등록된 근무 일정이 없습니다.</div>';
    return;
  }

  const grouped = groupShiftsByTag(weekShifts);
  grouped.forEach(([tag, items]) => {
    const color = getTagColor(tag);
    const collapsed = collapsedTags.has(tag);
    const group = document.createElement("section");
    const toggle = document.createElement("button");
    const caret = document.createElement("span");
    const pill = document.createElement("span");
    const count = document.createElement("strong");
    group.className = "shift-group";
    toggle.type = "button";
    toggle.className = "shift-group-toggle";
    toggle.dataset.tagToggle = tag;
    toggle.style.setProperty("--tag-bg", color.bg);
    toggle.style.setProperty("--tag-border", color.border);
    toggle.style.setProperty("--tag-text", color.text);
    caret.className = "group-caret";
    caret.textContent = collapsed ? "▸" : "▾";
    pill.className = "tag-pill";
    pill.textContent = tag;
    pill.style.setProperty("--tag-bg", color.bg);
    pill.style.setProperty("--tag-border", color.border);
    pill.style.setProperty("--tag-text", color.text);
    count.textContent = `${items.length}건`;
    toggle.append(caret, pill, count);
    group.append(toggle);
    shiftList.append(group);

    if (collapsed) return;

    items.forEach((shift) => {
      const item = template.content.firstElementChild.cloneNode(true);
      const holiday = isHoliday(shift.date);
      item.classList.toggle("overlap", overlapIds.has(shift.id));
      item.classList.toggle("selected", selectedShiftId === shift.id);
      item.classList.toggle("holiday-excluded", holiday);
      item.querySelector(".item-title").textContent = shift.title;
      item.querySelector(".item-title").dataset.id = shift.id;
      const tag = getShiftTag(shift);
      const color = getTagColor(tag);
      const tagPill = item.querySelector(".item-tag");
      tagPill.textContent = tag;
      tagPill.style.setProperty("--tag-bg", color.bg);
      tagPill.style.setProperty("--tag-border", color.border);
      tagPill.style.setProperty("--tag-text", color.text);
      item.querySelector(".item-meta").textContent =
        holiday
          ? `${formatDate(parseISODate(shift.date))} ${shift.start}-${shift.end} · 휴일 제외`
          : `${formatDate(parseISODate(shift.date))} ${shift.start}-${shift.end} · 자동 식사차감 ${formatDuration(getMealDeductionMinutes(shift))} · 실근무 ${formatDuration(getNetMinutes(shift))}`;
      item.querySelectorAll("[data-action]").forEach((button) => {
        button.dataset.id = shift.id;
      });
      shiftList.append(item);
    });
  });
}

function groupShiftsByTag(items) {
  const groups = new Map();
  items.forEach((shift) => {
    const tag = getShiftTag(shift);
    if (!groups.has(tag)) groups.set(tag, []);
    groups.get(tag).push(shift);
  });
  return [...groups.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], "ko-KR"))
    .map(([tag, shiftsForTag]) => [
      tag,
      shiftsForTag.sort((a, b) => `${a.date} ${a.start}`.localeCompare(`${b.date} ${b.start}`))
    ]);
}

function renderCalendar(weekShifts, overlapIds) {
  calendar.innerHTML = "";

  for (let index = 0; index < 7; index += 1) {
    const date = addDays(currentWeekStart, index);
    const iso = toISODate(date);
    const holiday = isHoliday(iso);
    const dayShifts = weekShifts.filter((shift) => shift.date === iso);
    const countedDayShifts = holiday ? [] : dayShifts;
    const column = document.createElement("article");
    column.className = `day-column${holiday ? " holiday" : ""}`;
    column.innerHTML = `
      <header class="day-head">
        <strong>${dayNames[index]}</strong>
        <span>${formatDate(date)}</span>
        <button type="button" class="holiday-toggle${holiday ? " active" : ""}" data-holiday-toggle="${iso}">${holiday ? "휴일" : "휴일 지정"}</button>
        <div class="day-total">실근무 ${formatDuration(countedDayShifts.reduce((sum, shift) => sum + getNetMinutes(shift), 0))}</div>
      </header>
      <div class="day-body"></div>
    `;

    const body = column.querySelector(".day-body");
    body.dataset.date = iso;
    renderTimeLabels(body);
    layoutDayShifts(dayShifts).forEach((entry) => {
      body.append(makeShiftBlock(entry.shift, overlapIds.has(entry.shift.id), entry.lane, entry.laneCount, holiday));
    });
    calendar.append(column);
  }
}

function renderMonthCalendar() {
  monthCalendar.innerHTML = "";
  monthCalendarLabel.textContent = formatMonthKey(toISODate(currentMonthStart).slice(0, 7));

  dayNames.forEach((dayName) => {
    const item = document.createElement("div");
    item.className = "month-weekday";
    item.textContent = dayName;
    monthCalendar.append(item);
  });

  getMonthGridDays(currentMonthStart).forEach((date) => {
    const iso = toISODate(date);
    const dayShifts = getDayShifts(iso);
    const holiday = isHoliday(iso);
    const countedDayShifts = holiday ? [] : dayShifts;
    const total = countedDayShifts.reduce((sum, shift) => sum + getNetMinutes(shift), 0);
    const isCurrentMonth = date.getMonth() === currentMonthStart.getMonth();
    const isCurrentWeek = iso >= toISODate(currentWeekStart) && iso <= toISODate(addDays(currentWeekStart, 6));
    const button = document.createElement("button");
    const shownShifts = dayShifts.slice(0, 3);
    button.type = "button";
    button.className = [
      "month-day",
      isCurrentMonth ? "" : "outside-month",
      holiday ? "holiday" : "",
      isCurrentWeek ? "current-week" : ""
    ].filter(Boolean).join(" ");
    button.dataset.monthDate = iso;
    button.innerHTML = `
      <div class="month-day-head">
        <span>${date.getDate()}</span>
        <strong>${total > 0 ? formatDuration(total) : ""}</strong>
      </div>
      <div class="month-day-shifts"></div>
    `;

    const shiftListForDay = button.querySelector(".month-day-shifts");
    shownShifts.forEach((shift) => {
      shiftListForDay.append(makeMonthShiftChip(shift, holiday));
    });

    if (dayShifts.length > shownShifts.length) {
      const more = document.createElement("span");
      more.className = "month-more";
      more.textContent = `+${dayShifts.length - shownShifts.length}건`;
      shiftListForDay.append(more);
    }

    monthCalendar.append(button);
  });
}

function makeMonthShiftChip(shift, isExcluded = false) {
  const color = getTagColor(getShiftTag(shift));
  const chip = document.createElement("span");
  chip.className = `month-shift-chip${isExcluded ? " holiday-excluded" : ""}`;
  chip.dataset.id = shift.id;
  chip.style.setProperty("--tag-bg", color.bg);
  chip.style.setProperty("--tag-border", color.border);
  chip.style.setProperty("--tag-text", color.text);
  chip.title = `${shift.title} ${shift.start}-${shift.end}`;
  chip.textContent = `${shift.start} ${shift.title}`;
  return chip;
}

function updateMonthDragTarget(clientX, clientY) {
  const element = document.elementFromPoint(clientX, clientY);
  const day = element?.closest("[data-month-date]");
  if (!day || !monthCalendar.contains(day) || isHoliday(day.dataset.monthDate)) {
    clearMonthDropTarget();
    return;
  }
  showMonthDropTarget(day);
}

function finishMonthDrag() {
  const id = monthDraggingShift.id;
  const hasMoved = monthDraggingShift.hasMoved;
  const target = monthCalendar.querySelector(".month-day.drop-target");
  const targetDate = target?.dataset.monthDate;
  suppressMonthShiftClick = hasMoved;
  monthDraggingShift = null;
  monthCalendar.querySelectorAll(".month-shift-chip.dragging").forEach((chip) => {
    chip.classList.remove("dragging");
  });
  clearMonthDropTarget();

  if (!hasMoved) return;
  if (!targetDate || isHoliday(targetDate)) return;
  const shift = shifts.find((item) => item.id === id);
  if (!shift || shift.date === targetDate) return;

  shifts = shifts.map((item) => (
    item.id === id ? { ...item, date: targetDate } : item
  ));
  selectedShiftId = id;
  currentWeekStart = startOfWeek(parseISODate(targetDate));
  currentMonthStart = startOfMonth(parseISODate(targetDate));
  saveShifts();
  render();
}

function showMonthDropTarget(day) {
  clearMonthDropTarget();
  day.classList.add("drop-target");
}

function clearMonthDropTarget() {
  monthCalendar.querySelectorAll(".month-day.drop-target").forEach((day) => {
    day.classList.remove("drop-target");
  });
}

function getDayShifts(date) {
  return shifts
    .filter((shift) => shift.date === date)
    .sort((a, b) => a.start.localeCompare(b.start));
}

function renderTimeLabels(body) {
  for (let hour = VIEW_START_MINUTES / 60; hour <= VIEW_END_MINUTES / 60; hour += 1) {
    const label = document.createElement("span");
    label.className = "time-label";
    label.style.top = `${TIME_AXIS_PADDING + (hour - VIEW_START_MINUTES / 60) * HOUR_HEIGHT}px`;
    label.textContent = `${String(hour).padStart(2, "0")}:00`;
    body.append(label);
  }
}

function makeShiftBlock(shift, isOverlap, lane = 0, laneCount = 1, isExcluded = false) {
  const start = timeToMinutes(shift.start);
  const end = timeToMinutes(shift.end);
  if (end <= VIEW_START_MINUTES || start >= VIEW_END_MINUTES) {
    return document.createDocumentFragment();
  }
  const visibleStart = Math.max(start, VIEW_START_MINUTES);
  const visibleEnd = Math.min(end, VIEW_END_MINUTES);
  const gutter = 4;
  const leftBase = TIME_LABEL_WIDTH;
  const rightBase = CALENDAR_RIGHT_PADDING;
  const chromeWidth = leftBase + rightBase;
  const slotPercent = 100 / laneCount;
  const widthPxOffset = chromeWidth / laneCount + (gutter * (laneCount - 1)) / laneCount;
  const leftPxOffset = leftBase - (chromeWidth * lane) / laneCount + gutter * lane - (gutter * (laneCount - 1) * lane) / laneCount;
  const block = document.createElement("div");
  block.className = `shift-block${isOverlap ? " overlap" : ""}`;
  block.classList.toggle("holiday-excluded", isExcluded);
  block.classList.toggle("selected", selectedShiftId === shift.id);
  const tagColor = getTagColor(getShiftTag(shift));
  block.style.setProperty("--shift-bg", tagColor.bg);
  block.style.setProperty("--shift-border", tagColor.border);
  block.style.setProperty("--shift-text", tagColor.text);
  block.draggable = true;
  block.dataset.id = shift.id;
  block.style.top = `${((visibleStart - VIEW_START_MINUTES) / 60) * HOUR_HEIGHT}px`;
  block.style.height = `${Math.max(((visibleEnd - visibleStart) / 60) * HOUR_HEIGHT, 28)}px`;
  block.style.left = laneCount === 1
    ? `${leftBase}px`
    : `calc(${slotPercent * lane}% + ${leftPxOffset}px)`;
  block.style.right = "auto";
  block.style.width = laneCount === 1
    ? `calc(100% - ${chromeWidth}px)`
    : `calc(${slotPercent}% - ${widthPxOffset}px)`;
  getMealSegments(start, end, shift).forEach((segment) => {
    block.append(makeMealOverlay(segment, visibleStart, visibleEnd));
  });

  const content = document.createElement("div");
  content.className = "shift-content";
  content.innerHTML = `<strong>${escapeHtml(shift.title)}</strong>`;
  block.append(content);
  if (selectedShiftId === shift.id && !isExcluded) {
    block.append(makeResizeHandle("start"));
    block.append(makeResizeHandle("end"));
  }
  return block;
}

function makeResizeHandle(edge) {
  const handle = document.createElement("button");
  handle.type = "button";
  handle.className = `resize-handle ${edge}`;
  handle.dataset.edge = edge;
  handle.setAttribute("aria-label", edge === "start" ? "시작 시간 조절" : "종료 시간 조절");
  return handle;
}

function getMealSegments(start, end, shift) {
  return getMealWindowsForShift(shift)
    .map((meal) => ({
      ...meal,
      overlapStart: Math.max(start, meal.start),
      overlapEnd: Math.min(end, meal.end)
    }))
    .filter((meal) => meal.overlapStart < meal.overlapEnd);
}

function makeMealOverlay(segment, visibleStart, visibleEnd) {
  const visibleDuration = visibleEnd - visibleStart;
  const overlay = document.createElement("div");
  overlay.className = "meal-overlay";
  overlay.style.top = `${((segment.overlapStart - visibleStart) / visibleDuration) * 100}%`;
  overlay.style.height = `${((segment.overlapEnd - segment.overlapStart) / visibleDuration) * 100}%`;
  overlay.title = `${segment.label}시간 ${minutesToTime(segment.start)}-${minutesToTime(segment.end)} 겹침`;
  return overlay;
}

function getDropTarget(body, clientY, shift) {
  const rect = body.getBoundingClientRect();
  const rawMinutes = VIEW_START_MINUTES + ((clientY - rect.top) / HOUR_HEIGHT) * 60;
  const duration = timeToMinutes(shift.end) - timeToMinutes(shift.start);
  const visibleDuration = Math.min(duration, VIEW_END_MINUTES - VIEW_START_MINUTES);
  let start = clamp(roundToStep(rawMinutes, SNAP_MINUTES), VIEW_START_MINUTES, VIEW_END_MINUTES - visibleDuration);
  let end = start + duration;

  if (end > VIEW_END_MINUTES) {
    end = VIEW_END_MINUTES;
    start = end - visibleDuration;
  }

  return { start, end, visibleDuration };
}

function showDropPreview(body, target) {
  clearDropPreview();
  body.classList.add("drop-target");

  const preview = document.createElement("div");
  preview.className = "drop-preview";
  preview.style.top = `${((target.start - VIEW_START_MINUTES) / 60) * HOUR_HEIGHT}px`;
  preview.style.height = `${Math.max((target.visibleDuration / 60) * HOUR_HEIGHT, 32)}px`;
  preview.innerHTML = `<strong>${minutesToTime(target.start)}-${minutesToTime(target.end)}</strong>`;
  body.append(preview);
}

function clearDropPreview() {
  calendar.querySelectorAll(".day-body.drop-target").forEach((body) => body.classList.remove("drop-target"));
  calendar.querySelectorAll(".drop-preview").forEach((preview) => preview.remove());
}

function getSnappedTimeFromClientY(body, clientY) {
  const rect = body.getBoundingClientRect();
  const rawMinutes = VIEW_START_MINUTES + ((clientY - rect.top) / HOUR_HEIGHT) * 60;
  return clamp(roundToStep(rawMinutes, SNAP_MINUTES), VIEW_START_MINUTES, VIEW_END_MINUTES - SNAP_MINUTES);
}

function getDayBody(date) {
  return calendar.querySelector(`.day-body[data-date="${date}"]`);
}

function isTimeRangeOccupied(date, start, end) {
  return shifts.some((shift) => (
    shift.date === date
    && start < timeToMinutes(shift.end)
    && timeToMinutes(shift.start) < end
  ));
}

function getCountedShifts(items) {
  return items.filter((shift) => !isHoliday(shift.date));
}

function isHoliday(date) {
  return holidays.has(date);
}

function showCreatePreview(selection) {
  clearCreatePreview();
  const start = selection.previewStart ?? selection.start;
  const end = selection.previewEnd ?? selection.end;
  const preview = document.createElement("div");
  preview.className = "create-preview";
  preview.style.top = `${((start - VIEW_START_MINUTES) / 60) * HOUR_HEIGHT}px`;
  preview.style.height = `${Math.max(((end - start) / 60) * HOUR_HEIGHT, 32)}px`;
  preview.innerHTML = `<strong>${minutesToTime(start)}-${minutesToTime(end)}</strong>`;
  selection.body.append(preview);
}

function clearCreatePreview() {
  calendar.querySelectorAll(".create-preview").forEach((preview) => preview.remove());
}

function resizeSelectedShift(clientY) {
  const shift = shifts.find((item) => item.id === resizingShift.id);
  if (!shift) return;

  const body = getDayBody(shift.date);
  if (!body) return;

  const minute = getSnappedTimeFromClientY(body, clientY);
  let start = timeToMinutes(shift.start);
  let end = timeToMinutes(shift.end);

  if (resizingShift.edge === "start") {
    start = clamp(minute, VIEW_START_MINUTES, end - SNAP_MINUTES);
  } else {
    end = clamp(minute, start + SNAP_MINUTES, VIEW_END_MINUTES);
  }

  shifts = shifts.map((item) => (
    item.id === shift.id ? { ...item, start: minutesToTime(start), end: minutesToTime(end) } : item
  ));
  render();
}

function openEditModal(shift) {
  editModalTitle.textContent = "근무 수정";
  editId.value = shift.id;
  editTitle.value = shift.title;
  editTag.value = getShiftTag(shift);
  editDate.value = shift.date;
  editStart.value = shift.start;
  editEnd.value = shift.end;
  selectedShiftId = shift.id;
  editModal.classList.remove("hidden");
  editTitle.focus();
  editTitle.select();
  render();
}

function openCreateModal() {
  editModalTitle.textContent = "근무 등록";
  editId.value = "";
  editTitle.value = "새 근무";
  editTag.value = DEFAULT_TAG;
  editDate.value = toISODate(currentWeekStart);
  editStart.value = "09:00";
  editEnd.value = "18:00";
  selectedShiftId = null;
  editModal.classList.remove("hidden");
  editTitle.focus();
  editTitle.select();
  renderTagControls();
}

function closeModal() {
  editModal.classList.add("hidden");
  editForm.reset();
}

function openCopyModal(shift) {
  copyId.value = shift.id;
  copyDate.value = shift.date;
  copySummary.textContent = `${shift.title} · ${formatDate(parseISODate(shift.date))} ${shift.start}-${shift.end}`;
  copyModal.classList.remove("hidden");
  copyDate.focus();
}

function closeCopyModalDialog() {
  copyModal.classList.add("hidden");
  copyForm.reset();
  copySummary.textContent = "";
}

function openTagCopyModal() {
  const weekShifts = getWeekShifts(currentWeekStart);
  if (weekShifts.length === 0) {
    alert("다음 주로 복사할 이번 주 일정이 없습니다.");
    return;
  }

  const tagCounts = new Map();
  weekShifts.forEach((shift) => {
    const tag = getShiftTag(shift);
    tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
  });

  copyTagChoices.innerHTML = "";
  [...tagCounts.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], "ko-KR"))
    .forEach(([tag, count]) => {
      const color = getTagColor(tag);
      const label = document.createElement("label");
      const checkbox = document.createElement("input");
      const pill = document.createElement("span");
      const amount = document.createElement("strong");
      label.className = "tag-copy-option";
      label.style.setProperty("--tag-bg", color.bg);
      label.style.setProperty("--tag-border", color.border);
      label.style.setProperty("--tag-text", color.text);
      checkbox.type = "checkbox";
      checkbox.value = tag;
      checkbox.checked = false;
      pill.className = "tag-pill";
      pill.textContent = tag;
      amount.textContent = `${count}건`;
      label.append(checkbox, pill, amount);
      copyTagChoices.append(label);
    });

  tagCopyModal.classList.remove("hidden");
  copyTagChoices.querySelector("input")?.focus();
}

function closeTagCopyModalDialog() {
  tagCopyModal.classList.add("hidden");
  tagCopyForm.reset();
  copyTagChoices.innerHTML = "";
}

function renderTagControls() {
  renderTagControl(editTag, editTagChoices, editTagPalette);
}

function renderTagControl(input, choices, palette) {
  const currentTag = normalizeTag(input.value);
  const tags = getKnownTags();
  choices.innerHTML = tags.map((tag) => {
    const color = getTagColor(tag);
    const selected = tag === currentTag ? " selected" : "";
    const removeButton = tag === DEFAULT_TAG ? "" : '<span class="tag-remove" data-tag-remove="true">×</span>';
    return `<button type="button" class="tag-choice${selected}" data-tag="${escapeHtml(tag)}" style="--tag-bg: ${color.bg}; --tag-border: ${color.border}; --tag-text: ${color.text};"><span>${escapeHtml(tag)}</span>${removeButton}</button>`;
  }).join("");

  const currentColor = getPreviewTagColor(currentTag);
  palette.innerHTML = TAG_PALETTE.map((color, index) => {
    const selected = color.bg === currentColor.bg && color.border === currentColor.border ? " selected" : "";
    return `<button type="button" class="color-swatch${selected}" data-color-index="${index}" style="--swatch-bg: ${color.bg}; --swatch-border: ${color.border};" aria-label="태그 색상 ${index + 1}"></button>`;
  }).join("");
}

function handleTagChoiceClick(event) {
  const remove = event.target.closest("[data-tag-remove]");
  if (remove) {
    const tag = remove.closest("[data-tag]")?.dataset.tag;
    if (tag) deleteTag(tag);
    return;
  }

  const button = event.target.closest("[data-tag]");
  if (!button) return;
  const input = button.closest(".tag-control").previousElementSibling.querySelector("input");
  input.value = button.dataset.tag;
  renderTagControls();
}

function handlePaletteClick(event) {
  const button = event.target.closest("[data-color-index]");
  if (!button) return;
  const control = button.closest(".tag-control");
  const input = control.previousElementSibling.querySelector("input");
  const tag = normalizeTag(input.value);
  ensureTagColor(tag);
  setTagColor(tag, Number(button.dataset.colorIndex));
  saveTagColors();
  render();
}

function getKnownTags() {
  const tags = new Set([DEFAULT_TAG]);
  shifts.forEach((shift) => tags.add(getShiftTag(shift)));
  Object.keys(tagColors).forEach((tag) => tags.add(normalizeTag(tag)));
  return [...tags].sort((a, b) => a.localeCompare(b, "ko-KR"));
}

function deleteTag(tag) {
  const normalized = normalizeTag(tag);
  if (normalized === DEFAULT_TAG) return;
  if (!confirm(`'${normalized}' 태그를 삭제하고 해당 근무를 '${DEFAULT_TAG}'으로 변경할까요?`)) return;

  shifts = shifts.map((shift) => (
    getShiftTag(shift) === normalized ? { ...shift, tag: DEFAULT_TAG } : shift
  ));
  delete tagColors[normalized];
  delete tagTargetMinutes[normalized];
  delete tagMealSettings[normalized];
  ensureTagColor(DEFAULT_TAG);
  editTag.value = DEFAULT_TAG;
  saveTagColors();
  saveTagTargetMinutes();
  saveTagMealSettings();
  saveShifts();
  render();
}

function startTitleEdit(titleElement) {
  const id = titleElement.dataset.id;
  const shift = shifts.find((item) => item.id === id);
  if (!shift || titleElement.querySelector("input")) return;

  const input = document.createElement("input");
  input.className = "title-edit-input";
  input.type = "text";
  input.value = shift.title;
  input.setAttribute("aria-label", "근무명 수정");
  titleElement.replaceChildren(input);
  input.focus();
  input.select();
  let cancelled = false;

  const save = () => {
    if (cancelled) return;
    const title = input.value.trim();
    if (!title) {
      render();
      return;
    }
    shifts = shifts.map((item) => (
      item.id === id ? { ...item, title } : item
    ));
    saveShifts();
    render();
  };

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") input.blur();
    if (event.key === "Escape") {
      cancelled = true;
      render();
    }
  });
  input.addEventListener("blur", save, { once: true });
}

function layoutDayShifts(dayShifts) {
  const sorted = [...dayShifts].sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
  const entries = sorted.map((shift) => ({ shift, lane: 0, laneCount: 1 }));
  let group = [];
  let groupEnd = -1;

  entries.forEach((entry) => {
    const start = timeToMinutes(entry.shift.start);
    const end = timeToMinutes(entry.shift.end);
    if (group.length > 0 && start >= groupEnd) {
      assignLanes(group);
      group = [];
      groupEnd = -1;
    }
    group.push(entry);
    groupEnd = Math.max(groupEnd, end);
  });

  if (group.length > 0) assignLanes(group);
  return entries;
}

function assignLanes(group) {
  const laneEnds = [];
  group.forEach((entry) => {
    const start = timeToMinutes(entry.shift.start);
    const end = timeToMinutes(entry.shift.end);
    let lane = laneEnds.findIndex((laneEnd) => laneEnd <= start);
    if (lane === -1) lane = laneEnds.length;
    laneEnds[lane] = end;
    entry.lane = lane;
  });
  const laneCount = Math.max(1, laneEnds.length);
  group.forEach((entry) => {
    entry.laneCount = laneCount;
  });
}

function getOverlapIds(items) {
  const ids = new Set();
  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      if (items[i].date !== items[j].date) continue;
      if (hasOverlap(items[i], items[j])) {
        ids.add(items[i].id);
        ids.add(items[j].id);
      }
    }
  }
  return ids;
}

function countOverlapPairs(items) {
  let count = 0;
  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      if (items[i].date === items[j].date && hasOverlap(items[i], items[j])) count += 1;
    }
  }
  return count;
}

function hasOverlap(a, b) {
  return timeToMinutes(a.start) < timeToMinutes(b.end) && timeToMinutes(b.start) < timeToMinutes(a.end);
}

function makeShift(title, tag, date, start, end) {
  return {
    id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    title,
    tag: normalizeTag(tag),
    date,
    start,
    end
  };
}

function normalizeTag(tag) {
  const value = String(tag || "").trim();
  return value || DEFAULT_TAG;
}

function getShiftTag(shift) {
  return normalizeTag(shift.tag);
}

function getTagColor(tag) {
  const normalized = normalizeTag(tag);
  if (tagColors[normalized]) return tagColors[normalized];
  return getDefaultTagColor(normalized);
}

function ensureTagColor(tag) {
  const normalized = normalizeTag(tag);
  if (tagColors[normalized]) return tagColors[normalized];
  tagColors[normalized] = getDefaultTagColor(normalized);
  return tagColors[normalized];
}

function getPreviewTagColor(tag) {
  const normalized = normalizeTag(tag);
  return tagColors[normalized] || getDefaultTagColor(normalized);
}

function getDefaultTagColor(tag) {
  let hash = 0;
  for (const char of normalizeTag(tag)) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return TAG_PALETTE[hash % TAG_PALETTE.length];
}

function setTagColor(tag, colorIndex) {
  const normalized = normalizeTag(tag);
  tagColors[normalized] = TAG_PALETTE[colorIndex] || TAG_PALETTE[0];
}

function getTagMealSetting(tag) {
  const normalized = normalizeTag(tag);
  const saved = tagMealSettings[normalized] || {};
  return {
    lunch: {
      start: Number(saved.lunch?.start ?? MEAL_WINDOWS[0].start),
      end: Number(saved.lunch?.end ?? MEAL_WINDOWS[0].end)
    },
    dinner: {
      start: Number(saved.dinner?.start ?? MEAL_WINDOWS[1].start),
      end: Number(saved.dinner?.end ?? MEAL_WINDOWS[1].end)
    }
  };
}

function getMealWindowsForShift(shift) {
  const setting = getTagMealSetting(getShiftTag(shift));
  return [
    { label: "점심", start: setting.lunch.start, end: setting.lunch.end },
    { label: "저녁", start: setting.dinner.start, end: setting.dinner.end }
  ].filter((meal) => meal.start < meal.end);
}

function isEditableElement(element) {
  return Boolean(element.closest("input, textarea, select, [contenteditable='true']"));
}

function getNetMinutes(shift) {
  return Math.max(0, timeToMinutes(shift.end) - timeToMinutes(shift.start) - getMealDeductionMinutes(shift));
}

function getMealDeductionMinutes(shift) {
  return getMealSegments(timeToMinutes(shift.start), timeToMinutes(shift.end), shift)
    .reduce((sum, segment) => sum + segment.overlapEnd - segment.overlapStart, 0);
}

function timeToMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes) {
  const safeMinutes = clamp(minutes, 0, MINUTES_IN_DAY);
  const hours = Math.floor(safeMinutes / 60);
  const rest = safeMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

function roundToStep(value, step) {
  return Math.round(value / step) * step;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function formatDuration(minutes) {
  if (minutes < 60) return `${minutes}분`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}시간` : `${hours}시간 ${rest}분`;
}

function startOfWeek(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  const day = copy.getDay() || 7;
  copy.setDate(copy.getDate() - day + 1);
  return copy;
}

function addDays(date, amount) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + amount);
  return copy;
}

function addMonths(date, amount) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function getDayDiff(date, baseDate) {
  const dayMs = 24 * 60 * 60 * 1000;
  return Math.round((startOfDay(date) - startOfDay(baseDate)) / dayMs);
}

function startOfDay(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getMonthGridDays(monthStart) {
  const gridStart = startOfWeek(monthStart);
  const days = [];
  for (let index = 0; index < 42; index += 1) {
    days.push(addDays(gridStart, index));
  }
  return days;
}

function toISODate(date) {
  const copy = new Date(date);
  copy.setMinutes(copy.getMinutes() - copy.getTimezoneOffset());
  return copy.toISOString().slice(0, 10);
}

function parseISODate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(date) {
  return new Intl.DateTimeFormat("ko-KR", { month: "2-digit", day: "2-digit" }).format(date);
}

function loadShifts() {
  try {
    return JSON.parse(localStorage.getItem(storageKeys.shifts)) || [];
  } catch {
    return [];
  }
}

function loadTagColors() {
  try {
    return JSON.parse(localStorage.getItem(storageKeys.tagColors)) || {};
  } catch {
    return {};
  }
}

function saveTagColors() {
  localStorage.setItem(storageKeys.tagColors, JSON.stringify(tagColors));
  queueCalendarDataSave();
}

function loadHolidays() {
  try {
    return new Set(JSON.parse(localStorage.getItem(storageKeys.holidays)) || []);
  } catch {
    return new Set();
  }
}

function saveHolidays() {
  localStorage.setItem(storageKeys.holidays, JSON.stringify([...holidays]));
  queueCalendarDataSave();
}

function getTagTargetMinutes(tag) {
  return Math.max(0, Number(tagTargetMinutes[normalizeTag(tag)] || 0));
}

function loadTagTargetMinutes() {
  try {
    return JSON.parse(localStorage.getItem(storageKeys.tagTargets)) || {};
  } catch {
    return {};
  }
}

function saveTagTargetMinutes() {
  localStorage.setItem(storageKeys.tagTargets, JSON.stringify(tagTargetMinutes));
  queueCalendarDataSave();
}

function loadTagMealSettings() {
  try {
    return JSON.parse(localStorage.getItem(storageKeys.tagMeals)) || {};
  } catch {
    return {};
  }
}

function saveTagMealSettings() {
  localStorage.setItem(storageKeys.tagMeals, JSON.stringify(tagMealSettings));
  queueCalendarDataSave();
}

function loadWeekClipboard() {
  try {
    const copied = JSON.parse(localStorage.getItem(storageKeys.weekClipboard)) || [];
    return copied.filter((item) => (
      Number.isInteger(item.dayOffset)
      && item.dayOffset >= 0
      && item.dayOffset <= 6
      && item.title
      && item.start
      && item.end
    ));
  } catch {
    return [];
  }
}

function setWeekClipboard(copied) {
  localStorage.setItem(storageKeys.weekClipboard, JSON.stringify(copied));
  queueCalendarDataSave();
}

function saveShifts() {
  localStorage.setItem(storageKeys.shifts, JSON.stringify(shifts));
  queueCalendarDataSave();
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
