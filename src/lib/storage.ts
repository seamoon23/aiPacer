import type {
  ActiveProviderType,
  LastRecommendationState,
  NotificationSettings,
  ProviderProfile,
  ProviderProfiles,
  ProviderUsageDirection,
  ProviderType,
  TaskRiskType,
  UsageFormSettings,
  UsageSnapshot
} from "./types";
import { toProviderDisplayValue } from "./providerDisplay";

export const STORAGE_KEYS = {
  snapshots: "ai-pacer.snapshots",
  settings: "ai-pacer.settings",
  providerProfiles: "ai-pacer.providerProfiles",
  lastRecommendation: "ai-pacer.lastRecommendation",
  notificationSettings: "ai-pacer.notificationSettings"
} as const;

export type SaveSnapshotsResult = {
  persisted: boolean;
  snapshots: UsageSnapshot[];
};

export type MutationSnapshotsResult = {
  persisted: boolean;
  snapshots: UsageSnapshot[];
};

const DEFAULT_SETTINGS: UsageFormSettings = {
  providerType: "codex",
  providerName: "Codex",
  sessionRemainingPct: 80,
  weeklyRemainingPct: 70,
  weeklyResetAt: "",
  dailySessionTarget: 2,
  taskRiskType: "normal",
  memo: "",
  inputModeVersion: 2
};

export const DEFAULT_PROVIDER_PROFILES: ProviderProfiles = {
  codex: {
    providerType: "codex",
    providerName: "Codex",
    weekId: "codex-default-week",
    weekStartedAt: "",
    weeklyResetAt: "",
    dailySessionTarget: 2,
    workdayStart: "09:00",
    workdayEnd: "18:00"
  },
  "claude-code": {
    providerType: "claude-code",
    providerName: "Claude Code",
    weekId: "claude-code-default-week",
    weekStartedAt: "",
    weeklyResetAt: "",
    dailySessionTarget: 1,
    workdayStart: "09:00",
    workdayEnd: "18:00"
  }
};

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  permission: "default",
  placeholderEnabled: false,
  placeholderTime: "09:00"
};

function getBrowserStorage(): Storage | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

function canUseStorage(storage?: Storage): storage is Storage {
  return Boolean(storage);
}

function readJson<T>(key: string, fallback: T, storage = getBrowserStorage()): T {
  if (!canUseStorage(storage)) {
    return fallback;
  }

  try {
    const rawValue = storage.getItem(key);
    if (!rawValue) {
      return fallback;
    }

    return JSON.parse(rawValue) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T, storage = getBrowserStorage()): boolean {
  if (!canUseStorage(storage)) {
    return false;
  }

  try {
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function isProviderType(value: unknown): value is ProviderType {
  return (
    value === "claude" ||
    value === "claude-code" ||
    value === "codex" ||
    value === "chatgpt" ||
    value === "custom"
  );
}

function isActiveProviderType(value: unknown): value is ActiveProviderType {
  return value === "claude-code" || value === "codex";
}

function isTaskRiskType(value: unknown): value is TaskRiskType {
  return (
    value === "light" ||
    value === "normal" ||
    value === "codeSmall" ||
    value === "legacyAnalysis" ||
    value === "agenticLong"
  );
}

function isProviderUsageDirection(value: unknown): value is ProviderUsageDirection {
  return value === "used-up" || value === "remaining-down";
}

function isFinitePercentage(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100;
}

function isDailySessionTarget(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 1 && value <= 6;
}

function isTimeValue(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{2}:\d{2}$/.test(value)) {
    return false;
  }

  const [hours = "", minutes = ""] = value.split(":");
  const parsedHours = Number(hours);
  const parsedMinutes = Number(minutes);

  return (
    Number.isInteger(parsedHours) &&
    Number.isInteger(parsedMinutes) &&
    parsedHours >= 0 &&
    parsedHours <= 23 &&
    parsedMinutes >= 0 &&
    parsedMinutes <= 59
  );
}

function toActiveProviderType(value: unknown): ActiveProviderType {
  if (value === "claude" || value === "claude-code") {
    return "claude-code";
  }

  return "codex";
}

function isSnapshot(value: unknown): value is UsageSnapshot {
  if (!value || typeof value !== "object") {
    return false;
  }

  const snapshot = value as Record<string, unknown>;

  return (
    typeof snapshot.id === "string" &&
    (snapshot.weekId === undefined || typeof snapshot.weekId === "string") &&
    isProviderType(snapshot.providerType) &&
    typeof snapshot.providerName === "string" &&
    typeof snapshot.createdAt === "string" &&
    isFinitePercentage(snapshot.sessionRemainingPct) &&
    isFinitePercentage(snapshot.weeklyRemainingPct) &&
    (snapshot.sessionDisplayPct === undefined ||
      isFinitePercentage(snapshot.sessionDisplayPct)) &&
    (snapshot.weeklyDisplayPct === undefined ||
      isFinitePercentage(snapshot.weeklyDisplayPct)) &&
    (snapshot.inputDirection === undefined ||
      isProviderUsageDirection(snapshot.inputDirection)) &&
    typeof snapshot.weeklyResetAt === "string" &&
    (snapshot.dailySessionTarget === undefined ||
      isDailySessionTarget(snapshot.dailySessionTarget)) &&
    (snapshot.workdayStart === undefined || isTimeValue(snapshot.workdayStart)) &&
    (snapshot.workdayEnd === undefined || isTimeValue(snapshot.workdayEnd)) &&
    isTaskRiskType(snapshot.taskRiskType) &&
    (snapshot.memo === undefined || typeof snapshot.memo === "string")
  );
}

export function sanitizeSnapshots(value: unknown): UsageSnapshot[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isSnapshot)
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    )
    .slice(0, 10);
}

