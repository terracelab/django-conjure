# Configuration

All of Conjure's settings live under one key, **`CONJURE`**, in your Django `settings.py`.
Every key is optional; the defaults are sensible for an internal admin.

```python title="settings.py"
CONJURE = {
    "AUTH": "session",
    "BRAND": {"name": "Acme Admin", "accent": "#4f46e5"},
    "PAGE_SIZE": 50,
    "AUDIT": True,
    # "USER_PAYLOAD": "myapp.hooks.payload",   # for custom user models
}
```

## Settings reference

!!! note "Auto-generated below"
    The table below is generated from the package by
    [`gen/gen_config_reference.py`](../contributing/releasing.md#code-docs-generators) and
    written to `_generated_config.md`. When `conjure/conf.py` exists it's parsed directly;
    until then the generator mirrors the table in `PACKAGE_GUIDE`. **Don't edit the table
    by hand — edit the source and re-run the generator.**

--8<-- "reference/_generated_config.md"

## Authentication modes

=== "Session (default)"

    ```python
    CONJURE = {"AUTH": "session"}
    ```

    Reuses your Django session login. No tokens to issue or store. Best when the admin is
    served from the same domain as your Django app.

=== "JWT"

    ```python
    CONJURE = {"AUTH": "jwt"}
    ```

    Staff-only SimpleJWT access/refresh tokens, for a separately-hosted SPA. The dashboard
    logs in at `POST /conjure/auth/login/` and refreshes on 401. See the
    [REST API reference](rest-api.md#authentication).

## Custom user models

If your `AUTH_USER_MODEL` isn't the default, point `USER_PAYLOAD` at a callable to shape the
"who am I" response after login:

```python title="settings.py"
CONJURE = {"USER_PAYLOAD": "myapp.hooks.payload"}
```

```python title="myapp/hooks.py"
def payload(user):
    return {
        "id": user.pk,
        "username": user.get_username(),
        "name": user.get_full_name(),
        "is_superuser": user.is_superuser,
    }
```

The default uses `get_username()` and `get_full_name()`, so most projects don't need this.
The audit log's actor is keyed off `AUTH_USER_MODEL`, so custom user models work without
configuration.

## Frontend env (codegen mode)

Theme colors for the React app are env vars (no code change). See
[Theming](../guides/theming.md) for the full list — and the **quote-your-hex** warning.

| Variable | Purpose |
|---|---|
| `VITE_PROXY_TARGET` | Dev backend origin for the API proxy. |
| `VITE_API_BASE_URL` | API origin for a separately-hosted SPA build. |
| `VITE_COLOR_ACCENT` | Brand / primary action color (the one you usually set). |
| `VITE_COLOR_SIDEBAR` | Dark sidebar background. |
| `VITE_COLOR_*` | `SUCCESS` / `WARNING` / `DANGER` / `INFO` / `GAIN` / `LOSS`. |
