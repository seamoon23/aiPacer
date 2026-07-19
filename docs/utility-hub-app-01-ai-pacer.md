# Utility Hub App 01: AI Pacer

## One-line Summary

AI Pacer is a browser-only utility that helps users manually estimate AI tool usage pace, cooldown timing, and whether they should keep working or wait.

## Hub Fit

AI Pacer is suitable as app 01 in a utility hub site.

- It solves a specific recurring problem: "Can I keep using Codex or Claude Code right now?"
- It does not need AI API integration, login, backend storage, or account permissions.
- The calculator-style workflow keeps hosting and operating cost low.
- Browser-only storage is a privacy-friendly selling point.
- The app has enough original utility to stand alone as one page in a broader free-tools hub.

Position it as a practical productivity calculator, not as an official AI usage tracker.

## Suggested Hub Card Copy

Title:

```text
AI Pacer
```

Subtitle:

```text
Codex and Claude Code usage pace calculator
```

Short description:

```text
Manually enter the usage numbers shown by your AI tools and get a local estimate of remaining pace, cooldown pressure, and next-work timing.
```

CTA:

```text
Open calculator
```

Korean variant:

```text
AI 사용량 숫자를 직접 입력해 오늘 더 달려도 되는지, 잠시 기다릴지 계산하는 브라우저 로컬 유틸리티.
```

## MVP Scope

Current page:

- Route: `/ai-pacer/`
- Manual usage input only
- Codex remaining-style display support
- Claude Code used-style display conversion
- Separate weekly settings per tool
- Local snapshot history
- Local recommendation restore after refresh
- Race-style comparison dashboard
- Browser notification permission and test notification
- Browser-only JSON export

Explicitly excluded:

- AI service API integration
- Automatic usage detection
- Login or accounts
- Server backend
- Database storage
- Chrome extension
- Payment flow
- Real analytics scripts

## Advertising Notes

AI Pacer can be monetized as part of a useful utility hub, but avoid making the page feel like it exists only for ads.

Recommended approach:

- Keep the calculator as the first-screen value.
- Put ads below the main calculation flow or in clearly separated desktop-side areas.
- Do not place ads next to primary input buttons, download/export actions, or navigation controls.
- Keep ad quantity lower than publisher-created utility content.
- Label ad areas clearly according to the ad network's current policy.
- Add more utility pages over time so the hub has clear navigation and substantial original value.

Reference links checked on 2026-07-19:

- Google AdSense ad placement policies: https://support.google.com/adsense/answer/1346295
- Google AdSense program policies: https://support.google.com/adsense/answer/48182
- Google Publisher policy on more ads than content: https://support.google.com/publisherpolicies/answer/11169917
- Google guidance on landing page quality for promoted pages: https://support.google.com/adsense/answer/1348727

## Integration Recommendation

For the future utility hub site:

```text
01. AI Pacer - AI usage pace calculator
```

Use AI Pacer as the first real tool because it already has a complete page, a concrete target user, static deployment readiness, and a clear privacy boundary.
