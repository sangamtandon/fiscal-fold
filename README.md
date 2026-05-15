# Fiscal Fold 📂

> A zero-guilt personal finance PWA using envelope budgeting and the 50/30/20 rule.

Fiscal Fold is a lightning-fast, local-first web application built to help you manage your finances without the stress. Designed specifically with salaried Indian professionals in mind, it brings the trusted envelope budgeting system into the digital age, heavily focused on the popular 50/30/20 budgeting rule.

## ✨ Features

- **Envelope Budgeting:** Distribute your salary into Micro-Buckets to track where every Rupee goes.
- **50/30/20 Rule Built-in:** Automatically categorize your expenses into Needs (50%), Wants (30%), and Future/Savings (20%).
- **Local-First & Private:** All your financial data stays completely private, stored safely in your device's `localStorage`. No accounts, no cloud sync, no tracking.
- **"Safe to Spend" Focus:** Know exactly how much guilt-free money you have left for your "Wants" without doing any math.
- **Progressive Web App (PWA):** Installable on mobile and desktop devices. Lightning fast and works offline.
- **Dark Mode First:** A premium, distraction-free aesthetic with warm ambers and positive greens.

## 🛠️ Technology Stack

Fiscal Fold is built with a focus on simplicity, speed, and zero dependency churn:
- **Build Tool:** Vite 5
- **Core:** Vanilla JS (ES Modules)
- **Styling:** Vanilla CSS (Custom properties / Design tokens)
- **Routing:** Custom lightweight hash router
- **State Management:** Custom reactive pub/sub store
- **Typography:** Inter + JetBrains Mono

For more detailed technical insights, read the [Architecture Documentation](ARCHITECTURE.md).

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
- [`ARCHITECTURE.md`](ARCHITECTURE.md) — stack, file map, store API, design decisions
- [`CHANGELOG.md`](CHANGELOG.md) — version history (sprint releases + post-MVP work)
- [`QUALITY_GATE.md`](QUALITY_GATE.md) — pre-merge regression checklist
- [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md) — original sprint plan (historical)

## 📦 Status
MVP complete — Sprints 1–12 shipped. See `CHANGELOG.md` for ongoing work.

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request. Be sure to check `QUALITY_GATE.md` and run through the regression checklist before requesting review.
