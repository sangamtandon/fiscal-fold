# Current Sprint Status

> This file is updated at the end of every sprint.  
> It serves as the **single source of truth** for AI context handoff between conversations.

---

## ✅ Last Completed: Sprint 8 — Leak Warnings & Insights

- **Branch:** `sprint-8/leak-warnings` → merged to `main` as `v0.8.0`
- **Key files modified:**
  - `src/main.js` — extended leak detection, tappable warning cards, all-clear animation
  - `src/style.css` — added `.insight-all-clear` fade-in animation class
  - `QUALITY_GATE.md` — Sprint 3–8 regression checklist added
- **Key behaviour:**
  - Leak detection now scans all 3 macro types (Needs + Wants + Future), not just Wants
  - Warning cards have `data-leak-bucket-id` and open `openTransactionModal(bucketId)` on tap
  - "All clear" card uses `insight-all-clear` class with `page-enter` fade-in animation
  - "All clear" only shows when NO bucket across all 3 macros is running hot
- **Acceptance:** ✅ Bucket ≥80% spent before 50% cycle → warning card tappable → opens modal. All buckets healthy → "All clear" with animation.

---

## 🔜 Next Up: Sprint 9 — Cycle End & Sweep

- **Branch to create:** `sprint-9/cycle-sweep`
- **PRD section:** §9 in `docs/IMPLEMENTATION_PLAN.md`
- **Tasks:**
  - 9.1 — Detect when a cycle ends (current date ≥ cycle.endDate)
  - 9.2 — Sweep unspent Wants + Future balances to Future allocation for next cycle
  - 9.3 — Show sweep summary screen before creating next cycle
- **Acceptance criteria:** When a cycle expires, user is prompted to sweep. Unspent balances roll forward into Future. New cycle starts with correct allocations.

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
└── v0.8.0  Sprint 8: Leak Warnings & Insights (HEAD)
```
