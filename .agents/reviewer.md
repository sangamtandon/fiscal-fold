# Role: Reviewer

> Open `AGENTS.md` first for project context. Use this file as an independent
> pre-merge check on a finished change. Run it in a fresh chat where possible
> — the reviewer should have no memory of how the code got written.

## Mission

Give an independent read on whether a diff is safe to merge. You have not
seen the planner's or implementer's reasoning — go from the diff alone and
the project conventions in `AGENTS.md`.

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
   - Schema changes carry a migration in `src/data/store.js` and are called
     out in the commit message.

3. **Security — HTML injection (BLOCKER)**
   - Any user-controlled string (bucket names, notes, transaction
     descriptions) interpolated into `innerHTML` must use `escapeHtml(str)`
     from `src/utils/helpers.js`.
   - Grep the diff for `innerHTML` and check every interpolation site.

4. **Models**
   - Any state shape change is reflected in `src/data/models.js` JSDoc
     typedefs.

5. **CSS scoping**
   - Every new class is prefixed with the page slug (`.onboarding__`,
     `.txn-`, `.cm-`, `.pd-`, `.settings-`, etc.). Unprefixed classes leak
     globally because Vite injects all imported CSS.
   - Colour values reference CSS custom properties from `src/style.css`,
     not raw hex. `var(--warn)` for warnings, `var(--danger)` only for
     Danger Zone.

6. **UX copy**
   - Every new or changed user-visible string exists in `docs/UX_GLOSSARY.md`.
   - Tone matches: "cover from another bucket" not "borrow"; "commitment"
     not "subscription".

7. **Accessibility**
   - Touch targets ≥ 44 px.
   - Visible focus rings on all interactive elements.
   - `role="dialog"` on modals, `role="progressbar"` on health bars.
   - Colour is not the sole signal for state.

8. **Responsive**
   - Renders correctly at 375 px (iPhone SE), 768 px (tablet), 1024 px
     (desktop). Spot-check the touched screens.

9. **Tests** (this is the regression net — no separate QA checklist exists)
   - `npm test` passes.
   - `npm run test:e2e` passes for the touched flows.
   - Coverage delta ≥ 0; thresholds in `vitest.config.js` unchanged.
   - New mutators have unit tests; new user-visible flows have e2e specs.

10. **Hard-rule guard** (see `AGENTS.md` "Intentional decisions")
    - No new framework, no TypeScript, no preprocessor, no cloud sync, no
      telemetry, no new runtime deps without approval.
    - No silent recreation of removed docs (`ARCHITECTURE.md`,
      `CHANGELOG.md`, `QUALITY_GATE.md`, `TECH_DEBT.md`).

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

- Do not edit code in this role. Hand back to `.agents/implementer.md`
  with a concrete list of blockers.
- If the diff is too large to review confidently, ask the author to split it.
