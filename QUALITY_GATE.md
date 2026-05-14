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
- [ ] App logo and title render correctly
- [ ] "Get Started" and "Skip to demo dashboard" buttons are visible
- [ ] Header and FAB are hidden during onboarding
- [ ] Clicking "Skip to demo" seeds data and navigates to dashboard

### Dashboard (`/#/dashboard`)
- [ ] Safe to Spend hero number renders (not NaN, not ₹0 with seeded data)
- [ ] "X days left in cycle" text is correct
- [ ] All three macro health bars (Needs, Wants, Future) render with correct percentages
- [ ] Recent transactions list shows entries with emojis and amounts
- [ ] Trade-off transactions show "from [bucket]" badge
- [ ] Leak warning OR "All clear" card appears based on data

### Settings (`/#/settings`)
- [ ] User profile info renders (name, salary, salary date)
- [ ] Bucket count and commitment count are correct
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

<!-- 
### Sprint 3 — Onboarding Flow
- [ ] 4-step wizard completes without errors
- [ ] First budget cycle is created with correct allocations
- [ ] Pro-rate logic works for mid-cycle starts

### Sprint 4 — Dashboard Core Layout
- [ ] Macro bars expand to show micro-buckets
- [ ] Count-up animation on Safe to Spend
- [ ] Color shifts based on spending health

(Add more as sprints are completed)
-->

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

---

## ✅ Final Checks

- [ ] Git status is clean (no untracked or unstaged files)
- [ ] Commit messages follow convention (`Sprint N: Summary`)
- [ ] Branch is ready to merge: `git checkout main && git merge <branch> --no-ff`
