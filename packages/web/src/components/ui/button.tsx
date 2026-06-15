import { Slot } from "@radix-ui/react-slot";
import * as React from "react";

import { cn } from "@/lib/utils";

/** Density patch applied — compact is the default. This file is frozen: variants go in components/composed/. */
type Variant = "default" | "outline" | "ghost" | "danger" | "link";
type Size = "compact" | "icon" | "lg";

const variantClasses: Record<Variant, string> = {
  default: "bg-accent text-fg-on-accent hover:bg-accent-hover border border-transparent",
  outline: "bg-surface text-fg-default border border-border hover:bg-app",
  ghost: "bg-transparent text-fg-default hover:bg-app border border-transparent",
  danger: "bg-danger text-fg-on-accent hover:opacity-90 border border-transparent",
  link: "bg-transparent text-accent underline-offset-2 hover:underline border-none px-0",
};

const sizeClasses: Record<Size, string> = {
  compact: "h-input px-3 text-body",
  icon: "h-input w-8 p-0",
  lg: "h-9 px-4 text-emphasis",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant = "default", size = "compact", asChild = false, type, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      ref={ref}
      type={asChild ? undefined : (type ?? "button")}
      className={cn(
        "inline-flex select-none items-center justify-center gap-1.5 whitespace-nowrap rounded font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  );
});
Button.displayName = "Button";
