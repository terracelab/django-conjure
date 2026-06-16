import type { Config } from "tailwindcss";

/**
 * Design-system rule: Tailwind only *maps* the CSS variables from the token layer
 * (src/styles/tokens.css + src/index.css). Codegen output must use semantic classes
 * (bg-surface, text-fg-muted, h-row, …) — never raw values (bg-white, h-[32px]).
 */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // "R G B" channel tokens wrapped in rgb(... / <alpha-value>) so opacity modifiers (/80, /10) work.
        app: "rgb(var(--bg-app) / <alpha-value>)",
        surface: "rgb(var(--bg-surface) / <alpha-value>)",
        sidebar: "rgb(var(--bg-sidebar) / <alpha-value>)",
        "sidebar-hover": "rgb(var(--bg-sidebar-hover) / <alpha-value>)",
        "fg-default": "rgb(var(--fg-default) / <alpha-value>)",
        "fg-muted": "rgb(var(--fg-muted) / <alpha-value>)",
        "fg-on-sidebar": "rgb(var(--fg-on-sidebar) / <alpha-value>)",
        "fg-on-accent": "rgb(var(--fg-on-accent) / <alpha-value>)",
        border: "rgb(var(--border-default) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        "accent-hover": "rgb(var(--accent-hover) / <alpha-value>)",
        success: "rgb(var(--status-success) / <alpha-value>)",
        warning: "rgb(var(--status-warning) / <alpha-value>)",
        danger: "rgb(var(--status-danger) / <alpha-value>)",
        info: "rgb(var(--status-info) / <alpha-value>)",
        gain: "rgb(var(--gain) / <alpha-value>)",
        loss: "rgb(var(--loss) / <alpha-value>)",
      },
      fontFamily: {
        sans: "var(--font-sans)",
      },
      fontSize: {
        body: ["var(--text-body)", { lineHeight: "1.5" }],
        caption: ["var(--text-caption)", { lineHeight: "1.4" }],
        emphasis: ["var(--text-emphasis)", { lineHeight: "1.5" }],
        title: ["var(--text-title)", { lineHeight: "1.4" }],
      },
      height: {
        row: "var(--density-row-h)",
        input: "var(--density-input-h)",
      },
      minHeight: {
        row: "var(--density-row-h)",
      },
      spacing: {
        "cell-x": "var(--density-cell-px)",
      },
      borderRadius: {
        DEFAULT: "var(--radius)",
      },
    },
  },
  plugins: [],
} satisfies Config;
