import { formatHoursUntilReset, formatPercent } from "../lib/date";
import type { UsageRecommendation } from "../lib/types";

type Props = {
  recommendation: UsageRecommendation | null;
  snapshotCount: number;
};

type HeroBarProps = {
  label: string;
  value: number;
  tone: UsageRecommendation["status"];
};

function HeroBar({ label, value, tone }: HeroBarProps) {
  const safeValue = Math.min(100, Math.max(0, value));

  return (
    <div className="hero-chart-row">
      <span>{label}</span>
      <div className="hero-chart-track" aria-hidden="true">
        <span
          className={`hero-chart-fill status-${tone}`}
          style={{ width: `${safeValue}%` }}
        />
      </div>
      <strong>{formatPercent(safeValue)}</strong>
    </div>
  );
}

export default function HeroPaceDashboard({
  recommendation,
  snapshotCount
}: Props) {
  if (!recommendation) {
    return (
      <div className="stats-card">
        <div>
          <span className="muted">요약</span>
          <strong>판단 대기</strong>
        </div>
        <div className="metrics compact-metrics">
          <div className="metric">
            <span>최근 기록</span>
            <strong>{snapshotCount}개</strong>
          </div>
          <div className="metric">
            <span>입력 방식</span>
            <strong>수동</strong>
          </div>
        </div>
        <p className="muted">
          숫자 2개를 넣으면 오늘 페이스와 AI별 추천 흐름을 바로 보여드립니다.
        </p>
      </div>
    );
  }

  const largeWorkScenario = recommendation.workScenarios.find(
    (scenario) => scenario.id === "largeSourceWork"
  );
  const shouldHoldLargeWork =
    recommendation.normalizedSessionRemainingPct < 20 ||
    recommendation.recommendedAdditionalPct <= 0;
  const largeWorkLabel = shouldHoldLargeWork
    ? "리셋 대기"
    : largeWorkScenario
      ? `${largeWorkScenario.estimatedMinutes}분`
      : "계산 대기";

  return (
    <div className="stats-card hero-dashboard">
      <div>
        <span className="muted">오늘 한눈에 보기</span>
        <strong>현재 페이스 요약</strong>
        <p className="hero-race-label">페이스 레이스 트랙</p>
      </div>

      <div className="hero-chart" role="img" aria-label="오늘 페이스 핵심 차트">
        <HeroBar
          label="5시간 세션"
          value={recommendation.normalizedSessionRemainingPct}
          tone={recommendation.status}
        />
        <HeroBar
          label="주간 잔여"
          value={recommendation.normalizedWeeklyRemainingPct}
          tone={recommendation.status}
        />
        <HeroBar
          label="남은 페이스"
          value={recommendation.recommendedAdditionalPct}
          tone={recommendation.status}
        />
      </div>

      <div className="hero-dashboard-grid">
        <div className="metric">
          <span>대형 작업 재입력</span>
          <strong>{largeWorkLabel}</strong>
        </div>
        <div className="metric">
          <span>주간 리셋까지</span>
          <strong>{formatHoursUntilReset(recommendation.hoursUntilWeeklyReset)}</strong>
        </div>
      </div>
    </div>
  );
}
