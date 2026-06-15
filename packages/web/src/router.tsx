/**
 * Router — single source of truth. codegen/assemble.py generates this from pages-manifest.json.
 * Model list routes are wrapped with <SectionTabs> so the top section tab bar appears automatically.
 * Custom routes go in customRoutes and are preserved across regeneration.
 *
 * Two modes coexist:
 *   - /m/{app.Model}  → codegen pages (clone of src/pages/_template/). The example below uses blog.Post.
 *   - /g/{app.Model}  → GenericModelPage runtime mode (no per-model code; schema-driven list).
 */

import { createBrowserRouter, type RouteObject } from "react-router-dom";

import { SectionTabs } from "@/components/composed/section-tabs";
import { AppShell } from "@/layouts/app-shell";
import { RequireAuth } from "@/layouts/require-auth";
import DashboardPage from "@/pages/dashboard";
import GenericModelPage from "@/pages/GenericModelPage";
import LoginPage from "@/pages/login";
import StyleGuidePage from "@/pages/style-guide";
// Example codegen pages (the _template directory cloned as blog.Post). Real projects add their own.
import PostListPage from "@/pages/_template";
import PostDetailPage from "@/pages/_template/detail";

// ── Model page routes (auto-generated region) ──────────────────────
const modelRoutes: RouteObject[] = [
  { path: "m/blog.Post", element: <SectionTabs model="blog.Post"><PostListPage /></SectionTabs> },
  { path: "m/blog.Post/:pk", element: <PostDetailPage /> },
];

// ── Runtime-mode routes (GenericModelPage — renders any model from the schema API) ──
const runtimeRoutes: RouteObject[] = [
  { path: "g/:model", element: <GenericModelPage /> },
  { path: "g/:model/:pk", element: <GenericModelPage /> },
];

// ── Custom routes (manual region — preserved across regeneration) ──
const customRoutes: RouteObject[] = [];

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    path: "/",
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "style-guide", element: <StyleGuidePage /> },
      ...modelRoutes,
      ...runtimeRoutes,
      ...customRoutes,
      { path: "*", element: <p className="py-20 text-center text-fg-muted">Page not found.</p> },
    ],
  },
]);
