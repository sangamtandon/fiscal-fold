# AGENTS.md

> Single entry point for any AI coding agent (Claude Code, OpenAI Codex, Cursor,
> Gemini CLI, Aider, Jules, etc.) working on this repo. Read this first, then
> open the relevant role file under `.agents/` for the work you're about to do.

## Project snapshot

**Fiscal Fold** is a local-first personal-finance PWA that implements 50/30/20
envelope budgeting (salary auto-split into Needs / Wants / Future jars). It is
a single-user, offline-capable app with **no backend** — all state lives in
`localStorage`. Currency is INR (lakhs / crores formatting). Mobile-first from
375 px.

**Phase:** active prototype. Things change fast — code and `AGENTS.md` are the
sources of truth; there are no architecture / changelog / regression-checklist
documents to consult.

## Tech stack

- **Build:** Vite 5 (vanilla ES modules)
- **Language:** Vanilla JavaScript with JSDoc typedefs (no TypeScript)
- **State:** Custom reactive pub/sub store in `src/data/store.js`
- **Routing:** Custom hash router in `src/router.js`
- **Styling:** Vanilla CSS with design tokens in `src/style.css`; per-page CSS scoped by slug prefix
- **PWA:** Service worker in `public/sw.js` (cache-bust via custom Vite plugin in `vite.config.js`)
- **Tests:** Vitest (unit + integration) and Playwright (e2e on Pixel 5 profile)
- **CI:** `.github/workflows/test.yml` (build → unit + coverage → e2e)

## Setup & commands

```bash
npm install            # one-time

npm run dev            # Vite dev server on http://localhost:5173
npm run build          # production build to dist/
npm run preview        # preview production build

npm test               # Vitest unit + integration
npm run test:watch     # Vitest watch mode
npm run test:cov       # coverage (85% line threshold on store/models/helpers)
npm run test:e2e       # Playwright on Pixel 5 mobile profile
```

CI runs the same scripts; do not push if any fail locally.

## Repo map

```
src/
  main.js              app shell, route registration, service worker init, FAB, toast, install banner
  router.js            hash router — pages register routes via registerRoute()
  style.css            60+ design tokens, global components
  pages/               one .js + .css per route — dashboard, onboarding, transactions, transaction-modal,
                       commitments, income-modal, payday, settings (CSS classes are slug-prefixed)
  data/
    store.js           reactive store — ALL state writes go through this
    models.js          JSDoc typedefs (User / BudgetCycle / MicroBucket / Transaction / Commitment / Sweep)
    seed.js            demo data + dev toolbar
  utils/               helpers.js (INR + escapeHtml), theme.js, toast.js, offlineQueue.js (sync stub),
                       export.js (CSV/JSON), txn-grouping.js, day-of-month-picker.js (shared salary/due-date input)
public/                manifest.json, sw.js, favicon.svg, icons.svg
tests/
  unit/                Vitest, jsdom — store mutators, selectors, helpers, money precision
  integration/         Vitest — multi-mutator lifecycle flows
  e2e/                 Playwright — onboarding, dashboard, persistence, payday, etc.
  helpers/             freshStore factory, builders
docs/
  UX_GLOSSARY.md       every user-facing string — copy MUST match
```

## Product glossary (must use these terms verbatim)

Quick reference. Full strings live in [`docs/UX_GLOSSARY.md`](docs/UX_GLOSSARY.md).

| Term | Meaning |
| --- | --- |
| **Jars** | The three macro buckets: **Needs / Wants / Future** (default 50/30/20). |
| **Bucket** | A spending category inside a jar. **Never "envelope".** |
| **Quick Bucket** | A pinned bucket on the dashboard (max 4) for one-tap logging. |
| **Cycle** | The budget period between paydays. |
| **Commitment** | A recurring bill. **Never "subscription".** |
| **Trade-off / Cover** | Reallocating from another bucket to cover a shortfall. **Never "borrow"** — there is no payback. |
| **Safe to Spend** | The user's remaining **Wants** budget for this cycle. |

## Intentional decisions (DO NOT CHANGE)

These are settled. Do not relitigate them without explicit user approval.

