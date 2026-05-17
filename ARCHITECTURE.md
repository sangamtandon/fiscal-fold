# Fiscal Fold — Architecture

> A zero-guilt personal finance PWA using envelope budgeting and the 50/30/20 rule.

---

## Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| **Build** | Vite 5 | Vanilla JS, ES Modules, no framework |
| **Styling** | Vanilla CSS | Custom properties (design tokens), dark-first |
| **Routing** | Custom hash router | `src/router.js` — lightweight, cleanup lifecycle |
| **State** | Reactive pub/sub store | `src/data/store.js` — localStorage persistence |
| **PWA** | Service worker | Sprint 11 — offline support & install prompt ✅ |
| **Typography** | Inter + JetBrains Mono | Google Fonts, swap strategy |

---

## File Map

```
fiscal-fold/
├── index.html                  # PWA entry point, meta tags, font imports
├── package.json                # Vite dev/build scripts
├── public/
│   ├── manifest.json           # PWA manifest (name, icon, theme)
│   ├── sw.js                   # Service worker — offline cache + install prompt
│   ├── favicon.svg             # Geometric origami triangle logo (also used as PWA icon)
│   └── icons.svg               # Inline SVG icon sprite
├── src/
│   ├── main.js                 # App shell, route registration, dashboard, FAB, toast, install banner
│   ├── router.js               # Hash-based client-side router
│   ├── style.css               # Design system (60+ tokens, components, light + dark)
│   ├── pages/                  # Per-route modules with scoped CSS
│   │   ├── onboarding.{js,css}        # 4-step wizard
│   │   ├── transactions.{js,css}      # Full transaction history + filters
│   │   ├── transaction-modal.{js,css} # 3-tap logging drawer + trade-off flow
│   │   ├── commitments.{js,css}       # Recurring expenses management
│   │   ├── income-modal.{js,css}      # Bonus/variable income drawer
│   │   ├── payday.{js,css}            # End-of-cycle sweep + new-cycle preview
│   │   └── settings.{js,css}          # Profile / buckets / commitments / export / reset
│   ├── data/
│   │   ├── models.js           # Data type definitions (JSDoc typedefs)
│   │   ├── store.js            # Reactive state manager (30+ methods)
│   │   └── seed.js             # Demo data generator + dev toolbar
│   ├── utils/
│   │   ├── helpers.js          # Currency formatting, time, IDs, math
│   │   ├── theme.js            # Light/dark theme toggle (persisted)
│   │   ├── toast.js            # Toast notification system
│   │   ├── offlineQueue.js     # Queue mutations while offline
│   │   └── export.js           # CSV / JSON export
│   └── assets/
│       └── hero.png            # Onboarding hero image
├── docs/
│   ├── IMPLEMENTATION_PLAN.md  # Original sprint plan (historical)
│   └── UX_GLOSSARY.md          # User-facing terminology + exact in-app copy
└── tests/
    ├── e2e/                    # Playwright specs — onboarding, dashboard, trade-off, mark-paid, etc.
    ├── unit/                   # Vitest unit specs — store, helpers, precision
    ├── integration/            # Vitest integration specs — lifecycle flows
    └── helpers/                # Shared builders / fresh-store factory
```

---

## Design System

The design system lives in `src/style.css` and uses CSS custom properties for all tokens.

### Color Palette
- **Accent:** Greens (safety) — `--accent-primary`, `--accent-secondary`
- **Warning:** Warm ambers — `--warn` (never red for failure states)
- **Surfaces:** Deep slate/charcoal — `--bg-base`, `--bg-card`, `--bg-elevated`
- **Text:** Layered opacity — `--text-primary`, `--text-secondary`, `--text-tertiary`

