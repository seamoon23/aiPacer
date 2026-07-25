export const DEFAULT_WORKDAY_START = "09:00";
export const DEFAULT_WORKDAY_END = "18:00";

export const RESET_WEEKDAYS = [
  { value: 0, shortLabel: "일", label: "일요일" },
  { value: 1, shortLabel: "월", label: "월요일" },
  { value: 2, shortLabel: "화", label: "화요일" },
  { value: 3, shortLabel: "수", label: "수요일" },
  { value: 4, shortLabel: "목", label: "목요일" },
  { value: 5, shortLabel: "금", label: "금요일" },
  { value: 6, shortLabel: "토", label: "토요일" }
] as const;

export type ResetWeekday = (typeof RESET_WEEKDAYS)[number]["value"];
export type PaceStatus =
  | "push"
  | "encourage"
  | "maintain"
  | "caution"
  | "unavailable";
export type WorkSize = "small" | "medium" | "large";

export type PacerCalculationInput = {
  remainingPct: number;
  resetWeekday: ResetWeekday;
  workdayStart?: string;
  workdayEnd?: string;
};

export type WorkEstimate = {
  id: WorkSize;
  label: string;
  example: string;
  capacityCostPct: number;
  durationMinutes: number;
  recommendedCount: number;
};

export type PacerCalculationResult = {
  remainingPct: number;
  resetAt: Date;
  resetLabel: string;
  hoursUntilReset: number;
  effectiveWorkdays: number;
  remainingWorkMinutesToday: number;
  dailyBudgetPct: number;
  status: PaceStatus;
  statusLabel: string;
  title: string;
  message: string;
  workEstimates: WorkEstimate[];
  workdayStart: string;
  workdayEnd: string;
  warning: string | null;
};

type WorkPreset = Omit<WorkEstimate, "recommendedCount">;

const WORK_PRESETS: WorkPreset[] = [
  {
    id: "small",
    label: "소",
    example: "짧은 질문, 문구 정리",
    capacityCostPct: 2,
    durationMinutes: 20
  },
  {
    id: "medium",
    label: "중",
    example: "파일 수정, 검토와 검증",
    capacityCostPct: 6,
    durationMinutes: 60
  },
  {
    id: "large",
    label: "대",
    example: "여러 파일 분석과 구현",
    capacityCostPct: 15,
    durationMinutes: 150
  }
];

const STATUS_LABELS: Record<PaceStatus, string> = {
  push: "집중",
  encourage: "응원",
  maintain: "유지",
  caution: "주의",
  unavailable: "휴식"
};

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function isResetWeekday(value: number): value is ResetWeekday {
  return Number.isInteger(value) && value >= 0 && value <= 6;
}

function parseTime(value: string | undefined): number | null {
  if (!value || !/^\d{2}:\d{2}$/.test(value)) {
    return null;
  }

  const [hours, minutes] = value.split(":").map(Number);
  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return hours * 60 + minutes;
}

function resolveWorkWindow(
  workdayStart: string | undefined,
  workdayEnd: string | undefined
): {
  start: string;
  end: string;
  startMinutes: number;
  endMinutes: number;
  warning: string | null;
} {
  const requestedStart = parseTime(workdayStart);
  const requestedEnd = parseTime(workdayEnd);

  if (
    requestedStart === null ||
    requestedEnd === null ||
    requestedEnd - requestedStart < 60
  ) {
    return {
      start: DEFAULT_WORKDAY_START,
      end: DEFAULT_WORKDAY_END,
      startMinutes: 9 * 60,
      endMinutes: 18 * 60,
      warning: "종료 시간은 시작 시간보다 최소 1시간 뒤여야 합니다."
    };
  }

  return {
    start: workdayStart ?? DEFAULT_WORKDAY_START,
    end: workdayEnd ?? DEFAULT_WORKDAY_END,
    startMinutes: requestedStart,
    endMinutes: requestedEnd,
    warning: null
  };
}

function atLocalMinutes(date: Date, minutesFromMidnight: number): Date {
  const value = new Date(date);
  value.setHours(
    Math.floor(minutesFromMidnight / 60),
    minutesFromMidnight % 60,
    0,
    0
  );
  return value;
}

function getNextResetAt(resetWeekday: ResetWeekday, now: Date): Date {
  const resetAt = new Date(now);
  resetAt.setHours(0, 0, 0, 0);

  const daysAhead = (resetWeekday - now.getDay() + 7) % 7 || 7;
  resetAt.setDate(resetAt.getDate() + daysAhead);
  return resetAt;
}

