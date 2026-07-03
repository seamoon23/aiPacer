import { beforeEach, describe, expect, it } from "vitest";

import {
  STORAGE_KEYS,
  clearSnapshots,
  loadSettings,
  loadProviderProfiles,
  loadLastRecommendation,
  loadSnapshots,
  removeSnapshot,
  saveProviderProfiles,
  saveLastRecommendation,
  saveSnapshot,
  updateSnapshot,
  type MutationSnapshotsResult,
  type SaveSnapshotsResult
} from "./storage";
import type { LastRecommendationState } from "./types";

const VALID_LAST_RECOMMENDATION: LastRecommendationState = {
  savedAt: "2026-06-30T10:00:00+09:00",
  providerType: "codex",
  recommendation: {
    status: "safe",
    normalizedSessionRemainingPct: 80,
    normalizedWeeklyRemainingPct: 70,
    hoursUntilWeeklyReset: 120,
    daysUntilWeeklyReset: 5,
    safeDailyBudgetPct: 14,
    todayUsedPct: 2,
    recommendedAdditionalPct: 12,
    useItOrLoseItPct: 12,
    perSessionPaceBudgetPct: 6,
    dailySessionTarget: 2,
    recommendedFocusMinutes: 120,
    recommendedFocusLabel: "지금부터 약 120분",
    title: "지금은 여유가 있습니다",
    summary: "필요한 작업을 이어가도 되는 구간입니다.",
    usageNudge: "필요한 작업은 지금 팍팍 쓰세요.",
    sessionGuidance: "5시간 세션 잔여율은 80.0%입니다.",
    weeklyGuidance:
      "오늘 남은 권장량 12.0%를 2번에 나누면 한 번당 약 6.0% 페이스입니다. 실제 5시간 세션 1회 소모량이 아니라 오늘 권장량을 나눈 참고값입니다.",
    workHoursGuidance: "주사용시간 기준으로 남은 시간 동안 페이스를 맞추세요.",
    scenarioBasis: "범용 기준의 수동 입력 추정입니다.",
    workScenarios: [
      {
        id: "quickQuestion",
        label: "간단 질문",
        description: "짧은 확인",
        timeRangeLabel: "5~15분",
        basis: "짧은 문맥 기준입니다.",
        estimatedMinutes: 15,
        maxMinutes: 15,
        barPct: 100,
        fitLabel: "바로 진행"
      }
    ],
    warnings: [],
    suggestions: ["큰 덩어리가 끝나면 잔여율을 다시 입력하세요."]
  }
};

