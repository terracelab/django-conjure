/** GOLDEN TEMPLATE — blog.Post table columns. Cells use the composed vocabulary only (EntityLink/BoolCell/DateCell/NumberCell). */

import type { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";

import { BoolCell, DateCell, EntityLink, NumberCell } from "@/components/composed/cells";

import { POST_MODEL, type PostRecord } from "./schema";

export const postColumns: ColumnDef<PostRecord, unknown>[] = [
  { accessorKey: "id", header: "ID", size: 64 },
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => (
      <Link to={`/m/${POST_MODEL}/${row.original.id}`} className="block max-w-72 truncate font-medium text-accent hover:underline" onClick={(e) => e.stopPropagation()}>
        {row.original.is_featured && <span className="mr-1 text-caption text-warning">[Featured]</span>}
        {row.original.title}
      </Link>
    ),
  },
  {
    accessorKey: "author",
    header: "Author",
    cell: ({ row }) => <EntityLink model="auth.User" pk={row.original.author} label={row.original.author_label} />,
  },
  {
    accessorKey: "category",
    header: "Category",
    enableSorting: false,
    cell: ({ row }) => row.original.category_label ?? "-",
  },
  {
    accessorKey: "view_count",
    header: "Views",
    meta: { align: "right" },
    cell: ({ row }) => <NumberCell value={row.original.view_count} />,
  },
  { accessorKey: "is_published", header: "Published", size: 80, cell: ({ row }) => <BoolCell value={row.original.is_published} /> },
  { accessorKey: "created_at", header: "Created", cell: ({ row }) => <DateCell value={row.original.created_at} /> },
];
