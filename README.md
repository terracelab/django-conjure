<div align="center">

# ✦ Conjure

### Conjure your Django admin — read your models, summon the admin.

[![PyPI](https://img.shields.io/pypi/v/django-conjure?color=4f46e5&label=django-conjure)](https://pypi.org/project/django-conjure/)
[![npm](https://img.shields.io/npm/v/@terracelab/conjure-web?color=4f46e5&label=conjure-web)](https://www.npmjs.com/package/@terracelab/conjure-web)
[![Docs](https://img.shields.io/badge/docs-conjure.terracelab.dev-4f46e5)](https://conjure.terracelab.dev)
[![CI](https://github.com/terracelab/django-conjure/actions/workflows/ci.yml/badge.svg)](https://github.com/terracelab/django-conjure/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)
[![Python](https://img.shields.io/pypi/pyversions/django-conjure)](https://pypi.org/project/django-conjure/)

*by [Terrace Lab](https://terracelab.dev)*

</div>

---

Conjure reads your Django models' metadata and **summons** an admin: a generic CRUD REST API
plus a modern React dashboard. Attach it to any project in two lines — it touches your existing
apps only to *read* them.

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

That's it — `Product` now has a list/search/filter/CRUD screen. [Read the 5-minute guide →](https://conjure.terracelab.dev/getting-started/)

## Why Conjure

- **Two-line install.** `contrib.auth` is the only hard dependency. It reads your models; it doesn't fork your project.
- **You own the output.** Codegen emits plain React you can edit per page — or run the runtime renderer and write zero frontend.
- **Permissions you already have.** Django `Group`/`Permission`/`is_staff` — shared with Django admin, managed in one place.
- **Extend without forking.** Field renderers, dashboard widgets, and actions register through public hooks.

|  | django-unfold / jazzmin | react-admin / Refine | **Conjure** |
|---|---|---|---|
| Form | Django admin theme | runtime JS config | codegen + (optional) runtime |
| Code ownership | ✗ | △ | ✅ you own the output |
| Install-and-go | ✅ | △ | ✅ (runtime mode) |
| Per-page customization | limited | △ | ✅ |
| Permissions | Django perms | separate | Django perms (shared) |

## Monorepo layout

```
django-conjure/
├── packages/
│   ├── conjure/      # PyPI: django-conjure  — Django app (introspection, CRUD API, auth, audit)
│   └── web/          # npm:  @terracelab/conjure-web — React dashboard + codegen
├── apps/
│   ├── docs/         # docs site (MkDocs Material + mike, versioned)
│   └── landing/      # brand / marketing site (Astro)
├── examples/
│   └── demo-shop/    # runnable Django project — the live demo
└── brand/            # tokens.css + BRAND.md — one source for all three surfaces
```

## Develop

```bash
make install     # python (editable) + pnpm + docs deps
make test        # pytest (packages/conjure)
make docs-serve  # live docs at localhost:8000
make demo        # run the example admin
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full dev setup, the
["docs ship with the release"](https://conjure.terracelab.dev/contributing/releasing/) flow,
and the [extension SDK](https://conjure.terracelab.dev/customization/).

## Status

Conjure is extracted from a production internal admin (75 models, ~150 routes). The core
(introspection, CRUD, permissions, audit, widgets) is battle-tested; the runtime renderer,
action/permission system, and CLI scaffolder are on the [roadmap](https://conjure.terracelab.dev/roadmap/).

## License

[MIT](./LICENSE) © Terrace Lab
