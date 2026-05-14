# Changelog

All notable changes to Fiscal Fold are documented here.  
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).  
Versioning follows sprint tags: `v0.{sprint}.0`.

---

## [0.11.0] — 2026-05-14 — Sprint 11: PWA — Offline Support & Install Prompt

### Added
- **Service Worker** (`public/sw.js`) — cache-first for same-origin assets, network-first navigation with app-shell fallback, stale-while-revalidate for external resources (Google Fonts). Caches the app shell on install; cleans old caches on activate.
- **Offline Indicator** (`src/main.js`, `src/style.css`) — amber "Offline" badge in the app header while `navigator.onLine` is false. Disappears + shows "Back online ✓" toast when connectivity is restored.
- **Install Prompt Banner** (`src/main.js`, `src/style.css`) — captures `beforeinstallprompt`, shows a dismissible bottom banner on the dashboard with logo, description, and "Add to Home Screen" CTA. Dismiss stores `pwa-install-dismissed` flag. `appinstalled` fires "Fiscal Fold installed! 🎉" toast.

### Changed
- `public/manifest.json` — replaced broken PNG icon references with the existing `favicon.svg`; added `categories: ["finance", "productivity"]`.
- `ARCHITECTURE.md` — PWA row updated to ✅; `sw.js` added to file map.

---

## [0.4.0] — 2026-05-13 — Sprint 4: Dashboard Core Layout

### Added
- **Safe to Spend Hero** (`src/main.js`) — Large dynamic display showing the core "Safe to Spend" metric with a custom counting-up animation on load.
- **Quick Buckets Row** (`src/main.js`, `src/style.css`) — A horizontal scrolling list of pinned buckets for quick access right under the hero.
- **Expandable Macro Bars** (`src/main.js`, `src/style.css`) — Clicking on a Needs, Wants, or Future macro bar now expands downwards via CSS grid to reveal the individual micro-buckets, their remaining amounts, and specific progress bars.
- **Enhanced Recent Transactions** (`src/main.js`) — Transactions now properly display optional notes.

### Changed
- Dashboard components now pull live data mapping to `getQuickBuckets()` and other local store accessors.
- Removed stub data from the Dashboard route.

---

## [0.3.0] — 2026-05-13 — Sprint 3: Onboarding Flow

### Added
- **Onboarding Wizard** (`src/pages/onboarding.js`) — 4-step "All Clear" setup flow
  - Step 1: Name input with live greeting preview
  - Step 2: Salary input with comma formatting and date chip selector
  - Step 3: Interactive SVG donut chart, preset chips (Balanced, Growth, Safe Play), and custom sliders
  - Step 4: Micro-bucket editor with templates, rename, pin, remove, and add functionality
- **Onboarding CSS** (`src/pages/onboarding.css`) — progress dots, donut chart styling, animated sliders
- **Pro-ration logic** — automatically calculates pro-rated salary if starting mid-cycle
- **Auto-setup** — automatically creates the User profile, the first BudgetCycle, and the chosen MicroBuckets upon completion

### Changed
- `src/main.js` — Replaced placeholder onboarding route with the real wizard component
- `src/main.js` — Added a landing page with "Get Started" and "Skip to Demo" options

---

## [0.2.0] — 2026-05-13 — Sprint 2: Data Layer & State Management

### Added
- **Data models** (`src/data/models.js`) — JSDoc typedefs for User, BudgetCycle, MicroBucket, Transaction, Commitment, Sweep, AppState
- **Preset ratios** — Balanced (50/30/20), Aggressive Growth (40/20/40), Conservative (60/25/15)
- **Bucket templates** — 14 starter micro-buckets with emojis across Needs/Wants/Future
- **Reactive state manager** (`src/data/store.js`) — pub/sub pattern with localStorage persistence
  - 25+ methods: getters, mutators, lifecycle (see ARCHITECTURE.md for full API)
  - `subscribe(key, callback)` for reactive updates
  - `getSafeToSpend()` — computed Wants remaining
  - `getMacroSummary(type)` — allocated/spent/remaining/percent
  - `addTradeOffTransaction()` — dual-bucket deduction
  - `runSweep()` — end-of-cycle sweep with breakdown
- **Seed data generator** (`src/data/seed.js`) — demo user "Arjun", ₹1,68,000 salary, 14 buckets, 25 transactions (including a trade-off), 4 commitments
- **Dev toolbar** — seed/reset/log state buttons (dev mode only)

### Changed
- `src/main.js` — rewired from hardcoded demo data to reactive store reads
- Dashboard now shows **computed** Safe to Spend, macro summaries, transaction feed, and leak warnings

---

## [0.1.0] — 2026-05-13 — Sprint 1: Project Scaffold & Design System

### Added
- **Vite 5 vanilla JS project** with ES Modules
- **PWA manifest** (`public/manifest.json`) — standalone, dark theme, icon references
- **Geometric origami favicon** (`public/favicon.svg`) — folded triangle motif
- **Full design system** (`src/style.css`)
  - 60+ CSS custom properties (colors, spacing, typography, radius, shadows)
  - Dark mode as default
  - Component classes: `.card`, `.btn`, `.health-bar`, `.fab`, `.drawer`, `.badge`, `.toast`
  - Page transition animations
  - Responsive breakpoints (375px → 768px → 1024px)
- **Hash-based router** (`src/router.js`) — route registration, navigation, cleanup lifecycle
- **Utility helpers** (`src/utils/helpers.js`) — Indian currency formatting, timeAgo, percent, daysRemaining, uid, debounce
- **App shell** (`src/main.js`) — sticky header, router mount, FAB, toast system
- **Placeholder pages** — onboarding landing, dashboard (with demo health bars, transactions, leak warnings), settings
- **`index.html`** — PWA-ready with meta tags, Google Fonts (Inter + JetBrains Mono), SEO
- **PRD v1.1** (`PRD.md`) — complete product requirements document
