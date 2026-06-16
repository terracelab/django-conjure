/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** API path prefix (default /conjure). Matches the conjure.urls mount. */
  readonly VITE_API_BASE?: string;
  /** Absolute API origin for production builds when the backend is a different origin. */
  readonly VITE_API_BASE_URL?: string;
  /** Dev proxy target (local Django backend). */
  readonly VITE_PROXY_TARGET?: string;
  // Theme color overrides (hex or "R G B"). Applied by src/lib/theme.ts.
  readonly VITE_COLOR_ACCENT?: string;
  readonly VITE_COLOR_ACCENT_HOVER?: string;
  readonly VITE_COLOR_SIDEBAR?: string;
  readonly VITE_COLOR_SIDEBAR_HOVER?: string;
  readonly VITE_COLOR_SUCCESS?: string;
  readonly VITE_COLOR_WARNING?: string;
  readonly VITE_COLOR_DANGER?: string;
  readonly VITE_COLOR_INFO?: string;
  readonly VITE_COLOR_GAIN?: string;
  readonly VITE_COLOR_LOSS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
