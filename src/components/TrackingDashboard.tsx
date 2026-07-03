import { useEffect, useState } from "react";

import { formatDateTime, formatPercent } from "../lib/date";
import type { ActiveProviderType, ProviderType, UsageSnapshot } from "../lib/types";

type Props = {
  snapshots: UsageSnapshot[];
};

function toActiveProviderType(providerType: ProviderType): ActiveProviderType {
  if (providerType === "claude" || providerType === "claude-code") {
    return "claude-code";
  }

  return "codex";
}

function getActiveProviderName(providerType: ActiveProviderType): string {
  return providerType === "claude-code" ? "Claude Code" : "Codex";
}

function getLocalDayKey(dateIso: string): string {
  return new Date(dateIso).toLocaleDateString("en-CA");
}

function getProviderSnapshots(
  snapshots: UsageSnapshot[],
  providerType: ProviderType
): UsageSnapshot[] {
  const activeProviderType = toActiveProviderType(providerType);

  return snapshots.filter(
    (snapshot) => toActiveProviderType(snapshot.providerType) === activeProviderType
  );
}

function buildProviderOptions(snapshots: UsageSnapshot[]) {
  const providers = new Set<ActiveProviderType>();

  snapshots.forEach((snapshot) => {
    providers.add(toActiveProviderType(snapshot.providerType));
  });

  return (["codex", "claude-code"] as ActiveProviderType[])
    .filter((providerType) => providers.has(providerType))
    .map((providerType) => ({
      providerType,
      label: getActiveProviderName(providerType)
    }));
}

function getTodayUsageEstimate(snapshots: UsageSnapshot[], latest: UsageSnapshot): number {
  const latestDayKey = getLocalDayKey(latest.createdAt);
  const todaySnapshots = snapshots.filter(
    (snapshot) => getLocalDayKey(snapshot.createdAt) === latestDayKey
  );

  if (todaySnapshots.length < 2) {
    return 0;
  }

  const oldest = todaySnapshots.at(-1);

  if (!oldest) {
    return 0;
  }

  return Math.max(oldest.weeklyRemainingPct - latest.weeklyRemainingPct, 0);
}

function getTodaySnapshotCount(snapshots: UsageSnapshot[], latest: UsageSnapshot): number {
  const latestDayKey = getLocalDayKey(latest.createdAt);

  return snapshots.filter((snapshot) => getLocalDayKey(snapshot.createdAt) === latestDayKey)
    .length;
}

function buildTrendSnapshots(snapshots: UsageSnapshot[]): UsageSnapshot[] {
  return snapshots.slice(0, 6).reverse();
}

function getWeekScopedSnapshots(
  snapshots: UsageSnapshot[],
  latest: UsageSnapshot
): UsageSnapshot[] {
  if (latest.weekId) {
    return snapshots.filter((snapshot) => snapshot.weekId === latest.weekId);
  }

  return snapshots.filter(
    (snapshot) => snapshot.weeklyResetAt === latest.weeklyResetAt
  );
}

function getWeeklyEfficiency(snapshots: UsageSnapshot[], latest: UsageSnapshot) {
  const oldest = snapshots.at(-1) ?? latest;
  const latestCreatedAt = new Date(latest.createdAt);
  const oldestCreatedAt = new Date(oldest.createdAt);
  const resetAt = new Date(latest.weeklyResetAt);
  const elapsedHours = Math.max(
    (latestCreatedAt.getTime() - oldestCreatedAt.getTime()) / 1000 / 60 / 60,
    6
  );
  const elapsedDays = elapsedHours / 24;
  const weeklyUsedPct = Math.max(
    oldest.weeklyRemainingPct - latest.weeklyRemainingPct,
    0
  );
  const averageDailyUsePct = weeklyUsedPct / elapsedDays;
  const daysUntilReset = Number.isNaN(resetAt.getTime())
    ? 0
    : Math.max(
        (resetAt.getTime() - latestCreatedAt.getTime()) / 1000 / 60 / 60 / 24,
        0
      );
  const projectedRemainingPct = Math.max(
    latest.weeklyRemainingPct - averageDailyUsePct * daysUntilReset,
    0
  );
  const summary =
    snapshots.length < 2
      ? "이번 주 비교 기록이 아직 적습니다. 한 번 더 입력하면 효율 분석이 더 선명해집니다."
      : projectedRemainingPct >= 20
        ? "이 속도라면 주간 사용권을 꽤 남길 수 있습니다. 필요한 작업은 더 밀어붙여도 됩니다."
        : projectedRemainingPct <= 5
          ? "이 속도라면 리셋 전 여유가 빠듯합니다. 큰 작업은 중간 재입력을 권장합니다."
          : "현재 주간 소진 속도는 비교적 균형적입니다.";

  return {
    weeklyUsedPct,
    averageDailyUsePct,
    projectedRemainingPct,
    summary
  };
}

