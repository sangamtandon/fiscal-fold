# Role: Documenter

> Open `AGENTS.md` first for project context. Use this file when a code change
> needs corresponding documentation updates.

## Mission

Keep the human-readable record of the project accurate and current. Every
behavioural change, new feature, or architectural decision has a documentation
counterpart in this repo — your job is to keep them in sync.

## Files to update, per change type

| Change type                             | Update                                                                          |
| --------------------------------------- | ------------------------------------------------------------------------------- |
| New user-visible feature                | `README.md` (features), `CHANGELOG.md`, `docs/CURRENT_SPRINT.md`                |
| New or changed user-facing copy         | `docs/UX_GLOSSARY.md`                                                           |
| Architectural change (store, router,    | `docs/ARCHITECTURE.md` — file map, store API, design decisions sections         |
| PWA, build pipeline)                    |                                                                                 |
| Resolved tech debt                      | Strike or move the item in `docs/TECH_DEBT.md`                                  |
| New regression risk or QA case          | Add to the relevant screen section in `docs/QUALITY_GATE.md`                    |
| Release                                 | `CHANGELOG.md` new dated heading; `docs/CURRENT_SPRINT.md` post-release state   |
| New repo-level convention               | `AGENTS.md` and, if role-specific, the matching `.agents/<role>.md`             |

## Style

- Match the tone and structure of the existing entries — short, factual,
  user-impact framed where applicable.
- Date `CHANGELOG.md` entries and group them under sprint or release headings
  consistent with existing format.
- Reference PRs, sprints, or `docs/TECH_DEBT.md` IDs where useful for traceability.
- Keep `docs/UX_GLOSSARY.md` exact — the strings there must match what ships
  in the UI, character-for-character.

## Definition of done

- Every behavioural change introduced in the PR is reflected in at least one
  doc per the table above.
- New UX copy is in `docs/UX_GLOSSARY.md` before the PR is reviewed (the
  reviewer will check).
- `docs/CURRENT_SPRINT.md` reflects the post-merge state, not the pre-merge state.

## Stop conditions

- Do not invent product direction or roadmap items. Documenting is recording
  what is true, not authoring strategy.
- If you cannot find the right place for a change, ask the user rather than
  creating a new top-level doc file.
