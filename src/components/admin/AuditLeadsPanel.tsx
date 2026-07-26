import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { CornerAccent } from "@/components/decorative/CornerAccent";
import { BlinkingCursor } from "@/components/ui/BlinkingCursor";
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
import { Briefcase, Users, TrendingUp, Calendar } from "lucide-react";
import {
  useAuditLeads,
  useAuditLeadStats,
  useUpdateAuditLeadStatus,
  AuditLead,
  AuditLeadStatus,
  AUDIT_STATUS_LABELS,
  AUDIT_STATUS_ORDER,
} from "@/hooks/useAuditLeads";
import { cn } from "@/lib/utils";

const springConfig = {
  mass: 1,
  stiffness: 120,
  damping: 14,
};

const statusColor: Record<AuditLeadStatus, string> = {
  new: "bg-primary/10 text-primary border-primary/30",
  reviewed: "bg-info/10 text-info border-info/30",
  audited: "bg-success/10 text-success border-success/30",
  booked: "bg-success/10 text-success border-success/30",
  closed_won: "bg-success/10 text-success border-success/30",
  closed_lost: "bg-destructive/10 text-destructive border-destructive/30",
};

export const AuditLeadsPanel = () => {
  const { data: leads, isLoading } = useAuditLeads();
  const stats = useAuditLeadStats(leads);
  const updateStatus = useUpdateAuditLeadStatus();
  const [filter, setFilter] = useState<"all" | AuditLeadStatus>("all");

  const filtered = useMemo(() => {
    if (!leads) return [];
    if (filter === "all") return leads;
    return leads.filter((l) => l.status === filter);
  }, [leads, filter]);

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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center bg-surface-elevated rounded-sm border border-primary/30">
            <Briefcase className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="font-mono text-sm text-primary">
              &gt; AUDIT_LEADS
            </h2>
            <p className="font-mono text-xs text-muted-foreground">
              /audit lead capture funnel
            </p>
          </div>
        </div>

        {/* Status filter */}
        <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <SelectTrigger className="font-mono text-xs w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="font-mono">
              All statuses
            </SelectItem>
            {AUDIT_STATUS_ORDER.map((s) => (
              <SelectItem key={s} value={s} className="font-mono">
                {AUDIT_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatTile
          label="Total leads"
          value={stats.total}
          icon={<Users className="w-3.5 h-3.5" />}
        />
        <StatTile
          label="New this week"
          value={stats.thisWeek}
          icon={<TrendingUp className="w-3.5 h-3.5" />}
          accent
        />
        <StatTile
          label="Booked"
          value={stats.booked}
          icon={<Calendar className="w-3.5 h-3.5" />}
        />
        <StatTile
          label="Conversion"
          value={`${stats.conversionRate}%`}
          icon={<TrendingUp className="w-3.5 h-3.5" />}
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <span className="font-mono text-sm text-muted-foreground animate-pulse">
            &gt; loading_audit_leads...
            <BlinkingCursor className="ml-1" />
          </span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-2">
          <span className="font-mono text-sm text-muted-foreground">
            &gt; no_audit_leads_found
          </span>
          <span className="font-mono text-[11px] text-muted-foreground/70 max-w-md text-center">
            (leads from /audit will appear here; client-side SELECT is
            gated by RLS — wire an admin Edge Function if you need this
            view in production)
          </span>
        </div>
      ) : (
        <div className="border border-border rounded-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border bg-surface-elevated hover:bg-surface-elevated">
                <TableHead className="font-mono text-xs text-primary">
                  LEAD
                </TableHead>
                <TableHead className="font-mono text-xs text-primary">
                  BUSINESS
                </TableHead>
                <TableHead className="font-mono text-xs text-primary">
                  INDUSTRY
                </TableHead>
                <TableHead className="font-mono text-xs text-primary">
                  BOTTLENECK
                </TableHead>
                <TableHead className="font-mono text-xs text-primary">
                  STATUS
                </TableHead>
                <TableHead className="font-mono text-xs text-primary">
                  DATE
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((lead) => (
                <LeadRow
                  key={lead.id}
                  lead={lead}
                  isPending={updateStatus.isPending}
                  onChangeStatus={(status) =>
                    updateStatus.mutate({ id: lead.id, status })
                  }
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </motion.div>
  );
};

// ---------- Sub-components ----------

interface StatTileProps {
  label: string;
  value: number | string;
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
        "font-mono text-2xl",
        accent ? "text-primary glow-amber" : "text-foreground",
      )}
    >
      {value}
    </div>
  </div>
);

interface LeadRowProps {
  lead: AuditLead;
  isPending: boolean;
  onChangeStatus: (status: AuditLeadStatus) => void;
}
const LeadRow = ({ lead, isPending, onChangeStatus }: LeadRowProps) => {
  const status = (lead.status as AuditLeadStatus) ?? "new";
  return (
    <TableRow className="border-border">
      <TableCell className="py-3">
        <div className="font-mono text-xs">
          <div className="text-foreground">{lead.full_name}</div>
          <div className="text-muted-foreground truncate max-w-[180px]" title={lead.email}>
            {lead.email}
          </div>
        </div>
      </TableCell>
      <TableCell className="py-3">
        <div className="font-mono text-xs text-foreground">
          {lead.business_name}
        </div>
        <div className="font-mono text-[10px] text-muted-foreground">
          {lead.team_size} {lead.preferred_contact_method === "Phone Call" && `· ${lead.phone}`}
        </div>
      </TableCell>
      <TableCell className="py-3">
        <Badge
          variant="outline"
          className={cn(
            "font-mono text-[10px] border-border bg-surface-elevated text-muted-foreground",
          )}
        >
          {lead.industry}
        </Badge>
      </TableCell>
      <TableCell className="py-3 font-mono text-xs text-muted-foreground">
        {lead.biggest_bottleneck}
      </TableCell>
      <TableCell className="py-3">
        <Select
          value={status}
          onValueChange={(v) => onChangeStatus(v as AuditLeadStatus)}
          disabled={isPending}
        >
          <SelectTrigger className="font-mono text-[11px] h-7 w-36 border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AUDIT_STATUS_ORDER.map((s) => (
              <SelectItem key={s} value={s} className="font-mono text-xs">
                {AUDIT_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Badge
          variant="outline"
          className={cn(
            "font-mono text-[10px] ml-2 hidden",
            statusColor[status],
          )}
        >
          {AUDIT_STATUS_LABELS[status]}
        </Badge>
      </TableCell>
      <TableCell className="py-3 font-mono text-xs text-muted-foreground">
        {lead.created_at
          ? format(new Date(lead.created_at), "MMM dd")
          : "—"}
      </TableCell>
    </TableRow>
  );
};