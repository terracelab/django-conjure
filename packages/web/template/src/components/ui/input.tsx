import * as React from "react";

import { cn } from "@/lib/utils";

/** Density patch applied (h-input) — frozen. */
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-input w-full rounded border border-border bg-surface px-cell-x text-body text-fg-default placeholder:text-fg-muted",
      "focus:border-accent focus:outline-none disabled:cursor-not-allowed disabled:bg-app disabled:text-fg-muted",
      "aria-[invalid=true]:border-danger",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";
