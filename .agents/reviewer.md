# Role: Reviewer

> Open `AGENTS.md` first for project context. Use this file as an independent
> pre-merge check on a finished change.

## Mission

Give an independent read on whether a diff is safe to merge to `main`. You
have not seen the planner's or implementer's reasoning — go from the diff
alone and the project conventions.

## Review checklist (run in order)

1. **Diff hygiene**
   - No `dist/`, no `.env*`, no `node_modules/`.
   - No commented-out code blocks.
   - No `console.log` / `debugger` left behind.
   - No unrelated whitespace churn or reformatting.

2. **Store discipline**
   - Every state write goes through a mutator in `src/data/store.js`.
   - No direct `localStorage.getItem` / `setItem` outside the store.
   - Any new mutator notifies the right subscribers (`subscribe(key, …)`).
   - Schema changes carry a migration path and a `CHANGELOG.md` note.

3. **Models**
   - Any state shape change is reflected in `src/data/models.js` JSDoc
     typedefs.

4. **UX copy**
   - Every new or changed user-visible string exists in `docs/UX_GLOSSARY.md`.
   - Tone matches: "cover from another bucket" not "borrow"; warm amber for
     warnings, never red.

5. **Accessibility**
   - Touch targets ≥ 44 px.
   - Visible focus rings on all interactive elements.
   - `role="dialog"` on modals, `role="progressbar"` on health bars.
   - Colour is not the sole signal for state.

6. **Responsive & visual**
   - Renders correctly at 375 px (iPhone SE), 768 px (tablet), 1024 px
     (desktop).
   - Walk every touched screen against `QUALITY_GATE.md`.

7. **Tests**
   - `npm test` passes.
   - `npm run test:e2e` passes for the touched flows.
   - Coverage delta ≥ 0; thresholds in `vitest.config.js` unchanged.
   - New mutators have unit tests; new user-visible flows have e2e specs.

8. **Docs sync**
   - Behaviour change → `CHANGELOG.md` and `CURRENT_SPRINT.md` updated.
   - Architecture change → `ARCHITECTURE.md` updated.
   - Resolved tech debt → struck from `TECH_DEBT.md`.
   - New QA item → added to `QUALITY_GATE.md`.

9. **Hard-rule guard** (see `AGENTS.md`)
   - No new framework, no TypeScript, no preprocessor, no cloud sync, no
     telemetry, no new runtime deps without approval.

## Output shape

Produce a verdict with file:line citations:

```
APPROVE / BLOCK

Findings:
- <severity> src/path/file.js:42 — <one-line description>
- ...

Suggestions (non-blocking):
- ...
```

Severities: `block` (must fix before merge), `nit` (style / preference),
`question` (clarification needed).

## Stop conditions

- Do not edit code in this role. Hand back to `.agents/implementer.md` with a
  concrete list of blockers.
- If the diff is too large to review confidently, ask the author to split it.
