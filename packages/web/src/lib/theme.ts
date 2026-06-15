/**
 * Runtime theme overrides — override the core color tokens from .env.local VITE_COLOR_* values.
 * Values may be hex ("#4f46e5" / "#fff") or "R G B" channel strings.
 * Tokens not set via env keep their src/index.css defaults (non-destructive).
 * Changes require a full vite dev server restart (.env is loaded once at boot).
 *
 * Usage: call applyThemeFromEnv() once in main.tsx before the React render.
 */

// env key → CSS variables to overwrite (brand-family keys update both primitive and semantic)
const ENV_TO_VARS: Record<string, string[]> = {
  VITE_COLOR_ACCENT: ["--accent", "--brand-500"], // primary action / active nav
  VITE_COLOR_ACCENT_HOVER: ["--accent-hover", "--brand-600"], // derived from accent if unset
  VITE_COLOR_SIDEBAR: ["--bg-sidebar", "--sidebar"], // dark sidebar background
  VITE_COLOR_SIDEBAR_HOVER: ["--bg-sidebar-hover"],
  VITE_COLOR_SUCCESS: ["--status-success", "--success"],
  VITE_COLOR_WARNING: ["--status-warning", "--warning"],
  VITE_COLOR_DANGER: ["--status-danger", "--danger"],
  VITE_COLOR_INFO: ["--status-info", "--info"],
  VITE_COLOR_GAIN: ["--gain"], // finance up
  VITE_COLOR_LOSS: ["--loss"], // finance down
};

/** hex or "R G B" → "R G B" channel string. Returns null when invalid. */
function toChannels(value: string): string | null {
  const v = value.trim();
  if (/^\d{1,3}\s+\d{1,3}\s+\d{1,3}$/.test(v)) return v; // already channel form
  let hex = v.replace(/^#/, "");
  if (hex.length === 3)
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("");
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return null;
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

/** Darken channels by amount — used to auto-derive accent_hover. */
function darken(channels: string, amount = 0.12): string {
  const [r, g, b] = channels.split(/\s+/).map(Number);
  const f = (n: number) => Math.max(0, Math.round(n * (1 - amount)));
  return `${f(r)} ${f(g)} ${f(b)}`;
}

export function applyThemeFromEnv(): void {
  const root = document.documentElement;
  const env = import.meta.env as unknown as Record<string, string | undefined>;
  let accentChannels: string | null = null;

  for (const [key, cssVars] of Object.entries(ENV_TO_VARS)) {
    const raw = env[key];
    if (!raw) continue;
    const channels = toChannels(raw);
    if (!channels) {
      console.warn(`[theme] ${key}="${raw}" is not a valid color. (#RRGGBB or "R G B")`);
      continue;
    }
    cssVars.forEach((cssVar) => root.style.setProperty(cssVar, channels));
    if (key === "VITE_COLOR_ACCENT") accentChannels = channels;
  }

  // If accent was set but hover was not, derive a one-step-darker hover automatically.
  if (accentChannels && !env.VITE_COLOR_ACCENT_HOVER) {
    const hover = darken(accentChannels);
    root.style.setProperty("--accent-hover", hover);
    root.style.setProperty("--brand-600", hover);
  }
}
