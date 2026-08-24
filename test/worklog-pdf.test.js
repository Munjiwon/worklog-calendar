const assert = require("node:assert/strict");
const test = require("node:test");

const { parseWorklogEntries } = require("../server");

test("parses Korean OCR output with multiple time ranges", () => {
  const text = `
    26.07.02.
    09:00~12:00
    13:00~18:00
    9 지 컨트롤러 기본 구조 구현
    26.07.14.
    09:00~12:00
    실시간 상태 네이터 생성 모듈 구현
    26.07.23.
    09:00~12:00
    13:00~14:00
    제어 명령 해 석 실 행 모듈 구현
    26.07.30.
    09;00~12:00
    데이터 동기화 모듈 구현
    ※ 점 심 식사 시간, 저 녁 식사 시간은 근무시간에서 제외
  `;

  assert.deepEqual(parseWorklogEntries(text), [
    {
      date: "2026-07-02",
      end: "12:00",
      start: "09:00",
      title: "엣지 컨트롤러 기본 구조 구현"
    },
    {
      date: "2026-07-02",
      end: "18:00",
      start: "13:00",
      title: "엣지 컨트롤러 기본 구조 구현"
    },
    {
      date: "2026-07-14",
      end: "12:00",
      start: "09:00",
      title: "실시간 상태 데이터 생성 모듈 구현"
    },
    {
      date: "2026-07-23",
      end: "12:00",
      start: "09:00",
      title: "제어 명령 해석·실행 모듈 구현"
    },
    {
      date: "2026-07-23",
      end: "14:00",
      start: "13:00",
      title: "제어 명령 해석·실행 모듈 구현"
    },
    {
      date: "2026-07-30",
      end: "12:00",
      start: "09:00",
      title: "데이터 동기화 모듈 구현"
    }
  ]);
});

test("ignores invalid dates and time ranges", () => {
  const text = `
    26.02.30.
    09:00~12:00
    잘못된 날짜
    26.07.02.
    25:00~26:00
    잘못된 시간
  `;

  assert.deepEqual(parseWorklogEntries(text), []);
});