### Reusable Component Classes
| Class | Purpose |
|-------|---------|
| `.card` | Elevated surface with border and radius |
| `.card--accent` | Card with green accent border |
| `.btn`, `.btn-primary`, `.btn-ghost` | Button variants |
| `.health-bar`, `.health-bar__fill` | Progress bar for budgets |
| `.fab` | Floating action button |
| `.drawer` | Bottom sheet / slide-up panel |
| `.badge`, `.badge--amber` | Status badges |
| `.toast` | Notification toast |

### Responsive Breakpoints
- Mobile first: `375px` (iPhone SE)
- Tablet: `768px`
- Desktop: `1024px+`

---

## State Management

All state flows through `src/data/store.js`. No component accesses `localStorage` directly.

### Key Concepts
- **Pub/Sub:** `subscribe(key, callback)` returns an unsubscribe function
- **Persistence:** Every mutation auto-saves to `localStorage`
- **Reactivity:** `notify(key)` fires after every write

### Store API Summary

**Getters:**
| Method | Returns |
|--------|---------|
| `subscribe(key, callback)` | `() => void` (unsubscribe) |
| `getState()` | `AppState` (entire state snapshot) |
| `getUser()` | `User \| null` |
| `isOnboardingComplete()` | `boolean` |
| `getCurrentCycle()` | `BudgetCycle \| null` |
| `isCycleExpired()` | `boolean` (drives payday banner) |
| `getBuckets(macroType?)` | `MicroBucket[]` |
| `getBucketById(id)` | `MicroBucket \| undefined` |
| `getQuickBuckets()` | `MicroBucket[]` (pinned) |
| `getTransactions({ limit?, bucketId? })` | `Transaction[]` (current cycle) |
| `getAllTransactions()` | `Transaction[]` (all cycles, newest first) |
| `getCommitments()` | `Commitment[]` (active) |
| `getMacroReserved(macroType)` | `number` (unpaid active commitments) |
| `getSafeToSpend()` | `number` (₹ remaining in Wants) |
| `getMacroSummary(macroType)` | `{ allocated, spent, remaining, percent }` |
| `getCommitmentsTotal(macroType)` | `number` |
| `getSweeps(cycleId?)` | `Sweep[]` |

**Mutators:**
| Method | Effect |
|--------|--------|
| `setUser(data)` | Create or update user profile |
| `completeOnboarding()` | Set onboarding flag |
| `createCycle({ startDate, endDate, salary, allocations })` | New budget cycle |
| `updateCycleAllocations(allocations)` | Adjust macro splits on the current cycle |
| `copyBucketsToNewCycle(oldCycleId, newCycleId, newAllocations)` | Carry bucket structure into the next cycle |
| `addBucket({ macroType, name, emoji, allocated, isPinned? })` | Add micro-bucket |
| `updateBucket(id, updates)` | Partial bucket update |
| `removeBucket(id)` | Delete bucket |
| `addTransaction({ bucketId, amount, note?, type? })` | Log expense/refund/income |
| `addTradeOffTransaction({ bucketId, amount, borrowFromId, borrowAmount, note? })` | Trade-off transaction (UI calls this "Cover from another bucket" — never "borrow," since funds are not paid back) |
| `removeTransaction(id)` | Reverse a transaction and restore its impact on the affected bucket(s). Handles expense, refund, income, and trade-off symmetrically. |
| `addCommitment({ name, emoji, amount, dueDate, macroType })` | Recurring expense |
| `updateCommitment(id, updates)` | Edit commitment |
| `removeCommitment(id)` | Delete commitment |
| `runSweep()` | End-of-cycle sweep to Future |
| `addIncome(amount, targetBucketId?, note?)` | Bonus/variable income |
| `resetState()` | Wipe all data |
| `replaceState(newState)` | Bulk replace (for seeding) |

---

## Data Models

All types are defined as JSDoc typedefs in `src/data/models.js`:

