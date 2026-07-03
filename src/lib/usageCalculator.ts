import { isSameLocalDay } from "./date";
import type {
  RecommendationStatus,
  TaskRiskType,
  UsageCalculationInput,
  UsageRecommendation,
  UsageSnapshot,
  WorkScenarioEstimate
} from "./types";

export const TASK_RISK_PRESETS: Record<
  TaskRiskType,
  {
    label: string;
    minWeeklyCostPct: number;
    maxWeeklyCostPct: number;
    recommendedMinutes: number;
  }
> = {
  light: {
    label: "가벼운 질문",
    minWeeklyCostPct: 0.5,
    maxWeeklyCostPct: 2,
    recommendedMinutes: 15
  },
  normal: {
    label: "일반 상담",
    minWeeklyCostPct: 2,
    maxWeeklyCostPct: 5,
    recommendedMinutes: 30
  },
  codeSmall: {
    label: "코드 일부 수정",
    minWeeklyCostPct: 5,
    maxWeeklyCostPct: 10,
    recommendedMinutes: 60
  },
  legacyAnalysis: {
    label: "레거시 분석",
    minWeeklyCostPct: 10,
    maxWeeklyCostPct: 20,
    recommendedMinutes: 90
  },
  agenticLong: {
    label: "에이전트 장시간 작업",
    minWeeklyCostPct: 15,
    maxWeeklyCostPct: 40,
    recommendedMinutes: 120
  }
};

const STATUS_COPY: Record<
  RecommendationStatus,
  {
    title: string;
    summaryPrefix: string;
  }
> = {
  safe: {
    title: "지금은 여유가 있습니다",
    summaryPrefix: "아껴 쓰기보다 필요한 흐름을 이어가도 되는 구간입니다."
  },
  normal: {
    title: "지금은 적당히 써도 됩니다",
    summaryPrefix: "큰 무리는 없지만 중간에 한 번 더 잔여 상태를 확인하면 좋습니다."
  },
  caution: {
    title: "속도를 조금 낮추는 편이 좋습니다",
    summaryPrefix: "지금은 짧은 단위로 끊어 쓰고, 큰 작업은 결과를 보며 조절하세요."
  },
  danger: {
    title: "새 대형 작업은 잠시 미루세요",
    summaryPrefix: "남은 세션이나 주간 잔여율이 낮아 핵심 확인만 하는 편이 안전합니다."
  }
};

const WORK_SCENARIO_PRESETS: Array<
  Pick<
    WorkScenarioEstimate,
    "id" | "label" | "description" | "timeRangeLabel" | "basis" | "maxMinutes"
  > & {
    minMinutes: number;
    sessionCostPct: number;
    weeklyCostPct: number;
  }
> = [
  {
    id: "quickQuestion",
    label: "간단 질문",
    description: "짧은 확인, 문구 정리, 방향성 질문",
    timeRangeLabel: "5~15분",
    basis: "짧은 문맥과 단발 응답을 전제로 한 보수적 범위입니다.",
    minMinutes: 5,
    maxMinutes: 15,
    sessionCostPct: 6,
    weeklyCostPct: 2
  },
  {
    id: "smallCodeChange",
    label: "간단 함수 수정",
    description: "단일 파일 또는 작은 함수 수정과 검증",
    timeRangeLabel: "20~40분",
    basis: "작은 코드 수정은 검증 왕복을 포함해 20~40분 뒤 재입력을 권장합니다.",
    minMinutes: 20,
    maxMinutes: 40,
    sessionCostPct: 18,
    weeklyCostPct: 8
  },
  {
    id: "largeSourceWork",
    label: "큰 단위 소스 분석/수정",
    description: "여러 파일 분석, 설계 변경, 장시간 에이전트 작업",
    timeRangeLabel: "30~60분",
    basis: "완료 보장이 아니라 큰 작업을 한 번에 길게 맡기기 전 다시 잔여율을 확인하는 권장 간격입니다.",
    minMinutes: 30,
    maxMinutes: 60,
    sessionCostPct: 48,
    weeklyCostPct: 25
  }
];

export function getSessionBasedMinutes(sessionRemainingPct: number): number {
  if (sessionRemainingPct >= 80) return 120;
  if (sessionRemainingPct >= 60) return 90;
  if (sessionRemainingPct >= 40) return 60;
  if (sessionRemainingPct >= 20) return 30;
  return 0;
}

function clampPercentage(value: number): number {
  return Math.min(100, Math.max(0, value));
}

function clampDailySessionTarget(value: number | undefined): number {
  if (!value || !Number.isFinite(value)) {
    return 1;
  }

  return Math.min(6, Math.max(1, Math.round(value)));
}

