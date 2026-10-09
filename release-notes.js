(function (root) {
  // New releases go first. Dates use Korea Standard Time.
  const releases = [
    {
      version: '1.1.0', date: '2026-10-09', title: '버전 기록 추가',
      changes: [
        '로그인 화면과 캘린더에서 현재 버전과 업데이트 내역을 확인할 수 있습니다.',
        '버전별 변경 내용을 최신순으로 제공하며 모바일에서도 확인할 수 있습니다.'
      ]
    },
    {
      version: '1.0.0', date: '2026-10-08', title: '버전 관리 시작 전 기능 정리',
      changes: [
        '설정에서 이메일·비밀번호를 변경하고 월 달력 시작 요일을 선택할 수 있습니다.',
        '주간 근무시간은 달력 표시 설정과 관계없이 월요일~일요일 기준으로 계산합니다.',
        '일정 추천은 점심·저녁시간 안에서 시작하지 않으며, 가능한 긴 연속 일정을 우선합니다.',
        '추천 일정을 추가하면 추천 창이 자동으로 닫힙니다.'
      ]
    }
  ];
  if (typeof module !== 'undefined') module.exports = releases;
  else root.WorklogReleases = releases;
})(typeof window === 'undefined' ? globalThis : window);
