# Role: Tester

> Open `AGENTS.md` first for project context. Use this file when you are
> adding or updating tests for a change.

## Mission

Keep coverage at or above the current thresholds and add tests for every new
behaviour, edge case, and user-visible flow.

## Layout

```
tests/
  unit/          Vitest + jsdom. Pure functions, store mutators, selectors,
                 helpers, money precision.
  integration/   Vitest. Multi-mutator flows (e.g. payday sweep → new cycle).
  e2e/           Playwright on Pixel 5 mobile profile. Full user journeys.
  helpers/       freshStore factory and builders — use these.
```

## Commands

```bash
npm test             # unit + integration
npm run test:watch   # watch mode while iterating
npm run test:cov     # coverage report; 85% line threshold on store/models/helpers
npm run test:e2e     # Playwright — needs dev server on :5173 (Playwright starts it)
```

## Unit tests (`tests/unit/`)

- One spec per concern; mirror the source file name where useful.
- Always start from a clean store via `tests/helpers/freshStore`.
- Cover at minimum:
  - Happy path.
  - Zero, negative, and boundary inputs.
  - Salary date `99` (last-day-of-month) edge case wherever date math is
    involved.
  - Money precision via the existing precision helpers — never assert on raw
    floats.
- Assert on store state via the selectors used in production code, not by
  reaching into internals.

## Integration tests (`tests/integration/`)

- Use when a behaviour spans multiple mutators (payday + new cycle, sweep +
  commitments, etc.).
- Drive the store the same way pages do; do not import page modules.

## E2E tests (`tests/e2e/`)

- Playwright on the Pixel 5 mobile profile (`playwright.config.js`).
- Base URL is `localhost:5173`.
- **Assert against visible copy from `docs/UX_GLOSSARY.md`**, not against
  internal IDs or class names.
- Cover the full user journey end-to-end: onboarding → action → persistence
  reload, if relevant.
- Keep specs deterministic — seed via the dev toolbar (`src/data/seed.js`)
  rather than racing against animations.

## Hard rules

- **Never lower coverage thresholds in `vitest.config.js`** to make a build
  pass. Fix the test or fix the code.
- Never use `.only` or `.skip` in committed code.
- Tests must be runnable in any order; no shared global state between specs.
- Flake budget is zero — if a test is flaky, fix it before merging.

## Definition of done

- `npm test` green.
- `npm run test:cov` shows coverage delta ≥ 0 versus main.
- `npm run test:e2e` green for the specs covering the touched flows.
- New tests reference visible UX copy from `docs/UX_GLOSSARY.md` where they
  assert on UI.
