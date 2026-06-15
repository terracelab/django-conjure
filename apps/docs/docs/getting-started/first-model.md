# Your first model

Registering a model is the one piece of code you write. It looks — deliberately — like a
Django `ModelAdmin`. Put it in an `admin_config.py` and Conjure finds it automatically.

## Create `admin_config.py`

In any installed app, add a file named `admin_config.py`:

```python title="myapp/admin_config.py"
from conjure import register, AdminConfig
from myapp.models import Product


@register(Product)  # (1)!
class ProductConfig(AdminConfig):
    list_display = ["name", "price", "is_active", "created_at"]
    search_fields = ["name", "sku"]
    list_filter = ["is_active", "category"]
    ordering = ["-created_at"]
```

1.  `@register` adds the model to the registry. Like `admin.site.register`, but the
    config class carries the per-model behaviour.

That's it. The next time the server boots, `Product` is in the schema and — in
[runtime mode](first-screen.md) — in the sidebar.

!!! tip "Auto-inference: registration is optional"
    `@register(Product)` with an *empty* config is valid. If you don't declare
    `list_display`, Conjure infers sensible columns from the model's fields. Declare a
    config only to curate.

## What the config controls

These are the attributes Conjure reads off your config. They mirror Django admin where it
makes sense.

| Attribute | Type | Effect |
|---|---|---|
| `list_display` | `list[str]` | Columns in the list view (model fields). |
| `search_fields` | `list[str]` | Fields the `?search=` box queries (icontains). |
| `list_filter` | `list[str]` | Fields exposed as filter controls. |
| `ordering` | `list[str]` | Default sort; `-` prefix descends. |
| `is_readonly` | `bool` | Block all writes (logs / history models). |
| `inlines` | `list[tuple]` | Child models edited on the parent's detail page — `[(Image, "product")]`. |
| `list_select_related` | `list[str]` | FK fields to `select_related` for list speed. |

See [Registering models](../guides/registering-models.md) for the full set and recipes.

## Read-only models

For logs, history, and ledger tables, set `is_readonly` — the screen renders a
list + detail dialog with **no create, edit, bulk, or delete**, and the backend rejects
writes too (parity with Django admin's `has_*_permission = False`).

```python
@register(AuditEvent)
class AuditEventConfig(AdminConfig):
    list_display = ["actor", "action", "created_at"]
    is_readonly = True  # (1)!
```

1.  Enforced on the server, not just hidden in the UI.

## Inlines (child models)

Edit child rows right on the parent's detail page:

```python
@register(Product)
class ProductConfig(AdminConfig):
    list_display = ["name", "price"]
    inlines = [(ProductImage, "product")]  # (child model, FK field name)
```

`ProductImage` rows now appear as an inline table on each `Product` detail page, saved
atomically with the parent.

## Permissions come for free

You did **not** wire up any permissions. Conjure maps Django's standard model permissions
onto the screen automatically:

| Django permission | Effect in Conjure |
|---|---|
| `view_product` | Can open the list / detail |
| `add_product` | "New" button + create form |
| `change_product` | Edit forms + bulk update |
| `delete_product` | Delete + bulk delete |

`is_staff` is the gate to reach the admin at all; superusers pass everything. This is the
*same* `Group` / `Permission` data your Django admin uses — see
[Migrating from Django admin](../migrating/from-django-admin.md).

Next: **[open your first screen →](first-screen.md)**
