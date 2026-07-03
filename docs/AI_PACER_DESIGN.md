# AI Pacer Design

## Product Summary

AI Pacer is a static, browser-only usage pacing calculator for Claude Code and Codex.

It is not an official usage tracker. It does not connect to AI service APIs, does not detect usage automatically, and does not send user-entered values outside the browser.

## MVP Scope

Included:

- Static utility hub at `/`
- AI Pacer calculator at `/ai-pacer/`
- Manual provider selection for Codex and Claude Code
- Manual 5-hour session display value input
- Manual weekly display value input
- Separate weekly settings panel for weekly reset date, daily session target, main usage hours, and new-week creation
- Per-tool profile storage for reset time, daily session target, main usage hours, and active week id
- Provider-specific display conversion
- Dynamic hero decision board that shows first-visit guidance before records exist and record-based coach copy after local records exist
- Recommendation card with visual progress bars
- Scenario comparison chart for simple, medium, and large work estimates
- Rabbit/turtle race coach dashboard merged into the top decision board
- Result guidance box with official reference links for Codex and Claude usage-limit context
- Last recommendation restore after refresh
- Tracking dashboard after at least one saved record, with a provider filter, same-day usage estimate, weekly efficiency analysis, and recent trend bars
- Recent records stored in localStorage
- Recent record edit mode that updates the selected local snapshot instead of creating a duplicate
- Browser-only JSON export for recent local records, with count/size summary and success/failure feedback
- Browser notification permission and test notification UI
- Collapsed utility panels for tracking, recent records, and notification settings
- Default-collapsed FAQ on the calculator page
- About, Privacy, Terms, sitemap, robots, and web manifest
- Local SVG favicon and manifest icon metadata
- Ad placeholder only, without real ad script

Excluded:

- API integration
- Automatic ChatGPT, Claude, Claude Code, or Codex usage detection
- Login, accounts, or authentication
- Server backend
- Database
- Chrome extension
- Payment
- Real ad scripts
- External analytics
- Sending user-entered usage data outside the browser
- JSON import/upload or cloud sync

## Provider Display Rules

The form accepts the number shown by the selected service, not a forced universal "remaining percentage" label.

- Claude Code is treated as `used-up`: the displayed value moves from 0 to 100, so `43` is calculated as `57%` remaining.
- Codex is treated as `remaining-down`: the displayed value moves from 100 to 0, so `43` is calculated as `43%` remaining.

Claude, ChatGPT, and Custom are not shown in the current provider selector. Legacy records with those provider ids may still be displayed or safely mapped when reloaded.

The app shows the converted remaining percentages in the result card so users can verify how the displayed number was interpreted.

## Calculation Model

Inputs:

- Provider type
- 5-hour session display value, 0 to 100
- Weekly display value, 0 to 100
- Optional memo

Weekly settings, stored separately per provider:

- Weekly reset date and time
- Daily 5-hour session target
- Main usage start and end time
- Active local week id

Internal normalized values:

```ts
const normalizedSessionRemainingPct = normalizeDisplayedUsageValue(
  providerType,
  sessionDisplayPct
);

const normalizedWeeklyRemainingPct = normalizeDisplayedUsageValue(
  providerType,
  weeklyDisplayPct
);
```

Weekly pacing:

```ts
const hoursUntilWeeklyReset =
  (weeklyResetAt.getTime() - now.getTime()) / 1000 / 60 / 60;
const daysUntilWeeklyReset = Math.max(hoursUntilWeeklyReset / 24, 0.25);
const safeDailyBudgetPct =
  normalizedWeeklyRemainingPct / daysUntilWeeklyReset;
```

Today's estimated usage:

```ts
const todayUsedPct = Math.max(
  firstWeeklyRemainingPctOfToday - normalizedWeeklyRemainingPct,
  0
);
```

If there is no first record for today, `todayUsedPct` is treated as `0` and the UI warns that the estimate is less accurate.

Recommended additional usage:

```ts
const recommendedAdditionalPct =
  Math.max(safeDailyBudgetPct - todayUsedPct, 0);
```

Daily session pacing:

```ts
const perSessionPaceBudgetPct =
  recommendedAdditionalPct / dailySessionTarget;
```

This is not an estimate of the exact cost of one 5-hour session. It is only a split of today's remaining recommended usage across the user's target number of session flows. The UI labels it as a distribution pace, not a true per-session token allowance.

Main usage hours:

When the user provides a main usage window, AI Pacer estimates the remaining work-time pace for the day. This is advisory only and stays browser-local.

```ts
const hourlyPace =
  recommendedAdditionalPct / remainingWorkHoursToday;
```

