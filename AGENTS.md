# AI Agents Instructions (`AGENTS.md`)

Welcome! This file serves as the single source of truth for AI agents (like Cursor, Aider, GitHub Copilot Workspace, Devin, etc.) contributing to the **Fiscal Fold** project.

Fiscal Fold is a lightning-fast, local-first personal finance PWA that uses envelope budgeting based on the 50/30/20 rule. Our focus is on zero-guilt spending and absolute data privacy.

As an AI agent, you must read and adhere to the guidelines, architectural decisions, and workflows defined in this document before writing any code or proposing any changes.

---

## 1. Project Architecture & Tech Stack

This project strictly avoids modern complex frameworks in favor of speed, small bundle sizes, and zero dependency churn.

- **Build Tool:** Vite 5
- **Core:** Vanilla JS (ES Modules) — **No frameworks** (No React, Vue, Svelte, etc.)
- **Styling:** Vanilla CSS (Custom properties / Design tokens) — **No Tailwind or CSS processors**
- **Routing:** Custom lightweight hash router (`src/router.js`)
- **State Management:** Custom reactive pub/sub store (`src/data/store.js`)
- **Persistence:** LocalStorage only. `offlineQueue.js` is merely a sync stub for future use.
- **Testing:** Vitest (Unit/Integration) and Playwright (E2E)

### Intentional Decisions (DO NOT CHANGE)

1. **No JavaScript framework.** Do not introduce React, Vue, Svelte, or any VDOM layer.
2. **Hash-based routing.** Do not migrate to the History API.
3. **JSDoc types over TypeScript.** Do not add `tsconfig.json` or rename files to `.ts`. Types are defined in `src/data/models.js`.
4. **LocalStorage as the only persistence layer.** `src/data/store.js` is the single source of truth. Do not add IndexedDB or other databases.
5. **Needs budget surplus is forfeited at cycle end.** Only "wants" and "future" buckets are swept.
6. **INR currency formatting.** Do not change the locale (`en-IN`) or currency (`INR`).
7. **Amber/warn color for over-budget, never red.** Use `var(--warn)` for warnings. Red (`var(--danger)`) is only for destructive settings (Danger Zone).
8. **Module-level state in page modules.** Pages use module-level variables (e.g., `_activeFilter`). Do not refactor to class instances or closures unless specifically asked to extract logic.

---

## 2. Directory Structure & Conventions

```
fiscal-fold/
├── index.html                  # PWA entry point
├── public/                     # Static assets, SW, manifest
├── src/
│   ├── main.js                 # App shell, PWA logic
│   ├── router.js               # Hash router
│   ├── style.css               # Global design system & tokens
│   ├── pages/                  # Page modules with scoped CSS
│   ├── data/                   # Store, Models (JSDocs), Seed data
│   └── utils/                  # Helpers, theme, offline queue
└── tests/                      # Vitest and Playwright specs
```

### Coding Conventions

1. **CSS Scoping:** Since Vite injects all imported CSS globally, every page module must prefix its CSS classes uniquely (e.g., `.onboarding__`, `.txn-`, `.settings-`). Reviewers/Agents must ensure no unprefixed classes are introduced.
2. **State Access:** All state flows through `src/data/store.js`. Components must never access `localStorage` directly. Use exported getters and mutators.
3. **HTML Escaping:** Always use `escapeHtml(str)` from `src/utils/helpers.js` when interpolating user-controlled strings (like bucket names or notes) into `innerHTML`.
4. **Data Models:** Always consult `src/data/models.js` for expected object shapes.

---

## 3. Workflow & Branching Strategy

When assigned a task (feature or bugfix), follow this exact workflow:

1. **Branching:** Always branch off the latest `main`. Name your branches descriptively, e.g., `feature/add-dark-mode` or `fix/dashboard-rendering`.
2. **Planning:** Review the files, write a plan, and ask the user for clarification if the requirements are ambiguous.
3. **Implementation:** Write clean Vanilla JS.
4. **Testing (Mandatory):**
   - Write or update unit tests (`tests/unit/`) if modifying store logic or helpers.
   - Update Playwright E2E tests (`tests/e2e/`) if modifying UI flows.
5. **Quality Gate:** You must successfully run the test commands and build commands before finalizing your work.
6. **Commits:** Write clear, conventional commit messages.

---

## 4. Quality Gate (Pre-Commit Checks)

Before you declare a task complete, you must verify the following in your bash session:

### Automated Checks
1. `npm run build` — Must complete without errors.
2. `npm test` — Vitest unit and integration tests must pass.
3. `npm run test:e2e` — Playwright end-to-end tests must pass.

### Visual / Functional Verification (To verify manually or via scripts)
- Run `npm run dev` and ensure there are no console errors.
- If modifying UI, ensure responsive behavior across Mobile (375px), Tablet (768px), and Desktop (1280px).
- Verify Data Integrity: Reloading the page should preserve state. Wiping data should redirect to `/onboarding`.

### Glossary Check
Always ensure UI terminology matches the project's exact glossary:
- **Jars:** Needs / Wants / Future
- **Bucket:** Never "envelope"
- **Quick Bucket:** Pinned bucket on the dashboard
- **Cycle:** The budget period
- **Commitment:** Recurring bill (Never "Subscription")
- **Trade-off / Cover:** Never "Borrow" (there is no payback)
- **Safe to Spend:** Wants budget remaining

If you encounter an issue during testing, you must fix it before submitting the code. Do not ignore failing tests.