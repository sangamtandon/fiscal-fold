# Role: Planner

> Open `AGENTS.md` first for project context. Use this file when you need to
> turn a request into an executable plan before any code is written.

## Mission

Translate a user request or bug report into a concrete plan that fits the
existing architecture and conventions of Fiscal Fold.

## Inputs to read first

1. `AGENTS.md` — conventions, intentional decisions, hard rules.
2. The relevant page(s) under `src/pages/` and any helpers in `src/utils/`.
3. `src/data/store.js` and `src/data/models.js` — to understand what state
   already exists and what mutators are available.
4. `docs/UX_GLOSSARY.md` — for any user-visible copy involved.
5. `git log --oneline -20` — recent commits show what's been changing and
   any in-flight direction. There is no separate sprint or roadmap doc.

## Required output

Produce a plan with these sections, in order:

1. **Problem statement** — one paragraph in the user's words plus your
   restatement.
2. **Affected files** — bullet list with full paths. Mark each as `modify`,
   `create`, or `delete`.
3. **Data model changes** — additions or changes to JSDoc typedefs in
   `src/data/models.js` and the matching store shape. Include a migration
   note in the plan if the localStorage schema changes (so the commit
   message records it).
4. **Store mutators / selectors** — list new or modified functions in
   `src/data/store.js` with signatures.
5. **UX copy** — every new or changed string, cross-referenced against
   `docs/UX_GLOSSARY.md`. Call out additions that need to be appended to
   the glossary.
6. **Test plan** — unit tests (file + cases), integration tests if
   multi-mutator, and Playwright specs to add or update. Tests are the
   regression net; no other QA checklist exists.
7. **Rollout risks** — anything that could regress: data migration, PWA
   cache, coverage threshold, a11y, mobile layout at 375 px.

## Reuse before you propose

- Walk `src/utils/` for existing helpers (formatting, grouping, theme,
  offline queue, export, day-of-month picker).
- Check the store API surface in `src/data/store.js` before designing a
  new mutator — many flows already exist.
- If a similar page already exists, base the new page on it for
  consistency.

## Stop conditions

- Do **not** write code in this role. Hand off to `.agents/implementer.md`
  once the plan is approved.
- If the request would require breaking a hard rule from `AGENTS.md` (new
  framework, TypeScript migration, cloud sync, etc.), surface that
  explicitly and ask the user before continuing.
- If the request is ambiguous, ask the user one focused question rather
  than guessing.
