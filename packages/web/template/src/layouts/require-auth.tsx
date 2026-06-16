import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { isLoggedIn } from "@/lib/auth";

/**
 * Route guard for the authenticated app subtree. Visitors without credentials are sent to
 * /login, remembering where they were (`state.from`) so login can bounce them back.
 *
 * This covers "arrived with no token". Tokens that exist but have EXPIRED are handled
 * reactively in lib/api.ts: a 401 → refresh → on failure `logout()` → redirect here.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation();
  if (!isLoggedIn()) {
    return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;
  }
  return <>{children}</>;
}
