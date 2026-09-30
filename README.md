# HTH Archive v6 — clean deploy preview

Cloudflare Pages에 올려 실제 URL에서 확인하기 위한 **데모 데이터 없는 배포용 프론트엔드**입니다.

## 이번 버전 변경
- 초기 작품 / 관극 / 타래 / X 계정 더미데이터 제거
- 앱 아이콘을 `index.html` 안에 data URI로 내장해 Cloudflare에서 asset 경로가 깨져도 로고와 favicon이 표시되도록 수정
- 예시 첨부 이미지 asset 의존성 제거
- 빈 홈 / 작품 목록에 실제 서비스용 empty state 추가
- 캘린더를 고정된 2026년 9월이 아니라 현재 월 기준으로 변경하고 이전/다음 달 이동 추가
- 새 관극의 기본 날짜를 오늘 날짜로 변경
- X API가 아직 연결되지 않은 상태에서는 링크 가져오기가 **가짜 더미 포스트를 생성하지 않도록 비활성 안내**로 변경
- 직접 추가 / 작품 / 관극 / 계정 / 테마 기능은 브라우저 localStorage에서 계속 테스트 가능

## Cloudflare Pages 배포
저장소 루트에 아래 파일/폴더가 오도록 업로드하세요.

```
index.html
style.css
app.js
assets/
  hth-icon.png
README.md
```

`index.html`의 앱 로고는 이미지 자체를 내장하고 있으므로 `assets/hth-icon.png`가 누락되어도 화면 로고는 깨지지 않습니다. `assets/hth-icon.png`는 추후 PWA manifest/app icon용 원본으로 남겨둔 파일입니다.

## 중요
현재 데이터는 **브라우저 localStorage**에만 저장됩니다. 다른 기기와 동기화되지 않으며 브라우저 데이터를 지우면 사라집니다. 실제 사용 전 Cloudflare D1/R2 연결 단계가 필요합니다.
