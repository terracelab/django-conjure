import { Card, CardContent } from "@/components/ui/card";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Dashboard metric card — value + period-over-period delta (finance convention colors). */
export function StatCard({ label, value, delta }: { label: string; value: number | string; delta?: number | null }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1">
        <span className="text-caption text-fg-muted">{label}</span>
        <span className="text-title font-semibold">{typeof value === "number" ? formatNumber(value) : value}</span>
        {delta !== undefined && delta !== null && (
          <span className={cn("text-caption", delta > 0 && "text-gain", delta < 0 && "text-loss", delta === 0 && "text-fg-muted")}>
            {delta > 0 ? `▲ ${formatNumber(delta)}` : delta < 0 ? `▼ ${formatNumber(Math.abs(delta))}` : "No change"} (vs. previous)
          </span>
        )}
      </CardContent>
    </Card>
  );
}
