# Conjure admin dashboard

Your [Conjure](https://github.com/terracelab/django-conjure) admin dashboard — scaffolded by
`npx @terracelab/conjure-web init`. This is **your** code now: a Vite + React app that reads
your Django models over the Conjure API and renders a fast, high-density admin UI.

It ships the reusable engine — API client, a frozen shadcn-style UI kit, composed admin
components (data table, FK combobox, inline tables, filters, export, …), an app shell, a
dashboard/login/style-guide, a golden codegen template, and a runtime model renderer.
Project-specific model pages are your output.

- Docs: <https://docs.conjure.terracelab.co.kr>
- Brand & color tokens mirror `brand/tokens.css` from the monorepo in `src/styles/tokens.css`.

## Two modes

Render model pages either way — or mix them.

### 1. Runtime SPA mode (install-and-go)

`src/pages/GenericModelPage.tsx` renders **any** model purely from the schema API at runtime —
no per-model code. The list view (schema-driven columns + server-side pagination/sorting/search
+ export) works out of the box at `/g/{app.Model}`. Create/edit is currently a documented stub;
use codegen mode for full editing.

### 2. Codegen mode (you own the output)

Clone the golden template `src/pages/_template/` per model for full, customizable, owned pages
(list + create/edit form + detail + inline children + bulk actions). Then assemble the router and
sidebar:

```bash
# edit codegen/pages-manifest.json (start from pages-manifest.example.json)
python3 codegen/assemble.py
```

`assemble.py` generates `src/router.tsx`, `src/layouts/sidebar-nav.ts`, and
`src/layouts/sections.ts` from your manifest. The codegen rules are the frozen contract in
[`CLAUDE.md`](./CLAUDE.md).

### Keeping it in sync with your models

When your Django models change, dump a fresh schema snapshot and regenerate:

```bash
python manage.py conjure_dump_schema > codegen/schema-snapshot.json   # run in your Django project
python3 codegen/assemble.py                                           # diff-merge — see CLAUDE.md
```

## Configuration

Copy `.env.example` to `.env.local` and adjust:

- `VITE_API_BASE` — API path prefix (default `/conjure`, matching the `conjure.urls` mount in Django).
- `VITE_PROXY_TARGET` — dev proxy target for the local Django backend (default `http://localhost:8000`).
- `VITE_API_BASE_URL` — absolute API origin for production builds on a different origin.
- `VITE_COLOR_*` — runtime theme overrides (accent, sidebar, status colors). ⚠️ hex values must be quoted.

## Scripts

```bash
pnpm dev        # vite dev server
pnpm build      # tsc -b && vite build → dist/
pnpm typecheck  # tsc -b --noEmit
pnpm preview    # preview the production build
```

## License

MIT © Terrace Lab
