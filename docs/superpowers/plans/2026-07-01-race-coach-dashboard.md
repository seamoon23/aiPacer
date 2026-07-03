# Race Coach Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a rabbit/turtle race coach dashboard that compares Codex and Claude Code usage pace from manual localStorage snapshots.

**Architecture:** Keep existing manual-input and static Astro architecture. Add a pure provider-race helper for comparison logic, render it with a new React dashboard component, and simplify input copy without changing the persisted data model.

**Tech Stack:** Astro, React, TypeScript, Vitest, Testing Library, localStorage.

---

### Task 1: Provider Race Calculation

**Files:**
- Create: `src/lib/providerRace.ts`
- Create: `src/lib/providerRace.test.ts`

- [ ] Write failing tests for single-provider and two-provider race summaries.
- [ ] Run `npm test -- src/lib/providerRace.test.ts` and confirm RED.
- [ ] Implement latest snapshot grouping, today usage estimate, relative status, and encouragement copy.
- [ ] Run the same test and confirm GREEN.

### Task 2: Race Dashboard UI

**Files:**
- Create: `src/components/ProviderRaceDashboard.tsx`
- Modify: `src/components/AiPacerApp.tsx`
- Modify: `src/components/AiPacerApp.test.tsx`

- [ ] Write failing UI tests for “AI 레이스 코치”, “Codex vs Claude Code”, and encouragement copy.
- [ ] Run `npm test -- src/components/AiPacerApp.test.tsx` and confirm RED.
- [ ] Render the new dashboard when at least one snapshot exists.
- [ ] Run the same test and confirm GREEN.

### Task 3: Simplified Input and Hero Visuals

**Files:**
- Modify: `src/components/UsageInputForm.tsx`
- Modify: `src/components/HeroPaceDashboard.tsx`
- Modify: `src/components/AiPacerApp.test.tsx`

- [ ] Write failing UI tests for simplified input language and race-track hero labels.
- [ ] Run `npm test -- src/components/AiPacerApp.test.tsx` and confirm RED.
- [ ] Reduce input copy and add race-themed hero labels.
- [ ] Run the same test and confirm GREEN.

### Task 4: Visual Styling and Docs

**Files:**
- Modify: `src/styles/global.css`
- Modify: `docs/AI_PACER_DESIGN.md`
- Modify: `docs/NEXT_TASKS.md`

- [ ] Add CSS-only rabbit/turtle badges, race lanes, and comparison cards.
- [ ] Document the no-API, local-only race dashboard behavior.
- [ ] Run `npm test`, `npm run typecheck`, and `npm run build`.
