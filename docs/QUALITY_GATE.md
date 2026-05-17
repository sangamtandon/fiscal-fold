# Quality Gate — Pre-Merge Checklist

Run this checklist **before every merge to `main`**.
Check off each item. If any item fails, fix it before merging.

---

## 🏗️ Build

- [ ] `npm run build` completes without errors
- [ ] `npm run dev` starts without errors
- [ ] No console errors in browser dev tools (open DevTools → Console tab)
- [ ] No unresolved import errors or 404s in the Network tab

---

## 👁️ Visual QA — Core Screens

### Onboarding (`/#/onboarding`)
- [ ] Tagline is "Know exactly what's safe to spend — without a spreadsheet." (no "envelope budgeting" jargon)
- [ ] Privacy line says "No account, no cloud sync." — no contradiction with sync language elsewhere
- [ ] Primary CTA: "Set up my budget" / Secondary: "Try a sample dashboard first →"
- [ ] Header and FAB are hidden during onboarding
- [ ] **Step 2:** Salary date chips include 1, 5, 7, 10, 15, 20, 25, 28, 30, 31, and a "Last day" chip
- [ ] **Step 3:** Macro definitions card visible above the preset chips with concrete examples
- [ ] **Step 3:** Carry-forward note visible: "Unspent Wants & Future roll into next month's Future at payday."
- [ ] **Step 3:** Preset chip labels are "Balanced / Save More / More Essentials / Custom ✏️" with one-line hints
- [ ] **Step 4:** Subtitle defines a bucket as an envelope
- [ ] **Step 4:** Pin-explanation tip visible
- [ ] **Step 4:** Pool counter wording: "All assigned" / "₹X left to assign" / "₹X over budget" (no "unallocated")

### Dashboard (`/#/dashboard`)
- [ ] Safe to Spend card label reads "Wants budget — safe to spend"
- [ ] Supporting hint mentions Needs & Future being set aside
- [ ] "X day(s) left" pluralizes correctly
- [ ] All three macro health bars (Needs, Wants, Future) render with correct percentages
- [ ] Recent transactions list shows entries with emojis and amounts
- [ ] Trade-off transactions show "covered by [bucket]" badge (not "from [bucket]")
- [ ] Leak warning shows concrete percent + days text (no "running hot" slang) and the action label says "log a spend"
- [ ] Unallocated banners are clickable and route to Settings; copy uses "left to assign"
- [ ] Reserved-commitment hint says "set aside for recurring bills"
- [ ] Quick Buckets row, if present, has the "tap to log a spend" tagline

### Transaction modal (FAB)
- [ ] Top-right "Income →" link is visible and opens the income drawer
- [ ] Empty buckets are tappable (not disabled) and route to trade-off
- [ ] Trade-off alert uses "Cover," never "Borrow"
- [ ] Trade-off alert includes "no payback / moves money permanently"
- [ ] Donor rows show "Can cover ₹X" hint (no opaque "Partial" badge)
- [ ] Confirm screen uses "Confirm Split" with a "no payback" footnote

### Transaction History (`/#/transactions`)
- [ ] Every row shows a × delete button (hover on desktop, visible on touch)
- [ ] Deleting reverses the bucket spent / allocated change correctly

### Commitments (`/#/commitments`)
- [ ] Subtitle explains the set-aside mechanism + mark-paid behaviour
- [ ] Tapping the ✓ Mark paid button opens the bucket picker drawer
- [ ] Picking a bucket logs a `Commitment: <name>` transaction
- [ ] "Mark paid without logging" escape hatch works

### Payday (`/#/payday`)
- [ ] CTA reads "Roll over savings & start next cycle →" (no "Sweep" jargon)
- [ ] Carry-forward block explicitly mentions Needs reset behaviour

### Settings (`/#/settings`)
- [ ] User profile info renders (name, salary, salary date — supports "Last day")
- [ ] Salary date editor offers 30, 31, and "Last day" chips
- [ ] Backup section says "Download full backup (JSON file)" not "Export All Data (JSON)"
- [ ] **Help** card defines Needs/Wants/Future, Buckets, Cycle, Quick Buckets, Commitments
- [ ] **Danger Zone** is a visible card with red heading and red-outline reset button
- [ ] "Back to Dashboard" button works

---

## 📱 Responsive Check

- [ ] **Mobile (375px):** No horizontal scroll, all text readable, FAB accessible
- [ ] **Tablet (768px):** Layout adapts, no awkward gaps
- [ ] **Desktop (1280px):** Content centered, reasonable max-width

---

## 💾 Data Integrity

- [ ] Refresh the page — all data persists (localStorage)
- [ ] Clear localStorage → app redirects to onboarding
- [ ] Seed demo data → dashboard shows correct computed values
- [ ] Dev toolbar appears (if in dev mode) and all buttons work:
  - [ ] "Seed Data" populates realistic demo
  - [ ] "Reset" clears all data
  - [ ] "Log State" prints current state to console

