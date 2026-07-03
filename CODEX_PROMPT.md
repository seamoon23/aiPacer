# CODEX_PROMPT.md

너는 숙련된 프론트엔드 개발자이자 제품 감각이 좋은 구현 에이전트다.

`AI Pacer`라는 정적 웹앱 MVP를 구현해라.

## 프로젝트 핵심

AI Pacer는 Claude, Claude Code, Codex, ChatGPT 같은 AI 도구의 사용량 제한을 직접 입력하고, 현재 상태를 기준으로 다음을 알려주는 수동형 페이스메이커다.

* 지금 집중해서 써도 되는지
* 몇 분 정도 집중 작업을 권장하는지
* 오늘 추가 사용을 어느 정도까지 권장하는지
* 주간 사용 페이스가 빠른지 느린지
* 대형 작업을 해도 되는지
* 작업 후 재입력이 필요한지

서비스명은 반드시 `AI Pacer`로 사용한다.

## 절대 구현하지 말 것

이번 1차 MVP에서는 아래 기능을 절대 구현하지 마라.

* API 연동
* ChatGPT/Claude/Codex 자동 감지
* 브라우저 확장프로그램
* 로그인
* 회원가입
* 서버 백엔드
* DB 저장
* 결제
* 실제 AdSense 코드
* 외부 분석 스크립트
* 사용자의 입력 데이터를 외부로 전송하는 기능

모든 데이터는 브라우저 localStorage에만 저장한다.

## 기술 스택

가능하면 다음 스택으로 구현한다.

* Astro
* React
* TypeScript
* localStorage
* Notification API
* 정적 배포 가능한 구조

기존 프로젝트가 비어 있다면 새 Astro 프로젝트 구조를 만든다.
이미 프로젝트가 있다면 기존 구조를 존중하되, 서버 없는 정적 웹앱 구조를 유지한다.

## 필수 라우트

```txt
/
  무료 웹 유틸리티 허브

/ai-pacer/
  AI Pacer 계산기

/about/
  사이트 소개

/privacy/
  개인정보처리방침

/terms/
  이용약관
```

## 홈 화면 `/`

다음을 포함한다.

* 사이트 이름
* 무료 웹 유틸리티 모음 소개
* AI Pacer 카드
* 향후 추가 예정 유틸 placeholder 카드
* 서버 저장 없음 안내
* 로그인 없음 안내
* 하단 광고 placeholder

## AI Pacer 화면 `/ai-pacer/`

### 입력 폼

다음 값을 입력받는다.

1. 도구 선택

   * Claude
   * Claude Code
   * Codex
   * ChatGPT
   * Custom

2. 현재 5시간 세션 잔여율

   * 숫자
   * 0~100
   * 필수

3. 현재 주간 잔여율

   * 숫자
   * 0~100
   * 필수

4. 주간 리셋 일시

   * datetime-local
   * 필수

5. 작업 강도

   * 가벼운 질문
   * 일반 상담
   * 코드 일부 수정
   * 레거시 분석
   * 에이전트 장시간 작업

6. 메모

   * 선택

### 계산 결과

입력 후 카드 형태로 다음을 출력한다.

* 전체 상태

  * safe
  * normal
  * caution
  * danger

* 5시간 세션 권고

* 주간 페이스 권고

* 오늘 안전 예산

* 오늘 사용량 추정

* 오늘 추가 권장량

* 추천 집중 시간

* 경고 메시지

* 추천 행동

### 최근 기록

localStorage에 저장된 최근 입력 기록을 보여준다.

* 최신순
* 최대 10개
* 전체 삭제 버튼
* 개별 삭제 버튼

### 알림

1차에서는 단순 구현만 한다.

* 브라우저 알림 권한 요청 버튼
* 테스트 알림 보내기 버튼
* 알림 설정 UI placeholder

백그라운드 예약 알림은 이번 범위에서 구현하지 않는다.

## 계산 로직

### 작업 강도 프리셋

