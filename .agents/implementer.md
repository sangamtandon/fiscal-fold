# Role: Implementer

> Open `AGENTS.md` first for project context. Use this file when you have an
> approved plan and are ready to write code.

## Mission

Execute an approved plan from `.agents/planner.md` with the smallest possible
surface area, matching existing patterns in this repo.

## Pre-flight

1. Re-read the plan and confirm the listed files and mutators still match the
   current state of the repo.
2. Open the nearest sibling file (similar page, similar mutator) and skim it
   for style cues — naming, comment density, file layout.
3. Confirm the store mutators you need exist in `src/data/store.js`, or that
   the plan adds them.
4. If touching UX copy, confirm the exact strings against
   `docs/UX_GLOSSARY.md`.

## Patterns to follow

- **State:** all writes go through a mutator in `src/data/store.js`. Subscribe
  to changes via `subscribe(key, callback)`. Never call
  `localStorage.setItem` outside the store.
- **New page:** create `src/pages/<slug>.js` and `src/pages/<slug>.css`,
  prefix every CSS class with the slug, register the route in
  `src/router.js`.
- **Shared logic:** put it in `src/utils/` with a clear single-purpose name.
- **Models:** update JSDoc typedefs in `src/data/models.js` before changing
  state shape.
- **Money:** format only via helpers in `src/utils/helpers.js`; do precision
  arithmetic via the helpers covered by `tests/unit/precision.spec.js`.
- **Theme:** colour values come from CSS custom properties in
  `src/style.css`. Do not hard-code hex outside that file.

## Hard constraints

- No new runtime dependencies without explicit user approval.
- No TypeScript, no framework, no CSS preprocessor (see `AGENTS.md`
  "Intentional decisions" and "Hard don'ts").
- UX copy verbatim from `docs/UX_GLOSSARY.md`. New copy is added to the
  glossary in the same change.
- **HTML injection:** any user-controlled string (bucket name, note,
  description) interpolated into `innerHTML` MUST go through
  `escapeHtml(str)` from `src/utils/helpers.js`. No exceptions.
- Use `var(--warn)` for warnings (amber); `var(--danger)` is reserved for
  the Settings Danger Zone. Never use red for warn states.
- Touch targets ≥ 44 px. Visible focus rings on all interactive elements.
- If you change the localStorage schema, include a migration in
  `src/data/store.js` that handles existing user data and call it out in
  the commit message / PR description.
- No `console.log` / `debugger` in committed code.

## Definition of done

- `npm run build` succeeds with no warnings introduced by your change.
- `npm test` passes locally with tests covering the new behaviour (see
  `.agents/tester.md`).
- `npm run test:e2e` passes for the touched flows.
- `npm run dev` shows no console errors; the touched screens render at
  375 px, 768 px, and 1024 px widths without layout breakage.
- If user-visible copy changed, `docs/UX_GLOSSARY.md` is updated in the
  same change (see `.agents/documenter.md`).

## Stop conditions

- If the plan no longer fits reality (file moved, mutator already exists,
  unrelated regression discovered), stop and return to `.agents/planner.md`
  rather than improvising.
- If implementation would require breaking a hard rule from `AGENTS.md`,
  surface that to the user before continuing.
