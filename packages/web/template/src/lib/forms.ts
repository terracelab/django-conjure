/** Form value conversion helpers — single source for datetime-local & file fields (required by codegen). */

/** ISO (server) → input[type=datetime-local] value. Empty → "" */
export function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** input[type=datetime-local] value → value sent to the server. Empty string → null */
export function fromDatetimeLocal(local: string): string | null {
  if (!local) return null;
  return new Date(local).toISOString();
}

/** input[type=date] value (yyyy-MM-dd) is sent as-is; empty → null */
export function fromDateInput(value: string): string | null {
  return value || null;
}

/**
 * File field submit rule: include the value in the payload only when it is a File.
 * (Sending an existing storage URL string would fail DRF FileField validation.)
 */
export function mergeFilePayload(payload: Record<string, unknown>, files: Record<string, string | File | null>): Record<string, unknown> {
  const merged = { ...payload };
  Object.entries(files).forEach(([field, value]) => {
    if (value instanceof File) merged[field] = value;
    else if (value === null) merged[field] = null; // explicit removal
  });
  return merged;
}
