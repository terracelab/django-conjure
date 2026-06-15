/**
 * Excel export action — a generic button that attaches to any model list.
 * It reflects the current search/filter/sort (params), iterates over all pages,
 * and downloads the schema's list_display columns as CSV (UTF-8 BOM, Excel-friendly).
 * FK/choices use the {field}_label / {field}_display the response already includes (no extra fetches).
 *
 * Usage:
 *  - Toolbar (all / filtered): PageHeader actions: <ExportButton model={MODEL} params={params} />
 *  - Selected rows only: FilterBar bulkActions: <ExportButton model={MODEL} params={{ id__in: selectedIds.join(",") }} label="Export selected" />
 */

import { Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { adminApi, queryKeys } from "@/lib/api";
import { downloadCsv } from "@/lib/export";
import { queryClient } from "@/lib/query";
import type { BaseRecord, ListParams, ModelSchema } from "@/lib/types";

const MAX_ROWS = 5000; // guard against oversized downloads
const PAGE_SIZE = 200; // api max_page_size

export function ExportButton({ model, params, filename, label = "Export" }: { model: string; params: ListParams; filename?: string; label?: string }) {
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    try {
      // Reuse the cached schema (columns + labels).
      const schema = await queryClient.fetchQuery({
        queryKey: queryKeys.schema(model),
        queryFn: () => adminApi.schema(model),
        staleTime: 5 * 60_000,
      });
      const fields = (schema as ModelSchema).list_display;
      const labelOf = (name: string) => (schema as ModelSchema).fields.find((f) => f.name === name)?.verbose_name ?? name;
      const headers = fields.map(labelOf);

      const rows: unknown[][] = [];
      let page = 1;
      let total = Infinity;
      while (rows.length < total && rows.length < MAX_ROWS) {
        const res = await adminApi.list<BaseRecord>(model, { ...params, page, page_size: PAGE_SIZE });
        total = res.count;
        for (const row of res.results) {
          rows.push(fields.map((f) => row[`${f}_label`] ?? row[`${f}_display`] ?? row[f] ?? ""));
        }
        if (res.results.length < PAGE_SIZE) break;
        page += 1;
      }

      const capped = rows.slice(0, MAX_ROWS);
      const today = new Date().toISOString().slice(0, 10);
      const name = filename ?? `${(schema as ModelSchema).verbose_name}_${today}.csv`;
      downloadCsv(name, headers, capped);
      toast.success(`Exported ${capped.length} rows.${total > MAX_ROWS ? ` (capped at ${MAX_ROWS})` : ""}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" onClick={run} disabled={loading}>
      <Download className="h-3.5 w-3.5" />
      {loading ? "Exporting..." : label}
    </Button>
  );
}
