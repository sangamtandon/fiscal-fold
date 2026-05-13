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
- `src/main.js` - App shell and entry point
- `src/style.css` - Design system and tokens
- `src/data/store.js` - Core reactive state manager
- `src/router.js` - Client-side router

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request. Be sure to check the `CURRENT_SPRINT.md` and `QUALITY_GATE.md` for current development context.
