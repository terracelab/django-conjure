# Scenarios

!!! info "Status: 📋 Planned / Design"
    This is the verification scenario for the [actions & permissions](index.md) design,
    not yet shipped behaviour.

The design is validated against one concrete situation. If this works cleanly, the model is
right.

## The brief

> Ten admins. **Only 3** may export users. **All 10** may send notifications. Printing a
> receipt works on the **Orders** page but **not** on the **Subscriptions** page.

Three different shapes of rule — a restricted action, an open action, and the same action
allowed on one model but not another — covered by one mechanism.

## The role matrix

Permissions are `(action × model)`. Roles are Django groups. The matrix below is exactly
what an admin sees in the Group editor:

| Role (group) | `user.export` | `order.print_receipt` | `order.issue_tax_invoice` | `subscription.print_receipt` | Send notification *(no perm)* |
|---|:--:|:--:|:--:|:--:|:--:|
| **Billing** | | ✅ | ✅ | ✅ | ✅ |
| **Data team** *(3 admins)* | ✅ | | | | ✅ |
| **General staff** *(7 admins)* | | | | | ✅ |

Reading it:

- **Export users** — only **Data team** has `user.export`, and only 3 admins are in it →
  3 of 10. ✓
- **Send notification** — declared with `codename: None` (no permission), so every staff
  user can do it → 10 of 10. ✓
- **Receipts** — `order.print_receipt` and `subscription.print_receipt` are *separate*
  permissions. Billing has both; nobody has Subscriptions receipt unless explicitly
  granted → "Orders yes, Subscriptions no" without special casing. ✓

## How you'd set it up

```bash
# 1. Declare the actions in conjure/actions.py (see the Concept page), then:
python manage.py sync_admin_actions
# → creates user.export, order.print_receipt, order.issue_tax_invoice,
#   subscription.print_receipt  (no migration)
```

Then in Django admin:

1. Create the **Billing**, **Data team**, **General staff** groups.
2. Tick the boxes per the matrix above (they appear under each model automatically).
3. Assign the 3 export-capable admins to **Data team**; everyone else to **General staff**.

Adjusting later is **group membership only** — no code, no migration. Move an admin between
groups and their actions change on next request.

## Why this holds up

- **Server-enforced.** Each action endpoint calls `has_perm`. Hiding the button in the
  ActionBar is convenience; the 403 is the real gate. A General-staff member who crafts the
  export request by hand still gets denied.
- **PII-safe.** `user.export` is a *server* action (streamed CSV), so the 7 view-only
  admins can't bypass it through a client-side export.
- **No migration churn.** Adding a new action = one line in `actions.py` + re-running
  `sync_admin_actions`. The permission shows up in the Group editor immediately.

## Out of scope (for now)

| Concern | Status |
|---|---|
| Object-level permissions ("this admin, only these rows") | Needs `django-guardian`; not in scope. |
| Bundled permissions (`print_documents` = receipts + invoices) | Possible; default is per-action. |
| "Select all N across pages" for bulk actions | Separate work (server pagination limits current selection to the page). |
