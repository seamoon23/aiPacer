import { describe, expect, it } from "vitest";

import {
  calculateUsageRecommendation,
  getSessionBasedMinutes
} from "./usageCalculator";

describe("getSessionBasedMinutes", () => {
  it("maps session remaining percentage to focus windows", () => {
    expect(getSessionBasedMinutes(85)).toBe(120);
    expect(getSessionBasedMinutes(65)).toBe(90);
    expect(getSessionBasedMinutes(45)).toBe(60);
    expect(getSessionBasedMinutes(25)).toBe(30);
    expect(getSessionBasedMinutes(10)).toBe(0);
  });
});

describe("calculateUsageRecommendation", () => {
  it("returns a safe recommendation when session and weekly budget are healthy", () => {
    const recommendation = calculateUsageRecommendation(
      {
        sessionRemainingPct: 85,
        weeklyRemainingPct: 60,
        weeklyResetAt: "2026-07-02T09:00"
      },
      [],
      new Date("2026-06-29T09:00:00+09:00")
    );

    expect(recommendation.status).toBe("safe");
    expect(recommendation.recommendedFocusMinutes).toBe(120);
    expect(recommendation.usageNudge).toContain("팍팍 쓰세요");
    expect(recommendation.warnings).toContain(
      "오늘 첫 기록이 없어 오늘 사용량 추정 정확도가 낮습니다."
    );
    expect(recommendation.summary).toContain("권장 흐름");
  });

  it("returns scenario estimates for small, medium, and large work", () => {
    const recommendation = calculateUsageRecommendation(
      {
        sessionRemainingPct: 85,
        weeklyRemainingPct: 60,
        weeklyResetAt: "2026-07-02T09:00",
        dailySessionTarget: 2
      },
      [],
      new Date("2026-06-29T09:00:00+09:00")
    );

    expect(recommendation.workScenarios.map((scenario) => scenario.label)).toEqual([
      "간단 질문",
      "간단 함수 수정",
      "큰 단위 소스 분석/수정"
    ]);
    expect(recommendation.scenarioBasis).toContain("범용 기준");
    expect(recommendation.workScenarios[0]).toMatchObject({
      estimatedMinutes: 15,
      timeRangeLabel: "5~15분",
      fitLabel: "바로 진행"
    });
    expect(recommendation.workScenarios[2]?.estimatedMinutes).toBeGreaterThan(0);
    expect(recommendation.workScenarios[2]?.estimatedMinutes).toBeLessThanOrEqual(60);
    expect(recommendation.workScenarios[2]?.basis).toContain("완료 보장");
  });

  it("describes per-session pacing as a split of today's remaining recommendation", () => {
    const recommendation = calculateUsageRecommendation(
      {
        sessionRemainingPct: 90,
        weeklyRemainingPct: 60,
        weeklyResetAt: "2026-07-02T09:00",
        dailySessionTarget: 2
      },
      [],
      new Date("2026-06-29T09:00:00+09:00")
    );

    expect(recommendation.weeklyGuidance).toContain("오늘 남은 권장량");
    expect(recommendation.weeklyGuidance).toContain("2번");
    expect(recommendation.weeklyGuidance).not.toContain("1회 흐름당");
  });

  it("adds work-hour guidance when a main usage window is configured", () => {
    const recommendation = calculateUsageRecommendation(
      {
        sessionRemainingPct: 90,
        weeklyRemainingPct: 60,
        weeklyResetAt: "2026-07-02T09:00",
        dailySessionTarget: 2,
        workdayStart: "09:00",
        workdayEnd: "18:00"
      },
      [],
      new Date("2026-06-29T15:00:00+09:00")
    );

    expect(recommendation.workHoursGuidance).toContain("09:00~18:00");
    expect(recommendation.workHoursGuidance).toContain("시간당");
  });

  it("returns danger and a reset warning when the weekly reset time is already in the past", () => {
    const recommendation = calculateUsageRecommendation(
      {
        sessionRemainingPct: 15,
        weeklyRemainingPct: 30,
        weeklyResetAt: "2026-06-28T09:00"
      },
      [],
      new Date("2026-06-29T09:00:00+09:00")
    );

    expect(recommendation.status).toBe("danger");
    expect(recommendation.recommendedFocusMinutes).toBe(0);
    expect(recommendation.warnings).toContain(
      "주간 리셋 시간이 이미 지났습니다. 리셋 일시를 다시 입력하세요."
    );
  });

  it("uses the first snapshot from today to estimate today's usage", () => {
    const recommendation = calculateUsageRecommendation(
      {
        sessionRemainingPct: 80,
        weeklyRemainingPct: 50,
        weeklyResetAt: "2026-07-01T09:00"
      },
      [
        {
          id: "snap-1",
          providerType: "codex",
          providerName: "Codex",
          createdAt: "2026-06-29T07:30:00+09:00",
          sessionRemainingPct: 90,
          weeklyRemainingPct: 68,
          weeklyResetAt: "2026-07-01T09:00",
          taskRiskType: "normal"
        }
      ],
      new Date("2026-06-29T13:00:00+09:00")
    );

    expect(recommendation.todayUsedPct).toBe(18);
    expect(recommendation.recommendedFocusMinutes).toBe(120);
  });
});
