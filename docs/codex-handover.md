# Codex Handover

## 프로젝트

- 이름: AiPacer
- 루트: `C:\codex\app\AiPacer`
- 패키지 매니저: npm
- 기술 스택: Astro 5, React 19, TypeScript, Vitest, Vite

## 현재 목표

주간 남은 AI 용량을 오늘 가능한 작업 횟수로 바꾸는 무상태 계산기입니다. 유틸리티 허브의 01번 앱과 Manifest V3 Chrome 확장 프로그램에서 같은 계산 코어와 UI를 사용합니다.

## 현재 상태

- `/ai-pacer/`는 입력과 결과가 한 화면에 있는 단일 계산기입니다.
- 입력은 Claude 플랜(Pro 1x 또는 Max 5x), 주간 남은 용량, 초기화 요일과 시간, 선택 가능한 주 사용시간뿐입니다.
- 기록, localStorage, 알림, 도구 비교, 내보내기 기능은 제거했습니다.
- 결과는 오늘 권장 용량과 소형, 중형, 대형 작업 추천 횟수입니다.
- 코치는 실제 3살 샴고양이 달콤이를 바탕으로 만든 굵은 안경의 사감 선생님 캐릭터입니다.
- `push`, `encourage`, `maintain`, `caution`, `unavailable` 상태마다 별도 이미지가 있고 UI 표기는 `달콤이 says`로 통일합니다.
- 제복, 완장, 깃발, 군사적 또는 정치적 상징은 사용하지 않습니다.
- `/about/`에 실제 달콤이 사진, 3살·샴고양이·별명 돼지 프로필, 캐릭터 설명이 있습니다.
- Privacy와 Terms 링크는 헤더와 푸터 메뉴에서 숨겼지만 직접 접근 가능한 페이지는 배포·확장용으로 유지합니다.
- `extension/`에 권한 없는 Manifest V3 팝업 소스가 있습니다.
- 확장은 Chrome UI 언어가 한국어이면 한국어, 그 외에는 영어로 자동 표시하며 `_locales/ko`, `_locales/en`으로 이름과 설명도 현지화합니다.
- 계산 기준 도움말에는 실제 달콤이 사진과 3살 샴고양이 프로필이 표시됩니다.
- `release/chrome-web-store/`에 v0.3.3 업로드 ZIP, 1280×800 스크린샷 3장, 440×280 프로모션 타일, 128×128 스토어 아이콘이 있습니다.
- `npm run package:extension`은 확장을 다시 빌드하고 웹스토어 ZIP의 루트에 `manifest.json`이 있는지 검사합니다.
- 후원 링크는 검증된 GitHub Sponsors와 Ko-fi를 제공하며 사용자가 직접 선택할 때만 외부 탭으로 열립니다.
- 실제 광고 코드는 없고 광고 자리만 있습니다.
- GitHub Pages 배포 주소는 `https://seamoon23.github.io/aiPacer/`, 개인정보처리방침은 `https://seamoon23.github.io/aiPacer/privacy/`입니다. 2026-07-28 첫 배포를 확인했으며 `main` 푸시는 `.github/workflows/deploy.yml`을 실행합니다.

## 상호작용 참고

개발 서버가 Vite 의존성 캐시를 비운 뒤 esbuild를 실행하지 못하면 React가 하이드레이션되지 않아 요일과 도움말 버튼이 정적인 HTML처럼 보일 수 있습니다. `npm run dev`는 `astro dev --force`로 의존성을 다시 만들도록 설정했습니다. 제한된 실행 환경에서는 esbuild 자식 프로세스 실행 권한도 필요합니다.

## 계산 규칙

- 다음 초기화: 선택한 요일과 시간의 다음 도래 시점
- 기본 주요 사용시간: 매일 09:00부터 18:00
- 오늘 예산: min(주간 잔여율 ÷ 초기화까지 남은 사용일 환산값, 주간 잔여율)
- Pro 1x 소형: 2%, 1-2턴의 짧은 문맥
- Pro 1x 중형: 6%, 3-5턴의 중간 문맥
- Pro 1x 대형: 15%, 6턴 이상의 긴 문맥
- Max 5x: 공식 안내된 5배 세션 용량에 따라 작업당 예상 소모율을 각각 0.4%, 1.2%, 3%로 보정
- 추천 횟수: 고정 시간 상한 없이 같은 오늘 예산을 각 규모에만 사용했을 때의 용량 기준 횟수
- 주요 사용시간은 남은 사용일 환산의 기준이며, 현재 시각이 시간대 밖이어도 결과를 0으로 차단하지 않음
- 초기화 전 예정된 사용 구간이 없으면 남은 용량 전부를 이번 예산으로 배정
- 플랜 가격을 사용량으로 임의 환산하지 않으며, 모델·문맥·기능과 서비스별 5시간·단기 세션·주간 한도는 별도다. 결과는 공식 사용량이 아닌 보수적인 추정치다.

## 핵심 파일

- `src/components/AiPacerApp.tsx`
- `src/lib/pacerCalculator.ts`
- `src/styles/pacer.css`
- `src/assets/dalkomi-{push,encourage,maintain,caution,unavailable}.webp`
- `public/assets/dalkomi-*.webp`
- `extension/manifest.json`
- `extension/src/main.tsx`
- `docs/utility-hub-app-01-ai-pacer.md`

## 실행 및 검증

접근 경로: Windows PowerShell에서 프로젝트 루트로 이동합니다.

```powershell
Set-Location C:\codex\app\AiPacer
npm run dev
npm test
npm run typecheck
npm run build
npm run build:extension
npm run package:extension
```

Chrome 로컬 설치 접근 경로는 `Chrome 주소창 > chrome://extensions > 개발자 모드 > 압축해제된 확장 프로그램을 로드합니다 > C:\codex\app\AiPacer\extension\dist`입니다.

## 다음 작업

1. `docs/chrome-web-store-release.md`를 따라 개발자 계정에서 ZIP, 스토어 이미지, Privacy URL을 등록하고 검토를 요청합니다.
2. 실제 광고 도입 시점에 광고 네트워크 정책과 배치를 다시 검토합니다.
3. Pro·Max 5x 보정 이후에도 실제 사용자 피드백이 모이면 작업 규모 기준을 추가 조정합니다.

## 작업 제한

- `C:\codex\app\AiPacer` 밖을 수정하지 않습니다.
- `C:\codex\app` 또는 형제 프로젝트를 프로젝트 루트로 취급하지 않습니다.
- `docs/superpowers/`의 2026-07-01 문서는 이전 기록형 UI의 역사 자료이며 현재 구현 기준이 아닙니다.
- API 연동, 자동 감지, 로그인, 서버, 저장 기능은 새 승인 없이 추가하지 않습니다.
