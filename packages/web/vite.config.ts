import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig, loadEnv } from "vite";

// In dev, requests under the API base prefix are proxied to the local Django backend.
// The backend origin is set with VITE_PROXY_TARGET (.env / .env.local). Defaults to :8000.
//   e.g. runserver 0.0.0.0:8004 → packages/web/.env.local: VITE_PROXY_TARGET=http://localhost:8004
// The proxied path defaults to /conjure (matching the conjure.urls mount), overridable via VITE_API_BASE.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const target = env.VITE_PROXY_TARGET ?? process.env.VITE_PROXY_TARGET ?? "http://localhost:8000";
  const apiBase = env.VITE_API_BASE ?? "/conjure";
  return {
    plugins: [react()],
    resolve: {
      alias: { "@": path.resolve(__dirname, "./src") },
    },
    server: {
      port: 5173,
      proxy: {
        [apiBase]: {
          target,
          changeOrigin: true,
        },
      },
    },
  };
});
