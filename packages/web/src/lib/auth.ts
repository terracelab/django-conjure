/**
 * Token storage / refresh — localStorage based.
 * (The spec recommends httpOnly cookies, but the backend SimpleJWT returns JSON tokens,
 *  so v1 uses localStorage — small XSS surface for an internal tool. Cookie migration is
 *  a documented roadmap item.)
 */

import type { AdminUser } from "./types";

const ACCESS_KEY = "conjure.access";
const REFRESH_KEY = "conjure.refresh";
const USER_KEY = "conjure.user";

export const tokenStore = {
  get access() {
    return localStorage.getItem(ACCESS_KEY);
  },
  get refresh() {
    return localStorage.getItem(REFRESH_KEY);
  },
  get user(): AdminUser | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AdminUser) : null;
  },
  save(access: string | null | undefined, refresh: string | null, user?: AdminUser) {
    // Session mode returns no token (cookie carries auth) — only store what exists.
    if (access) localStorage.setItem(ACCESS_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

export function isLoggedIn() {
  // JWT mode stores an access token; session mode stores only the user (the cookie carries auth).
  return Boolean(tokenStore.access || tokenStore.user);
}

/**
 * Clear credentials and send the user to the login page, remembering where they were so
 * login can bounce them back. Called when a request is 401 and the refresh token can't renew it.
 */
export function logout() {
  tokenStore.clear();
  if (window.location.pathname === "/login") return; // already there — avoid a redirect loop
  const here = window.location.pathname + window.location.search;
  const next = here && here !== "/" ? `?next=${encodeURIComponent(here)}` : "";
  window.location.href = `/login${next}`;
}
