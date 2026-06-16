/**
 * GOLDEN TEMPLATE — blog.Post list page.
 * Pattern: server-side DataTable + FilterBar (search/filters/bulk actions) + row selection + bulk actions + create button.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { RowSelectionState, SortingState } from "@tanstack/react-table";
import { Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { DataTable } from "@/components/composed/data-table";
import { EmptyState } from "@/components/composed/empty-state";
import { ExportButton } from "@/components/composed/export-button";
import { FilterBar } from "@/components/composed/filter-bar";
import { FkCombobox } from "@/components/composed/fk-combobox";
import { PageHeader } from "@/components/composed/page-header";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { adminApi, queryKeys } from "@/lib/api";
import type { ListParams } from "@/lib/types";

import { postColumns } from "./columns";
import { POST_MODEL, type PostRecord } from "./schema";

export default function PostListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<number | string | null>(null);
  const [isFeatured, setIsFeatured] = useState("");
  const [isPublished, setIsPublished] = useState("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "created_at", desc: true }]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  // ── URL/query contract (1:1 with the backend) ──
  // ?page=&page_size=&ordering=&search=&{field}={value}  — filters must use the schema's list_filter paths only.
  const params: ListParams = {
    page,
    page_size: 50,
    search: search || undefined,
    category: category ?? undefined,
    is_featured: isFeatured || undefined,
    is_published: isPublished || undefined,
    ordering: sorting.length ? `${sorting[0].desc ? "-" : ""}${sorting[0].id}` : undefined,
  };

  const query = useQuery({
    queryKey: queryKeys.list(POST_MODEL, params),
    queryFn: () => adminApi.list<PostRecord>(POST_MODEL, params),
  });

  const selectedIds = Object.keys(rowSelection).map(Number);

  function afterBulk() {
    setRowSelection({});
    void queryClient.invalidateQueries({ queryKey: [POST_MODEL] });
  }

  const bulkDelete = useMutation({
    mutationFn: () => adminApi.bulk(POST_MODEL, { action: "delete", ids: selectedIds }),
    onSuccess: (data) => {
      toast.success(`Deleted ${data.deleted as number}.`);
      setBulkDeleteOpen(false);
      afterBulk();
    },
    onError: (error: Error) => toast.error(error.message || "Bulk delete failed."),
  });

  const bulkPublish = useMutation({
    mutationFn: (published: boolean) => adminApi.bulk(POST_MODEL, { action: "update", ids: selectedIds, data: { is_published: published } }),
    onSuccess: (data, published) => {
      toast.success(`${published ? "Published" : "Unpublished"} ${data.updated as number}.`);
      afterBulk();
    },
    onError: (error: Error) => toast.error(error.message || "Bulk update failed."),
  });

  function resetPage<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setPage(1);
    };
  }

  return (
    <div>
      <PageHeader
        title="Posts"
        description="Manage blog posts"
        actions={
          <>
            <ExportButton model={POST_MODEL} params={params} />
            <Button onClick={() => navigate(`/m/${POST_MODEL}/new`)}>
              <Plus className="h-3.5 w-3.5" />
              Add post
            </Button>
          </>
        }
      />

      <FilterBar
        search={search}
        onSearch={resetPage(setSearch)}
        searchPlaceholder="Search title/body/author"
        filters={
          <>
            <div className="w-44">
              <FkCombobox model="blog.Category" value={category} onChange={resetPage(setCategory)} placeholder="All categories" />
            </div>
            <div className="w-32">
              <Select value={isFeatured} onChange={(e) => resetPage(setIsFeatured)(e.target.value)} aria-label="Featured filter">
                <option value="">All</option>
                <option value="true">Featured</option>
                <option value="false">Not featured</option>
              </Select>
            </div>
            <div className="w-32">
              <Select value={isPublished} onChange={(e) => resetPage(setIsPublished)(e.target.value)} aria-label="Published filter">
                <option value="">All</option>
                <option value="true">Published</option>
                <option value="false">Draft</option>
              </Select>
            </div>
          </>
        }
        selectedCount={selectedIds.length}
        bulkActions={
          <>
            <Button variant="outline" onClick={() => bulkPublish.mutate(true)} disabled={bulkPublish.isPending}>
              <Eye className="h-3.5 w-3.5" />
              Publish
            </Button>
            <Button variant="outline" onClick={() => bulkPublish.mutate(false)} disabled={bulkPublish.isPending}>
              <EyeOff className="h-3.5 w-3.5" />
              Unpublish
            </Button>
            <Button variant="danger" onClick={() => setBulkDeleteOpen(true)}>
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          </>
        }
      />

      <DataTable
        columns={postColumns}
        data={query.data?.results ?? []}
        total={query.data?.count ?? 0}
        page={page}
        pageSize={50}
        onPageChange={setPage}
        sorting={sorting}
        onSortingChange={setSorting}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        getRowId={(row) => String(row.id)}
        onRowClick={(row) => navigate(`/m/${POST_MODEL}/${row.id}`)}
        loading={query.isLoading}
        emptyState={
          <EmptyState
            message="No posts yet. Add the first one."
            action={
              <Button onClick={() => navigate(`/m/${POST_MODEL}/new`)}>
                <Plus className="h-3.5 w-3.5" />
                Add post
              </Button>
            }
          />
        }
      />

      {/* Bulk delete confirmation */}
      <Dialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {selectedIds.length} selected?</DialogTitle>
            <DialogDescription>Related data (images, comments, reactions) will also be deleted. This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" disabled={bulkDelete.isPending} onClick={() => bulkDelete.mutate()}>
              {bulkDelete.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
