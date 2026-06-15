# `public/` — static assets

Everything in here is served from the site root, verbatim (no processing).

## Present

- `favicon.svg` — Conjure mark (magic circle + C arc), accent `#4f46e5` on dark.
- `robots.txt` — allow-all + sitemap pointer.

## Placeholders to add

These are referenced by the site but not yet committed (binary assets — drop the
real files here):

| File | Used by | Spec |
|---|---|---|
| `og.png` | `src/layouts/Base.astro` (`og:image` / `twitter:image`) | 1200×630 PNG. Dark `#0b0b0f` background, "Conjure your admin." wordmark + accent glow. |
| `demo.mp4` (or `demo.gif`) | `src/components/Hero.astro` 30-second demo slot | Looping screen capture: register a model → page appears. Replace the styled terminal placeholder in `Hero.astro` with a `<video>`/`<img>`. Keep ≤ ~3 MB; provide an `alt`/poster. |

After adding `demo.*`, edit the `TODO(asset)` block in `Hero.astro` to swap the
styled terminal placeholder for the real `<video>`/`<img>`.
