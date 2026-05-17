# Fiscal Fold 📂

> Know exactly what's safe to spend — without a spreadsheet.

Fiscal Fold is a lightning-fast, local-first personal finance PWA. It splits your salary into three jars — **Needs** (must-pays), **Wants** (fun money), and **Future** (savings) — then breaks each jar into named buckets you can pin to your dashboard for one-tap logging.

## Core concepts

| Term | What it means |
|------|---------------|
| **Needs / Wants / Future** | The three jars your salary splits into. Default 50/30/20, customisable. |
| **Bucket** | A spending category inside a jar — like an envelope for groceries, dining, or your emergency fund. |
| **Quick Bucket** | A pinned bucket that appears on the dashboard for one-tap spend logging (max 4). |
| **Cycle** | The budget period between paydays. Unspent **Wants** & **Future** roll into next cycle's **Future**; **Needs** resets fresh every cycle. |
| **Commitment** | A recurring bill (rent, EMI, subscription) set aside from the macro budget before you spend, so the dashboard never lies. |
| **Trade-off / Cover** | When a bucket is short, you can permanently cover the shortfall from another bucket — no payback, just an explicit reallocation. |
| **Safe to Spend** | Your **Wants** budget remaining for this cycle. Needs & Future are protected — this is your guilt-free spend. |

## ✨ Features

- **Three-jar budgeting** with editable ratios and four preset strategies (Balanced, Save More, More Essentials, Custom).
- **Named buckets** with emojis, allocations, pinning, and a clear "left to assign" counter so nothing gets lost.
- **Tap-to-log expenses** from a floating action button, with a one-tap shortcut to log income from the same modal.
- **Cover-from-another-bucket** flow when you go over budget — no hidden math, no "borrow" language pretending it'll be paid back.
- **Local-first & private:** No account, no cloud sync. Data lives only in `localStorage` on your device. Export anytime as CSV or full JSON backup.
- **Edit / delete transactions** from the history page — mistakes reverse cleanly (the bucket budget is restored).
- **Commitments** with a "Mark paid" flow that lets you record the expense against a specific bucket.
- **Payday ritual** that rolls unspent Wants & Future into next cycle's savings.
- **Progressive Web App (PWA)** — installable, works offline, and the install prompt only fires after you've actually used the app.
- **Dark mode first**, with a Settings toggle for light mode.
- **In-app Help section** in Settings — every term above is defined where you can revisit it.

## 🛠️ Technology Stack

Fiscal Fold is built with a focus on simplicity, speed, and zero dependency churn:
- **Build Tool:** Vite 5
- **Core:** Vanilla JS (ES Modules)
- **Styling:** Vanilla CSS (Custom properties / Design tokens)
- **Routing:** Custom lightweight hash router
- **State Management:** Custom reactive pub/sub store
- **Typography:** Inter + JetBrains Mono

For more detailed technical insights, read [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md). If you are an AI coding agent contributing to this project, start with [`AGENTS.md`](AGENTS.md).

## 🚀 Getting Started

To run Fiscal Fold locally on your machine:

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/sangamtandon/fiscal-fold.git
   cd fiscal-fold
   ```

2. Install the dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`.

### Building for Production
To create a production-ready build:
```bash
npm run build
```
The optimized files will be generated in the `dist` directory.

## 🗂️ Project Structure
- `index.html` — PWA entry point, font preloads, meta tags
- `src/main.js` — App shell, route registration, FAB, toast, install banner
- `src/router.js` — Hash-based client router with cleanup lifecycle
- `src/style.css` — Design system tokens and shared components
- `src/pages/` — One module + scoped CSS per route (onboarding, dashboard is in `main.js`, transactions, transaction-modal, commitments, income-modal, payday, settings)
- `src/data/` — `store.js` (reactive state + localStorage), `models.js` (JSDoc typedefs), `seed.js` (demo data + dev toolbar)
- `src/utils/` — `helpers.js` (currency/time/IDs), `theme.js` (light/dark toggle), `toast.js`, `offlineQueue.js`, `export.js` (CSV/JSON)
- `public/` — `manifest.json`, `sw.js` (service worker), `favicon.svg`, `icons.svg`

## 📚 Documentation

**Project entry points (root):**
- [`AGENTS.md`](AGENTS.md) — single source of truth for AI agents (conventions, hard rules, agent workflow)
- [`CHANGELOG.md`](CHANGELOG.md) — version history (sprint releases + post-MVP work)

**Deep references (`docs/`):**
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — stack, file map, store API, design decisions
- [`docs/QUALITY_GATE.md`](docs/QUALITY_GATE.md) — 50+ item pre-merge regression checklist (per screen)
- [`docs/CURRENT_SPRINT.md`](docs/CURRENT_SPRINT.md) — current status and AI handoff notes
- [`docs/TECH_DEBT.md`](docs/TECH_DEBT.md) — backlog of issues and optimisations
- [`docs/UX_GLOSSARY.md`](docs/UX_GLOSSARY.md) — every user-facing term, with the exact copy used in-app
- [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md) — original sprint plan (historical)

**Per-phase agent briefs (`.agents/`):**
- `planner.md`, `implementer.md`, `tester.md`, `reviewer.md`, `documenter.md`, `release-manager.md` — see `AGENTS.md` for which to open when.

## 🧪 Testing
- `npm test` — unit + integration suite (Vitest, ~100 tests covering store mutators, selectors, helpers, and lifecycle)
- `npm run test:e2e` — Playwright suite covering onboarding, dashboard clarity, trade-off language, transaction delete, commitments mark-paid, settings, and payday rituals

## 📦 Status
MVP complete — Sprints 1–12 shipped. See `CHANGELOG.md` for ongoing work.

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request. Be sure to check [`docs/QUALITY_GATE.md`](docs/QUALITY_GATE.md) and run through the regression checklist before requesting review.
