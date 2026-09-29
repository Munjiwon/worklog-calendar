const assert = require("node:assert/strict");
const test = require("node:test");

const { normalizePublicHolidays } = require("../server");

test("normalizes and sorts Korean public holiday records", () => {
  assert.deepEqual(normalizePublicHolidays([
    { date: 20261005, name: "대체공휴일(개천절)" },
    { date: "20260101", name: "1월1일" },
    { date: 20261005, name: "추가 지정" },
    { date: "invalid", name: "잘못된 값" }
  ]), [
    { date: "2026-01-01", name: "1월1일" },
    { date: "2026-10-05", name: "대체공휴일(개천절) · 추가 지정" }
  ]);
});
