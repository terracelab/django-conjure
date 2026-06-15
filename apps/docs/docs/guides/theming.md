# Theming

Conjure ships a compact, ERP-flavoured theme driven by **design tokens**. The brand color
and surfaces come from one source so the package, docs, and landing site stay in lock-step.

## The fast path: one variable

In most cases you only set the **accent**. Backend brand config:

```python title="settings.py"
CONJURE = {
    "BRAND": {"name": "Acme Admin", "accent": "#4f46e5"},
}
```

`BRAND.name` titles the header and login screen; `BRAND.accent` is the primary action /
active-nav color. Hover is derived automatically.

For the frontend (codegen mode), the same accent is an env var:

```bash title="web/.env.local"
VITE_COLOR_ACCENT="#4f46e5"   # ⚠️ hex MUST be quoted (see below)
```

!!! danger "Quote your hex values"
    dotenv treats an unquoted `#` as a comment, silently blanking the value — the single
    most common theming mistake. Always quote hex: `"#4f46e5"`. Unquoted channel values
    (`"79 70 229"`) or hex without `#` (`4f46e5`) also work.

!!! note "Restart after changing env"
    Vite injects env once at server start. After editing `.env.local`, fully **stop and
    restart** the dev server and hard-refresh the browser.

## The full token palette

Every color is overridable via env (frontend) without touching code. Unset tokens fall
back to the defaults in `index.css` (non-destructive).

| Env var | Role | Default |
|---|---|---|
| `VITE_COLOR_ACCENT` | Brand / primary action / active nav | `#4f46e5` |
| `VITE_COLOR_SIDEBAR` | Dark sidebar background | `#0b0b0f` |
| `VITE_COLOR_SUCCESS` | Success state | `#16a34a` |
| `VITE_COLOR_WARNING` | Warning state | `#d97706` |
| `VITE_COLOR_DANGER` | Danger / destructive | `#dc2626` |
| `VITE_COLOR_INFO` | Info state | `#2563eb` |
| `VITE_COLOR_GAIN` | Finance up (KR convention: **red**) | `#dc2626` |
| `VITE_COLOR_LOSS` | Finance down (KR convention: **blue**) | `#2563eb` |

!!! info "Finance colors are separate"
    `--gain` / `--loss` are intentionally distinct from `--success` / `--danger` (Korean
    market convention: up = red, down = blue). Don't reuse status colors for money deltas.

## Changing the defaults

To change a token's *default* (not just override per-deploy), edit `web/src/index.css`.
Tokens are stored as **`R G B` channels**, not hex, so Tailwind opacity modifiers like
`bg-brand-500/40` work:

```css title="web/src/index.css"
:root {
  --brand-500: 79 70 229;   /* accent — channels, not #4f46e5 */
  --brand-600: 67 56 202;   /* accent hover */
  --sidebar:   11 11 15;    /* dark sidebar */
}
```

## Density and radius

The ERP feel is one set of variables — adjust globally:

```css
:root {
  --density-row-h: 32px;   /* table row height */
  --text-body:     13px;   /* base body text */
  --radius:        4px;    /* keep ≤ 6px for the ERP look */
}
```

## Dark mode

The structure is ready: semantic tokens are redefined under a `[data-theme="dark"]` block
and components need no changes — only the token layer is overridden.

```css title="web/src/index.css"
[data-theme="dark"] {
  --bg-app:  11 11 15;
  --surface: 24 24 27;
  --fg:      244 244 245;
  --brand-500: 129 140 248;   /* lift the accent on dark */
}
```

Toggle by setting `<html data-theme="dark">`.

## How tokens are shared

The package frontend, this docs site, and the landing site all import the **same**
`brand/tokens.css`. Change the brand in one place and all three surfaces follow — that's
the "brand managed in one place" principle. (This docs site maps those tokens onto MkDocs
Material in `docs/stylesheets/extra.css`.)
