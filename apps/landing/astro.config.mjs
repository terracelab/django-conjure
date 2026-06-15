// @ts-check
import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";

// https://astro.build/config
export default defineConfig({
  site: "https://conjure.terracelab.dev",
  integrations: [
    tailwind({
      // We ship our own global stylesheet (src/styles/tokens.css) and base
      // layer in Base.astro, so skip Tailwind's bundled reset/base injection.
      applyBaseStyles: false,
    }),
  ],
});