function formatFocusLabel(minutes: number): string {
  if (minutes <= 0) {
    return "긴 작업 비추천";
  }

  return `지금부터 약 ${minutes}분`;
}

function roundToFiveMinutes(minutes: number): number {
  return Math.max(0, Math.round(minutes / 5) * 5);
}

function getFitLabel(
  estimatedMinutes: number,
  maxMinutes: number
): WorkScenarioEstimate["fitLabel"] {
  const ratio = maxMinutes > 0 ? estimatedMinutes / maxMinutes : 0;

  if (ratio >= 0.8) return "바로 진행";
  if (ratio >= 0.45) return "짧게 진행";
  if (estimatedMinutes > 0) return "재입력 먼저";
  return "리셋 대기";
}

function buildWorkScenarioEstimates(
  sessionRemainingPct: number,
  recommendedAdditionalPct: number
): WorkScenarioEstimate[] {
  return WORK_SCENARIO_PRESETS.map((preset) => {
    const sessionRatio = sessionRemainingPct / preset.sessionCostPct;
    const weeklyRatio = recommendedAdditionalPct / preset.weeklyCostPct;
    const availabilityRatio = Math.min(
      1,
      Math.max(0, sessionRatio),
      Math.max(0, weeklyRatio)
    );
    const estimatedMinutes = roundToFiveMinutes(
      availabilityRatio <= 0
        ? 0
        : preset.minMinutes + (preset.maxMinutes - preset.minMinutes) * availabilityRatio
    );
    const barPct = Math.min(
      100,
      Math.max(0, (estimatedMinutes / preset.maxMinutes) * 100)
    );

    return {
      id: preset.id,
      label: preset.label,
      description: preset.description,
      timeRangeLabel: preset.timeRangeLabel,
      basis: preset.basis,
      estimatedMinutes,
      maxMinutes: preset.maxMinutes,
      barPct,
      fitLabel: getFitLabel(estimatedMinutes, preset.maxMinutes)
    };
  });
}

function getFirstSnapshotOfToday(
  snapshots: UsageSnapshot[],
  now: Date
): UsageSnapshot | null {
  const matches = snapshots
    .filter((snapshot) => {
      const createdAt = new Date(snapshot.createdAt);
      return !Number.isNaN(createdAt.getTime()) && isSameLocalDay(createdAt, now);
    })
    .sort(
      (left, right) =>
        new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
    );

  return matches[0] ?? null;
}

function getRecommendationStatus(
  sessionRemainingPct: number,
  recommendedAdditionalPct: number
): RecommendationStatus {
  if (sessionRemainingPct < 20 || recommendedAdditionalPct <= 0) {
    return "danger";
  }

  if (sessionRemainingPct < 40 || recommendedAdditionalPct < 8) {
    return "caution";
  }

  if (sessionRemainingPct >= 65 && recommendedAdditionalPct >= 15) {
    return "safe";
  }

  return "normal";
}

function getUsageNudge(
  status: RecommendationStatus,
  useItOrLoseItPct: number,
  dailySessionTarget: number
): string {
  if (useItOrLoseItPct > 0) {
    return `이 패턴이면 오늘 목표 ${dailySessionTarget}회 기준으로 안 쓰면 약 ${useItOrLoseItPct.toFixed(1)}%를 남길 수 있습니다. 필요한 작업은 지금 팍팍 쓰세요.`;
  }

  if (status === "safe") {
    return "이 패턴이면 아직 남습니다. 아끼느라 흐름을 끊기보다 중요한 작업을 이어가세요.";
  }

  if (status === "normal") {
    return "이 정도면 계속 써도 됩니다. 다만 큰 흐름이 길어지면 중간에 다시 입력하세요.";
  }

  if (status === "caution") {
    return "지금은 막 쓰기보다 짧게 확인하고, 잔여율이 더 떨어지면 멈추는 편이 좋습니다.";
  }

  return "지금은 채찍보다 브레이크가 필요합니다. 꼭 필요한 질문만 짧게 처리하세요.";
}

function parseTimeToMinutes(value: string | undefined, fallback: string): number {
  const source = value && /^\d{2}:\d{2}$/.test(value) ? value : fallback;
  const [hours = "0", minutes = "0"] = source.split(":");

  return Number(hours) * 60 + Number(minutes);
}

function formatCompactHours(minutes: number): string {
  if (minutes <= 0) {
    return "0분";
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours <= 0) {
    return `${remainingMinutes}분`;
  }

  if (remainingMinutes === 0) {
    return `${hours}시간`;
  }

  return `${hours}시간 ${remainingMinutes}분`;
}