function getScheduledMinutesUntilReset(
  now: Date,
  resetAt: Date,
  startMinutes: number,
  endMinutes: number
): number {
  let totalMinutes = 0;
  const cursor = new Date(now);
  cursor.setHours(0, 0, 0, 0);

  for (let dayIndex = 0; dayIndex < 8 && cursor < resetAt; dayIndex += 1) {
    const windowStart = atLocalMinutes(cursor, startMinutes);
    const windowEnd = atLocalMinutes(cursor, endMinutes);
    const clippedStart = Math.max(windowStart.getTime(), now.getTime());
    const clippedEnd = Math.min(windowEnd.getTime(), resetAt.getTime());

    if (clippedEnd > clippedStart) {
      totalMinutes += (clippedEnd - clippedStart) / 1000 / 60;
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return totalMinutes;
}

function getRemainingWorkMinutesToday(
  now: Date,
  resetAt: Date,
  startMinutes: number,
  endMinutes: number
): number {
  const windowStart = atLocalMinutes(now, startMinutes);
  const windowEnd = atLocalMinutes(now, endMinutes);
  const clippedStart = Math.max(windowStart.getTime(), now.getTime());
  const clippedEnd = Math.min(windowEnd.getTime(), resetAt.getTime());

  return Math.max(0, (clippedEnd - clippedStart) / 1000 / 60);
}

function getPaceStatus(
  dailyBudgetPct: number,
  remainingWorkMinutesToday: number
): PaceStatus {
  if (remainingWorkMinutesToday <= 0 || dailyBudgetPct < 2) {
    return "unavailable";
  }

  if (dailyBudgetPct >= 18) {
    return "push";
  }

  if (dailyBudgetPct >= 12) {
    return "encourage";
  }

  if (dailyBudgetPct >= 7) {
    return "maintain";
  }

  return "caution";
}

function buildWorkEstimates(
  dailyBudgetPct: number,
  remainingWorkMinutesToday: number
): WorkEstimate[] {
  return WORK_PRESETS.map((preset) => {
    const capacityCount = Math.floor(
      (dailyBudgetPct + Number.EPSILON) / preset.capacityCostPct
    );
    const timeCount = Math.floor(
      remainingWorkMinutesToday / preset.durationMinutes
    );

    return {
      ...preset,
      recommendedCount: Math.max(0, Math.min(capacityCount, timeCount))
    };
  });
}

function getCoachCopy(
  status: PaceStatus,
  workEstimates: WorkEstimate[],
  remainingWorkMinutesToday: number
): Pick<PacerCalculationResult, "title" | "message"> {
  const largeCount =
    workEstimates.find((estimate) => estimate.id === "large")
      ?.recommendedCount ?? 0;
  const mediumCount =
    workEstimates.find((estimate) => estimate.id === "medium")
      ?.recommendedCount ?? 0;

  if (remainingWorkMinutesToday <= 0) {
    return {
      title: "오늘 주 사용시간은 끝났어요",
      message: "새 작업은 다음 주 사용시간에 시작하는 편이 좋습니다."
    };
  }

  if (status === "push") {
    return {
      title: "남기면 아까워요",
      message:
        largeCount > 0
          ? `대형 작업 ${largeCount}회부터 힘 있게 밀어붙이세요.`
          : "남은 시간 안에서 중형 작업부터 힘 있게 밀어붙이세요."
    };
  }

  if (status === "encourage") {
    return {
      title: "여유가 있습니다",
      message:
        mediumCount > 0
          ? `중형 작업 ${mediumCount}회까지 진행한 뒤 잔여율을 확인하세요.`
          : "소형 작업을 먼저 끝내고 잔여율을 다시 확인하세요."
    };
  }

  if (status === "maintain") {
    return {
      title: "지금 페이스가 좋아요",
      message: "중형 작업 하나 또는 소형 작업 여러 개로 현재 흐름을 유지하세요."
    };
  }

  if (status === "caution") {
    return {
      title: "짧게 끊어가세요",
      message: "소형 작업만 골라 처리하고, 큰 작업은 초기화 뒤로 미루세요."
    };
  }

  return {
    title: "새 작업은 잠시 멈춰요",
    message: "꼭 필요한 확인만 짧게 처리하고 초기화 뒤 다시 계산하세요."
  };
}

export function calculatePacer(
  input: PacerCalculationInput,
  now = new Date()
): PacerCalculationResult {
  const remainingPct = clamp(
    Number.isFinite(input.remainingPct) ? input.remainingPct : 0,
    0,
    100
  );
  const resetWeekday = isResetWeekday(input.resetWeekday)
    ? input.resetWeekday
    : 1;
  const workWindow = resolveWorkWindow(
    input.workdayStart,
    input.workdayEnd
  );
  const resetAt = getNextResetAt(resetWeekday, now);
  const workdayMinutes =
    workWindow.endMinutes - workWindow.startMinutes;
  const scheduledMinutes = getScheduledMinutesUntilReset(
    now,
    resetAt,
    workWindow.startMinutes,
    workWindow.endMinutes
  );
  const remainingWorkMinutesToday = getRemainingWorkMinutesToday(
    now,
    resetAt,
    workWindow.startMinutes,
    workWindow.endMinutes
  );
  const effectiveWorkdays = scheduledMinutes / workdayMinutes;
  const todayFraction = remainingWorkMinutesToday / workdayMinutes;
  const fullWorkdayBudgetPct =
    effectiveWorkdays > 0 ? remainingPct / effectiveWorkdays : 0;
  const dailyBudgetPct = clamp(
    fullWorkdayBudgetPct * todayFraction,
    0,
    remainingPct
  );
  const workEstimates = buildWorkEstimates(
    dailyBudgetPct,
    remainingWorkMinutesToday
  );
  const status = getPaceStatus(
    dailyBudgetPct,
    remainingWorkMinutesToday
  );
  const coachCopy = getCoachCopy(
    status,
    workEstimates,
    remainingWorkMinutesToday
  );
  const weekday = RESET_WEEKDAYS.find(
    (option) => option.value === resetWeekday
  );

  return {
    remainingPct,
    resetAt,
    resetLabel: `${weekday?.label ?? "월요일"} 0시`,
    hoursUntilReset: Math.max(
      0,
      (resetAt.getTime() - now.getTime()) / 1000 / 60 / 60
    ),
    effectiveWorkdays,
    remainingWorkMinutesToday,
    dailyBudgetPct,
    status,
    statusLabel: STATUS_LABELS[status],
    title: coachCopy.title,
    message: coachCopy.message,
    workEstimates,
    workdayStart: workWindow.start,
    workdayEnd: workWindow.end,
    warning: workWindow.warning
  };
}
