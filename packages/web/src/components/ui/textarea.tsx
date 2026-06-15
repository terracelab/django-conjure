import * as React from "react";

import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "min-h-20 w-full rounded border border-border bg-surface px-cell-x py-1.5 text-body text-fg-default placeholder:text-fg-muted",
      "focus:border-accent focus:outline-none disabled:cursor-not-allowed disabled:bg-app disabled:text-fg-muted",
      "aria-[invalid=true]:border-danger",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
