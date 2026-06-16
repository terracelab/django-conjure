# Contributing to Conjure

Thanks for helping conjure a better Django admin. Conjure is built by
[Terrace Lab](https://terracelab.co.kr) and is MIT-licensed. This guide covers local setup,
our commit conventions, and how releases work.

> One rule above all: **features ship with docs.** A change to feature code without an
> accompanying docs update gets a friendly nudge from CI (`needs-docs`). See
> [the docs checklist](#pull-request-checklist).

---

## Repository layout

This is a monorepo (`terracelab/django-conjure`):

| Path | What | Released as |
|---|---|---|
| `packages/conjure` | Python package (Django app, import name `conjure`) | PyPI `django-conjure` |
| `packages/web` | Scaffolder CLI (`bin/`) + the dashboard `template/` it generates | npm `@terracelab/conjure-web` |
| `apps/docs` | Documentation site (MkDocs Material + `mike`) | GitHub Pages (versioned) |
| `apps/landing` | Marketing / landing site (Astro) | static host (Vercel) |
| `examples/` | Demo Django projects *(planned)* | — |
| `brand/` | Brand tokens and reference | — |

The Python package and the web package are **version-locked**: they always release the
same version so the REST contract between them stays consistent.

---

## Local development setup

Prerequisites: Python 3.10+ and Node 18+ (CI uses Node 20) with [pnpm](https://pnpm.io) 9.

```bash
# One-shot bootstrap (installs python dev deps, pnpm deps, and docs deps):
make install
```

If you prefer to set up pieces by hand:

```bash
# Python package (with dev extras: ruff, pytest, etc.)
cd packages/conjure
pip install -e ".[dev]"

# Web package (the dashboard app lives in packages/web/template)
pnpm install
pnpm --filter conjure-admin build

# Docs site
pip install -r apps/docs/requirements.txt
cd apps/docs && mkdocs serve      # http://127.0.0.1:8000
```

### Running checks locally

```bash
# Python
cd packages/conjure
ruff check .            # lint
ruff format .           # format (use --check in CI)
pytest                  # tests

# Web
pnpm --filter conjure-admin typecheck
pnpm --filter conjure-admin build

# Docs (must build cleanly with --strict)
cd apps/docs && mkdocs build --strict
```

### pre-commit (recommended)

```bash
pip install pre-commit
pre-commit install
```

This runs ruff (lint + format) on `packages/conjure`, plus whitespace/YAML/merge-conflict
hygiene, on every commit.

---

## Branch & PR flow

1. Open (or claim) an issue describing the change.
2. Branch off `main`.
3. Make the change **plus tests plus docs** (and note compatibility — see SemVer below).
4. Open a PR with a [Conventional Commit](#conventional-commits) **title**.
5. CI runs (tests matrix, web build, docs `--strict`, docs gate). Address review.
6. On merge, your change is queued into the next release automatically.

We squash-merge; the **PR title** becomes the commit on `main`, so it must follow
Conventional Commits.

---

## Conventional Commits

Commit/PR titles drive the changelog and version bumps via
[release-please](https://github.com/googleapis/release-please).

Format: `type(scope): summary`

**Types:** `feat`, `fix`, `perf`, `docs`, `refactor`, `revert`, `deps`, `build`, `ci`,
`test`, `style`, `chore`.

**Scopes:** `conjure`, `web`, `docs`, `landing`, `examples`, `ci`.

**Version impact (SemVer):**

- `feat:` → **minor** bump.
- `fix:` / `perf:` → **patch** bump.
- A `!` after the type/scope or a `BREAKING CHANGE:` footer → **major** bump.

Examples:

```
feat(conjure): add register_field hook for custom field renderers
fix(web): correct date widget timezone handling
docs(docs): document the spell (action) registry
feat(conjure)!: rename ADMIN_CONFIG to CONJURE_CONFIG
```

---

## Pull request checklist

Every PR should be able to tick these (the PR template repeats them):

- [ ] **Tests** added or updated for the change.
- [ ] **Docs** updated under `apps/docs/docs/` (feature PRs without docs get the
      `needs-docs` label).
- [ ] **CHANGELOG** — *no manual edit needed*; it is generated from your Conventional
      Commit title by release-please.
- [ ] **Compatibility / SemVer** noted (does this break the REST contract or public API?).
- [ ] PR **title** follows Conventional Commits.

---

## How releases work (fully automated)

```
merge to main
   └─ release-please opens/updates a single "Release PR" (changelog + version bumps)
        └─ merge the Release PR
             ├─ tag vX.Y.Z is created
             ├─ PyPI:  django-conjure published via Trusted Publishing (OIDC, tokenless)
             ├─ npm:   @terracelab/conjure-web (scaffolder CLI) — gated on repo var PUBLISH_NPM=true
             └─ docs:  mike deploy X.Y latest  → versioned docs go live in the same run
```

You never hand-edit versions or the changelog, never tag manually, and never run the
publish commands. **Merging the Release PR ships the package _and_ its versioned docs
together.** The Python and web packages always release the same version.

> **Maintainer note (one-time):** `.release-please-manifest.json` is seeded at `0.0.0` for
> both packages so the **first** Release PR publishes `0.1.0`. The initial import commit
> carries a `Release-As: 0.1.0` footer to pin that first version exactly; after it ships you
> never touch versions again. If release-please ever needs to be re-bootstrapped on an
> existing history, run it with a `bootstrap-sha` pointing at the commit just before the
> first version you want it to consider, then remove that override.

---

## Extension points (add features without forking)

Conjure is built to be extended through public registries — you rarely need to fork the
core. The three main extension points:

| Extension point | Add | How |
|---|---|---|
| **Field renderers** | custom field display/input (e.g. GFK, GIS) | `@register_field("MyField")` (backend schema + frontend renderer) |
| **Widgets** | dashboard cards / charts | `@register_widget("name")` + a frontend widget component |
| **Actions ("spells")** | export / publish / send, etc. | declare in `ADMIN_ACTIONS` + a handler, synced for permissions |

Each registry is documented with worked examples in the docs under **Customization →
Extension points** and **Reference**. If you add or change an extension point, update those
pages in the same PR.

---

## Code of Conduct

Participation is governed by our [Code of Conduct](./CODE_OF_CONDUCT.md). Report concerns
to conduct@terracelab.co.kr.

## Security

Please do **not** open public issues for vulnerabilities. See [SECURITY.md](./SECURITY.md)
and email security@terracelab.co.kr.

## Questions

Use [GitHub Discussions](https://github.com/terracelab/django-conjure/discussions) for
questions and ideas; use Issues for bugs and concrete feature requests.
