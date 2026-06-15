/**
 * Delete confirmation dialog — warns about related objects that CASCADE-delete with the record.
 * On open it queries /related/ to show the blast radius.
 */

import { useMutation, useQuery } from "@tanstack/react-query";
import { TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { adminApi } from "@/lib/api";
import { formatNumber } from "@/lib/format";

interface ConfirmDeleteDialogProps {
  model: string;
  pk: number | string | null; // null = closed
  label?: string;
  onClose: () => void;
  onDeleted: () => void;
}

export function ConfirmDeleteDialog({ model, pk, label, onClose, onDeleted }: ConfirmDeleteDialogProps) {
  const open = pk !== null;

  const relatedQuery = useQuery({
    queryKey: [model, "related", pk],
    queryFn: () => adminApi.related(model, pk as number | string),
    enabled: open,
  });

  const deleteMutation = useMutation({
    mutationFn: () => adminApi.remove(model, pk as number | string),
    onSuccess: () => {
      toast.success("Deleted.");
      onDeleted();
      onClose();
    },
    onError: (error: Error) => toast.error(error.message || "Failed to delete."),
  });

  const related = relatedQuery.data?.related ?? [];

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete this record?</DialogTitle>
          <DialogDescription>{label ? `This will delete "${label}".` : "This will delete the selected record."} This action cannot be undone.</DialogDescription>
        </DialogHeader>
        {related.length > 0 && (
          <div className="rounded border border-warning/40 bg-warning/5 p-2">
            <p className="mb-1 flex items-center gap-1 text-caption font-medium text-warning">
              <TriangleAlert className="h-3.5 w-3.5" />
              The following related data will also be deleted
            </p>
            <ul className="ml-5 list-disc text-caption text-fg-default">
              {related.map((item) => (
                <li key={item.model}>
                  {item.verbose_name}: {formatNumber(item.count)}
                </li>
              ))}
            </ul>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate()}>
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
