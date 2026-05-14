# Current Sprint Status

> This file is updated at the end of every sprint.  
> It serves as the **single source of truth** for AI context handoff between conversations.

---

## ✅ Last Completed: Sprint 11 — PWA: Offline Support & Install Prompt

- **Branch:** `sprint-11/pwa` → ready to merge to `main` as `v0.11.0`
- **Key files added:**
  - `public/sw.js` — service worker: cache-first for same-origin assets, app-shell fallback for navigation, stale-while-revalidate for external resources (fonts); now pre-caches `/`, `/manifest.json`, `/favicon.svg` on install
  - `src/utils/offlineQueue.js` — IndexedDB-backed queue; tracks transactions logged offline for future BaaS sync
- **Key files modified:**
  - `src/main.js` — SW registration on load; offline badge wired to `online`/`offline` events; `beforeinstallprompt` captured with `_renderInstallBanner()`; `appinstalled` handler removes banner + toast; `online` handler flushes offline queue and shows "X transactions synced ✓"; non-critical routes (settings, transactions, commitments, payday) lazy-loaded via dynamic imports
  - `src/pages/transaction-modal.js` — all three confirm paths enqueue to offlineQueue when offline; toast switches to "Saved locally — will sync when online"
  - `src/style.css` — `.offline-badge` and `.pwa-install-banner` styles added
  - `public/manifest.json` — icons fixed (SVG instead of missing PNGs); added `categories`
  - `index.html` — font loading changed to non-blocking preload pattern (display=swap, noscript fallback)
  - `ARCHITECTURE.md` — PWA row updated ✅; `sw.js` added to file map
  - `QUALITY_GATE.md` — Sprint 11 regression checklist added
- **Key behaviour:**
  - **Offline:** SW caches app shell on install; app runs fully offline (all data in localStorage)
  - **Offline indicator:** amber "Offline" badge in header when `navigator.onLine === false`; "Back online — X transactions synced ✓" toast on reconnect
  - **Offline queue:** transactions logged while offline are saved to IndexedDB; flushed and counted on reconnect (BaaS sync stub)
  - **Install prompt:** captures `beforeinstallprompt`; bottom banner with "Add to Home Screen" CTA + dismiss; dismiss stored in localStorage; `appinstalled` fires success toast
  - **Performance:** settings/transactions/commitments/payday pages lazy-loaded; fonts non-blocking
- **Acceptance:** ✅ All 4 tasks complete: SW + offline queue + install prompt + performance optimisation

---

## 🔜 Next Up: Sprint 12

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
└── v0.11.0  Sprint 11: PWA — Offline Support & Install Prompt (branch ready, pending merge)
```
