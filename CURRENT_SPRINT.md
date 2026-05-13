# Current Sprint Status

> This file is updated at the end of every sprint.  
> It serves as the **single source of truth** for AI context handoff between conversations.

---

## ✅ Last Completed: Sprint 6 — Trade-Off Mechanic

- **Branch:** `sprint-6/trade-off` → merged to `main` as `v0.6.0`
- **Note:** All 3 tasks were implemented as part of Sprint 5 (the logging flow naturally contained the trade-off path).
- **Key behaviour:**
  - `_decideAfterBucket()` detects when amount > bucket remaining and routes to trade-off
  - `_renderTradeOff()` lists all donor buckets with available balances; single-source only (Phase 1)
  - `_renderTradeOffConfirm()` shows the split card: target covers X, donor borrows Y
  - `addTradeOffTransaction()` atomically deducts from both buckets and stores `borrowedFrom` reference
  - Trade-off transactions render with "from [bucket]" amber badge in the dashboard feed
- **Acceptance:** ✅ Logging ₹500 to a ₹200 bucket triggers trade-off drawer. Borrowing completes the transaction. Both balances correct.

---

## 🔜 Next Up: Sprint 7 — Commitments Layer

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

## 🔜 Next Up: Sprint 7 — Commitments Layer

- **Branch to create:** `sprint-7/commitments`
- **PRD section:** §7 in `docs/IMPLEMENTATION_PLAN.md`
- **Tasks:**
  - 7.1 — Commitments management UI (add/edit/delete/toggle from Settings)
  - 7.2 — Auto-deduction logic on cycle start; "reserved" vs "spent" distinction
  - 7.3 — Due-date tracking + visual indicator; mark-as-paid flow
- **Acceptance criteria:** User adds Rent (₹25,000) and Netflix (₹649) as commitments. New cycle auto-deducts these. Safe to Spend reflects the true available balance.

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
└── v0.6.0  Sprint 6: Trade-Off Mechanic (HEAD)
```
