# Actions & permissions

!!! info "Status: 📋 Planned / Design complete"
    The action and permission system is **designed, not yet implemented**. This page
    documents the agreed design so you can plan around it. Track it on the
    [roadmap](../roadmap.md) (P4).

An **action** (a *spell*, in Conjure's vocabulary) is something you do *to* rows beyond
CRUD: export, issue a tax invoice, print a receipt, refund, send a push. The design lets
you declare actions once, gate them per role, and enforce them on the server.

## Four principles

1. **Permission = (action × model).** Django permission codenames are bound to a model's
   `ContentType`, so `order.print_receipt` and `subscription.print_receipt` are *different*
   permissions. "Allowed on Orders but not on Subscriptions" falls out naturally — no
   special casing.
2. **Group = role.** You don't manage N admins × M permissions directly. Define ~5–8 role
   groups with permission checklists and assign admins to groups. The Django admin Group
   editor *is* your model-permission matrix.
3. **Permissions are data, not migrations.** Instead of `Meta.permissions` (which needs a
   migration), a `sync_admin_actions` command idempotently `get_or_create`s the permission
   rows. **Zero migrations.**
4. **The server enforces; the frontend only hides.** The action endpoint checks
   `request.user.has_perm(...)`. Hiding a button is UX, not security.

## The flow

```mermaid
graph TD
  A["actions.py<br/>ADMIN_ACTIONS = [...]"] -->|sync_admin_actions| B["auth_permission rows<br/>(no migration)"]
  B --> C["Django admin Group editor<br/>(define roles via checkboxes)"]
  C --> D["Assign admins to groups"]
  A --> E["schema sends per-(model,user)<br/>allowed_actions"]
  E --> F["Frontend ActionBar<br/>(button + ⋯ menu; hides if not allowed)"]
  F -->|POST /action/{key}/| G["Action endpoint<br/>has_perm enforced + audit log"]
  D --> G
```

## Declaring actions

A single source of truth on the backend:

```python title="conjure/actions.py (design)"
ADMIN_ACTIONS = [
    # model, codename, name, kind(client|server), scope(toolbar|bulk)
    {"model": "user.User",                 "codename": "export",            "name": "Export users",        "kind": "server", "scope": "bulk"},
    {"model": "order.Order",               "codename": "print_receipt",     "name": "Print receipt",       "kind": "server", "scope": "bulk"},
    {"model": "order.Order",               "codename": "issue_tax_invoice", "name": "Issue tax invoice",   "kind": "server", "scope": "bulk"},
    {"model": "subscription.Subscription", "codename": "print_receipt",     "name": "Print receipt",       "kind": "server", "scope": "bulk"},
    {"model": "notification.Notification", "codename": None,                "name": "Send notification",   "kind": "server", "scope": "toolbar"},
]
```

- `codename: None` means **no permission** — available to every staff user (e.g. send
  notification).
- Otherwise the action requires the `{app_label}.{codename}` permission.
- Same codename on different models → independent permissions (the Orders-vs-Subscriptions
  receipt case).

## Creating the permissions (no migration)

```bash
python manage.py sync_admin_actions
```

The command walks `ADMIN_ACTIONS` and `get_or_create`s a `Permission` on each action's
model `ContentType`. Run it on deploy and whenever you add an action. The new permissions
appear automatically as checkboxes under their model in the Django admin Group editor.

## The action endpoint

```text
POST /conjure/r/{app}.{Model}/action/{codename}/
body: { "ids": [...], "params": { ... } }
```

The endpoint requires `is_staff`, then checks the action's permission (`has_perm`, unless
`codename` is `None`); superusers always pass. It dispatches to the action handler,
returns a result with a **partial-failure report**, and writes an `AdminAuditLog` entry
(actor, action, targets).

!!! warning "Sensitive actions go through the endpoint"
    Export of PII and anything destructive must be a **server** action so the permission is
    truly enforced — a client-only action is bypassable by anyone with view access.

## The frontend ActionBar

The schema sends per-(model, user) `allowed_actions`:

```json
"actions": [
  { "key": "print_receipt",     "label": "Print receipt",     "scope": "bulk", "allowed": true  },
  { "key": "issue_tax_invoice", "label": "Issue tax invoice", "scope": "bulk", "allowed": false }
]
```

A generic `<ActionBar>` uses `allowed` to **filter visibility**, renders the 1–2 common
actions as buttons and the rest under a `⋯ more` dropdown (hybrid widget), routes
`scope: "bulk"` actions to the selection bar and `scope: "toolbar"` to the page header, and
handles confirm dialogs / toasts / refetch. A list page only needs one
`<ActionBar model params selectedIds refetch />`.

```text
[ 3 selected ]  [ Delete ]  [ ⋯ more ▾ ]
                              ├ Print receipt
                              ├ Issue tax invoice
                              └ Export selected
```

## Worked example

The classic test case — "3 of 10 admins can export users; everyone can send notifications;
receipts work on Orders but not Subscriptions" — is on the
[Scenarios](scenarios.md) page.
