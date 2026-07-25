import { useEffect, useMemo, useRef, useState } from "react";

import cautionImage from "../assets/dalkomi-caution.webp";
import encourageImage from "../assets/dalkomi-encourage.webp";
import maintainImage from "../assets/dalkomi-maintain.webp";
import pushImage from "../assets/dalkomi-push.webp";
import unavailableImage from "../assets/dalkomi-unavailable.webp";
import {
  calculatePacer,
  DEFAULT_WORKDAY_END,
  DEFAULT_WORKDAY_START,
  RESET_WEEKDAYS
} from "../lib/pacerCalculator";
import type {
  PaceStatus,
  ResetWeekday
} from "../lib/pacerCalculator";
import "../styles/pacer.css";

type ImportedCharacterAsset =
  | string
  | { src: string; width?: number; height?: number };

function normalizeCharacterAsset(
  asset: ImportedCharacterAsset
): { src: string; width: number; height: number } {
  return typeof asset === "string"
    ? { src: asset, width: 416, height: 625 }
    : {
        src: asset.src,
        width: asset.width ?? 416,
        height: asset.height ?? 625
      };
}

const DALKOMI_IMAGES: Record<
  PaceStatus,
  { image: ReturnType<typeof normalizeCharacterAsset>; alt: string }
> = {
  push: {
    image: normalizeCharacterAsset(
      pushImage as unknown as ImportedCharacterAsset
    ),
    alt: "지시봉을 들고 오늘 할 일을 독려하는 안경 쓴 샴고양이 달콤이"
  },
  encourage: {
    image: normalizeCharacterAsset(
      encourageImage as unknown as ImportedCharacterAsset
    ),
    alt: "엄지를 들고 다정하게 응원하는 안경 쓴 샴고양이 달콤이"
  },
  maintain: {
    image: normalizeCharacterAsset(
      maintainImage as unknown as ImportedCharacterAsset
    ),
    alt: "계획표를 펼쳐 들고 차분하게 페이스를 확인하는 안경 쓴 샴고양이 달콤이"
  },
  caution: {
    image: normalizeCharacterAsset(
      cautionImage as unknown as ImportedCharacterAsset
    ),
    alt: "안경을 낮추고 한 발 쉬어 가라고 주의를 주는 샴고양이 달콤이"
  },
  unavailable: {
    image: normalizeCharacterAsset(
      unavailableImage as unknown as ImportedCharacterAsset
    ),
    alt: "닫힌 노트 위에 기대 잠들어 오늘 작업을 말리는 샴고양이 달콤이"
  }
};

type AiPacerAppProps = {
  variant?: "page" | "extension";
};

const SUPPORT_LINKS = [
  {
    label: "GitHub Sponsors",
    href: "https://github.com/sponsors/seamoon23"
  },
  {
    label: "Buy Me a Coffee",
    href: "https://www.buymeacoffee.com/seamoon23"
  }
] as const;

function formatPercent(value: number): string {
  if (value <= 0) {
    return "0%";
  }

  if (value >= 10) {
    return `${Math.round(value)}%`;
  }

  return `${value.toFixed(1)}%`;
}

function formatResetDistance(hours: number): string {
  const totalHours = Math.max(0, Math.round(hours));
  const days = Math.floor(totalHours / 24);
  const remainingHours = totalHours % 24;

  if (days <= 0) {
    return `${remainingHours}시간`;
  }

  if (remainingHours === 0) {
    return `${days}일`;
  }

  return `${days}일 ${remainingHours}시간`;
}

function formatWorkdayCount(value: number): string {
  if (value <= 0) {
    return "0일";
  }

  return `${value.toFixed(1)}일`;
}

function closeDialog(dialog: HTMLDialogElement | null): void {
  if (!dialog) {
    return;
  }

  if (typeof dialog.close === "function") {
    dialog.close();
    return;
  }

  dialog.removeAttribute("open");
}

