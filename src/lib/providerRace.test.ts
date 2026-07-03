import { describe, expect, it } from "vitest";

import { buildProviderRaceSummary } from "./providerRace";
import type { UsageSnapshot } from "./types";

function snapshot(
  override: Partial<UsageSnapshot> & Pick<UsageSnapshot, "id" | "providerType" | "providerName" | "createdAt">
): UsageSnapshot {
  return {
    weekId: "week-1",
    sessionRemainingPct: 70,
    weeklyRemainingPct: 70,
    weeklyResetAt: "2026-07-06T07:00:00+09:00",
    dailySessionTarget: 2,
    workdayStart: "09:00",
    workdayEnd: "18:00",
    taskRiskType: "normal",
    ...override
  };
}

describe("provider race summary", () => {
  it("compares Codex and Claude Code and encourages the underused provider", () => {
    const summary = buildProviderRaceSummary([
      snapshot({
        id: "codex-latest",
        providerType: "codex",
        providerName: "Codex",
        createdAt: "2026-07-01T12:00:00+09:00",
        sessionRemainingPct: 75,
        weeklyRemainingPct: 82
      }),
      snapshot({
        id: "claude-latest",
        providerType: "claude-code",
        providerName: "Claude Code",
        createdAt: "2026-07-01T11:30:00+09:00",
        sessionRemainingPct: 35,
        weeklyRemainingPct: 31
      }),
      snapshot({
        id: "codex-morning",
        providerType: "codex",
        providerName: "Codex",
        createdAt: "2026-07-01T09:00:00+09:00",
        sessionRemainingPct: 90,
        weeklyRemainingPct: 90
      }),
      snapshot({
        id: "claude-morning",
        providerType: "claude-code",
        providerName: "Claude Code",
        createdAt: "2026-07-01T09:10:00+09:00",
        sessionRemainingPct: 55,
        weeklyRemainingPct: 48
      })
    ]);

    expect(summary).not.toBeNull();
    expect(summary?.hasComparison).toBe(true);
    expect(summary?.headline).toBe("Codex가 따라잡을 차례입니다");
    expect(summary?.spotlightProviderName).toBe("Codex");
    expect(summary?.lanes).toHaveLength(2);
    expect(summary?.lanes[0]).toMatchObject({
      providerName: "Codex",
      mascot: "turtle",
      coachTone: "push",
      todayUsedPct: 8,
      message: "많이 남아 있습니다. 필요한 작업은 Codex에 더 맡겨도 좋습니다."
    });
    expect(summary?.lanes[1]).toMatchObject({
      providerName: "Claude Code",
      mascot: "rabbit",
      coachTone: "rest",
      todayUsedPct: 17,
      message: "상대적으로 많이 달렸습니다. 큰 작업 전에는 한 번 더 잔여율을 확인하세요."
    });
  });

  it("builds a solo coach card when only one provider has records", () => {
    const summary = buildProviderRaceSummary([
      snapshot({
        id: "claude-latest",
        providerType: "claude-code",
        providerName: "Claude Code",
        createdAt: "2026-07-01T12:00:00+09:00",
        sessionRemainingPct: 64,
        weeklyRemainingPct: 72
      })
    ]);

    expect(summary).not.toBeNull();
    expect(summary?.hasComparison).toBe(false);
    expect(summary?.headline).toBe("Claude Code 단독 페이스 체크");
    expect(summary?.lanes).toHaveLength(1);
    expect(summary?.lanes[0]).toMatchObject({
      providerType: "claude-code",
      providerName: "Claude Code",
      mascot: "turtle",
      coachTone: "push",
      todayUsedPct: 0,
      message: "여유가 꽤 남아 있습니다. 오늘 필요한 작업을 더 밀어붙여도 됩니다."
    });
  });

  it("returns null when there are no snapshots", () => {
    expect(buildProviderRaceSummary([])).toBeNull();
  });
});
