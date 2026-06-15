# Conjure — Brand Reference (single source of truth)

> Everything visual/verbal across the package, docs site, and landing site pulls from this file
> and from [`tokens.css`](./tokens.css). Change brand here, not in three places.

## Identity

| Field | Value |
|---|---|
| Product name | **Conjure** |
| Maker | **Terrace Lab** |
| PyPI package | `django-conjure` |
| Django app (import) | `conjure` |
| npm package | `@terracelab/conjure-web` |
| One-liner | *Conjure your Django admin — read your models, summon the admin.* |
| Tagline (EN) | **Conjure your admin.** |
| Tagline (KO) | **모델에서 어드민을 소환하다.** |
| GitHub | `github.com/terracelab/django-conjure` |
| Docs domain | `conjure.terracelab.dev` |

## Voice

Developer-friendly, concise, lightly witty. A restrained *magic* metaphor — never cheesy,
feature names stay plain.

## Glossary (use consistently, don't overuse)

| Term | Meaning | Where it shows |
|---|---|---|
| **conjure** | generate / scaffold | `npx create-conjure`, codegen |
| **spell** | an admin action (export, refund, send push) | action registry |
| **summon** | render a model page | runtime page |
| **spellbook** | the set of registered configs | docs metaphor only |

## Color tokens (canonical — see tokens.css for the machine copy)

Stored as **`R G B` channels** (not hex) so Tailwind opacity modifiers work.

| Token | Channels | Hex | Role |
|---|---|---|---|
| `--brand-500` | `79 70 229` | `#4f46e5` | accent — primary action, active nav |
| `--brand-600` | `67 56 202` | `#4338ca` | accent hover |
| `--brand-400` | `129 140 248` | `#818cf8` | accent on dark |
| `--sidebar` | `11 11 15` | `#0b0b0f` | dark sidebar / hero background |
| `--success` | `22 163 74` | `#16a34a` | success state |
| `--warning` | `217 119 6` | `#d97706` | warning state |
| `--danger` | `220 38 38` | `#dc2626` | danger / destructive |
| `--info` | `37 99 235` | `#2563eb` | info state |
| `--gain` | `220 38 38` | `#dc2626` | finance up (KR convention: red) |
| `--loss` | `37 99 235` | `#2563eb` | finance down (KR convention: blue) |

Density: row `32px`, body text `13px`, radius `4px` (ERP feel, keep ≤6px).

## Logo concept

A thin **magic circle / arc** + `C`, or a *model → screen* transform glyph.
Dark background, accent stroke. Keep it geometric, single-weight.

## Comparison positioning (for landing/docs)

|  | django-unfold / jazzmin | react-admin / Refine | **Conjure** |
|---|---|---|---|
| Form | Django admin theme | runtime JS config | codegen + (optional) runtime |
| Code ownership | ✗ | △ | ✅ you own the output |
| Install-and-go | ✅ | △ | ✅ (runtime mode) |
| Per-page customization | limited | △ | ✅ |
| Permissions | Django perms | separate | Django perms (shared) |