| Model | Key Fields |
|-------|-----------|
| `User` | `name`, `salary`, `salaryDate`, `preset`, `ratios` |
| `BudgetCycle` | `startDate`, `endDate`, `salary`, `allocations`, `isActive` |
| `MicroBucket` | `name`, `emoji`, `macroType`, `allocated`, `spent`, `isPinned` |
| `Transaction` | `amount`, `bucketId`, `type`, `borrowedFrom`, `borrowedAmount` |
| `Commitment` | `name`, `amount`, `dueDate`, `macroType`, `isActive`, `isPaid` |
| `Sweep` | `amount`, `sweptTo`, `breakdown[]` |
| `AppState` | Root state shape combining all models |

### Presets

The preset identifiers in `models.js` are `balanced`, `aggressive`, `conservative`. UI labels are deliberately different — they describe the *outcome*, not the financial-jargon name:

| Internal key | UI label | Ratios (needs/wants/future) | UI hint |
|---|---|---|---|
| `balanced` | **Balanced** | 50/30/20 | Even split — a safe starting point |
| `aggressive` | **Save More** | 40/20/40 | Less Wants, bigger savings |
| `conservative` | **More Essentials** | 60/25/15 | More room for must-pays |
| `custom` | **Custom ✏️** | user-defined | Set each slice yourself |

### Salary date sentinel

`salaryDate` is an integer 1-31 or the sentinel `99` meaning "last day of month." Cycle math resolves 99 (or any out-of-range day) to `new Date(year, month + 1, 0).getDate()`.

### Glossary

For all user-facing terminology (Needs/Wants/Future, Bucket, Quick Bucket, Cycle, Commitment, Trade-off/Cover, Safe to Spend, etc.), see [`docs/UX_GLOSSARY.md`](docs/UX_GLOSSARY.md).

---

## Routes

All routes are hash-based and registered in `src/main.js` via `router.js`.

| Hash | Page module | Purpose |
|------|-------------|---------|
| `#/onboarding` | `src/main.js` | Landing — "Get Started" / "Skip to Demo" |
| `#/onboarding/wizard` | `src/pages/onboarding.js` | 4-step setup wizard |
| `#/dashboard` | `src/main.js` | Safe to Spend hero, macro bars, quick buckets, leak warnings |
| `#/transactions` | `src/pages/transactions.js` | Full history with search and macro filter |
| `#/commitments` | `src/pages/commitments.js` | Recurring expenses CRUD |
| `#/payday` | `src/pages/payday.js` | Cycle-end scorecard + sweep preview |
| `#/settings` | `src/pages/settings.js` | Profile, buckets, commitments, theme, export, reset |

---

## Design Decisions

| Decision | Rationale |
|----------|-----------|
| **No framework** | Vanilla JS for speed, tiny bundle, no dependency churn. Fits PWA philosophy. |
| **Dark mode first** | Finance apps feel premium in dark. Light mode shipped post-MVP via `src/utils/theme.js` with a persistent toggle in Settings. |
| **Local-first** | Works offline immediately. BaaS is a bolt-on, not a requirement. |
| **Hash-based routing** | No server config needed. Works with any static host. |
| **Indian currency (INR)** | Primary audience is salaried Indian professionals. Lakhs/crores formatting. |
| **JSDoc over TypeScript** | IDE autocompletion without a build step. Lower complexity for vanilla JS. |
| **Never red for warnings** | Core UX philosophy — warm amber for course-correction, green for affirmation. |
| **Pub/sub store** | Simple reactive pattern. Easy to swap to external state manager or BaaS later. |
| **Per-page CSS, prefix-scoped (not CSS Modules)** | Each `src/pages/*.js` imports its sibling `*.css`. Vite injects every page's CSS as a global `<style>` tag on first import and never unloads it — so all selectors must be prefixed with the page slug (`.onboarding__…`, `.txn-…`, `.cm-…`, `.pd-…`, `.settings-…`) to avoid cross-page collisions. New page modules MUST use a unique prefix; reviewers should reject unprefixed classes. Migrating to `*.module.css` is the eventual escape hatch but isn't justified at current size. |
