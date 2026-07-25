import { describe, expect, it } from "vitest";

import { calculatePacer } from "./pacerCalculator";

describe("calculatePacer", () => {
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

  it("scales today's budget by the remaining part of the work window", () => {
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
    expect(result.dailyBudgetPct).toBeCloseTo(10, 5);
  });

  it("returns no new work recommendation after the work window", () => {
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
    expect(result.dailyBudgetPct).toBe(0);
    expect(result.status).toBe("unavailable");
    expect(result.workEstimates.every((estimate) => estimate.recommendedCount === 0)).toBe(
      true
    );
  });

  it("limits each task count by both capacity and available time", () => {
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
      ["small", 27],
      ["medium", 9],
      ["large", 3]
    ]);
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
});
