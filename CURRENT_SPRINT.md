# Current Sprint Status

> This file is updated at the end of every sprint.  
> It serves as the **single source of truth** for AI context handoff between conversations.

---

## ✅ Last Completed: Sprint 3 — Onboarding Flow

- **Branch:** `sprint-3/onboarding` → merged to `main` as `v0.3.0`
- **Key files created:**
  - `src/pages/onboarding.js` — 4-step wizard logic
  - `src/pages/onboarding.css` — Onboarding styles, donut chart, animations
- **Key files modified:**
  - `src/main.js` — Integrated the wizard into the routing logic
- **Capabilities unlocked:**
  - Users can now configure their profile, anchor date, budget ratios, and micro-buckets.
  - Automatically initializes the store with real data upon completion.

---

## 🔜 Next Up: Sprint 4 — Dashboard Core Layout

- **Branch to create:** `sprint-4/dashboard`
- **PRD section:** §4 (Dashboard Core Layout) in `PRD.md`
- **Tasks:**
  - 4.1 — Safe to Spend Hero (Large dynamic number, text gradient, "Safe to Spend" label, cycle days remaining)
  - 4.2 — Macro Health Bars (Needs, Wants, Future bars. Show remaining balance, spent balance, and visual progress)
  - 4.3 — Quick Buckets Row (Horizontal scroll list of "pinned" micro-buckets for fast access)
  - 4.4 — Recent Transactions Feed (List of latest 5 transactions with emoji, amount, time, and note)
- **Acceptance criteria:** Dashboard accurately reflects the store state. Safe to Spend calculation is correct. Macro bars show accurate percentages. Quick buckets are interactive.

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

Current sprint: Sprint 4 — Dashboard Core Layout
Create branch sprint-4/dashboard and build tasks 4.1 through 4.4.
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
└── v0.3.0  Sprint 3: Onboarding Flow (HEAD)
```
