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
      "Quick questions and copy edits"
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
