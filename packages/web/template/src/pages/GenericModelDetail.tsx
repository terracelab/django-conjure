/**
 * GenericModelDetail — RUNTIME MODE create / edit / delete.
 *
 * Schema-driven counterpart to the codegen pages/_template/{detail,form}.tsx: it builds the whole
 * edit form from the schema API at runtime (no per-model code), following the SAME field-type →
 * control mapping as the frozen template (see CLAUDE.md). Renders an editable form for writable
 * fields, a read-only metadata card, inline child tables, and delete with related-object warning.
 *
 * Excluded from the runtime form (matching the codegen contract): ManyToManyField and JSONField
 * (shown read-only). Use codegen mode if you need bespoke controls for those.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Trash2 } from "lucide-react";
import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { ConfirmDeleteDialog } from "@/components/composed/confirm-delete-dialog";
import { FkCombobox } from "@/components/composed/fk-combobox";
import { FormRow } from "@/components/composed/form-field";
import { ImageUploadField } from "@/components/composed/image-upload-field";
import { InlineColumn, InlineTable } from "@/components/composed/inline-table";
import { PageHeader } from "@/components/composed/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { adminApi, ApiError, queryKeys } from "@/lib/api";
import { fromDateInput, fromDatetimeLocal, mergeFilePayload, toDatetimeLocal } from "@/lib/forms";
import type { BaseRecord, FieldSchema, InlineSchema, ModelSchema } from "@/lib/types";

import { renderCell } from "./GenericModelPage";

// ── field classification ────────────────────────────────────────────────────────
const AUTO_TYPES = new Set(["AutoField", "BigAutoField", "SmallAutoField"]);
const NUMERIC_TYPES = new Set([
  "IntegerField",
  "BigIntegerField",
  "PositiveIntegerField",
  "PositiveSmallIntegerField",
  "SmallIntegerField",
  "FloatField",
  "DecimalField",
]);
const TEXT_TYPES = new Set(["CharField", "SlugField", "EmailField", "URLField", "GenericIPAddressField", "UUIDField"]);
// Not editable through the runtime form (match the codegen contract).
const SKIP_FORM_TYPES = new Set(["ManyToManyField", "JSONField"]);

const isFile = (f: FieldSchema) => f.upload === "image" || f.upload === "file" || f.type === "ImageField" || f.type === "FileField";
const isFk = (f: FieldSchema) => (f.type === "ForeignKey" || f.type === "OneToOneField") && Boolean(f.related_model);

/** Writable fields: editable, not the pk, not auto, not readonly, not an excluded type. */
function isEditableField(field: FieldSchema, schema: ModelSchema): boolean {
  return (
    field.editable &&
    field.name !== schema.pk_field &&
    !AUTO_TYPES.has(field.type) &&
    !SKIP_FORM_TYPES.has(field.type) &&
    !schema.readonly_fields.includes(field.name)
  );
}

type FormValue = string | number | boolean | null;

function initialValue(field: FieldSchema, record?: BaseRecord): FormValue {
  const raw = record?.[field.name];
  if (isFk(field)) return (raw as number | null) ?? null;
  if (field.type === "BooleanField") return Boolean(raw ?? field.default ?? false);
  if (field.type === "DateTimeField") return toDatetimeLocal(raw as string | null);
  if (field.type === "DateField") return raw ? String(raw) : "";
  if (NUMERIC_TYPES.has(field.type)) return raw === null || raw === undefined ? "" : String(raw);
  return raw === null || raw === undefined ? "" : String(raw);
}

function isEmpty(value: FormValue): boolean {
  return value === null || value === undefined || value === "";
}

