# Changelog

All notable changes are documented here, cut automatically by
[release-please](https://github.com/googleapis/release-please) from
[Conventional Commits](https://www.conventionalcommits.org/).

Versions are **locked**: the Python package (`django-conjure`, PyPI) and the
`@terracelab/conjure-web` scaffolder (npm) always ship the **same version**. Per-package
history before this consolidation lives in `packages/conjure/CHANGELOG.md` and
`packages/web/CHANGELOG.md`.

## [0.2.0](https://github.com/terracelab/django-conjure/compare/v0.1.1...v0.2.0) (2026-06-17)


### Features

* **web:** restructure `@terracelab/conjure-web` into a scaffolder CLI — `npx @terracelab/conjure-web init` copies the dashboard template + codegen into your project and runs codegen against your Django schema (published to npm).


### Miscellaneous Chores

* lock the Python + npm packages to a single shared version via a root release-please component (`extra-files` propagates one version to both `pyproject.toml` and `package.json`).
