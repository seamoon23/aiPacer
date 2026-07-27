# AI Pacer

주간 남은 AI 용량을 오늘 가능한 소형, 중형, 대형 작업 횟수로 바꾸는 정적 계산기입니다. AI 서비스 API와 연결하지 않으며 로그인, 자동 감지, 기록 저장 없이 현재 화면에서 바로 계산합니다.

## 현재 기능

- 입력 1: 주간 남은 용량 0부터 100%
- 입력 2: 초기화 요일과 시간
- 선택 입력: 주 사용시간, 기본값 09:00부터 18:00
- 출력: 오늘 권장 용량과 소형, 중형, 대형 작업 추천 횟수
- 상황 문구: `달콤이 says`
- 캐릭터: 실제 3살 샴고양이 달콤이를 바탕으로 한 굵은 안경의 사감 선생님 코치
- 상태 이미지: 독려, 응원, 유지, 주의, 휴식 5종
- 실제 달콤이 사진이 포함된 계산 기준 도움말과 GitHub Sponsors·Ko-fi 후원 링크
- 웹 페이지와 같은 소스를 쓰는 Manifest V3 Chrome 확장 프로그램
- Chrome UI 언어가 한국어면 한국어, 그 외에는 영어로 자동 표시
- 입력값 저장과 외부 전송 없음

## 계산 기준

다음 초기화는 선택한 요일과 시간의 다음 도래 시점으로 봅니다. 현재 시각부터 초기화까지 남은 주 사용시간에 주간 용량을 나누고, 오늘 남은 사용시간 비율만큼 오늘 권장 용량을 계산합니다.

작업 규모는 보수적인 고정 기준입니다.

| 규모 | 용량 기준 | 시간 기준 |
| --- | ---: | ---: |
| 소형 | 2% | 20분 |
| 중형 | 6% | 60분 |
| 대형 | 15% | 150분 |

추천 횟수는 용량으로 가능한 횟수와 오늘 남은 시간으로 가능한 횟수 중 작은 값입니다. 실제 소모량은 모델, 문맥 길이, 작업 난이도에 따라 달라집니다.

## 주요 경로

- `/`: 무료 웹 유틸리티 허브
- `/ai-pacer/`: AI Pacer 계산기
- `/about/`: 달콤이와 도구 소개
- `/privacy/`: 개인정보처리방침 직접 접근 경로
- `/terms/`: 이용약관 직접 접근 경로
- `extension/`: Chrome 확장 프로그램 소스

Privacy와 Terms 페이지는 배포와 확장 프로그램 안내를 위해 유지하지만 헤더와 푸터 메뉴에는 표시하지 않습니다.

## 공개 배포

- 웹: `https://seamoon23.github.io/aiPacer/`
- 계산기: `https://seamoon23.github.io/aiPacer/ai-pacer/`
- 개인정보처리방침: `https://seamoon23.github.io/aiPacer/privacy/`

`main` 브랜치에 푸시하면 `.github/workflows/deploy.yml`이 Astro 정적 사이트를 GitHub Pages에 배포합니다.

## 로컬 실행

접근 경로: Windows PowerShell을 열고 프로젝트 루트로 이동합니다.

```powershell
Set-Location C:\codex\app\AiPacer
npm install
npm run dev
```

브라우저에서 터미널에 표시된 주소를 열고 `/aiPacer/ai-pacer/`로 이동합니다. `npm run dev`는 Vite 의존성 캐시를 강제로 다시 만들어 정적인 화면만 보이는 하이드레이션 실패를 예방합니다.

## 검증 명령

```powershell
npm test
npm run typecheck
npm run build
npm run build:extension
npm run package:extension
```

웹과 확장을 함께 빌드하려면 다음 명령을 사용합니다.

```powershell
npm run build:all
```

Chrome 확장 프로그램 로컬 설치 접근 경로는 [extension/README.md](extension/README.md)에 정리되어 있습니다.
Chrome Web Store 제출 파일과 등록 문구는 [docs/chrome-web-store-release.md](docs/chrome-web-store-release.md)에 정리되어 있습니다.

## 제외 범위

- AI 서비스 API 연동과 자동 사용량 감지
- 로그인, 계정, 서버, 데이터베이스
- 입력 기록과 설정 저장
- 알림, 기록 내보내기, 도구별 비교
- 실제 광고 및 외부 분석 스크립트