---

## 🔙 Regression — Previous Sprints

> Add new items as sprints are completed. Every previous sprint's features must still work.

### Sprint 1 — Scaffold & Design System
- [ ] App shell loads (header, router mount, FAB, toast)
- [ ] Routing works: `/#/onboarding`, `/#/dashboard`, `/#/settings`
- [ ] Fonts load correctly (Inter, JetBrains Mono)
- [ ] Dark theme colors render (no white backgrounds, no default browser styles)
- [ ] FAB has pulse animation on first visit

### Sprint 2 — Data Layer & State Management
- [ ] Store reads/writes work (test via dev toolbar)
- [ ] Seeded data renders correctly on dashboard
- [ ] Safe to Spend = sum of remaining in Wants buckets
- [ ] Macro summaries (allocated, spent, remaining, percent) are mathematically correct

### Sprint 3 — Onboarding Flow
- [ ] 4-step wizard completes without errors
- [ ] First budget cycle is created with correct allocations
- [ ] "Back" navigation between wizard steps works
- [ ] Pro-rate logic works for mid-cycle starts (salary date already passed)

### Sprint 4 — Dashboard Core Layout
- [ ] Macro bars (Needs / Wants / Future) expand to show micro-buckets
- [ ] Count-up animation plays on Safe to Spend hero on load
- [ ] Depleted bar shows amber/warn color when ≤20% remaining (Wants)

### Sprint 5 — 3-Tap FAB Logging
- [ ] FAB opens transaction modal
- [ ] Bucket list shows all macro sections
- [ ] Amount input accepts decimal values
- [ ] Logging a transaction updates bucket spent amount and Safe to Spend
- [ ] Toast confirms successful log

### Sprint 6 — Trade-Off Mechanic
- [ ] When a bucket is over-allocated, trade-off drawer opens
- [ ] Selecting a source bucket deducts from it and logs a trade-off transaction
- [ ] Trade-off transactions show "from [bucket]" badge in recent transactions

### Sprint 7 — Commitments Layer
- [ ] Settings → Commitments row navigates to `/commitments`
- [ ] Add new commitment: emoji, name, amount, category, due date all save correctly
- [ ] Edit existing commitment updates fields correctly
- [ ] Mark commitment paid: Safe to Spend increases (reservation released)
- [ ] Toggle pause/resume: paused commitments show at 55% opacity, excluded from reserved calculation
- [ ] Delete commitment: removes from list, updates reserved amount
- [ ] Dashboard macro bars show 🔒 reserved hint when unpaid active commitments exist
- [ ] Dashboard "Due Soon" card shows overdue/due-today/due-soon commitments
- [ ] New cycle resets all active commitments to `isPaid: false`

### Sprint 8 — Leak Warnings
- [ ] A bucket that is ≥80% spent while cycle is <50% elapsed triggers a ⚡ warning card
- [ ] Warning cards appear for buckets in ANY macro (Needs, Wants, Future — not just Wants)
- [ ] Tapping a warning card opens the transaction modal pre-targeted to that bucket
- [ ] "All clear" card shows when NO bucket across all 3 macros is running hot
- [ ] "All clear" card has a fade-in animation on page load

### Sprint 9 — Cycle End & Sweep
- [ ] When cycle end date is in the past, payday banner appears at the top of the dashboard
- [ ] Tapping the payday banner navigates to `/#/payday`
- [ ] Payday page shows last month scorecard (total spent, % budget used, carry-forward amount)
- [ ] Payday page shows macro progress bars (Needs / Wants / Future) with spend amounts
- [ ] Sweep preview lists all Wants+Future buckets with remaining balance > 0
- [ ] Sweep preview shows correct total carry-forward amount
- [ ] If all budgets spent, sweep section shows "nothing to carry forward" message
- [ ] Next month's budget preview shows correct base allocations (salary × ratios)
- [ ] Future allocation in preview includes sweep bonus (+swept amount badge)
- [ ] "Sweep & Start New Cycle →" button creates a new cycle and navigates to dashboard
- [ ] New cycle has correct date range (same duration as old cycle, starting day after old end)
- [ ] New cycle Future allocation = base + sweep amount
- [ ] All bucket structure from old cycle is copied to new cycle with proportional allocation
- [ ] All active commitments reset to `isPaid: false` in new cycle
- [ ] Success toast "New cycle started! 🎉" appears on dashboard
- [ ] Button is disabled on tap to prevent double-submission
- [ ] Back button on payday page navigates to dashboard

