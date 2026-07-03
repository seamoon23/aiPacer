# Dynamic Hero Workbench Design

## Goal

Reduce repeated explanatory copy on `/ai-pacer/` and make the page feel like a daily AI pacing cockpit: records and recommendations drive the hero message, while secondary tools stay available without occupying the main decision area.

## Scope

Included:

- Keep the first-visit hero explanation when no local records exist.
- Replace the large static hero title with a record/recommendation based coach message after at least one record exists.
- Make the main calculator area full-width and easier to scan instead of a narrow left/right split.
- Keep the input form open for first use and edit mode, but collapse it behind a clear action control after records exist.
- Move tracking, recent records, and notification settings into collapsed utility panels.
- Collapse the FAQ area by default on the AI Pacer page.

Excluded:

- API integration, automatic service detection, login, server backend, database, Chrome extension, analytics, or cloud sync.
- New calculations beyond using the existing recommendation and local snapshots.

## Hero Behavior

When there are no snapshots, the hero keeps the onboarding message:

- Title: "오늘 어느 AI를 달릴까요?"
- Body: "숫자 2개 입력하면 오늘 더 쓸 AI가 보입니다."

When at least one snapshot exists, the hero becomes a coach:

- `danger`: "새 대형 작업은 잠시 미루세요"
- `caution`: "쉬엄쉬엄 짧게 달릴 시간입니다"
- `normal`: "흐름은 괜찮지만 중간 체크가 좋습니다"
- `safe`: "갈 길이 멉니다. 필요한 작업은 더 달려도 됩니다"
- If there is no current recommendation but records exist, use the latest snapshot remaining values to choose between push/steady/rest wording.

The hero body should explain why in one short sentence, not restate product features.

## Main Workbench Layout

The main area becomes a vertical workbench:

- Result card appears as the primary full-width decision card.
- Input form appears below as an action panel.
- The input panel is open by default when no snapshots exist or when editing a saved record.
- After records exist, the input panel is collapsed by default and opened through a clear "새 잔여율 입력" action.
- Weekly settings remain near input but inside the same input/action zone.

## Utility Panels

Tracking dashboard, recent record management, and notification settings remain on the same page but collapse by default:

- Tracking panel label: "추적 대시보드"
- History panel label: "기록 관리"
- Notification panel label: "알림 설정"

Each panel should show a short summary when closed. This preserves discoverability without making the daily screen feel crowded.

## FAQ

FAQ remains on `/ai-pacer/` for SEO and user support but is collapsed by default. The page should no longer force FAQ content into the main daily workflow.

## Accessibility

- Use native `<details>` and `<summary>` where possible for keyboard support.
- Keep validation alerts and edit mode status behavior unchanged.
- Ensure collapsed sections have meaningful summary text.

## Tests

Add component tests for:

- First-visit hero keeps onboarding copy.
- Existing records switch the hero to coach copy and remove the repeated onboarding body.
- Input form is collapsed after records exist but open on first visit and edit mode.
- Tracking, history, and notification sections are rendered as collapsed utility panels.

Update existing tests that assume the form is always directly visible.
