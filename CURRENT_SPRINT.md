# Current Sprint Status

> This file is updated at the end of every sprint.  
> It serves as the **single source of truth** for AI context handoff between conversations.

---

## ✅ Last Completed: Sprint 10 — Settings, Export & Edge Cases

- **Branch:** `sprint-10/settings-export` → ready to merge to `main` as `v0.10.0`
- **Key files added:**
  - `src/pages/settings.js` + `settings.css` — full interactive settings page
  - `src/pages/transactions.js` + `transactions.css` — transaction history with search + macro filter
  - `src/pages/income-modal.js` + `income-modal.css` — 3-step Add Income bottom drawer
  - `src/utils/export.js` — CSV (transactions) and JSON (full state) download utilities
- **Key files modified:**
  - `src/data/store.js` — `addIncome()` now records income transaction + accepts note; added `getAllTransactions()`
  - `src/main.js` — `/settings` route delegates to `renderSettingsPage`; `/transactions` route added; "See all" wired to `/transactions`; dead inline settings code removed
  - `QUALITY_GATE.md` — Sprint 10 regression checklist added
- **Key behaviour:**
  - Settings: inline-edit name/salary/salary date; pin, rename, remove, add buckets (max 3 per macro); nav rows to income modal, commitments, transaction history; CSV + JSON export
  - Income modal: keypad → bucket picker (or overall budget) → confirm + note; records income transaction on bucket, or boosts cycle salary
  - Transaction History: all current-cycle transactions, date-grouped, search by name/note, filter by macro
  - Export CSV triggers download of current-cycle transactions; Export JSON downloads full app state
- **Acceptance:** ✅ Settings fully interactive; income recorded and visible in history; CSV/JSON download; transaction history searchable/filterable.

---

## 🔜 Next Up: Sprint 11

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
├── v0.9.0  Sprint 9: Cycle End & Sweep
└── v0.10.0  Sprint 10: Settings, Export & Edge Cases (branch ready, pending merge)
```
