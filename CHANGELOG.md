# Changelog

All notable changes to Fiscal Fold are documented here.  
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).  
Versioning follows sprint tags: `v0.{sprint}.0`. Post-MVP work lives under **[Unreleased]** until a new tagging scheme is decided.

---

## [Unreleased] — Post-MVP

### UX clarity pass (P0 → P2 from new-user friction audit)

#### Added
- **Income shortcut on the FAB transaction modal** (`src/pages/transaction-modal.js`) — a top-right "Income →" link opens the income drawer directly, so income logging is no longer buried in Settings.
- **Macro definitions in Step 3 of onboarding** (`src/pages/onboarding.{js,css}`) — a `data-testid="macro-defs"` card defines Needs / Wants / Future with concrete examples (rent, dining, savings) *before* the user is asked to allocate.
- **Carry-forward note in Step 3** (`src/pages/onboarding.js`) — "Unspent Wants & Future roll into next month's Future at payday" is surfaced during onboarding instead of being a surprise on the first payday.
- **Bucket metaphor + pin explanation in Step 4** (`src/pages/onboarding.js`) — the subtitle now defines "a bucket is a spending category with its own budget — like an envelope," and a tip explains what 📌 actually does.
- **"Last day of month" payday option** (`src/pages/onboarding.js`, `src/pages/settings.js`) — Step 2 and Settings now offer 29/30/31 plus a "Last day" sentinel (stored as `salaryDate: 99`). End-of-month earners are no longer forced to pick the wrong date.
- **Help section in Settings** (`src/pages/settings.{js,css}`) — `data-testid="settings-help"` defines Needs/Wants/Future, Buckets, Cycle, Quick Buckets, and Commitments. There's finally a place to re-read what the app means by these terms.
- **Visible Danger Zone** (`src/pages/settings.{js,css}`) — Reset is no longer a near-invisible tertiary link; it has a proper heading, intro, and red-outline button.
- **Delete-transaction affordance** (`src/pages/transactions.{js,css}`, `src/data/store.js`) — every row has a × button; `removeTransaction()` reverses the bucket impact symmetrically (expense, refund, income, trade-off).
- **Mark-paid bucket picker** (`src/pages/commitments.{js,css}`) — marking a commitment paid opens a drawer to choose the bucket and logs a real transaction, so the dashboard stops disagreeing with reality. A "Mark paid without logging" escape hatch is still available.

#### Changed
- **Landing page copy** (`src/main.js`) — "Smart envelope budgeting" replaced with "Know exactly what's safe to spend — without a spreadsheet." Primary CTA is now "Set up my budget" instead of "Get Started." The privacy footer says "No account, no cloud sync. Your data lives only on this device." — resolving the earlier contradiction with the "sync when online" offline-queue toast.
- **Safe to Spend hero** (`src/main.js`) — label is now "Wants budget — safe to spend" and the supporting `data-testid="safe-to-spend-hint"` line explicitly says Needs & Future are set aside. No more giant number with the scope hidden in tiny tertiary text.
- **Trade-off language** (`src/pages/transaction-modal.{js,css}`) — "Borrow / borrows" replaced with "Cover / covers." The alert now spells out "this moves money permanently — there's no payback." Donor rows show a per-row "Can cover ₹X" hint instead of an opaque "Partial" badge.
- **Empty buckets remain tappable** (`src/pages/transaction-modal.{js,css}`) — instead of being silently disabled, they route into the trade-off flow with a "No budget left this cycle" hint.
- **Leak warning** (`src/main.js`) — "running hot" / "Tap to re-balance" replaced with a concrete "[Bucket] — X% spent with N days left. Tap to log a spend here or adjust the budget."
- **Unallocated banners on the dashboard** (`src/main.js`) — clickable, route to Settings, and say "left to assign" / "tap Settings to add it to a bucket" instead of the jargon "unallocated."
- **Reserved-commitment hint** (`src/main.js`) — now reads "set aside for recurring bills" with a tooltip pointing to Settings → Commitments.
- **Payday CTA** (`src/pages/payday.js`) — "Sweep & Start New Cycle →" replaced with "Roll over savings & start next cycle →." The carry-forward block now explicitly states what happens to unspent Needs ("Needs resets every cycle regardless").
- **Preset chip labels** (`src/pages/onboarding.js`) — "Growth" / "Safe Play" → "Save More" / "More Essentials," each with a one-line hint. "Custom" chip now actually says "Custom ✏️" instead of just an icon.
- **Pool counter wording** (`src/pages/onboarding.js`, `src/pages/settings.js`) — "unallocated" replaced with "left to assign," "Fully allocated" replaced with "All assigned."
- **Step 1 onboarding subtitle** (`src/pages/onboarding.js`) — clarifies "you can change this later."
- **Step 2 onboarding subtitle** (`src/pages/onboarding.js`) — acknowledges variable income: "Use your fixed take-home salary. Variable income? Use your minimum expected — log bonuses later."
- **Offline-queue toast** (`src/pages/transaction-modal.js`) — "will sync when online" replaced with "will record when you're back online" to keep messaging consistent with the local-only privacy promise.
- **Onboarding donut colors** (`src/pages/onboarding.js`) — now read live CSS variables (`--needs`/`--wants`/`--future`) instead of hardcoded hex so they match the dashboard exactly.
- **PWA install banner timing** (`src/main.js`) — defers until *after* onboarding is complete AND at least one transaction has been logged. No more first-load nag.

