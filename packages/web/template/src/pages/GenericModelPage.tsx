/**
 * GenericModelPage — RUNTIME MODE.
 *
 * This is the "install-and-go" page: it renders ANY model purely from the schema API at runtime,
 * with no per-model generated code. It is the counterpart to the codegen template in pages/_template/.
 *
 * Status:
 *   - LIST view: WORKING. Fetches /<api>/schema/{model}/ + /<api>/r/{model}/, derives columns from
 *     schema.list_display, and renders the shared DataTable with server-side pagination/sorting/search.
 *   - CREATE / EDIT / DELETE: WORKING via GenericModelDetail — a schema-driven form generator
 *     (FieldSchema → control) mirroring the frozen pages/_template/ contract, including inline children.
 *
 * Wire it up in the router with a wildcard model route, e.g.:
 *   { path: "g/:model", element: <GenericModelPage /> }
 *   { path: "g/:model/:pk", element: <GenericModelPage /> }
 */

import { useQuery } from "@tanstack/react-query";
import type { ColumnDef, RowSelectionState, SortingState } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { BoolCell, DateCell, EntityLink, NumberCell, StatusBadge, ThumbCell } from "@/components/composed/cells";
import { DataTable } from "@/components/composed/data-table";
import { EmptyState } from "@/components/composed/empty-state";
import { ExportButton } from "@/components/composed/export-button";
import { FilterBar } from "@/components/composed/filter-bar";
import { FkCombobox } from "@/components/composed/fk-combobox";
import { PageHeader } from "@/components/composed/page-header";
import { SectionTabs } from "@/components/composed/section-tabs";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { adminApi, ApiError, queryKeys } from "@/lib/api";
import { queryClient } from "@/lib/query";
import type { ActionSpec, BaseRecord, FieldSchema, ListParams, ModelSchema } from "@/lib/types";

import GenericModelDetail from "./GenericModelDetail";