function getRemainingWorkMinutes(
  now: Date,
  workdayStart: string | undefined,
  workdayEnd: string | undefined
): number {
  const startMinutes = parseTimeToMinutes(workdayStart, "09:00");
  const endMinutes = parseTimeToMinutes(workdayEnd, "18:00");
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const normalizedEndMinutes =
    endMinutes <= startMinutes ? endMinutes + 24 * 60 : endMinutes;
  const normalizedCurrentMinutes =
    currentMinutes < startMinutes && endMinutes <= startMinutes
      ? currentMinutes + 24 * 60
      : currentMinutes;

  if (normalizedCurrentMinutes < startMinutes) {
    return normalizedEndMinutes - startMinutes;
  }

  if (normalizedCurrentMinutes >= normalizedEndMinutes) {
    return 0;
  }

  return normalizedEndMinutes - normalizedCurrentMinutes;
}

function buildWorkHoursGuidance(
  recommendedAdditionalPct: number,
  now: Date,
  workdayStart: string | undefined,
  workdayEnd: string | undefined
): string {
  const displayStart = workdayStart && /^\d{2}:\d{2}$/.test(workdayStart)
    ? workdayStart
    : "09:00";
  const displayEnd = workdayEnd && /^\d{2}:\d{2}$/.test(workdayEnd)
    ? workdayEnd
    : "18:00";
  const remainingWorkMinutes = getRemainingWorkMinutes(
    now,
    displayStart,
    displayEnd
  );

  if (recommendedAdditionalPct <= 0) {
    return `주사용시간 ${displayStart}~${displayEnd} 기준으로도 오늘 추가로 밀어붙일 여지는 거의 없습니다.`;
  }

  if (remainingWorkMinutes <= 0) {
    return recommendedAdditionalPct >= 10
      ? `주사용시간 ${displayStart}~${displayEnd}을 이미 지났습니다. 남은 권장량이 크다면 야간 작업을 의식적으로 열거나 내일 초반에 다시 계산하세요.`
      : `주사용시간 ${displayStart}~${displayEnd}을 이미 지났습니다. 오늘은 짧게 마무리하고 다음 작업 전 다시 입력하세요.`;
  }

  const hourlyPace = recommendedAdditionalPct / (remainingWorkMinutes / 60);

  return `주사용시간 ${displayStart}~${displayEnd} 기준으로 남은 ${formatCompactHours(remainingWorkMinutes)} 동안 시간당 약 ${hourlyPace.toFixed(1)}% 페이스면 오늘 권장량에 맞습니다.`;
}

