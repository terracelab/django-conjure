/**
 * Dashboard home — example widgets (4 stat cards + a 7-day trend line + a recent-activity table).
 *
 * A "widget" is a (component + /<api>/widgets/* endpoint) pair. The widget names below
 * ("stats", "trend", "recent-activity") are EXAMPLES — replace them with widgets your backend exposes,
 * or delete this page entirely. The component reads whatever shape your widget endpoint returns.
 */

import { useQuery } from "@tanstack/react-query";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { DateCell } from "@/components/composed/cells";
import { EmptyState } from "@/components/composed/empty-state";
import { PageHeader } from "@/components/composed/page-header";
import { StatCard } from "@/components/composed/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminApi, queryKeys } from "@/lib/api";

interface StatsWidget {
  cards: { key: string; label: string; value: number; delta?: number }[];
}

interface TrendWidget {
  points: { date: string; count: number }[];
}

interface ActivityWidget {
  rows: { id: number; actor: string | null; action: string; action_display: string; model_label: string; object_pk: string; object_repr: string; created_at: string }[];
  unavailable?: boolean;
}

const actionTone: Record<string, "success" | "info" | "danger" | "warning"> = {
  create: "success",
  update: "info",
  delete: "danger",
  bulk_update: "warning",
  bulk_delete: "danger",
};

export default function DashboardPage() {
  // Example widget queries — these are tolerant of a missing endpoint (they just render empty/loading).
  const stats = useQuery({ queryKey: queryKeys.widget("stats"), queryFn: () => adminApi.widget<StatsWidget>("stats") });
  const trend = useQuery({ queryKey: queryKeys.widget("trend"), queryFn: () => adminApi.widget<TrendWidget>("trend") });
  const activity = useQuery({ queryKey: queryKeys.widget("recent-activity"), queryFn: () => adminApi.widget<ActivityWidget>("recent-activity") });

  return (
    <div>
      <PageHeader title="Dashboard" description="Key metrics overview" />

      {/* Stat cards — 12-column CSS grid */}
      <div className="grid grid-cols-12 gap-3">
        {stats.isLoading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="col-span-3 h-20" />)
          : (stats.data?.cards ?? []).map((card) => (
              <div key={card.key} className="col-span-12 sm:col-span-6 xl:col-span-3">
                <StatCard label={card.label} value={card.value} delta={card.delta} />
              </div>
            ))}

        {/* Trend chart */}
        <Card className="col-span-12 xl:col-span-7">
          <CardHeader>
            <CardTitle>Last 7 days</CardTitle>
          </CardHeader>
          <CardContent className="h-56">
            {trend.isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend.data?.points ?? []} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border-default))" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "rgb(var(--fg-muted))" }} tickFormatter={(d: string) => d.slice(5)} />
                  <YAxis tick={{ fontSize: 11, fill: "rgb(var(--fg-muted))" }} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 4, border: "1px solid rgb(var(--border-default))" }} />
                  <Line type="monotone" dataKey="count" name="Count" stroke="rgb(var(--accent))" strokeWidth={2} dot={{ r: 2.5 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card className="col-span-12 xl:col-span-5">
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {activity.isLoading ? (
              <div className="p-3">
                <Skeleton className="h-32 w-full" />
              </div>
            ) : (activity.data?.rows.length ?? 0) === 0 ? (
              <EmptyState message={activity.data?.unavailable ? "No activity widget is configured on the backend yet." : "No recent activity."} />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Actor</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>When</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activity.data?.rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.actor ?? "-"}</TableCell>
                      <TableCell>
                        <Badge tone={actionTone[row.action] ?? "default"}>{row.action_display}</Badge>
                      </TableCell>
                      <TableCell className="max-w-44 truncate" title={`${row.model_label}#${row.object_pk}`}>
                        {row.object_repr || `${row.model_label}#${row.object_pk}`}
                      </TableCell>
                      <TableCell>
                        <DateCell value={row.created_at} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
