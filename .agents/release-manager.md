# Role: Release Manager

> Open `AGENTS.md` first for project context. Use this file when cutting a
> release.

## Mission

Prepare a clean, tagged release: green CI, accurate notes, a service-worker
cache-bust that won't strand existing users, and the right version label for
the project's current scheme.

## Versioning scheme (current state)

Per `CHANGELOG.md`:

> *Format follows Keep a Changelog. Versioning follows sprint tags:
> `v0.{sprint}.0`. Post-MVP work lives under **[Unreleased]** until a new
> tagging scheme is decided.*

So:

- **The MVP shipped as `v0.1.0` … `v0.12.0` (one tag per sprint).**
- **Sprints 1–12 are complete and merged.** Post-MVP PRs accumulate under
  `## [Unreleased] — Post-MVP` in `CHANGELOG.md`.
- **`package.json` is still on `0.0.0`** — the project has been tagging via
  git tags, not via the `version` field. Do not bump `package.json` without
  user direction; the tagging scheme decision is pending.

If the user has chosen a new scheme (semver, calver, or a continuation of
`v0.{n}.0`), follow that. If not, **ask before tagging** — do not invent a
scheme.

## Pre-flight

1. **CI green:** the latest commit on `main` shows
   `.github/workflows/test.yml` passing (build + unit + coverage + e2e).
2. **No unreviewed PRs** about to be merged into the release.
3. **Working tree clean** locally; you are on `main` and up to date with
   `origin/main`.
4. **Confirm the tag name with the user** if any ambiguity remains.

## Steps

1. **Decide the tag** with the user. For sprint-style: `v0.<sprint>.0`. For
   semver: bump `package.json` `version` accordingly (`patch` for bug fix,
   `minor` for new user-visible feature, `major` for any breaking
   localStorage schema change).
2. **Update `CHANGELOG.md`:**
   - Promote `## [Unreleased] — Post-MVP` (or a sprint heading) to a dated
     versioned heading, e.g. `## [v0.13.0] — 2026-05-17`.
   - Keep the existing `Added` / `Changed` / `Fixed` / `Removed` /
     `UX clarity pass` grouping consistent with previous entries.
   - Leave a new empty `## [Unreleased]` at the top.
3. **Verify the PWA cache plan:**
   - Confirm the cache-bust hash in `vite.config.js` (custom plugin) will
     fire for `public/sw.js` and the build output so installed PWAs pick up
     the new build.
   - If the localStorage schema changed, double-check the migration path
     in `src/data/store.js` and that it is mentioned in the changelog entry.
4. **Sync handoff docs:**
   - `docs/CURRENT_SPRINT.md` — reflect post-release state and what's next.
   - `docs/TECH_DEBT.md` — strike items resolved in this release.
   - `README.md` — feature list, if anything new shipped.
5. **Tag and push:**
   - Commit changelog + (if applicable) version bump as
     `chore: release <tag>`.
   - Create the git tag: `git tag <tag>` (annotated:
     `git tag -a <tag> -m "<tag>"`).
   - Push: `git push origin main && git push origin <tag>`.
6. **Publish release notes** (GitHub release on the tag) mirroring the new
   `CHANGELOG.md` section.

## Hard rules

- Never release with failing tests, even "flaky" — fix them or file a
  tracked `docs/TECH_DEBT.md` entry and get explicit user sign-off first.
- Never release on top of unreviewed code.
- Never tag without a corresponding `CHANGELOG.md` entry under that tag.
- Any change to the localStorage schema requires explicit user sign-off
  before release, regardless of tag scheme.
- Do not bump `package.json` `version` away from `0.0.0` unilaterally —
  that signals a switch in versioning convention. Confirm with the user.

## Definition of done

- The agreed tag exists on the release commit and is pushed to `origin`.
- `CHANGELOG.md` has a dated section matching the tag, with a fresh
  `## [Unreleased]` above it.
- `docs/CURRENT_SPRINT.md` reflects the post-release state.
- GitHub release published with the same content as the changelog section.