export function loadSnapshots(storage = getBrowserStorage()): UsageSnapshot[] {
  const value = readJson<unknown>(STORAGE_KEYS.snapshots, [], storage);
  return sanitizeSnapshots(value);
}

export function saveSnapshot(
  snapshot: UsageSnapshot,
  storage = getBrowserStorage()
): SaveSnapshotsResult {
  const snapshots = sanitizeSnapshots([snapshot, ...loadSnapshots(storage)]);
  const persisted = writeJson(STORAGE_KEYS.snapshots, snapshots, storage);
  return {
    persisted,
    snapshots
  };
}

export function updateSnapshot(
  snapshot: UsageSnapshot,
  storage = getBrowserStorage()
): MutationSnapshotsResult {
  const currentSnapshots = loadSnapshots(storage);
  const snapshots = sanitizeSnapshots(
    currentSnapshots.map((currentSnapshot) =>
      currentSnapshot.id === snapshot.id ? snapshot : currentSnapshot
    )
  );
  const persisted = writeJson(STORAGE_KEYS.snapshots, snapshots, storage);
  return {
    persisted,
    snapshots
  };
}

export function removeSnapshot(
  snapshotId: string,
  storage = getBrowserStorage()
): MutationSnapshotsResult {
  const snapshots = loadSnapshots(storage).filter(
    (snapshot) => snapshot.id !== snapshotId
  );
  const persisted = writeJson(STORAGE_KEYS.snapshots, snapshots, storage);
  return {
    persisted,
    snapshots
  };
}

export function clearSnapshots(
  storage = getBrowserStorage()
): MutationSnapshotsResult {
  const persisted = writeJson(STORAGE_KEYS.snapshots, [], storage);
  return {
    persisted,
    snapshots: []
  };
}

function sanitizeProviderProfile(
  providerType: ActiveProviderType,
  value: unknown
): ProviderProfile {
  const fallback = DEFAULT_PROVIDER_PROFILES[providerType];

  if (!value || typeof value !== "object") {
    return fallback;
  }

  const profile = value as Record<string, unknown>;

  return {
    providerType,
    providerName:
      typeof profile.providerName === "string"
        ? profile.providerName
        : fallback.providerName,
    weekId: typeof profile.weekId === "string" ? profile.weekId : fallback.weekId,
    weekStartedAt:
      typeof profile.weekStartedAt === "string"
        ? profile.weekStartedAt
        : fallback.weekStartedAt,
    weeklyResetAt:
      typeof profile.weeklyResetAt === "string"
        ? profile.weeklyResetAt
        : fallback.weeklyResetAt,
    dailySessionTarget: isDailySessionTarget(profile.dailySessionTarget)
      ? profile.dailySessionTarget
      : fallback.dailySessionTarget,
    workdayStart: isTimeValue(profile.workdayStart)
      ? profile.workdayStart
      : fallback.workdayStart,
    workdayEnd: isTimeValue(profile.workdayEnd)
      ? profile.workdayEnd
      : fallback.workdayEnd
  };
}

export function sanitizeProviderProfiles(value: unknown): ProviderProfiles {
  const profiles = value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};

  return {
    codex: sanitizeProviderProfile("codex", profiles.codex),
    "claude-code": sanitizeProviderProfile(
      "claude-code",
      profiles["claude-code"] ?? profiles.claude
    )
  };
}

export function loadProviderProfiles(
  storage = getBrowserStorage()
): ProviderProfiles {
  const value = readJson<unknown>(
    STORAGE_KEYS.providerProfiles,
    DEFAULT_PROVIDER_PROFILES,
    storage
  );
  return sanitizeProviderProfiles(value);
}

export function saveProviderProfiles(
  profiles: ProviderProfiles,
  storage = getBrowserStorage()
): boolean {
  return writeJson(
    STORAGE_KEYS.providerProfiles,
    sanitizeProviderProfiles(profiles),
    storage
  );
}

