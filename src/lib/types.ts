export type ActiveProviderType = "claude-code" | "codex";

export type ProviderType =
  | ActiveProviderType
  | "claude"
  | "chatgpt"
  | "custom";

export type ProviderUsageDirection = "used-up" | "remaining-down";

export type TaskRiskType =
  | "light"
  | "normal"
  | "codeSmall"
  | "legacyAnalysis"
  | "agenticLong";

export type RecommendationStatus = "safe" | "normal" | "caution" | "danger";

export type UsageSnapshot = {
  id: string;
  weekId?: string;
  providerType: ProviderType;
  providerName: string;
  createdAt: string;
  sessionRemainingPct: number;
  weeklyRemainingPct: number;
  sessionDisplayPct?: number;
  weeklyDisplayPct?: number;
  inputDirection?: ProviderUsageDirection;
  weeklyResetAt: string;
  dailySessionTarget?: number;
  workdayStart?: string;
  workdayEnd?: string;
  taskRiskType: TaskRiskType;
  memo?: string;
};

export type UsageFormSettings = {
  providerType: ActiveProviderType;
  providerName: string;
  sessionRemainingPct: number;
  weeklyRemainingPct: number;
  weeklyResetAt: string;
  dailySessionTarget: number;
  taskRiskType: TaskRiskType;
  memo: string;
  inputModeVersion?: 2;
};

export type ProviderProfile = {
  providerType: ActiveProviderType;
  providerName: string;
  weekId: string;
  weekStartedAt: string;
  weeklyResetAt: string;
  dailySessionTarget: number;
  workdayStart: string;
  workdayEnd: string;
};

export type ProviderProfiles = Record<ActiveProviderType, ProviderProfile>;

export type NotificationSettings = {
  permission: NotificationPermission | "unsupported";
  placeholderEnabled: boolean;
  placeholderTime: string;
  lastTestAt?: string;
};

export type UsageCalculationInput = {
  sessionRemainingPct: number;
  weeklyRemainingPct: number;
  weeklyResetAt: string;
  dailySessionTarget?: number;
  workdayStart?: string;
  workdayEnd?: string;
  taskRiskType?: TaskRiskType;
};

export type UsageRecommendation = {
  status: RecommendationStatus;
  normalizedSessionRemainingPct: number;
  normalizedWeeklyRemainingPct: number;
  hoursUntilWeeklyReset: number;
  daysUntilWeeklyReset: number;
  safeDailyBudgetPct: number;
  todayUsedPct: number;
  recommendedAdditionalPct: number;
  useItOrLoseItPct: number;
  perSessionPaceBudgetPct: number;
  dailySessionTarget: number;
  recommendedFocusMinutes: number;
  recommendedFocusLabel: string;
  title: string;
  summary: string;
  usageNudge: string;
  sessionGuidance: string;
  weeklyGuidance: string;
  workHoursGuidance: string;
  scenarioBasis: string;
  workScenarios: WorkScenarioEstimate[];
  warnings: string[];
  suggestions: string[];
};

export type LastRecommendationState = {
  savedAt: string;
  providerType: ActiveProviderType;
  recommendation: UsageRecommendation;
};

export type WorkScenarioEstimate = {
  id: "quickQuestion" | "smallCodeChange" | "largeSourceWork";
  label: string;
  description: string;
  timeRangeLabel: string;
  basis: string;
  estimatedMinutes: number;
  maxMinutes: number;
  barPct: number;
  fitLabel: "바로 진행" | "짧게 진행" | "재입력 먼저" | "리셋 대기";
};
