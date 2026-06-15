# Registering models

`AdminConfig` is where you describe a model. It's read on app `ready()` from each app's
`admin_config.py` — auto-discovered like `admin.py`, so there's no central file to edit.

## The minimum

```python title="myapp/admin_config.py"
from conjure import register, AdminConfig
from myapp.models import Product


@register(Product)
class ProductConfig(AdminConfig):
    pass
```

With an empty config, Conjure **infers** columns and form fields from the model. Declaring
attributes is purely to curate.

## Config attributes

| Attribute | Type | Default | Effect |
|---|---|---|---|
| `list_display` | `list[str]` | inferred | Columns shown in the list. |
| `search_fields` | `list[str]` | `[]` | Fields the `?search=` box matches (icontains). |
| `list_filter` | `list[str]` | `[]` | Fields exposed as filter controls. |
| `ordering` | `list[str]` | model `Meta` | Default sort order; `-` descends. |
| `list_select_related` | `list[str]` | `[]` | FK fields to `select_related` for list queries. |
| `is_readonly` | `bool` | `False` | Block all writes (server-enforced). |
| `inlines` | `list[tuple]` | `[]` | `(child_model, fk_field)` pairs edited on the detail page. |
| `readonly_fields` | `list[str]` | `[]` | Fields shown but not editable in the form. |
| `exclude` | `list[str]` | `[]` | Fields hidden from schema, form, and responses. |

!!! warning "Sensitive fields"
    Always `exclude` secrets. The bundled `User` config, for example, drops `password`
    from the schema, responses, *and* forms entirely — never round-trip a password hash.

## Curating the list view

```python
@register(Order)
class OrderConfig(AdminConfig):
    list_display = ["number", "customer", "total", "status", "created_at"]
    list_select_related = ["customer"]   # avoid N+1 on the customer column
    search_fields = ["number", "customer__email"]
    list_filter = ["status", "created_at"]
    ordering = ["-created_at"]
```

`search_fields` supports lookups across relations (`customer__email`). `list_filter`
exposes each field as a filter the frontend renders by type (choices → select, dates →
range, booleans → toggle). See [Field support](../reference/field-support.md) for the full
field-type → control matrix.

## Read-only models

For logs, history, and ledgers, set `is_readonly`. The list + detail render, but create,
edit, bulk, and delete are removed from the UI **and rejected by the server**.

```python
@register(StockTransaction)
class StockTransactionConfig(AdminConfig):
    list_display = ["symbol", "qty", "price", "executed_at"]
    is_readonly = True
```

This is parity with Django admin's `has_add/change/delete_permission = False`, enforced in
one place.

## Inlines

Edit child rows on the parent's detail page. Saves are atomic (the parent and its inline
rows commit in one transaction).

```python
@register(Poll)
class PollConfig(AdminConfig):
    list_display = ["question", "is_active"]
    inlines = [(PollOption, "poll")]   # (child model, FK field pointing back to Poll)
```

Inline-only child models don't need their own sidebar entry — register the parent and the
inline appears on its detail page. (The child's API endpoint still exists.)

## Special primary keys

Conjure introspects the PK type. A model with a UUID or string PK (e.g.
`order_uuid = UUIDField(primary_key=True)`) is handled automatically — the REST routes use
the right converter and the frontend treats the pk as a string. No configuration needed.

## After you register

- **Runtime mode** <span class="status planned">📋</span> — the model appears in the
  sidebar on the next boot. Done.
- **Codegen mode** <span class="status available">✅</span> — re-dump the schema snapshot
  and generate the page set. See [Custom pages](custom-pages.md) and the
  [CLI reference](../reference/cli.md).

```bash
# re-dump the schema snapshot after model/field changes (codegen mode)
python manage.py conjure_dump_schema   # → web/codegen/schema-snapshot.json
```

When a field changes, re-dump and regenerate the affected page; your `// @custom` edits
are preserved by a diff merge. The next guide covers that.