// ── inline children ─────────────────────────────────────────────────────────────
function inlineColumns(schema: ModelSchema, fkField: string): InlineColumn[] {
  const cols: InlineColumn[] = [];
  for (const f of schema.fields) {
    if (f.name === fkField || f.name === schema.pk_field) continue;
    if (!f.editable || AUTO_TYPES.has(f.type) || schema.readonly_fields.includes(f.name)) continue;
    if (f.choices?.length || isFk(f)) continue; // InlineTable has no select/FK control
    let type: InlineColumn["type"] | null = null;
    if (f.type === "BooleanField") type = "checkbox";
    else if (f.upload === "image" || f.type === "ImageField") type = "image";
    else if (f.upload === "file" || f.type === "FileField") type = "file";
    else if (NUMERIC_TYPES.has(f.type)) type = "number";
    else if (TEXT_TYPES.has(f.type) || f.type === "TextField") type = "text";
    if (!type) continue; // skip date/datetime/json — no inline control
    cols.push({ field: f.name, label: f.verbose_name, type });
    if (cols.length >= 6) break; // keep the inline table compact
  }
  return cols;
}

function RuntimeInline({ inline, parentId }: { inline: InlineSchema; parentId: number | string }) {
  const schemaQuery = useQuery({
    queryKey: queryKeys.schema(inline.model),
    queryFn: () => adminApi.schema(inline.model),
  });
  if (!schemaQuery.data) return null;
  const columns = inlineColumns(schemaQuery.data, inline.fk_field);
  if (!columns.length) return null; // nothing editable inline → skip
  return (
    <InlineTable
      model={inline.model}
      parentField={inline.fk_field}
      parentId={parentId}
      title={schemaQuery.data.verbose_name_plural || inline.verbose_name}
      columns={columns}
      readonly={!schemaQuery.data.permissions.change}
    />
  );
}

