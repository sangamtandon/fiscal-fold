# AGENTS.md

> Single entry point for any AI coding agent (Claude Code, OpenAI Codex, Cursor,
> Gemini CLI, Aider, Jules, etc.) working on this repo. Read this first, then
> open the relevant role file under `.agents/` for the work you're about to do.

## Project snapshot

**Fiscal Fold** is a local-first personal-finance PWA that implements 50/30/20
envelope budgeting (salary auto-split into Needs / Wants / Future jars). It is
a single-user, offline-capable app with **no backend** — all state lives in
`localStorage`. Currency is INR (lakhs / crores formatting). Mobile-first from
375px.

## Tech stack

- **Build:** Vite 5 (vanilla ES modules)
- **Language:** Vanilla JavaScript with JSDoc typedefs (no TypeScript)
- **State:** Custom reactive pub/sub store in `src/data/store.js`
- **Routing:** Custom hash router in `src/router.js`
- **Styling:** Vanilla CSS with design tokens in `src/style.css`; per-page CSS scoped by slug prefix
- **PWA:** Service worker in `public/sw.js` (cache-bust via custom Vite plugin)
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

CI runs the same scripts; do not commit if any of them fail locally.

## Repo map

```
src/
  main.js              app shell, dashboard wiring, FAB, toast, install banner
  router.js            hash router — register new pages here
  style.css            60+ design tokens, global components
  pages/               one .js + .css per route, slug-prefixed CSS classes
  data/
    store.js           reactive store — ALL state writes go through this
    models.js          JSDoc typedefs for User / BudgetCycle / MicroBucket / Transaction / Commitment / Sweep
    seed.js            demo data + dev toolbar
  utils/               helpers.js (INR), theme.js, toast.js, offlineQueue.js, export.js, txn-grouping.js
public/                manifest.json, sw.js, favicon.svg, icons.svg
tests/
  unit/                Vitest, jsdom — store mutators, selectors, helpers, money precision
  integration/         Vitest — multi-mutator lifecycle flows
  e2e/                 Playwright — 12 specs covering onboarding, dashboard, persistence, payday, etc.
  helpers/             freshStore factory, builders
docs/
  UX_GLOSSARY.md       every user-facing string — copy MUST match
  IMPLEMENTATION_PLAN.md  historical sprint plan
```

## Code conventions

- **State:** every mutation goes through a mutator in `src/data/store.js`.
  Never call `localStorage.setItem` outside the store. Subscribe via
  `subscribe(key, callback)`.
- **Models:** add or extend JSDoc typedefs in `src/data/models.js` before
  changing state shape.
- **Pages:** a new route = a new `src/pages/<name>.js` + `src/pages/<name>.css`
  registered in `src/router.js`. CSS classes are prefixed with the page slug
  (`.txn-`, `.cm-`, `.pd-`, `.settings-`, etc.). Global styles only in
  `src/style.css`.
- **Money:** all currency formatting goes through `src/utils/helpers.js`
  (lakhs / crores). Money math goes through the precision helpers covered by
  `tests/unit/precision.spec.js` — never use raw floats.
- **UX copy:** every user-visible string must exist in `docs/UX_GLOSSARY.md`.
  Notable rules: say "cover from another bucket", never "borrow"; warnings
  are **warm amber, never red**.
- **Accessibility:** 44 px min touch targets (WCAG 2.5.5), visible focus
  rings, `role="dialog"` on modals, `role="progressbar"` on health bars.
- **Responsive:** mobile-first from 375 px (iPhone SE); tablet break 768 px;
  desktop 1024 px.
- **Dark mode is default**; light is a toggle in `src/utils/theme.js`.

## Testing rules

- Every new store mutator gets a unit test in `tests/unit/`.
- Every new user-visible flow gets a Playwright spec in `tests/e2e/`.
- Coverage thresholds in `vitest.config.js` must not be lowered to make tests
  pass — fix the test or fix the code.
- E2E assertions reference visible copy from `docs/UX_GLOSSARY.md`, not
  internal IDs or class names.

## Agent workflow — which `.agents/` file to open

| Intent                              | Read                          |
| ----------------------------------- | ----------------------------- |
| Break a request into a plan         | `.agents/planner.md`          |
| Write production code               | `.agents/implementer.md`      |
| Add / update tests                  | `.agents/tester.md`           |
| Pre-merge review                    | `.agents/reviewer.md`         |
| Update docs after a change          | `.agents/documenter.md`       |
| Cut a release                       | `.agents/release-manager.md`  |

A full feature usually flows planner → implementer → tester → documenter →
reviewer → release-manager. Each role file lists its inputs, outputs, and stop
conditions.

## Deeper documentation

- `README.md` — product overview and getting started
- `ARCHITECTURE.md` — full stack, file map, store API, design decisions
- `QUALITY_GATE.md` — 50+ item pre-merge regression checklist (per screen)
- `CURRENT_SPRINT.md` — current status and handoff notes
- `TECH_DEBT.md` — backlog of issues and optimisations
- `CHANGELOG.md` — release notes per sprint and post-MVP PR
- `docs/UX_GLOSSARY.md` — canonical user-facing copy
- `docs/IMPLEMENTATION_PLAN.md` — historical sprint plan

## Commit & PR conventions

- Short imperative subject (`fix: payday sweep rounding`, `feat: bucket pin toggle`).
- Reference the sprint or `TECH_DEBT.md` item when relevant.
- Never commit `dist/`, `.env*`, or `node_modules/`.
- One logical change per PR; keep diffs reviewable.
- PR description: what changed, why, screenshots for UI, and the
  `QUALITY_GATE.md` items walked through.

## Hard rules (don'ts)

- No new frameworks (React, Vue, Svelte, etc.).
- No Tailwind, SCSS, or any CSS preprocessor — vanilla CSS only.
- No TypeScript migration — stay on JSDoc.
- No cloud sync, no telemetry, no analytics SDKs.
- No new runtime dependencies without explicit user approval.
- No breaking changes to the `localStorage` schema without a written migration
  step in `src/data/store.js` and a note in `CHANGELOG.md`.
- Never lower coverage thresholds to make a build pass.
- Never `console.log` in committed code.
