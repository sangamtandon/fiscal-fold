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
│   ├── manifest.json           # PWA manifest (name, icons, theme)
│   ├── sw.js                   # Service worker — offline cache + install prompt
│   └── favicon.svg             # Geometric origami triangle logo (also used as PWA icon)
├── src/
│   ├── main.js                 # App shell, route registration, FAB, toast
│   ├── router.js               # Hash-based client-side router
│   ├── style.css               # Design system (60+ tokens, components)
│   ├── data/
│   │   ├── models.js           # Data type definitions (JSDoc typedefs)
│   │   ├── store.js            # Reactive state manager (25+ methods)
│   │   └── seed.js             # Demo data generator + dev toolbar
│   ├── utils/
│   │   └── helpers.js          # Currency formatting, time, IDs, math
│   └── assets/
│       └── hero.png            # Onboarding hero image
└── docs/                       # (created as needed)
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
| `getUser()` | `User \| null` |
| `getCurrentCycle()` | `BudgetCycle \| null` |
| `getBuckets(macroType?)` | `MicroBucket[]` |
| `getBucketById(id)` | `MicroBucket \| undefined` |
| `getQuickBuckets()` | `MicroBucket[]` (pinned) |
| `getTransactions({ limit?, bucketId? })` | `Transaction[]` |
| `getCommitments()` | `Commitment[]` (active) |
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
| `addBucket({ macroType, name, emoji, allocated, isPinned? })` | Add micro-bucket |
| `updateBucket(id, updates)` | Partial bucket update |
| `removeBucket(id)` | Delete bucket |
| `addTransaction({ bucketId, amount, note?, type? })` | Log expense/refund |
| `addTradeOffTransaction({ bucketId, amount, borrowFromId, borrowAmount, note? })` | Trade-off transaction |
| `addCommitment({ name, emoji, amount, dueDate, macroType })` | Recurring expense |
| `updateCommitment(id, updates)` | Edit commitment |
| `removeCommitment(id)` | Delete commitment |
| `runSweep()` | End-of-cycle sweep to Future |
| `addIncome(amount, targetBucketId?)` | Bonus/variable income |
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
- **Balanced:** 50/30/20 (Needs/Wants/Future)
- **Aggressive Growth:** 40/20/40
- **Conservative:** 60/25/15

---

## Design Decisions

| Decision | Rationale |
|----------|-----------|
| **No framework** | Vanilla JS for speed, tiny bundle, no dependency churn. Fits PWA philosophy. |
| **Dark mode first** | Finance apps feel premium in dark. Light mode is a Sprint 10 option. |
| **Local-first** | Works offline immediately. BaaS is a bolt-on, not a requirement. |
| **Hash-based routing** | No server config needed. Works with any static host. |
| **Indian currency (INR)** | Primary audience is salaried Indian professionals. Lakhs/crores formatting. |
| **JSDoc over TypeScript** | IDE autocompletion without a build step. Lower complexity for vanilla JS. |
| **Never red for warnings** | Core UX philosophy — warm amber for course-correction, green for affirmation. |
| **Pub/sub store** | Simple reactive pattern. Easy to swap to external state manager or BaaS later. |
