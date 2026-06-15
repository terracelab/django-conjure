# Docs generators — code → docs sync

These scripts keep reference docs **generated from the code** so they can't drift. This is a
headline Conjure principle: the docs ship with the release, and the parts that describe the
code are produced *from* the code.

Each generator writes a Markdown partial into `apps/docs/docs/`, which a hand-written page
pulls in via the pymdownx **snippet include** (`--8<-- "path/to/_generated.md"`). The
generators run in CI before `mkdocs build`, and again in the release job, so the published
site always matches the shipped package. See
[`contributing/releasing.md`](../docs/contributing/releasing.md).

## Generators

| Script | Output | Source | Status |
|---|---|---|---|
| `gen_config_reference.py` | `docs/reference/_generated_config.md` | `packages/conjure/conjure/conf.py` (`DEFAULTS`) | ✅ implemented |
| `gen_openapi.py` | `docs/reference/_generated_openapi.md` | drf-spectacular OpenAPI | 📋 TODO stub |
| `gen_cli.py` | `docs/reference/_generated_cli.md` | management-command `--help` | 📋 TODO stub |

## Run them

```bash
cd apps/docs
python gen/gen_config_reference.py     # implemented
# python gen/gen_openapi.py            # stub — see file
# python gen/gen_cli.py                # stub — see file
```

No arguments; each script resolves its own paths relative to the repo root.

## `gen_config_reference.py` (implemented)

Generates the `CONJURE` settings table.

**How it works**

1. **Parse, don't import.** It reads `packages/conjure/conjure/conf.py` with Python's `ast`
   module — no `import`, no Django `settings` configured, no dependencies required. This is
   what lets it run in CI before anything is installed.
2. **Find the defaults dict.** It looks for a top-level `CONJURE_DEFAULTS` or `DEFAULTS`
   dict assignment.
3. **Flatten + describe.** Nested dicts become dotted keys (`BRAND` → `BRAND.name`,
   `BRAND.accent`). Each key is paired with a human description from a small map in the
   script; defaults are rendered from the literal values.
4. **Fallback.** If `conf.py` (or the dict) isn't there yet, it emits a table mirroring the
   authored `PACKAGE_GUIDE` settings table, so the docs always build. The output carries a
   note saying which source was used.
5. **Write the partial.** Output goes to `docs/reference/_generated_config.md`, included by
   `reference/configuration.md`.

**To extend:** when you add a setting to `conf.py`'s `DEFAULTS`, add a one-line description
to the `DESCRIPTIONS` map in `gen_config_reference.py`. The key and default are picked up
automatically; the description is the only manual bit.

## TODO generators

### `gen_openapi.py` (📋)

Will emit the REST API reference from the live OpenAPI schema produced by **drf-spectacular**
(`manage.py spectacular`). Needs a configured Django project (the example project in
`examples/demo-shop`), so it runs after deps are installed — unlike the AST-based config
generator. See the stub for the intended steps.

### `gen_cli.py` (📋)

Will capture each management command's `--help` output and render a reference, again using
the example project. See the stub.

## Future generators (from PROJECT_OPERATIONS §4)

Two more code→docs sources are planned beyond the scripts above:

- **Field-type support matrix** ← extracted from the field-renderer registry (currently the
  hand-maintained [`reference/field-support.md`](../docs/reference/field-support.md)).
- **Component catalog** ← snapshot of the `/style-guide` page.
