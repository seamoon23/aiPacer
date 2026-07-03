import { useState } from "react";

import { formatDateTime } from "../lib/date";
import {
  buildSnapshotsExportSummary,
  downloadSnapshotsExport
} from "../lib/exportSnapshots";
import { getProviderDirectionLabel, toProviderDisplayValue } from "../lib/providerDisplay";
import type { ActiveProviderType, ProviderType, UsageFormSettings, UsageSnapshot } from "../lib/types";

type Props = {
  snapshots: UsageSnapshot[];
  onEditSnapshot: (
    snapshot: UsageSnapshot,
    snapshotForm: UsageFormSettings
  ) => void;
  onDeleteSnapshot: (snapshotId: string) => void;
  onClearSnapshots: () => void;
};

type ExportNotice = {
  tone: "success" | "danger";
  message: string;
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

export default function SnapshotHistory({
  snapshots,
  onEditSnapshot,
  onDeleteSnapshot,
  onClearSnapshots
}: Props) {
  const [exportNotice, setExportNotice] = useState<ExportNotice | null>(null);
  const exportSummary = buildSnapshotsExportSummary(snapshots);

  const handleExportSnapshots = () => {
    const exportedAt = new Date();
    const clickedExportSummary = buildSnapshotsExportSummary(snapshots, exportedAt);
    const didStartDownload = downloadSnapshotsExport(snapshots, {
      now: exportedAt
    });

    if (didStartDownload) {
      setExportNotice({
        tone: "success",
        message: `JSON 내보내기 준비 완료: ${clickedExportSummary.snapshotCount}개 기록 · 약 ${clickedExportSummary.sizeLabel} · ${clickedExportSummary.fileName}`
      });
      return;
    }

    setExportNotice({
      tone: "danger",
      message:
        "JSON 내보내기를 시작하지 못했습니다. 브라우저 다운로드 권한이나 Blob URL 지원 여부를 확인해주세요."
    });
  };

  return (
    <section className="card">
      <div className="content-stack">
        <div className="history-head">
          <div>
            <p className="eyebrow">최근 기록</p>
            <h2>localStorage에 최근 10개까지 보관</h2>
            <p className="muted">
              브라우저를 지우면 함께 삭제됩니다. 서버로 전송되지 않습니다.
            </p>
          </div>
          <div className="button-row history-actions">
            <button
              className="button button-secondary"
              type="button"
              onClick={handleExportSnapshots}
              disabled={snapshots.length === 0}
            >
              JSON 내보내기
            </button>
            <button
              className="button button-danger"
              type="button"
              onClick={onClearSnapshots}
              disabled={snapshots.length === 0}
            >
              전체 삭제
            </button>
          </div>
        </div>

        {snapshots.length > 0 ? (
          <p className="history-export-summary">
            내보내기 대상: {exportSummary.snapshotCount}개 기록 · 약{" "}
            {exportSummary.sizeLabel} · 서버 전송 없음
          </p>
        ) : null}

        {exportNotice ? (
          <div
            className={`export-notice export-notice-${exportNotice.tone}`}
            role={exportNotice.tone === "danger" ? "alert" : "status"}
            aria-live={exportNotice.tone === "danger" ? "assertive" : "polite"}
          >
            {exportNotice.message}
          </div>
        ) : null}

        {snapshots.length === 0 ? (
          <div className="empty-state">아직 저장된 기록이 없습니다.</div>
        ) : (
          <ul className="list-reset history-list">
            {snapshots.map((snapshot) => (
              <li className="history-item" key={snapshot.id}>
                {(() => {
                  const sessionDisplayPct =
                    snapshot.sessionDisplayPct ??
                    toProviderDisplayValue(
                      snapshot.providerType,
                      snapshot.sessionRemainingPct
                    );
                  const weeklyDisplayPct =
                    snapshot.weeklyDisplayPct ??
                    toProviderDisplayValue(
                      snapshot.providerType,
                      snapshot.weeklyRemainingPct
                    );
                  const activeProviderType = toActiveProviderType(snapshot.providerType);
                  const formattedCreatedAt = formatDateTime(snapshot.createdAt);
                  const actionContext = [
                    snapshot.providerName,
                    formattedCreatedAt,
                    snapshot.memo
                  ]
                    .filter(Boolean)
                    .join(" ");

                  return (
                    <>
                <div className="history-head">
                  <div>
                    <strong>{snapshot.providerName}</strong>
                    <p className="muted">
                      {formattedCreatedAt} ·{" "}
                      {getProviderDirectionLabel(snapshot.providerType)}
                    </p>
                  </div>
                  <div className="button-row">
                    <button
                      className="button button-secondary"
                      type="button"
                      aria-label={`${actionContext} 기록 수정하기`}
                      onClick={() =>
                        onEditSnapshot(
                          snapshot,
                          {
                            providerType: activeProviderType,
                            providerName: getActiveProviderName(activeProviderType),
                            sessionRemainingPct: sessionDisplayPct,
                            weeklyRemainingPct: weeklyDisplayPct,
                            weeklyResetAt: snapshot.weeklyResetAt,
                            dailySessionTarget: snapshot.dailySessionTarget ?? 1,
                            taskRiskType: snapshot.taskRiskType,
                            memo: snapshot.memo ?? "",
                            inputModeVersion: 2
                          }
                        )
                      }
                    >
                      수정하기
                    </button>
                    <button
                      className="button button-danger"
                      type="button"
                      aria-label={`${actionContext} 기록 삭제하기`}
                      onClick={() => onDeleteSnapshot(snapshot.id)}
                    >
                      개별 삭제
                    </button>
                  </div>
                </div>

                <div className="data-grid">
                  <div className="metric">
                    <span>5시간 표시값</span>
                    <strong>{sessionDisplayPct}%</strong>
                  </div>
                  <div className="metric">
                    <span>주간 표시값</span>
                    <strong>{weeklyDisplayPct}%</strong>
                  </div>
                  <div className="metric">
                    <span>계산 세션 잔여율</span>
                    <strong>{snapshot.sessionRemainingPct}%</strong>
                  </div>
                  <div className="metric">
                    <span>계산 주간 잔여율</span>
                    <strong>{snapshot.weeklyRemainingPct}%</strong>
                  </div>
                </div>
                {snapshot.memo ? <p className="muted">{snapshot.memo}</p> : null}
                    </>
                  );
                })()}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
