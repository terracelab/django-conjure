/**
 * GenericModelPage — RUNTIME MODE.
 *
 * This is the "install-and-go" page: it renders ANY model purely from the schema API at runtime,
 * with no per-model generated code. It is the counterpart to the codegen template in pages/_template/.
 *
 * Status:
 *   - LIST view: WORKING. Fetches /<api>/schema/{model}/ + /<api>/r/{model}/, derives columns from
 *     schema.list_display, and renders the shared DataTable with server-side pagination/sorting/search.
 *   - CREATE / EDIT: STUB (TODO). A runtime form-generator (schema → zod → controls) is not implemented.
 *     For full create/edit/inline support today, scaffold a model page from pages/_template/ via codegen.
 *
 * Wire it up in the router with a wildcard model route, e.g.:
 *   { path: "g/:model", element: <GenericModelPage /> }
 *   { path: "g/:model/:pk", element: <GenericModelPage /> }
 */

import { useQuery } from "@tanstack/react-query";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { BoolCell, DateCell, EntityLink, NumberCell, StatusBadge, ThumbCell } from "@/components/composed/cells";
import { DataTable } from "@/components/composed/data-table";
import { EmptyState } from "@/components/composed/empty-state";
import { ExportButton } from "@/components/composed/export-button";
import { FilterBar } from "@/components/composed/filter-bar";
import { PageHeader } from "@/components/composed/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { adminApi, queryKeys } from "@/lib/api";
import type { BaseRecord, FieldSchema, ListParams, ModelSchema } from "@/lib/types";

/** Derive a DataTable cell renderer from a Django field schema (composed vocabulary only). */
function renderCell(field: FieldSchema, row: BaseRecord) {
  const value = row[field.name];
  // FK → EntityLink (label from {fk}_label the backend includes)
  if ((field.type === "ForeignKey" || field.type === "OneToOneField") && field.related_model) {
    return <EntityLink model={field.related_model} pk={value as number | null} label={row[`${field.name}_label`] as string | null} />;
  }
  // choices → StatusBadge (display from {field}_display)
  if (field.choices && field.choices.length > 0) {
    return <StatusBadge value={value} display={row[`${field.name}_display`] as string | null} />;
  }
  switch (field.type) {
    case "BooleanField":
      return <BoolCell value={value} />;
    case "DateTimeField":
    case "DateField":
      return <DateCell value={value as string | null} />;
    case "IntegerField":
    case "BigIntegerField":
    case "PositiveIntegerField":
    case "FloatField":
    case "DecimalField":
      return <NumberCell value={value as number | null} />;
    case "ImageField":
      return <ThumbCell src={value as string | null} />;
    default:
      return <span className="block max-w-72 truncate">{value === null || value === undefined || value === "" ? "-" : String(value)}</span>;
  }
}

function buildColumns(schema: ModelSchema): ColumnDef<BaseRecord, unknown>[] {
  const byName = new Map(schema.fields.map((f) => [f.name, f]));
  return schema.list_display.map((name) => {
    const field = byName.get(name);
    const numeric = field && ["IntegerField", "BigIntegerField", "PositiveIntegerField", "FloatField", "DecimalField"].includes(field.type);
    return {
      accessorKey: name,
      header: field?.verbose_name ?? name,
      enableSorting: schema.ordering.includes(name) || schema.ordering.includes(`-${name}`) || name === schema.pk_field || Boolean(field?.editable),
      meta: numeric ? { align: "right" } : undefined,
      cell: ({ row }) => (field ? renderCell(field, row.original) : String(row.original[name] ?? "-")),
    } satisfies ColumnDef<BaseRecord, unknown>;
  });
}

export default function GenericModelPage() {
  const { model, pk } = useParams();
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);

  const schemaQuery = useQuery({
    queryKey: queryKeys.schema(model ?? ""),
    queryFn: () => adminApi.schema(model as string),
    enabled: Boolean(model),
  });

  const params: ListParams = {
    page,
    page_size: 50,
    search: search || undefined,
    ordering: sorting.length ? `${sorting[0].desc ? "-" : ""}${sorting[0].id}` : undefined,
  };

  const listQuery = useQuery({
    queryKey: queryKeys.list(model ?? "", params),
    queryFn: () => adminApi.list<BaseRecord>(model as string, params),
    enabled: Boolean(model) && schemaQuery.isSuccess,
  });

  if (!model) return <p className="py-20 text-center text-fg-muted">No model specified.</p>;

  // TODO(runtime mode): create/edit detail view is not implemented yet.
  // A schema-driven form generator (FieldSchema → zod schema → form controls, mirroring pages/_template/form.tsx)
  // would go here. For now, runtime mode is list-only; use codegen for editable pages.
  if (pk !== undefined) {
    return (
      <div>
        <PageHeader title={`${schemaQuery.data?.verbose_name ?? model} #${pk}`} description="Runtime detail view" />
        <EmptyState message="Runtime create/edit is not implemented yet (TODO). Generate a page from pages/_template/ for full editing support." />
      </div>
    );
  }

  if (schemaQuery.isLoading) return <Skeleton className="h-96 w-full" />;
  if (schemaQuery.isError || !schemaQuery.data) return <p className="py-20 text-center text-fg-muted">Could not load schema for {model}.</p>;

  const schema = schemaQuery.data;
  const columns = buildColumns(schema);

  return (
    <div>
      <PageHeader
        title={schema.verbose_name_plural || schema.verbose_name}
        description={`Runtime view — ${model}`}
        actions={<ExportButton model={model} params={params} />}
      />

      <FilterBar
        search={search}
        onSearch={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder={schema.search_fields.length ? `Search ${schema.search_fields.join(", ")}` : "Search"}
      />

      <DataTable
        columns={columns}
        data={listQuery.data?.results ?? []}
        total={listQuery.data?.count ?? 0}
        page={page}
        pageSize={50}
        onPageChange={setPage}
        sorting={sorting}
        onSortingChange={setSorting}
        getRowId={(row) => String(row[schema.pk_field] ?? "")}
        onRowClick={(row) => navigate(`/g/${model}/${row[schema.pk_field]}`)}
        loading={listQuery.isLoading}
        emptyState={<EmptyState message={`No ${schema.verbose_name_plural || schema.verbose_name} found.`} />}
      />
    </div>
  );
}
