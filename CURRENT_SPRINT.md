# Current Sprint Status

> This file is updated at the end of every sprint.  
> It serves as the **single source of truth** for AI context handoff between conversations.

---

## ✅ Last Completed: Sprint 2 — Data Layer & State Management

- **Branch:** `sprint-2/data-layer` → merged to `main` as `v0.2.0`
- **Key files created:**
  - `src/data/models.js` — All data type definitions (JSDoc typedefs)
  - `src/data/store.js` — Reactive state manager (pub/sub, localStorage, 25+ methods)
  - `src/data/seed.js` — Demo data generator + dev toolbar
- **Key files modified:**
  - `src/main.js` — Rewired from hardcoded data to reactive store reads
- **Store methods available for next sprint:**
  - `setUser()`, `completeOnboarding()`, `createCycle()`, `addBucket()`
  - `addTransaction()`, `addTradeOffTransaction()`
  - `getSafeToSpend()`, `getMacroSummary()`, `getBuckets()`
  - `subscribe(key, callback)` for reactive UI updates

---

## 🔜 Next Up: Sprint 3 — Onboarding Flow

- **Branch to create:** `sprint-3/onboarding`
- **PRD section:** §3 (Onboarding Flow) in `PRD.md`
- **Tasks:**
  - 3.1 — Step 1: Identity (name input, greeting preview)
  - 3.2 — Step 2: The Anchor (salary input, date picker)
  - 3.3 — Step 3: The Golden Rule (ratio selector, live chart)
  - 3.4 — Step 4: Emotional Anchors (micro-bucket setup)
  - 3.5 — Onboarding Completion (pro-rate, create cycle, transition)
- **Dependencies from Sprint 2:**
  - `setUser(data)` — store user name, salary, date, ratios
  - `createCycle({ startDate, endDate, salary, allocations })` — first budget cycle
  - `addBucket({ macroType, name, emoji, allocated, isPinned })` — micro-buckets
  - `completeOnboarding()` — set flag
  - `PRESETS`, `BUCKET_TEMPLATES`, `EMOJI_PALETTE` from `models.js`
- **Acceptance criteria:** New user completes onboarding in <2 minutes, lands on dashboard with fully configured cycle. Refresh preserves state.

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

Current sprint: Sprint 3 — Onboarding Flow
Create branch sprint-3/onboarding and build tasks 3.1 through 3.5.
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
└── v0.2.0  Sprint 2: Data layer, state management & seed data (HEAD)
```
