import { describe, expect, it } from "vitest";

import { calculatePacer, resolvePacerLocale } from "./pacerCalculator";

describe("calculatePacer", () => {
  it("uses Korean only for Korean browser locales", () => {
    expect(resolvePacerLocale("ko-KR")).toBe("ko");
    expect(resolvePacerLocale("en-US")).toBe("en");
    expect(resolvePacerLocale("fr-FR")).toBe("en");
  });

  it("spreads remaining capacity across the next seven work windows", () => {
    const now = new Date("2026-07-27T09:00:00");
    const result = calculatePacer(
      {
        remainingPct: 70,
        resetWeekday: 1,
        workdayStart: "09:00",
        workdayEnd: "18:00"
      },
      now
    );

    expect(result.resetAt).toEqual(new Date("2026-08-03T00:00:00"));
    expect(result.effectiveWorkdays).toBeCloseTo(7, 5);
    expect(result.dailyBudgetPct).toBeCloseTo(10, 5);
    expect(result.status).toBe("maintain");
  });

  it("keeps a full-session recommendation during a partial workday", () => {
    const now = new Date("2026-07-27T13:30:00");
    const result = calculatePacer(
      {
        remainingPct: 70,
        resetWeekday: 5,
        workdayStart: "09:00",
        workdayEnd: "18:00"
      },
      now
    );

    expect(result.effectiveWorkdays).toBeCloseTo(3.5, 5);
    expect(result.remainingWorkMinutesToday).toBe(270);
    expect(result.dailyBudgetPct).toBeCloseTo(20, 5);
    expect(result.isFinalWorkWindow).toBe(false);
    expect(result.mixedWorkPlan).toEqual([
      { id: "large", label: "대", count: 1 },
      { id: "small", label: "소", count: 2 }
    ]);
  });

  it("keeps a daily recommendation after the allocation window", () => {
    const now = new Date("2026-07-27T19:00:00");
    const result = calculatePacer(
      {
        remainingPct: 80,
        resetWeekday: 5,
        workdayStart: "09:00",
        workdayEnd: "18:00"
      },
      now
    );

    expect(result.remainingWorkMinutesToday).toBe(0);
    expect(result.effectiveWorkdays).toBeCloseTo(3, 5);
    expect(result.dailyBudgetPct).toBeCloseTo(80 / 3, 5);
    expect(result.status).toBe("push");
    expect(
      result.workEstimates.map((estimate) => estimate.recommendedCount)
    ).toEqual([13, 4, 1]);
  });

  it("does not shrink the daily budget by elapsed hours", () => {
    const result = calculatePacer(
      {
        remainingPct: 60,
        resetWeekday: 2,
        resetTime: "06:00",
        workdayStart: "09:00",
        workdayEnd: "18:00"
      },
      new Date("2026-07-28T15:00:00")
    );

    expect(result.hoursUntilReset).toBeCloseTo(159, 5);
    expect(result.effectiveWorkdays).toBeCloseTo(57 / 9, 5);
    expect(result.dailyBudgetPct).toBeCloseTo(60 / (57 / 9), 5);
    expect(
      result.workEstimates.map((estimate) => estimate.recommendedCount)
    ).toEqual([4, 1, 0]);
  });

  it("returns a useful budget outside the configured hours", () => {
    const result = calculatePacer(
      {
        remainingPct: 39,
        resetWeekday: 2,
        resetTime: "00:00",
        workdayStart: "09:00",
        workdayEnd: "18:00"
      },
      new Date("2026-07-28T21:00:00")
    );

    expect(result.hoursUntilReset).toBeCloseTo(147, 5);
    expect(result.remainingWorkMinutesToday).toBe(0);
    expect(result.effectiveWorkdays).toBeCloseTo(6, 5);
    expect(result.dailyBudgetPct).toBeCloseTo(6.5, 5);
    expect(result.status).toBe("caution");
    expect(
      result.workEstimates.map((estimate) => estimate.recommendedCount)
    ).toEqual([3, 1, 0]);
    expect(result.title).toBe("짧게 끊어가세요");
  });

  it("calculates each task count from the shared capacity budget", () => {
    const now = new Date("2026-07-27T09:00:00");
    const result = calculatePacer(
      {
        remainingPct: 100,
        resetWeekday: 2,
        workdayStart: "09:00",
        workdayEnd: "18:00"
      },
      now
    );

    expect(result.dailyBudgetPct).toBeCloseTo(100, 5);
    expect(
      result.workEstimates.map((estimate) => [
        estimate.id,
        estimate.recommendedCount
      ])
    ).toEqual([
      ["small", 50],
      ["medium", 16],
      ["large", 6]
    ]);
    expect(result.mixedWorkPlan).toEqual([
      { id: "large", label: "대", count: 6 },
      { id: "medium", label: "중", count: 1 },
      { id: "small", label: "소", count: 2 }
    ]);
  });

  it("applies the Max 5x capacity multiplier to task costs", () => {
    const result = calculatePacer(
      {
        remainingPct: 70,
        resetWeekday: 5,
        plan: "max5x",
        workdayStart: "09:00",
        workdayEnd: "18:00"
      },
      new Date("2026-07-27T13:30:00")
    );

    expect(result.dailyBudgetPct).toBeCloseTo(20, 5);
    expect(result.plan).toBe("max5x");
    expect(result.capacityMultiplier).toBe(5);
    expect(
      result.workEstimates.map((estimate) => [
        estimate.capacityCostPct,
        estimate.recommendedCount
      ])
    ).toEqual([
      [0.4, 50],
      [1.2, 16],
      [3, 6]
    ]);
    expect(result.mixedWorkPlan).toEqual([
      { id: "large", label: "대", count: 6 },
      { id: "medium", label: "중", count: 1 },
      { id: "small", label: "소", count: 2 }
    ]);
  });

  it("keeps a capacity-fit large task when only 30 work minutes remain", () => {
    const result = calculatePacer(
      {
        remainingPct: 15,
        resetWeekday: 1,
        resetTime: "18:00",
        workdayStart: "09:00",
        workdayEnd: "18:00"
      },
      new Date("2026-07-27T17:30:00")
    );

    expect(result.remainingWorkMinutesToday).toBe(30);
    expect(result.dailyBudgetPct).toBeCloseTo(15, 5);
    expect(result.isFinalWorkWindow).toBe(true);
    expect(
      result.workEstimates.find((estimate) => estimate.id === "large")
        ?.recommendedCount
    ).toBe(1);
    expect(result.title).toBe("초기화 전 마지막 구간이에요");
  });

  it("falls back to 09:00-18:00 for an invalid work window", () => {
    const result = calculatePacer(
      {
        remainingPct: 50,
        resetWeekday: 4,
        workdayStart: "18:00",
        workdayEnd: "09:00"
      },
      new Date("2026-07-27T09:00:00")
    );

    expect(result.workdayStart).toBe("09:00");
    expect(result.workdayEnd).toBe("18:00");
    expect(result.warning).toContain("최소 1시간");
  });

  it("blocks new work when the weekly capacity is nearly empty", () => {
    const result = calculatePacer(
      {
        remainingPct: 5,
        resetWeekday: 1,
        workdayStart: "09:00",
        workdayEnd: "18:00"
      },
      new Date("2026-07-27T09:00:00")
    );

    expect(result.dailyBudgetPct).toBeLessThan(2);
    expect(result.status).toBe("unavailable");
    expect(result.statusLabel).toBe("휴식");
  });
  it("uses a reset time later on the selected weekday", () => {
    const now = new Date("2026-07-27T09:00:00");
    const result = calculatePacer(
      {
        remainingPct: 70,
        resetWeekday: 1,
        resetTime: "12:30",
        workdayStart: "09:00",
        workdayEnd: "18:00"
      },
      now
    );

    expect(result.resetAt).toEqual(new Date("2026-07-27T12:30:00"));
    expect(result.hoursUntilReset).toBeCloseTo(3.5, 5);
    expect(result.remainingWorkMinutesToday).toBe(210);
    expect(result.dailyBudgetPct).toBeCloseTo(70, 5);
    expect(result.isFinalWorkWindow).toBe(true);
    expect(result.title).toBe("초기화 전 마지막 구간이에요");
  });

  it("moves to next week when today’s reset time has passed", () => {
    const result = calculatePacer(
      {
        remainingPct: 70,
        resetWeekday: 1,
        resetTime: "08:00",
        workdayStart: "09:00",
        workdayEnd: "18:00"
      },
      new Date("2026-07-27T09:00:00")
    );

    expect(result.resetAt).toEqual(new Date("2026-08-03T08:00:00"));
  });

  it("returns English copy for a non-Korean locale", () => {
    const result = calculatePacer(
      {
        remainingPct: 70,
        resetWeekday: 1,
        resetTime: "00:00",
        workdayStart: "09:00",
        workdayEnd: "18:00",
        locale: "en"
      },
      new Date("2026-07-27T09:00:00")
    );

    expect(result.resetLabel).toBe("Monday at 00:00");
    expect(result.title).toBe("Your pace looks good");
    expect(result.workEstimates[0].example).toBe(
      "Quick questions, one function or copy edit"
    );
    expect(result.workEstimates[0].interactionGuide).toBe(
      "1-2 turns · short context"
    );
  });

  it("falls back to midnight for an invalid reset time", () => {
    const result = calculatePacer(
      {
        remainingPct: 50,
        resetWeekday: 4,
        resetTime: "25:00",
        workdayStart: "09:00",
        workdayEnd: "18:00"
      },
      new Date("2026-07-27T09:00:00")
    );

    expect(result.resetTime).toBe("00:00");
    expect(result.warningCodes).toContain("reset-time");
    expect(result.warning).toContain("00:00");
  });
});
