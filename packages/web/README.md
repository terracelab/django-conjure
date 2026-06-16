# @terracelab/conjure-web

**Conjure your Django admin.** The React admin dashboard for [`django-conjure`](https://github.com/terracelab/django-conjure) — read your Django models over the Conjure API and summon a fast, high-density admin UI.

This package is part of the Conjure monorepo. It ships the reusable engine: the API client, a frozen shadcn-style UI kit, composed admin components (data table, FK combobox, inline tables, filters, export, …), an app shell, a dashboard/login/style-guide, a golden codegen template, and a runtime model renderer. It does **not** ship any project-specific model pages — those are your output.

- Docs: <https://docs.conjure.terracelab.co.kr>
- Brand & color tokens: see `brand/tokens.css` in the repo root (this package mirrors it in `src/styles/tokens.css`).

## Status

**Not yet published to npm.** For the `0.1.x` line this package ships as source in the
[django-conjure](https://github.com/terracelab/django-conjure) monorepo — clone the repo and
work from `packages/web`. A published release (`npm i @terracelab/conjure-web`) is on the
roadmap; until then, use it as a scaffold / starting point and own the code.

## Two modes

Conjure supports two ways to render model pages — use either, or mix them.

### 1. Runtime SPA mode (install-and-go)

`src/pages/GenericModelPage.tsx` renders **any** model purely from the schema API at runtime — no per-model code. The list view (schema-driven columns + server-side pagination/sorting/search + export) works out of the box at `/g/{app.Model}`. Create/edit is currently a documented stub; use codegen mode for full editing.

### 2. Codegen mode (you own the output)

Clone the golden template `src/pages/_template/` per model for full, customizable, owned pages (list + create/edit form + detail + inline children + bulk actions). Then assemble the router and sidebar:

```bash
# edit codegen/pages-manifest.json (start from pages-manifest.example.json)
python3 codegen/assemble.py
```

`assemble.py` generates `src/router.tsx`, `src/layouts/sidebar-nav.ts`, and `src/layouts/sections.ts` from your manifest. The codegen rules are the frozen contract in [`CLAUDE.md`](./CLAUDE.md).

## Configuration

Copy `.env.example` to `.env.local` and adjust:

- `VITE_API_BASE` — API path prefix (default `/conjure`, matching the `conjure.urls` mount in Django).
- `VITE_PROXY_TARGET` — dev proxy target for the local Django backend (default `http://localhost:8000`).
- `VITE_API_BASE_URL` — absolute API origin for production builds on a different origin.
- `VITE_COLOR_*` — runtime theme overrides (accent, sidebar, status colors). ⚠️ hex values must be quoted.

## Scripts

```bash
npm run dev        # vite dev server
npm run build      # tsc -b && vite build → dist/
npm run typecheck  # tsc -b --noEmit
npm run preview    # preview the production build
```

## License

MIT © Terrace Lab