// ── form ──────────────────────────────────────────────────────────────────────
function DetailForm({ model, schema, record, isCreate }: { model: string; schema: ModelSchema; record?: BaseRecord; isCreate: boolean }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const editable = useMemo(() => schema.fields.filter((f) => isEditableField(f, schema)), [schema]);
  const fileFields = useMemo(() => editable.filter(isFile), [editable]);
  const formFields = useMemo(() => editable.filter((f) => !isFile(f)), [editable]);
  const metaFields = useMemo(
    () => schema.fields.filter((f) => !isEditableField(f, schema) && f.type !== "ManyToManyField"),
    [schema],
  );

  const [values, setValues] = useState<Record<string, FormValue>>(() =>
    Object.fromEntries(formFields.map((f) => [f.name, initialValue(f, record)])),
  );
  const [files, setFiles] = useState<Record<string, string | File | null>>(() =>
    Object.fromEntries(fileFields.map((f) => [f.name, (record?.[f.name] as string | null) ?? null])),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteOpen, setDeleteOpen] = useState(false);

  const pkValue = record?.[schema.pk_field] as number | string | undefined;
  const canChange = isCreate ? schema.permissions.add : schema.permissions.change;
  const disabled = !canChange;

  function setValue(name: string, v: FormValue) {
    setValues((s) => ({ ...s, [name]: v }));
    setErrors((e) => {
      if (!(name in e)) return e;
      const { [name]: _omit, ...rest } = e;
      return rest;
    });
  }

  function buildPayload(): Record<string, unknown> {
    const payload: Record<string, unknown> = {};
    for (const f of formFields) {
      const v = values[f.name];
      if (isFk(f)) payload[f.name] = v ?? null;
      else if (f.type === "BooleanField") payload[f.name] = Boolean(v);
      else if (f.type === "DateTimeField") payload[f.name] = fromDatetimeLocal(String(v ?? ""));
      else if (f.type === "DateField") payload[f.name] = fromDateInput(String(v ?? ""));
      else if (NUMERIC_TYPES.has(f.type)) payload[f.name] = v === "" || v === null ? null : Number(v);
      else payload[f.name] = v === "" && f.null ? null : (v ?? "");
    }
    return mergeFilePayload(payload, files);
  }

  const saveMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      isCreate ? adminApi.create<BaseRecord>(model, payload) : adminApi.update<BaseRecord>(model, pkValue as number | string, payload),
    onSuccess: (saved) => {
      toast.success(isCreate ? "Added." : "Changes saved.");
      void queryClient.invalidateQueries({ queryKey: [model] });
      if (isCreate) navigate(`/g/${model}/${saved[schema.pk_field]}`, { replace: true });
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 400) {
        const next: Record<string, string> = {};
        let mapped = false;
        Object.entries(error.body).forEach(([field, messages]) => {
          if (field === "detail" || field === "non_field_errors") return;
          next[field] = Array.isArray(messages) ? String(messages[0]) : String(messages);
          mapped = true;
        });
        setErrors(next);
        const nonField = error.body.non_field_errors;
        toast.error(Array.isArray(nonField) ? String(nonField[0]) : mapped ? "Please fix the highlighted fields." : error.message);
      } else {
        toast.error(error instanceof Error ? error.message : "A save error occurred.");
      }
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const required: Record<string, string> = {};
    for (const f of formFields) {
      if (f.required && f.type !== "BooleanField" && isEmpty(values[f.name])) {
        required[f.name] = "This field is required.";
      }
    }
    if (Object.keys(required).length) {
      setErrors(required);
      return;
    }
    saveMutation.mutate(buildPayload());
  }

  function control(field: FieldSchema) {
    const value = values[field.name];
    const invalid = Boolean(errors[field.name]);
    if (isFk(field)) {
      return (
        <FkCombobox
          model={field.related_model as string}
          value={value as number | null}
          onChange={(v) => setValue(field.name, v)}
          initialLabel={record?.[`${field.name}_label`] as string | null}
          placeholder={`Search ${field.verbose_name}`}
          disabled={disabled}
          invalid={invalid}
          allowClear={!field.required}
        />
      );
    }
    if (field.choices?.length) {
      return (
        <Select
          value={String(value ?? "")}
          onChange={(e) => setValue(field.name, e.target.value)}
          disabled={disabled}
          aria-invalid={invalid}
        >
          {(!field.required || isEmpty(value)) && <option value="">—</option>}
          {field.choices.map(([val, label]) => (
            <option key={String(val)} value={String(val)}>
              {label}
            </option>
          ))}
        </Select>
      );
    }
    if (field.type === "BooleanField") {
      return (
        <div className="flex h-input items-center">
          <Checkbox checked={Boolean(value)} onCheckedChange={(c) => setValue(field.name, c === true)} disabled={disabled} aria-label={field.verbose_name} />
        </div>
      );
    }
    if (field.type === "TextField") {
      return <Textarea rows={6} value={String(value ?? "")} onChange={(e) => setValue(field.name, e.target.value)} disabled={disabled} aria-invalid={invalid} />;
    }
    if (field.type === "DateTimeField") {
      return <Input type="datetime-local" value={String(value ?? "")} onChange={(e) => setValue(field.name, e.target.value)} disabled={disabled} aria-invalid={invalid} />;
    }
    if (field.type === "DateField") {
      return <Input type="date" value={String(value ?? "")} onChange={(e) => setValue(field.name, e.target.value)} disabled={disabled} aria-invalid={invalid} />;
    }
    if (NUMERIC_TYPES.has(field.type)) {
      const step = field.type === "DecimalField" || field.type === "FloatField" ? "any" : "1";
      return <Input type="number" step={step} value={String(value ?? "")} onChange={(e) => setValue(field.name, e.target.value)} disabled={disabled} aria-invalid={invalid} />;
    }
    return (
      <Input
        type={field.type === "EmailField" ? "email" : field.type === "URLField" ? "url" : "text"}
        maxLength={field.max_length}
        value={String(value ?? "")}
        onChange={(e) => setValue(field.name, e.target.value)}
        disabled={disabled}
        aria-invalid={invalid}
      />
    );
  }

  return (
    <div>
      <PageHeader
        title={isCreate ? `Add ${schema.verbose_name}` : `${schema.verbose_name} #${pkValue}`}
        description={isCreate ? `Create a new ${schema.verbose_name}.` : ((record?._label as string) ?? model)}
        actions={
          <>
            <Button variant="outline" onClick={() => navigate(`/g/${model}`)}>
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to list
            </Button>
            {!isCreate && schema.permissions.delete && (
              <Button variant="danger" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-12 gap-3">
        <Card className="col-span-12 xl:col-span-8">
          <CardHeader>
            <CardTitle>{isCreate ? `New ${schema.verbose_name}` : `${schema.verbose_name} details`}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              {formFields.map((field) => (
                <FormRow key={field.name} label={field.verbose_name} required={field.required} error={errors[field.name]} help={field.help_text}>
                  {control(field)}
                </FormRow>
              ))}

              {fileFields.map((field) => (
                <FormRow key={field.name} label={field.verbose_name} required={field.required} error={errors[field.name]} help={field.help_text}>
                  <ImageUploadField
                    kind={field.upload === "file" || field.type === "FileField" ? "file" : "image"}
                    accept={field.upload === "file" || field.type === "FileField" ? "*" : undefined}
                    value={files[field.name]}
                    onChange={(file) => setFiles((s) => ({ ...s, [field.name]: file }))}
                    disabled={disabled}
                  />
                </FormRow>
              ))}

              {!formFields.length && !fileFields.length && <p className="text-body text-fg-muted">This model has no editable fields.</p>}

              {canChange && (
                <div className="mt-1 flex justify-end gap-2 border-t border-border pt-3">
                  <Button type="submit" disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? "Saving..." : isCreate ? `Add ${schema.verbose_name}` : "Save changes"}
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {!isCreate && record && metaFields.length > 0 && (
          <Card className="col-span-12 self-start xl:col-span-4">
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-y-2 text-body">
                {metaFields.map((field) => (
                  <div key={field.name} className="contents">
                    <dt className="text-fg-muted">{field.verbose_name}</dt>
                    <dd>{renderCell(field, record)}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        )}

        {!isCreate && pkValue !== undefined &&
          schema.inlines.map((inline) => (
            <div key={`${inline.model}:${inline.fk_field}`} className="col-span-12">
              <RuntimeInline inline={inline} parentId={pkValue} />
            </div>
          ))}
      </div>

      <ConfirmDeleteDialog
        model={model}
        pk={deleteOpen && pkValue !== undefined ? pkValue : null}
        label={record?._label as string | undefined}
        onClose={() => setDeleteOpen(false)}
        onDeleted={() => {
          void queryClient.invalidateQueries({ queryKey: [model] });
          navigate(`/g/${model}`);
        }}
      />
    </div>
  );
}

export default function GenericModelDetail({ model, pk }: { model: string; pk: string }) {
  const isCreate = pk === "new";

  const schemaQuery = useQuery({
    queryKey: queryKeys.schema(model),
    queryFn: () => adminApi.schema(model),
  });

  const recordQuery = useQuery({
    queryKey: queryKeys.detail(model, pk),
    queryFn: () => adminApi.retrieve<BaseRecord>(model, pk),
    enabled: !isCreate,
  });

  if (schemaQuery.isLoading || (!isCreate && recordQuery.isLoading)) return <Skeleton className="h-96 w-full" />;
  if (schemaQuery.isError || !schemaQuery.data) return <p className="py-20 text-center text-fg-muted">Could not load schema for {model}.</p>;
  if (!isCreate && (recordQuery.isError || !recordQuery.data)) return <p className="py-20 text-center text-fg-muted">{schemaQuery.data.verbose_name} not found.</p>;

  // key on pk so the form state re-initializes when navigating between records / to "new".
  return <DetailForm key={pk} model={model} schema={schemaQuery.data} record={recordQuery.data} isCreate={isCreate} />;
}