#### Added (tests + docs)
- **Unit tests** for `removeTransaction()` covering expense, trade-off, refund, and income reversal (`tests/unit/store.mutators.spec.js`).
- **E2E specs** for every P0 / P1 fix:
  - `tests/e2e/landing-copy.spec.js`
  - `tests/e2e/onboarding-clarity.spec.js`
  - `tests/e2e/onboarding-salary-date.spec.js`
  - `tests/e2e/dashboard-clarity.spec.js`
  - `tests/e2e/transaction-cover-language.spec.js`
  - `tests/e2e/transaction-delete.spec.js`
  - `tests/e2e/commitments-mark-paid.spec.js`
  - `tests/e2e/settings-clarity.spec.js`

### Added
- **Light mode** (`src/utils/theme.js`, `src/style.css`, `src/pages/settings.{js,css}`) — persistent light/dark toggle in Settings. Theme is stored in `localStorage` under `theme` and applied via `data-theme="light"` on `<html>`.
- **Reset all data** (`src/pages/settings.js`) — two-step confirmation flow in Settings that clears state and returns to onboarding.
- **Salary recalculation prompt** (`src/pages/settings.js`) — when salary changes mid-cycle, offers to re-pro-rate the current cycle.
- **Manual bucket allocation in onboarding** (`src/pages/onboarding.js`) — step 4 now lets users edit per-bucket rupee allocations directly, with day-1 dashboard clarity (zero-state messaging when no transactions yet).
- **Editable allocations & ratios in onboarding** (`src/pages/onboarding.js`) — unallocated amount is surfaced live; macro ratios and per-bucket amounts can be revised before completion.

### Fixed
- 24 math / logic defects across cycle progress, sweep math, commitment reservation, and macro summary calculations (`fix(calculation-bugs)`).
- F1 / F2 / G1 UI lifecycle defects — event listener leaks and stale closures across page transitions (`fix(frontend-bugs)`).
- Onboarding slider selector — wrong query selector caused step-3 slider events to silently drop (`fix(onboarding)`).
- Settings — removed redundant `textContent` assignment before `_restoreProfileField` that flashed stale values.
- Dead `allBuckets` variable in dashboard render path; corrected bucket limit in `QUALITY_GATE.md`.

---

## [0.12.0] — 2026-05-14 — Sprint 12: Polish, Animations & Final QA

### Added
- **Health bar animations** (`src/main.js`, `src/style.css`) — bars render at `width: 0` with a `data-width` attribute; a `requestAnimationFrame` after dashboard mount sets the final width to trigger the CSS transition.
- **Sweep flight animation** (`src/pages/payday.{js,css}`) — `.pd-sweep-row--flying` rows stagger out at 80ms each, sweep total flashes green, then the new cycle is created.
- **Accessibility pass:**
  - Health bars: `role="progressbar"` + `aria-valuenow/min/max/label`.
  - Transaction modal: `role="dialog"` + `aria-modal="true"` + `aria-label`; overlay `aria-hidden`; close buttons `aria-label="Close"`.
  - `2px` accent-primary focus rings on `button:focus-visible`, `a:focus-visible`, `[role="button"]:focus-visible`.
- **44px minimum touch targets** (`src/style.css`, `src/pages/transaction-modal.css`) — WCAG 2.5.5; bumped `.btn-icon` from 40px → 44px; `.txn-quick-btn` and `.txn-bucket-row` get `min-height: 44px`.

### Changed
- `QUALITY_GATE.md` — Sprint 12 regression checklist added.

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

## [0.10.0] — 2026-05-14 — Sprint 10: Settings, Export & Edge Cases

