# Changelog

All notable changes to this project are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Releases are cut automatically by [release-please](https://github.com/googleapis/release-please)
from [Conventional Commits](https://www.conventionalcommits.org/). The Python package
(`django-conjure`) is published to PyPI; the `@terracelab/conjure-web` dashboard is
version-locked in the repo and will publish to npm in a later release.

## [Unreleased]

### Added
- Monorepo scaffold: `packages/conjure` (Django app), `packages/web` (React dashboard
  source), `apps/docs` (MkDocs Material), `apps/landing` (Astro).
- `conjure` Django app: model introspection schema API, generic CRUD viewset
  (list/retrieve/create/update/delete + autocomplete/bulk/related), Django-permission gating,
  audit log, staff auth (session + JWT), dashboard widget registry.
- `conf.py` settings layer (`CONJURE = {...}`) decoupling the app from any single project:
  `AUTH_USER_MODEL`-based audit actor, configurable `USER_PAYLOAD`, standard logging,
  `admin_config.py` auto-discovery, widget registry.
- Docs site with versioned docs (`mike`) and code→docs auto-generation.
- Landing site sharing brand tokens with the app.
- CI/CD: test matrix, docs build/deploy, tag-driven PyPI + versioned-docs release.

[Unreleased]: https://github.com/terracelab/django-conjure/commits/main
