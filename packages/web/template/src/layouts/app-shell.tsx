/** App shell — dark sidebar (collapsible groups) + header + content area (high-density ERP feel). */

import { ChevronDown, LogOut } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, Outlet, useLocation } from "react-router-dom";

import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { adminApi, queryKeys } from "@/lib/api";
import { isLoggedIn, logout, tokenStore } from "@/lib/auth";
import { applyAccent } from "@/lib/theme";
import { cn } from "@/lib/utils";

import { type NavGroup, type NavItem, sidebarNav } from "./sidebar-nav";

/** Product name shown in the sidebar header. Override per project. */
export const APP_TITLE = "Conjure Admin";

const COLLAPSE_KEY = "conjure.sidebar.collapsed";

function loadCollapsed(): Set<string> {
  try {
    const raw = localStorage.getItem(COLLAPSE_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

export function AppShell() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState<Set<string>>(loadCollapsed);

  // Header title + accent come from the backend brand (CONJURE["BRAND"]) via GET /config/.
  const { data: config } = useQuery({ queryKey: queryKeys.config(), queryFn: adminApi.config });
  const appTitle = config?.brand?.name ?? APP_TITLE;
  useEffect(() => {
    applyAccent(config?.brand?.accent);
  }, [config]);

  // Schema-driven sidebar: every registered model becomes a nav item linking to the runtime
  // page (/g/{model}). Models that already have a hand-built codegen page (/m/{model}) keep it.
  const { data: schema } = useQuery({
    queryKey: queryKeys.schemaList(),
    queryFn: adminApi.schemaList,
    enabled: isLoggedIn(),
  });

  const navGroups: NavGroup[] = useMemo(() => {
    const base = [...sidebarNav];
    const models = (schema?.models ?? []).filter((m) => m.permissions.view);
    if (!models.length) return base;
    const existing = new Set(base.flatMap((g) => g.items.flatMap((i) => i.members)));

    // Group by the backend-provided group label (configured via CONJURE["APP_GROUPS"]; defaults
    // to app_label). Group order follows group_order; ties break alphabetically. Row order within
    // a group follows model_order (CONJURE["MODEL_ORDER"]); ties break alphabetically. Models with
    // a hand-built codegen page (/m/{model}) are left in the static nav.
    const map = new Map<string, { items: { item: NavItem; row: number }[]; order: number }>();
    for (const m of models) {
      if (existing.has(`/m/${m.model}`)) continue;
      if (m.section && m.section !== m.model) continue; // section member → shown as a tab, not a sidebar row
      const label = m.group || m.app_label;
      const order = m.group_order ?? 999;
      const g = map.get(label) ?? { items: [], order };
      g.items.push({
        item: { label: m.verbose_name_plural, to: `/g/${m.model}`, members: [`/g/${m.model}`] },
        row: m.model_order ?? 999,
      });
      g.order = Math.min(g.order, order);
      map.set(label, g);
    }
    if (!map.size) return base;

    const groups: NavGroup[] = [...map.entries()]
      .sort((a, b) => a[1].order - b[1].order || a[0].localeCompare(b[0]))
      .map(([label, g]) => ({
        label,
        items: [...g.items].sort((x, y) => x.row - y.row || x.item.label.localeCompare(y.item.label)).map((x) => x.item),
      }));

    // A runtime group whose label matches a static group merges into it (copy-on-merge — never
    // mutate the sidebarNav module objects, or a useMemo re-run would append duplicates).
    const merged = [...base];
    const staticIdx = new Map(merged.map((g, i) => [g.label, i]));
    const extra: NavGroup[] = [];
    for (const g of groups) {
      const i = staticIdx.get(g.label);
      if (i === undefined) extra.push(g);
      else merged[i] = { ...merged[i], items: [...merged[i].items, ...g.items] };
    }

    const sysIdx = merged.findIndex((g) => g.label === "System");
    return sysIdx === -1 ? [...merged, ...extra] : [...merged.slice(0, sysIdx), ...extra, ...merged.slice(sysIdx)];
  }, [schema]);

  if (!isLoggedIn()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  const user = tokenStore.user;

  // Section active test — active if on the exact list path of any member, or on a member detail (member + "/pk").
  function isItemActive(item: NavItem) {
    return item.members.some((m) => (m === "/" ? location.pathname === "/" : location.pathname === m || location.pathname.startsWith(m + "/")));
  }

  function toggleGroup(label: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      try {
        localStorage.setItem(COLLAPSE_KEY, JSON.stringify([...next]));
      } catch {
        /* ignore environments without localStorage */
      }
      return next;
    });
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 flex w-52 flex-col bg-sidebar">
        <div className="flex h-12 items-center border-b border-white/10 px-4">
          <span className="text-emphasis font-bold text-white">{appTitle}</span>
        </div>
        <nav className="scrollbar-none flex-1 overflow-y-auto px-2 py-3">
          {navGroups.map((group) => {
            const isCollapsed = collapsed.has(group.label);
            const hasActive = group.items.some(isItemActive);
            return (
              <div key={group.label} className="mb-1.5">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.label)}
                  aria-expanded={!isCollapsed}
                  className="flex w-full items-center justify-between rounded px-2 py-1 text-caption font-bold uppercase tracking-wide text-fg-on-sidebar/70 transition-colors hover:bg-sidebar-hover hover:text-fg-on-sidebar"
                >
                  <span className="inline-flex items-center gap-1">
                    {group.label}
                    {/* Show a dot when a collapsed group contains the active item. */}
                    {isCollapsed && hasActive && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
                  </span>
                  <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", isCollapsed && "-rotate-90")} />
                </button>
                {!isCollapsed && (
                  <div className="mt-0.5">
                    {group.items.map((item) => {
                      const active = isItemActive(item);
                      return (
                        <Link
                          key={item.to}
                          to={item.to}
                          className={cn(
                            "block rounded py-1.5 pl-5 pr-2 text-body transition-colors",
                            active ? "bg-accent text-fg-on-accent" : "text-fg-on-sidebar/80 hover:bg-sidebar-hover hover:text-white",
                          )}
                        >
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Main */}
      <div className="ml-52 flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-12 items-center justify-end gap-3 border-b border-border bg-surface px-4">
          <span className="text-caption text-fg-muted">
            {user?.nickname ?? user?.username}
            {user?.is_superuser && " (superuser)"}
          </span>
          <Button variant="ghost" onClick={logout}>
            <LogOut className="h-3.5 w-3.5" />
            Log out
          </Button>
        </header>
        <main className="flex-1 p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
