# CLI & management commands

Conjure adds a few Django management commands (backend) and a scaffolding CLI (frontend).

## Management commands

### `migrate conjure`

<span class="status available">✅</span> Standard Django migration that creates the single
`AdminAuditLog` table. Run once after install.

```bash
python manage.py migrate conjure
```

CRUD, schema, and widgets all work before this runs — only audit writes are skipped until
the table exists.

### `conjure_dump_schema`

<span class="status available">✅</span> Dumps the introspection schema of every registered
model to the snapshot file the frontend codegen reads.

```bash
python manage.py conjure_dump_schema   # → packages/web/codegen/schema-snapshot.json
```

Re-run it whenever you add a model or change fields, then regenerate the affected pages.

### `sync_admin_actions`

<span class="status planned">📋</span> Idempotently creates the `Permission` rows for every
declared action — **no migration**. Run on deploy and whenever you add an action.

```bash
python manage.py sync_admin_actions
```

See [Actions & permissions](../actions-permissions/index.md).

## Frontend scaffolder

### `create-conjure`

<span class="status setup">🟡</span> Scaffolds the React dashboard (`packages/web`) into
your project for codegen mode.

```bash
npx @terracelab/create-conjure
```

### Codegen assembly

<span class="status available">✅</span> Rebuilds the router and sidebar from the page
manifest after you add or move pages.

```bash
python codegen/assemble.py   # regenerates router.tsx + sidebar-nav.ts + sections.ts
```

See [Sections & tabs](../guides/sections-and-tabs.md).

## npm scripts (codegen mode)

| Command | Purpose |
|---|---|
| `npm run dev` | Vite dev server (proxies `/conjure` to your backend). |
| `npm run build` | Production build (`tsc` strict + Vite). |
| `npm run typecheck` | Type-check without emitting. |

## Cheat sheet

```bash
# Backend
python manage.py migrate conjure          # audit log table (once)
python manage.py conjure_dump_schema      # refresh schema snapshot
python manage.py sync_admin_actions       # create action permissions 📋
python manage.py test conjure             # run the package tests

# Frontend (codegen mode)
npm run dev / npm run build / npm run typecheck
python codegen/assemble.py                # rebuild router + sidebar
```

!!! info "Generated from --help (planned)"
    <span class="status planned">📋</span> A future generator (`gen/gen_cli.py`) will
    capture each command's `--help` output so this reference is generated from the code.
    See [the generators README](../contributing/releasing.md#code-docs-generators).
