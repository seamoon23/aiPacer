import { useEffect, useRef } from "react";

import {
  getProviderDirectionLabel,
  getProviderUsageDirection,
  normalizeDisplayedUsageValue,
  toProviderDisplayValue
} from "../lib/providerDisplay";
import type { ActiveProviderType, UsageFormSettings } from "../lib/types";

type Props = {
  form: UsageFormSettings;
  errors: string[];
  editNotice?: string;
  submitLabel?: string;
  onChange: (nextForm: UsageFormSettings) => void;
  onSubmit: () => void;
  onCancelEdit?: () => void;
};

const PROVIDER_OPTIONS: Array<{ value: ActiveProviderType; label: string }> = [
  { value: "codex", label: "Codex" },
  { value: "claude-code", label: "Claude Code" }
];

const ERROR_IDS = {
  sessionRemainingPct: "sessionRemainingPct-error",
  weeklyRemainingPct: "weeklyRemainingPct-error"
} as const;

function getErrorId(error: string): string | undefined {
  if (error.startsWith("5시간 세션 표시값")) return ERROR_IDS.sessionRemainingPct;
  if (error.startsWith("주간 표시값")) return ERROR_IDS.weeklyRemainingPct;
  return undefined;
}

function describedBy(...ids: Array<string | false | undefined>): string {
  return ids.filter(Boolean).join(" ");
}

export default function UsageInputForm({
  form,
  errors,
  editNotice,
  submitLabel = "지금 페이스 계산하기",
  onChange,
  onSubmit,
  onCancelEdit
}: Props) {
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const hasSessionError = errors.some((error) =>
    error.startsWith("5시간 세션 표시값")
  );
  const hasWeeklyError = errors.some((error) => error.startsWith("주간 표시값"));
  const usageDirection = getProviderUsageDirection(form.providerType);
  const directionLabel = getProviderDirectionLabel(form.providerType);
  const sampleRemaining = normalizeDisplayedUsageValue(form.providerType, 43);
  const providerHint =
    usageDirection === "used-up"
      ? `Claude식 표시입니다. 43 입력 -> 잔여율 ${sampleRemaining}%`
      : `Codex식 표시입니다. 43 입력 -> 잔여율 ${sampleRemaining}%`;

  useEffect(() => {
    if (errors.length > 0) {
      errorSummaryRef.current?.focus();
    }
  }, [errors]);

  const updateField = <Key extends keyof UsageFormSettings>(
    key: Key,
    value: UsageFormSettings[Key]
  ) => {
    onChange({ ...form, [key]: value });
  };

  return (
    <section className="card">
      <div className="content-stack">
        <div>
          <p className="eyebrow">AI 레이스 티켓</p>
          <h2>서비스 화면에 보이는 숫자를 그대로 입력하세요</h2>
          <strong className="form-lead">서비스 숫자 2개만 입력하면 됩니다</strong>
          <p className="muted">
            도구와 표시값만 빠르게 넣고, 기준값은 아래 주간 설정에서 따로 관리합니다.
          </p>
        </div>

        {errors.length > 0 ? (
          <div
            className="warning-box"
            ref={errorSummaryRef}
            role="alert"
            aria-live="assertive"
            tabIndex={-1}
          >
            <strong>입력값을 다시 확인해주세요.</strong>
            <ul>
              {errors.map((error) => (
                <li id={getErrorId(error)} key={error}>
                  {error}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {editNotice ? (
          <div className="inline-note edit-note" role="status">
            <strong>기록 수정 모드</strong>
            <p>{editNotice}</p>
          </div>
        ) : null}

        <form
          className="form-grid"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <div className="field-grid">
            <label htmlFor="providerType">
              도구 선택
              <select
                id="providerType"
                value={form.providerType}
                onChange={(event) => {
                  const providerType = event.target.value as ActiveProviderType;
                  const sessionRemainingPct = normalizeDisplayedUsageValue(
                    form.providerType,
                    form.sessionRemainingPct
                  );
                  const weeklyRemainingPct = normalizeDisplayedUsageValue(
                    form.providerType,
                    form.weeklyRemainingPct
                  );
                  const providerName =
                    PROVIDER_OPTIONS.find((option) => option.value === providerType)
                      ?.label ?? form.providerName;

                  onChange({
                    ...form,
                    providerType,
                    providerName,
                    sessionRemainingPct: toProviderDisplayValue(
                      providerType,
                      sessionRemainingPct
                    ),
                    weeklyRemainingPct: toProviderDisplayValue(
                      providerType,
                      weeklyRemainingPct
                    ),
                    inputModeVersion: 2
                  });
                }}
              >
                {PROVIDER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="field-row">
              <label htmlFor="sessionRemainingPct">
                5시간 세션 표시값
                <input
                  id="sessionRemainingPct"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={form.sessionRemainingPct}
                  aria-invalid={hasSessionError || undefined}
                  aria-describedby={describedBy(
                    "sessionRemainingPct-hint",
                    hasSessionError && ERROR_IDS.sessionRemainingPct
                  )}
                  onChange={(event) =>
                    updateField("sessionRemainingPct", Number(event.target.value))
                  }
                />
                <span className="field-hint" id="sessionRemainingPct-hint">
                  {providerHint}
                </span>
              </label>

              <label htmlFor="weeklyRemainingPct">
                주간 표시값
                <input
                  id="weeklyRemainingPct"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={form.weeklyRemainingPct}
                  aria-invalid={hasWeeklyError || undefined}
                  aria-describedby={describedBy(
                    "weeklyRemainingPct-hint",
                    hasWeeklyError && ERROR_IDS.weeklyRemainingPct
                  )}
                  onChange={(event) =>
                    updateField("weeklyRemainingPct", Number(event.target.value))
                  }
                />
                <span className="field-hint" id="weeklyRemainingPct-hint">
                  기준: {directionLabel}
                </span>
              </label>
            </div>

            <div className="inline-note profile-note">
              <strong>매번 입력하는 값만 남겼습니다</strong>
              <p>{form.providerName}의 현재 표시값과 메모만 기록합니다.</p>
            </div>

            <label htmlFor="memo">
              메모
              <textarea
                id="memo"
                value={form.memo}
                onChange={(event) => updateField("memo", event.target.value)}
                placeholder="이번 작업이 왜 큰지, 어떤 용도로 쓰는지 적어두면 나중에 비교하기 좋습니다."
              />
            </label>
          </div>

          <div className="button-row">
            <button type="submit">{submitLabel}</button>
            {onCancelEdit ? (
              <button
                className="button button-secondary"
                type="button"
                onClick={onCancelEdit}
              >
                수정 취소
              </button>
            ) : null}
          </div>
        </form>
      </div>
    </section>
  );
}