export default function AiPacerApp({
  variant = "page"
}: AiPacerAppProps) {
  const [remainingPct, setRemainingPct] = useState(60);
  const [resetWeekday, setResetWeekday] =
    useState<ResetWeekday>(1);
  const [workdayStart, setWorkdayStart] = useState(
    DEFAULT_WORKDAY_START
  );
  const [workdayEnd, setWorkdayEnd] = useState(DEFAULT_WORKDAY_END);
  const [now, setNow] = useState(() => new Date());
  const helpDialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const timerId = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timerId);
  }, []);

  const result = useMemo(
    () =>
      calculatePacer(
        {
          remainingPct,
          resetWeekday,
          workdayStart,
          workdayEnd
        },
        now
      ),
    [remainingPct, resetWeekday, workdayStart, workdayEnd, now]
  );
  const selectedResetWeekday =
    RESET_WEEKDAYS.find((weekday) => weekday.value === resetWeekday) ??
    RESET_WEEKDAYS[1];
  const dalkomi = DALKOMI_IMAGES[result.status];

  const openHelp = () => {
    const dialog = helpDialogRef.current;
    if (!dialog) {
      return;
    }

    if (typeof dialog.showModal === "function") {
      dialog.showModal();
      return;
    }

    dialog.setAttribute("open", "");
  };

  const updateRemainingPct = (value: string) => {
    const parsedValue = Number(value);
    setRemainingPct(
      Number.isFinite(parsedValue)
        ? Math.min(100, Math.max(0, parsedValue))
        : 0
    );
  };

  return (
    <section
      className={`pacer-app pacer-app--${variant}`}
      aria-labelledby="pacer-title"
    >
      <div className="pacer-layout">
        <div className="pacer-inputs">
          <header className="pacer-tool-head">
            <div>
              <strong className="pacer-wordmark">AI Pacer</strong>
              <h1 id="pacer-title">오늘, 얼마나 달려도 될까?</h1>
            </div>
            <button
              className="pacer-icon-button"
              type="button"
              aria-label="계산 기준 보기"
              title="계산 기준 보기"
              aria-controls="pacer-help-dialog"
              aria-haspopup="dialog"
              onClick={openHelp}
            >
              ?
            </button>
          </header>

          <div className="pacer-field">
            <div className="pacer-field-heading">
              <label htmlFor="weekly-remaining">주간 남은 용량</label>
              <span>0-100%</span>
            </div>
            <div className="pacer-number-input">
              <input
                id="weekly-remaining"
                type="number"
                inputMode="decimal"
                min="0"
                max="100"
                step="1"
                value={remainingPct}
                onChange={(event) =>
                  updateRemainingPct(event.target.value)
                }
              />
              <span aria-hidden="true">%</span>
            </div>
            <input
              className="pacer-range"
              type="range"
              min="0"
              max="100"
              step="1"
              value={remainingPct}
              aria-label="주간 남은 용량 슬라이더"
              onChange={(event) =>
                updateRemainingPct(event.target.value)
              }
              style={{
                "--range-value": `${remainingPct}%`
              } as React.CSSProperties}
            />
          </div>

          <fieldset className="pacer-field pacer-weekdays">
            <legend>초기화 요일</legend>
            <div className="pacer-segmented" role="group">
              {RESET_WEEKDAYS.map((weekday) => (
                <button
                  key={weekday.value}
                  type="button"
                  aria-label={weekday.label}
                  aria-pressed={resetWeekday === weekday.value}
                  onClick={() => setResetWeekday(weekday.value)}
                >
                  {weekday.shortLabel}
                </button>
              ))}
            </div>
            <p className="pacer-selection-note" aria-live="polite">
              선택: {selectedResetWeekday.label} 0시 초기화
            </p>
          </fieldset>

          <div className="pacer-worktime">
            <div>
              <strong>주 사용시간</strong>
              <span>기본 09:00-18:00</span>
            </div>
            <div className="pacer-time-inputs">
              <label>
                <span className="sr-only">주 사용 시작 시간</span>
                <input
                  type="time"
                  value={workdayStart}
                  aria-invalid={Boolean(result.warning)}
                  onChange={(event) =>
                    setWorkdayStart(event.target.value)
                  }
                />
              </label>
              <span aria-hidden="true">-</span>
              <label>
                <span className="sr-only">주 사용 종료 시간</span>
                <input
                  type="time"
                  value={workdayEnd}
                  aria-invalid={Boolean(result.warning)}
                  onChange={(event) => setWorkdayEnd(event.target.value)}
                />
              </label>
            </div>
          </div>

          {result.warning ? (
            <p className="pacer-inline-error" role="alert">
              {result.warning} 계산은 기본 시간으로 표시합니다.
            </p>
          ) : null}
        </div>

        <div className="pacer-results" aria-live="polite">
          <section
            className="pacer-coach"
            data-status={result.status}
            aria-labelledby="coach-title"
          >
            <div className="pacer-character">
              <img
                key={result.status}
                src={dalkomi.image.src}
                width={dalkomi.image.width}
                height={dalkomi.image.height}
                alt={dalkomi.alt}
                data-character-status={result.status}
              />
            </div>
            <div className="pacer-coach-copy">
              <span className="pacer-status">달콤이 says</span>
              <h2 id="coach-title">{result.title}</h2>
              <p>{result.message}</p>
              <div className="pacer-budget">
                <span>오늘 권장 용량</span>
                <strong>{formatPercent(result.dailyBudgetPct)}</strong>
              </div>
              <dl className="pacer-facts">
                <div>
                  <dt>초기화까지</dt>
                  <dd>{formatResetDistance(result.hoursUntilReset)}</dd>
                </div>
                <div>
                  <dt>남은 작업일</dt>
                  <dd>{formatWorkdayCount(result.effectiveWorkdays)}</dd>
                </div>
              </dl>
            </div>
          </section>

          <section
            className="pacer-recommendations"
            aria-labelledby="recommendation-title"
          >
            <header>
              <h2 id="recommendation-title">오늘 작업 추천</h2>
              <p>각 규모만 골라 진행할 때의 횟수</p>
            </header>
            <div className="pacer-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th scope="col">규모</th>
                    <th scope="col">기준</th>
                    <th scope="col">추천</th>
                  </tr>
                </thead>
                <tbody>
                  {result.workEstimates.map((estimate) => (
                    <tr key={estimate.id}>
                      <th scope="row">
                        <span className="pacer-size-mark">
                          {estimate.label}
                        </span>
                      </th>
                      <td>
                        <strong>{estimate.example}</strong>
                        <span>
                          약 {estimate.capacityCostPct}% /{" "}
                          {estimate.durationMinutes}분
                        </span>
                      </td>
                      <td>
                        <strong className="pacer-count">
                          {estimate.recommendedCount}
                        </strong>
                        <span>회</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="pacer-disclaimer">
              실제 소모량은 모델, 문맥 길이, 작업 난이도에 따라 달라지는
              추정치입니다.
            </p>
          </section>
        </div>
      </div>

      <dialog
        id="pacer-help-dialog"
        ref={helpDialogRef}
        className="pacer-dialog"
        aria-labelledby="pacer-help-title"
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            closeDialog(helpDialogRef.current);
          }
        }}
      >
        <div className="pacer-dialog-body">
          <header>
            <div>
              <span>AI Pacer</span>
              <h2 id="pacer-help-title">계산 기준</h2>
            </div>
            <button
              className="pacer-icon-button"
              type="button"
              aria-label="계산 기준 닫기"
              title="닫기"
              onClick={() => closeDialog(helpDialogRef.current)}
            >
              ×
            </button>
          </header>

          <div className="pacer-help-list">
            <section>
              <h3>남은 용량</h3>
              <p>
                서비스 화면의 주간 잔여율을 넣습니다. 사용량만 보이면
                100에서 사용량을 뺀 값을 사용합니다.
              </p>
            </section>
            <section>
              <h3>초기화 기준</h3>
              <p>
                선택한 요일 0시를 다음 초기화로 보고, 남은 주
                사용시간에 용량을 나눕니다.
              </p>
            </section>
            <section>
              <h3>작업 규모</h3>
              <p>
                소 2%·20분, 중 6%·60분, 대 15%·150분을 보수적인
                기준으로 사용합니다.
              </p>
            </section>
          </div>

          <p className="pacer-privacy-note">
            입력값은 저장하거나 외부로 전송하지 않습니다.
          </p>

          <div className="pacer-support">
            <strong>무료 도구 후원</strong>
            <div>
              {SUPPORT_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </dialog>
    </section>
  );
}
