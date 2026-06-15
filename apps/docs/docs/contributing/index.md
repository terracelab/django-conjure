# Contributing — dev setup

Conjure is a monorepo: the Python package, the React package, the docs, the landing site,
and an example project all live together so **code and docs ship as one**.

## Repository layout

```text
django-conjure/
├── packages/
│   ├── conjure/      # PyPI: django-conjure  — Django app
│   └── web/          # npm:  @terracelab/conjure-web — React dashboard + codegen
├── apps/
│   ├── docs/         # this site (MkDocs Material + mike)
│   └── landing/      # brand / marketing site (Astro)
├── examples/
│   └── demo-shop/    # runnable Django project — the live demo
└── brand/            # tokens.css + BRAND.md — one source for all surfaces
```

Tooling: Python via `uv`/`hatch`, JS via `pnpm` workspaces, common tasks behind a
`Makefile`.

## Quick start

```bash
make install     # python (editable) + pnpm + docs deps
make test        # pytest (packages/conjure)
make docs-serve  # live docs at localhost:8000
make demo        # run the example admin (examples/demo-shop)
```

## Running the pieces

=== "Backend"

    ```bash
    cd packages/conjure
    python -m pytest            # the package test suite
    ```

=== "Frontend"

    ```bash
    cd packages/web
    pnpm install
    pnpm dev                    # Vite dev server, proxies /conjure to localhost:8000
    pnpm typecheck && pnpm build
    ```

=== "Docs"

    ```bash
    cd apps/docs
    pip install -r requirements.txt
    python gen/gen_config_reference.py   # refresh generated tables
    mkdocs serve                         # http://localhost:8000
    ```

## The docs-with-code rule

Every feature PR must update the docs. This is enforced socially (PR template checklist) and
in CI (a `pr-docs-gate` warns when a feature PR changes no docs/CHANGELOG). See
[Releasing](releasing.md) for how documentation rides the release pipeline.

```text
issue → branch → code + tests + docs + CHANGELOG entry
      → PR (checklist: tests? docs? compatibility?)
      → CI green + review → merge → auto-published on next release
```

## What CI checks

| Check | Scope |
|---|---|
| Python test matrix | Python 3.10–3.13 × Django 4.2 / 5.x |
| Lint | `ruff` / `black` (Python), `tsc` + `vitest` (web) |
| Docs build | `mkdocs build --strict` + the generators run clean |
| Docs gate | Feature PR with no docs change is flagged |

## Conventions

- **Conventional Commits.** Release notes and version bumps are derived from them by
  release-please.
- **One version for both packages.** The Python and npm packages always ship the same
  `X.Y.Z` (API contract parity).
- **Frozen UI kit.** Don't edit `components/ui/`; add variants in `components/composed/` and
  register them on `/style-guide`.
- **Brand in one place.** Colors come from `brand/tokens.css`; don't hardcode hex in three
  surfaces.

## Where to go next

- [Releasing](releasing.md) — the "release = docs release" pipeline and the code→docs
  generators.
- [Extension development](extension-development.md) — adding new extension points to the
  core.
- [Customization](../customization/index.md) — using the existing extension hooks.
