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

---

## ✅ Final Checks

- [ ] Git status is clean (no untracked or unstaged files)
- [ ] Commit messages follow convention (`Sprint N: Summary`)
- [ ] Branch is ready to merge: `git checkout main && git merge <branch> --no-ff`
