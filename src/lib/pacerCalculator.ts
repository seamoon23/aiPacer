export const DEFAULT_WORKDAY_START = "09:00";
export const DEFAULT_WORKDAY_END = "18:00";
export const DEFAULT_RESET_TIME = "00:00";

export type PacerLocale = "ko" | "en";

export const RESET_WEEKDAYS = [
  {
    value: 0,
    shortLabel: { ko: "일", en: "S" },
    label: { ko: "일요일", en: "Sunday" }
  },
  {
    value: 1,
    shortLabel: { ko: "월", en: "M" },
    label: { ko: "월요일", en: "Monday" }
  },
  {
    value: 2,
    shortLabel: { ko: "화", en: "T" },
    label: { ko: "화요일", en: "Tuesday" }
  },
  {
    value: 3,
    shortLabel: { ko: "수", en: "W" },
    label: { ko: "수요일", en: "Wednesday" }
  },
  {
    value: 4,
    shortLabel: { ko: "목", en: "T" },
    label: { ko: "목요일", en: "Thursday" }
  },
  {
    value: 5,
    shortLabel: { ko: "금", en: "F" },
    label: { ko: "금요일", en: "Friday" }
  },
  {
    value: 6,
    shortLabel: { ko: "토", en: "S" },
    label: { ko: "토요일", en: "Saturday" }
  }
] as const;

export type ResetWeekday = (typeof RESET_WEEKDAYS)[number]["value"];
export type PaceStatus =
  | "push"
  | "encourage"
  | "maintain"
  | "caution"
  | "unavailable";
export type WorkSize = "small" | "medium" | "large";
export type PacerWarningCode = "reset-time" | "work-window";

export type PacerCalculationInput = {
  remainingPct: number;
  resetWeekday: ResetWeekday;
  resetTime?: string;
  workdayStart?: string;
  workdayEnd?: string;
  locale?: PacerLocale;
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
  resetTime: string;
  workdayStart: string;
  workdayEnd: string;
  warning: string | null;
  warningCodes: PacerWarningCode[];
};

type WorkPreset = Omit<WorkEstimate, "recommendedCount">;
type LocalizedWorkPreset = Omit<WorkPreset, "label" | "example"> & {
  label: Record<PacerLocale, string>;
  example: Record<PacerLocale, string>;
};

const WORK_PRESETS: LocalizedWorkPreset[] = [
  {
    id: "small",
    label: { ko: "소", en: "S" },
    example: {
      ko: "짧은 질문, 문구 정리",
      en: "Quick questions and copy edits"
    },
    capacityCostPct: 2,
    durationMinutes: 20
  },
  {
    id: "medium",
    label: { ko: "중", en: "M" },
    example: {
      ko: "파일 수정, 검토와 검증",
      en: "File edits, review and checks"
    },
    capacityCostPct: 6,
    durationMinutes: 60
  },
  {
    id: "large",
    label: { ko: "대", en: "L" },
    example: {
      ko: "여러 파일 분석과 구현",
      en: "Multi-file analysis and build"
    },
    capacityCostPct: 15,
    durationMinutes: 150
  }
];

const STATUS_LABELS: Record<
  PacerLocale,
  Record<PaceStatus, string>
> = {
  ko: {
    push: "집중",
    encourage: "응원",
    maintain: "유지",
    caution: "주의",
    unavailable: "휴식"
  },
  en: {
    push: "Focus",
    encourage: "Go",
    maintain: "Steady",
    caution: "Caution",
    unavailable: "Rest"
  }
};

export function resolvePacerLocale(
  language: string | undefined
): PacerLocale {
  return language?.toLowerCase().startsWith("ko") ? "ko" : "en";
}

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
  workdayEnd: string | undefined,
  locale: PacerLocale
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
      warning:
        locale === "ko"
          ? "종료 시간은 시작 시간보다 최소 1시간 뒤여야 합니다."
          : "End time must be at least one hour after start time."
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

