const test = require("node:test");
const assert = require("node:assert/strict");

const {
  normalizeCalendarData,
  normalizeSemesterSetting,
  normalizeTimetableEntry
} = require("../server");

test("normalizes a valid timetable entry", () => {
  assert.deepEqual(normalizeTimetableEntry({
    dayOfWeek: "3",
    end: "11:45",
    id: "class-1",
    start: "10:15",
    title: " 인공지능개론 "
  }), {
    dayOfWeek: 3,
    end: "11:45",
    id: "class-1",
    start: "10:15",
    title: "인공지능개론"
  });
});

test("drops invalid timetable entries from calendar data", () => {
  const data = normalizeCalendarData({
    timetable: [
      { dayOfWeek: 1, end: "11:00", id: "valid", start: "10:00", title: "자료구조" },
      { dayOfWeek: 8, end: "11:00", start: "10:00", title: "잘못된 요일" },
      { dayOfWeek: 2, end: "09:00", start: "10:00", title: "잘못된 시간" }
    ]
  });

  assert.equal(data.timetable.length, 1);
  assert.equal(data.timetable[0].id, "valid");
});

test("normalizes semester settings and rejects malformed dates", () => {
  assert.deepEqual(normalizeSemesterSetting({
    endDate: "2026-12-18",
    name: " 2026학년도 2학기 ",
    startDate: "2026-09-01"
  }), {
    endDate: "2026-12-18",
    name: "2026학년도 2학기",
    startDate: "2026-09-01"
  });

  assert.equal(normalizeSemesterSetting({ startDate: "2026-02-30" }).startDate, "");
});
