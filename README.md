# AI Pacer

AI Pacer is a static Astro + React web app for manually estimating Claude Code and Codex usage pace. Users enter the number shown in their AI service UI, and the app converts provider-specific display styles into remaining percentages locally in the browser.

It does not connect to AI service APIs, does not detect usage automatically, and does not send user input to a server.

## Current MVP Behavior

- Codex input is treated as a 100-to-0 remaining display.
- Claude Code input is treated as a 0-to-100 used-up display and converted to remaining percentage.
- Codex and Claude Code keep separate weekly reset times and daily 5-hour session targets.
- The latest recommendation is restored after refresh.
- After calculation, the hero area switches from guidance copy to a chart-focused dashboard.
- Recommendations include scenario estimates for simple questions, small function edits, and large source analysis or edit work.
- The tracking dashboard uses the latest tool only when estimating same-day usage and drawing its local trend.
- Notification support is limited to browser permission request and a manual test notification.
- 5-hour session reset time is not a required input in this MVP. It is a good future optional field, but keeping it optional avoids making the main form heavier before the estimate quality benefit is proven.

## Routes

- `/` - free utility hub
- `/ai-pacer/` - AI Pacer calculator
- `/about/` - site overview
- `/privacy/` - privacy policy
- `/terms/` - terms
- `/sitemap.xml` - static sitemap
- `/robots.txt` - crawler guidance
- `/site.webmanifest` - install metadata

## Local Commands

Run commands from this directory:

```powershell
Set-Location C:\codex\app\AiPacer
```

Install dependencies:

```powershell
npm install
```

Start the development server:

```powershell
npm run dev
```

Build static output:

```powershell
npm run build
```

Preview the built site:

```powershell
npm run preview
```

Run tests and type checks:

```powershell
npm test
npm run typecheck
```

## localStorage Keys

- `ai-pacer.snapshots`
- `ai-pacer.settings`
- `ai-pacer.providerProfiles`
- `ai-pacer.lastRecommendation`
- `ai-pacer.notificationSettings`

New snapshots keep both the original displayed values and the normalized remaining values:

- `sessionDisplayPct`, `weeklyDisplayPct`: the numbers the user typed from the service UI
- `sessionRemainingPct`, `weeklyRemainingPct`: the values AI Pacer uses for calculation
- `inputDirection`: `used-up` for Claude-style 0-to-100 displays, `remaining-down` for Codex-style 100-to-0 displays
- `dailySessionTarget`: planned number of 5-hour sessions to spend per day for the selected tool

## Explicitly Excluded

- API integration
- Automatic ChatGPT, Claude, Claude Code, or Codex usage detection
- Login or account system
- Server backend
- Database storage
- Chrome extension
- Payment
- Real AdSense code
- External analytics scripts
- Sending user-entered usage data outside the browser
