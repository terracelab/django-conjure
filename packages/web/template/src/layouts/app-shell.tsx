/** App shell — dark sidebar (collapsible groups) + header + content area (high-density ERP feel). */

import { ChevronDown, LogOut } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, Navigate, Outlet, useLocation } from "react-router-dom";

import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { adminApi, queryKeys } from "@/lib/api";
import { isLoggedIn, logout, tokenStore } from "@/lib/auth";
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

  // Schema-driven sidebar: every registered model becomes a nav item linking to the runtime
  // page (/g/{model}). Models that already have a hand-built codegen page (/m/{model}) keep it.
  const { data: schema } = useQuery({
    queryKey: queryKeys.schemaList(),
    queryFn: adminApi.schemaList,
    enabled: isLoggedIn(),
  });

  const navGroups: NavGroup[] = useMemo(() => {
    const base = [...sidebarNav];
    const models = schema?.models ?? [];
    if (!models.length) return base;
    const existing = new Set(base.flatMap((g) => g.items.flatMap((i) => i.members)));
    const items: NavItem[] = models
      .filter((m) => m.permissions.view)
      .filter((m) => !existing.has(`/m/${m.model}`))
      .map((m) => ({ label: m.verbose_name_plural, to: `/g/${m.model}`, members: [`/g/${m.model}`] }));
    if (!items.length) return base;
    const group: NavGroup = { label: "Models", items };
    const sysIdx = base.findIndex((g) => g.label === "System");
    return sysIdx === -1 ? [...base, group] : [...base.slice(0, sysIdx), group, ...base.slice(sysIdx)];
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
          <span className="text-emphasis font-bold text-white">{APP_TITLE}</span>
        </div>
        <nav className="scrollbar-thin flex-1 overflow-y-auto px-2 py-3">
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
