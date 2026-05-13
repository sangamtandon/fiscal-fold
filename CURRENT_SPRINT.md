# Current Sprint Status

> This file is updated at the end of every sprint.  
> It serves as the **single source of truth** for AI context handoff between conversations.

---

## ✅ Last Completed: Sprint 7 — Commitments Layer

- **Branch:** `sprint-7/commitments` → merged to `main` as `v0.7.0`
- **Key files added/modified:**
  - `src/pages/commitments.js` — Commitments management page with list, add/edit/delete, mark-paid
  - `src/pages/commitments.css` — All styles for commitments page and dashboard due-soon widget
  - `src/data/store.js` — Added `getMacroReserved()`, updated `getSafeToSpend()`, reset commitments on new cycle
  - `src/main.js` — `/commitments` route, Settings row wiring, dashboard reserved hints + due-soon section
- **Key behaviour:**
  - `getMacroReserved(macroType)` sums unpaid active commitments; `getSafeToSpend()` subtracts wants reserved
  - Commitments page: emoji picker, name, amount, macro category (Needs/Wants/Future), due date chips + custom input
  - `_dueStatus()` computes paid / overdue / due-today / due-soon / upcoming per commitment
  - New cycle creation resets all active commitments to `isPaid: false`
  - Dashboard macro bars show 🔒 reserved hint when unpaid commitments exist for that macro type
  - Dashboard shows "Due Soon" card with overdue/due-today/due-soon commitments
  - Settings → Commitments row navigates to `/commitments`
- **Acceptance:** ✅ Add Rent + Netflix → Safe to Spend reflects true available balance. Mark paid removes reservation. New cycle resets paid status.

---

## 🔜 Next Up: Sprint 8 — Leak Warnings

- **Branch to create:** `sprint-8/leak-warnings`
- **PRD section:** §8 in `docs/IMPLEMENTATION_PLAN.md`
- **Tasks:**
  - 8.1 — Pace-based leak detection (bucket spending % vs. cycle time %)
  - 8.2 — Inline warning cards on dashboard with "re-balance" CTA
  - 8.3 — Budget health score / summary
- **Acceptance criteria:** A bucket that is 80%+ spent before 50% of cycle time triggers a warning card on the dashboard.

---

## 📋 Sprint Prompt Template

Copy this when starting a new sprint conversation:

```
I'm working on Fiscal Fold (c:\Users\ADMIN\workspace\fiscal-fold).

Read these files for context:
- PRD.md (product requirements)
- ARCHITECTURE.md (tech stack, file map, store API)
- CHANGELOG.md (what's been built so far)
- CURRENT_SPRINT.md (current status and next sprint details)
- QUALITY_GATE.md (pre-merge checklist)

Current sprint: Sprint 7 — Commitments Layer
Create branch sprint-7/commitments and build tasks 7.1 through 7.3.
Run the quality gate when done, then merge to main and update CURRENT_SPRINT.md.
```

---

## 🐛 Known Issues

_None currently._

---

## 📊 Git State

```
main
├── v0.1.0  Sprint 1: Project scaffold, design system & app shell
├── v0.2.0  Sprint 2: Data layer, state management & seed data
├── v0.3.0  Sprint 3: Onboarding Flow
├── v0.4.0  Sprint 4: Dashboard Core Layout
├── v0.5.0  Sprint 5: 3-Tap FAB Logging
├── v0.6.0  Sprint 6: Trade-Off Mechanic
└── v0.7.0  Sprint 7: Commitments Layer (HEAD)
```
