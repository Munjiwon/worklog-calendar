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
const calendarTagFilters = document.querySelector("#calendarTagFilters");
const showAllCalendarTags = document.querySelector("#showAllCalendarTags");
const publicHolidayStatus = document.querySelector("#publicHolidayStatus");
const semesterStatus = document.querySelector("#semesterStatus");
const createShift = document.querySelector("#createShift");
const manageTimetable = document.querySelector("#manageTimetable");
const importWorklogPdf = document.querySelector("#importWorklogPdf");
const clearAll = document.querySelector("#clearAll");
const adminLink = document.querySelector("#adminLink");
const accountGreeting = document.querySelector("#accountGreeting");
const accountName = document.querySelector("#accountName");
const prevWeek = document.querySelector("#prevWeek");
const nextWeek = document.querySelector("#nextWeek");
const todayWeek = document.querySelector("#todayWeek");
const copyWeek = document.querySelector("#copyWeek");
const pasteWeek = document.querySelector("#pasteWeek");
const copyTagsNextWeek = document.querySelector("#copyTagsNextWeek");
const prevMonth = document.querySelector("#prevMonth");
const nextMonth = document.querySelector("#nextMonth");
const thisMonth = document.querySelector("#thisMonth");
const copyTagsNextMonth = document.querySelector("#copyTagsNextMonth");
const copyTagsToMonth = document.querySelector("#copyTagsToMonth");
const monthCalendar = document.querySelector("#monthCalendar");
const monthCalendarLabel = document.querySelector("#monthCalendarLabel");
const editModal = document.querySelector("#editModal");
const editForm = document.querySelector("#editForm");
const closeEditModal = document.querySelector("#closeEditModal");
const editModalTitle = document.querySelector("#editModalTitle");
const copyModal = document.querySelector("#copyModal");
const copyForm = document.querySelector("#copyForm");
const closeCopyModal = document.querySelector("#closeCopyModal");
const pdfImportModal = document.querySelector("#pdfImportModal");
const pdfImportForm = document.querySelector("#pdfImportForm");
const closePdfImportModal = document.querySelector("#closePdfImportModal");
const pdfImportMessage = document.querySelector("#pdfImportMessage");
const pdfImportFile = document.querySelector("#pdfImportFile");
const pdfImportTag = document.querySelector("#pdfImportTag");
const pdfImportTagChoices = document.querySelector("#pdfImportTagChoices");
const pdfImportPreview = document.querySelector("#pdfImportPreview");
const pdfImportSubmit = document.querySelector("#pdfImportSubmit");
const tagCopyModal = document.querySelector("#tagCopyModal");
const tagCopyForm = document.querySelector("#tagCopyForm");
const closeTagCopyModal = document.querySelector("#closeTagCopyModal");
const tagCopyModalTitle = document.querySelector("#tagCopyModalTitle");
const tagCopyTargetMonthField = document.querySelector("#tagCopyTargetMonthField");
const tagCopyTargetMonth = document.querySelector("#tagCopyTargetMonth");
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
const timetableModal = document.querySelector("#timetableModal");
const closeTimetableModal = document.querySelector("#closeTimetableModal");
const timetableSemesterSummary = document.querySelector("#timetableSemesterSummary");
const timetableEntryForm = document.querySelector("#timetableEntryForm");
const timetableEntryId = document.querySelector("#timetableEntryId");
const timetableSemester = document.querySelector("#timetableSemester");
const timetableDayOfWeek = document.querySelector("#timetableDayOfWeek");
const timetableTitle = document.querySelector("#timetableTitle");
const timetableStart = document.querySelector("#timetableStart");
const timetableEnd = document.querySelector("#timetableEnd");
const timetableList = document.querySelector("#timetableList");
const timetableSubmit = document.querySelector("#timetableSubmit");
const cancelTimetableEdit = document.querySelector("#cancelTimetableEdit");
const timetableCourseSearch = document.querySelector("#timetableCourseSearch");
const timetableDepartmentFilter = document.querySelector("#timetableDepartmentFilter");
const timetableDayFilter = document.querySelector("#timetableDayFilter");
const timetableProfessorFilter = document.querySelector("#timetableProfessorFilter");
const resetTimetableCatalogFilters = document.querySelector("#resetTimetableCatalogFilters");
const timetableCatalogCount = document.querySelector("#timetableCatalogCount");
const timetableCatalogMessage = document.querySelector("#timetableCatalogMessage");
const timetableCatalogList = document.querySelector("#timetableCatalogList");
const addSelectedCourses = document.querySelector("#addSelectedCourses");

let currentWeekStart = startOfWeek(new Date());
let currentMonthStart = startOfMonth(currentWeekStart);
let storageKeys = makeStorageKeys("anonymous");
let currentSession = null;
let shifts = [];
let tagColors = {};
let holidays = new Set();
let weekendWorkdays = new Set();
const publicHolidays = new Map();
const loadedPublicHolidayYears = new Set();
const failedPublicHolidayYears = new Set();
const pendingPublicHolidayYears = new Set();
let tagTargetMinutes = {};
let tagMealSettings = {};
let timetable = [];
let semesters = [];
let timetableCourseCatalog = [];
const selectedCatalogCourseIds = new Set();
let draggingShiftId = null;
let creatingShift = null;
let resizingShift = null;
let monthDraggingShift = null;
let suppressMonthShiftClick = false;
let selectedShiftId = null;
let pdfImportEntries = [];
let tagCopyPeriod = "week";
let calendarDataSaveTimer = null;
let lastActivityPingAt = 0;
const collapsedTags = new Set();
let hiddenCalendarTags = new Set();

initializeApp();

window.addEventListener("focus", recordCurrentAccess);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") recordCurrentAccess();
});
document.addEventListener("pointerdown", recordCurrentAccess, { passive: true });
document.addEventListener("keydown", recordCurrentAccess, { passive: true });

createShift.addEventListener("click", () => {
  openCreateModal();
});

importWorklogPdf.addEventListener("click", openPdfImportModal);
manageTimetable.addEventListener("click", openTimetableModalDialog);

timetableEntryForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const start = timetableStart.value;
  const end = timetableEnd.value;
  if (timeToMinutes(end) <= timeToMinutes(start)) {
    alert("수업 종료 시간은 시작 시간보다 늦어야 합니다.");
    return;
  }
  const entry = {
    dayOfWeek: Number(timetableDayOfWeek.value),
    end,
    id: timetableEntryId.value || makeId(),
    semesterId: timetableSemester.value,
    start,
    title: timetableTitle.value.trim()
  };
  if (timetableEntryId.value) {
    timetable = timetable.map((item) => item.id === timetableEntryId.value ? entry : item);
  } else {
    timetable.push(entry);
  }
  timetable.sort(compareTimetableEntries);
  saveTimetable();
  resetTimetableEntryForm();
  timetableTitle.focus();
  renderTimetableList();
  render();
});

timetableList.addEventListener("click", (event) => {
  const editButton = event.target.closest("[data-edit-class]");
  if (editButton) {
    const entry = timetable.find((item) => item.id === editButton.dataset.editClass);
    if (!entry) return;
    timetableEntryId.value = entry.id;
    timetableSemester.value = entry.semesterId;
    updateTimetableSemesterSummary();
    timetableDayOfWeek.value = String(entry.dayOfWeek);
    timetableTitle.value = entry.title;
    timetableStart.value = entry.start;
    timetableEnd.value = entry.end;
    timetableSubmit.textContent = "수업 수정";
    cancelTimetableEdit.classList.remove("hidden");
    timetableTitle.focus();
    return;
  }
  const button = event.target.closest("[data-delete-class]");
  if (!button) return;
  const deletedEntry = timetable.find((entry) => entry.id === button.dataset.deleteClass);
  timetable = deletedEntry?.sourceCourseId
    ? timetable.filter((entry) => entry.sourceCourseId !== deletedEntry.sourceCourseId || entry.semesterId !== deletedEntry.semesterId)
    : timetable.filter((entry) => entry.id !== button.dataset.deleteClass);
  saveTimetable();
  renderTimetableList();
  renderTimetableCourseCatalog();
  render();
});

