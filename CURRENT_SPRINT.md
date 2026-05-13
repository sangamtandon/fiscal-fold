# Current Sprint Status

> This file is updated at the end of every sprint.  
> It serves as the **single source of truth** for AI context handoff between conversations.

---

## ✅ Last Completed: Sprint 5 — Adding Transactions & FAB

- **Branch:** `sprint-5/transactions` → merged to `main` as `v0.5.0`
- **Key files added/modified:**
  - `src/utils/toast.js` — Extracted `showToast` utility (decouples from main.js)
  - `src/router.js` — Added `rerender()` export (force re-render current route)
  - `src/pages/transaction-modal.js` — Full 4-step transaction modal
  - `src/pages/transaction-modal.css` — Modal styles
  - `src/main.js` — Wired FAB + quick-bucket chips to modal; imports from toast.js
- **Capabilities unlocked:**
  - Users can tap FAB (or any Quick Bucket chip) to log an expense
  - Amount entry via numeric keypad + quick-amount chips (₹50/100/200/500)
  - Bucket picker grouped by macro type (Needs / Wants / Future) with remaining balance shown
  - If bucket has insufficient funds → trade-off flow lets user borrow from another bucket
  - "Log anyway (go over budget)" escape hatch when no donor buckets exist
  - Dashboard updates reactively after every logged transaction

---

## 🔜 Next Up: Sprint 6 — Transaction History & Filtering

- **Branch to create:** `sprint-6/history`
- **Suggested tasks:**
  - 6.1 — Full transaction history page (`/history` route or bottom-sheet)
  - 6.2 — Filter by macro type / bucket
  - 6.3 — Refund / delete transaction action
  - 6.4 — Running total per bucket view
- **Acceptance criteria:** Users can review all past transactions, filter by category, and delete/refund mistakes.

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

Current sprint: Sprint 6 — Transaction History & Filtering
Create branch sprint-6/history and build the tasks listed in CURRENT_SPRINT.md.
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
└── v0.5.0  Sprint 5: Adding Transactions & FAB (HEAD)
```
