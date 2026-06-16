/**
 * Inline (related) edit table — add/edit/delete child-model rows inside a detail page.
 * Uses the child model's generic CRUD endpoint filtered by the parent FK (?{fk}={pk}).
 * Row-level immediate save. (For atomic multi-row writes use adminApi.bulk operations.)
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ConfirmDeleteDialog } from "@/components/composed/confirm-delete-dialog";
import { BoolCell, ThumbCell } from "@/components/composed/cells";
import { EmptyState } from "@/components/composed/empty-state";
import { ImageUploadField } from "@/components/composed/image-upload-field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminApi, ApiError, queryKeys } from "@/lib/api";
import type { BaseRecord } from "@/lib/types";

export interface InlineColumn {
  field: string;
  label: string;
  type: "text" | "number" | "checkbox" | "image" | "file";
}

interface InlineTableProps {
  model: string;
  parentField: string;
  parentId: number | string;
  columns: InlineColumn[];
  title: string;
  readonly?: boolean;
}

type Draft = Record<string, unknown>;

function defaultDraft(columns: InlineColumn[]): Draft {
  const draft: Draft = {};
  columns.forEach((col) => {
    draft[col.field] = col.type === "checkbox" ? false : col.type === "image" || col.type === "file" ? null : "";
  });
  return draft;
}

function DraftCell({ column, draft, setDraft }: { column: InlineColumn; draft: Draft; setDraft: (d: Draft) => void }) {
  const value = draft[column.field];
  if (column.type === "checkbox") {
    return <Checkbox checked={Boolean(value)} onCheckedChange={(checked) => setDraft({ ...draft, [column.field]: checked === true })} aria-label={column.label} />;
  }
  if (column.type === "image" || column.type === "file") {
    return (
      <ImageUploadField kind={column.type} value={value as string | File | null} onChange={(file) => setDraft({ ...draft, [column.field]: file })} accept={column.type === "file" ? "*" : undefined} />
    );
  }
  return (
    <Input
      type={column.type === "number" ? "number" : "text"}
      value={value === null || value === undefined ? "" : String(value)}
      onChange={(e) => setDraft({ ...draft, [column.field]: column.type === "number" && e.target.value !== "" ? Number(e.target.value) : e.target.value })}
      aria-label={column.label}
    />
  );
}

export function InlineTable({ model, parentField, parentId, columns, title, readonly = false }: InlineTableProps) {
  const queryClient = useQueryClient();
  const listParams = { [parentField]: parentId, page_size: 200 };
  const [editingPk, setEditingPk] = useState<number | string | null>(null);
  const [draft, setDraft] = useState<Draft>(defaultDraft(columns));
  const [adding, setAdding] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | string | null>(null);
  const [uploadPercent, setUploadPercent] = useState<number | null>(null);

  const query = useQuery({
    queryKey: queryKeys.list(model, listParams),
    queryFn: () => adminApi.list<BaseRecord>(model, listParams),
  });

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: [model] });
  }

  function onError(error: Error) {
    if (error instanceof ApiError) {
      const firstField = Object.entries(error.body)[0];
      toast.error(firstField ? `${firstField[0]}: ${String(firstField[1])}` : error.message);
    } else toast.error(error.message);
  }

  /** Drop existing URL strings (non-File) from the payload — send only changed values. */
  function payloadFromDraft(includeParent: boolean): Record<string, unknown> {
    const payload: Record<string, unknown> = {};
    columns.forEach((col) => {
      const value = draft[col.field];
      if ((col.type === "image" || col.type === "file") && !(value instanceof File)) return;
      payload[col.field] = value === "" ? null : value;
    });
    if (includeParent) payload[parentField] = parentId;
    return payload;
  }

  /** Saves that include a file use the XHR progress callback (upload progress). */
  function progressCallback(payload: Record<string, unknown>) {
    const hasFile = Object.values(payload).some((v) => v instanceof File);
    return hasFile ? (p: number) => setUploadPercent(p) : undefined;
  }

  const createMutation = useMutation({
    mutationFn: () => {
      const payload = payloadFromDraft(true);
      return adminApi.create(model, payload, progressCallback(payload));
    },
    onSuccess: () => {
      toast.success("Added.");
      setAdding(false);
      setDraft(defaultDraft(columns));
      invalidate();
    },
    onError,
    onSettled: () => setUploadPercent(null),
  });

  const updateMutation = useMutation({
    mutationFn: () => {
      const payload = payloadFromDraft(false);
      return adminApi.update(model, editingPk as number | string, payload, progressCallback(payload));
    },
    onSuccess: () => {
      toast.success("Changes saved.");
      setEditingPk(null);
      invalidate();
    },
    onError,
    onSettled: () => setUploadPercent(null),
  });

  const rows = query.data?.results ?? [];

  function startEdit(row: BaseRecord) {
    const next: Draft = {};
    columns.forEach((col) => (next[col.field] = row[col.field] ?? (col.type === "checkbox" ? false : null)));
    setDraft(next);
    setEditingPk(row.id as number | string);
    setAdding(false);
  }

  function renderDisplayCell(row: BaseRecord, column: InlineColumn) {
    const value = row[column.field];
    if (column.type === "checkbox") return <BoolCell value={value} />;
    if (column.type === "image") return <ThumbCell src={value as string | null} />;
    if (column.type === "file")
      return value ? (
        <a href={String(value)} target="_blank" rel="noreferrer" className="text-accent hover:underline">
          View file
        </a>
      ) : (
        <span className="text-fg-muted">-</span>
      );
    return <span>{value === null || value === undefined || value === "" ? "-" : String(value)}</span>;
  }

  const editButtons = (saving: boolean, onSave: () => void, onCancel: () => void) => (
    <span className="flex justify-end gap-1">
      <Button variant="default" disabled={saving} onClick={onSave}>
        {saving ? (uploadPercent !== null ? `Uploading ${uploadPercent}%` : "Saving...") : "Save"}
      </Button>
      <Button variant="ghost" size="icon" aria-label="Cancel" onClick={onCancel}>
        <X className="h-3.5 w-3.5" />
      </Button>
    </span>
  );

  return (
    <div className="rounded border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <h3 className="text-emphasis font-semibold">{title}</h3>
        {!readonly && !adding && (
          <Button
            variant="outline"
            onClick={() => {
              setDraft(defaultDraft(columns));
              setAdding(true);
              setEditingPk(null);
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            Add row
          </Button>
        )}
      </div>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {columns.map((col) => (
              <TableHead key={col.field}>{col.label}</TableHead>
            ))}
            {!readonly && <TableHead className="w-24 text-right">Manage</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 && !adding ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={columns.length + (readonly ? 0 : 1)}>
                <EmptyState message={`No ${title} yet.${readonly ? "" : " Add the first one."}`} />
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => {
              const pk = row.id as number | string;
              const editing = editingPk === pk;
              return (
                <TableRow key={String(pk)}>
                  {columns.map((col) => (
                    <TableCell key={col.field}>{editing ? <DraftCell column={col} draft={draft} setDraft={setDraft} /> : renderDisplayCell(row, col)}</TableCell>
                  ))}
                  {!readonly && (
                    <TableCell className="text-right">
                      {editing ? (
                        editButtons(updateMutation.isPending, () => updateMutation.mutate(), () => setEditingPk(null))
                      ) : (
                        <span className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => startEdit(row)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" aria-label="Delete" onClick={() => setDeleteTarget(pk)}>
                            <Trash2 className="h-3.5 w-3.5 text-danger" />
                          </Button>
                        </span>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              );
            })
          )}
          {adding && (
            <TableRow className="bg-accent/5 hover:bg-accent/5">
              {columns.map((col) => (
                <TableCell key={col.field}>
                  <DraftCell column={col} draft={draft} setDraft={setDraft} />
                </TableCell>
              ))}
              <TableCell className="text-right">{editButtons(createMutation.isPending, () => createMutation.mutate(), () => setAdding(false))}</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <ConfirmDeleteDialog model={model} pk={deleteTarget} onClose={() => setDeleteTarget(null)} onDeleted={invalidate} />
    </div>
  );
}
