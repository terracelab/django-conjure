# REST API

The REST contract is Conjure's **public API** — the frontend talks to it 1:1, and it
follows [SemVer](../contributing/releasing.md#versioning). The base path is whatever you
mounted (`path("conjure/", include("conjure.urls"))`); examples below assume `/conjure/`.

!!! note "Stable contract"
    The URL shapes and query parameters on this page are a frozen contract between backend
    and frontend. Breaking changes to them are major-version changes.

## Schema (introspection)

```text
GET /conjure/schema/                  # all registered models
GET /conjure/schema/{app}.{Model}/    # one model
```

Returns field metadata (types, choices, FK targets, inlines), per-model permissions for the
current user, and — once the [actions system](../actions-permissions/index.md) ships — the
user's `allowed_actions`. Both codegen and runtime modes read this.

## Generic CRUD

A single generic viewset serves every registered model under a `{app}.{Model}` key:

| Method & path | Action |
|---|---|
| `GET /conjure/r/{app}.{Model}/` | List (paginated, filtered, sorted). |
| `POST /conjure/r/{app}.{Model}/` | Create. |
| `GET /conjure/r/{app}.{Model}/{pk}/` | Retrieve one. |
| `PATCH /conjure/r/{app}.{Model}/{pk}/` | Partial update. |
| `DELETE /conjure/r/{app}.{Model}/{pk}/` | Delete. |
| `GET /conjure/r/{app}.{Model}/autocomplete/?q=&page=` | FK search (combobox). |
| `POST /conjure/r/{app}.{Model}/bulk/` | Bulk + atomic inline operations. |
| `GET /conjure/r/{app}.{Model}/{pk}/related/` | Count objects a delete would affect. |
| `POST /conjure/r/{app}.{Model}/action/{key}/` | Run an action. 📋 |

The `{pk}` converter adapts to the model's PK type (int, UUID, or string) automatically.

### List query parameters

| Parameter | Meaning |
|---|---|
| `page` | 1-based page number. |
| `page_size` | Rows per page (capped by `MAX_PAGE_SIZE`). |
| `ordering` | Sort field; `-` prefix for descending. |
| `search` | Full-text-ish search across the config's `search_fields`. |
| `{field}={value}` | Exact-match filter on a field. |
| `{field}__gte=`, `{field}__lte=` | Range filters (dates, numbers). |

```bash
curl -s "http://localhost:8000/conjure/r/order.Order/?status=paid&ordering=-created_at&page_size=20"
```

### Serialized rows

The dynamic serializer adds display helpers so the frontend renders labels without extra
round-trips: a top-level `_label`, `{fk}_label` for each foreign key, and `{field}_display`
for fields with `choices`.

## Bulk

```text
POST /conjure/r/{app}.{Model}/bulk/
body: { "action": "delete" | "update", "ids": [...], "data": { ... } }
```

Bulk delete / update, and atomic inline saves, run in a single transaction.

## Authentication

=== "Session"

    Send the Django session cookie (and CSRF token for writes). No extra endpoints — if the
    user is logged in and `is_staff`, requests are authorized.

=== "JWT"

    ```text
    POST /conjure/auth/login/      body: { "username": "...", "password": "..." }  -> { access, refresh }
    POST /conjure/auth/refresh/    body: { "refresh": "..." }                      -> { access }
    GET  /conjure/auth/me/         -> current user payload (see USER_PAYLOAD)
    ```

    Staff-only. The dashboard's API client stores the token and refreshes on 401
    automatically.

## Permissions

Every endpoint is gated by `is_staff`, then by the matching Django model permission
(`view_*` / `add_*` / `change_*` / `delete_*`); superusers pass everything. This is the same
permission data Django admin uses — see
[Migrating from Django admin](../migrating/from-django-admin.md).

## Widgets

```text
GET /conjure/widgets/{name}/    # built-in: recent-audit, model-counts — add your own with @register_widget
```

Dashboard data sources, registered via `@register_widget`. See
[Extension points](../customization/extension-points.md).

## Auto-generated OpenAPI

!!! info "Planned generator"
    <span class="status planned">📋</span> A future docs generator (`gen/gen_openapi.py`)
    will embed the live OpenAPI schema (via **drf-spectacular**) so this page is generated
    from the running API rather than maintained by hand. See
    [the generators README](../contributing/releasing.md#code-docs-generators).