### Added
- **Settings page** (`src/pages/settings.{js,css}`) — inline-edit name, salary, salary date (1–31 chip grid); per-macro bucket panels with pin/unpin, rename, emoji edit, remove, add (10-per-macro cap enforced by hiding the Add row).
- **Add Income drawer** (`src/pages/income-modal.{js,css}`) — 3-step flow: numeric keypad → target (overall budget or specific bucket) → confirm with editable note. Allocating to a bucket bumps `allocated`; allocating to overall budget bumps cycle salary. Income transactions render in history with a green `+₹` amount.
- **Transaction History** (`src/pages/transactions.{js,css}`) — `#/transactions` route, newest-first list grouped by date, real-time search across bucket name and note, macro filter tabs (All / Needs / Wants / Future), empty-state card.
- **Export** (`src/utils/export.js`) — CSV (current cycle's transactions) and full-state JSON download from Settings.

### Changed
- Dashboard "See all" on Recent Transactions navigates to `#/transactions`.

---

## [0.9.0] — 2026-05-13 — Sprint 9: Cycle End & Sweep (Payday Ritual)

### Added
- **Payday banner** (`src/main.js`) — appears at the top of the dashboard when the cycle end date is in the past; taps navigate to `#/payday`.
- **Payday page** (`src/pages/payday.{js,css}`) — last-cycle scorecard (total spent, % of budget used, carry-forward), macro progress bars, sweep preview listing all Wants+Future buckets with `remaining > 0`, and next-cycle preview with base allocations + sweep bonus badge on Future.
- **Sweep & Start New Cycle** — creates the new cycle (same duration as old, starting day after old end), copies bucket structure with proportional allocation, resets all active commitments to `isPaid: false`, and adds the sweep bonus to Future. "New cycle started! 🎉" toast on dashboard.
- **Store APIs:** `isCycleExpired()`, `copyBucketsToNewCycle()`, `updateCycleAllocations()`.

### Changed
- "Sweep & Start New Cycle" button is disabled on tap to prevent double-submission.

---

## [0.8.0] — 2026-05-13 — Sprint 8: Leak Warnings & Insights

### Added
- **Leak detection** (`src/main.js`) — flags any bucket that is ≥80% spent while cycle elapsed <50%; applies across all three macros, not just Wants.
- **Warning cards** — warm amber (never red) ⚡ cards rendered below the hero. Tapping a card opens the transaction modal pre-targeted to that bucket.
- **"All clear" affirmation** — fade-in card shown when no bucket is running hot.

---

## [0.7.0] — 2026-05-13 — Sprint 7: Commitments Layer

### Added
- **Commitments page** (`src/pages/commitments.{js,css}`) — `#/commitments` route accessible from Settings; add / edit / delete commitments with emoji, name, amount, due date, and macro category.
- **Reservation logic** (`src/data/store.js`) — `getMacroReserved(macroType)` returns the sum of unpaid active commitments. Safe to Spend deducts reservations.
- **Pause / resume** — paused commitments render at 55% opacity and are excluded from the reserved calculation.
- **Dashboard hints** — macro bars show a 🔒 reserved hint when unpaid active commitments exist; "Due Soon" card surfaces overdue / due-today / due-soon items.
- **Cycle reset** — new cycles reset all active commitments to `isPaid: false`.

### Fixed
- Several commitments-page bugs found during testing (event-listener leaks, stale form state).

---

## [0.6.0] — 2026-05-13 — Sprint 6: Trade-Off Mechanic

### Added
- **Insufficient-funds detection** (`src/pages/transaction-modal.js`) — when the selected bucket can't cover the amount, the trade-off drawer slides up showing all other buckets with available balance.
- **Single-source trade-off** — selecting a source bucket deducts the shortfall from it and logs a `addTradeOffTransaction()` with `borrowedFrom` + `borrowedAmount` references.
- **"From [bucket]" badge** — trade-off transactions render with a subtle source badge in the recent-transactions feed.

---

## [0.5.0] — 2026-05-13 — Sprint 5: 3-Tap FAB Logging

### Added
- **Floating Action Button** (`src/main.js`, `src/style.css`) — bottom-center FAB with a first-visit pulse animation; opens the transaction modal.
- **Transaction modal** (`src/pages/transaction-modal.{js,css}`) — 3-tap drawer:
  - Tap 1: numeric keypad with live ₹ formatting and Backspace/Clear.
  - Tap 2: bucket grid, Quick Buckets row at top, all buckets grouped by macro with remaining balance shown.
  - Tap 3: confirmation card (amount + bucket + remaining after) with an optional note field and a checkmark animation.
- Logging updates `spent`, Safe to Spend, and the recent transactions feed immediately; toast confirms the log.

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
