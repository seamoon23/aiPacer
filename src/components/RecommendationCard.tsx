import type { ReactNode } from "react";

import { formatHoursUntilReset, formatPercent } from "../lib/date";
import type { UsageRecommendation, WorkScenarioEstimate } from "../lib/types";

type Props = {
  recommendation: UsageRecommendation | null;
  eyebrow?: string;
};

const STATUS_LABELS = {
  safe: "SAFE",
  normal: "NORMAL",
  caution: "CAUTION",
  danger: "DANGER"
} as const;

const USAGE_REFERENCE_LINKS = [
  {
    label: "OpenAI Codex 사용 한도",
    href: "https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan"
  },
  {
    label: "OpenAI Codex 가격/한도표",
    href: "https://developers.openai.com/codex/pricing"
  },
  {
    label: "Claude Code 사용량 문서",
    href: "https://docs.anthropic.com/en/docs/claude-code/costs"
  },
  {
    label: "Claude Pro 사용량 도움말",
    href: "https://support.claude.com/en/articles/8324991-about-claude-s-pro-plan-usage"
  }
] as const;

type MetricCardProps = {
  label: string;
  value: number;
  tone: UsageRecommendation["status"];
  children?: ReactNode;
};

function MetricCard({ label, value, tone, children }: MetricCardProps) {
  const safeValue = Math.min(100, Math.max(0, value));

  return (
    <div className="metric metric-with-bar">
      <div className="meter-head">
        <span>{label}</span>
        <strong>{formatPercent(safeValue)}</strong>
      </div>
      <div
        className="meter-track"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Number(safeValue.toFixed(1))}
      >
        <span
          className={`meter-fill status-${tone}`}
          style={{ width: `${safeValue}%` }}
        />
      </div>
      {children ? <p className="muted">{children}</p> : null}
    </div>
  );
}

function formatMinutes(minutes: number): string {
  if (minutes <= 0) {
    return "대기";
  }

  return `${minutes}분`;
}

