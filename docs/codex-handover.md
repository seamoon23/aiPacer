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
- 입력은 주간 남은 용량, 초기화 요일, 선택 가능한 주 사용시간뿐입니다.
- 기록, localStorage, 알림, 도구 비교, 내보내기 기능은 제거했습니다.
- 결과는 오늘 권장 용량과 소형, 중형, 대형 작업 추천 횟수입니다.
- 코치는 실제 3살 샴고양이 달콤이를 바탕으로 만든 굵은 안경의 사감 선생님 캐릭터입니다.
- `push`, `encourage`, `maintain`, `caution`, `unavailable` 상태마다 별도 이미지가 있고 UI 표기는 `달콤이 says`로 통일합니다.
- 제복, 완장, 깃발, 군사적 또는 정치적 상징은 사용하지 않습니다.
- `/about/`에 실제 달콤이 사진, 3살·샴고양이·별명 돼지 프로필, 캐릭터 설명이 있습니다.
- Privacy와 Terms 링크는 헤더와 푸터 메뉴에서 숨겼지만 직접 접근 가능한 페이지는 배포·확장용으로 유지합니다.
- `extension/`에 권한 없는 Manifest V3 팝업 소스가 있습니다.
- 후원 링크는 도움말에서 사용자가 직접 선택할 때만 외부 탭으로 열립니다.
- 실제 광고 코드는 없고 광고 자리만 있습니다.

## 상호작용 참고

개발 서버가 Vite 의존성 캐시를 비운 뒤 esbuild를 실행하지 못하면 React가 하이드레이션되지 않아 요일과 도움말 버튼이 정적인 HTML처럼 보일 수 있습니다. `npm run dev`는 `astro dev --force`로 의존성을 다시 만들도록 설정했습니다. 제한된 실행 환경에서는 esbuild 자식 프로세스 실행 권한도 필요합니다.

## 계산 규칙

- 다음 초기화: 선택한 요일의 다음 도래 시점 0시
- 기본 사용시간: 매일 09:00부터 18:00
- 소형: 2%, 20분
- 중형: 6%, 60분
- 대형: 15%, 150분
- 추천 횟수: 용량 제한 횟수와 오늘 남은 시간 제한 횟수 중 작은 값
- 결과는 공식 사용량이 아닌 보수적인 추정치

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
```

Chrome 로컬 설치 접근 경로는 `Chrome 주소창 > chrome://extensions > 개발자 모드 > 압축해제된 확장 프로그램을 로드합니다 > C:\codex\app\AiPacer\extension\dist`입니다.

## 다음 작업

1. 실제 배포 도메인으로 `astro.config.mjs`, `src/lib/siteMetadata.ts`, `public/robots.txt`의 `https://example.com`을 교체합니다.
2. Chrome Web Store 등록용 스크린샷, 상세 설명, 개인정보 안내를 준비합니다.
3. 실제 광고 도입 시점에 광고 네트워크 정책과 배치를 다시 검토합니다.
4. 작업 규모 기준은 사용자 피드백이 모인 뒤 조정합니다.

## 작업 제한

- `C:\codex\app\AiPacer` 밖을 수정하지 않습니다.
- `C:\codex\app` 또는 형제 프로젝트를 프로젝트 루트로 취급하지 않습니다.
- `docs/superpowers/`의 2026-07-01 문서는 이전 기록형 UI의 역사 자료이며 현재 구현 기준이 아닙니다.
- API 연동, 자동 감지, 로그인, 서버, 저장 기능은 새 승인 없이 추가하지 않습니다.