### Sprint 10 — Settings, Export & Edge Cases
- [ ] Settings page renders profile info (name, salary, salary date)
- [ ] Edit name: inline input appears, Save updates the name, Cancel restores original
- [ ] Edit salary: inline number input appears, Save updates salary, Cancel restores
- [ ] Edit salary date: chip grid (1–31) appears, selecting saves correctly
- [ ] Buckets panel renders all three macro groups with their buckets
- [ ] Pin/unpin bucket: isPinned toggles; pinned bucket appears in Quick Buckets on dashboard
- [ ] Edit bucket: inline fields for emoji and name appear; Save updates, Cancel restores
- [ ] Remove bucket: bucket disappears from the group
- [ ] Add bucket: form row appears at bottom of group, Fill name + emoji → Save adds bucket
- [ ] Max bucket limit (10 per macro) is enforced by hiding the "Add bucket" button when at capacity
- [ ] "Add Income" row opens income modal (bottom drawer)
- [ ] Income modal Step 1: numeric keypad entry works, Next disabled when amount is 0
- [ ] Income modal Step 2: "Add to overall budget" and all current-cycle buckets listed
- [ ] Income modal Step 3: confirm card shows amount + target, note field is editable
- [ ] Confirming income to a bucket: bucket allocated increases, income transaction recorded
- [ ] Confirming income to overall budget: cycle salary increases
- [ ] Income transactions appear in transaction history with green "+₹" amount
- [ ] Export CSV button triggers CSV download with transactions for current cycle
- [ ] Export JSON button triggers full-state JSON download
- [ ] Transaction History page renders at `/#/transactions`
- [ ] All current-cycle transactions listed, newest first, grouped by date
- [ ] Search by bucket name filters list in real time
- [ ] Search by note text filters list in real time
- [ ] Macro filter tabs (All / Needs / Wants / Future) filter correctly
- [ ] Transaction count summary updates with filters
- [ ] Empty state shows when no transactions match filters
- [ ] Back button on transaction history returns to dashboard
- [ ] "See all" button on dashboard Recent Transactions navigates to `/#/transactions`
- [ ] Settings → Commitments row still navigates to `/commitments`

### Sprint 11 — PWA: Offline Support & Install Prompt
- [ ] Service worker registers without error (DevTools → Application → Service Workers)
- [ ] After first load, app works fully offline (disable network in DevTools → reload page)
- [ ] Offline badge appears in header when network is disabled
- [ ] Offline badge disappears and "Back online ✓" toast shows when network is re-enabled
- [ ] Install banner appears on dashboard when browser fires `beforeinstallprompt` (Chrome on Android / desktop)
- [ ] "Add to Home Screen" button triggers the native install prompt
- [ ] Dismissing the banner stores `pwa-install-dismissed` and does not show again on re-visit
- [ ] `appinstalled` event hides banner and shows "Fiscal Fold installed! 🎉" toast
- [ ] manifest.json passes DevTools → Application → Manifest validation (no broken icon errors)
- [ ] App can be installed and opens in standalone mode (no browser chrome)

### Sprint 12 — Polish, Animations & Final QA
- [ ] Health bars animate from 0 → target width on dashboard load (not instant)
- [ ] Macro-bar expand/collapse still works correctly after animation change
- [ ] Sweep rows animate (fly right + fade) when "Sweep & Start New Cycle →" is tapped
- [ ] Sweep total flashes green briefly before navigation
- [ ] If no sweep rows, button works immediately with no animation delay
- [ ] Confirmation checkmark animates in (scale up) after tapping confirm in transaction modal
- [ ] Page transitions play on route change (fade-slide in)
- [ ] All buttons have `min-height: 44px` (no tiny tap targets)
- [ ] Settings gear icon button is 44×44px
- [ ] Transaction modal quick-amount buttons meet 44px height
- [ ] Transaction modal bucket rows meet 44px height
- [ ] Keyboard focus ring appears on all interactive elements (Tab through the UI)
- [ ] Health bars have `role="progressbar"` and `aria-valuenow` (inspect in DevTools)
- [ ] Transaction modal drawer has `role="dialog"` and `aria-modal="true"`
- [ ] Modal overlay is `aria-hidden="true"`
- [ ] Close buttons in modal have `aria-label="Close"`

### Post-MVP — Theme, Reset & Onboarding Polish
- [ ] Settings → theme toggle switches between light and dark
- [ ] Theme choice persists across reload (stored under `theme` in `localStorage`)
- [ ] Settings → "Reset all data" requires a second confirmation tap before wiping state
- [ ] After reset, app returns to `/#/onboarding`
- [ ] Editing salary mid-cycle prompts to re-pro-rate the current cycle
- [ ] Onboarding step 4 surfaces the unallocated amount live as buckets are edited
- [ ] Onboarding step 4 allows direct rupee allocation per bucket (not only sliders)
- [ ] Dashboard shows a friendly zero-state when there are no transactions yet (day 1)

---

## ✅ Final Checks

- [ ] Git status is clean (no untracked or unstaged files)
- [ ] Commit messages follow convention (`Sprint N: Summary`)
- [ ] Branch is ready to merge: `git checkout main && git merge <branch> --no-ff`