export function calculateUsageRecommendation(
  input: UsageCalculationInput,
  snapshots: UsageSnapshot[],
  now = new Date()
): UsageRecommendation {
  const normalizedSessionRemainingPct = clampPercentage(input.sessionRemainingPct);
  const normalizedWeeklyRemainingPct = clampPercentage(input.weeklyRemainingPct);
  const dailySessionTarget = clampDailySessionTarget(input.dailySessionTarget);
  const weeklyResetAt = new Date(input.weeklyResetAt);
  const hoursUntilWeeklyReset =
    (weeklyResetAt.getTime() - now.getTime()) / 1000 / 60 / 60;
  const daysUntilWeeklyReset = Math.max(hoursUntilWeeklyReset / 24, 0.25);
  const safeDailyBudgetPct =
    normalizedWeeklyRemainingPct / daysUntilWeeklyReset;

  const warnings: string[] = [];
  const suggestions: string[] = [];
  const firstSnapshotOfToday = getFirstSnapshotOfToday(snapshots, now);
  let todayUsedPct = 0;

  if (Number.isNaN(weeklyResetAt.getTime())) {
    warnings.push("주간 리셋 일시가 올바르지 않습니다. 날짜와 시간을 다시 확인하세요.");
  }

  if (hoursUntilWeeklyReset <= 0) {
    warnings.push("주간 리셋 시간이 이미 지났습니다. 리셋 일시를 다시 입력하세요.");
  }

  if (firstSnapshotOfToday) {
    todayUsedPct = Math.max(
      firstSnapshotOfToday.weeklyRemainingPct - normalizedWeeklyRemainingPct,
      0
    );
  } else {
    warnings.push("오늘 첫 기록이 없어 오늘 사용량 추정 정확도가 낮습니다.");
  }

  const recommendedAdditionalPct = Math.max(safeDailyBudgetPct - todayUsedPct, 0);
  const perSessionPaceBudgetPct =
    recommendedAdditionalPct / dailySessionTarget;
  const useItOrLoseItPct =
    normalizedSessionRemainingPct >= 70 && recommendedAdditionalPct >= 8
      ? recommendedAdditionalPct
      : 0;
  const recommendedFocusMinutes = getSessionBasedMinutes(
    normalizedSessionRemainingPct
  );
  const workScenarios = buildWorkScenarioEstimates(
    normalizedSessionRemainingPct,
    recommendedAdditionalPct
  );
  const scenarioBasis =
    "범용 기준: Claude Code/Codex Pro급 도구를 수동 입력 페이스로 보는 보수적 추정입니다. 모델별 토큰, thinking 난이도, 실제 요청 길이는 알 수 없으므로 완료 보장이 아니라 다음 재입력 전 권장 진행 시간으로 보세요.";
  const workHoursGuidance = buildWorkHoursGuidance(
    recommendedAdditionalPct,
    now,
    input.workdayStart,
    input.workdayEnd
  );
  const recommendedFocusLabel = formatFocusLabel(recommendedFocusMinutes);
  const status = getRecommendationStatus(
    normalizedSessionRemainingPct,
    recommendedAdditionalPct
  );
  const statusCopy = STATUS_COPY[status];
  const usageNudge = getUsageNudge(
    status,
    useItOrLoseItPct,
    dailySessionTarget
  );

  if (status === "danger") {
    suggestions.push("새 대형 작업은 미루고 짧은 질문, 정리, 검토 위주로 사용하세요.");
  } else if (status === "caution") {
    suggestions.push("긴 흐름보다는 짧은 단위로 끊어 쓰고, 작업 후 잔여율을 다시 입력하세요.");
  } else {
    suggestions.push("지금 필요한 작업은 이어가고, 큰 덩어리가 끝나면 잔여율을 다시 입력하세요.");
  }

  if (recommendedAdditionalPct >= 18) {
    suggestions.push(
      `오늘 추가 사용 여지는 약 ${recommendedAdditionalPct.toFixed(1)}%입니다. 너무 아끼면 오히려 남길 수 있습니다.`
    );
  } else if (recommendedAdditionalPct >= 8) {
    suggestions.push(
      `오늘 추가 사용은 약 ${recommendedAdditionalPct.toFixed(1)}% 안쪽으로 관리해보세요.`
    );
  } else {
    suggestions.push("오늘 추가 사용 여지가 작습니다. 꼭 필요한 작업만 우선 처리하세요.");
  }

  const summary =
    recommendedFocusMinutes > 0
      ? `${statusCopy.summaryPrefix} 지금 권장 흐름은 ${recommendedFocusLabel}입니다.`
      : `${statusCopy.summaryPrefix} 지금은 긴 집중 작업보다 짧은 확인 작업이 더 적합합니다.`;

  const sessionGuidance =
    recommendedFocusMinutes > 0
      ? `5시간 세션 잔여율은 ${normalizedSessionRemainingPct.toFixed(1)}%입니다. 이 기준이면 ${recommendedFocusLabel} 정도의 흐름을 잡을 수 있습니다.`
      : `5시간 세션 잔여율은 ${normalizedSessionRemainingPct.toFixed(1)}%입니다. 긴 흐름은 리셋 이후로 넘기는 편이 좋습니다.`;

  const weeklyGuidance =
    useItOrLoseItPct > 0
      ? `오늘 남은 권장량 ${recommendedAdditionalPct.toFixed(1)}%를 ${dailySessionTarget}번에 나누면 한 번당 약 ${perSessionPaceBudgetPct.toFixed(1)}% 페이스입니다. 실제 5시간 세션 1회 소모량이 아니라 오늘 권장량을 나눈 참고값입니다.`
      : `주간 잔여율과 리셋 시간을 나누어 보면 오늘은 약 ${recommendedAdditionalPct.toFixed(1)}% 안에서 쓰는 편이 안정적입니다.`;

  return {
    status,
    normalizedSessionRemainingPct,
    normalizedWeeklyRemainingPct,
    hoursUntilWeeklyReset,
    daysUntilWeeklyReset,
    safeDailyBudgetPct,
    todayUsedPct,
    recommendedAdditionalPct,
    useItOrLoseItPct,
    perSessionPaceBudgetPct,
    dailySessionTarget,
    recommendedFocusMinutes,
    recommendedFocusLabel,
    title: statusCopy.title,
    summary,
    usageNudge,
    sessionGuidance,
    weeklyGuidance,
    workHoursGuidance,
    scenarioBasis,
    workScenarios,
    warnings,
    suggestions
  };
}
