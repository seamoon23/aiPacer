# AI Pacer Next Tasks

This list prioritizes work that stays inside the first MVP safety boundary: static app, manual input, browser-only storage, no API integration, no login, no server, and no browser extension.

## Priority 1: Large, High-Value Work

1. Component-level workflow coverage
   - Status: expanded
   - Why: protects the highest-risk user paths from regressions.
   - Current coverage: calculation submit, Claude Code/Codex display conversion, per-tool weekly settings, new week creation, work-hours persistence, first-visit hero guidance, record-based dynamic hero coach copy, hero warning de-duplication, full-width result workbench, collapsed input panel after records exist, always-visible race coach empty state, race coach dashboard comparison, collapsed utility panels for tracking/history/notifications, provider-selectable tracking dashboard, provider-scoped same-day dashboard calculation, weekly efficiency analysis, hero chart dashboard, work scenario estimate chart, zero-pace and low-session shutter states, safer distribution-pace wording, official reference links in the result guidance box, last result restore, malformed last-result restore guard, validation error display, storage failure notice rendering, quota failure notices for form settings, provider profiles, snapshots, and last-result restore state, localStorage access-blocked fallback, notification permission/test flow, Notification API unsupported state, in-place snapshot edit, browser-only JSON export with success/failure feedback, individual delete, clear all, task intensity removal.
   - Good next additions: keyboard walkthrough around collapsed panels and storage warnings.
   - Parallelizable: yes, tests can be added independently by workflow.

2. Accessibility pass on the calculator form
   - Status: expanded
   - Why: the app is form-heavy, so field errors and descriptions need to be clear for assistive technology.
   - Current coverage: invalid session input receives `aria-invalid`, links to the error summary through `aria-describedby`, and the error summary uses `role="alert"` with `aria-live="assertive"` and receives focus after validation. Repeated recent-record edit/delete buttons now have unique accessible names.
   - Good next additions: color contrast scan and viewport-level keyboard walkthrough.
   - Parallelizable: partially, focus/keyboard checks can be tested separately from visual contrast.

3. Static deployment readiness
   - Status: started
   - Why: the app is meant to be deployed as static output.
   - Current coverage: `robots.txt`, `site.webmanifest`, manifest icon metadata, local SVG favicon, `sitemap.xml`, route metadata, build output checks.
   - Good next additions: production domain configuration and cache headers for hosting provider.
   - Parallelizable: yes, icons and hosting configuration can be prepared separately.

## Priority 2: Medium Work

1. User-facing copy review
   - Keep all copy aligned with "manual input", "estimated result", and "browser-only storage".
   - Avoid wording that implies official usage tracking or automatic detection.
   - Current focus: keep the current provider scope to Codex and Claude Code, use "service display value" where provider-specific 0-to-100 and 100-to-0 behavior matters, and avoid implying that distribution pace equals a real 5-hour session token allowance.

2. Visual QA across viewports
   - Confirm `/`, `/ai-pacer/`, `/privacy/`, `/terms/`, and `/about/` on mobile and desktop.
   - Check that the dynamic hero copy, race lanes, input disclosure, utility disclosure panels, form labels, progress bars, nudge cards, shutter state, buttons, and result cards do not overflow.

3. Notification UI test coverage
   - Status: expanded.
   - Current coverage: denied permission explanation, permission request to granted, test notification send, and test timestamp display.
   - Good next additions: unsupported Notification API copy and denied-to-granted browser behavior variations.
   - Keep this as a simple browser Notification API feature only.

4. Local data portability
   - Status: expanded.
   - Current coverage: saved snapshots can be exported as a one-way browser JSON download with `serviceName`, `version`, `exportedAt`, and `snapshots`; the history panel shows export count/size summary and success/failure feedback when the browser download starts or fails.
   - Good next additions: optional export timestamp display in the history panel.
   - Do not add JSON import, upload, or cloud sync without fresh approval.

## Priority 3: Later MVP Improvements

1. Lightweight usage trend view from saved snapshots
   - Browser-only.
   - No analytics, no server sync.
   - Status: expanded.
   - Current coverage: provider-selectable dashboard, same-day usage estimate by selected tool, weekly efficiency analysis, and small weekly remaining sparkline.
   - Good next additions: longer local trend window and optional week comparison cards.

2. Better empty and storage-failure states
   - Make quota/localStorage-disabled cases easier to understand.
   - Consider a first-load storage-blocked banner if browser settings prevent localStorage access entirely.

3. Optional 5-hour session reset time
   - Keep it optional, not required.
   - If provided, use it to refine within-session pacing and "check again before reset" guidance.
   - Do not add it as a mandatory field unless user testing shows the extra input is worth the friction.

4. Local calibration from before/after records
   - Browser-only.
   - Use saved local snapshots to estimate personal usage deltas by work type.
   - Do not infer usage automatically from AI service pages; this must stay based on manual before/after entries.

## Do Not Start Without Fresh Approval

- API integration
- Automatic AI service usage detection
- Login, accounts, or authentication
- Server backend
- Database
- Chrome extension
- Payment
- Real ad scripts
- External analytics