export function loadSettings(storage = getBrowserStorage()): UsageFormSettings {
  const value = readJson<unknown>(STORAGE_KEYS.settings, DEFAULT_SETTINGS, storage);
  if (!value || typeof value !== "object") {
    return DEFAULT_SETTINGS;
  }

  const settings = value as Record<string, unknown>;
  const providerType = isActiveProviderType(settings.providerType)
    ? settings.providerType
    : toActiveProviderType(settings.providerType);
  const isDisplayModeV2 = settings.inputModeVersion === 2;
  const sessionRemainingPct = isFinitePercentage(settings.sessionRemainingPct)
    ? settings.sessionRemainingPct
    : DEFAULT_SETTINGS.sessionRemainingPct;
  const weeklyRemainingPct = isFinitePercentage(settings.weeklyRemainingPct)
    ? settings.weeklyRemainingPct
    : DEFAULT_SETTINGS.weeklyRemainingPct;

  return {
    providerType,
    providerName:
      typeof settings.providerName === "string"
        ? settings.providerName
        : DEFAULT_SETTINGS.providerName,
    sessionRemainingPct: isDisplayModeV2
      ? sessionRemainingPct
      : toProviderDisplayValue(providerType, sessionRemainingPct),
    weeklyRemainingPct: isDisplayModeV2
      ? weeklyRemainingPct
      : toProviderDisplayValue(providerType, weeklyRemainingPct),
    weeklyResetAt:
      typeof settings.weeklyResetAt === "string"
        ? settings.weeklyResetAt
        : DEFAULT_SETTINGS.weeklyResetAt,
    dailySessionTarget: isDailySessionTarget(settings.dailySessionTarget)
      ? settings.dailySessionTarget
      : DEFAULT_SETTINGS.dailySessionTarget,
    taskRiskType: isTaskRiskType(settings.taskRiskType)
      ? settings.taskRiskType
      : DEFAULT_SETTINGS.taskRiskType,
    memo: typeof settings.memo === "string" ? settings.memo : DEFAULT_SETTINGS.memo,
    inputModeVersion: 2
  };
}

export function saveSettings(
  settings: UsageFormSettings,
  storage = getBrowserStorage()
): boolean {
  return writeJson(STORAGE_KEYS.settings, settings, storage);
}

function isLastRecommendationState(value: unknown): value is LastRecommendationState {
  if (!value || typeof value !== "object") {
    return false;
  }

  const state = value as Record<string, unknown>;
  const recommendation = state.recommendation as Record<string, unknown> | undefined;

  if (!recommendation) {
    return false;
  }

  const workScenarios = recommendation.workScenarios;

  return (
    typeof state.savedAt === "string" &&
    isActiveProviderType(state.providerType) &&
    typeof recommendation.status === "string" &&
    typeof recommendation.title === "string" &&
    typeof recommendation.summary === "string" &&
    typeof recommendation.workHoursGuidance === "string" &&
    typeof recommendation.scenarioBasis === "string" &&
    typeof recommendation.normalizedSessionRemainingPct === "number" &&
    typeof recommendation.normalizedWeeklyRemainingPct === "number" &&
    typeof recommendation.recommendedAdditionalPct === "number" &&
    typeof recommendation.useItOrLoseItPct === "number" &&
    typeof recommendation.perSessionPaceBudgetPct === "number" &&
    typeof recommendation.dailySessionTarget === "number" &&
    Array.isArray(workScenarios) &&
    workScenarios.length > 0
  );
}

export function loadLastRecommendation(
  storage = getBrowserStorage()
): LastRecommendationState | null {
  const value = readJson<unknown>(STORAGE_KEYS.lastRecommendation, null, storage);
  return isLastRecommendationState(value) ? value : null;
}

export function saveLastRecommendation(
  state: LastRecommendationState,
  storage = getBrowserStorage()
): boolean {
  return writeJson(STORAGE_KEYS.lastRecommendation, state, storage);
}

export function loadNotificationSettings(
  storage = getBrowserStorage()
): NotificationSettings {
  const value = readJson<unknown>(
    STORAGE_KEYS.notificationSettings,
    DEFAULT_NOTIFICATION_SETTINGS,
    storage
  );

  if (!value || typeof value !== "object") {
    return DEFAULT_NOTIFICATION_SETTINGS;
  }

  const settings = value as Record<string, unknown>;
  const permission = settings.permission;

  return {
    permission:
      permission === "default" ||
      permission === "granted" ||
      permission === "denied" ||
      permission === "unsupported"
        ? permission
        : DEFAULT_NOTIFICATION_SETTINGS.permission,
    placeholderEnabled:
      typeof settings.placeholderEnabled === "boolean"
        ? settings.placeholderEnabled
        : DEFAULT_NOTIFICATION_SETTINGS.placeholderEnabled,
    placeholderTime:
      typeof settings.placeholderTime === "string"
        ? settings.placeholderTime
        : DEFAULT_NOTIFICATION_SETTINGS.placeholderTime,
    lastTestAt:
      typeof settings.lastTestAt === "string" ? settings.lastTestAt : undefined
  };
}

export function saveNotificationSettings(
  settings: NotificationSettings,
  storage = getBrowserStorage()
): boolean {
  return writeJson(STORAGE_KEYS.notificationSettings, settings, storage);
}
