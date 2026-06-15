# Installing, managing & updating

This is the operations guide for **consuming** Conjure in your Django project — how to apply
the pip package, manage it day to day, and upgrade it safely over time. For the 5-minute first
install, see [Getting started → Installation](../getting-started/installation.md); this page
goes deeper.

!!! abstract "What you depend on"
    | Artifact | Install from | Required? |
    |---|---|---|
    | `django-conjure` (Python) | PyPI | ✅ always |
    | `@terracelab/conjure-web` (React) | npm | only for **codegen mode** / a custom frontend |

    The **public contract** is the REST surface (`/conjure/*` + the schema JSON). It follows
    [SemVer](../contributing/releasing.md#versioning), and the Python and npm packages always
    ship the **same `X.Y.Z`** so the backend/frontend stay in lock-step. Internal Python
    modules (`conjure.viewsets`, etc.) are *not* a stable API — depend on the documented
    settings, registry, and REST shapes.

---

## Part 1 — Apply (install & integrate)

### 1.1 Install and pin

```bash
pip install django-conjure          # session auth (default)
pip install "django-conjure[jwt]"   # add the JWT auth mode (pulls in SimpleJWT)
```

Pin it like any dependency. Conjure is pre-1.0, so a **compatible-release** pin that allows
patches but not minors is the safe default while the API settles:

=== "requirements.txt"

    ```text
    django-conjure~=0.1.0        # >=0.1.0, <0.2.0  (patches only, pre-1.0)
    ```

=== "pyproject.toml"

    ```toml
    [project]
    dependencies = [
      "django-conjure~=0.1.0",
    ]
    ```

=== "Poetry"

    ```toml
    [tool.poetry.dependencies]
    django-conjure = "~0.1.0"
    ```

=== "uv"

    ```bash
    uv add "django-conjure~=0.1.0"
    ```

!!! warning "Keep the two packages on the same `X.Y`"
    If you also use the React package, pin it to the **same minor** as the Python package —
    they share the schema/REST contract. `django-conjure 0.1.x` ↔ `@terracelab/conjure-web 0.1.x`.
    Mixing minors (e.g. backend `0.2` + frontend `0.1`) is unsupported.

### 1.2 Wire it up

```python title="settings.py"
INSTALLED_APPS += ["rest_framework", "conjure"]   # rest_framework only if not already present

CONJURE = {
    "AUTH": "session",
    "BRAND": {"name": "Acme Admin", "accent": "#4f46e5"},
}
```

Conjure authenticates its own endpoints from `CONJURE["AUTH"]` (session, or JWT via the
`[jwt]` extra), so you don't touch DRF's global `DEFAULT_AUTHENTICATION_CLASSES`.

```python title="urls.py"
urlpatterns += [path("conjure/", include("conjure.urls"))]
```

```bash
python manage.py migrate conjure     # creates AdminAuditLog (optional but recommended)
```

That's the whole backend footprint — **two lines plus one migration**. Conjure reads your
models; it never edits your apps. See the full walk-through in
[Installation](../getting-started/installation.md) and
[Your first model](../getting-started/first-model.md).

### 1.3 Choose a delivery mode

| Mode | Status | How it's served | Manage it by… |
|---|---|---|---|
| **Codegen** (own the React) | ✅ available | build `@terracelab/conjure-web`, host `dist/` at the API | committing the generated `.tsx` to your repo |
| **Runtime SPA** (zero build) | 📋 planned | bundled SPA at `conjure.spa_urls` + `collectstatic` | nothing — models appear automatically |

Today, codegen mode + the REST API is the shipping path; runtime mode is on the
[roadmap](../roadmap.md). Both read the same schema, so you can migrate between them later
without touching the backend.

---

## Part 2 — Manage (day to day)

### 2.1 Models

Register or unregister models by editing each app's `admin_config.py` — it's auto-discovered
on startup, exactly like `admin.py`.

```python title="shop/admin_config.py"
from conjure import register, AdminConfig
from shop.models import Product

@register(Product)
class ProductConfig(AdminConfig):
    list_display = ["name", "price", "is_active"]
    search_fields = ["name"]
    is_readonly = False          # True for log/history models — blocks all writes
```

| You changed… | Do this |
|---|---|
| Added a model | `@register` it → (runtime) it appears; (codegen) generate its page set |
| Removed a model | delete its `@register` → it drops out of the schema/sidebar |
| Changed a field | re-dump the schema snapshot, then regenerate that page (codegen) — `// @custom` blocks are preserved |
| Tweaked list/search/filter | edit the `AdminConfig` attributes only |

See [Registering models](registering-models.md) and [Custom pages](custom-pages.md) for the
codegen regeneration flow. Turn off auto-discovery with `CONJURE = {"AUTODISCOVER": False}`
if you prefer to import configs yourself.

### 2.2 Permissions & roles

Conjure reuses Django's permission system — there is **one** source of truth, shared with
Django admin:

- Every endpoint requires `is_staff`.
- CRUD maps to the model permissions `view/add/change/delete_<model>`.
- Roles are Django **Groups**; assign staff to groups, check permissions on the group.
- Superusers pass everything.

Manage admins and roles in Django admin's Users/Groups screens (or your own UI). Because the
permissions are shared, a change there applies to both Django admin and Conjure. See
[Migrating → coexistence with Django admin](../migrating/from-django-admin.md) and the
[actions & permissions](../actions-permissions/index.md) design for per-action grants.

### 2.3 Configuration across environments

`CONJURE` is a plain settings dict, so manage it the way you manage the rest of `settings`
(env-specific modules, environment variables, etc.).

```python title="settings/prod.py"
CONJURE = {
    "AUTH": "jwt",                                  # separately-hosted SPA in prod
    "BRAND": {"name": "Acme Admin", "accent": "#4f46e5"},
    "USER_PAYLOAD": "acme.admin.hooks.payload",     # custom user model → any dict
    "PAGE_SIZE": 50,
    "AUDIT": True,
}
```

Every key is optional and falls back to a default. The full table is **generated from the
shipped `conf.py`** so it never drifts — see the
[Configuration reference](../reference/configuration.md). A custom `USER_PAYLOAD` is how you
support a custom `AUTH_USER_MODEL` without assuming any project-specific user fields.

### 2.4 Audit log

When you've run `migrate conjure`, every write is recorded in `AdminAuditLog` with a
before/after diff. Manage it as ordinary data:

- It's exposed (read-only) in the dashboard's audit page and the `recent-audit` widget.
- Prune it on your own schedule (e.g. a periodic `AdminAuditLog.objects.filter(created_at__lt=…).delete()`).
- Set `CONJURE = {"AUDIT": False}` to disable recording entirely.

### 2.5 Dashboard widgets

Add project-specific dashboard data without forking — register a widget from any app:

```python title="shop/widgets.py"
from conjure import register_widget

@register_widget("revenue")
def revenue(request):
    ...  # return any JSON; served at /conjure/widgets/revenue/
```

Conjure ships generic `recent-audit` and `model-counts` widgets out of the box. See
[Extension points](../customization/extension-points.md).

---

## Part 3 — Update (upgrade safely)

### 3.1 Know what you're on

```bash
pip show django-conjure | grep -i version
python -c "import conjure; print(conjure.__version__)"
```

### 3.2 Read the release notes first

Conjure is **SemVer**. Before upgrading, skim the
[CHANGELOG](https://github.com/terracelab/django-conjure/blob/main/CHANGELOG.md) and that
version's [docs](https://conjure.terracelab.dev) (the version switcher in the header lets you
read the docs for *your* version):

| Bump | Means | Your effort |
|---|---|---|
| **Patch** `0.1.0 → 0.1.1` | bug/security fix, no API change | upgrade, run migrations, done |
| **Minor** `0.1 → 0.2` | new features, possible deprecations | read notes; act on any deprecation warnings |
| **Major** `0.x → 1.0` | breaking REST/contract change | follow the migration guide in the release |

### 3.3 Upgrade

Bump the pin, then install. Upgrade **both** packages to the same `X.Y` together.

!!! tip "Back up first"
    Before a minor or major upgrade, back up your database (the upgrade may add a migration to
    Conjure's tables) and commit your working tree (so codegen regeneration is a clean diff).

=== "Python"

    ```bash
    # edit the pin (e.g. ~=0.2.0), then:
    pip install -U "django-conjure~=0.2.0"
    ```

=== "React package (if used)"

    ```bash
    # in your scaffolded web project
    npm i @terracelab/conjure-web@^0.2.0
    ```

### 3.4 Post-upgrade checklist

1. **Migrate** — a new version may ship schema changes for Conjure's own tables:
   ```bash
   python manage.py migrate conjure
   ```
2. **Refresh the schema snapshot & regenerate codegen pages** (codegen mode only) — if the
   upgrade changed templates or your models' schema, re-dump the snapshot and regenerate
   affected pages. `// @custom`-marked blocks are preserved on regeneration; commit first so
   you can diff.
   ```bash
   python manage.py conjure_dump_schema -o packages/web/codegen/schema-snapshot.json
   ```
   See [Custom pages](custom-pages.md).
3. **Re-run any sync commands** — e.g. `python manage.py sync_admin_actions` once the
   [actions system](../actions-permissions/index.md) ships (📋).
4. **Rebuild & redeploy the frontend** (codegen mode): `npm run build` in your web project.
5. **Smoke-test**:
   ```bash
   curl -s http://localhost:8000/conjure/schema/ | head   # staff session/token
   ```
   Then log in, list a model, create/edit/delete one row, and confirm the audit log records it.

### 3.5 Deprecations

A symbol slated for removal **warns for one minor release**, then is removed in the next major.
Watch your logs/test output for `DeprecationWarning`s after a minor upgrade and address them
before the next major — they're your early-warning system. Deprecations are listed in the
release notes and a deprecation table in the docs.

### 3.6 Rolling back

If an upgrade misbehaves, pin back and reinstall:

```bash
pip install "django-conjure==0.1.3"
```

!!! danger "Reversing migrations"
    Only reverse a Conjure migration if the newer version actually added one *and* you
    understand it. `python manage.py migrate conjure <previous_number>` rolls the
    `AdminAuditLog` schema back; it can drop columns/data added by the newer version. Back up
    first. Most patch/minor upgrades need no migration reversal — re-pinning the package is
    enough.

---

## Compatibility & support

| Component | Supported |
|---|---|
| Python | 3.10, 3.11, 3.12, 3.13 |
| Django | 4.2 LTS, 5.x |
| Django REST Framework | 3.15+ |
| Node (codegen mode only) | 18+ |

Security and bug fixes land on the **latest minor**; older minors are best-effort. The CI
matrix tests every supported Python × Django combination on each change, so a green release
is verified against this table. Report problems via
[GitHub issues](https://github.com/terracelab/django-conjure/issues) or, for vulnerabilities,
the private path in [SECURITY.md](https://github.com/terracelab/django-conjure/blob/main/SECURITY.md).

## Troubleshooting upgrades

??? question "`ImproperlyConfigured: CONJURE['AUTH'] == 'jwt' requires …`"
    JWT mode needs the optional extra: `pip install "django-conjure[jwt]"`.

??? question "Frontend shows stale fields / 'unknown model' after a model change"
    The schema snapshot is out of date. Re-dump it and regenerate the affected page
    (codegen mode). See [Custom pages](custom-pages.md).

??? question "Backend and dashboard disagree after an upgrade"
    The two packages drifted across a minor. Align them: both on the same `X.Y`.

??? question "Audit log stopped recording after upgrade"
    Run `python manage.py migrate conjure` — a new version may have added an audit-table
    migration. Conjure skips audit writes silently when the table is behind.
