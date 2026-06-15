<!--
The PR *title* must follow Conventional Commits, e.g. `feat(conjure): add register_field hook`.
We squash-merge, so the title becomes the commit on main and drives the changelog + version bump.
-->

## Summary

<!-- What does this PR change, and why? Link the issue it closes: Closes #123 -->

## Type of change

- [ ] `feat` / `fix` / `perf` (user-facing — triggers a version bump)
- [ ] `docs` / `refactor` / `test` / `chore` (no version bump)
- [ ] Breaking change (`!` after type/scope, or a `BREAKING CHANGE:` footer)

## Checklist

- [ ] **Tests** added or updated for the change.
- [ ] **Docs** updated under `apps/docs/docs/` (feature PRs without docs get the `needs-docs` label).
- [ ] **CHANGELOG** — no manual edit needed; it is generated from the Conventional Commit title by release-please.
- [ ] **Compatibility / SemVer** noted (does this break the REST contract or public API?).
- [ ] PR **title** follows Conventional Commits.
