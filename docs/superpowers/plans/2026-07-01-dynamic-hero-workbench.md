# Dynamic Hero Workbench Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert AI Pacer from a permanently explanatory calculator page into a daily cockpit with dynamic hero coaching and collapsed secondary tools.

**Architecture:** Keep calculations and storage unchanged. Add small presentation helpers inside `AiPacerApp.tsx`, use native `details` wrappers for progressive disclosure, and update page-level FAQ markup in `src/pages/ai-pacer/index.astro`.

**Tech Stack:** Astro, React 19, TypeScript, Vitest, Testing Library, CSS.

---

### Task 1: Dynamic Hero Copy

**Files:**
- Modify: `src/components/AiPacerApp.tsx`
- Test: `src/components/AiPacerApp.test.tsx`

- [ ] **Step 1: Write failing tests**

Add tests that seed one low-remaining snapshot and assert the hero shows "새 대형 작업은 잠시 미루세요" instead of the static onboarding body.

- [ ] **Step 2: Run the component test**

Run: `npm test -- src/components/AiPacerApp.test.tsx`

Expected: FAIL because the hero title/body are still static.

- [ ] **Step 3: Implement hero coach helper**

Add helper logic that returns onboarding copy when there are no snapshots, recommendation-based copy when a recommendation exists, and latest-snapshot fallback copy when records exist without a recommendation.

- [ ] **Step 4: Re-run the component test**

Run: `npm test -- src/components/AiPacerApp.test.tsx`

Expected: PASS for the new hero tests.

### Task 2: Full-Width Workbench And Collapsed Input

**Files:**
- Modify: `src/components/AiPacerApp.tsx`
- Modify: `src/styles/global.css`
- Test: `src/components/AiPacerApp.test.tsx`

- [ ] **Step 1: Write failing tests**

Add tests that confirm the form is visible on first visit, collapsed after saved records exist, and open while editing a record.

- [ ] **Step 2: Run the component test**

Run: `npm test -- src/components/AiPacerApp.test.tsx`

Expected: FAIL because the input card is always visible and the layout still uses the old split grid.

- [ ] **Step 3: Implement details-based input panel**

Wrap input and weekly settings in a native `details` panel. Open it by default when there are no snapshots or when `editingSnapshotId` is set. Keep recommendation as a full-width primary card above it.

- [ ] **Step 4: Update CSS**

Add workbench, action panel, and summary styles. Avoid hiding content from screen readers outside native `details` behavior.

- [ ] **Step 5: Re-run the component test**

Run: `npm test -- src/components/AiPacerApp.test.tsx`

Expected: PASS.

### Task 3: Utility Panels

**Files:**
- Modify: `src/components/AiPacerApp.tsx`
- Modify: `src/styles/global.css`
- Test: `src/components/AiPacerApp.test.tsx`

- [ ] **Step 1: Write failing tests**

Add tests that tracking dashboard, recent records, and notification settings are inside collapsed utility panels with clear summary labels.

- [ ] **Step 2: Run the component test**

Run: `npm test -- src/components/AiPacerApp.test.tsx`

Expected: FAIL because those sections are still rendered as always-open cards.

- [ ] **Step 3: Implement utility panel wrappers**

Wrap each secondary component with a native `details` panel. Keep tracking and history default-closed after records exist, and keep history reachable even with zero records.

- [ ] **Step 4: Re-run the component test**

Run: `npm test -- src/components/AiPacerApp.test.tsx`

Expected: PASS.

### Task 4: Collapsed FAQ And Docs

**Files:**
- Modify: `src/pages/ai-pacer/index.astro`
- Modify: `docs/AI_PACER_DESIGN.md`
- Test: `src/components/AiPacerApp.test.tsx` for React behavior; use build/string inspection for Astro FAQ markup.

- [ ] **Step 1: Update FAQ markup**

Change FAQ content into a default-closed `<details>` block while preserving FAQ structured data.

- [ ] **Step 2: Update docs**

Document dynamic hero, full-width workbench, collapsed utility panels, and default-collapsed FAQ.

- [ ] **Step 3: Verify**

Run:

```powershell
npm test
npm run typecheck
npm run build
```

Expected: all pass; `dist/ai-pacer/index.html` contains collapsed FAQ markup.
