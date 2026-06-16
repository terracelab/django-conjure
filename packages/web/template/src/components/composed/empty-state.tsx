import type { ReactNode } from "react";

/** Empty list — action-oriented message + optional action button. */
export function EmptyState({ message, action }: { message: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
      <p className="text-body text-fg-muted">{message}</p>
      {action}
    </div>
  );
}
