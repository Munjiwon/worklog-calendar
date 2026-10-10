(function (root) {
  // Historical dates are commit dates, not verified production deployment dates.
  const releases = [
  {
    "version": "1.2.0",
    "date": "2026-10-10",
    "title": "태그 수정에서 색상 변경",
    "changes": [
      "태그 수정 창의 색상 변경에서 원하는 색상을 선택할 수 있습니다.",
      "선택한 색상은 바로 저장되어 달력과 태그 표시에 반영됩니다."
    ]
  },
  {
    "version": "1.1.0",
    "date": "2026-10-09",
    "title": "버전 기록 추가",
    "changes": [
      "로그인 화면과 캘린더에서 현재 버전과 업데이트 내역을 확인할 수 있습니다.",
      "과거 업로드 요청을 묶음별로 정리하고 확인 수준을 구분합니다."
    ]
  },
  {
    "version": "f352231",
    "date": "2026-10-08",
    "title": "연속 일정 우선 추천",
    "changes": [
      "점심·저녁시간 안에서 시작하는 추천을 제외했습니다.",
      "가능한 긴 연속 일정을 우선하고, 같은 길이면 이전 일정 패턴을 참고합니다."
    ],
    "historical": true,
    "status": "GitHub·Docker Hub 업로드 확인"
  },
  {
    "version": "2bd9959",
    "date": "2026-10-08",
    "title": "계정 설정과 달력 기준 정리",
    "changes": [
      "이메일·비밀번호 변경과 월 달력 시작 요일 선택을 추가했습니다.",
      "주간 근무시간은 항상 월요일~일요일로 계산합니다.",
      "브라우저 제목에서 프로토타입 문구를 제거했습니다."
    ],
    "historical": true,
    "status": "GitHub·Docker Hub 업로드 확인"
  },
  {
    "version": "5618fe8",
    "date": "2026-10-08",
    "title": "추천 모델 연결 변경",
    "changes": [
      "추천 모델을 Qwen3.5-9B로 변경했습니다.",
      "Kubernetes 배포 설정에 클러스터 내부 LLM Service 연결을 추가했습니다."
    ],
    "historical": true,
    "status": "GitHub·Docker Hub 업로드 확인"
  },
  {
    "version": "5673e76",
    "date": "2026-10-06",
    "title": "추천 등록 후 창 닫기",
    "changes": [
      "선택한 추천 일정을 적용하면 추천 창이 자동으로 닫힙니다."
    ],
    "historical": true,
    "status": "GitHub·Docker Hub 업로드 확인"
  },
  {
    "version": "5d0d743",
    "date": "2026-10-06",
    "title": "HTTP 환경 추천 등록 수정",
    "changes": [
      "IP 주소의 HTTP 접속 환경에서 추천 일정 등록이 실패하던 문제를 수정했습니다.",
      "조건이 바뀌어 등록할 수 없을 때 안내를 표시합니다."
    ],
    "historical": true,
    "status": "GitHub·Docker Hub 업로드 확인"
  },
  {
    "version": "93abd41",
    "date": "2026-10-05",
    "title": "추천 시간 표시 개선",
    "changes": [
      "추천 결과의 분 단위 표시를 시간·분 형태로 변경했습니다."
    ],
    "historical": true,
    "status": "GitHub·Docker Hub 업로드 확인"
  },
  {
    "version": "53fea74",
    "date": "2026-10-05",
    "title": "일정 추천과 태그 관리",
    "changes": [
      "태그·목표 시간·기간을 지정해 일정을 추천하고 선택한 결과를 등록할 수 있습니다.",
      "시작일 직전 4주·8주 일정 패턴 참고와 태그별 겹침 예외를 추가했습니다.",
      "추천 결과를 목록과 월 달력으로 확인할 수 있습니다.",
      "일정 없이 목표 시간을 설정하고 태그를 생성할 수 있습니다.",
      "태그 수정 창에서 이름을 바로 편집하고, 일정이 있는 태그 삭제 시 경고합니다."
    ],
    "historical": true,
    "status": "업로드 요청 기준 · 완료 기록 미확인"
  },
  {
    "version": "6131ac7",
    "date": "2026-10-01",
    "title": "첫 접속 안내 개선",
    "changes": [
      "로그인 화면에 시간 겹침 방지와 목표 근무시간 확인이라는 서비스 목적을 안내합니다.",
      "설명과 로그인 영역의 비율을 조정했습니다."
    ],
    "historical": true,
    "status": "업로드 요청 기준 · 완료 기록 미확인"
  },
  {
    "version": "ffbca3d",
    "date": "2026-09-30",
    "title": "수업 검색과 선택 개선",
    "changes": [
      "학과·요일·교수명 필터를 추가했습니다.",
      "검색 조건을 바꿔도 선택한 수업을 유지하고 선택 개수를 표시합니다.",
      "내 시간표 관리 화면의 수업 카드 배치를 정리했습니다."
    ],
    "historical": true,
    "status": "업로드 요청 기준 · 완료 기록 미확인"
  },
  {
    "version": "bcfcdff",
    "date": "2026-09-30",
    "title": "공통 수업 목록 불러오기",
    "changes": [
      "관리자가 수업시간표 파일을 가져와 공통 수업 목록을 등록할 수 있습니다.",
      "사용자는 등록된 수업을 선택해 자신의 시간표에 추가할 수 있습니다."
    ],
    "historical": true,
    "status": "업로드 요청 기준 · 완료 기록 미확인"
  },
  {
    "version": "000260d",
    "date": "2026-09-30",
    "title": "여러 학기 관리",
    "changes": [
      "여러 학기를 등록하고 삭제할 수 있습니다.",
      "학기 목록 접기·펼치기를 추가하고 접히지 않던 문제를 수정했습니다."
    ],
    "historical": true,
    "status": "업로드 요청 기준 · 완료 기록 미확인"
  },
  {
    "version": "e4b4ab3",
    "date": "2026-09-30",
    "title": "수업시간표와 최근 접속 기록",
    "changes": [
      "관리자가 학기 적용 기간을 설정하고 사용자는 학기별 수업시간표를 등록할 수 있습니다.",
      "근무 일정과 수업시간의 겹침을 확인합니다.",
      "마지막 로그인 시각과 별도로 최근 접속 기록을 추적합니다."
    ],
    "historical": true,
    "status": "업로드 요청 기준 · 완료 기록 미확인"
  },
  {
    "version": "6619a01",
    "date": "2026-09-29",
    "title": "공휴일·주말 자동 휴일",
    "changes": [
      "대한민국 공휴일과 주말을 자동 휴일로 표시합니다.",
      "국가공휴일을 수동 휴일보다 우선 표시하고 휴일 표시를 정리했습니다.",
      "주말은 날짜별로 휴일 처리를 해제할 수 있습니다."
    ],
    "historical": true,
    "status": "업로드 요청 기준 · 완료 기록 미확인"
  },
  {
    "version": "90342c3",
    "date": "2026-09-23",
    "title": "계정 안내와 태그 표시 필터",
    "changes": [
      "로그인한 사용자 이름과 관리자 화면의 마지막 로그인 시각을 표시합니다.",
      "월·주간 달력에서 특정 태그를 숨길 수 있습니다."
    ],
    "historical": true,
    "status": "업로드 요청 기준 · 완료 기록 미확인"
  },
  {
    "version": "35782d9",
    "date": "2026-08-26",
    "title": "월 단위 복사와 일정 목록 배치",
    "changes": [
      "태그별 다음 달 복사와 특정 달 복사를 추가했습니다.",
      "일정 목록과 버튼 배치를 정리했습니다."
    ],
    "historical": true,
    "status": "업로드 요청 기준 · 완료 기록 미확인"
  },
  {
    "version": "8332b04",
    "date": "2026-08-25",
    "title": "PDF 업로드와 날짜 선택",
    "changes": [
      "태그를 선택해 근무일지 PDF의 일정을 가져올 수 있습니다.",
      "스캔된 PDF를 읽는 기능을 보완했습니다.",
      "복사 날짜 입력란을 눌러 달력을 열 수 있습니다."
    ],
    "historical": true,
    "status": "업로드 요청 기준 · 완료 기록 미확인"
  }
];
  if (typeof module !== 'undefined') module.exports = releases;
  else root.WorklogReleases = releases;
})(typeof window === 'undefined' ? globalThis : window);
