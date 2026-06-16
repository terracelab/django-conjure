---
title: Conjure
hide:
  - navigation
---

<div class="conjure-hero" markdown>

# ✦ Conjure

<p class="conjure-tagline">Conjure your admin.</p>

Conjure reads your Django models' metadata and **summons** an admin — a generic CRUD
REST API plus a modern React dashboard. Attach it to any project in two lines; it
touches your existing apps only to *read* them.

[Get started in 5 minutes](getting-started/index.md){ .md-button .md-button--primary }
[Why Conjure](#why-conjure){ .md-button }

</div>

## The 30-second version

Add the app, point a URL at it, and describe a model the way you would in `admin.py`.
That's the whole ceremony.

```python title="settings.py"
INSTALLED_APPS += ["conjure"]
```

```python title="myapp/admin_config.py — discovered automatically, like admin.py"
from conjure import register, AdminConfig
from myapp.models import Product


@register(Product)  # (1)!
class ProductConfig(AdminConfig):
    list_display = ["name", "price", "is_active"]
    search_fields = ["name"]
```

1.  `admin_config.py` files are auto-discovered on app `ready()`, exactly the way
    Django finds your `admin.py`. No central registry to edit.

`Product` now has a list / search / filter / CRUD screen. In **codegen mode** you generate
plain React you own and edit per page (today's stable path). A **runtime mode** that lets a
registered model appear in the sidebar with zero frontend code is on the roadmap — the
runtime renderer covers list views today, with create/edit as a documented stub.

!!! tip "Two modes, one schema"
    Both modes read the *same* introspection schema. Generate codegen pages today, and
    when the runtime renderer lands you'll be able to start there and **eject** any page
    to codegen when you need it to be special.
    See [Your first screen](getting-started/first-screen.md).

## Why Conjure

<div class="grid cards" markdown>

-   :material-flash: __Two-line install__

    `contrib.auth` is the only hard dependency. Conjure reads your models; it does not
    fork your project or ask you to re-declare them.

-   :material-code-braces: __You own the output__

    Codegen emits ordinary React you can edit page by page — or run the runtime
    renderer and write zero frontend. Your call, per screen.

-   :material-shield-key: __Permissions you already have__

    Django `Group` / `Permission` / `is_staff`, shared with Django admin and managed in
    one place. No second permission system to keep in sync.

-   :material-puzzle: __Extend without forking__

    Field renderers, dashboard widgets, and actions register through public hooks —
    [`register_field`](customization/extension-points.md), `register_widget`,
    `ADMIN_ACTIONS`.

</div>

## How it compares

|  | django-unfold / jazzmin | react-admin / Refine | **Conjure** |
|---|---|---|---|
| Form | Django admin theme | runtime JS config | codegen (runtime planned) |
| Code ownership | ✗ | △ | ✅ you own the output |
| Install-and-go | ✅ | △ | △ (runtime mode planned) |
| Per-page customization | limited | △ | ✅ |
| Permissions | Django perms | separate | **Django perms (shared)** |

Conjure sits between "themed Django admin" and "build-your-own JS admin": code-ownership
like the latter today, install-and-go (runtime mode) once it lands, on the permissions you
already trust.

## Where to next

<div class="grid cards" markdown>

-   __:material-rocket-launch: Getting started__

    [Install](getting-started/installation.md) → [first model](getting-started/first-model.md) →
    [first screen](getting-started/first-screen.md).

-   __:material-book-open-variant: Guides__

    [Register models](guides/registering-models.md), [theme](guides/theming.md),
    [organize the sidebar](guides/sections-and-tabs.md), [export](guides/exporting.md).

-   __:material-wrench: Reference__

    [Configuration](reference/configuration.md), [REST API](reference/rest-api.md),
    [CLI](reference/cli.md), [field support](reference/field-support.md).

-   __:material-map: Roadmap__

    Runtime SPA bundling, actions & permissions, and more —
    [see what's coming](roadmap.md).

</div>

---

*Conjure is by [Terrace Lab](https://terracelab.co.kr). PyPI: `django-conjure` ·
React dashboard: scaffold with `npx @terracelab/conjure-web init` · MIT licensed.*