If the current session is still healthy and today's remaining pace is meaningful, the app highlights a "use it or lose it" amount to encourage using quota that would otherwise likely remain unused.

Session flow guidance:

```ts
function getSessionBasedMinutes(sessionRemainingPct: number): number {
  if (sessionRemainingPct >= 80) return 120;
  if (sessionRemainingPct >= 60) return 90;
  if (sessionRemainingPct >= 40) return 60;
  if (sessionRemainingPct >= 20) return 30;
  return 0;
}
```

Task intensity is intentionally not part of the current input flow because the next turn's cost is too uncertain in connected AI work.

Scenario guidance replaces a single fixed "session judgment" as the main user-facing estimate. The calculator returns three comparable estimates:

- `quickQuestion`: simple questions, copy cleanup, or direction checks
- `smallCodeChange`: small function edits or single-file fixes
- `largeSourceWork`: larger source analysis, multi-file edits, or longer agentic work

Each estimate is constrained by both the current 5-hour session remaining percentage and today's remaining weekly pace. The UI presents these estimates as "recommended progress time before re-entering the latest state", not as guaranteed completion time.

The 5-hour session reset time is intentionally not a required field in the current MVP. It could support finer guidance later, but it would also add another input users may not know. The safer next step is an optional field that unlocks more detailed guidance only when the user provides it.

## Result UI

The `/ai-pacer/` screen should behave like a practical decision tool, not a long product explainer. Long explanations live on `/about/`; the calculator page keeps the top area focused on what to do next.

Top decision board:

- Short headline: "오늘 어느 AI를 달릴까요?"
- The first-visit body keeps the simple onboarding cue: "숫자 2개 입력하면 오늘 더 쓸 AI가 보입니다."
- After at least one local record exists, the left hero copy becomes a status coach instead of repeating product explanation.
- Coach examples include "갈 길이 멉니다. 필요한 작업은 더 달려도 됩니다", "흐름은 괜찮지만 중간 체크가 좋습니다", "쉬엄쉬엄 짧게 달릴 시간입니다", and "새 대형 작업은 잠시 미루세요".
- The hero coach body names the current AI, such as "Codex 기준", so users know which tool the status applies to.
- The right hero summary does not repeat the same warning headline or nudge. It stays as a compact chart labeled "현재 페이스 요약".
- Compact status summary before calculation
- AI Race Coach always visible in the hero area
- Empty race state that invites the first manual record
- After records exist, Codex vs Claude Code comparison appears in the same top area

Main workbench:

- The result card is the primary full-width decision area.
- The manual input and weekly settings live in a native `details` action panel below the result card.
- The input panel is open for first use and edit mode, then collapses after records exist so repeat visitors do not stare at the whole form every day.

The result card should make the next action obvious after calculation.

- Status pill: `SAFE`, `NORMAL`, `CAUTION`, or `DANGER`
- Nudge message: includes "use more" guidance when the pattern would likely leave quota unused
- Metric cards with progress bars:
- 5-hour session remaining percentage
- Weekly remaining percentage
- Today's remaining pace
- Scenario bars:
- Simple question estimate
- Small function edit estimate
- Large source analysis/edit estimate
- Metrics:
- Recommended current flow time
- Today's additional usable amount
- Use-it-or-lose-it amount
- Daily target session count
- Distribution pace by target session count
- Time until weekly reset
- Main usage-hours guidance
- If today's remaining recommended pace is `0%` or the current 5-hour session remaining percentage is below `20%`, action-oriented metrics and scenario bars are replaced by a visual "오늘 셔터 내림" state. This avoids implying that 120 minutes, large-work re-entry, or distribution pace is still actionable when the current usable window has already closed.
- Official reference links:
- OpenAI Codex usage-limit help article
- OpenAI Codex pricing and limits page
- Claude Code usage/costs documentation
- Claude Pro usage-limit help article
- Warnings and recommended actions

## Tracking Dashboard

The dashboard content appears only when at least one snapshot exists, and the dashboard itself is placed inside a collapsed utility panel.

- The race coach dashboard is part of the top hero decision board.
- It shows an empty visual race state before the first saved record.
- If both Codex and Claude Code have records, it compares the latest normalized remaining values and highlights the provider that can be pushed harder.
- Rabbit pace means a provider has run relatively hard and should be checked before large work.
- Turtle pace means a provider has more room and can be encouraged for the next task.
- The race coach uses only local snapshots. It does not call provider APIs or inspect service pages.
- It defaults to the latest snapshot's tool as the current dashboard scope.
- If both Codex and Claude Code records exist, the user can switch the tracking provider in the dashboard.
- It does not mix Claude Code and Codex records when estimating today's usage.
- Today's usage estimate compares the earliest and latest same-day records for the selected tool.
- Weekly efficiency analysis is scoped by active week id when available, with a reset-time fallback for legacy records.
- A small sparkline shows the selected tool's recent weekly remaining values.

