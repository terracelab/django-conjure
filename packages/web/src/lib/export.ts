/** CSV (UTF-8 BOM) generation & download — the BOM keeps non-ASCII intact in Excel. No external deps. */

function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = typeof value === "boolean" ? (value ? "Yes" : "No") : String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function downloadCsv(filename: string, headers: string[], rows: unknown[][]): void {
  const lines = [headers.map(escapeCsv).join(","), ...rows.map((row) => row.map(escapeCsv).join(","))];
  // ﻿ = UTF-8 BOM → Excel reads non-ASCII correctly
  const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
