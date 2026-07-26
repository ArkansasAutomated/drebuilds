import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import { CornerAccent } from "@/components/decorative/CornerAccent";
import { BlinkingCursor } from "@/components/ui/BlinkingCursor";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TrendingUp, Globe, BarChart3 } from "lucide-react";
import {
  useSourceAnalytics,
  formatSourceLabel,
  computeSourceTotals,
  sourceRowKey,
  type SourceBySourceRow,
} from "@/hooks/useSourceAnalytics";
import { cn } from "@/lib/utils";

const springConfig = {
  mass: 1,
  stiffness: 120,
  damping: 14,
};

type LeadTypeFilter = "all" | "audit" | "newsletter";

const RANGE_OPTIONS = [
  { value: 7, label: "7d" },
  { value: 30, label: "30d" },
  { value: 90, label: "90d" },
] as const;

/**
 * Source analytics panel — answers "where did our leads come
 * from?" at a glance. Renders:
 *   1. Three stat tiles (totals)
 *   2. Bar chart: leads per source (top 10)
 *   3. Line chart: leads per day
 *   4. Table: full source breakdown with campaign + last_seen
 */
export const SourceAnalyticsPanel = () => {
  const [daysBack, setDaysBack] = useState<number>(30);
  const [leadType, setLeadType] = useState<LeadTypeFilter>("all");

  const { data, isLoading, error } = useSourceAnalytics(daysBack);

  const filteredBySource = useMemo<SourceBySourceRow[]>(() => {
    const rows = data?.by_source ?? [];
    if (leadType === "all") return rows;
    return rows.filter((r) => r.lead_type === leadType);
  }, [data, leadType]);

  const chartData = useMemo(() => {
    return filteredBySource
      .slice()
      .sort((a, b) => b.lead_count - a.lead_count)
      .slice(0, 10)
      .map((r) => ({
        name: formatSourceLabel(r),
        leads: r.lead_count,
      }));
  }, [filteredBySource]);

  const dailyData = useMemo(() => {
    const days = data?.by_day ?? [];
    return days.map((d) => ({
      day: d.day,
      label: format(parseISO(d.day), "MMM d"),
      leads: d.count,
    }));
  }, [data]);

  const totals = computeSourceTotals(filteredBySource);

  return (
    <motion.div
      className="relative p-6 bg-card border border-border rounded-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", ...springConfig }}
    >
      <CornerAccent position="tl" size={20} />
      <CornerAccent position="br" size={20} />

      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center bg-surface-elevated rounded-sm border border-primary/30">
            <BarChart3 className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="font-mono text-sm text-primary">
              &gt; SOURCE_ANALYTICS
            </h2>
            <p className="font-mono text-xs text-muted-foreground">
              leads by utm_source / referrer — last {daysBack} days
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={leadType}
            onValueChange={(v) => setLeadType(v as LeadTypeFilter)}
          >
            <SelectTrigger className="font-mono text-xs w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="font-mono">all leads</SelectItem>
              <SelectItem value="audit" className="font-mono">audit only</SelectItem>
              <SelectItem value="newsletter" className="font-mono">newsletter only</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={String(daysBack)}
            onValueChange={(v) => setDaysBack(parseInt(v, 10))}
          >
            <SelectTrigger className="font-mono text-xs w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RANGE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={String(o.value)} className="font-mono">
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatTile
          label="Total leads"
          value={data?.totals.all ?? 0}
          icon={<TrendingUp className="w-3.5 h-3.5" />}
        />
        <StatTile
          label="Audit"
          value={data?.totals.audit ?? 0}
          icon={<Globe className="w-3.5 h-3.5" />}
        />
        <StatTile
          label="Newsletter"
          value={data?.totals.newsletter ?? 0}
          icon={<Globe className="w-3.5 h-3.5" />}
        />
        <StatTile
          label="Unique sources"
          value={totals.sourceCount}
          icon={<Globe className="w-3.5 h-3.5" />}
          accent
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <ChartCard
          title="leads by source"
          subtitle="top 10 (UTM or referrer)"
        >
          {isLoading ? (
            <ChartLoading />
          ) : chartData.length === 0 ? (
            <ChartEmpty message="no_leads_in_window" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis
                  dataKey="name"
                  stroke="#71717a"
                  fontSize={10}
                  angle={-25}
                  textAnchor="end"
                  height={60}
                  interval={0}
                />
                <YAxis stroke="#71717a" fontSize={10} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    border: "1px solid #27272a",
                    borderRadius: 2,
                    fontSize: 11,
                    fontFamily: "monospace",
                  }}
                  cursor={{ fill: "rgba(234, 179, 8, 0.05)" }}
                />
                <Bar dataKey="leads" fill="#eab308" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          title="leads over time"
          subtitle={`daily volume · ${daysBack}d window`}
        >
          {isLoading ? (
            <ChartLoading />
          ) : dailyData.length === 0 ? (
            <ChartEmpty message="no_daily_data" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={dailyData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis
                  dataKey="label"
                  stroke="#71717a"
                  fontSize={10}
                  interval="preserveStartEnd"
                />
                <YAxis stroke="#71717a" fontSize={10} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    border: "1px solid #27272a",
                    borderRadius: 2,
                    fontSize: 11,
                    fontFamily: "monospace",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="leads"
                  stroke="#eab308"
                  strokeWidth={2}
                  dot={{ fill: "#eab308", r: 2 }}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Source table */}
      <ChartCard title="source breakdown" subtitle="all lead sources in window" noPad>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <span className="font-mono text-sm text-muted-foreground animate-pulse">
              &gt; loading_sources...
              <BlinkingCursor className="ml-1" />
            </span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12">
            <span className="font-mono text-sm text-destructive">
              &gt; query_failed
            </span>
          </div>
        ) : filteredBySource.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <span className="font-mono text-sm text-muted-foreground">
              &gt; no_source_data
            </span>
            <span className="font-mono text-[11px] text-muted-foreground/70 max-w-md text-center">
              (UTM capture is live; data will appear after the first
              attributed lead lands. Apply the migration and the
              get_source_analytics RPC will return rows.)
            </span>
          </div>
        ) : (
          <div className="border border-border rounded-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border bg-surface-elevated hover:bg-surface-elevated">
                  <TableHead className="font-mono text-xs text-primary">SOURCE</TableHead>
                  <TableHead className="font-mono text-xs text-primary">MEDIUM</TableHead>
                  <TableHead className="font-mono text-xs text-primary">CAMPAIGN</TableHead>
                  <TableHead className="font-mono text-xs text-primary">TYPE</TableHead>
                  <TableHead className="font-mono text-xs text-primary text-right">LEADS</TableHead>
                  <TableHead className="font-mono text-xs text-primary">LAST SEEN</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBySource
                  .slice()
                  .sort((a, b) => b.lead_count - a.lead_count)
                  .map((row, idx) => (
                    <TableRow key={sourceRowKey(row, idx)} className="border-border">
                      <TableCell className="font-mono text-xs py-3 text-foreground">
                        {row.source || <span className="text-muted-foreground/60">direct</span>}
                      </TableCell>
                      <TableCell className="font-mono text-xs py-3 text-muted-foreground">
                        {row.medium || "—"}
                      </TableCell>
                      <TableCell className="font-mono text-xs py-3 text-muted-foreground">
                        {row.campaign || "—"}
                      </TableCell>
                      <TableCell className="py-3">
                        {row.lead_type ? (
                          <Badge
                            variant="outline"
                            className="font-mono text-[10px] border-border bg-surface-elevated text-muted-foreground"
                          >
                            {row.lead_type}
                          </Badge>
                        ) : (
                          <span className="font-mono text-[10px] text-muted-foreground/60">all</span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs py-3 text-right text-foreground tabular-nums">
                        {row.lead_count}
                      </TableCell>
                      <TableCell className="font-mono text-xs py-3 text-muted-foreground">
                        {row.last_seen_at
                          ? format(parseISO(row.last_seen_at), "MMM d HH:mm")
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        )}
      </ChartCard>
    </motion.div>
  );
};

// ---------- Sub-components ----------

interface StatTileProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent?: boolean;
}
const StatTile = ({ label, value, icon, accent }: StatTileProps) => (
  <div
    className={cn(
      "p-3 rounded-sm border border-border bg-surface-elevated/50",
      accent && "border-primary/30",
    )}
  >
    <div className="flex items-center gap-2 text-muted-foreground mb-1">
      {icon}
      <span className="font-mono text-[10px] uppercase tracking-wider">
        {label}
      </span>
    </div>
    <div
      className={cn(
        "font-mono text-2xl tabular-nums",
        accent ? "text-primary glow-amber" : "text-foreground",
      )}
    >
      {value}
    </div>
  </div>
);

interface ChartCardProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  noPad?: boolean;
}
const ChartCard = ({ title, subtitle, children, noPad }: ChartCardProps) => (
  <div
    className={cn(
      "rounded-sm border border-border bg-surface-elevated/30",
      !noPad && "p-4",
    )}
  >
    {!noPad && (
      <div className="mb-2">
        <p className="font-mono text-xs text-primary">
          &gt; {title}
        </p>
        <p className="font-mono text-[10px] text-muted-foreground">
          {subtitle}
        </p>
      </div>
    )}
    {noPad ? children : <div>{children}</div>}
  </div>
);

const ChartLoading = () => (
  <div className="flex items-center justify-center h-[220px]">
    <span className="font-mono text-sm text-muted-foreground animate-pulse">
      &gt; loading...
      <BlinkingCursor className="ml-1" />
    </span>
  </div>
);

const ChartEmpty = ({ message }: { message: string }) => (
  <div className="flex items-center justify-center h-[220px]">
    <span className="font-mono text-sm text-muted-foreground">
      &gt; {message}
    </span>
  </div>
);
