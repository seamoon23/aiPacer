import type { ActiveProviderType, ProviderType, UsageSnapshot } from "./types";

export type RaceMascot = "rabbit" | "turtle";
export type RaceCoachTone = "push" | "steady" | "rest";

export type ProviderRaceLane = {
  providerType: ActiveProviderType;
  providerName: string;
  mascot: RaceMascot;
  coachTone: RaceCoachTone;
  sessionRemainingPct: number;
  weeklyRemainingPct: number;
  todayUsedPct: number;
  message: string;
  createdAt: string;
};

export type ProviderRaceSummary = {
  headline: string;
  summary: string;
  spotlightProviderName: string;
  hasComparison: boolean;
  lanes: ProviderRaceLane[];
};

function toActiveProviderType(providerType: ProviderType): ActiveProviderType {
  if (providerType === "claude" || providerType === "claude-code") {
    return "claude-code";
  }

  return "codex";
}

function getProviderName(providerType: ActiveProviderType): string {
  return providerType === "claude-code" ? "Claude Code" : "Codex";
}

function getLocalDayKey(dateIso: string): string {
  return new Date(dateIso).toLocaleDateString("en-CA");
}

function sortNewestFirst(snapshots: UsageSnapshot[]): UsageSnapshot[] {
  return [...snapshots].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, value));
}

function getTodayUsageEstimate(
  providerSnapshots: UsageSnapshot[],
  latest: UsageSnapshot
): number {
  const latestDayKey = getLocalDayKey(latest.createdAt);
  const todaySnapshots = providerSnapshots.filter(
    (snapshot) => getLocalDayKey(snapshot.createdAt) === latestDayKey
  );

  if (todaySnapshots.length < 2) {
    return 0;
  }

  const oldest = sortNewestFirst(todaySnapshots).at(-1);

  if (!oldest) {
    return 0;
  }

  return clampPercent(oldest.weeklyRemainingPct - latest.weeklyRemainingPct);
}

function getSoloTone(latest: UsageSnapshot, todayUsedPct: number): RaceCoachTone {
  if (
    latest.sessionRemainingPct <= 25 ||
    latest.weeklyRemainingPct <= 25 ||
    todayUsedPct >= 18
  ) {
    return "rest";
  }

  if (latest.sessionRemainingPct >= 55 && latest.weeklyRemainingPct >= 55) {
    return "push";
  }

  return "steady";
}

function getMessage(tone: RaceCoachTone, hasComparison: boolean): string {
  if (tone === "push") {
    return hasComparison
      ? "많이 남아 있습니다. 필요한 작업은 Codex에 더 맡겨도 좋습니다."
      : "여유가 꽤 남아 있습니다. 오늘 필요한 작업을 더 밀어붙여도 됩니다.";
  }

  if (tone === "rest") {
    return "상대적으로 많이 달렸습니다. 큰 작업 전에는 한 번 더 잔여율을 확인하세요.";
  }

  return "균형권입니다. 지금 흐름을 유지하면서 큰 작업 뒤에는 다시 입력하세요.";
}

function buildLane(
  latest: UsageSnapshot,
  providerSnapshots: UsageSnapshot[],
  hasComparison: boolean
): ProviderRaceLane {
  const providerType = toActiveProviderType(latest.providerType);
  const todayUsedPct = getTodayUsageEstimate(providerSnapshots, latest);
  const coachTone = getSoloTone(latest, todayUsedPct);

  return {
    providerType,
    providerName: latest.providerName || getProviderName(providerType),
    mascot: coachTone === "rest" ? "rabbit" : "turtle",
    coachTone,
    sessionRemainingPct: clampPercent(latest.sessionRemainingPct),
    weeklyRemainingPct: clampPercent(latest.weeklyRemainingPct),
    todayUsedPct,
    message: getMessage(coachTone, hasComparison),
    createdAt: latest.createdAt
  };
}

function applyRelativeComparison(lanes: ProviderRaceLane[]): ProviderRaceLane[] {
  if (lanes.length < 2) {
    return lanes;
  }

  const sortedByWeeklyRemaining = [...lanes].sort(
    (a, b) => b.weeklyRemainingPct - a.weeklyRemainingPct
  );
  const underusedProvider = sortedByWeeklyRemaining[0];
  const overusedProvider = sortedByWeeklyRemaining.at(-1);
  const weeklyGap =
    underusedProvider && overusedProvider
      ? underusedProvider.weeklyRemainingPct - overusedProvider.weeklyRemainingPct
      : 0;

  if (weeklyGap < 12 || !underusedProvider || !overusedProvider) {
    return lanes.map((lane) => ({
      ...lane,
      mascot: "turtle",
      coachTone: "steady",
      message: getMessage("steady", true)
    }));
  }

  return lanes.map((lane) => {
    if (lane.providerType === underusedProvider.providerType) {
      return {
        ...lane,
        mascot: "turtle",
        coachTone: "push",
        message: `많이 남아 있습니다. 필요한 작업은 ${lane.providerName}에 더 맡겨도 좋습니다.`
      };
    }

    if (lane.providerType === overusedProvider.providerType) {
      return {
        ...lane,
        mascot: "rabbit",
        coachTone: "rest",
        message: getMessage("rest", true)
      };
    }

    return lane;
  });
}

export function buildProviderRaceSummary(
  snapshots: UsageSnapshot[]
): ProviderRaceSummary | null {
  if (snapshots.length === 0) {
    return null;
  }

  const snapshotsByProvider = new Map<ActiveProviderType, UsageSnapshot[]>();

  for (const snapshot of sortNewestFirst(snapshots)) {
    const providerType = toActiveProviderType(snapshot.providerType);
    const providerSnapshots = snapshotsByProvider.get(providerType) ?? [];
    providerSnapshots.push(snapshot);
    snapshotsByProvider.set(providerType, providerSnapshots);
  }

  const baseLanes = (["codex", "claude-code"] as ActiveProviderType[])
    .map((providerType) => {
      const providerSnapshots = snapshotsByProvider.get(providerType);
      const latest = providerSnapshots?.[0];

      if (!latest || !providerSnapshots) {
        return null;
      }

      return buildLane(latest, providerSnapshots, snapshotsByProvider.size > 1);
    })
    .filter((lane): lane is ProviderRaceLane => lane !== null);
  const lanes = applyRelativeComparison(baseLanes);
  const spotlightLane =
    lanes.find((lane) => lane.coachTone === "push") ??
    lanes.find((lane) => lane.coachTone === "steady") ??
    lanes[0];

  if (!spotlightLane) {
    return null;
  }

  const hasComparison = lanes.length > 1;
  const headline = hasComparison
    ? `${spotlightLane.providerName}가 따라잡을 차례입니다`
    : `${spotlightLane.providerName} 단독 페이스 체크`;
  const summary = hasComparison
    ? "직접 입력한 최신 기록을 비교해 더 밀어붙일 AI와 잠깐 숨 고를 AI를 나눠 봅니다."
    : "아직 비교할 다른 AI 기록은 없지만, 현재 도구의 소모율 기준으로 코치 메시지를 보여줍니다.";

  return {
    headline,
    summary,
    spotlightProviderName: spotlightLane.providerName,
    hasComparison,
    lanes
  };
}