1. **No JavaScript framework.** No React, Vue, Svelte, or any VDOM layer.
2. **Hash-based routing only.** Do not migrate to the History API.
3. **JSDoc types over TypeScript.** No `tsconfig.json`, no `.ts` files. Type contracts live in `src/data/models.js`.
4. **localStorage is the only persistence layer.** `src/data/store.js` is the single source of truth. No IndexedDB, no cloud sync. `src/utils/offlineQueue.js` is a sync stub — do not wire it up to a backend.
5. **Needs surplus is forfeited at cycle end.** Only **Wants** and **Future** are swept by the payday flow.
6. **INR locale (`en-IN`).** Do not change locale or currency. Formatting is via helpers in `src/utils/helpers.js`.
7. **Amber for warnings, never red.** Use `var(--warn)`. `var(--danger)` is reserved for destructive Settings actions (Danger Zone) only.
8. **Module-level state in page modules.** Pages use module-level variables (e.g. `_activeFilter`). Do not refactor to classes or closures unless explicitly asked to extract logic.
9. **No new runtime dependencies** without explicit user approval.
10. **No telemetry, no analytics SDKs.**

## Code conventions

- **State:** every mutation goes through a mutator in `src/data/store.js`.
  Never call `localStorage.setItem` outside the store. Subscribe via
  `subscribe(key, callback)`.
- **Models:** add or extend JSDoc typedefs in `src/data/models.js` before
  changing state shape. Any schema change requires a migration in
  `src/data/store.js` and a note in the commit message.
- **Pages:** a new route = a new `src/pages/<slug>.js` + `src/pages/<slug>.css`
  registered in `src/router.js`. CSS classes are prefixed with the page slug
  (`.onboarding__`, `.txn-`, `.cm-`, `.pd-`, `.settings-`, etc.) because Vite
  injects imported CSS globally — unprefixed classes leak. Global styles only
  in `src/style.css`.
- **Security — HTML injection:** **always** use `escapeHtml(str)` from
  `src/utils/helpers.js` when interpolating any user-controlled string
  (bucket names, notes, transaction descriptions) into `innerHTML`. Reviewers
  treat raw interpolation as a blocker.
- **Money:** format currency via helpers in `src/utils/helpers.js` (lakhs /
  crores). Do precision arithmetic via the helpers covered by
  `tests/unit/precision.spec.js` — never assert on raw floats.
- **UX copy:** every user-visible string must exist in `docs/UX_GLOSSARY.md`.
  See the glossary above for the load-bearing terms.
- **Accessibility:** 44 px min touch targets (WCAG 2.5.5), visible focus
  rings, `role="dialog"` on modals, `role="progressbar"` on health bars.
- **Responsive:** mobile-first from 375 px (iPhone SE); tablet break 768 px;
  desktop 1024 px.
- **Dark mode is default**; light is a toggle in `src/utils/theme.js`.

## Testing rules

- Tests are the regression net. There is no per-screen QA checklist — if a
  behaviour matters, write a test for it.
- Every new store mutator gets a unit test in `tests/unit/`.
- Every new user-visible flow gets a Playwright spec in `tests/e2e/`.
- Coverage thresholds in `vitest.config.js` must not be lowered to make a
  build pass — fix the test or fix the code.
- E2E assertions reference visible copy from `docs/UX_GLOSSARY.md`, not
  internal IDs or class names.

## Agent workflow — which `.agents/` file to open

| Intent                              | Read                          |
| ----------------------------------- | ----------------------------- |
| Break a request into a plan         | `.agents/planner.md`          |
| Write production code               | `.agents/implementer.md`      |
| Add / update tests                  | `.agents/tester.md`           |
| Pre-merge review                    | `.agents/reviewer.md`         |
| Update copy or conventions          | `.agents/documenter.md`       |
| Cut a release                       | `.agents/release-manager.md`  |

A full feature usually flows planner → implementer → tester → reviewer. Use a
fresh chat per role where possible — especially for review — so the reviewer
has no memory of how the code got written.

## Commit & PR conventions

- Short imperative subject prefixed by type (`feat:`, `fix:`, `docs:`,
  `chore:`, `refactor:`, `test:`).
- Never commit `dist/`, `.env*`, or `node_modules/`.
- One logical change per PR; keep diffs reviewable.
- PR description: what changed, why, screenshots for UI, and any
  localStorage migration steps if the schema moved.

## Hard don'ts (in addition to "Intentional decisions")

- No Tailwind, SCSS, or any CSS preprocessor — vanilla CSS only.
- No new framework or VDOM layer.
- No breaking the localStorage schema without a written migration step and a
  note in the commit message / PR description.
- Never lower coverage thresholds to make a build pass.
- Never leave `console.log` / `debugger` in committed code.
- Never silently delete `AGENTS.md`, `.agents/*`, or `docs/UX_GLOSSARY.md` —
  these are the surviving load-bearing docs. Other historical docs were
  intentionally removed; do not recreate `ARCHITECTURE.md`, `CHANGELOG.md`,
  `QUALITY_GATE.md`, or `TECH_DEBT.md` unless the user explicitly asks.
