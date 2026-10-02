HTH Archive — Firebase 로그인 1단계

auth-login 브랜치에서 아래 두 파일만 반영하세요.

1) public/auth.js
   - 새 파일로 업로드

2) src/index.js
   - 기존 src/index.js를 이 파일로 교체

이번 단계에서 하는 일
- HTH 접속 시 앱 화면을 숨기고 Google 로그인 화면 표시
- Firebase 로그인 유지
- 로그인 성공 후 기존 앱 화면 표시
- 기존 /api/* fetch 요청에 Firebase ID Token을 Authorization: Bearer ... 형태로 자동 첨부
- index.html은 수정하지 않음
- 기존 app.js도 수정하지 않음

중요
- 아직 Worker가 토큰을 검증하지는 않습니다.
- 따라서 이 단계는 "로그인 UI + 토큰 전송 준비" 단계입니다.
- auth-login 브랜치 프리뷰에서만 테스트하고, 실제 개인 데이터를 넣거나 main에 머지하는 건
  다음 단계(Worker에서 Firebase 토큰 검증 + 본인 계정 제한)까지 끝낸 뒤 하는 것이 안전합니다.

테스트
1. 두 파일 반영 후 Cloudflare 프리뷰 배포가 끝날 때까지 약 30초 기다리기
2. 프리뷰 주소 접속
3. Google 로그인 화면이 보이는지 확인
4. Google로 로그인
5. 기존 HTH 홈이 정상적으로 뜨는지 확인
