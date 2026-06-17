/**
 * adminApi — the single channel to the Conjure backend API.
 * Codegen rule: every API call goes through this client. Direct fetch is forbidden.
 * The URL / query-parameter contract is 1:1 with the backend conjure api urls & viewsets — do not change.
 */

import { logout, tokenStore } from "./auth";
import type {
  AdminUser,
  AutocompleteResponse,
  BaseRecord,
  BulkActionBody,
  BulkOperationsBody,
  ListParams,
  ModelSchema,
  ModelSummary,
  Paginated,
  RelatedSummary,
} from "./types";

/** Absolute origin for the API, when the backend is served from a different origin (prod). Empty = same origin. */
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

/**
 * API path prefix. Matches the conjure.urls mount in Django (default `/conjure`).
 * Override with VITE_API_BASE if you mounted the routes under a different prefix.
 * The leading slash is normalized and any trailing slash is dropped so path joins stay clean.
 */
const RAW_BASE = import.meta.env.VITE_API_BASE ?? "/conjure";
export const API_BASE = "/" + RAW_BASE.replace(/^\/+|\/+$/g, "");

/** Methods Django/DRF treats as safe — no CSRF token required. */
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS", "TRACE"]);

/** Read a cookie by name — used for Django's csrftoken in session-auth mode. */
function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export class ApiError extends Error {
  status: number;
  /** DRF validation error body — {field: [messages]} shape. Used for per-field form mapping. */
  body: Record<string, unknown>;

  constructor(status: number, body: Record<string, unknown>) {
    super(typeof body.detail === "string" ? body.detail : `Request failed (${status})`);
    this.status = status;
    this.body = body;
  }
}

function buildQuery(params?: ListParams): string {
  if (!params) return "";
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

/** When data contains a File/Blob, switch to FormData (multipart) — image/file upload path. */
function encodeBody(data: Record<string, unknown>): { body: BodyInit; contentType?: string } {
  const hasFile = Object.values(data).some((v) => v instanceof File || v instanceof Blob);
  if (!hasFile) return { body: JSON.stringify(data), contentType: "application/json" };
  const form = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined) return;
    if (value instanceof File || value instanceof Blob) form.append(key, value);
    else if (value === null) form.append(key, "");
    else form.append(key, String(value));
  });
  return { body: form };
}

