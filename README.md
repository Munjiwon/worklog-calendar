# 근무일지 캘린더 프로토타입

근무일지 작성을 위해 주간/월간 캘린더에서 근무 시간을 시각적으로 관리하는 웹 프로토타입입니다.

## 실행 방법

처음 접속하면 로그인 화면으로 이동합니다.

첫 실행 시 기본 관리자 계정이 자동 생성됩니다.

기본 관리자 계정:
- 아이디: `admin`
- 비밀번호: `1q2w3e4r`

로그인 화면의 `회원가입`에서 일반 계정을 만들 수 있습니다. 관리자 계정으로 로그인한 뒤 상단 `관리자` 메뉴에서 일반/관리자 계정을 만들 수도 있습니다.

### Docker Compose

```bash
docker compose up -d --build
```

브라우저에서 `http://localhost:3000`으로 접속합니다.

이미 `3000` 포트를 사용 중이면 호스트 포트를 바꿔 실행합니다.

```bash
HOST_PORT=3001 docker compose up -d --build
```

이 경우 `http://localhost:3001`로 접속합니다.

운영 배포 전 `docker-compose.yml`의 `WORKLOG_PASSWORD`, `SESSION_SECRET`, `POSTGRES_PASSWORD` 값을 반드시 변경하세요.
Docker Compose 실행 시 PostgreSQL 컨테이너가 함께 실행되고 계정 데이터는 `worklog-postgres` 볼륨에 저장됩니다.

### Kubernetes

이미지:

```text
squirtlee/work-log-calendar:latest
```

매니페스트 적용:

```bash
kubectl apply -f k8s/work-log-calendar.yaml
```

생성되는 네임스페이스는 `work-log-calendar`입니다. 앱, PostgreSQL, Secret, PVC, Service가 함께 생성됩니다. 앱 Service는 `NodePort`이며 고정 노드포트는 `30303`입니다.

노드포트로 접속:

```text
http://<노드 IP>:30303
```

로컬에서 확인:

```bash
kubectl -n work-log-calendar port-forward svc/work-log-calendar 8080:80
```

브라우저에서 `http://localhost:8080`으로 접속합니다.

운영 배포 전 `k8s/work-log-calendar.yaml`의 `WORKLOG_PASSWORD`, `SESSION_SECRET`, `POSTGRES_PASSWORD` 값을 변경하세요.

### Node 직접 실행

```bash
npm start
```

환경변수로 로그인 정보를 바꿀 수 있습니다.

```bash
WORKLOG_USERNAME=admin WORKLOG_PASSWORD=your-password SESSION_SECRET=your-secret npm start
```

## 주요 기능

- 로그인 세션 보호 및 로그아웃
- 회원가입에서 일반 계정 생성
- 관리자 페이지에서 일반/관리자 계정 생성
- 주간 캘린더에서 근무 일정 확인
- 월간 캘린더에서 한 달 전체 근무 일정 확인
- 월간 캘린더에서 근무를 드래그해 날짜 이동
- 빈 시간대를 드래그해서 새 근무 생성
- 근무 박스 드래그로 날짜/시간 이동
- 선택한 근무의 위/아래 핸들 드래그로 시작/종료 시간 조절
- 겹치는 근무 자동 감지 및 강조
- 점심 `12:00-13:00`, 저녁 `18:00-19:00` 자동 식사 차감
- 식사 시간과 겹치는 구간을 근무 박스 안에 빨간 패턴으로 표시
- 휴일 지정 및 휴일 근무 집계 제외
- 태그별 색상 지정 및 캘린더 근무 박스 색상 적용
- 월별 근무 시간, 월별 태그별 근무 시간, 태그별 충족 시간 표시
- 주간 일정 복사/붙여넣기
- 현재 주차 일정만 삭제

## 기본 조작

- 새 근무 생성: 캘린더의 빈 시간대를 클릭한 뒤 드래그
- 근무 이동: 캘린더의 근무 박스를 드래그
- 근무 선택: 캘린더의 근무 박스 클릭
- 근무 삭제: 근무 선택 후 `Delete`
- 시간 조절: 선택된 근무 박스의 위/아래 핸들 드래그
- 근무 수정: 왼쪽 일정 목록의 `수정` 버튼 클릭
- 제목 빠른 수정: 왼쪽 일정 목록에서 근무 제목 더블클릭
- 휴일 지정: 날짜 헤더의 `휴일 지정` 버튼 클릭

## 데이터 저장

모든 데이터는 브라우저 `localStorage`에 저장됩니다.

저장되는 항목:
- 근무 일정
- 주간 복사 데이터
- 태그 색상
- 휴일 날짜
- 태그별 월 충족 시간

브라우저의 사이트 데이터/localStorage를 삭제하면 저장된 일정도 삭제됩니다.

계정 데이터는 `DATABASE_URL`이 있으면 PostgreSQL에 저장됩니다. 없으면 서버의 `DATA_DIR` 아래 `users.json`에 저장됩니다.

## 파일 구성

```text
worklog-calendar-prototype/
├── Dockerfile
├── docker-compose.yml
├── k8s/
├── admin.html
├── admin.js
├── index.html
├── login.html
├── register.html
├── package.json
├── server.js
├── styles.css
├── app.js
└── README.md
```

## 참고

현재 일정 데이터는 로그인 세션과 별개로 브라우저 `localStorage`에 저장됩니다. 여러 기기 동기화와 사용자별 일정 DB 저장 기능은 포함되어 있지 않습니다.
