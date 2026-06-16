/** Single source of truth for currency / number / datetime formatters — codegen output must use this module. */

import { format, formatDistanceToNow, isToday } from "date-fns";

/**
 * Locale & currency are configurable per project. Override once at boot, e.g.:
 *   import { configureFormat } from "@/lib/format";
 *   configureFormat({ locale: "en-US", currency: "USD" });
 * Defaults to the runtime locale and USD.
 */
let LOCALE = typeof navigator !== "undefined" ? navigator.language : "en-US";
let CURRENCY = "USD";

export function configureFormat(opts: { locale?: string; currency?: string }): void {
  if (opts.locale) LOCALE = opts.locale;
  if (opts.currency) CURRENCY = opts.currency;
}

export function formatCurrency(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "-";
  const num = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(num)) return "-";
  return new Intl.NumberFormat(LOCALE, { style: "currency", currency: CURRENCY }).format(num);
}

export function formatNumber(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "-";
  const num = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(num)) return "-";
  return num.toLocaleString(LOCALE);
}

/** Datetime: fixed yyyy-MM-dd HH:mm; relative time when the value is today. */
export function formatDateTime(value: string | null | undefined, relative = true): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  if (relative && isToday(date)) return formatDistanceToNow(date, { addSuffix: true });
  return format(date, "yyyy-MM-dd HH:mm");
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return format(date, "yyyy-MM-dd");
}

export function formatPercent(value: number | string | null | undefined, digits = 2): string {
  if (value === null || value === undefined || value === "") return "-";
  const num = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(num)) return "-";
  return `${num.toFixed(digits)}%`;
}