```ts
const TASK_RISK_PRESETS = {
  light: {
    label: '가벼운 질문',
    minWeeklyCostPct: 0.5,
    maxWeeklyCostPct: 2,
    recommendedMinutes: 15,
  },
  normal: {
    label: '일반 상담',
    minWeeklyCostPct: 2,
    maxWeeklyCostPct: 5,
    recommendedMinutes: 30,
  },
  codeSmall: {
    label: '코드 일부 수정',
    minWeeklyCostPct: 5,
    maxWeeklyCostPct: 10,
    recommendedMinutes: 60,
  },
  legacyAnalysis: {
    label: '레거시 분석',
    minWeeklyCostPct: 10,
    maxWeeklyCostPct: 20,
    recommendedMinutes: 90,
  },
  agenticLong: {
    label: '에이전트 장시간 작업',
    minWeeklyCostPct: 15,
    maxWeeklyCostPct: 40,
    recommendedMinutes: 120,
  },
};
```

### 주간 리셋까지 남은 시간

```ts
const hoursUntilWeeklyReset =
  (weeklyResetAt.getTime() - now.getTime()) / 1000 / 60 / 60;
```

0 이하이면 다음 경고를 표시한다.

```txt
주간 리셋 시간이 이미 지났습니다. 리셋 일시를 다시 입력하세요.
```

계산은 계속 진행하되 최소값으로 보정한다.

```ts
const daysUntilWeeklyReset = Math.max(hoursUntilWeeklyReset / 24, 0.25);
```

### 하루 안전 예산

```ts
const safeDailyBudgetPct =
  weeklyRemainingPct / daysUntilWeeklyReset;
```

### 오늘 사용량 추정

오늘 첫 기록이 있으면:

```ts
const todayUsedPct =
  firstWeeklyRemainingPctOfToday - currentWeeklyRemainingPct;
```

음수면 0으로 보정한다.

오늘 기록이 없으면:

```ts
const todayUsedPct = 0;
```

그리고 다음 안내를 표시한다.

```txt
오늘 첫 기록이 없어 오늘 사용량 추정 정확도가 낮습니다.
```

### 오늘 추가 권장량

```ts
const recommendedAdditionalPct =
  Math.max(safeDailyBudgetPct - todayUsedPct, 0);
```

### 5시간 세션 집중 시간

```ts
function getSessionBasedMinutes(sessionRemainingPct: number): number {
  if (sessionRemainingPct >= 80) return 120;
  if (sessionRemainingPct >= 60) return 90;
  if (sessionRemainingPct >= 40) return 60;
  if (sessionRemainingPct >= 20) return 30;
  return 0;
}
```

최종 권장 시간은 세션 기반 시간과 작업 강도 권장 시간 중 작은 값을 사용한다.

```ts
const recommendedFocusMinutes = Math.min(
  sessionBasedMinutes,
  taskPreset.recommendedMinutes
);
```

단, `sessionRemainingPct >= 80`이고 작업 강도가 `agenticLong`이면 120분까지 허용한다.

### 상태 판정

```ts
if (sessionRemainingPct < 20) {
  status = 'danger';
} else if (recommendedAdditionalPct <= 0) {
  status = 'danger';
} else if (taskPreset.maxWeeklyCostPct > recommendedAdditionalPct * 1.5) {
  status = 'danger';
} else if (sessionRemainingPct < 40) {
  status = 'caution';
} else if (taskPreset.maxWeeklyCostPct > recommendedAdditionalPct) {
  status = 'caution';
} else if (
  sessionRemainingPct >= 70 &&
  recommendedAdditionalPct >= taskPreset.maxWeeklyCostPct
) {
  status = 'safe';
} else {
  status = 'normal';
}
```

## 결과 메시지 톤

숫자만 보여주지 말고 행동 권고 중심으로 표시한다.

예시:

```txt
지금은 60~90분 집중 작업이 가능합니다.
다만 주간 잔여율 기준으로 오늘 대형 에이전트 작업은 1회만 권장합니다.
작업 종료 후 잔여율을 다시 입력하세요.
```

위험 상태 예시:

```txt
현재는 새 대형 작업을 시작하기에 위험합니다.
짧은 질문이나 정리 작업 위주로 사용하고, 가능하면 리셋 이후 진행하세요.
```

## 데이터 모델