## Utility Panels

Secondary tools stay on `/ai-pacer/` but are collapsed by default:

- `추적 대시보드`: local same-day usage estimate, weekly efficiency, and trend bars.
- `기록 관리`: local snapshot edit/delete/clear and JSON export.
- `알림 설정`: Notification API permission request and test notification.

This keeps the daily screen focused on the hero coach, race coach, result card, and quick input action.

## About Page

The About page carries explanatory content that would slow down the calculator screen:

- AI Pacer is manual input based.
- It does not automatically collect Claude Code or Codex usage.
- It uses browser-local records and provider profiles to estimate pacing.
- The calculator page intentionally reduces explanation so it can work as a fast, practical content tool.

FAQ remains on the calculator page for support and structured content, but is collapsed by default so it does not compete with the daily pacing workflow.

## Accessibility Notes

- Validation errors are announced with `role="alert"` and `aria-live="assertive"`.
- Invalid inputs point to the error summary through `aria-describedby`.
- When validation fails, focus moves to the error summary so keyboard and screen-reader users do not have to hunt for the problem.
- Disabled notification test controls include a short explanation of the missing permission requirement.
- Repeated recent-record actions include the provider, timestamp, and memo in their accessible names so keyboard and screen-reader users can distinguish each "edit" or "delete" action.
- When Notification API is unsupported, impossible permission and test actions are disabled and point to a specific explanatory hint.

## Data Model Notes

New snapshots store both normalized remaining values and display values:

```ts
type UsageSnapshot = {
  id: string;
  weekId?: string;
  providerType: ProviderType;
  providerName: string;
  createdAt: string;
  sessionRemainingPct: number;
  weeklyRemainingPct: number;
  sessionDisplayPct?: number;
  weeklyDisplayPct?: number;
  inputDirection?: ProviderUsageDirection;
  weeklyResetAt: string;
  dailySessionTarget?: number;
  workdayStart?: string;
  workdayEnd?: string;
  taskRiskType: TaskRiskType;
  memo?: string;
};
```

`taskRiskType` remains only for compatibility with older localStorage records. It is not shown in the current form.

Provider profiles now keep provider-specific weekly settings:

```ts
type ProviderProfile = {
  providerType: ActiveProviderType;
  providerName: string;
  weekId: string;
  weekStartedAt: string;
  weeklyResetAt: string;
  dailySessionTarget: number;
  workdayStart: string;
  workdayEnd: string;
};
```

## localStorage Keys

- `ai-pacer.snapshots`
- `ai-pacer.settings`
- `ai-pacer.providerProfiles`
- `ai-pacer.lastRecommendation`
- `ai-pacer.notificationSettings`

Storage access must tolerate invalid JSON, unavailable or blocked localStorage access, quota failures, wrong shapes, null values, and non-array snapshot values.

Editing a recent record keeps the original snapshot `id` and `createdAt` so the record remains the same history item. Same-provider edits preserve the existing week context; changing the provider while editing uses the newly selected provider profile.

Last recommendation restore is intentionally strict. If the saved recommendation shape does not include the current scenario and guidance fields, AI Pacer ignores it instead of restoring a stale or partial result UI.

Recent records can be exported as a local JSON file with `serviceName`, `version`, `exportedAt`, and `snapshots`. Export is one-way browser download only. It does not upload, import, sync, or send data outside the browser. The history panel shows how many snapshots are included, the approximate JSON size, and whether the browser download was started.

If localStorage writes fail, AI Pacer keeps the current in-memory result visible and shows a storage warning for the failed area: form settings, provider profiles, snapshots, or last recommendation restore state.

## Completion Criteria

- `/ai-pacer/` uses the service name AI Pacer
- Manual input only
- Claude/Codex display conversion works
- Codex and Claude Code keep separate weekly reset, session target, usage-hours, and week-id profiles
- Task intensity selector is not shown
- Result card includes metric progress cards, scenario bars, work-hours guidance, and nudge guidance
- Last result persists after refresh
- Tracking dashboard appears after at least one saved record, keeps provider-specific estimates separate, and can switch between saved providers
- Recent records can be saved, edited in place, exported as JSON, deleted, and cleared
- Recent record export shows success/failure feedback without uploading data
- Repeated-use sections are collapsed by default: input after records exist, tracking, history, notification settings, and FAQ
- Build output remains static
- No server/API/login/extension work is introduced
