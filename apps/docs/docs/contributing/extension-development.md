# Extension development

This page is for contributors adding a **new kind of extension point** to Conjure's core (a
new registry or hook). If you just want to *use* the existing hooks, see
[Customization](../customization/index.md).

## Principles

1. **Public registry, not patching.** Every capability users add — fields, widgets, actions
   — goes through a registry exposed in the public API. New extension points follow the same
   shape so users never need to fork.
2. **Pair backend and frontend.** Anything visual (a field type, a widget) needs a backend
   describer *and* a frontend renderer. Ship both, or the feature is half-present.
3. **Permissions are data.** Anything permission-bearing (actions) creates permissions via a
   `sync` command (`get_or_create`), **not** model migrations — permissions are data, not
   schema.
4. **Document with an example.** A new extension point isn't done until it's in
   [`reference/`](../reference/configuration.md) and
   [`customization/`](../customization/extension-points.md) with a runnable example.

## Anatomy of a registry

The existing registries are the template. A decorator registers a callable under a string
key; the rest of the system looks it up by key.

```python title="packages/conjure — a registry + decorator"
class WidgetRegistry:
    def __init__(self):
        self._items: dict[str, callable] = {}

    def register(self, name):
        def deco(fn):
            self._items[name] = fn
            return fn
        return deco

    def get(self, name):
        return self._items[name]


widgets = WidgetRegistry()
register_widget = widgets.register   # exported from conjure/__init__.py
```

Export the decorator from `conjure/__init__.py` so it's part of the public API
(`from conjure import register_widget`).

## Adding a frontend half

If the extension point is visual, expose a matching frontend registration from
`@terracelab/conjure-web`:

```tsx title="packages/web — frontend registry"
const fieldRenderers = new Map<string, FieldRenderer>();

export function registerFieldRenderer(type: string, r: FieldRenderer) {
  fieldRenderers.set(type, r);
}
```

The backend describer returns a `type` string; the frontend looks up the renderer by that
string. Keep the keys identical on both sides.

## Surfacing it in the schema

For a field-level extension, the describer's output must flow into the schema JSON so the
frontend can pick a renderer. The list/form generation reads:

- `type` — the renderer key
- `control` — the form control hint
- field metadata (nullable, choices, fk target, …)

See [Field support](../reference/field-support.md#how-a-field-becomes-a-control) for the
flow.

## Permission-bearing extensions

If your extension grants/denies something, model it as a Django permission created by a sync
command, like [actions](../actions-permissions/index.md):

```python
for item in DECLARED:
    ct = ContentType.objects.get_for_model(apps.get_model(item["model"]))
    Permission.objects.get_or_create(
        codename=item["codename"], content_type=ct,
        defaults={"name": item["name"]},
    )
```

Idempotent, no migration, and the permission shows up in the Django admin Group editor
automatically.

## Generators for the docs

If your extension point has a registry of entries that users will want a reference for,
consider a docs generator in `apps/docs/gen/` so the reference table is generated from the
registry (the field-support matrix is a candidate). See
[Releasing → generators](releasing.md#code-docs-generators) and
`apps/docs/gen/README.md`.

## Checklist for a new extension point

- [ ] Registry + decorator, exported from the public API
- [ ] Frontend half (if visual), same string keys
- [ ] Schema integration (if field-level)
- [ ] Permission via `sync` command (if permission-bearing) — no migration
- [ ] Tests (registration + lookup + enforcement)
- [ ] Docs: reference entry + a runnable example in `customization/`
- [ ] Entry added to the [extension points table](../customization/extension-points.md)
