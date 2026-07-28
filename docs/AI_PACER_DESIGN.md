# AI Pacer Design

## 제품 정의

AI Pacer는 주간 남은 AI 용량을 오늘 가능한 작업 횟수로 바꾸는 정적 계산기다. 공식 사용량 추적기, 토큰 계산기, 자동 감지 도구가 아니다.

## 화면 원칙

- 한 페이지에서 입력과 결과를 동시에 보여준다.
- 주 입력은 Claude 플랜, 주간 남은 용량, 초기화 일정 세 묶음이다.
- 주 사용시간은 기본 09:00부터 18:00이며 필요할 때만 바꾼다.
- 긴 설명은 `계산 기준` 다이얼로그에 둔다.
- 기록, 알림, 도구 비교, 내보내기 화면은 만들지 않는다.
- 카드 반경은 8px 이하로 유지한다.
- 회색과 흰색을 바탕으로 파랑을 주 강조색으로 쓴다.
- 캐릭터는 실제 샴고양이 달콤이를 바탕으로 한 굵은 안경의 사감 선생님 코치다.
- 청록 가디건과 흰 셔츠 깃만 사용하고 제복, 완장, 깃발, 군사적 또는 정치적 상징은 사용하지 않는다.
- 코치 상단 표기는 상태명 대신 항상 `달콤이 says`를 사용한다.

## 계산 입력

```ts
type PacerCalculationInput = {
  plan?: "pro" | "max5x";
  remainingPct: number;
  resetWeekday: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  resetTime?: string;
  workdayStart?: string;
  workdayEnd?: string;
};
```

다음 초기화는 선택한 요일과 시간의 다음 도래 시점이다. 오늘이 선택 요일이고 시간이 남았으면 오늘을, 이미 지났으면 다음 주 같은 요일을 사용한다.

## 작업 기준

| 규모 | Pro 1x | Max 5x | 대화·문맥 | 예시 |
| --- | ---: | ---: | --- | --- |
| 소 | 2% | 0.4% | 1-2턴, 짧은 문맥 | 짧은 질문, 단일 함수·문구 수정 |
| 중 | 6% | 1.2% | 3-5턴, 중간 문맥 | 단일 파일 수정, 검토·버그 추적 |
| 대 | 15% | 3% | 6턴 이상, 긴 문맥 | 여러 파일 분석, 설계·구현 |

```ts
workdayMinutes = workdayEndMinutes - workdayStartMinutes;
effectiveWorkdays = scheduledMinutesUntilReset / workdayMinutes;
dailyBudgetPct = Math.min(
  remainingPct,
  effectiveWorkdays > 0
    ? remainingPct / effectiveWorkdays
    : remainingPct
);

capacityMultiplier = plan === "max5x" ? 5 : 1;
adjustedCapacityCostPct = baseCapacityCostPct / capacityMultiplier;

recommendedCount = Math.floor(
  dailyBudgetPct / adjustedCapacityCostPct
);
```

주요 사용시간은 초기화까지 남은 사용일 환산값을 구하는 기준이며, 현재 시각이 시간대 밖이어도 추천을 0으로 차단하지 않는다. 세 규모의 횟수는 같은 오늘 예산을 각 규모에만 사용했을 때의 값이며 서로 더하지 않는다. 초기화 전 예정된 사용 구간이 없으면 남은 용량 전부를 이번 예산으로 배정한다. Pro를 1배 기준으로 두고 Max 5x는 공식 안내된 세션 용량 배수에 맞춰 작업당 예상 소모율을 1/5로 보정한다. 플랜 가격에 비례해 임의 추정하지 않으며 모델, 문맥, 기능, 별도 세션·주간 한도에 따른 차이는 계산 범위 밖이다.

## 상태 기준

- `push`: 오늘 권장 용량 18% 이상, 지시봉을 든 독려 표정
- `encourage`: 12% 이상, 엄지를 든 응원 표정
- `maintain`: 7% 이상, 계획표를 보는 유지 표정
- `caution`: 2% 이상, 안경을 낮춘 주의 표정
- `unavailable`: 오늘 권장 용량 2% 미만, 노트 위에서 쉬는 표정

## 배포 형태

- 웹: Astro 정적 출력
- 확장: Manifest V3 action popup
- 확장 권한: 없음
- 데이터 저장: 없음
- 외부 통신: 후원 링크를 사용자가 누를 때의 페이지 이동만 허용
