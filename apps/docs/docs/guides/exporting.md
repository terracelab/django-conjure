# Exporting

Conjure can export list data to CSV — the full filtered set or just the rows you select.

## What's available today

<span class="status available">✅ available</span> CSV export, including **selection
export** (export only checked rows). Shipped on list pages like board posts and users.

```text
[ 3 selected ]  [ Export selected ]  [ ⋯ more ▾ ]
```

The export respects the **current filters and search**, so "export what I'm looking at"
works as expected.

## Client vs server export

There are two ways to produce the file, and the difference matters for **privacy**:

| | Client export | Server export |
|---|:--:|:--:|
| Where the CSV is built | Browser | Backend endpoint (streamed) |
| Speed to ship | Fast | Needs an endpoint |
| Honours action permissions | ✗ (anyone with view) | ✅ enforced server-side |
| Right choice for PII | **No** | **Yes** |

!!! danger "PII must export server-side"
    A client-only export can be triggered by anyone who can *view* the list, bypassing any
    "export" permission. For personal data (user lists, contact info), implement export as
    a **server endpoint** so the permission is actually enforced. This is exactly why
    export folds into the [actions & permissions](../actions-permissions/index.md) system.

## How export fits actions & permissions

<span class="status planned">📋 planned</span> Export is modeled as a **spell** (an admin
action) so it shares one registry and one permission model with refunds, receipts, push,
etc. Declared backend-side:

```python title="conjure/actions.py (design)"
ADMIN_ACTIONS = [
    {"model": "user.User", "codename": "export", "name": "Export users",
     "kind": "server", "scope": "bulk"},   # PII → server, permission-gated
]
```

Running `python manage.py sync_admin_actions` creates the `user.export` permission, which
then appears as a checkbox on the relevant Django admin **Group** — so "only 3 of 10 admins
can export users" is just group membership. See
[Actions & permissions](../actions-permissions/index.md).

## Roadmap

| Item | Status |
|---|---|
| CSV export + selection export | <span class="status available">✅</span> |
| Server-side streaming export for PII models | <span class="status planned">📋</span> |
| Real `.xlsx` (formatted) export | <span class="status planned">📋</span> |
| "Export all N matching filter" (beyond current page) | <span class="status planned">📋</span> |

Because list pagination is server-side, today's selection export covers the current page;
exporting an entire filtered set is a separate streaming endpoint on the roadmap.
