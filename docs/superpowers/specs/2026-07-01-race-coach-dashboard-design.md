# AI Pacer Race Coach Dashboard Design

## Goal

AI Pacer의 입력은 더 단순하게 느껴지게 하고, 출력은 토끼와 거북이 레이스 테마를 활용해 Codex와 Claude Code의 사용 페이스를 한눈에 비교하도록 만든다.

## Scope

- API 연동, 자동 감지, 로그인, 서버, DB, Chrome 확장프로그램은 만들지 않는다.
- 모든 판단은 사용자가 직접 입력한 값과 localStorage 기록만 사용한다.
- 외부 이미지 자산을 받지 않고 CSS/SVG 기반의 가벼운 시각 요소를 사용한다.
- 서비스명은 AI Pacer, URL은 `/ai-pacer/`를 유지한다.

## UX Direction

- 입력 폼은 `도구 선택`, `5시간 세션 표시값`, `주간 표시값`, `메모` 중심으로 유지하고 설명 문구를 줄인다.
- 결과 영역은 “레이스 코치”처럼 보여준다.
- 토끼는 빠른 소모 또는 지금 달려도 되는 AI를, 거북이는 너무 아껴서 남길 가능성이 있는 AI를 표현한다.
- Codex와 Claude Code 기록이 모두 있으면 두 AI의 최신 잔여율과 오늘 소모 추정을 비교한다.
- 기록이 하나뿐이면 선택된 AI 기준의 단독 코치 메시지를 보여준다.

## Calculation Model

- 기존 `calculateUsageRecommendation`의 페이스 계산은 유지한다.
- 새 비교 판단은 별도 순수 함수에서 수행한다.
- 최신 스냅샷 기준으로 provider별 5시간 세션 잔여율, 주간 잔여율, 오늘 소모 추정을 계산한다.
- 상대적으로 많이 남은 AI는 “지금 더 달려도 됨”, 많이 소모한 AI는 “숨 고르기”, 균형권은 “좋은 페이스”로 안내한다.

## Components

- `providerRace.ts`: provider별 최신 상태와 레이스 코치 메시지를 계산한다.
- `ProviderRaceDashboard.tsx`: Codex vs Claude Code 비교 레이스 트랙을 렌더링한다.
- `HeroPaceDashboard.tsx`: 상단 차트를 레이스 요약에 맞게 강화한다.
- `UsageInputForm.tsx`: 입력 안내 문구를 줄이고 핵심 입력만 강조한다.
- `global.css`: 레이스 트랙, 마스코트 배지, AI별 비교 차트 스타일을 추가한다.

## Testing

- `providerRace.test.ts`: provider별 최신 상태, 단독/비교 모드, 독려 메시지를 검증한다.
- `AiPacerApp.test.tsx`: 입력 폼 단순화 문구, 레이스 대시보드 표시, Codex/Claude Code 비교 표시를 검증한다.
- 기존 계산, 저장, 빌드 테스트는 그대로 통과해야 한다.
