# Changelog

All notable changes are documented here, cut automatically by
[release-please](https://github.com/googleapis/release-please) from
[Conventional Commits](https://www.conventionalcommits.org/).

Versions are **locked**: the Python package (`django-conjure`, PyPI) and the
`@terracelab/conjure-web` scaffolder (npm) always ship the **same version**. Per-package
history before this consolidation lives in `packages/conjure/CHANGELOG.md` and
`packages/web/CHANGELOG.md`.

## [0.6.0](https://github.com/terracelab/django-conjure/compare/v0.5.0...v0.6.0) (2026-07-19)


### Features

* CONJURE["MODEL_ORDER"] — row order within sidebar groups ([#23](https://github.com/terracelab/django-conjure/issues/23)) ([d4b12cd](https://github.com/terracelab/django-conjure/commit/d4b12cd2c579ce94a517b751493ae1d4b2124767))

## [0.5.0](https://github.com/terracelab/django-conjure/compare/v0.4.0...v0.5.0) (2026-06-17)


### Features

* backend-driven brand (CONJURE["BRAND"]) + hide sidebar scrollbar ([#21](https://github.com/terracelab/django-conjure/issues/21)) ([6ec2bef](https://github.com/terracelab/django-conjure/commit/6ec2bef75ce0c1a773acb0254cc34030c3315a96))

## [0.4.0](https://github.com/terracelab/django-conjure/compare/v0.3.3...v0.4.0) (2026-06-17)


### Features

* runtime filters, row selection/export, and custom actions ([#19](https://github.com/terracelab/django-conjure/issues/19)) ([fa09d6f](https://github.com/terracelab/django-conjure/commit/fa09d6faea20b67c4a11bc1d1e311809ac72c475))

## [0.3.3](https://github.com/terracelab/django-conjure/compare/v0.3.2...v0.3.3) (2026-06-17)


### Features

* **web:** runtime sidebar grouping (APP_GROUPS) + section tabs (SECTIONS) ([#17](https://github.com/terracelab/django-conjure/issues/17)) ([6ffb035](https://github.com/terracelab/django-conjure/commit/6ffb03527e3d77c66e7cf4dbb8a56a2496d72f18))

## [0.3.2](https://github.com/terracelab/django-conjure/compare/v0.3.1...v0.3.2) (2026-06-17)


### Bug Fixes

* **auth:** send CSRF token for session-auth writes ([#15](https://github.com/terracelab/django-conjure/issues/15)) ([0edc005](https://github.com/terracelab/django-conjure/commit/0edc0052f4aa2186a08e88e1c4af193b01ad7ecd))

## [0.3.1](https://github.com/terracelab/django-conjure/compare/v0.3.0...v0.3.1) (2026-06-17)


### Bug Fixes

* **web:** schema-driven sidebar + correct FK link routing for runtime models ([#13](https://github.com/terracelab/django-conjure/issues/13)) ([0da071b](https://github.com/terracelab/django-conjure/commit/0da071bfc2928dfe50efedc4d48f363b29b2b67a))

## [0.3.0](https://github.com/terracelab/django-conjure/compare/v0.2.2...v0.3.0) (2026-06-17)


### Features

* **web:** runtime create/edit/delete + inlines (GenericModelDetail) ([#11](https://github.com/terracelab/django-conjure/issues/11)) ([3e6f20e](https://github.com/terracelab/django-conjure/commit/3e6f20ead594d02f7cd85cb6bb4bdb45b433c085))

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
