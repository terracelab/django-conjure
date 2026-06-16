# apps/landing — Conjure marketing site

The brand / marketing landing site for **Conjure** (`django-conjure`), by Terrace Lab.
Built with [Astro](https://astro.build) — lightweight, static, fast.

> Tagline: **Conjure your admin.** / 모델에서 어드민을 소환하다.

This is the top-of-funnel site (hero, value props, install snippet, feature grid,
comparison table). The product docs live in `apps/docs` (MkDocs) and are served at
`docs.conjure.terracelab.co.kr`.

## Run locally

From this directory (or via the root pnpm workspace):

```bash
pnpm install   # at the monorepo root
pnpm dev       # → http://localhost:4321
```

Other scripts: `pnpm build` (static output to `dist/`), `pnpm preview`.

From the monorepo root you can also use `pnpm landing:dev` / `pnpm landing:build`.

## Deploy

- **Target:** Vercel (static output, zero server runtime). In the Vercel project, set
  **Root Directory** to `apps/landing`, build command `pnpm build`, output directory
  `dist/`. Enable "Include source files outside of the Root Directory" so the pnpm
  workspace resolves.
- **Domain:** `conjure.terracelab.co.kr` (landing root). Docs are a separate subdomain
  (`docs.conjure.terracelab.co.kr`, served from GitHub Pages).

## Brand tokens (shared)

Colors and density come from the single brand source of truth:

- `../../brand/BRAND.md` — human reference (voice, glossary, positioning).
- `../../brand/tokens.css` — canonical CSS variables.

`src/styles/tokens.css` is a verbatim copy of `brand/tokens.css`; the values must
match. `tailwind.config.mjs` maps these tokens to Tailwind color names using the
`rgb(var(--brand-500) / <alpha-value>)` pattern, so opacity modifiers
(`bg-brand-500/40`) work and **no brand hex values are hardcoded in components**.
The same tokens are consumed by `packages/web` and `apps/docs`, so the app, docs,
and this site stay visually in sync.

## Structure

```
apps/landing/
├── astro.config.mjs
├── tailwind.config.mjs        # brand tokens → Tailwind colors
├── tsconfig.json
├── package.json
├── public/                    # favicon.svg, robots.txt, og.png* placeholder
└── src/
    ├── layouts/Base.astro     # HTML shell, meta/OG, fonts, global token import
    ├── pages/index.astro      # composes the sections below
    ├── styles/                # tokens.css (copy of brand) + global.css
    └── components/            # Hero, ValueProps, InstallSteps, FeatureGrid,
                               # Comparison, Footer, CodeBlock, Nav
```

`*` `og.png` is a placeholder — see `public/README.md`.

## License

MIT — see the monorepo root `LICENSE`.
