# Current Sprint Status

> This file is updated at the end of every sprint.  
> It serves as the **single source of truth** for AI context handoff between conversations.

---

## ✅ Last Completed: Sprint 9 — Cycle End & Sweep

- **Branch:** `sprint-9/payday-ritual` → merged to `main` as `v0.9.0`
- **Key files modified:**
  - `src/data/store.js` — added `isCycleExpired()`, updated `runSweep()` (Wants+Future), added `copyBucketsToNewCycle()`
  - `src/main.js` — dashboard payday banner (cycleExpired guard), `/payday` route
  - `src/pages/payday.js` — new page: scorecard, sweep preview, new cycle allocation preview, confirm action
  - `src/pages/payday.css` — new styles for payday page
  - `QUALITY_GATE.md` — Sprint 9 regression checklist added
- **Key behaviour:**
  - `isCycleExpired()` returns true when `new Date() > new Date(cycle.endDate)`
  - `runSweep()` now sweeps both Wants AND Future buckets (not just Wants)
  - `copyBucketsToNewCycle()` copies bucket structure with proportional re-allocation per macro
  - Dashboard shows green payday banner when cycle expires → navigates to `/payday`
  - Payday page shows last cycle scorecard, sweep preview, next cycle allocation preview
  - Confirm button creates new cycle (same duration), adds sweep amount to Future, copies buckets, resets commitments
- **Acceptance:** ✅ Expired cycle → payday banner → sweep & start → new cycle with correct allocations, bucket structure copied.

---

## 🔜 Next Up: Sprint 10

- **PRD section:** §10 in `docs/IMPLEMENTATION_PLAN.md`
- Check PRD for Sprint 10 tasks.

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

Current sprint: Sprint 8 — Leak Warnings & Insights
Create branch sprint-8/leak-warnings and build tasks 8.1 through 8.3.
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
├── v0.7.0  Sprint 7: Commitments Layer
├── v0.8.0  Sprint 8: Leak Warnings & Insights
└── v0.9.0  Sprint 9: Cycle End & Sweep (HEAD)
```
