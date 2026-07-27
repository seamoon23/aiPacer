import { useEffect, useMemo, useRef, useState } from "react";

import cautionImage from "../assets/dalkomi-caution.webp";
import encourageImage from "../assets/dalkomi-encourage.webp";
import maintainImage from "../assets/dalkomi-maintain.webp";
import pushImage from "../assets/dalkomi-push.webp";
import unavailableImage from "../assets/dalkomi-unavailable.webp";
import {
  calculatePacer,
  DEFAULT_RESET_TIME,
  DEFAULT_WORKDAY_END,
  DEFAULT_WORKDAY_START,
  RESET_WEEKDAYS,
  resolvePacerLocale
} from "../lib/pacerCalculator";
import type {
  PaceStatus,
  PacerLocale,
  ResetWeekday
} from "../lib/pacerCalculator";
import { withBasePath } from "../lib/siteMetadata";
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
  {
    image: ReturnType<typeof normalizeCharacterAsset>;
    alt: Record<PacerLocale, string>;
  }
> = {
  push: {
    image: normalizeCharacterAsset(
      pushImage as unknown as ImportedCharacterAsset
    ),
    alt: {
      ko: "지시봉을 들고 오늘 할 일을 독려하는 안경 쓴 샴고양이 달콤이",
      en: "Dalkomi, a Siamese cat in glasses, encouraging today’s work"
    }
  },
  encourage: {
    image: normalizeCharacterAsset(
      encourageImage as unknown as ImportedCharacterAsset
    ),
    alt: {
      ko: "엄지를 들고 다정하게 응원하는 안경 쓴 샴고양이 달콤이",
      en: "Dalkomi, a Siamese cat in glasses, giving a warm thumbs-up"
    }
  },
  maintain: {
    image: normalizeCharacterAsset(
      maintainImage as unknown as ImportedCharacterAsset
    ),
    alt: {
      ko: "계획표를 펼쳐 들고 차분하게 페이스를 확인하는 안경 쓴 샴고양이 달콤이",
      en: "Dalkomi, a Siamese cat in glasses, calmly reviewing the plan"
    }
  },
  caution: {
    image: normalizeCharacterAsset(
      cautionImage as unknown as ImportedCharacterAsset
    ),
    alt: {
      ko: "안경을 낮추고 한 발 쉬어 가라고 주의를 주는 샴고양이 달콤이",
      en: "Dalkomi, a Siamese cat in glasses, warning you to slow down"
    }
  },
  unavailable: {
    image: normalizeCharacterAsset(
      unavailableImage as unknown as ImportedCharacterAsset
    ),
    alt: {
      ko: "닫힌 노트 위에 기대 잠들어 오늘 작업을 말리는 샴고양이 달콤이",
      en: "Dalkomi, a Siamese cat asleep on a closed notebook"
    }
  }
};

type AiPacerAppProps = {
  variant?: "page" | "extension";
  locale?: PacerLocale;
};

const SUPPORT_LINKS = [
  {
    label: "GitHub Sponsors",
    href: "https://github.com/sponsors/seamoon23"
  },
  {
    label: "Ko-fi (PayPal)",
    href: "https://ko-fi.com/seamoon23"
  }
] as const;

