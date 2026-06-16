import * as React from "react";

import { cn } from "@/lib/utils";

/** ERP pragmatism: native select + compact styling. For searchable FKs use composed/fk-combobox. */
export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "h-input w-full appearance-none rounded border border-border bg-surface px-cell-x pr-7 text-body text-fg-default",
      "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2371717a%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_8px_center] bg-no-repeat",
      "focus:border-accent focus:outline-none disabled:cursor-not-allowed disabled:bg-app disabled:text-fg-muted",
      "aria-[invalid=true]:border-danger",
      className,
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";