```ts
type ProviderType =
  | 'claude'
  | 'claude-code'
  | 'codex'
  | 'chatgpt'
  | 'custom';

type TaskRiskType =
  | 'light'
  | 'normal'
  | 'codeSmall'
  | 'legacyAnalysis'
  | 'agenticLong';

type UsageSnapshot = {
  id: string;
  providerType: ProviderType;
  providerName: string;
  createdAt: string;
  sessionRemainingPct: number;
  weeklyRemainingPct: number;
  weeklyResetAt: string;
  taskRiskType: TaskRiskType;
  memo?: string;
};

type RecommendationStatus =
  | 'safe'
  | 'normal'
  | 'caution'
  | 'danger';

type UsageRecommendation = {
  status: RecommendationStatus;
  hoursUntilWeeklyReset: number;
  daysUntilWeeklyReset: number;
  safeDailyBudgetPct: number;
  todayUsedPct: number;
  recommendedAdditionalPct: number;
  recommendedFocusMinutes: number;
  title: string;
  summary: string;
  warnings: string[];
  suggestions: string[];
};
```

## localStorage

다음 키를 사용한다.

```txt
ai-pacer.snapshots
ai-pacer.settings
ai-pacer.notificationSettings
```

localStorage 접근은 반드시 예외 처리한다.

* JSON parse 실패
* localStorage 접근 불가
* 잘못된 데이터 구조
* storage quota 오류
* null 값
* 배열이 아닌 값

## 컴포넌트 구조 후보

가능하면 다음 구조로 분리한다.

```txt
src/
  pages/
    index.astro
    ai-pacer/index.astro
    about.astro
    privacy.astro
    terms.astro

  components/
    Layout.astro
    Header.astro
    Footer.astro
    AdPlaceholder.astro
    UtilityCard.astro
    AiPacerApp.tsx
    UsageInputForm.tsx
    RecommendationCard.tsx
    SnapshotHistory.tsx
    NotificationSettings.tsx

  lib/
    usageCalculator.ts
    storage.ts
    date.ts
```

## 디자인 요구사항

* 한국어 UI
* 모바일 우선 반응형
* 입력폼은 단순하고 큼직하게
* 결과는 카드 형태
* 상태별 색상 구분
* 광고 placeholder는 하단에 자연스럽게 배치
* 과한 애니메이션 금지
* label 연결
* button type 명시
* 가능하면 결과 영역에 `aria-live` 적용

## SEO 요구사항

`/ai-pacer/` 페이지에 다음 메타 정보를 넣는다.

```txt
title:
AI Pacer - Claude, Codex, ChatGPT 사용량 페이스 계산기

description:
5시간 잔여율과 주간 잔여율을 직접 입력해 오늘 AI를 얼마나 써도 되는지 계산하는 무료 웹 도구입니다. 서버 저장 없이 브라우저에서만 계산합니다.
```

FAQ 섹션을 페이지 하단에 넣는다.

FAQ 예시:

* AI Pacer는 정확한 토큰 계산기인가요?
* 자동으로 ChatGPT나 Claude 사용량을 읽나요?
* 입력한 데이터가 서버에 저장되나요?
* Claude Code와 Codex에도 쓸 수 있나요?
* 모바일에서도 사용할 수 있나요?

## Privacy 페이지 내용

다음 내용을 포함한다.

* 이 사이트는 1차 버전에서 로그인 기능을 제공하지 않는다.
* 사용자가 입력한 사용량 기록은 브라우저 localStorage에 저장된다.
* 입력 데이터는 서버로 전송하지 않는다.
* 브라우저 데이터를 삭제하면 기록도 삭제된다.
* 향후 광고가 적용될 수 있다.

## 실행/검증

구현 후 다음을 확인한다.

```bash
npm install
npm run dev
npm run build
```

가능하면 lint/typecheck 스크립트도 추가한다.

## 완료 후 보고 형식

작업 완료 후 다음을 요약해라.

```txt
## 완료 요약

### 구현한 페이지
-

### 주요 컴포넌트
-

### 계산 로직 위치
-

### localStorage 키
-

### 실행 방법
-

### 빌드 확인
-

### 의도적으로 제외한 기능
-

### 다음 개선 후보
-
```
