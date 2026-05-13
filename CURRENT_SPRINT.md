# Current Sprint Status

> This file is updated at the end of every sprint.  
> It serves as the **single source of truth** for AI context handoff between conversations.

---

## ✅ Last Completed: Sprint 4 — Dashboard Core Layout

- **Branch:** `sprint-4/dashboard` → merged to `main` as `v0.4.0`
- **Key files modified:**
  - `src/main.js` — Built out the `/dashboard` route logic and `renderMacroBar`
  - `src/style.css` — Added styles for animations, Quick Buckets horizontal scroll, and Macro Bar expand/collapse
- **Capabilities unlocked:**
  - Dashboard fully reflects store state.
  - Safe to spend count-up animation adds delight.
  - Users can drill down into Macro groups to see individual Micro-Buckets.

---

## 🔜 Next Up: Sprint 5 — Adding Transactions & FAB

- **Branch to create:** `sprint-5/transactions`
- **PRD section:** §5 (Transaction Logging) in `PRD.md`
- **Tasks:**
  - 5.1 — Floating Action Button (FAB component and logic to trigger transaction modal)
  - 5.2 — Transaction Modal UI (Amount keypad, Bucket selector, Note input)
  - 5.3 — Trade-Off Logic (If target bucket lacks funds, trigger 'Borrow from' UI constraint)
  - 5.4 — Store Integration (`addTransaction`, `addTradeOffTransaction` bindings)
- **Acceptance criteria:** Users can log a transaction. If they overspend a bucket, they MUST borrow from another bucket. Dashboard updates reactively immediately after logging.

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

Current sprint: Sprint 5 — Adding Transactions & FAB
Create branch sprint-5/transactions and build tasks 5.1 through 5.4.
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
└── v0.4.0  Sprint 4: Dashboard Core Layout (HEAD)
```