timetableSemester.addEventListener("change", () => {
  updateTimetableSemesterSummary();
  selectedCatalogCourseIds.clear();
  resetTimetableCourseFilters();
  void loadTimetableCourseCatalog();
});

timetableCourseSearch.addEventListener("input", renderTimetableCourseCatalog);
timetableDepartmentFilter.addEventListener("change", renderTimetableCourseCatalog);
timetableDayFilter.addEventListener("change", renderTimetableCourseCatalog);
timetableProfessorFilter.addEventListener("change", renderTimetableCourseCatalog);

resetTimetableCatalogFilters.addEventListener("click", () => {
  resetTimetableCourseFilters();
  renderTimetableCourseCatalog();
  timetableCourseSearch.focus();
});

timetableCatalogList.addEventListener("change", (event) => {
  const input = event.target.closest("[data-catalog-course]");
  if (!input || input.disabled) return;
  if (input.checked) {
    selectedCatalogCourseIds.add(input.dataset.catalogCourse);
  } else {
    selectedCatalogCourseIds.delete(input.dataset.catalogCourse);
  }
  input.closest(".timetable-catalog-item")?.classList.toggle("selected", input.checked);
  updateCatalogSelectionButton();
});

addSelectedCourses.addEventListener("click", () => {
  const selectedIds = [...selectedCatalogCourseIds];
  if (selectedIds.length === 0) {
    setTimetableCatalogMessage("추가할 수업을 선택해주세요.", true);
    return;
  }

  let addedCourses = 0;
  let addedMeetings = 0;
  selectedIds.forEach((courseId) => {
    const course = timetableCourseCatalog.find((item) => item.id === courseId);
    if (!course || timetable.some((entry) => entry.semesterId === timetableSemester.value && entry.sourceCourseId === course.id)) return;
    course.meetings.forEach((meeting) => {
      timetable.push({
        courseCode: course.code,
        dayOfWeek: meeting.dayOfWeek,
        end: meeting.end,
        id: makeId(),
        professor: course.professor,
        room: meeting.room,
        semesterId: course.semesterId,
        sourceCourseId: course.id,
        start: meeting.start,
        title: course.title
      });
      addedMeetings += 1;
    });
    addedCourses += 1;
  });

  if (addedCourses === 0) {
    setTimetableCatalogMessage("이미 내 시간표에 추가된 수업입니다.", true);
    return;
  }
  timetable.sort(compareTimetableEntries);
  selectedCatalogCourseIds.clear();
  saveTimetable();
  renderTimetableList();
  renderTimetableCourseCatalog();
  render();
  setTimetableCatalogMessage(`수업 ${addedCourses}개를 추가했습니다${addedMeetings > addedCourses ? ` · 일정 ${addedMeetings}개` : ""}.`);
});

cancelTimetableEdit.addEventListener("click", () => {
  resetTimetableEntryForm();
  timetableTitle.focus();
});

closeTimetableModal.addEventListener("click", closeTimetableModalDialog);
timetableModal.addEventListener("click", (event) => {
  if (event.target === timetableModal || event.target.closest("[data-timetable-close]")) {
    closeTimetableModalDialog();
  }
});

calendarTagFilters.addEventListener("change", (event) => {
  const input = event.target.closest("[data-calendar-tag-filter]");
  if (!input) return;
  const tag = normalizeTag(input.dataset.calendarTagFilter);
  if (input.checked) {
    hiddenCalendarTags.delete(tag);
  } else {
    hiddenCalendarTags.add(tag);
  }
  saveHiddenCalendarTags();
  render();
});

showAllCalendarTags.addEventListener("click", () => {
  hiddenCalendarTags.clear();
  saveHiddenCalendarTags();
  render();
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
  if (!confirmTimetableConflicts(pasted, "붙여넣기")) return;
  shifts = [...shifts, ...pasted];
  selectedShiftId = null;
  saveShifts();
  render();
});

copyTagsNextWeek.addEventListener("click", () => openTagCopyModal("week"));
copyTagsNextMonth.addEventListener("click", () => openTagCopyModal("month"));
copyTagsToMonth.addEventListener("click", () => openTagCopyModal("custom-month"));
tagCopyTargetMonth.addEventListener("click", () => openNativePicker(tagCopyTargetMonth));

calendar.addEventListener("click", (event) => {
  const button = event.target.closest("[data-holiday-toggle]");
  if (!button) return;
  const date = button.dataset.holidayToggle;
  const holidayInfo = getHolidayInfo(date);
  if (holidayInfo?.type === "public") return;
  if (holidayInfo?.type === "weekend") {
    weekendWorkdays.add(date);
    saveWeekendWorkdays();
    render();
    return;
  }
  if (!holidayInfo && isWeekendDate(date) && weekendWorkdays.has(date)) {
    weekendWorkdays.delete(date);
    saveWeekendWorkdays();
    render();
    return;
  }
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

  const candidate = { date, end, id: id || "new", start, tag, title };
  if (!confirmTimetableConflicts([candidate], id ? "수정" : "등록")) return;

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
  if (!confirmTimetableConflicts([copied], "복사")) return;
  shifts.push(copied);
  selectedShiftId = copied.id;
  currentWeekStart = startOfWeek(parseISODate(copied.date));
  currentMonthStart = startOfMonth(parseISODate(copied.date));
  saveShifts();
  closeCopyModalDialog();
  render();
});

closeCopyModal.addEventListener("click", closeCopyModalDialog);
copyDate.addEventListener("click", () => {
  openNativePicker(copyDate);
});

function openNativePicker(input) {
  if (typeof input.showPicker !== "function") return;
  try {
    input.showPicker();
  } catch {
    // Keep the browser's native date/month-input behavior as a fallback.
  }
}
copyModal.addEventListener("click", (event) => {
  if (event.target === copyModal || event.target.closest("[data-copy-cancel]")) {
    closeCopyModalDialog();
  }
});