function ScenarioBar({
  scenario,
  tone
}: {
  scenario: WorkScenarioEstimate;
  tone: UsageRecommendation["status"];
}) {
  return (
    <div className="scenario-row">
      <div>
        <strong>{scenario.label}</strong>
        <p className="muted">{scenario.description}</p>
      </div>
      <div className="scenario-meter">
        <div className="scenario-head">
          <span>{scenario.fitLabel}</span>
          <strong>{formatMinutes(scenario.estimatedMinutes)}</strong>
        </div>
        <p className="muted">기준 범위 {scenario.timeRangeLabel}</p>
        <div
          className="meter-track"
          role="progressbar"
          aria-label={`${scenario.label} 권장 진행 시간`}
          aria-valuemin={0}
          aria-valuemax={scenario.maxMinutes}
          aria-valuenow={scenario.estimatedMinutes}
        >
          <span
            className={`meter-fill status-${tone}`}
            style={{ width: `${scenario.barPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default function RecommendationCard({
  recommendation,
  eyebrow = "계산 결과"
}: Props) {
  if (!recommendation) {
    return (
      <section className="card" aria-live="polite">
        <p className="eyebrow">{eyebrow}</p>
        <h2>아직 계산 결과가 없습니다</h2>
        <p className="muted">
          입력 폼을 제출하면 전체 상태, 오늘 더 써도 되는 양, 추천 흐름, 경고 메시지를 카드로 정리해 보여드립니다.
        </p>
      </section>
    );
  }

  const isSessionClosed = recommendation.normalizedSessionRemainingPct < 20;
  const isDailyPaceClosed = recommendation.recommendedAdditionalPct <= 0;
  const isShutterState = isSessionClosed || isDailyPaceClosed;
  const resultSummary = isShutterState
    ? isSessionClosed
      ? "현재 5시간 세션이 낮아 새 작업 시간표는 접어두는 편이 안전합니다."
      : "오늘 권장 페이스가 0%라 새 작업 시간표는 접어두는 편이 안전합니다."
    : recommendation.summary;
  const shutterReason = isSessionClosed
    ? "현재 5시간 세션이 낮습니다. 새 대형 작업은 닫고, 꼭 필요한 질문만 짧게 처리하세요."
    : "남은 권장 페이스가 0%입니다. 새 대형 작업은 닫고, 꼭 필요한 질문만 짧게 처리하세요.";

  return (
    <section className="card" aria-live="polite">
      <div className="content-stack">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <p className={`status-pill status-${recommendation.status}`}>
            {STATUS_LABELS[recommendation.status]}
          </p>
          <h2>{recommendation.title}</h2>
          <p className="muted">{resultSummary}</p>
        </div>

        {isShutterState ? (
          <div className="shutter-card" role="note">
            <div className="shutter-visual" aria-hidden="true" />
            <div>
              <strong>오늘 셔터 내림</strong>
              <p>{shutterReason}</p>
              <span>권장: 기록만 남기고 리셋 뒤 다시 계산</span>
            </div>
          </div>
        ) : (
          <div className={`nudge-card status-${recommendation.status}`}>
            <strong>{recommendation.usageNudge}</strong>
          </div>
        )}

        <div className="data-grid">
          <MetricCard
            label="5시간 세션 잔여율"
            value={recommendation.normalizedSessionRemainingPct}
            tone={recommendation.status}
          >
            현재 세션 안에서 바로 쓸 수 있는 여유입니다.
          </MetricCard>
          <MetricCard
            label="주간 잔여율"
            value={recommendation.normalizedWeeklyRemainingPct}
            tone={recommendation.status}
          >
            이번 주 전체 사용권의 남은 폭입니다.
          </MetricCard>
          <MetricCard
            label="오늘 남은 페이스"
            value={recommendation.recommendedAdditionalPct}
            tone={recommendation.status}
          >
            오늘 안에 더 써도 되는 권장량입니다.
          </MetricCard>
          {!isShutterState ? (
            <>
              <div className="metric">
                <span>지금 권장 흐름</span>
                <strong>{recommendation.recommendedFocusLabel}</strong>
              </div>
              <div className="metric">
                <span>오늘 더 써도 되는 양</span>
                <strong>{formatPercent(recommendation.recommendedAdditionalPct)}</strong>
              </div>
              <div className="metric">
                <span>안 쓰면 남길 수 있는 양</span>
                <strong>{formatPercent(recommendation.useItOrLoseItPct)}</strong>
              </div>
              <div className="metric">
                <span>하루 목표 세션</span>
                <strong>{recommendation.dailySessionTarget}회</strong>
              </div>
              <div className="metric">
                <span>목표별 배분 페이스</span>
                <strong>{formatPercent(recommendation.perSessionPaceBudgetPct)}</strong>
                <p className="muted">
                  실제 5시간 세션 1회 소모량이 아니라 오늘 남은 권장량을 목표 횟수로 나눈 참고값입니다.
                </p>
              </div>
            </>
          ) : null}
          <div className="metric">
            <span>주간 리셋까지</span>
            <strong>{formatHoursUntilReset(recommendation.hoursUntilWeeklyReset)}</strong>
          </div>
        </div>

        {!isShutterState ? (
          <div className="scenario-chart">
            <div>
              <strong>작업별 권장 진행 시간</strong>
              <p className="muted">{recommendation.scenarioBasis}</p>
            </div>
            <div className="scenario-list">
              {recommendation.workScenarios.map((scenario) => (
                <ScenarioBar
                  key={scenario.id}
                  scenario={scenario}
                  tone={recommendation.status}
                />
              ))}
            </div>
          </div>
        ) : null}

        <div className="inline-note">
          <strong>세션 판단</strong>
          <p>{recommendation.sessionGuidance}</p>
          <strong>주간 판단</strong>
          <p>{recommendation.weeklyGuidance}</p>
          <strong>주사용시간 판단</strong>
          <p>{recommendation.workHoursGuidance}</p>
        </div>

        <div className="inline-note">
          <strong>계산 근거와 공식 참고</strong>
          <p>
            AI Pacer는 공식 사용량 추적기가 아니라 사용자가 직접 입력한 표시값과 로컬 기록을 바탕으로 한 추정 도구입니다. 실제 한도와 리셋 상태는 각 서비스의 사용량 화면과 공식 안내를 함께 확인하세요.
          </p>
          <div className="reference-links" aria-label="공식 참고 링크">
            {USAGE_REFERENCE_LINKS.map((link) => (
              <a
                href={link.href}
                key={link.href}
                rel="noreferrer noopener"
                target="_blank"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>

        {recommendation.warnings.length > 0 ? (
          <div className="warning-box">
            <strong>경고 메시지</strong>
            <ul>
              {recommendation.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="inline-note">
          <strong>추천 행동</strong>
          <ul>
            {recommendation.suggestions.map((suggestion) => (
              <li key={suggestion}>{suggestion}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
