# django-conjure

> Conjure your Django admin — read your models, summon a CRUD API and dashboard.

The Python half of [Conjure](https://conjure.terracelab.dev). It introspects your models and
serves a generic admin REST API (`/conjure/`) that the React package
[`@terracelab/conjure-web`](https://www.npmjs.com/package/@terracelab/conjure-web) renders.

## Install

```bash
pip install django-conjure          # session auth (default)
pip install "django-conjure[jwt]"   # add JWT auth mode
```

```python
# settings.py
INSTALLED_APPS += ["conjure"]

CONJURE = {
    "AUTH": "session",                       # or "jwt"
    "BRAND": {"name": "My Admin", "accent": "#4f46e5"},
    # "USER_PAYLOAD": "myapp.hooks.payload", # custom user model? return any dict
}
```

```python
# urls.py
urlpatterns += [path("conjure/", include("conjure.urls"))]
```

```bash
python manage.py migrate conjure   # AdminAuditLog table (audit log, optional but recommended)
```

## Register a model

Drop an `admin_config.py` into any app — it's discovered automatically, like `admin.py`:

```python
from conjure import register, AdminConfig
from myapp.models import Product

@register(Product)
class ProductConfig(AdminConfig):
    list_display = ["name", "price", "is_active"]
    search_fields = ["name"]
    list_filter = ["is_active"]
    inlines = [(ProductImage, "product")]   # inline child editing
    is_readonly = False                     # True => log/history models, blocks writes
```

Anything you leave unset is inferred from the model's fields.

## What you get

- `GET /conjure/schema/` + `…/schema/{app.Model}/` — model introspection (codegen + runtime source)
- `GET/POST /conjure/r/{app.Model}/` and `…/{pk}/` — generic CRUD
- `…/autocomplete/`, `…/bulk/` (atomic inline ops), `…/{pk}/related/` (delete impact)
- Django-permission gating (`view/add/change/delete`, shared with Django admin), `is_staff` required
- Audit log with before/after diff, staff auth (session or JWT), dashboard widget registry

## Extend without forking

```python
from conjure import register_widget

@register_widget("signup-trend")
def signup_trend(request):
    ...  # return any JSON; served at /conjure/widgets/signup-trend/
```

Full docs, the settings reference, the REST contract, and the extension SDK live at
**[conjure.terracelab.dev](https://conjure.terracelab.dev)**.

## Develop

```bash
pip install -e ".[dev]"
pytest
ruff check . && ruff format --check .
```

MIT © Terrace Lab
