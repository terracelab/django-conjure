# Installation

Conjure attaches to an existing project with **two lines of code** plus one migration.
It reads your models; it never edits them.

## 1. Install the package

```bash
pip install django-conjure
```

The import name is `conjure` (the PyPI distribution is `django-conjure`). The only hard
dependencies are `django.contrib.auth` and Django REST Framework.

## 2. Add the app

```python title="settings.py"
INSTALLED_APPS += [
    "rest_framework",  # Conjure builds on Django REST Framework (skip if already installed)
    "conjure",
]

CONJURE = {  # (1)!
    "AUTH": "session",  # reuse your Django login everywhere; or "jwt"
    "BRAND": {"name": "Acme Admin", "accent": "#4f46e5"},
}
```

1.  The top-level settings key is **`CONJURE`**. Every key is optional — the block above
    is just to show the two you most often set. See the
    [Configuration reference](../reference/configuration.md) for all keys and defaults.

On app `ready()`, Conjure auto-discovers an `admin_config.py` in each installed app, the
same way Django finds `admin.py`. There is no central registry file to maintain.

!!! tip "Authentication is self-contained"
    Conjure's endpoints authenticate themselves according to `CONJURE["AUTH"]` — session by
    default, or JWT (`pip install "django-conjure[jwt]"`). You **don't** need to change DRF's
    global `DEFAULT_AUTHENTICATION_CLASSES`, so enabling JWT for the admin won't affect your
    project's other APIs.

## 3. Wire up the URLs

```python title="urls.py"
from django.urls import include, path

urlpatterns += [
    path("conjure/", include("conjure.urls")),          # REST API (schema + CRUD)
]
```

!!! info "Serving the dashboard"
    `conjure.urls` is the REST API. The React dashboard is served separately:
    in **codegen mode** <span class="status available">✅</span> you build
    `@terracelab/conjure-web` and host its `dist/` (your own static hosting, WhiteNoise, or a
    CDN) pointed at this API. A bundled zero-build **runtime SPA** mounted at
    `conjure.spa_urls` is <span class="status planned">📋 planned</span> (see the
    [roadmap](../roadmap.md)). Either way, the `conjure/` API include above is all the
    backend needs.

## 4. Migrate the audit log

```bash
python manage.py migrate conjure
```

This creates a single table, `AdminAuditLog`, used to record a diff of every write.

!!! tip "CRUD works before you migrate"
    The schema, CRUD, and widget endpoints all work *without* this migration —
    `conjure` only silently skips audit writes if the table is missing. Run it when you
    want the "recent activity" widget and the audit log page to fill in.

## 5. Verify

Start your server and hit the schema endpoint with a staff session or token:

```bash
curl -s http://localhost:8000/conjure/schema/ | head
```

A JSON object keyed by `app.Model` confirms the install. You haven't registered anything
yet, so it may be empty — that's expected. Next:
**[register your first model →](first-model.md)**

## Compatibility

| Component | Supported |
|---|---|
| Python | 3.10, 3.11, 3.12, 3.13 |
| Django | 4.2 LTS, 5.x |
| Django REST Framework | 3.15+ |
| Node (codegen mode only) | 18+ |

The REST contract (`/conjure/*` + the schema JSON) is the public API and follows
[SemVer](../contributing/releasing.md#versioning); the Python and npm packages always
ship the same `X.Y.Z`.
