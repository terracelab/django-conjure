import * as React from "react";

import { cn } from "@/lib/utils";

type Tone = "default" | "success" | "warning" | "danger" | "info" | "muted";

const toneClasses: Record<Tone, string> = {
  default: "bg-accent/10 text-accent",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger",
  info: "bg-info/10 text-info",
  muted: "bg-app text-fg-muted",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

export function Badge({ className, tone = "default", ...props }: BadgeProps) {
  return <span className={cn("inline-flex items-center rounded px-1.5 py-0.5 text-caption font-medium", toneClasses[tone], className)} {...props} />;
}
