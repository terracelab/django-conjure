/**
 * Component vocabulary — cell family.
 * Codegen rule: choices → StatusBadge, FK → EntityLink, currency → MoneyCell, delta → DeltaCell, datetime → DateCell.
 */

import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDateTime, formatNumber, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

type Tone = "default" | "success" | "warning" | "danger" | "info" | "muted";

/** choices field display — status→tone defaults based on common choice keys + toneMap override. */
export function StatusBadge({ value, display, toneMap }: { value: unknown; display?: string | null; toneMap?: Record<string, Tone> }) {
  if (value === null || value === undefined || value === "") return <span className="text-fg-muted">-</span>;
  const key = String(value);
  const defaultTones: Record<string, Tone> = {
    active: "success",
    success: "success",
    sent: "success",
    ready: "info",
    processing: "warning",
    pending: "warning",
    canceled: "danger",
    failed: "danger",
    ignore: "muted",
  };
  const tone = toneMap?.[key] ?? defaultTones[key] ?? "default";
  return <Badge tone={tone}>{display ?? key}</Badge>;
}

/** Currency column — formatCurrency + tabular-nums; pair with column meta { align: "right" }. */
export function MoneyCell({ value }: { value: number | string | null | undefined }) {
  return <span className="block text-right">{formatCurrency(value)}</span>;
}

export function NumberCell({ value }: { value: number | string | null | undefined }) {
  return <span className="block text-right">{formatNumber(value)}</span>;
}

/** Delta display — finance convention (KR): up=red (--gain), down=blue (--loss). Do not use status colors. */
export function DeltaCell({ value, percent = false }: { value: number | null | undefined; percent?: boolean }) {
  if (value === null || value === undefined || Number.isNaN(value)) return <span className="block text-right text-fg-muted">-</span>;
  const text = percent ? formatPercent(value) : formatNumber(value);
  return (
    <span className={cn("block text-right", value > 0 && "text-gain", value < 0 && "text-loss", value === 0 && "text-fg-muted")}>
      {value > 0 ? "▲" : value < 0 ? "▼" : ""} {text}
    </span>
  );
}

/** FK display — links to the related detail page. Label comes from the backend {fk}_label. */
export function EntityLink({ model, pk, label }: { model: string; pk: number | string | null | undefined; label?: string | null }) {
  if (pk === null || pk === undefined) return <span className="text-fg-muted">-</span>;
  return (
    <Link to={`/m/${model}/${pk}`} className="text-accent hover:underline" onClick={(e) => e.stopPropagation()}>
      {label ?? `#${pk}`}
    </Link>
  );
}

/** Datetime — yyyy-MM-dd HH:mm, relative time when today. */
export function DateCell({ value, relative = true }: { value: string | null | undefined; relative?: boolean }) {
  return <span className="text-fg-muted">{formatDateTime(value, relative)}</span>;
}

export function BoolCell({ value }: { value: unknown }) {
  if (value === null || value === undefined) return <span className="text-fg-muted">-</span>;
  return value ? <Badge tone="success">Yes</Badge> : <Badge tone="muted">No</Badge>;
}

/** Image thumbnail cell — storage URL. */
export function ThumbCell({ src }: { src: string | null | undefined }) {
  if (!src) return <span className="text-fg-muted">-</span>;
  return (
    <a href={src} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
      <img src={src} alt="" className="h-6 w-9 rounded border border-border object-cover" />
    </a>
  );
}