describe("storage helpers", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns an empty snapshot list when stored JSON is invalid", () => {
    window.localStorage.setItem(STORAGE_KEYS.snapshots, "{broken");

    expect(loadSnapshots()).toEqual([]);
  });

  it("falls back safely when localStorage access itself is blocked", () => {
    const originalLocalStorage = window.localStorage;

    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get: () => {
        throw new Error("blocked");
      }
    });

    try {
      expect(loadSnapshots()).toEqual([]);
      expect(loadSettings()).toMatchObject({
        providerType: "codex",
        providerName: "Codex"
      });
    } finally {
      Object.defineProperty(window, "localStorage", {
        configurable: true,
        value: originalLocalStorage
      });
    }
  });

  it("stores snapshots newest-first and trims the list to ten items", () => {
    for (let index = 0; index < 12; index += 1) {
      saveSnapshot({
        id: `snap-${index}`,
        providerType: "chatgpt",
        providerName: "ChatGPT",
        createdAt: `2026-06-29T${String(index).padStart(2, "0")}:00:00+09:00`,
        sessionRemainingPct: 90 - index,
        weeklyRemainingPct: 80 - index,
        weeklyResetAt: "2026-07-01T09:00",
        taskRiskType: "light",
        memo: `memo-${index}`
      });
    }

    const snapshots = loadSnapshots();

    expect(snapshots).toHaveLength(10);
    expect(snapshots[0]?.id).toBe("snap-11");
    expect(snapshots.at(-1)?.id).toBe("snap-2");
  });

  it("removes one snapshot without clearing the rest", () => {
    saveSnapshot({
      id: "keep",
      providerType: "claude",
      providerName: "Claude",
      createdAt: "2026-06-29T09:00:00+09:00",
      sessionRemainingPct: 75,
      weeklyRemainingPct: 55,
      weeklyResetAt: "2026-07-01T09:00",
      taskRiskType: "normal"
    });
    saveSnapshot({
      id: "delete",
      providerType: "codex",
      providerName: "Codex",
      createdAt: "2026-06-29T10:00:00+09:00",
      sessionRemainingPct: 72,
      weeklyRemainingPct: 52,
      weeklyResetAt: "2026-07-01T09:00",
      taskRiskType: "codeSmall"
    });

    removeSnapshot("delete");

    expect(loadSnapshots().map((snapshot) => snapshot.id)).toEqual(["keep"]);
  });

  it("updates one snapshot without creating a duplicate", () => {
    saveSnapshot({
      id: "edit-me",
      weekId: "codex-week",
      providerType: "codex",
      providerName: "Codex",
      createdAt: "2026-06-29T09:00:00+09:00",
      sessionRemainingPct: 75,
      weeklyRemainingPct: 55,
      sessionDisplayPct: 75,
      weeklyDisplayPct: 55,
      weeklyResetAt: "2026-07-01T09:00",
      dailySessionTarget: 2,
      workdayStart: "09:00",
      workdayEnd: "18:00",
      taskRiskType: "normal",
      memo: "수정 전"
    });

    const result = updateSnapshot({
      id: "edit-me",
      weekId: "codex-week",
      providerType: "codex",
      providerName: "Codex",
      createdAt: "2026-06-29T09:00:00+09:00",
      sessionRemainingPct: 70,
      weeklyRemainingPct: 44,
      sessionDisplayPct: 70,
      weeklyDisplayPct: 44,
      weeklyResetAt: "2026-07-01T09:00",
      dailySessionTarget: 2,
      workdayStart: "09:00",
      workdayEnd: "18:00",
      taskRiskType: "normal",
      memo: "수정 후"
    });

    expect(result.persisted).toBe(true);
    expect(result.snapshots).toHaveLength(1);
    expect(loadSnapshots()).toHaveLength(1);
    expect(loadSnapshots()[0]).toMatchObject({
      id: "edit-me",
      createdAt: "2026-06-29T09:00:00+09:00",
      weeklyRemainingPct: 44,
      weeklyDisplayPct: 44,
      memo: "수정 후"
    });
  });

  it("clears every snapshot at once", () => {
    saveSnapshot({
      id: "snap-1",
      providerType: "custom",
      providerName: "Custom",
      createdAt: "2026-06-29T09:00:00+09:00",
      sessionRemainingPct: 65,
      weeklyRemainingPct: 45,
      weeklyResetAt: "2026-07-01T09:00",
      taskRiskType: "legacyAnalysis"
    });

    clearSnapshots();

    expect(loadSnapshots()).toEqual([]);
  });

  it("reports whether persisting snapshots succeeded", () => {
    const brokenStorage = {
      getItem: () => null,
      setItem: () => {
        throw new Error("quota");
      }
    } as unknown as Storage;

    const result: SaveSnapshotsResult = saveSnapshot(
      {
        id: "snap-fail",
        providerType: "claude",
        providerName: "Claude",
        createdAt: "2026-06-29T09:00:00+09:00",
        sessionRemainingPct: 80,
        weeklyRemainingPct: 65,
        weeklyResetAt: "2026-07-01T09:00",
        taskRiskType: "normal"
      },
      brokenStorage
    );

    expect(result.persisted).toBe(false);
    expect(result.snapshots).toHaveLength(1);
  });

  it("reports delete persistence failure without losing in-memory result", () => {
    const brokenStorage = {
      getItem: () =>
        JSON.stringify([
          {
            id: "delete-me",
            providerType: "claude",
            providerName: "Claude",
            createdAt: "2026-06-29T09:00:00+09:00",
            sessionRemainingPct: 80,
            weeklyRemainingPct: 60,
            weeklyResetAt: "2026-07-01T09:00",
            taskRiskType: "normal"
          }
        ]),
      setItem: () => {
        throw new Error("quota");
      }
    } as unknown as Storage;

    const result: MutationSnapshotsResult = removeSnapshot("delete-me", brokenStorage);

    expect(result.persisted).toBe(false);
    expect(result.snapshots).toEqual([]);
  });

  it("reports clear persistence failure without crashing", () => {
    const brokenStorage = {
      getItem: () =>
        JSON.stringify([
          {
            id: "snap-1",
            providerType: "claude",
            providerName: "Claude",
            createdAt: "2026-06-29T09:00:00+09:00",
            sessionRemainingPct: 80,
            weeklyRemainingPct: 60,
            weeklyResetAt: "2026-07-01T09:00",
            taskRiskType: "normal"
          }
        ]),
      setItem: () => {
        throw new Error("quota");
      }
    } as unknown as Storage;

    const result: MutationSnapshotsResult = clearSnapshots(brokenStorage);

    expect(result.persisted).toBe(false);
    expect(result.snapshots).toEqual([]);
  });

  it("persists extended provider profiles and falls back from invalid work hours", () => {
    saveProviderProfiles({
      codex: {
        providerType: "codex",
        providerName: "Codex",
        weekId: "codex-20260630",
        weekStartedAt: "2026-06-30T00:00:00.000Z",
        weeklyResetAt: "2026-07-06T07:00",
        dailySessionTarget: 3,
        workdayStart: "10:00",
        workdayEnd: "19:00"
      },
      "claude-code": {
        providerType: "claude-code",
        providerName: "Claude Code",
        weekId: "claude-20260630",
        weekStartedAt: "2026-06-30T00:00:00.000Z",
        weeklyResetAt: "2026-07-04T08:00",
        dailySessionTarget: 2,
        workdayStart: "25:00",
        workdayEnd: "broken"
      }
    });

    const profiles = loadProviderProfiles();

    expect(profiles.codex).toMatchObject({
      weekId: "codex-20260630",
      weekStartedAt: "2026-06-30T00:00:00.000Z",
      weeklyResetAt: "2026-07-06T07:00",
      dailySessionTarget: 3,
      workdayStart: "10:00",
      workdayEnd: "19:00"
    });
    expect(profiles["claude-code"]).toMatchObject({
      weekId: "claude-20260630",
      workdayStart: "09:00",
      workdayEnd: "18:00"
    });
  });

  it("persists and restores the last recommendation state", () => {
    expect(saveLastRecommendation(VALID_LAST_RECOMMENDATION)).toBe(true);

    expect(loadLastRecommendation()).toMatchObject({
      savedAt: "2026-06-30T10:00:00+09:00",
      providerType: "codex",
      recommendation: {
        title: "지금은 여유가 있습니다",
        workScenarios: [
          {
            id: "quickQuestion",
            estimatedMinutes: 15
          }
        ]
      }
    });
  });

  it("ignores malformed last recommendation state instead of restoring stale UI", () => {
    window.localStorage.setItem(
      STORAGE_KEYS.lastRecommendation,
      JSON.stringify({
        savedAt: "2026-06-30T10:00:00+09:00",
        providerType: "codex",
        recommendation: {
          status: "safe",
          title: "옛날 저장 형태"
        }
      })
    );

    expect(loadLastRecommendation()).toBeNull();
  });
});
