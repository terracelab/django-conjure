# @terracelab/conjure-web

**Conjure your Django admin.** The scaffolder for the [`django-conjure`](https://github.com/terracelab/django-conjure) React admin dashboard. One command drops the dashboard source into your project and runs codegen against your Django schema — you get a normal Vite + React app that you own.

- Docs: <https://docs.conjure.terracelab.co.kr>

## Quick start

```bash
# In your Django project (django-conjure already pip-installed + conjure.urls mounted):

# 1. Dump your model schema (ships with the pip package)
python manage.py conjure_dump_schema > schema-snapshot.json

# 2. Scaffold the dashboard (picks up schema-snapshot.json from the cwd automatically)
npx @terracelab/conjure-web init conjure-admin

# 3. Install, point at your API, run
cd conjure-admin
pnpm install
# edit .env.local → VITE_PROXY_TARGET=http://localhost:8000 (your Django origin)
pnpm dev
```

When you're ready to ship, `pnpm build` produces a static `dist/` — host it on any static
host (WhiteNoise, a CDN, S3, …) pointed at your `conjure/` API.

## What `init` does

1. Copies the dashboard template into the target directory (default `conjure-admin`).
2. Wires in your **schema snapshot** — from `--snapshot <path>`, or `./schema-snapshot.json`
   in the current directory if present. (Without one, a shipped example is used so the app
   still builds.)
3. Optionally wires in a **pages manifest** (`--manifest <path>`) describing your sidebar /
   section structure. Omit it to start from the example.
4. Runs `codegen/assemble.py` to generate `src/router.tsx`, `src/layouts/sidebar-nav.ts`, and
   `src/layouts/sections.ts` from the manifest. (Needs `python3` on PATH — you have it; skip
   with `--no-codegen` and run it yourself later.)

```
npx @terracelab/conjure-web init [target] [options]

  --snapshot <path>   schema snapshot JSON (default: ./schema-snapshot.json)
  --manifest <path>   pages-manifest.json (navigation structure)
  --no-codegen        copy only; don't run codegen
  --force             scaffold into a non-empty directory
  -h, --help          show help
  -v, --version       print version
```

## After scaffolding — you own the code

The scaffolded project carries its own `codegen/` and the frozen rules in `CLAUDE.md`. Two
delivery modes, mix freely:

- **Runtime mode** — `GenericModelPage` (list) + `GenericModelDetail` (detail) render any model
  from the schema API at runtime (`/g/{app.Model}`), no per-model code: list, create, edit, delete,
  and inline children all work. (`ManyToMany`/`JSON` are read-only — use codegen for bespoke controls.)
- **Codegen mode** — clone `src/pages/_template/` per model for full, owned, customizable pages,
  then re-run `python3 codegen/assemble.py` to wire them into the router + sidebar.

When your models change, dump a fresh snapshot, drop it into the project's `codegen/`, and
re-run codegen (diff-merge — see `CLAUDE.md`'s regeneration rules).

## Configuration (in the scaffolded app)

Copy `.env.example` to `.env.local`:

- `VITE_API_BASE` — API path prefix (default `/conjure`, matching the `conjure.urls` mount).
- `VITE_PROXY_TARGET` — dev proxy target for the local Django backend.
- `VITE_API_BASE_URL` — absolute API origin for production builds on a different origin.
- `VITE_COLOR_*` — runtime theme overrides (hex values must be quoted).

## License

MIT © Terrace Lab
