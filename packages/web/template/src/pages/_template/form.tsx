/**
 * GOLDEN TEMPLATE — blog.Post create/edit shared form.
 * Pattern: zod single source + react-hook-form + FK autocomplete + per-field mapping of server validation errors.
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { FkCombobox } from "@/components/composed/fk-combobox";
import { FormRow } from "@/components/composed/form-field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api";

import { defaultFormValues, postFormSchema, type PostFormValues, type PostRecord } from "./schema";

interface PostFormProps {
  record?: PostRecord; // absent → create mode
  onSubmit: (values: PostFormValues) => Promise<void>;
  submitLabel: string;
  disabled?: boolean;
}

export function PostForm({ record, onSubmit, submitLabel, disabled }: PostFormProps) {
  const form = useForm<PostFormValues>({
    resolver: zodResolver(postFormSchema),
    defaultValues: defaultFormValues(record),
  });

  const { errors, isSubmitting } = form.formState;

  async function handleSubmit(values: PostFormValues) {
    try {
      await onSubmit(values);
    } catch (error) {
      // Server validation error → per-field display mapping (DRF {field: [messages]} contract).
      if (error instanceof ApiError && error.status === 400) {
        let mapped = false;
        Object.entries(error.body).forEach(([field, messages]) => {
          if (field in values) {
            form.setError(field as keyof PostFormValues, { message: Array.isArray(messages) ? String(messages[0]) : String(messages) });
            mapped = true;
          }
        });
        if (!mapped) toast.error(error.message);
      } else {
        toast.error(error instanceof Error ? error.message : "A save error occurred.");
      }
    }
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <FormRow label="Category" required error={errors.category?.message}>
          <FkCombobox
            model="blog.Category"
            value={form.watch("category")}
            onChange={(value) => form.setValue("category", value as number | null, { shouldValidate: true })}
            initialLabel={record?.category_label}
            placeholder="Search categories"
            disabled={disabled}
            invalid={Boolean(errors.category)}
            allowClear={false}
          />
        </FormRow>
        <FormRow label="Author" required error={errors.author?.message}>
          <FkCombobox
            model="auth.User"
            value={form.watch("author")}
            onChange={(value) => form.setValue("author", value as number | null, { shouldValidate: true })}
            initialLabel={record?.author_label}
            placeholder="Search users"
            disabled={disabled}
            invalid={Boolean(errors.author)}
            allowClear={false}
          />
        </FormRow>
      </div>

      <FormRow label="Title" htmlFor="title" required error={errors.title?.message}>
        <Input id="title" maxLength={200} aria-invalid={Boolean(errors.title)} disabled={disabled} {...form.register("title")} />
      </FormRow>

      <FormRow label="Body" htmlFor="body" error={errors.body?.message}>
        <Textarea id="body" rows={8} disabled={disabled} {...form.register("body")} />
      </FormRow>

      <div className="flex items-center gap-5">
        <label className="flex items-center gap-1.5 text-body">
          <Checkbox checked={form.watch("is_featured")} onCheckedChange={(checked) => form.setValue("is_featured", checked === true)} disabled={disabled} />
          Mark as featured
        </label>
        <label className="flex items-center gap-1.5 text-body">
          <Checkbox checked={form.watch("is_published")} onCheckedChange={(checked) => form.setValue("is_published", checked === true)} disabled={disabled} />
          Published
        </label>
      </div>

      <div className="mt-1 flex justify-end gap-2 border-t border-border pt-3">
        <Button type="submit" disabled={isSubmitting || disabled}>
          {isSubmitting ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