function resolveResetTime(
  resetTime: string | undefined,
  locale: PacerLocale
): {
  value: string;
  minutes: number;
  warning: string | null;
} {
  const requestedTime = parseTime(resetTime);

  if (requestedTime === null) {
    return {
      value: DEFAULT_RESET_TIME,
      minutes: 0,
      warning:
        locale === "ko"
          ? "초기화 시간이 올바르지 않아 00:00을 사용합니다."
          : "Reset time is invalid, so 00:00 is used."
    };
  }

  return {
    value: resetTime ?? DEFAULT_RESET_TIME,
    minutes: requestedTime,
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

function getNextResetAt(
  resetWeekday: ResetWeekday,
  resetMinutes: number,
  now: Date
): Date {
  const resetAt = atLocalMinutes(now, resetMinutes);
  const daysAhead = (resetWeekday - now.getDay() + 7) % 7;
  resetAt.setDate(resetAt.getDate() + daysAhead);

  if (resetAt.getTime() <= now.getTime()) {
    resetAt.setDate(resetAt.getDate() + 7);
  }

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
  remainingWorkMinutesToday: number,
  locale: PacerLocale
): WorkEstimate[] {
  return WORK_PRESETS.map((preset) => {
    const capacityCount = Math.floor(
      (dailyBudgetPct + Number.EPSILON) / preset.capacityCostPct
    );
    const timeCount = Math.floor(
      remainingWorkMinutesToday / preset.durationMinutes
    );

    return {
      id: preset.id,
      label: preset.label[locale],
      example: preset.example[locale],
      capacityCostPct: preset.capacityCostPct,
      durationMinutes: preset.durationMinutes,
      recommendedCount: Math.max(0, Math.min(capacityCount, timeCount))
    };
  });
}

function getCoachCopy(
  status: PaceStatus,
  workEstimates: WorkEstimate[],
  remainingWorkMinutesToday: number,
  locale: PacerLocale
): Pick<PacerCalculationResult, "title" | "message"> {
  const largeCount =
    workEstimates.find((estimate) => estimate.id === "large")
      ?.recommendedCount ?? 0;
  const mediumCount =
    workEstimates.find((estimate) => estimate.id === "medium")
      ?.recommendedCount ?? 0;

  if (remainingWorkMinutesToday <= 0) {
    return locale === "ko"
      ? {
          title: "오늘 주 사용시간은 끝났어요",
          message: "새 작업은 다음 주 사용시간에 시작하는 편이 좋습니다."
        }
      : {
          title: "Today’s work window is over",
          message: "Start new work in your next scheduled work window."
        };
  }

  if (status === "push") {
    return locale === "ko"
      ? {
          title: "남기면 아까워요",
          message:
            largeCount > 0
              ? `대형 작업 ${largeCount}회부터 힘 있게 밀어붙이세요.`
              : "남은 시간 안에서 중형 작업부터 힘 있게 밀어붙이세요."
        }
      : {
          title: "Don’t leave it unused",
          message:
            largeCount > 0
              ? `Start strong with up to ${largeCount} large tasks.`
              : "Start with medium tasks while there is still time."
        };
  }

  if (status === "encourage") {
    return locale === "ko"
      ? {
          title: "여유가 있습니다",
          message:
            mediumCount > 0
              ? `중형 작업 ${mediumCount}회까지 진행한 뒤 잔여율을 확인하세요.`
              : "소형 작업을 먼저 끝내고 잔여율을 다시 확인하세요."
        }
      : {
          title: "You have room",
          message:
            mediumCount > 0
              ? `Do up to ${mediumCount} medium tasks, then check capacity again.`
              : "Finish a small task first, then check capacity again."
        };
  }

  if (status === "maintain") {
    return locale === "ko"
      ? {
          title: "지금 페이스가 좋아요",
          message: "중형 작업 하나 또는 소형 작업 여러 개로 현재 흐름을 유지하세요."
        }
      : {
          title: "Your pace looks good",
          message: "Keep the flow with one medium task or several small tasks."
        };
  }

  if (status === "caution") {
    return locale === "ko"
      ? {
          title: "짧게 끊어가세요",
          message: "소형 작업만 골라 처리하고, 큰 작업은 초기화 뒤로 미루세요."
        }
      : {
          title: "Keep tasks short",
          message: "Pick small tasks only and save large work until after reset."
        };
  }

  return locale === "ko"
    ? {
        title: "새 작업은 잠시 멈춰요",
        message: "꼭 필요한 확인만 짧게 처리하고 초기화 뒤 다시 계산하세요."
      }
    : {
        title: "Pause new work for now",
        message: "Handle only essential checks, then recalculate after reset."
      };
}

export function calculatePacer(
  input: PacerCalculationInput,
  now = new Date()
): PacerCalculationResult {
  const locale: PacerLocale = input.locale === "en" ? "en" : "ko";
  const remainingPct = clamp(
    Number.isFinite(input.remainingPct) ? input.remainingPct : 0,
    0,
    100
  );
  const resetWeekday = isResetWeekday(input.resetWeekday)
    ? input.resetWeekday
    : 1;
  const resetTime = resolveResetTime(
    input.resetTime ?? DEFAULT_RESET_TIME,
    locale
  );
  const workWindow = resolveWorkWindow(
    input.workdayStart,
    input.workdayEnd,
    locale
  );
  const resetAt = getNextResetAt(
    resetWeekday,
    resetTime.minutes,
    now
  );
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
    remainingWorkMinutesToday,
    locale
  );
  const status = getPaceStatus(
    dailyBudgetPct,
    remainingWorkMinutesToday
  );
  const coachCopy = getCoachCopy(
    status,
    workEstimates,
    remainingWorkMinutesToday,
    locale
  );
  const weekday = RESET_WEEKDAYS.find(
    (option) => option.value === resetWeekday
  );
  const warningCodes: PacerWarningCode[] = [];
  const warnings: string[] = [];

  if (resetTime.warning) {
    warningCodes.push("reset-time");
    warnings.push(resetTime.warning);
  }

  if (workWindow.warning) {
    warningCodes.push("work-window");
    warnings.push(workWindow.warning);
  }

  return {
    remainingPct,
    resetAt,
    resetLabel:
      locale === "ko"
        ? `${weekday?.label.ko ?? "월요일"} ${resetTime.value}`
        : `${weekday?.label.en ?? "Monday"} at ${resetTime.value}`,
    hoursUntilReset: Math.max(
      0,
      (resetAt.getTime() - now.getTime()) / 1000 / 60 / 60
    ),
    effectiveWorkdays,
    remainingWorkMinutesToday,
    dailyBudgetPct,
    status,
    statusLabel: STATUS_LABELS[locale][status],
    title: coachCopy.title,
    message: coachCopy.message,
    workEstimates,
    resetTime: resetTime.value,
    workdayStart: workWindow.start,
    workdayEnd: workWindow.end,
    warning: warnings.length > 0 ? warnings.join(" ") : null,
    warningCodes
  };
}
