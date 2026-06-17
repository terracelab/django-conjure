# Sections & tabs

A real admin has dozens of models. A flat list of 75 sidebar entries is unusable, so
Conjure organizes navigation as **Group → Section → Tabs** — django-unfold-style IA.

## The model

```text
▼ Members                    ← Group (bold heading)
   Users                     ← Section = the "main" model (one sidebar row)
      [Users] Social · Consents · Blocks …   ← top tabs (satellite models)
   Devices
▼ Subscriptions & billing
   Subscriptions · Orders
   …
```

- **Group** — a bold heading that buckets related sections.
- **Section** — its **first model is the "main" model** and takes a single sidebar row.
- **Tabs** — the section's other (satellite) models — reads, history, reactions — appear
  as **top tabs** on the main model's page, not as separate sidebar rows.

This is what collapses, say, 75 model pages into ~21 readable sidebar sections.

## Why the first model wins

A section's first model is the one people land on; its siblings are usually drill-downs of
it (a post's images, comments, reports). Putting those on tabs keeps the sidebar about
*subjects* (Users, Orders) rather than *tables*.

The tab bar is injected automatically by a `SectionTabs` wrapper around the list route —
your 75 generated pages are **not modified** to gain tabs.

## Runtime mode — configure from the backend

In runtime mode you don't ship a manifest. The same **Group → Section → Tabs** structure is
declared in your Django settings and delivered over the schema API, so the dashboard builds the
sidebar live — set the config, refresh, done.

```python title="settings.py"
CONJURE = {
    # Sidebar groups: app_label → group label. Apps sharing a label merge into one group;
    # order follows this dict's insertion order; unlisted apps group by app_label (last).
    "APP_GROUPS": {
        "user": "Members", "device": "Members",
        "subscription": "Billing", "order": "Billing",
    },
    # Sections: first model = main (the only sidebar row); the rest become its page tabs.
    "SECTIONS": [
        ["user.User", "user.SocialAccount", "user.UserConsent"],
        ["subscription.Subscription", "subscription.Product"],
    ],
}
```

- A model in no `SECTIONS` list is its own sidebar row (standalone).
- A model in no `APP_GROUPS` entry falls back to a group named after its `app_label`.
- Because this lives in `settings.py`, it **survives re-init** — re-scaffolding the frontend never
  wipes your navigation. Pairs with [`AUTO_REGISTER`](../reference/configuration.md) for true
  install-and-go: register every model, then shape the nav from config alone.

## Codegen mode — the manifest

Navigation is declared in the codegen **manifest**, then assembled deterministically:

```jsonc title="web/codegen/pages-manifest.json"
{
  "groups": [
    {
      "label": "Members",
      "sections": [
        { "models": ["user.User", "user.SocialAccount", "user.UserBlock"] },
        { "models": ["device.Device"] }
      ]
    }
  ]
}
```

```bash
python codegen/assemble.py   # regenerates router.tsx + sidebar-nav.ts + sections.ts
```

`assemble.py` reads the manifest and regenerates the router, the sidebar, and the section
map — registering **only directories that actually exist** (safe; it won't route to a
missing page).

## Common edits

| Goal | Do this |
|---|---|
| Move a model to another section | Move its entry between `models[]` arrays, re-run `assemble.py`. |
| Change which model is "main" | Reorder `models[]` so the new main is first. |
| Make a model a tab instead of a row | Put it after the first model in a section's `models[]`. |
| Add a whole new group | Add a `groups[]` entry, re-run `assemble.py`. |

You don't declare whether a model has a detail page or its own directory — `assemble.py`
infers that from the model's kebab name and which files exist.

!!! tip "Determinism beats hand-editing"
    Registering 75 routes and sidebar entries by hand invites merge conflicts and
    omissions. The manifest + `assemble.py` make navigation a generated artifact — review
    the manifest diff, not the router diff.

## Active-state behaviour

- Group labels render bold.
- A section shows as **active** when you're on *any* of its models — including a satellite
  model's detail page reached through a tab.

In **runtime mode** the same grouping comes from `CONJURE["APP_GROUPS"]` / `CONJURE["SECTIONS"]`
(see above) — the SPA reads it from the schema API and builds the identical sidebar with no
manifest file.
