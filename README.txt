HTH Archive — 사용자별 D1 분리 + 이미지 링크 전용

auth-login 브랜치에 아래 2개만 반영하세요.

1) src/index.js
   기존 파일을 교체

2) public/app-patch.js
   새 파일로 추가

건드리지 않아도 되는 파일
- public/auth.js
- public/app.js
- public/index.html
- wrangler.jsonc

이번 변경 내용

[보안 / 사용자 분리]
- /api/* 요청은 Firebase ID Token이 없으면 401
- Firebase Auth REST accounts:lookup으로 토큰을 확인
- Firebase UID(localId)를 D1 works.user_id로 사용
- 작품 GET / POST / PATCH / DELETE 모두 로그인한 사용자의 데이터에만 접근
- 기존 user_id="local-dev" 데이터는 새 로그인 사용자에게 보이지 않음

[이미지]
- 파일 업로드 제거
- 이미지 URL만 한 포스트당 최대 4개 저장
- HTH 화면에서는 이미지를 직접 렌더링하지 않음
- 이미지 링크만 클릭 가능한 형태로 표시
- 타래 카드 썸네일 제거
- X API 연결 안내도 "이미지 파일 백업"이 아니라 "원본 URL 기록"으로 변경

테스트 순서
1. 두 파일을 auth-login 브랜치에 반영
2. Cloudflare 프리뷰 배포 약 30초 기다리기
3. 로그인한 상태에서 작품 하나 생성
4. 새로고침 후 작품이 유지되는지 확인
5. 직접 추가 → 이미지 링크 입력 → 저장
6. 이미지가 직접 뜨지 않고 "이미지 링크"만 보이는지 확인

추가 확인
- 다른 Google 계정으로 로그인하면 기존 계정의 작품이 보이지 않아야 정상입니다.
- 아직 viewings / threads 자체는 localStorage 저장 부분이 남아 있습니다.
  이번 단계에서 D1 사용자 분리가 적용되는 것은 현재 D1에 올라간 works API입니다.
  다음 단계에서 관극/타래를 D1 테이블로 옮길 때 같은 UID 분리 방식을 그대로 적용하면 됩니다.
