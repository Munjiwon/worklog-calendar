const assert = require("node:assert/strict");
const test = require("node:test");
const ExcelJS = require("exceljs");
const {
  normalizeCalendarData,
  parseCourseCatalogWorkbook,
  parseCourseSchedule
} = require("../server");

test("parses course schedule time and room", () => {
  assert.deepEqual(parseCourseSchedule("화5A-8B(13:00-17:00)(D2-520)"), [
    { dayOfWeek: 2, end: "17:00", room: "D2-520", start: "13:00" }
  ]);
});

test("imports the supplied course workbook shape", async () => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Sheet1");
  sheet.addRow(["학과", "과정", "교과", "과목-분반", "과목명", "세부전공", "학점", "시수", "직위", "교수", "인원", "개설시간 및 강의실"]);
  sheet.addRow(["컴퓨터소프트웨어학부", "학사", "전공필수", "109988-01", "C프로그래밍", "", 2, 4, "교수", "김미혜", 30, "월5A-8B(13:00-17:00)(D2-520)"]);
  const buffer = await workbook.xlsx.writeBuffer();

  const result = await parseCourseCatalogWorkbook(buffer, "semester-2026-2");

  assert.equal(result.courses.length, 1);
  assert.equal(result.skippedRows.length, 0);
  assert.equal(result.courses[0].code, "109988-01");
  assert.equal(result.courses[0].semesterId, "semester-2026-2");
  assert.deepEqual(result.courses[0].meetings, [
    { dayOfWeek: 1, end: "17:00", room: "D2-520", start: "13:00" }
  ]);
});

test("keeps catalog source metadata in user timetable entries", () => {
  const normalized = normalizeCalendarData({
    timetable: [{
      courseCode: "109988-01",
      dayOfWeek: 1,
      end: "17:00",
      id: "class-1",
      professor: "김미혜",
      room: "D2-520",
      semesterId: "semester-2026-2",
      sourceCourseId: "course-1",
      start: "13:00",
      title: "C프로그래밍"
    }]
  });

  assert.equal(normalized.timetable[0].sourceCourseId, "course-1");
  assert.equal(normalized.timetable[0].room, "D2-520");
  assert.equal(normalized.timetable[0].professor, "김미혜");
});
