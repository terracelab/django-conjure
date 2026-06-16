# Changelog

All notable changes are documented here, cut automatically by
[release-please](https://github.com/googleapis/release-please) from
[Conventional Commits](https://www.conventionalcommits.org/).

Versions are **locked**: the Python package (`django-conjure`, PyPI) and the
`@terracelab/conjure-web` scaffolder (npm) always ship the **same version**. Per-package
history before this consolidation lives in `packages/conjure/CHANGELOG.md` and
`packages/web/CHANGELOG.md`.

## [0.2.2](https://github.com/terracelab/django-conjure/compare/v0.2.1...v0.2.2) (2026-06-16)


### Features

* **conjure:** opt-in AUTO_REGISTER for install-and-go model registration ([#9](https://github.com/terracelab/django-conjure/issues/9)) ([7956189](https://github.com/terracelab/django-conjure/commit/7956189456d6b88b0594068240907489d73350c5))

## [0.2.1](https://github.com/terracelab/django-conjure/compare/v0.2.0...v0.2.1) (2026-06-16)


### Bug Fixes

* defer register_widget import to avoid AppRegistryNotReady on startup ([#7](https://github.com/terracelab/django-conjure/issues/7)) ([b917a4b](https://github.com/terracelab/django-conjure/commit/b917a4b8dd4a1d634ad8d1c00c06b866e6768a39))

## [0.2.0](https://github.com/terracelab/django-conjure/compare/v0.1.1...v0.2.0) (2026-06-17)


### Features

* **web:** restructure `@terracelab/conjure-web` into a scaffolder CLI — `npx @terracelab/conjure-web init` copies the dashboard template + codegen into your project and runs codegen against your Django schema (published to npm).


### Miscellaneous Chores

* lock the Python + npm packages to a single shared version via a root release-please component (`extra-files` propagates one version to both `pyproject.toml` and `package.json`).
