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
  PACER_PLANS,
  RESET_WEEKDAYS,
  resolvePacerLocale
} from "../lib/pacerCalculator";
import type {
  PaceStatus,
  PacerLocale,
  PacerPlan,
  ResetWeekday,
  WorkPlanItem
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
    plan: "Claude 플랜",
    planHint: "공식 용량 배수로 작업 횟수를 보정합니다.",
    planOptionLabel: (name: string, price: number, multiplier: number) =>
      `${name}, 월 ${price}달러, ${multiplier}배 용량`,
    resetDay: "초기화 요일",
    resetTime: "초기화 시간",
    resetSelection: (day: string, time: string) =>
      `선택: ${day} ${time} 초기화`,
    workHours: "주요 사용시간",
    workHoursDefault: "기본 09:00-18:00",
    workStart: "주 사용 시작 시간",
    workEnd: "주 사용 종료 시간",
    warningSuffix: "기본값으로 계산합니다.",
    coachByline: "달콤이 says",
    todayBudget: "오늘 권장 용량",
    untilReset: "초기화까지",
    workdaysLeft: "남은 작업일",
    recommendationTitle: "오늘 작업 추천",
    recommendationSubtitle: (name: string) =>
      `${name} · 같은 오늘 예산을 한 규모에만 썼을 때`,
    size: "규모",
    basis: "용량 기준",
    recommendation: "추천",
    basisValue: (capacity: number, interactionGuide: string) =>
      `약 ${capacity}% · ${interactionGuide}`,
    countSuffix: "회",
    mixLabel: "오늘 조합 예시",
    sharedBudget: "세 행은 같은 예산을 공유하므로 서로 더하지 않습니다.",
    disclaimer:
      "모델·문맥·도구 사용에 따라 실제 소모량이 달라지며, 서비스별 5시간·세션 한도가 이 결과보다 먼저 적용될 수 있습니다.",
    helpTitle: "계산 기준",
    helpClose: "계산 기준 닫기",
    helpSections: [
      {
        title: "남은 용량",
        body:
          "서비스 화면의 주간 잔여율을 넣습니다. 사용량만 보이면 100에서 사용량을 뺀 값을 사용합니다."
      },
      {
        title: "플랜 보정",
        body:
          "Pro $20를 1x 기준으로 두고 Max 5x $100은 작업당 추정 소모율을 1/5로 낮춥니다. 가격이 아니라 공식 5배 용량 차이를 반영합니다."
      },
      {
        title: "초기화 기준",
        body:
          "오늘 권장 용량은 주간 잔여율을 초기화까지 남은 주요 사용일 환산값으로 나눕니다. 주요 사용시간은 하루 길이를 정하는 배분 기준이며, 현재 시각이 그 시간대 밖이어도 권장량을 0으로 막지 않습니다. 초기화 전 예정된 사용 구간이 없으면 남은 용량 전부를 이번 예산으로 봅니다."
      },
      {
        title: "작업 규모",
        body:
          "Pro 1x에서 소 2%는 1-2턴의 짧은 문맥, 중 6%는 3-5턴의 중간 문맥, 대 15%는 6턴 이상의 긴 문맥을 보수적인 기준으로 사용합니다. Max 5x에서는 각각 1/5로 보정하며 시간은 횟수를 제한하지 않습니다."
      },
      {
        title: "별도 세션 한도",
        body:
          "서비스에 5시간 또는 단기 세션 한도가 있다면 그 한도가 이 주간 계획보다 먼저 적용될 수 있습니다. 서비스 화면의 세션 상태를 함께 확인하세요."
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
    plan: "Claude plan",
    planHint: "Task counts are adjusted by the official capacity multiplier.",
    planOptionLabel: (name: string, price: number, multiplier: number) =>
      `${name}, ${price} dollars monthly, ${multiplier} times capacity`,
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
    recommendationSubtitle: (name: string) =>
      `${name} · using the same budget on one task size`,
    size: "Size",
    basis: "Capacity basis",
    recommendation: "Plan",
    basisValue: (capacity: number, interactionGuide: string) =>
      `About ${capacity}% · ${interactionGuide}`,
    countSuffix: "x",
    mixLabel: "Example mix",
    sharedBudget: "All three rows share the same budget, so do not add them together.",
    disclaimer:
      "Actual usage varies by model, context and tool use. A service-specific five-hour or session limit may apply before this plan.",
    helpTitle: "How it works",
    helpClose: "Close calculation guide",
    helpSections: [
      {
        title: "Capacity left",
        body:
          "Enter the weekly percentage remaining. If your service shows usage, subtract it from 100."
      },
      {
        title: "Plan correction",
        body:
          "Pro $20 is the 1x baseline. Max 5x $100 divides each estimated task cost by five, reflecting the official capacity difference rather than price alone."
      },
      {
        title: "Reset schedule",
        body:
          "Today’s capacity divides weekly capacity left by the main-work-day equivalents remaining until reset. Main work hours define the allocation day length; being outside those hours does not force the recommendation to zero. If no scheduled window remains before reset, all remaining capacity becomes the current budget."
      },
      {
        title: "Task sizes",
        body:
          "On Pro 1x, conservative defaults are 2% for 1-2 short-context turns, 6% for 3-5 medium-context turns, and 15% for 6 or more long-context turns. Max 5x divides these costs by five. Time does not cap the counts."
      },
      {
        title: "Separate session limits",
        body:
          "A service-specific five-hour or short session limit may apply before this weekly plan. Check the session status shown by your service."
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

function formatMixedWorkPlan(
  items: WorkPlanItem[],
  locale: PacerLocale
): string {
  if (items.length === 0) {
    return locale === "ko"
      ? "추천 가능한 작업 없음"
      : "No task fits this budget";
  }

  return items
    .map((item) =>
      locale === "ko"
        ? `${item.label} ${item.count}회`
        : `${item.label} ${item.count}x`
    )
    .join(" + ");
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
  const [plan, setPlan] = useState<PacerPlan>("pro");
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
          plan,
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
      plan,
      remainingPct,
      resetTime,
      resetWeekday,
      workdayEnd,
      workdayStart
    ]
  );
  const selectedPlan =
    PACER_PLANS.find((option) => option.value === plan) ??
    PACER_PLANS[0];
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

          <fieldset className="pacer-field pacer-plan">
            <legend>{copy.plan}</legend>
            <p>{copy.planHint}</p>
            <div className="pacer-plan-options">
              {PACER_PLANS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-label={copy.planOptionLabel(
                    option.name,
                    option.priceUsd,
                    option.multiplier
                  )}
                  aria-pressed={plan === option.value}
                  onClick={() => setPlan(option.value)}
                >
                  <strong>{option.name}</strong>
                  <span>
                    ${option.priceUsd} · {option.multiplier}x
                  </span>
                </button>
              ))}
            </div>
          </fieldset>

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
              <p>
                {copy.recommendationSubtitle(selectedPlan.name)}
              </p>
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
                            estimate.interactionGuide
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
            <div className="pacer-mix-plan">
              <span>{copy.mixLabel}</span>
              <strong>
                {formatMixedWorkPlan(
                  result.mixedWorkPlan,
                  activeLocale
                )}
              </strong>
            </div>
            <p className="pacer-shared-budget">
              {copy.sharedBudget}
            </p>
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
