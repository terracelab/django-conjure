/**
 * GOLDEN TEMPLATE — blog.Post detail/create page.
 * Pattern: shared create/edit route (/new | /:pk) + inline child editing (images, comments) + delete confirmation (related-object warning).
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Trash2 } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { DateCell, NumberCell } from "@/components/composed/cells";
import { ConfirmDeleteDialog } from "@/components/composed/confirm-delete-dialog";
import { InlineTable } from "@/components/composed/inline-table";
import { PageHeader } from "@/components/composed/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { adminApi, queryKeys } from "@/lib/api";

import { PostForm } from "./form";
import { COMMENT_MODEL, POST_IMAGE_MODEL, POST_MODEL, type PostFormValues, type PostRecord } from "./schema";

export default function PostDetailPage() {
  const { pk } = useParams();
  const isCreate = pk === "new";
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const query = useQuery({
    queryKey: queryKeys.detail(POST_MODEL, pk ?? ""),
    queryFn: () => adminApi.retrieve<PostRecord>(POST_MODEL, pk as string),
    enabled: !isCreate && pk !== undefined,
  });

  const record = query.data;

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: [POST_MODEL] });
  }

  const createMutation = useMutation({
    mutationFn: (values: PostFormValues) => adminApi.create<PostRecord>(POST_MODEL, values),
    onSuccess: (created) => {
      toast.success("Added.");
      invalidate();
      navigate(`/m/${POST_MODEL}/${created.id}`, { replace: true });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (values: PostFormValues) => adminApi.update<PostRecord>(POST_MODEL, pk as string, values),
    onSuccess: () => {
      toast.success("Changes saved.");
      invalidate();
    },
  });

  // Pass mutateAsync to the form so ApiError(400) is field-mapped at the form level.
  async function handleSubmit(values: PostFormValues) {
    if (isCreate) await createMutation.mutateAsync(values);
    else await updateMutation.mutateAsync(values);
  }

  if (!isCreate && query.isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (!isCreate && query.isError) {
    return <p className="py-20 text-center text-fg-muted">Post not found.</p>;
  }

  return (
    <div>
      <PageHeader
        title={isCreate ? "Add post" : `Post #${record?.id}`}
        description={isCreate ? "Create a new post." : record?.title}
        actions={
          <>
            <Button variant="outline" onClick={() => navigate(`/m/${POST_MODEL}`)}>
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to list
            </Button>
            {!isCreate && (
              <Button variant="danger" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-12 gap-3">
        {/* Main form */}
        <Card className="col-span-12 xl:col-span-8">
          <CardHeader>
            <CardTitle>{isCreate ? "New post" : "Post details"}</CardTitle>
          </CardHeader>
          <CardContent>
            <PostForm record={record} onSubmit={handleSubmit} submitLabel={isCreate ? "Add post" : "Save changes"} />
          </CardContent>
        </Card>

        {/* Read-only meta */}
        {!isCreate && record && (
          <Card className="col-span-12 xl:col-span-4 self-start">
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-y-2 text-body">
                <dt className="text-fg-muted">Views</dt>
                <dd>
                  <NumberCell value={record.view_count} />
                </dd>
                <dt className="text-fg-muted">Created</dt>
                <dd>
                  <DateCell value={record.created_at} relative={false} />
                </dd>
                <dt className="text-fg-muted">Published at</dt>
                <dd>
                  <DateCell value={record.published_at} relative={false} />
                </dd>
                <dt className="text-fg-muted">Updated</dt>
                <dd>
                  <DateCell value={record.updated_at} relative={false} />
                </dd>
              </dl>
            </CardContent>
          </Card>
        )}

        {/* Inline child editing — images / comments */}
        {!isCreate && record && (
          <>
            <div className="col-span-12">
              <InlineTable
                model={POST_IMAGE_MODEL}
                parentField="post"
                parentId={record.id}
                title="Post images"
                columns={[
                  { field: "image", label: "Image", type: "image" },
                  { field: "caption", label: "Caption", type: "text" },
                  { field: "order", label: "Order", type: "number" },
                ]}
              />
            </div>
            <div className="col-span-12">
              <InlineTable
                model={COMMENT_MODEL}
                parentField="post"
                parentId={record.id}
                title="Comments"
                columns={[
                  { field: "body", label: "Body", type: "text" },
                  { field: "is_hidden", label: "Hidden", type: "checkbox" },
                ]}
              />
            </div>
          </>
        )}
      </div>

      <ConfirmDeleteDialog
        model={POST_MODEL}
        pk={deleteOpen && record ? record.id : null}
        label={record?.title}
        onClose={() => setDeleteOpen(false)}
        onDeleted={() => {
          invalidate();
          navigate(`/m/${POST_MODEL}`);
        }}
      />
    </div>
  );
}
