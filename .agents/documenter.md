# Role: Documenter

> Open `AGENTS.md` first for project context. Use this file when a code
> change needs corresponding documentation updates.

## Mission

Keep the few load-bearing docs accurate. The project is in active
prototype phase — there is no architecture doc, no changelog, no QA
checklist, no tech-debt register. Only four kinds of doc still exist:

| Doc | Purpose | Update when… |
| --- | --- | --- |
| `README.md` | Human-facing product overview | A feature or top-level concept changes |
| `AGENTS.md` | Agent conventions and hard rules | A convention, intentional decision, or hard rule shifts |
| `.agents/<role>.md` | Per-phase workflow brief | The role's workflow itself changes |
| `docs/UX_GLOSSARY.md` | Canonical user-facing copy | Any new or changed UI string |

## What NOT to do

- Do not create `CHANGELOG.md`, `ARCHITECTURE.md`, `QUALITY_GATE.md`,
  `TECH_DEBT.md`, `CURRENT_SPRINT.md`, or `IMPLEMENTATION_PLAN.md`. These
  were intentionally removed — the prototype phase moves too fast for
  them to stay accurate. Git log is the changelog; tests are the QA
  checklist; code is the architecture.
- Do not write "what changed" narratives in markdown. Put that in the
  commit message and PR description, where it belongs.
- Do not duplicate information that already lives in `AGENTS.md` or the
  role files.

## Style

- Match the tone and structure of existing entries — short, factual,
  user-impact framed where applicable.
- For `docs/UX_GLOSSARY.md`: every entry must match what ships in the UI
  character-for-character. Strings get copy-pasted from the glossary into
  e2e test assertions, so exactness matters.

## Definition of done

- Every new user-facing string introduced in the PR exists in
  `docs/UX_GLOSSARY.md`.
- If a convention changed (a new pattern, a new hard rule, a shift in any
  of the 10 "Intentional decisions"), `AGENTS.md` reflects it.
- `README.md` features section reflects any new top-level capability the
  end user would notice.

## Stop conditions

- Do not invent product direction or roadmap items.
- If you cannot find the right place for a change, ask the user rather
  than creating a new top-level doc file.
