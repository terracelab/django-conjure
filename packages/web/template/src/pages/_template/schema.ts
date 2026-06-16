/**
 * GOLDEN TEMPLATE — example model page (blog.Post). Copy this whole `_template/` directory to
 * src/pages/{model-kebab}/ and adapt it for your model. Every generated model page is a clone of
 * this template; do not deviate from its structure. See CLAUDE.md for the frozen contract.
 *
 * schema.ts — zod form schema + Record type + model key constants + defaultFormValues (single source for the form).
 * Source of truth for fields: /<api>/schema/blog.Post/ (codegen/schema-snapshot.example.json).
 * Rule: derive form types with z.infer only. Hand-written interfaces are allowed for the Record type only.
 */

import { z } from "zod";

import type { BaseRecord } from "@/lib/types";

/** Required FK — use superRefine, not refine: TS 5.5 predicate narrowing would narrow the output to `number` and break the build (codegen rule). */
const requiredFk = (message: string) =>
  z
    .number()
    .nullable()
    .superRefine((value, ctx) => {
      if (value === null) ctx.addIssue({ code: z.ZodIssueCode.custom, message });
    });

export const postFormSchema = z.object({
  category: requiredFk("Please select a category."),
  author: requiredFk("Please select an author."),
  title: z.string().min(1, "Please enter a title.").max(200, "Title must be 200 characters or fewer."),
  body: z.string(),
  is_featured: z.boolean(),
  is_published: z.boolean(),
});

export type PostFormValues = z.infer<typeof postFormSchema>;

/** List/detail response record — the backend serializer attaches _label / {fk}_label. */
export interface PostRecord extends BaseRecord {
  id: number;
  category: number;
  category_label: string | null;
  author: number;
  author_label: string | null;
  title: string;
  body: string | null;
  view_count: number;
  is_published: boolean;
  is_featured: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export const POST_MODEL = "blog.Post";
export const POST_IMAGE_MODEL = "blog.PostImage";
export const COMMENT_MODEL = "blog.Comment";

export function defaultFormValues(record?: PostRecord): PostFormValues {
  return {
    category: record?.category ?? null,
    author: record?.author ?? null,
    title: record?.title ?? "",
    body: record?.body ?? "",
    is_featured: record?.is_featured ?? false,
    is_published: record?.is_published ?? false,
  };
}