const UI_COPY = {
  ko: {
    title: "오늘, 얼마나 달려도 될까?",
    helpOpen: "계산 기준 보기",
    remaining: "주간 남은 용량",
    remainingRange: "주간 남은 용량 슬라이더",
    resetDay: "초기화 요일",
    resetTime: "초기화 시간",
    resetSelection: (day: string, time: string) =>
      `선택: ${day} ${time} 초기화`,
    workHours: "주 사용시간",
    workHoursDefault: "기본 09:00-18:00",
    workStart: "주 사용 시작 시간",
    workEnd: "주 사용 종료 시간",
    warningSuffix: "기본값으로 계산합니다.",
    coachByline: "달콤이 says",
    todayBudget: "오늘 권장 용량",
    untilReset: "초기화까지",
    workdaysLeft: "남은 작업일",
    recommendationTitle: "오늘 작업 추천",
    recommendationSubtitle: "각 규모만 골라 진행할 때의 횟수",
    size: "규모",
    basis: "기준",
    recommendation: "추천",
    basisValue: (capacity: number, minutes: number) =>
      `약 ${capacity}% / ${minutes}분`,
    countSuffix: "회",
    disclaimer:
      "실제 소모량은 모델, 문맥 길이, 작업 난이도에 따라 달라지는 추정치입니다.",
    helpTitle: "계산 기준",
    helpClose: "계산 기준 닫기",
    helpSections: [
      {
        title: "남은 용량",
        body:
          "서비스 화면의 주간 잔여율을 넣습니다. 사용량만 보이면 100에서 사용량을 뺀 값을 사용합니다."
      },
      {
        title: "초기화 기준",
        body:
          "선택한 요일과 시간을 다음 초기화로 보고, 남은 주 사용시간에 용량을 나눕니다."
      },
      {
        title: "작업 규모",
        body:
          "소 2%·20분, 중 6%·60분, 대 15%·150분을 보수적인 기준으로 사용합니다."
      }
    ],
    actualDalkomiTitle: "실제 달콤이",
    actualDalkomiBody:
      "3살 샴고양이 달콤이입니다. 집에서는 별명 돼지로도 불립니다.",
    actualDalkomiAlt:
      "햇빛이 드는 침대에 앉아 정면을 바라보는 실제 샴고양이 달콤이",
    privacy: "입력값은 저장하거나 외부로 전송하지 않습니다.",
    support: "무료 도구 후원"
  },
  en: {
    title: "How much can I use today?",
    helpOpen: "View calculation guide",
    remaining: "Weekly capacity left",
    remainingRange: "Weekly capacity remaining slider",
    resetDay: "Reset day",
    resetTime: "Reset time",
    resetSelection: (day: string, time: string) =>
      `Selected: ${day} at ${time}`,
    workHours: "Main work hours",
    workHoursDefault: "Default 09:00-18:00",
    workStart: "Workday start time",
    workEnd: "Workday end time",
    warningSuffix: "Defaults are used for this calculation.",
    coachByline: "Dalkomi says",
    todayBudget: "Today’s capacity",
    untilReset: "Until reset",
    workdaysLeft: "Workdays left",
    recommendationTitle: "Today’s task plan",
    recommendationSubtitle: "Counts when using only one task size",
    size: "Size",
    basis: "Basis",
    recommendation: "Plan",
    basisValue: (capacity: number, minutes: number) =>
      `About ${capacity}% / ${minutes} min`,
    countSuffix: "x",
    disclaimer:
      "These are planning estimates. Actual usage varies by model, context length and task difficulty.",
    helpTitle: "How it works",
    helpClose: "Close calculation guide",
    helpSections: [
      {
        title: "Capacity left",
        body:
          "Enter the weekly percentage remaining. If your service shows usage, subtract it from 100."
      },
      {
        title: "Reset schedule",
        body:
          "The selected day and time are treated as the next reset, and capacity is spread across the work hours left."
      },
      {
        title: "Task sizes",
        body:
          "Conservative defaults are 2% and 20 min for small, 6% and 60 min for medium, and 15% and 150 min for large."
      }
    ],
    actualDalkomiTitle: "Meet the real Dalkomi",
    actualDalkomiBody:
      "Dalkomi is a three-year-old Siamese cat, also affectionately called Piggy.",
    actualDalkomiAlt:
      "The real Dalkomi, a Siamese cat sitting on a sunlit bed",
    privacy: "Inputs are never stored or sent outside this screen.",
    support: "Support this free tool"
  }
} as const;

function formatPercent(value: number): string {
  if (value <= 0) {
    return "0%";
  }

  if (value >= 10) {
    return `${Math.round(value)}%`;
  }

  return `${value.toFixed(1)}%`;
}

