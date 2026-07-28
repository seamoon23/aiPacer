# AI Pacer Next Tasks

## 완료

- 2026-07-28 GitHub Pages 첫 배포 및 공개 URL 확인
  - `https://seamoon23.github.io/aiPacer/`
  - `https://seamoon23.github.io/aiPacer/privacy/`
- 2026-07-28 v0.3.2 계산 기준 1차 개선
  - 대화 턴·문맥 기준, 공유 예산 조합 예시, 별도 5시간·세션 한도 안내 반영
  - Claude Pro 1x·Max 5x 선택과 공식 5배 용량 기준의 작업당 소모율 보정 추가
- 2026-07-28 v0.3.3 일일 배분 오류 수정과 Chrome Web Store 산출물 갱신
  - 오늘 남은 시간 비율을 중복 적용하던 계산 제거
  - 주요 사용시간 밖에서도 남은 사용일 환산값에 따라 권장량 제공
  - 사용자 제보 두 조건을 회귀 테스트로 고정
  - `release/chrome-web-store/AI-Pacer-v0.3.3.zip`과 스크린샷 3장 갱신

## 우선순위 1

1. 준비된 v0.3.3 패키지를 Chrome Web Store에 업로드하고 검토 요청 (사용자 진행)
   - 업로드 ZIP과 등록 문구는 `docs/chrome-web-store-release.md` 참고
2. Pro·Max 5x 보정 이후 실제 사용자 피드백으로 소형, 중형, 대형 용량 기준 추가 보정

## 우선순위 2

1. 유틸리티 허브에 02번 도구 추가
2. 실제 광고 도입 전에 현재 광고 정책 재확인
3. 한국어 문구와 작은 화면 접근성 재검토

## 새 승인 없이 추가하지 말 것

- AI 서비스 API 연동과 자동 사용량 감지
- 로그인, 계정, 서버, 데이터베이스
- localStorage 기록과 알림
- 사용자의 입력값 전송
- 실제 광고 및 외부 분석 스크립트