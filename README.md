<div align="center">

# ✦ Conjure

### Conjure your Django admin — read your models, summon the admin.

[![PyPI](https://img.shields.io/pypi/v/django-conjure?color=4f46e5&label=django-conjure)](https://pypi.org/project/django-conjure/)
[![Docs](https://img.shields.io/badge/docs-docs.conjure.terracelab.dev-4f46e5)](https://docs.conjure.terracelab.dev)
[![CI](https://github.com/terracelab/django-conjure/actions/workflows/ci.yml/badge.svg)](https://github.com/terracelab/django-conjure/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)
[![Python](https://img.shields.io/pypi/pyversions/django-conjure)](https://pypi.org/project/django-conjure/)

*by [Terrace Lab](https://terracelab.dev)*

</div>

---

Conjure reads your Django models' metadata and **summons** an admin backend: a generic CRUD
REST API plus a schema your frontend can read — with Django permissions and an audit log, in
two lines. Attach it to any project; it touches your existing apps only to *read* them.

```python
# settings.py
INSTALLED_APPS += ["conjure"]
```
```python
# urls.py
urlpatterns += [path("conjure/", include("conjure.urls"))]
```
```python
# myapp/admin_config.py  — discovered automatically, just like admin.py
from conjure import register, AdminConfig
from myapp.models import Product

@register(Product)
class ProductConfig(AdminConfig):
    list_display = ["name", "price", "is_active"]
    search_fields = ["name"]
```

That's it — `Product` now has a list / search / filter / CRUD REST surface plus the schema to
drive a UI. [Read the 5-minute guide →](https://docs.conjure.terracelab.dev/getting-started/)

## Why Conjure

- **Two-line install.** `contrib.auth` is the only hard dependency. It reads your models; it doesn't fork your project.
- **An API + schema you own.** The schema endpoint feeds codegen — emit plain React you can edit per page — or any client you like.
- **Permissions you already have.** Django `Group`/`Permission`/`is_staff` — shared with Django admin, managed in one place.
- **Extend without forking.** Field renderers, dashboard widgets, and actions register through public hooks.

## The React dashboard (in progress)

The matching dashboard lives in [`packages/web`](./packages/web) (React + Vite). For the
`0.1.x` line it ships as **source, not a package**: the runtime renderer covers list views
today, and per-page **codegen** lets you own the output. An install-and-go bundled dashboard
and a published frontend package are on the [roadmap](https://docs.conjure.terracelab.dev/roadmap/).
Until then, point any client at the REST API + schema.

|  | django-unfold / jazzmin | react-admin / Refine | **Conjure** |
|---|---|---|---|
| Form | Django admin theme | runtime JS config | REST API + schema → codegen / runtime |
| Code ownership | ✗ | △ | ✅ you own the generated React |
| Backend install-and-go | n/a | n/a | ✅ API in two lines |
| Per-page customization | limited | △ | ✅ |
| Permissions | Django perms | separate | Django perms (shared) |

## Monorepo layout

```
django-conjure/
├── packages/
│   ├── conjure/      # PyPI: django-conjure  — Django app (introspection, CRUD API, auth, audit)
│   └── web/          # React dashboard + codegen (source; npm publish on the roadmap)
├── apps/
│   ├── docs/         # docs site (MkDocs Material + mike, versioned)
│   └── landing/      # brand / marketing site (Astro)
└── brand/            # tokens.css + BRAND.md — one source for all surfaces
```

## Develop

```bash
make install     # python (editable) + pnpm + docs deps
make test        # pytest (packages/conjure)
make docs-serve  # live docs at localhost:8000
make web         # build the React dashboard
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full dev setup, the
["docs ship with the release"](https://docs.conjure.terracelab.dev/contributing/releasing/) flow,
and the [extension SDK](https://docs.conjure.terracelab.dev/customization/).

## Status

Conjure is extracted from a production internal admin (75 models, ~150 routes). The core
(introspection, CRUD, permissions, audit, widgets) is battle-tested; the runtime renderer,
action/permission system, and CLI scaffolder are on the [roadmap](https://docs.conjure.terracelab.dev/roadmap/).

## License

[MIT](./LICENSE) © Terrace Lab
