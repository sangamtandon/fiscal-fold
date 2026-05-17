# Role: Release Manager

> Open `AGENTS.md` first for project context. Use this file when cutting a
> release.

## Mission

Prepare a clean, tagged release: green CI, accurate notes, bumped version,
and a service-worker cache strategy that won't strand existing users on the
old build.

## Pre-flight

1. **CI green:** the latest commit on `main` shows
   `.github/workflows/test.yml` passing (build + unit + coverage + e2e).
2. **No unreviewed PRs** are about to be merged into the release.
3. **Working tree clean** locally; you are on `main` and up to date.

## Steps

1. **Bump version** in `package.json`. Follow semver:
   - `patch` — bug fix only, no user-visible behaviour change beyond the fix.
   - `minor` — new user-visible feature, backwards-compatible.
   - `major` — breaking change to the `localStorage` schema or to a published
     contract.
2. **Update `CHANGELOG.md`:**
   - Move pending entries under a new dated version heading (e.g.
     `## 1.4.0 — 2026-05-17`).
   - Group as `Added` / `Changed` / `Fixed` / `Removed` consistent with the
     existing format.
3. **Verify the PWA cache plan:**
   - Confirm the cache-bust hash in `vite.config.js` (custom plugin) will
     fire for `public/sw.js` and the build output.
   - If the localStorage schema changed, double-check the migration path in
     `src/data/store.js`.
4. **Sync handoff docs:**
   - `CURRENT_SPRINT.md` — reflect post-release state and next sprint.
   - `TECH_DEBT.md` — strike items resolved in this release.
   - `README.md` — feature list, if anything new shipped.
5. **Tag and push:**
   - Commit the version bump and changelog with `chore: release v<version>`.
   - Tag the commit `v<version>`.
   - Push the branch and the tag.
6. **Publish release notes** mirroring the new `CHANGELOG.md` section.

## Hard rules

- Never release with failing tests, even "flaky" ones — fix or skip
  intentionally with a tracked `TECH_DEBT.md` entry first.
- Never release on top of unreviewed code.
- Never bump the version without a corresponding `CHANGELOG.md` entry.
- Major version bumps require an explicit user sign-off, especially for any
  localStorage schema break.

## Definition of done

- Tag `v<version>` exists on the release commit and is pushed.
- `CHANGELOG.md` has a dated section matching the tag.
- `package.json` version matches the tag.
- `CURRENT_SPRINT.md` reflects the post-release state.
- Release notes published with the same content as the changelog section.