function formatResetDistance(
  hours: number,
  locale: PacerLocale
): string {
  const totalHours = Math.max(0, Math.round(hours));
  const days = Math.floor(totalHours / 24);
  const remainingHours = totalHours % 24;

  if (locale === "en") {
    if (days <= 0) {
      return `${remainingHours}h`;
    }

    if (remainingHours === 0) {
      return `${days}d`;
    }

    return `${days}d ${remainingHours}h`;
  }

  if (days <= 0) {
    return `${remainingHours}시간`;
  }

  if (remainingHours === 0) {
    return `${days}일`;
  }

  return `${days}일 ${remainingHours}시간`;
}

function formatWorkdayCount(
  value: number,
  locale: PacerLocale
): string {
  if (value <= 0) {
    return locale === "ko" ? "0일" : "0 days";
  }

  return locale === "ko"
    ? `${value.toFixed(1)}일`
    : `${value.toFixed(1)} days`;
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
  variant = "page",
  locale
}: AiPacerAppProps) {
  const [detectedLocale, setDetectedLocale] = useState<PacerLocale>(
    locale ?? "ko"
  );
  const [remainingPct, setRemainingPct] = useState(60);
  const [resetWeekday, setResetWeekday] =
    useState<ResetWeekday>(1);
  const [resetTime, setResetTime] = useState(DEFAULT_RESET_TIME);
  const [workdayStart, setWorkdayStart] = useState(
    DEFAULT_WORKDAY_START
  );
  const [workdayEnd, setWorkdayEnd] = useState(DEFAULT_WORKDAY_END);
  const [now, setNow] = useState(() => new Date());
  const helpDialogRef = useRef<HTMLDialogElement>(null);
  const activeLocale = locale ?? detectedLocale;
  const copy = UI_COPY[activeLocale];

  useEffect(() => {
    if (!locale) {
      setDetectedLocale(resolvePacerLocale(window.navigator.language));
    }
  }, [locale]);

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
          resetTime,
          workdayStart,
          workdayEnd,
          locale: activeLocale
        },
        now
      ),
    [
      activeLocale,
      now,
      remainingPct,
      resetTime,
      resetWeekday,
      workdayEnd,
      workdayStart
    ]
  );
  const selectedResetWeekday =
    RESET_WEEKDAYS.find((weekday) => weekday.value === resetWeekday) ??
    RESET_WEEKDAYS[1];
  const dalkomi = DALKOMI_IMAGES[result.status];
  const actualDalkomiSrc =
    variant === "extension"
      ? "./assets/dalkomi-portrait.webp"
      : withBasePath("/assets/dalkomi-portrait.webp");

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
      lang={activeLocale}
      data-locale={activeLocale}
      aria-labelledby="pacer-title"
    >
      <div className="pacer-layout">
        <div className="pacer-inputs">
          <header className="pacer-tool-head">
            <div>
              <strong className="pacer-wordmark">AI Pacer</strong>
              <h1 id="pacer-title">{copy.title}</h1>
            </div>
            <button
              className="pacer-icon-button"
              type="button"
              aria-label={copy.helpOpen}
              title={copy.helpOpen}
              aria-controls="pacer-help-dialog"
              aria-haspopup="dialog"
              onClick={openHelp}
            >
              ?
            </button>
          </header>

          <div className="pacer-field">
            <div className="pacer-field-heading">
              <label htmlFor="weekly-remaining">{copy.remaining}</label>
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
              aria-label={copy.remainingRange}
              onChange={(event) =>
                updateRemainingPct(event.target.value)
              }
              style={{
                "--range-value": `${remainingPct}%`
              } as React.CSSProperties}
            />
          </div>

          <fieldset className="pacer-field pacer-weekdays">
            <legend>{copy.resetDay}</legend>
            <div className="pacer-segmented" role="group">
              {RESET_WEEKDAYS.map((weekday) => (
                <button
                  key={weekday.value}
                  type="button"
                  aria-label={weekday.label[activeLocale]}
                  aria-pressed={resetWeekday === weekday.value}
                  onClick={() => setResetWeekday(weekday.value)}
                >
                  {weekday.shortLabel[activeLocale]}
                </button>
              ))}
            </div>
            <div className="pacer-reset-time">
              <label htmlFor="reset-time">{copy.resetTime}</label>
              <input
                id="reset-time"
                type="time"
                value={resetTime}
                aria-invalid={result.warningCodes.includes("reset-time")}
                onChange={(event) => setResetTime(event.target.value)}
              />
            </div>
            <p className="pacer-selection-note" aria-live="polite">
              {copy.resetSelection(
                selectedResetWeekday.label[activeLocale],
                resetTime
              )}
            </p>
          </fieldset>

          <div className="pacer-worktime">
            <div>
              <strong>{copy.workHours}</strong>
              <span>{copy.workHoursDefault}</span>
            </div>
            <div className="pacer-time-inputs">
              <label>
                <span className="sr-only">{copy.workStart}</span>
                <input
                  type="time"
                  value={workdayStart}
                  aria-invalid={result.warningCodes.includes("work-window")}
                  onChange={(event) =>
                    setWorkdayStart(event.target.value)
                  }
                />
              </label>
              <span aria-hidden="true">-</span>
              <label>
                <span className="sr-only">{copy.workEnd}</span>
                <input
                  type="time"
                  value={workdayEnd}
                  aria-invalid={result.warningCodes.includes("work-window")}
                  onChange={(event) => setWorkdayEnd(event.target.value)}
                />
              </label>
            </div>
          </div>

          {result.warning ? (
            <p className="pacer-inline-error" role="alert">
              {result.warning} {copy.warningSuffix}
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
                alt={dalkomi.alt[activeLocale]}
                data-character-status={result.status}
              />
            </div>
            <div className="pacer-coach-copy">
              <span className="pacer-status">{copy.coachByline}</span>
              <h2 id="coach-title">{result.title}</h2>
              <p>{result.message}</p>
              <div className="pacer-budget">
                <span>{copy.todayBudget}</span>
                <strong>{formatPercent(result.dailyBudgetPct)}</strong>
              </div>
              <dl className="pacer-facts">
                <div>
                  <dt>{copy.untilReset}</dt>
                  <dd>
                    {formatResetDistance(
                      result.hoursUntilReset,
                      activeLocale
                    )}
                  </dd>
                </div>
                <div>
                  <dt>{copy.workdaysLeft}</dt>
                  <dd>
                    {formatWorkdayCount(
                      result.effectiveWorkdays,
                      activeLocale
                    )}
                  </dd>
                </div>
              </dl>
            </div>
          </section>

          <section
            className="pacer-recommendations"
            aria-labelledby="recommendation-title"
          >
            <header>
              <h2 id="recommendation-title">
                {copy.recommendationTitle}
              </h2>
              <p>{copy.recommendationSubtitle}</p>
            </header>
            <div className="pacer-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th scope="col">{copy.size}</th>
                    <th scope="col">{copy.basis}</th>
                    <th scope="col">{copy.recommendation}</th>
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
                          {copy.basisValue(
                            estimate.capacityCostPct,
                            estimate.durationMinutes
                          )}
                        </span>
                      </td>
                      <td>
                        <strong className="pacer-count">
                          {estimate.recommendedCount}
                        </strong>
                        <span>{copy.countSuffix}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="pacer-disclaimer">{copy.disclaimer}</p>
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
              <h2 id="pacer-help-title">{copy.helpTitle}</h2>
            </div>
            <button
              className="pacer-icon-button"
              type="button"
              aria-label={copy.helpClose}
              title={copy.helpClose}
              onClick={() => closeDialog(helpDialogRef.current)}
            >
              ×
            </button>
          </header>

          <figure className="pacer-real-dalkomi">
            <img
              src={actualDalkomiSrc}
              width="900"
              height="1948"
              alt={copy.actualDalkomiAlt}
            />
            <figcaption>
              <strong>{copy.actualDalkomiTitle}</strong>
              <span>{copy.actualDalkomiBody}</span>
            </figcaption>
          </figure>

          <div className="pacer-help-list">
            {copy.helpSections.map((section) => (
              <section key={section.title}>
                <h3>{section.title}</h3>
                <p>{section.body}</p>
              </section>
            ))}
          </div>
          <p className="pacer-privacy-note">
            {copy.privacy}
          </p>

          <div className="pacer-support">
            <strong>{copy.support}</strong>
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
