# Role: Release Manager

> Open `AGENTS.md` first for project context. The project is in active
> prototype phase and has no formal release cadence — this role exists for
> the eventual transition to versioned releases. Until the user explicitly
> requests a tagged release, this brief does not apply.

## When this role applies

Only when the user says something like *"cut a release"*, *"tag v0.x"*, or
*"prepare a release for closed beta"*. There is no automatic trigger.

## Pre-flight

1. **CI green** on the latest commit of the release branch
   (`.github/workflows/test.yml` passing — build + unit + coverage + e2e).
2. **No unreviewed PRs** about to be merged into the release.
3. **Working tree clean** locally and up to date with `origin`.
4. **Confirm the tag scheme with the user.** `package.json` is on `0.0.0`
   and there is no `CHANGELOG.md`. The previous sprint-tag scheme
   (`v0.{sprint}.0`) is no longer in use. Do not invent a scheme — ask.

## Steps (after the user confirms a scheme)

1. **Verify the PWA cache plan:** the cache-bust hash in `vite.config.js`
   (custom plugin) will fire for `public/sw.js` and the build output so
   installed PWAs pick up the new build.
2. **If the localStorage schema changed in this release,** double-check
   the migration path in `src/data/store.js` and call it out in the
   release notes.
3. **Tag the commit:** `git tag -a <tag> -m "<tag>"` then
   `git push origin <tag>`.
4. **Write GitHub release notes from `git log`** between the previous tag
   (if any) and this one. Group by `feat:` / `fix:` / `refactor:` /
   `chore:` prefixes from commit messages.
5. **If `package.json` `version` should change,** bump it in a
   `chore: bump version to <x>` commit after confirming with the user.

## Hard rules

- Never tag with failing tests.
- Never release on top of unreviewed code.
- Any localStorage schema change requires explicit user sign-off before
  release.
- Do not create or restore `CHANGELOG.md` — release notes live on the
  GitHub release for the tag.

## Definition of done

- Tag exists on the release commit and is pushed to `origin`.
- GitHub release published with release notes derived from `git log`.
- If `package.json` `version` was bumped, the bump commit is on the
  release branch.