export default function TrackingDashboard({ snapshots }: Props) {
  const latest = snapshots[0];
  const providerOptions = buildProviderOptions(snapshots);
  const latestProviderType = latest
    ? toActiveProviderType(latest.providerType)
    : "codex";
  const [selectedProviderType, setSelectedProviderType] =
    useState<ActiveProviderType>(latestProviderType);
  const selectedProviderExists = providerOptions.some(
    (option) => option.providerType === selectedProviderType
  );
  const activeProviderType = selectedProviderExists
    ? selectedProviderType
    : latestProviderType;

  useEffect(() => {
    if (!selectedProviderExists) {
      setSelectedProviderType(latestProviderType);
    }
  }, [latestProviderType, selectedProviderExists]);

  if (snapshots.length === 0 || !latest) {
    return null;
  }

  const providerSnapshots = getProviderSnapshots(snapshots, activeProviderType);
  const selectedLatest = providerSnapshots[0] ?? latest;
  const selectedProviderName = getActiveProviderName(activeProviderType);
  const weekSnapshots = getWeekScopedSnapshots(providerSnapshots, selectedLatest);
  const trendSnapshots = buildTrendSnapshots(providerSnapshots);
  const todayUsageEstimate = getTodayUsageEstimate(providerSnapshots, selectedLatest);
  const todaySnapshotCount = getTodaySnapshotCount(providerSnapshots, selectedLatest);
  const weeklyEfficiency = getWeeklyEfficiency(weekSnapshots, selectedLatest);

  return (
    <section className="card">
      <div className="content-stack">
        <div>
          <p className="eyebrow">추적</p>
          <h2>추적 대시보드</h2>
          <p className="muted">
            저장된 기록을 기준으로 최근 상태와 오늘의 소모 흐름을 빠르게 확인합니다.
          </p>
        </div>

        {providerOptions.length > 1 ? (
          <label className="tracking-filter" htmlFor="trackingProviderType">
            추적 도구 선택
            <select
              id="trackingProviderType"
              value={activeProviderType}
              onChange={(event) =>
                setSelectedProviderType(event.target.value as ActiveProviderType)
              }
            >
              {providerOptions.map((option) => (
                <option key={option.providerType} value={option.providerType}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <div className="data-grid">
          <div className="metric">
            <span>전체 기록</span>
            <strong>{snapshots.length}개</strong>
          </div>
          <div className="metric">
            <span>선택 도구</span>
            <strong>{selectedProviderName} 기준</strong>
          </div>
          <div className="metric">
            <span>오늘 같은 도구 기록</span>
            <strong>{todaySnapshotCount}개</strong>
          </div>
          <div className="metric">
            <span>오늘 소모 추정</span>
            <strong>{formatPercent(todayUsageEstimate)}</strong>
          </div>
        </div>

        <div className="analysis-card">
          <div>
            <strong>이번 주 사용 효율</strong>
            <p className="muted">{weeklyEfficiency.summary}</p>
          </div>
          <div className="data-grid">
            <div className="metric">
              <span>이번 주 기록</span>
              <strong>{weekSnapshots.length}개</strong>
            </div>
            <div className="metric">
              <span>이번 주 소모</span>
              <strong>{formatPercent(weeklyEfficiency.weeklyUsedPct)}</strong>
            </div>
            <div className="metric">
              <span>하루 평균 소모</span>
              <strong>{formatPercent(weeklyEfficiency.averageDailyUsePct)}</strong>
            </div>
            <div className="metric">
              <span>예상 리셋 잔여</span>
              <strong>{formatPercent(weeklyEfficiency.projectedRemainingPct)}</strong>
            </div>
          </div>
        </div>

        <div
          className="trend-card"
          role="img"
          aria-label={`${selectedProviderName} 주간 잔여율 추세`}
        >
          <div>
            <strong>선택 도구 기준 주간 잔여율</strong>
            <p className="muted">
              다른 도구 기록은 섞지 않고 {selectedProviderName} 기록만 이어 봅니다.
            </p>
          </div>
          <div className="trend-bars" aria-hidden="true">
            {trendSnapshots.map((snapshot) => (
              <span
                className="trend-bar"
                key={snapshot.id}
                style={{ height: `${Math.max(snapshot.weeklyRemainingPct, 6)}%` }}
              />
            ))}
          </div>
        </div>

        <div className="inline-note">
          <strong>최근 기록 시각</strong>
          <p>{formatDateTime(selectedLatest.createdAt)}</p>
        </div>
      </div>
    </section>
  );
}
