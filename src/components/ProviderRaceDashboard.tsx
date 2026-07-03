import { formatDateTime, formatPercent } from "../lib/date";
import { buildProviderRaceSummary } from "../lib/providerRace";
import type { ProviderRaceLane, RaceMascot } from "../lib/providerRace";
import type { UsageSnapshot } from "../lib/types";

type Props = {
  snapshots: UsageSnapshot[];
};

function getMascotLabel(mascot: RaceMascot): string {
  return mascot === "rabbit" ? "토끼 페이스" : "거북이 페이스";
}

function getToneLabel(tone: ProviderRaceLane["coachTone"]): string {
  if (tone === "push") {
    return "더 달려도 됨";
  }

  if (tone === "rest") {
    return "숨 고르기";
  }

  return "균형 유지";
}

function RaceMeter({
  label,
  value
}: {
  label: string;
  value: number;
}) {
  const safeValue = Math.min(100, Math.max(0, value));

  return (
    <div className="race-meter">
      <div className="race-meter-head">
        <span>{label}</span>
        <strong>{formatPercent(safeValue)}</strong>
      </div>
      <div
        className="race-meter-track"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Number(safeValue.toFixed(1))}
      >
        <span style={{ width: `${Math.max(safeValue, 4)}%` }} />
      </div>
    </div>
  );
}

function RaceLaneCard({ lane }: { lane: ProviderRaceLane }) {
  return (
    <article className={`race-lane-card tone-${lane.coachTone}`}>
      <div className="race-lane-head">
        <div className={`race-mascot mascot-${lane.mascot}`} aria-hidden="true">
          <span />
        </div>
        <div>
          <strong>{lane.providerName}</strong>
          <p>{getMascotLabel(lane.mascot)}</p>
        </div>
        <span className="race-tone">{getToneLabel(lane.coachTone)}</span>
      </div>

      <div className="race-lane-track" aria-hidden="true">
        <span
          className="race-lane-runner"
          style={{ left: `${Math.min(96, Math.max(4, lane.weeklyRemainingPct))}%` }}
        />
      </div>

      <div className="race-meter-grid">
        <RaceMeter label={`${lane.providerName} 5시간 여유`} value={lane.sessionRemainingPct} />
        <RaceMeter label={`${lane.providerName} 주간 여유`} value={lane.weeklyRemainingPct} />
        <RaceMeter label={`${lane.providerName} 오늘 소모`} value={lane.todayUsedPct} />
      </div>

      <p className="race-message">{lane.message}</p>
      <p className="muted">최근 입력: {formatDateTime(lane.createdAt)}</p>
    </article>
  );
}

export default function ProviderRaceDashboard({ snapshots }: Props) {
  const summary = buildProviderRaceSummary(snapshots);

  if (!summary) {
    return (
      <section className="card race-dashboard">
        <div className="content-stack">
          <div className="race-dashboard-header">
            <div>
              <p className="eyebrow">AI 레이스 코치</p>
              <h2>AI 레이스 코치</h2>
              <p className="race-matchup">Codex vs Claude Code</p>
            </div>
            <div className="race-flag" aria-hidden="true">
              <span />
            </div>
          </div>

          <div className="race-coach-callout">
            <strong>첫 기록을 넣으면 바로 레이스가 열립니다</strong>
            <p>Codex와 Claude Code 중 어느 쪽을 더 달려도 되는지 여기서 바로 보여드립니다.</p>
          </div>

          <div className="race-empty-lanes" aria-hidden="true">
            <span className="race-empty-runner turtle" />
            <span className="race-empty-track" />
            <span className="race-empty-runner rabbit" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="card race-dashboard">
      <div className="content-stack">
        <div className="race-dashboard-header">
          <div>
            <p className="eyebrow">AI 레이스 코치</p>
            <h2>AI 레이스 코치</h2>
            <p className="race-matchup">
              {summary.hasComparison ? "Codex vs Claude Code" : `${summary.spotlightProviderName} 단독 코칭`}
            </p>
          </div>
          <div className="race-flag" aria-hidden="true">
            <span />
          </div>
        </div>

        <div className="race-coach-callout">
          <strong>{summary.headline}</strong>
          <p>{summary.summary}</p>
        </div>

        <div
          className="race-lanes"
          role="group"
          aria-label="Codex와 Claude Code의 잔여율 비교 레이스 차트"
        >
          {summary.lanes.map((lane) => (
            <RaceLaneCard key={lane.providerType} lane={lane} />
          ))}
        </div>
      </div>
    </section>
  );
}