pdfImportFile.addEventListener("change", parseSelectedWorklogPdf);
pdfImportTag.addEventListener("input", renderPdfImportTagChoices);
pdfImportTagChoices.addEventListener("click", (event) => {
  const button = event.target.closest("[data-pdf-import-tag]");
  if (!button) return;
  pdfImportTag.value = button.dataset.pdfImportTag;
  renderPdfImportTagChoices();
});
pdfImportForm.addEventListener("submit", (event) => {
  event.preventDefault();
  importParsedWorklogEntries();
});
closePdfImportModal.addEventListener("click", closePdfImportModalDialog);
pdfImportModal.addEventListener("click", (event) => {
  if (event.target === pdfImportModal || event.target.closest("[data-pdf-import-cancel]")) {
    closePdfImportModalDialog();
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
  const isWeekCopy = tagCopyPeriod === "week";
  const isCustomMonthCopy = tagCopyPeriod === "custom-month";
  let targetMonthStart = null;
  let periodLabel = "다음 주";

  if (!isWeekCopy) {
    const targetMonthValue = isCustomMonthCopy
      ? tagCopyTargetMonth.value
      : toISODate(addMonths(currentMonthStart, 1)).slice(0, 7);
    if (!targetMonthValue) {
      alert("복사할 달을 선택해주세요.");
      return;
    }
    if (targetMonthValue === toISODate(currentMonthStart).slice(0, 7)) {
      alert("현재 달과 다른 달을 선택해주세요.");
      return;
    }
    targetMonthStart = parseISODate(`${targetMonthValue}-01`);
    periodLabel = isCustomMonthCopy ? formatMonthKey(targetMonthValue) : "다음 달";
  }

  const selectedTags = new Set(
    [...copyTagChoices.querySelectorAll("input:checked")].map((input) => normalizeTag(input.value))
  );

  if (selectedTags.size === 0) {
    alert(`${periodLabel}로 복사할 태그를 하나 이상 선택해주세요.`);
    return;
  }

  const sourceShifts = getTagCopySourceShifts(tagCopyPeriod);
  const copied = sourceShifts
    .filter((shift) => selectedTags.has(getShiftTag(shift)))
    .map((shift) => makeShift(
      shift.title,
      getShiftTag(shift),
      isWeekCopy
        ? toISODate(addDays(parseISODate(shift.date), 7))
        : moveDateToMonth(shift.date, targetMonthStart),
      shift.start,
      shift.end
    ));

  if (copied.length === 0) {
    alert(`선택한 태그에 해당하는 이번 ${isWeekCopy ? "주" : "달"} 일정이 없습니다.`);
    return;
  }

  if (!confirmTimetableConflicts(copied, "복사")) return;

  shifts = [...shifts, ...copied];
  selectedShiftId = null;
  saveShifts();
  closeTagCopyModalDialog();
  if (isWeekCopy) {
    currentWeekStart = addDays(currentWeekStart, 7);
    currentMonthStart = startOfMonth(currentWeekStart);
  } else {
    currentMonthStart = targetMonthStart;
    currentWeekStart = startOfWeek(currentMonthStart);
  }
  render();
  alert(`${copied.length}건의 일정을 ${periodLabel}로 복사했습니다.`);
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

const monthTagModal = document.querySelector("#monthTagModal");
let renamingMonthTag = null;
const tagManagerModal = document.querySelector("#tagManagerModal");
function renderTagManager() {
  document.querySelector("#tagManagerList").innerHTML = getKnownTags().map(tag => {
    const count = shifts.filter(s => getShiftTag(s) === tag).length;
    return `<div class="tag-manager-row"><div><strong>${escapeHtml(tag)}</strong><small>일정 ${count}개</small></div>${tag === DEFAULT_TAG ? '<span>기본 태그</span>' : `<div class="month-tag-actions"><button type="button" class="secondary" data-month-tag-edit="${escapeHtml(tag)}" aria-label="${escapeHtml(tag)} 이름 수정">수정</button><button type="button" class="action-button delete-button" data-month-tag-delete="${escapeHtml(tag)}" aria-label="${escapeHtml(tag)} 삭제">삭제</button></div>`}</div>`;
  }).join('');
}
function closeTagManager() { tagManagerModal.classList.add('hidden'); document.querySelector('#openTagManager').focus(); }
document.querySelector('#openTagManager').addEventListener('click', () => { renderTagManager(); tagManagerModal.classList.remove('hidden'); document.querySelector('#closeTagManager').focus(); });
document.querySelector('#closeTagManager').addEventListener('click', closeTagManager);
document.querySelector('#doneTagManager').addEventListener('click', closeTagManager);
tagManagerModal.addEventListener('click', event => { if (event.target === tagManagerModal) closeTagManager(); });
tagManagerModal.addEventListener('keydown', event => {
  if (event.key === 'Escape') { event.stopPropagation(); closeTagManager(); }
  if (event.key === 'Tab') {
    const first = document.querySelector('#closeTagManager'), last = document.querySelector('#doneTagManager');
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
});
function closeMonthTagDialog() {
  monthTagModal.classList.add("hidden");
  if (renamingMonthTag !== null) {
    renderTagManager(); tagManagerModal.classList.remove('hidden'); document.querySelector('#closeTagManager').focus();
  } else document.querySelector("#openMonthTagModal").focus();
}
document.querySelector("#openMonthTagModal").addEventListener("click", () => {
  renamingMonthTag = null;
  document.querySelector("#monthTagModalTitle").textContent = "태그 생성";
  document.querySelector('#monthTagForm button[type="submit"]').textContent = "생성";
  document.querySelector("#monthTagForm").reset();
  document.querySelector("#monthTagMessage").textContent = "";
  monthTagModal.classList.remove("hidden");
  document.querySelector("#monthTagName").focus();
});
document.querySelector("#closeMonthTagModal").addEventListener("click", closeMonthTagDialog);
document.querySelector("#cancelMonthTagModal").addEventListener("click", closeMonthTagDialog);
monthTagModal.addEventListener("click", event => { if (event.target === monthTagModal) closeMonthTagDialog(); });
monthTagModal.addEventListener("keydown", event => {
  if (event.key === "Escape") { event.stopPropagation(); closeMonthTagDialog(); }
  if (event.key === "Tab") {
    const first = document.querySelector("#closeMonthTagModal");
    const last = document.querySelector('#monthTagForm button[type="submit"]');
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
});
document.querySelector("#monthTagForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const input = document.querySelector("#monthTagName");
  const name = input.value.trim();
  const message = document.querySelector("#monthTagMessage");
  if (!name) { message.textContent = "태그 이름을 입력해주세요."; input.focus(); return; }
  const exists = getKnownTags().includes(name);
  if (renamingMonthTag === name) { closeMonthTagDialog(); return; }
  if (exists) { message.textContent = "이미 등록된 태그입니다. 다른 이름을 입력해주세요."; input.focus(); return; }
  if (renamingMonthTag) {
    renameTag(renamingMonthTag, name);
  } else {
    Object.defineProperty(tagColors, name, { value: getDefaultTagColor(name), enumerable: true, configurable: true, writable: true });
    saveTagColors();
  }
  render();
  closeMonthTagDialog();
  input.value = "";
  const target = [...monthSummary.querySelectorAll("[data-tag-target]")].find(item => item.dataset.tagTarget === name);
  if (renamingMonthTag === null) target?.focus();
});

document.querySelector('#tagManagerList').addEventListener("click", event => {
  const remove = event.target.closest("[data-month-tag-delete]");
  if (remove) { deleteTag(remove.dataset.monthTagDelete); renderTagManager(); document.querySelector('#closeTagManager').focus(); return; }
  const edit = event.target.closest("[data-month-tag-edit]");
  if (!edit) return;
  renamingMonthTag = edit.dataset.monthTagEdit;
  tagManagerModal.classList.add('hidden');
  document.querySelector("#monthTagModalTitle").textContent = "태그명 수정";
  document.querySelector('#monthTagForm button[type="submit"]').textContent = "저장";
  document.querySelector("#monthTagMessage").textContent = "연결된 일정과 목표 시간·식사시간 설정에 함께 반영됩니다.";
  const input = document.querySelector("#monthTagName");
  input.value = renamingMonthTag;
  monthTagModal.classList.remove("hidden"); input.focus(); input.select();
});

monthSummary.addEventListener("change", (event) => {
  const input = event.target.closest("[data-tag-target]");
  if (!input) return;
  if (!input.checkValidity()) { input.reportValidity(); return; }
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
  if (event.key === "Escape" && !pdfImportModal.classList.contains("hidden")) {
    closePdfImportModalDialog();
    return;
  }
  if (event.key === "Escape" && !tagCopyModal.classList.contains("hidden")) {
    closeTagCopyModalDialog();
    return;
  }
  if (event.key === "Escape" && !timetableModal.classList.contains("hidden")) {
    closeTimetableModalDialog();
    return;
  }
  if (!editModal.classList.contains("hidden") || !copyModal.classList.contains("hidden") || !pdfImportModal.classList.contains("hidden") || !tagCopyModal.classList.contains("hidden") || !timetableModal.classList.contains("hidden")) return;
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

  const moved = { ...shift, date: body.dataset.date, start: minutesToTime(target.start), end: minutesToTime(target.end) };
  if (!confirmTimetableConflicts([moved], "이동")) return;

  shifts = shifts.map((item) => (
    item.id === id
      ? moved
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
    const resized = shifts.find((item) => item.id === resizingShift.id);
    const wasChanged = resized && (
      timeToMinutes(resized.start) !== resizingShift.originalStart
      || timeToMinutes(resized.end) !== resizingShift.originalEnd
    );
    if (wasChanged && !confirmTimetableConflicts([resized], "시간 변경")) {
      shifts = shifts.map((item) => item.id === resizingShift.id
        ? { ...item, start: minutesToTime(resizingShift.originalStart), end: minutesToTime(resizingShift.originalEnd) }
        : item);
    }
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
  const created = makeShift(title, tag, creatingShift.date, minutesToTime(start), minutesToTime(end));
  if (!confirmTimetableConflicts([created], "등록")) {
    creatingShift = null;
    clearCreatePreview();
    render();
    return;
  }
  shifts.push(created);
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
  lastActivityPingAt = Date.now();

  storageKeys = makeStorageKeys(currentSession.username);
  hiddenCalendarTags = loadHiddenCalendarTags();
  updateToolbarForSession(currentSession);
  migrateLegacyStorage(currentSession);
  const [serverRecord, loadedSemesters] = await Promise.all([
    loadServerCalendarData(),
    loadSemesterSettings()
  ]);
  semesters = loadedSemesters;
  const localData = readLocalCalendarData();
  const initialData = serverRecord.exists ? serverRecord.data : localData;
  applyCalendarData(initialData);
  if (migrateLegacyTimetableEntries()) saveTimetable();
  await ensurePublicHolidaysForVisibleDates();
  if (!serverRecord.exists && hasCalendarData(localData)) {
    queueCalendarDataSave();
  }
  selectedShiftId = null;
  ensureTagColor(DEFAULT_TAG);
  saveTagColors();
  render();
  renderTagControls();
}

function recordCurrentAccess() {
  if (!currentSession) return;
  const now = Date.now();
  if (now - lastActivityPingAt < 60_000) return;
  lastActivityPingAt = now;
  void fetch("/api/activity", {
    method: "POST",
    keepalive: true
  }).catch(() => {
    lastActivityPingAt = 0;
  });
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
  accountName.textContent = session.name || session.username;
  accountGreeting.hidden = false;
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

async function loadSemesterSettings() {
  try {
    const response = await fetch("/api/semesters", {
      headers: {
        Accept: "application/json"
      }
    });
    if (!response.ok) throw new Error("semesters request failed");
    const result = await response.json();
    return (result.semesters || []).map(normalizeSemester).filter((semester) => semester.id);
  } catch {
    return [];
  }
}

async function ensurePublicHolidaysForVisibleDates() {
  const years = getVisibleCalendarYears();
  const results = await Promise.all(years.map(loadPublicHolidayYear));
  return results.some(Boolean);
}

async function loadPublicHolidayYear(year) {
  const maximumYear = new Date().getFullYear() + 1;
  if (
    year < 2004
    || year > maximumYear
    || loadedPublicHolidayYears.has(year)
    || failedPublicHolidayYears.has(year)
    || pendingPublicHolidayYears.has(year)
  ) {
    return false;
  }

  pendingPublicHolidayYears.add(year);
  updatePublicHolidayStatus();
  try {
    const response = await fetch(`/api/public-holidays?year=${year}`, {
      headers: {
        Accept: "application/json"
      }
    });
    if (!response.ok) throw new Error("public holiday request failed");
    const result = await response.json();
    (result.holidays || []).forEach((holiday) => {
      if (holiday?.date && holiday?.name) {
        publicHolidays.set(String(holiday.date), String(holiday.name));
      }
    });
    loadedPublicHolidayYears.add(year);
    return true;
  } catch {
    failedPublicHolidayYears.add(year);
    return false;
  } finally {
    pendingPublicHolidayYears.delete(year);
    updatePublicHolidayStatus();
  }
}

function getVisibleCalendarYears() {
  const monthDays = getMonthGridDays(currentMonthStart);
  return [...new Set([
    currentWeekStart.getFullYear(),
    addDays(currentWeekStart, 6).getFullYear(),
    monthDays[0].getFullYear(),
    monthDays.at(-1).getFullYear()
  ])];
}

function updatePublicHolidayStatus() {
  const visibleYears = getVisibleCalendarYears();
  const maximumYear = new Date().getFullYear() + 1;
  if (visibleYears.some((year) => year < 2004 || year > maximumYear)) {
    publicHolidayStatus.textContent = `국가공휴일 자동 조회는 2004-${maximumYear}년을 지원합니다.`;
    publicHolidayStatus.classList.add("error");
    return;
  }
  if (visibleYears.some((year) => pendingPublicHolidayYears.has(year))) {
    publicHolidayStatus.textContent = "대한민국 국가공휴일을 불러오는 중입니다.";
    publicHolidayStatus.classList.remove("error");
    return;
  }
  if (visibleYears.some((year) => failedPublicHolidayYears.has(year))) {
    publicHolidayStatus.textContent = "국가공휴일을 불러오지 못했습니다. 수동 휴일 지정은 계속 사용할 수 있습니다.";
    publicHolidayStatus.classList.add("error");
    return;
  }
  publicHolidayStatus.textContent = "대한민국 국가공휴일 자동 적용 중 · 한국천문연구원 공공데이터";
  publicHolidayStatus.classList.remove("error");
}

function updateSemesterStatus() {
  const isConfigured = semesters.length > 0;
  const today = toISODate(new Date());
  const active = semesters.find((semester) => semester.startDate <= today && today <= semester.endDate);
  semesterStatus.classList.toggle("inactive", !isConfigured);
  manageTimetable.disabled = !isConfigured;
  semesterStatus.textContent = isConfigured
    ? `등록 학기 ${semesters.length}개${active ? ` · 현재 ${active.name}` : ""} · 내 수업 ${timetable.length}개`
    : "관리자가 학기를 등록하면 시간표를 등록할 수 있습니다.";
}

function makeStorageKeys(username) {
  const userKey = encodeURIComponent(String(username || "anonymous").trim().toLowerCase());
  const prefix = `worklog-calendar-prototype:${userKey}`;
  return {
    holidays: `${prefix}:holidays`,
    weekendWorkdays: `${prefix}:weekend-workdays`,
    shifts: `${prefix}:shifts`,
    tagColors: `${prefix}:tag-colors`,
    tagMeals: `${prefix}:tag-meals`,
    tagTargets: `${prefix}:tag-targets`,
    timetable: `${prefix}:timetable`,
    hiddenCalendarTags: `${prefix}:hidden-calendar-tags`,
    weekClipboard: `${prefix}:week-clipboard`
  };
}

function readLocalCalendarData() {
  return {
    holidays: loadJsonFromStorage(storageKeys.holidays, []),
    weekendWorkdays: loadJsonFromStorage(storageKeys.weekendWorkdays, []),
    shifts: loadJsonFromStorage(storageKeys.shifts, []),
    tagColors: loadJsonFromStorage(storageKeys.tagColors, {}),
    tagMealSettings: loadJsonFromStorage(storageKeys.tagMeals, {}),
    tagTargetMinutes: loadJsonFromStorage(storageKeys.tagTargets, {}),
    timetable: loadJsonFromStorage(storageKeys.timetable, []),
    weekClipboard: loadJsonFromStorage(storageKeys.weekClipboard, [])
  };
}

function applyCalendarData(data) {
  const normalized = normalizeCalendarData(data);
  shifts = normalized.shifts;
  tagColors = normalized.tagColors;
  holidays = new Set(normalized.holidays);
  weekendWorkdays = new Set(normalized.weekendWorkdays);
  tagTargetMinutes = normalized.tagTargetMinutes;
  tagMealSettings = normalized.tagMealSettings;
  timetable = normalized.timetable;
  writeLocalCalendarData(normalized);
}

function writeLocalCalendarData(data) {
  localStorage.setItem(storageKeys.holidays, JSON.stringify(data.holidays || []));
  localStorage.setItem(storageKeys.weekendWorkdays, JSON.stringify(data.weekendWorkdays || []));
  localStorage.setItem(storageKeys.shifts, JSON.stringify(data.shifts || []));
  localStorage.setItem(storageKeys.tagColors, JSON.stringify(data.tagColors || {}));
  localStorage.setItem(storageKeys.tagMeals, JSON.stringify(data.tagMealSettings || {}));
  localStorage.setItem(storageKeys.tagTargets, JSON.stringify(data.tagTargetMinutes || {}));
  localStorage.setItem(storageKeys.timetable, JSON.stringify(data.timetable || []));
  localStorage.setItem(storageKeys.weekClipboard, JSON.stringify(data.weekClipboard || []));
}

function getCurrentCalendarData() {
  return {
    holidays: [...holidays],
    weekendWorkdays: [...weekendWorkdays],
    shifts,
    tagColors,
    tagMealSettings,
    tagTargetMinutes,
    timetable,
    weekClipboard: loadWeekClipboard()
  };
}

function getEmptyCalendarData() {
  return {
    holidays: [],
    weekendWorkdays: [],
    shifts: [],
    tagColors: {},
    tagMealSettings: {},
    tagTargetMinutes: {},
    timetable: [],
    weekClipboard: []
  };
}

function normalizeCalendarData(data) {
  const source = data && typeof data === "object" && !Array.isArray(data) ? data : {};
  return {
    holidays: Array.isArray(source.holidays) ? source.holidays : [],
    weekendWorkdays: Array.isArray(source.weekendWorkdays) ? source.weekendWorkdays : [],
    shifts: Array.isArray(source.shifts) ? source.shifts : [],
    tagColors: isPlainObject(source.tagColors) ? source.tagColors : {},
    tagMealSettings: isPlainObject(source.tagMealSettings) ? source.tagMealSettings : {},
    tagTargetMinutes: isPlainObject(source.tagTargetMinutes) ? source.tagTargetMinutes : {},
    timetable: Array.isArray(source.timetable) ? source.timetable.map(normalizeTimetableEntry).filter(Boolean) : [],
    weekClipboard: Array.isArray(source.weekClipboard) ? source.weekClipboard : []
  };
}

function hasCalendarData(data) {
  const normalized = normalizeCalendarData(data);
  return normalized.shifts.length > 0
    || normalized.holidays.length > 0
    || normalized.weekendWorkdays.length > 0
    || normalized.weekClipboard.length > 0
    || Object.keys(normalized.tagColors).length > 0
    || Object.keys(normalized.tagMealSettings).length > 0
    || Object.keys(normalized.tagTargetMinutes).length > 0
    || normalized.timetable.length > 0;
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

function normalizeSemester(value) {
  const source = isPlainObject(value) ? value : {};
  return {
    endDate: String(source.endDate || ""),
    id: String(source.id || ""),
    name: String(source.name || "").trim(),
    startDate: String(source.startDate || "")
  };
}

function normalizeTimetableEntry(entry) {
  if (!isPlainObject(entry)) return null;
  const dayOfWeek = Number(entry.dayOfWeek);
  const start = String(entry.start || "");
  const end = String(entry.end || "");
  const title = String(entry.title || "").trim();
  if (!Number.isInteger(dayOfWeek) || dayOfWeek < 1 || dayOfWeek > 7 || !title || !start || !end) return null;
  if (timeToMinutes(end) <= timeToMinutes(start)) return null;
  const normalized = {
    dayOfWeek,
    end,
    id: String(entry.id || makeId()),
    semesterId: String(entry.semesterId || ""),
    start,
    title
  };
  ["courseCode", "professor", "room", "sourceCourseId"].forEach((key) => {
    const value = String(entry[key] || "").trim();
    if (value) normalized[key] = value;
  });
  return normalized;
}

function migrateLegacyTimetableEntries() {
  if (timetable.every((entry) => entry.semesterId) || semesters.length === 0) return false;
  const today = toISODate(new Date());
  const fallbackSemester = semesters.find((semester) => semester.startDate <= today && today <= semester.endDate) || semesters[0];
  timetable = timetable.map((entry) => entry.semesterId ? entry : { ...entry, semesterId: fallbackSemester.id });
  return true;
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
  const visibleWeekShifts = weekShifts.filter(isCalendarTagVisible);
  const visibleOverlapIds = getOverlapIds(getCountedShifts(visibleWeekShifts));

  weekLabel.textContent = `${formatDate(currentWeekStart)} - ${formatDate(weekEnd)}`;
  pasteWeek.disabled = loadWeekClipboard().length === 0;
  renderSummary(countedShifts, overlapIds);
  renderMealSettings();
  renderMonthSummary(currentWeekStart);
  renderTagSummary(countedShifts);
  renderShiftList(weekShifts, overlapIds);
  renderCalendar(visibleWeekShifts, visibleOverlapIds);
  renderMonthCalendar();
  renderCalendarTagFilters();
  renderTagControls();
  updatePublicHolidayStatus();
  updateSemesterStatus();
  void ensurePublicHolidaysForVisibleDates().then((changed) => {
    if (changed) render();
  });
}

function getWeekShifts(weekStart) {
  const weekEnd = addDays(weekStart, 6);
  return shifts
    .filter((shift) => shift.date >= toISODate(weekStart) && shift.date <= toISODate(weekEnd))
    .sort((a, b) => `${a.date} ${a.start}`.localeCompare(`${b.date} ${b.start}`));
}

function getMonthShifts(monthStart) {
  const monthKey = toISODate(startOfMonth(monthStart)).slice(0, 7);
  return shifts
    .filter((shift) => shift.date.startsWith(monthKey))
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
    const totals = new Map(getTagTotals(monthShifts));
    const tagTotals = getKnownTags().map(tag => [tag, totals.get(tag) || 0]);
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
          목표 시간
          <input type="number" min="0" step="0.25" aria-label="${escapeHtml(tag)} 목표 시간" value="${target / 60}" data-tag-target="${escapeHtml(tag)}">
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
      const classConflict = getTimetableConflicts([shift])[0];
      item.classList.toggle("overlap", overlapIds.has(shift.id));
      item.classList.toggle("class-conflict", Boolean(classConflict));
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
          : `${formatDate(parseISODate(shift.date))} ${shift.start}-${shift.end} · 자동 식사차감 ${formatDuration(getMealDeductionMinutes(shift))} · 실근무 ${formatDuration(getNetMinutes(shift))}${classConflict ? ` · 수업 겹침: ${classConflict.entry.title}` : ""}`;
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
    const holidayInfo = getHolidayInfo(iso);
    const holiday = Boolean(holidayInfo);
    const lockedHoliday = holidayInfo?.type === "public";
    const weekendOverride = !holiday && isWeekendDate(iso) && weekendWorkdays.has(iso);
    const holidayName = holidayInfo?.type === "public" ? holidayInfo.name : "";
    const holidayLabel = holidayInfo?.type === "public"
      ? "국가공휴일"
      : holidayInfo?.type === "weekend"
        ? "주말"
        : weekendOverride
          ? "주말 복원"
          : holidayInfo?.type === "manual"
            ? "휴일 해제"
            : "휴일 지정";
    const holidayTitle = holidayInfo?.type === "public"
      ? "국가공휴일은 자동으로 적용됩니다."
      : holidayInfo?.type === "weekend"
        ? "클릭하면 주말 휴일 처리를 해제합니다."
        : weekendOverride
          ? "클릭하면 주말 휴일 처리를 다시 적용합니다."
          : "";
    const dayShifts = weekShifts.filter((shift) => shift.date === iso);
    const dayClasses = getClassesForDate(iso);
    const countedDayShifts = holiday ? [] : dayShifts;
    const column = document.createElement("article");
    column.className = `day-column${holiday ? " holiday" : ""}`;
    column.innerHTML = `
      <header class="day-head">
        <strong>${dayNames[index]}</strong>
        <span>${formatDate(date)}</span>
        <div class="holiday-row">
          ${holidayName ? `<span class="holiday-name" title="${escapeHtml(holidayName)}">${escapeHtml(holidayName)}</span>` : ""}
          <button type="button" class="holiday-toggle${holiday ? " active" : ""}${lockedHoliday ? " automatic" : ""}" data-holiday-toggle="${iso}"${lockedHoliday ? " disabled" : ""}${holidayTitle ? ` title="${holidayTitle}"` : ""}>${holidayLabel}</button>
        </div>
        <div class="day-total">실근무 ${formatDuration(countedDayShifts.reduce((sum, shift) => sum + getNetMinutes(shift), 0))}</div>
      </header>
      <div class="day-body"></div>
    `;

    const body = column.querySelector(".day-body");
    body.dataset.date = iso;
    renderTimeLabels(body);
    dayClasses.forEach((entry) => body.append(makeTimetableBlock(entry)));
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
    const dayShifts = getDayShifts(iso).filter(isCalendarTagVisible);
    const dayClasses = getClassesForDate(iso);
    const holidayInfo = getHolidayInfo(iso);
    const holiday = Boolean(holidayInfo);
    const monthHolidayLabel = holidayInfo?.type === "public"
      ? holidayInfo.name
      : holidayInfo?.type === "weekend"
        ? "주말"
        : "";
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
      ${monthHolidayLabel ? `<span class="month-holiday-name">${escapeHtml(monthHolidayLabel)}</span>` : ""}
      ${dayClasses.length > 0 ? `<span class="month-class-count">수업 ${dayClasses.length}개</span>` : ""}
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
  chip.classList.toggle("class-conflict", getTimetableConflicts([shift]).length > 0);
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

  const moved = { ...shift, date: targetDate };
  if (!confirmTimetableConflicts([moved], "이동")) return;

  shifts = shifts.map((item) => (
    item.id === id ? moved : item
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

function makeTimetableBlock(entry) {
  const start = timeToMinutes(entry.start);
  const end = timeToMinutes(entry.end);
  if (end <= VIEW_START_MINUTES || start >= VIEW_END_MINUTES) {
    return document.createDocumentFragment();
  }
  const visibleStart = Math.max(start, VIEW_START_MINUTES);
  const visibleEnd = Math.min(end, VIEW_END_MINUTES);
  const block = document.createElement("div");
  block.className = "timetable-block";
  block.style.top = `${((visibleStart - VIEW_START_MINUTES) / 60) * HOUR_HEIGHT}px`;
  block.style.height = `${Math.max(((visibleEnd - visibleStart) / 60) * HOUR_HEIGHT, 24)}px`;
  block.title = `${entry.title} ${entry.start}-${entry.end}`;
  block.innerHTML = `<strong>${escapeHtml(entry.title)}</strong><span>${escapeHtml(entry.start)}-${escapeHtml(entry.end)}</span>`;
  return block;
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
  block.classList.toggle("class-conflict", getTimetableConflicts([shift]).length > 0);
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
  return Boolean(getHolidayInfo(date));
}

function getHolidayInfo(date) {
  if (publicHolidays.has(date)) {
    return { automatic: true, name: publicHolidays.get(date), type: "public" };
  }
  if (holidays.has(date)) {
    return { automatic: false, name: "", type: "manual" };
  }
  if (isWeekendDate(date) && !weekendWorkdays.has(date)) {
    return { automatic: true, name: "주말", type: "weekend" };
  }
  return null;
}

function isWeekendDate(date) {
  const day = parseISODate(date).getDay();
  return day === 0 || day === 6;
}

function getClassesForDate(date) {
  const applicableSemesterIds = new Set(semesters
    .filter((semester) => semester.startDate <= date && date <= semester.endDate)
    .map((semester) => semester.id));
  if (applicableSemesterIds.size === 0) return [];
  const browserDay = parseISODate(date).getDay();
  const dayOfWeek = browserDay === 0 ? 7 : browserDay;
  return timetable.filter((entry) => entry.dayOfWeek === dayOfWeek && applicableSemesterIds.has(entry.semesterId));
}

function getTimetableConflicts(items) {
  return items.flatMap((item) => getClassesForDate(item.date)
    .filter((entry) => timeToMinutes(item.start) < timeToMinutes(entry.end) && timeToMinutes(entry.start) < timeToMinutes(item.end))
    .map((entry) => ({ entry, item })));
}

function confirmTimetableConflicts(items, actionLabel) {
  const conflicts = getTimetableConflicts(items);
  if (conflicts.length === 0) return true;
  const examples = [...new Set(conflicts.slice(0, 3).map(({ entry, item }) => `${item.date} ${entry.title}(${entry.start}-${entry.end})`))];
  const suffix = conflicts.length > examples.length ? ` 외 ${conflicts.length - examples.length}건` : "";
  return confirm(`수업 시간과 겹치는 일정이 ${conflicts.length}건 있습니다.\n${examples.join("\n")}${suffix}\n\n그래도 ${actionLabel}할까요?`);
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

function openTimetableModalDialog() {
  if (semesters.length === 0) {
    alert("관리자가 학기를 먼저 등록해야 합니다.");
    return;
  }
  renderTimetableSemesterOptions();
  resetTimetableEntryForm();
  renderTimetableList();
  selectedCatalogCourseIds.clear();
  resetTimetableCourseFilters();
  timetableCourseCatalog = [];
  timetableCatalogList.innerHTML = '<div class="empty-state compact">수업 목록을 불러오는 중입니다.</div>';
  setTimetableCatalogMessage("");
  timetableModal.classList.remove("hidden");
  void loadTimetableCourseCatalog();
  timetableCourseSearch.focus();
}

function closeTimetableModalDialog() {
  timetableModal.classList.add("hidden");
  timetableEntryForm.reset();
}

function resetTimetableEntryForm() {
  timetableEntryForm.reset();
  timetableEntryId.value = "";
  timetableDayOfWeek.value = "1";
  timetableStart.value = "09:00";
  timetableEnd.value = "10:00";
  timetableSemester.value = getDefaultTimetableSemesterId();
  timetableSubmit.textContent = "수업 추가";
  cancelTimetableEdit.classList.add("hidden");
  updateTimetableSemesterSummary();
}

function renderTimetableSemesterOptions() {
  timetableSemester.innerHTML = semesters.map((semester) => (
    `<option value="${escapeHtml(semester.id)}">${escapeHtml(semester.name)} (${escapeHtml(semester.startDate)} ~ ${escapeHtml(semester.endDate)})</option>`
  )).join("");
}

function getDefaultTimetableSemesterId() {
  const visibleDate = toISODate(currentWeekStart);
  const today = toISODate(new Date());
  return semesters.find((semester) => semester.startDate <= visibleDate && visibleDate <= semester.endDate)?.id
    || semesters.find((semester) => semester.startDate <= today && today <= semester.endDate)?.id
    || semesters[0]?.id
    || "";
}

function updateTimetableSemesterSummary() {
  const semester = semesters.find((item) => item.id === timetableSemester.value);
  timetableSemesterSummary.textContent = semester
    ? `${semester.name} · ${formatDate(parseISODate(semester.startDate))} - ${formatDate(parseISODate(semester.endDate))}`
    : "적용할 학기를 선택해주세요.";
}

async function loadTimetableCourseCatalog() {
  const semesterId = timetableSemester.value;
  timetableCourseCatalog = [];
  timetableCatalogCount.textContent = "";
  setTimetableCatalogMessage("");
  timetableCatalogList.innerHTML = '<div class="empty-state compact">수업 목록을 불러오는 중입니다.</div>';
  updateCatalogSelectionButton();
  try {
    const response = await fetch(`/api/course-catalog?semesterId=${encodeURIComponent(semesterId)}`);
    if (!response.ok) throw new Error("course catalog request failed");
    const result = await response.json();
    if (semesterId !== timetableSemester.value) return;
    timetableCourseCatalog = Array.isArray(result.courses) ? result.courses : [];
    renderTimetableCourseFilterOptions();
    renderTimetableCourseCatalog();
  } catch {
    timetableCatalogList.innerHTML = '<div class="empty-state compact">수업 목록을 불러오지 못했습니다.</div>';
    setTimetableCatalogMessage("등록 수업 목록을 불러오지 못했습니다.", true);
  } finally {
    updateCatalogSelectionButton();
  }
}

function renderTimetableCourseCatalog() {
  const query = timetableCourseSearch.value.trim().toLocaleLowerCase("ko-KR");
  const department = timetableDepartmentFilter.value;
  const professor = timetableProfessorFilter.value;
  const selectedDay = Number(timetableDayFilter.value || 0);
  const courses = timetableCourseCatalog.filter((course) => (
    (!query || [course.title, course.code, course.professor, course.department]
      .some((value) => String(value || "").toLocaleLowerCase("ko-KR").includes(query)))
    && (!department || course.department === department)
    && (!professor || course.professor === professor)
    && (!selectedDay || course.meetings.some((meeting) => meeting.dayOfWeek === selectedDay))
  ));
  timetableCatalogCount.textContent = timetableCourseCatalog.length > 0
    ? `전체 ${timetableCourseCatalog.length}개 중 ${courses.length}개 표시`
    : "";
  if (timetableCourseCatalog.length === 0) {
    timetableCatalogList.innerHTML = '<div class="empty-state compact">이 학기에 등록된 공통 수업이 없습니다.</div>';
    updateCatalogSelectionButton();
    return;
  }
  if (courses.length === 0) {
    timetableCatalogList.innerHTML = '<div class="empty-state compact">검색 결과가 없습니다.</div>';
    updateCatalogSelectionButton();
    return;
  }
  timetableCatalogList.innerHTML = courses.map((course) => {
    const alreadyAdded = timetable.some((entry) => entry.semesterId === course.semesterId && entry.sourceCourseId === course.id);
    const selectedForAdd = selectedCatalogCourseIds.has(course.id);
    return `
      <label class="timetable-catalog-item${alreadyAdded || selectedForAdd ? " selected" : ""}">
        <input type="checkbox" data-catalog-course="${escapeHtml(course.id)}" ${alreadyAdded || selectedForAdd ? "checked" : ""} ${alreadyAdded ? "disabled" : ""}>
        <span>
          <strong>${escapeHtml(course.title)} <em>${escapeHtml(course.code)}</em></strong>
          <small>${escapeHtml(course.department)} · ${escapeHtml(course.professor || "교수 미지정")}</small>
          <small>${escapeHtml(formatCatalogMeetings(course.meetings))}</small>
        </span>
      </label>
    `;
  }).join("");
  updateCatalogSelectionButton();
}

function updateCatalogSelectionButton() {
  const availableIds = new Set(timetableCourseCatalog.map((course) => course.id));
  const count = [...selectedCatalogCourseIds].filter((courseId) => availableIds.has(courseId)).length;
  addSelectedCourses.textContent = `선택한 수업 추가 (${count})`;
  addSelectedCourses.disabled = count === 0;
}

function renderTimetableCourseFilterOptions() {
  const department = timetableDepartmentFilter.value;
  const professor = timetableProfessorFilter.value;
  const departments = [...new Set(timetableCourseCatalog.map((course) => course.department).filter(Boolean))]
    .sort((left, right) => left.localeCompare(right, "ko-KR"));
  const professors = [...new Set(timetableCourseCatalog.map((course) => course.professor).filter(Boolean))]
    .sort((left, right) => left.localeCompare(right, "ko-KR"));

  timetableDepartmentFilter.innerHTML = '<option value="">전체 학과</option>'
    + departments.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join("");
  timetableProfessorFilter.innerHTML = '<option value="">전체 교수</option>'
    + professors.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join("");
  if (departments.includes(department)) timetableDepartmentFilter.value = department;
  if (professors.includes(professor)) timetableProfessorFilter.value = professor;

}

function resetTimetableCourseFilters() {
  timetableCourseSearch.value = "";
  timetableDepartmentFilter.value = "";
  timetableDayFilter.value = "";
  timetableProfessorFilter.value = "";
}

function formatCatalogMeetings(meetings) {
  return (meetings || []).map((meeting) => (
    `${dayNames[meeting.dayOfWeek - 1] || ""}요일 ${meeting.start}-${meeting.end}${meeting.room ? ` · ${meeting.room}` : ""}`
  )).join(" / ");
}

function setTimetableCatalogMessage(message, isError = false) {
  timetableCatalogMessage.textContent = message;
  timetableCatalogMessage.classList.toggle("hidden", !message);
  timetableCatalogMessage.classList.toggle("error", isError);
}

function renderTimetableList() {
  if (timetable.length === 0) {
    timetableList.innerHTML = '<div class="empty-state compact">등록된 수업이 없습니다.</div>';
    return;
  }
  timetableList.innerHTML = [...timetable]
    .sort(compareTimetableEntries)
    .map((entry) => `
      <article class="timetable-item">
        <div>
          <strong>${escapeHtml(entry.title)}</strong>
          <span>${escapeHtml(getSemesterName(entry.semesterId))} · ${dayNames[entry.dayOfWeek - 1]}요일 · ${escapeHtml(entry.start)}-${escapeHtml(entry.end)}${entry.room ? ` · ${escapeHtml(entry.room)}` : ""}${entry.professor ? ` · ${escapeHtml(entry.professor)}` : ""}</span>
        </div>
        <div class="item-actions">
          <button type="button" class="action-button edit-button" data-edit-class="${escapeHtml(entry.id)}">수정</button>
          <button type="button" class="action-button delete-button" data-delete-class="${escapeHtml(entry.id)}">삭제</button>
        </div>
      </article>
    `).join("");
}

function compareTimetableEntries(left, right) {
  return getSemesterOrder(left.semesterId) - getSemesterOrder(right.semesterId)
    || left.dayOfWeek - right.dayOfWeek
    || left.start.localeCompare(right.start)
    || left.title.localeCompare(right.title, "ko-KR");
}

function getSemesterName(semesterId) {
  return semesters.find((semester) => semester.id === semesterId)?.name || "학기 미지정";
}

function getSemesterOrder(semesterId) {
  const index = semesters.findIndex((semester) => semester.id === semesterId);
  return index === -1 ? semesters.length : index;
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

function openPdfImportModal() {
  pdfImportEntries = [];
  pdfImportForm.reset();
  pdfImportTag.value = inferDefaultImportTag();
  setPdfImportMessage("");
  renderPdfImportTagChoices();
  renderPdfImportPreview();
  pdfImportSubmit.disabled = true;
  pdfImportModal.classList.remove("hidden");
  pdfImportFile.focus();
}

function closePdfImportModalDialog() {
  pdfImportModal.classList.add("hidden");
  pdfImportEntries = [];
  pdfImportForm.reset();
  setPdfImportMessage("");
  renderPdfImportPreview();
}

async function parseSelectedWorklogPdf() {
  const file = pdfImportFile.files?.[0];
  pdfImportEntries = [];
  pdfImportSubmit.disabled = true;
  setPdfImportMessage("");

  if (!file) {
    renderPdfImportPreview();
    return;
  }

  const formData = new FormData();
  formData.append("file", file);
  pdfImportPreview.className = "pdf-import-preview empty-state compact";
  pdfImportPreview.textContent = "PDF 파일을 분석하는 중입니다.";

  try {
    const response = await fetch("/api/worklog-pdf/parse", {
      body: formData,
      method: "POST"
    });
    const result = await response.json();
    if (!response.ok) {
      setPdfImportMessage(result.error || "근무일지를 분석할 수 없습니다.");
      renderPdfImportPreview();
      return;
    }

    pdfImportEntries = result.entries || [];
    pdfImportSubmit.disabled = pdfImportEntries.length === 0;
    renderPdfImportPreview();
  } catch {
    setPdfImportMessage("근무일지를 분석할 수 없습니다.");
    renderPdfImportPreview();
  }
}

function importParsedWorklogEntries() {
  const tag = normalizeTag(pdfImportTag.value);
  if (pdfImportEntries.length === 0) {
    setPdfImportMessage("가져올 일정이 없습니다.");
    return;
  }

  ensureTagColor(tag);
  const imported = pdfImportEntries.map((entry) => makeShift(
    entry.title,
    tag,
    entry.date,
    entry.start,
    entry.end
  ));
  if (!confirmTimetableConflicts(imported, "가져오기")) return;
  shifts = [...shifts, ...imported];
  selectedShiftId = imported[0]?.id || null;
  if (imported[0]) {
    currentWeekStart = startOfWeek(parseISODate(imported[0].date));
    currentMonthStart = startOfMonth(parseISODate(imported[0].date));
  }
  saveTagColors();
  saveShifts();
  closePdfImportModalDialog();
  render();
  alert(`${imported.length}건의 근무일지를 가져왔습니다.`);
}

function renderPdfImportPreview() {
  if (pdfImportEntries.length === 0) {
    pdfImportPreview.className = "pdf-import-preview empty-state compact";
    pdfImportPreview.textContent = "PDF 파일을 선택하면 가져올 일정이 표시됩니다.";
    return;
  }

  pdfImportPreview.className = "pdf-import-preview";
  pdfImportPreview.innerHTML = `
    <div class="pdf-import-preview-head">
      <strong>${pdfImportEntries.length}건</strong>
      <span>${escapeHtml(pdfImportEntries[0].date)} - ${escapeHtml(pdfImportEntries.at(-1).date)}</span>
    </div>
    <div class="pdf-import-list">
      ${pdfImportEntries.map((entry) => `
        <article class="pdf-import-item">
          <strong>${escapeHtml(entry.date)} ${escapeHtml(entry.start)}-${escapeHtml(entry.end)}</strong>
          <span>${escapeHtml(entry.title)}</span>
        </article>
      `).join("")}
    </div>
  `;
}

function renderPdfImportTagChoices() {
  const currentTag = normalizeTag(pdfImportTag.value);
  pdfImportTagChoices.innerHTML = getKnownTags().map((tag) => {
    const color = getTagColor(tag);
    const selected = tag === currentTag ? " selected" : "";
    return `<button type="button" class="tag-choice${selected}" data-pdf-import-tag="${escapeHtml(tag)}" style="--tag-bg: ${color.bg}; --tag-border: ${color.border}; --tag-text: ${color.text};"><span>${escapeHtml(tag)}</span></button>`;
  }).join("");
}

function inferDefaultImportTag() {
  const tags = getKnownTags();
  return tags.find((tag) => tag.replace(/\s+/g, "").toLowerCase().includes("피지컬ai")) || tags[0] || DEFAULT_TAG;
}

function setPdfImportMessage(message) {
  pdfImportMessage.textContent = message;
  pdfImportMessage.classList.toggle("hidden", !message);
}

function openTagCopyModal(period = "week") {
  tagCopyPeriod = ["month", "custom-month"].includes(period) ? period : "week";
  const isWeekCopy = tagCopyPeriod === "week";
  const isCustomMonthCopy = tagCopyPeriod === "custom-month";
  const sourcePeriodLabel = isWeekCopy ? "이번 주" : "이번 달";
  const destinationLabel = isCustomMonthCopy ? "특정 달" : `다음 ${isWeekCopy ? "주" : "달"}`;
  const sourceShifts = getTagCopySourceShifts(tagCopyPeriod);
  if (sourceShifts.length === 0) {
    alert(`${destinationLabel}로 복사할 ${sourcePeriodLabel} 일정이 없습니다.`);
    return;
  }

  const tagCounts = new Map();
  sourceShifts.forEach((shift) => {
    const tag = getShiftTag(shift);
    tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
  });

  tagCopyModalTitle.textContent = `태그 ${destinationLabel.replace(" ", "")} 복사`;
  copyTagChoices.setAttribute("aria-label", `${destinationLabel}로 복사할 태그`);
  tagCopyTargetMonthField.classList.toggle("hidden", !isCustomMonthCopy);
  tagCopyTargetMonth.required = isCustomMonthCopy;
  tagCopyTargetMonth.value = isCustomMonthCopy
    ? toISODate(addMonths(currentMonthStart, 1)).slice(0, 7)
    : "";
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
  if (isCustomMonthCopy) {
    tagCopyTargetMonth.focus();
  } else {
    copyTagChoices.querySelector("input")?.focus();
  }
}

function getTagCopySourceShifts(period) {
  return period === "week" ? getWeekShifts(currentWeekStart) : getMonthShifts(currentMonthStart);
}

function closeTagCopyModalDialog() {
  tagCopyModal.classList.add("hidden");
  tagCopyForm.reset();
  tagCopyTargetMonthField.classList.add("hidden");
  tagCopyTargetMonth.required = false;
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
  Object.keys(tagTargetMinutes).forEach((tag) => tags.add(normalizeTag(tag)));
  return [...tags].sort((a, b) => a.localeCompare(b, "ko-KR"));
}

function renderCalendarTagFilters() {
  const tags = getKnownTags();
  calendarTagFilters.innerHTML = "";
  showAllCalendarTags.disabled = hiddenCalendarTags.size === 0;

  tags.forEach((tag) => {
    const color = getTagColor(tag);
    const label = document.createElement("label");
    label.className = "calendar-tag-filter";
    label.style.setProperty("--tag-bg", color.bg);
    label.style.setProperty("--tag-border", color.border);
    label.style.setProperty("--tag-text", color.text);
    label.innerHTML = `
      <input type="checkbox" data-calendar-tag-filter="${escapeHtml(tag)}"${hiddenCalendarTags.has(tag) ? "" : " checked"}>
      <span>${escapeHtml(tag)}</span>
    `;
    calendarTagFilters.append(label);
  });
}

function isCalendarTagVisible(shift) {
  return !hiddenCalendarTags.has(getShiftTag(shift));
}

function renameTag(oldTag, newTag) {
  if (oldTag === DEFAULT_TAG || getKnownTags().includes(newTag)) return;
  shifts = shifts.map(s => getShiftTag(s) === oldTag ? { ...s, tag: newTag } : s);
  for (const settings of [tagColors, tagTargetMinutes, tagMealSettings]) {
    if (Object.hasOwn(settings, oldTag)) {
      Object.defineProperty(settings, newTag, { value: settings[oldTag], enumerable: true, configurable: true, writable: true });
      delete settings[oldTag];
    }
  }
  if (!Object.hasOwn(tagColors, newTag)) Object.defineProperty(tagColors, newTag, { value:getDefaultTagColor(newTag), enumerable:true, configurable:true, writable:true });
  for (const set of [hiddenCalendarTags, collapsedTags]) { if (set.delete(oldTag)) set.add(newTag); }
  localStorage.setItem(storageKeys.weekClipboard, JSON.stringify(loadWeekClipboard().map(s => getShiftTag(s) === oldTag ? {...s, tag:newTag} : s)));
  if (editTag.value === oldTag) editTag.value = newTag;
  saveTagColors(); saveTagTargetMinutes(); saveTagMealSettings(); saveHiddenCalendarTags(); saveShifts();
}

function deleteTag(tag) {
  const normalized = normalizeTag(tag);
  if (normalized === DEFAULT_TAG) return;
  const count = shifts.filter(s => getShiftTag(s) === normalized).length;
  const warning = count ? `주의: '${normalized}' 태그에 일정 ${count}개가 있습니다.\n일정은 삭제하지 않고 '${DEFAULT_TAG}' 태그로 변경합니다. 식사시간 설정이 달라져 실근무시간이 바뀔 수 있습니다.\n` : '';
  if (!confirm(`${warning}'${normalized}' 태그와 목표 시간·식사시간 설정을 삭제할까요?`)) return;

  shifts = shifts.map((shift) => (
    getShiftTag(shift) === normalized ? { ...shift, tag: DEFAULT_TAG } : shift
  ));
  delete tagColors[normalized];
  delete tagTargetMinutes[normalized];
  delete tagMealSettings[normalized];
  hiddenCalendarTags.delete(normalized);
  collapsedTags.delete(normalized);
  localStorage.setItem(storageKeys.weekClipboard, JSON.stringify(loadWeekClipboard().map(s => getShiftTag(s) === normalized ? {...s, tag:DEFAULT_TAG} : s)));
  ensureTagColor(DEFAULT_TAG);
  editTag.value = DEFAULT_TAG;
  saveTagColors();
  saveTagTargetMinutes();
  saveTagMealSettings();
  saveHiddenCalendarTags();
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
    id: makeId(),
    title,
    tag: normalizeTag(tag),
    date,
    start,
    end
  };
}

function makeId() {
  return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
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

function moveDateToMonth(value, targetMonth) {
  const source = parseISODate(value);
  const normalizedTargetMonth = startOfMonth(targetMonth);
  const targetLastDay = new Date(
    normalizedTargetMonth.getFullYear(),
    normalizedTargetMonth.getMonth() + 1,
    0
  ).getDate();
  return toISODate(new Date(
    normalizedTargetMonth.getFullYear(),
    normalizedTargetMonth.getMonth(),
    Math.min(source.getDate(), targetLastDay)
  ));
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

function saveWeekendWorkdays() {
  localStorage.setItem(storageKeys.weekendWorkdays, JSON.stringify([...weekendWorkdays]));
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

function loadHiddenCalendarTags() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKeys.hiddenCalendarTags)) || [];
    return new Set(Array.isArray(saved) ? saved.map(normalizeTag) : []);
  } catch {
    return new Set();
  }
}

function saveHiddenCalendarTags() {
  localStorage.setItem(storageKeys.hiddenCalendarTags, JSON.stringify([...hiddenCalendarTags]));
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

function saveTimetable() {
  localStorage.setItem(storageKeys.timetable, JSON.stringify(timetable));
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
