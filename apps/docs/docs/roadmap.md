# Roadmap

Where Conjure is and where it's going. Status legend: <span class="status available">✅
available</span> · <span class="status setup">🟡 needs setup / decoupling</span> ·
<span class="status planned">📋 planned / design</span>.

## What's shipping today

The core was extracted from a production internal admin (75 models, ~150 routes). These are
battle-tested:

| Capability | Status |
|---|---|
| Model introspection / schema API | <span class="status available">✅</span> |
| Generic CRUD (list / retrieve / create / update / delete) | <span class="status available">✅</span> |
| Server-side search · filter · sort · pagination | <span class="status available">✅</span> |
| Bulk (delete / update / atomic inline) · autocomplete · related | <span class="status available">✅</span> |
| Audit log (diff of every write) | <span class="status available">✅</span> |
| Staff auth — JWT (session mode in packaging) | <span class="status available">✅</span> |
| Dashboard widgets (stats / trend / recent activity) | <span class="status available">✅</span> |
| Codegen pages + golden template | <span class="status available">✅</span> |
| Sections + tabs sidebar (manifest + assemble) | <span class="status available">✅</span> |
| Env theming, compact UI, `/style-guide` | <span class="status available">✅</span> |
| CSV export + selection export | <span class="status available">✅</span> |

## In progress / needs setup

| Capability | Status | Note |
|---|---|---|
| Package extraction (decouple from any one project) | <span class="status setup">🟡</span> | Core is ready; `conf.py` layer landed. |
| Session auth mode + bundled SPA serving | <span class="status setup">🟡</span> | Part of packaging. |

## Planned

| Capability | Status | Note |
|---|---|---|
| Runtime `GenericModelPage` (zero-codegen) | <span class="status available">✅</span> | Register a model → it appears with full list + create/edit/delete + inlines, no per-model code. |
| Actions & permissions system | <span class="status planned">📋</span> | Design complete — see [the spec](actions-permissions/index.md). |
| `@terracelab/conjure-web init` CLI scaffolder | <span class="status available">✅</span> | Golden template + rules shipped as an `npx` scaffolder. |
| Real `.xlsx` export, M2M editing, column toggle, virtual scroll | <span class="status planned">📋</span> | UX completeness. |
| Field plugin SDK, i18n (EN/KO), security defaults | <span class="status planned">📋</span> | Hardening. |

## The phased plan (P0–P5)

```mermaid
graph LR
  P0["P0 · Decouple"] --> P1["P1 · Backend pkg"]
  P1 --> P2["P2 · Runtime SPA"]
  P2 --> P3["P3 · Codegen CLI"]
  P3 --> P4["P4 · Actions/perms"]
  P4 --> P5["P5 · Hardening"]
```

| Phase | Theme | Contents |
|---|---|---|
| **P0** | Decouple | Settle project-specific knobs into settings → `conjure` as a standalone app. |
| **P1** | Backend package | `admin_config.py` auto-discovery, session auth, widget registry, bundled migrations, `pyproject`. |
| **P2** | Runtime SPA | `GenericModelPage` (schema-driven) + config endpoint (theme/nav) + bundle serving. |
| **P3** | Codegen CLI | Golden template + rules packaged as the `@terracelab/conjure-web init` scaffolder. |
| **P4** | Actions & permissions | `actions.py` + `sync_admin_actions` + action endpoint + `ActionBar`. ([spec](actions-permissions/index.md)) |
| **P5** | Hardening | Field plugin SDK, i18n (EN/KO), secure defaults, docs site, Django-version test matrix. |

## Further out

UX and platform ideas under consideration (not committed):

- **Lazy-loaded model pages** — `React.lazy` + dynamic imports for ~70% smaller initial
  load.
- **Read-only deep links** — `/m/{model}/{pk}` opens a detail dialog directly.
- **Date-range filter widget** — the `__gte`/`__lte` backend contract already exists.
- **Auth hardening** — short-lived access tokens, httpOnly cookies, login throttling.
- **Audit log upgrades** — retention policy, actor IP allowlist, better diff viewer.
- **Schema-drift guard** — CI warns when the schema snapshot changes (pages need regen).
- **Permission/Group management UI** — CRUD groups & permissions from the dashboard.
- **Real-time** — live updates for the audit log and report queues.
- **Phased Django-admin retirement** — feature-parity checklist (Excel import/export, drag
  ordering, admin-only pages).

## How priorities are set

The roadmap is public on GitHub Projects; feature requests go through
[issues and discussions](https://github.com/terracelab/django-conjure). Anything
permission- or contract-shaped is weighted toward the [extension points](customization/extension-points.md)
so it can land **without forking**.
