/** @type {import('tailwindcss').Config} */
//
// Colors map to the Conjure brand tokens defined in src/styles/tokens.css.
// Tokens are stored as "R G B" channels so opacity modifiers work, e.g.
// `bg-brand-500/40` -> rgb(var(--brand-500) / 0.40).
//
// Do NOT hardcode brand hex values in components — reference these names.
export default {
  content: ["./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          400: "rgb(var(--brand-400) / <alpha-value>)",
          500: "rgb(var(--brand-500) / <alpha-value>)",
          600: "rgb(var(--brand-600) / <alpha-value>)",
        },
        sidebar: "rgb(var(--sidebar) / <alpha-value>)",
        app: "rgb(var(--bg-app) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        line: "rgb(var(--border) / <alpha-value>)",
        fg: {
          DEFAULT: "rgb(var(--fg) / <alpha-value>)",
          muted: "rgb(var(--fg-muted) / <alpha-value>)",
        },
        success: "rgb(var(--success) / <alpha-value>)",
        warning: "rgb(var(--warning) / <alpha-value>)",
        danger: "rgb(var(--danger) / <alpha-value>)",
        info: "rgb(var(--info) / <alpha-value>)",
        gain: "rgb(var(--gain) / <alpha-value>)",
        loss: "rgb(var(--loss) / <alpha-value>)",
      },
      borderRadius: {
        // Brand density: keep radii tight (ERP feel, <=6px).
        token: "var(--radius)",
      },
      fontFamily: {
        sans: [
          "Inter var",
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "Courier New",
          "monospace",
        ],
      },
      maxWidth: {
        content: "72rem",
      },
      keyframes: {
        "glow-pulse": {
          "0%, 100%": { opacity: "0.45" },
          "50%": { opacity: "0.7" },
        },
      },
      animation: {
        "glow-pulse": "glow-pulse 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