let refreshing: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (!tokenStore.refresh) return false;
  refreshing ??= (async () => {
    try {
      const response = await fetch(`${BASE_URL}${API_BASE}/auth/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: tokenStore.refresh }),
      });
      if (!response.ok) return false;
      const data = await response.json();
      tokenStore.save(data.access, data.refresh ?? null);
      return true;
    } catch {
      return false;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

const AUTH_PREFIX = `${API_BASE}/auth/`;

async function request<T>(method: string, path: string, data?: Record<string, unknown>, retried = false): Promise<T> {
  const headers: Record<string, string> = {};
  if (tokenStore.access) headers.Authorization = `Bearer ${tokenStore.access}`;
  // Session-auth writes need Django's CSRF token (set in the csrftoken cookie by /auth/login & /auth/me).
  if (!SAFE_METHODS.has(method.toUpperCase())) {
    const csrf = readCookie("csrftoken");
    if (csrf) headers["X-CSRFToken"] = csrf;
  }
  let body: BodyInit | undefined;
  if (data !== undefined) {
    const encoded = encodeBody(data);
    body = encoded.body;
    if (encoded.contentType) headers["Content-Type"] = encoded.contentType;
  }
  const response = await fetch(`${BASE_URL}${path}`, { method, headers, body });
  if (response.status === 401 && !retried && !path.startsWith(AUTH_PREFIX)) {
    if (await tryRefresh()) return request<T>(method, path, data, true);
    logout();
  }
  if (response.status === 204) return undefined as T;
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(response.status, json);
  return json as T;
}

/** XHR-based upload — progress callback support (create/update with files only). */
function requestWithProgress<T>(method: string, path: string, data: Record<string, unknown>, onProgress: (percent: number) => void, retried = false): Promise<T> {
  return new Promise((resolve, reject) => {
    const { body } = encodeBody(data);
    const xhr = new XMLHttpRequest();
    xhr.open(method, `${BASE_URL}${path}`);
    if (tokenStore.access) xhr.setRequestHeader("Authorization", `Bearer ${tokenStore.access}`);
    if (!SAFE_METHODS.has(method.toUpperCase())) {
      const csrf = readCookie("csrftoken");
      if (csrf) xhr.setRequestHeader("X-CSRFToken", csrf);
    }
    if (typeof body === "string") xhr.setRequestHeader("Content-Type", "application/json");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      // Same 401 → refresh → retry-once → logout flow as request(), for the upload path.
      if (xhr.status === 401 && !retried && !path.startsWith(AUTH_PREFIX)) {
        tryRefresh().then((ok) => {
          if (ok) requestWithProgress<T>(method, path, data, onProgress, true).then(resolve, reject);
          else {
            logout();
            reject(new ApiError(401, { detail: "Your session has expired. Please sign in again." }));
          }
        });
        return;
      }
      const json = xhr.responseText ? JSON.parse(xhr.responseText) : {};
      if (xhr.status >= 200 && xhr.status < 300) resolve(json as T);
      else reject(new ApiError(xhr.status, json));
    };
    xhr.onerror = () => reject(new ApiError(0, { detail: "A network error occurred." }));
    xhr.send(body as XMLHttpRequestBodyInit);
  });
}

export const adminApi = {
  // ── Auth ──
  login: (username: string, password: string) =>
    request<{ access: string; refresh: string; user: AdminUser }>("POST", `${API_BASE}/auth/login/`, { username, password }),
  me: () => request<AdminUser>("GET", `${API_BASE}/auth/me/`),

  // ── Schema ──
  schemaList: () => request<{ models: ModelSummary[] }>("GET", `${API_BASE}/schema/`),
  schema: (model: string) => request<ModelSchema>("GET", `${API_BASE}/schema/${model}/`),

  // ── Model CRUD ──
  list: <T = BaseRecord>(model: string, params?: ListParams) => request<Paginated<T>>("GET", `${API_BASE}/r/${model}/${buildQuery(params)}`),
  retrieve: <T = BaseRecord>(model: string, pk: number | string) => request<T>("GET", `${API_BASE}/r/${model}/${pk}/`),
  create: <T = BaseRecord>(model: string, data: Record<string, unknown>, onProgress?: (p: number) => void) =>
    onProgress ? requestWithProgress<T>("POST", `${API_BASE}/r/${model}/`, data, onProgress) : request<T>("POST", `${API_BASE}/r/${model}/`, data),
  update: <T = BaseRecord>(model: string, pk: number | string, data: Record<string, unknown>, onProgress?: (p: number) => void) =>
    onProgress
      ? requestWithProgress<T>("PATCH", `${API_BASE}/r/${model}/${pk}/`, data, onProgress)
      : request<T>("PATCH", `${API_BASE}/r/${model}/${pk}/`, data),
  remove: (model: string, pk: number | string) => request<void>("DELETE", `${API_BASE}/r/${model}/${pk}/`),

  // ── Extras ──
  autocomplete: (model: string, q: string, page = 1) => request<AutocompleteResponse>("GET", `${API_BASE}/r/${model}/autocomplete/${buildQuery({ q, page })}`),
  related: (model: string, pk: number | string) => request<RelatedSummary>("GET", `${API_BASE}/r/${model}/${pk}/related/`),
  bulk: (model: string, body: BulkActionBody | BulkOperationsBody) =>
    request<Record<string, unknown>>("POST", `${API_BASE}/r/${model}/bulk/`, body as unknown as Record<string, unknown>),

  // ── Widgets ──
  widget: <T = Record<string, unknown>>(name: string) => request<T>("GET", `${API_BASE}/widgets/${name}/`),
};

/** Query-key contract — [model, "list", params] / [model, "detail", pk] (do not change). */
export const queryKeys = {
  list: (model: string, params?: ListParams) => [model, "list", params ?? {}] as const,
  detail: (model: string, pk: number | string) => [model, "detail", pk] as const,
  schema: (model: string) => ["schema", model] as const,
  schemaList: () => ["schema", "_list"] as const,
  widget: (name: string) => ["widget", name] as const,
};
