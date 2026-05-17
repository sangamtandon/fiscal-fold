# Current Sprint Status

> This file is updated at the end of every sprint.  
> It serves as the **single source of truth** for AI context handoff between conversations.

---

## ✅ Last Completed: Sprint 12 — Polish, Animations & Final QA (merged)

- **Branch:** `sprint-12/polish` → merged into `main` (commit `48bde76`).
- **Key files modified:**
  - `src/main.js` — health bars now render with `width:0` + `data-width` attribute; `requestAnimationFrame` after dashboard innerHTML sets final widths to trigger CSS transition; `role="progressbar"` + `aria-valuenow/min/max/label` added to all three macro health bars
  - `src/pages/payday.js` — "Sweep & Start New Cycle →" click handler now staggers `.pd-sweep-row--flying` animations at 80ms per row, flashes the sweep total, then delays `_startNewCycle` until animation completes; falls back immediately if no sweep rows
  - `src/pages/payday.css` — `@keyframes sweep-fly` (translateX + fade) and `@keyframes sweep-flash` (green background pulse) + trigger classes
  - `src/pages/transaction-modal.js` — drawer element gets `role="dialog"` + `aria-modal="true"` + `aria-label="Log transaction"`; overlay gets `aria-hidden="true"`; all `✕` close buttons get `aria-label="Close"`
  - `src/pages/transaction-modal.css` — `.txn-quick-btn` and `.txn-bucket-row` get `min-height: 44px`
  - `src/style.css` — `.btn` gets `min-height: 44px`; `.btn-icon` bumped 40px → 44px; `button:focus-visible` / `a:focus-visible` / `[role="button"]:focus-visible` get 2px accent-primary outline
  - `QUALITY_GATE.md` — Sprint 12 regression checklist added
- **Key behaviour:**
  - **Animations:** Health bars animate from 0% on every dashboard load. Sweep rows fly right + fade on payday confirm. Confirmation checkmark already had CSS (confirmed). Page transitions and FAB pulse already existed.
  - **Touch targets:** All interactive elements now meet the 44px minimum height (WCAG 2.5.5)
  - **Accessibility:** Focus rings for keyboard users; progressbar roles on health bars; dialog role on transaction modal
- **Skipped tasks:**
  - 12.4 Sound Design — optional per plan, skipped
  - 12.5 Final smoke test — rubber duck review confirms no regressions; browser test required by user

---

## 🔜 Next Up: Closed Beta Deployment

All 12 sprints complete and merged to `main`. Post-MVP polish is now landing as standalone PRs (see below).

---

## 🧰 Post-MVP — Merged Since v0.12.0

In chronological merge order on `main` (newest at top):

- **#9 — Onboarding gaps:** surface unallocated amount; ratios and per-bucket allocations are editable before completion.
- **#7 — Manual bucket allocation:** users can set rupee amounts per bucket directly in onboarding step 4; dashboard day-1 zero-state messaging when no transactions yet.
- **#6 — Settings: reset all data:** two-step confirmation in Settings; salary recalculation prompt on mid-cycle changes.
- **#5 — Light mode:** persistent light/dark toggle in Settings (`src/utils/theme.js`).
- **#4 — Frontend bug fixes:** F1 / F2 / G1 UI lifecycle defects; onboarding slider selector.
- **#3 — Calculation bug fixes:** 24 math / logic defects from audit (cycle progress, sweep math, commitment reservation, macro summaries).

See `CHANGELOG.md` for full details.

---

## 📋 Sprint Prompt Template

Copy this when starting a new feature conversation:

```
I'm working on Fiscal Fold.

Read these files for context:
- AGENTS.md (project-wide conventions and agent workflow)
- docs/ARCHITECTURE.md (tech stack, file map, store API)
- CHANGELOG.md (what's been built so far)
- docs/QUALITY_GATE.md (pre-merge checklist)

Task: <describe the feature or fix>
Create a feature branch off main, implement the task, run the quality gate,
then open a PR.
```

---

## 🐛 Known Issues

_None currently._

---

## 📊 Release Index

The full ordered release history (v0.1.0 → v0.12.0 plus post-MVP work) lives in `CHANGELOG.md`. No git tags are published — `CHANGELOG.md` is the source of truth for what shipped when.