/** Derive a DataTable cell renderer from a Django field schema (composed vocabulary only). */
export function renderCell(field: FieldSchema, row: BaseRecord) {
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
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

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
    ...Object.fromEntries(Object.entries(filterValues).filter(([, v]) => v !== "")),
  };

  const listQuery = useQuery({
    queryKey: queryKeys.list(model ?? "", params),
    queryFn: () => adminApi.list<BaseRecord>(model as string, params),
    enabled: Boolean(model) && schemaQuery.isSuccess && pk === undefined,
  });

  // Section tabs (CONJURE["SECTIONS"]): sibling models sharing this model's section, in tab order.
  const schemaListQuery = useQuery({ queryKey: queryKeys.schemaList(), queryFn: adminApi.schemaList });
  const sectionTabs = useMemo(() => {
    const all = schemaListQuery.data?.models ?? [];
    const current = all.find((m) => m.model === model);
    if (!current) return undefined;
    return all
      .filter((m) => m.section === current.section)
      .sort((a, b) => a.section_order - b.section_order)
      .map((m) => ({ model: m.model, label: m.verbose_name, to: `/g/${m.model}` }));
  }, [schemaListQuery.data, model]);

  // Row selection + "select all matching the filter" (across pages).
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [allFiltered, setAllFiltered] = useState(false);
  useEffect(() => {
    // A new result set invalidates any selection. (Page changes keep id-based selection.)
    setRowSelection({});
    setAllFiltered(false);
  }, [model, search, sorting, filterValues]);

  if (!model) return <p className="py-20 text-center text-fg-muted">No model specified.</p>;

  // Detail / create / edit / delete — schema-driven runtime form (no per-model code).
  if (pk !== undefined) return <GenericModelDetail model={model} pk={pk} />;

  if (schemaQuery.isLoading) return <Skeleton className="h-96 w-full" />;
  if (schemaQuery.isError || !schemaQuery.data) return <p className="py-20 text-center text-fg-muted">Could not load schema for {model}.</p>;

  const schema = schemaQuery.data;
  const columns = buildColumns(schema);

  const pageRows = listQuery.data?.results ?? [];
  const total = listQuery.data?.count ?? 0;
  const selectedIds = Object.keys(rowSelection);
  const allPageSelected = pageRows.length > 0 && pageRows.every((r) => rowSelection[String(r[schema.pk_field] ?? "")]);
  const selectedCount = allFiltered ? total : selectedIds.length;
  // "All filtered" → export the whole filtered query (drop the id filter); else just the picked ids.
  const exportParams: ListParams = allFiltered ? params : { ...params, [`${schema.pk_field}__in`]: selectedIds.join(",") };

  // Filter controls built from schema.list_filter (boolean / choices / FK) — drive `?{field}=`.
  const setFilter = (name: string, value: string) => {
    setFilterValues((prev) => ({ ...prev, [name]: value }));
    setPage(1);
  };
  const filterControls = schema.list_filter
    .map((name) => {
      const field = schema.fields.find((f) => f.name === name);
      if (!field) return null;
      const value = filterValues[name] ?? "";
      if ((field.type === "ForeignKey" || field.type === "OneToOneField") && field.related_model) {
        return (
          <div key={name} className="w-44">
            <FkCombobox
              model={field.related_model}
              value={value || null}
              onChange={(v) => setFilter(name, v != null ? String(v) : "")}
              placeholder={`${field.verbose_name}: 전체`}
            />
          </div>
        );
      }
      const options: [string, string][] | null = field.choices?.length
        ? field.choices.map(([v, l]): [string, string] => [String(v), l])
        : field.type === "BooleanField"
          ? ([["true", "예"], ["false", "아니오"]] as [string, string][])
          : null;
      if (!options) return null;
      return (
        <div key={name} className="w-36">
          <Select value={value} onChange={(e) => setFilter(name, e.target.value)} aria-label={field.verbose_name}>
            <option value="">{field.verbose_name}: 전체</option>
            {options.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </Select>
        </div>
      );
    })
    .filter(Boolean);

  // Custom action (CONJURE AdminConfig.actions) — runs on the picked ids or the whole filtered set.
  const runAction = async (action: ActionSpec) => {
    if (action.destructive && !window.confirm(`선택 ${selectedCount}건에 "${action.label}"을(를) 실행할까요?`)) return;
    const body = allFiltered
      ? { all_filtered: true, params: { ...filterValues, search: search || "" } }
      : { ids: selectedIds };
    try {
      const res = await adminApi.action(model, action.name, body);
      toast.success(res?.message ?? "완료되었습니다.");
      setRowSelection({});
      setAllFiltered(false);
      queryClient.invalidateQueries({ queryKey: [model, "list"] });
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "실행에 실패했습니다.");
    }
  };

  return (
    <SectionTabs model={model} tabs={sectionTabs}>
      <PageHeader
        title={schema.verbose_name_plural || schema.verbose_name}
        description={`Runtime view — ${model}`}
        actions={
          <>
            {schema.permissions.add && !schema.is_readonly && (
              <Button onClick={() => navigate(`/g/${model}/new`)}>
                <Plus className="h-3.5 w-3.5" />
                {schema.verbose_name} 추가
              </Button>
            )}
            <ExportButton model={model} params={params} />
          </>
        }
      />

      <FilterBar
        search={search}
        onSearch={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder={schema.search_fields.length ? `Search ${schema.search_fields.join(", ")}` : "Search"}
        filters={filterControls.length ? <>{filterControls}</> : undefined}
        selectedCount={selectedCount}
        bulkActions={
          <>
            <ExportButton model={model} params={exportParams} label="선택 내보내기" />
            {(schema.actions ?? []).map((action) => (
              <Button key={action.name} variant={action.destructive ? "danger" : "outline"} onClick={() => runAction(action)}>
                {action.label}
              </Button>
            ))}
          </>
        }
      />

      {/* Escalate page selection to the entire filtered set (Django-admin "select all N"). */}
      {selectedCount > 0 && total > pageRows.length && (
        <div className="mb-2 rounded bg-accent/10 px-3 py-1.5 text-caption">
          {allFiltered ? (
            <span>
              필터에 맞는 전체 <b>{total}</b>개 선택됨.{" "}
              <button type="button" onClick={() => setAllFiltered(false)} className="font-medium text-accent hover:underline">
                선택 해제
              </button>
            </span>
          ) : allPageSelected ? (
            <span>
              이 페이지 <b>{pageRows.length}</b>개 선택됨.{" "}
              <button type="button" onClick={() => setAllFiltered(true)} className="font-medium text-accent hover:underline">
                필터에 맞는 전체 {total}개 선택
              </button>
            </span>
          ) : null}
        </div>
      )}

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
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        onRowClick={(row) => navigate(`/g/${model}/${row[schema.pk_field]}`)}
        loading={listQuery.isLoading}
        emptyState={<EmptyState message={`No ${schema.verbose_name_plural || schema.verbose_name} found.`} />}
      />
    </SectionTabs>
  );
}
