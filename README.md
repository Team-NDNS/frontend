# NDNS 여행 기록(trips) 기능 정리

## 1. 설치 & 실행

### 최초 1회 (새로 clone 했거나 팀원 코드 받아왔을 때)

**backend**
```powershell
cd backend
npm install
```
`backend/.env.example`을 복사해서 `backend/.env`로 만들고 본인 DB 정보 입력:
```
DB_HOST=...
DB_PORT=3306
DB_USER=...
DB_PASSWORD=...
DB_NAME=...
```

**frontend**
```powershell
cd frontend
npm install
```

### 매번 실행할 때 (터미널 2개 필요)

터미널 1 (backend):
```powershell
cd backend
npm start
```
→ `http://localhost:3000`, "Server running on port 3000" 뜨면 정상

터미널 2 (frontend):
```powershell
cd frontend
npm run dev
```
→ `http://localhost:5173` 접속해서 화면 확인

> 백엔드 코드를 수정하면 서버를 꼭 재시작(Ctrl+C 후 다시 `npm start`)해야 반영됩니다. nodemon을 안 쓰고 있어서 자동 반영 안 됨.

## 2. 파일 구조

```
backend/
  src/
    app.js              서버 시작점. 라우터 연결 + 시작 전 trips 테이블 자동 생성
    db/index.js         mysql2 커넥션 풀 (.env 값 사용)
    db/init.js          CREATE TABLE IF NOT EXISTS trips
    routes/trips.js      GET/POST /api/trips
    routes/groups.js     GET /api/groups (모임 목록)
    routes/users.js      GET /api/users (사용자 목록)
    scripts/check-groups.js   meeting_groups/users 데이터 확인용 (1회성 스크립트)
  .env / .env.example   DB 접속 정보 (.env는 git 추적 안 함)

frontend/
  src/
    App.jsx                    TripList 렌더링
    components/TripList.jsx    여행 기록 목록 + 등록 폼
    components/TripList.css
  vite.config.js         /api 요청을 localhost:3000으로 프록시
```

## 3. 동작 원리 (요약)

1. 프론트(5173) 켜지면 `TripList` 컴포넌트가 마운트되면서 `/api/trips`, `/api/groups`, `/api/users`를 동시에 요청
2. `vite.config.js`의 프록시 설정이 `/api`로 시작하는 요청을 백엔드(3000)로 그대로 전달 → CORS 설정 없이 통신
3. 백엔드는 `mysql2` 커넥션 풀로 실제 MySQL(RDS)에 쿼리를 날리고 결과를 JSON으로 응답
4. 등록 폼 제출 시 제목/설명/날짜 + 드롭다운에서 고른 `group_id`/`created_by`를 POST로 전송
5. `trips` 테이블은 `group_id`, `created_by`가 `NOT NULL` 외래키(FK)라서 (각각 `meeting_groups`, `users` 참조) 실제 존재하는 값이어야만 INSERT가 성공함 — 그래서 그룹/작성자를 직접 고르는 드롭다운을 추가한 것
6. INSERT 성공하면 방금 넣은 행을 다시 SELECT해서 응답 → 프론트가 화면 목록 맨 위에 바로 반영

## 4. 주의사항

- `.env`는 절대 커밋/공유 금지 (`.gitignore`에 이미 포함됨)
- 실제 팀 RDS를 그대로 쓰고 있으니, 테스트 등록 데이터가 팀 실 데이터에 섞이는 점 유의
- 브랜치를 옮기기 전엔 항상 커밋부터 (커밋 안 한 변경사항은 브랜치 전환 중 꼬일 수 있음)
