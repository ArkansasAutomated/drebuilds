import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import Papa from "papaparse";
import {
  Search,
  Download,
  Trash2,
  ChevronRight,
  Mail,
  ListChecks,
  ArrowLeft,
} from "lucide-react";
import {
  useNewsletterLists,
  useNewsletterSubscriptions,
  useDeleteNewsletterSubscription,
  type NewsletterListSummary,
  type NewsletterSubscription,
} from "@/hooks/useNewsletterLists";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
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
import { cn } from "@/lib/utils";

const springConfig = {
  mass: 1,
  stiffness: 120,
  damping: 14,
};

/**
 * Newsletter Lists admin panel.
 *
 * Two-mode view:
 *   - Overview: a grid of cards, one per newsletter list, with subscriber
 *     counts and a "open" button.
 *   - Per-list: the subscribers for one list — search, expand rows for
 *     metadata, delete with confirmation, export to CSV.
 *
 * The legacy `subscribers` table is still queried elsewhere
 * (SubscribersLog) for backward compatibility; this panel is the new
 * canonical view.
 */
export const NewsletterListsPanel = () => {
  const { data: lists, isLoading } = useNewsletterLists();
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  const selectedList = useMemo(
    () => lists?.find((entry) => entry.list.slug === selectedSlug) ?? null,
    [lists, selectedSlug],
  );

  return (
    <div className="relative p-6 bg-card border border-border rounded-sm">
      <CornerAccent position="tl" size={20} />
      <CornerAccent position="br" size={20} />

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 flex items-center justify-center bg-surface-elevated rounded-sm border border-primary/30">
          <ListChecks className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1">
          <h2 className="font-mono text-sm text-primary">
            &gt; NEWSLETTER_LISTS
          </h2>
          <p className="font-mono text-xs text-muted-foreground">
            {selectedList
              ? `${selectedList.list.name} — ${selectedList.total} subscribers`
              : `${lists?.length ?? 0} lists configured`}
          </p>
        </div>
        {selectedList && (
          <button
            onClick={() => setSelectedSlug(null)}
            className="flex items-center gap-1.5 px-2.5 py-1 font-mono text-xs bg-surface-elevated border border-border rounded-sm hover:border-primary/30 hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            back
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {selectedList ? (
          <ListDetail
            key="detail"
            summary={selectedList}
            onClose={() => setSelectedSlug(null)}
          />
        ) : (
          <ListOverview
            key="overview"
            lists={lists ?? []}
            isLoading={isLoading}
            onSelect={(slug) => setSelectedSlug(slug)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// ─────────────────────────── Overview ───────────────────────────

interface ListOverviewProps {
  lists: NewsletterListSummary[];
  isLoading: boolean;
  onSelect: (slug: string) => void;
}

const ListOverview = ({ lists, isLoading, onSelect }: ListOverviewProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="font-mono text-sm text-muted-foreground animate-pulse">
          &gt; loading_lists...
        </span>
      </div>
    );
  }

  if (lists.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="font-mono text-sm text-muted-foreground">
          &gt; no_newsletter_lists
        </span>
      </div>
    );
  }

  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {lists.map((entry, idx) => (
        <ListCard
          key={entry.list.id}
          summary={entry}
          index={idx}
          onSelect={() => onSelect(entry.list.slug)}
        />
      ))}
    </motion.div>
  );
};

interface ListCardProps {
  summary: NewsletterListSummary;
  index: number;
  onSelect: () => void;
}

const ListCard = ({ summary, index, onSelect }: ListCardProps) => {
  const { list, total, today, thisWeek } = summary;
  const maxBarWidth = 16;
  const barFilled = total > 0 ? Math.max(1, Math.min(maxBarWidth, Math.ceil(Math.log10(total + 1) * 4))) : 0;
  const barEmpty = maxBarWidth - barFilled;

  return (
    <motion.button
      onClick={onSelect}
      className="relative p-4 bg-surface-elevated border border-border rounded-sm text-left hover:border-primary/40 hover:bg-surface-overlay transition-all group"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", ...springConfig, delay: 0.05 * index }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <CornerAccent position="tl" size={12} className="opacity-40 group-hover:opacity-100 transition-opacity" />
      <CornerAccent position="br" size={12} className="opacity-40 group-hover:opacity-100 transition-opacity" />

      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-primary" />
          <span className="font-mono text-xs text-primary">
            {list.slug}
          </span>
        </div>
        <Badge
          variant="outline"
          className={cn(
            "font-mono text-[10px]",
            list.is_active
              ? "bg-success/10 text-success border-success/30"
              : "bg-muted/10 text-muted-foreground border-border",
          )}
        >
          {list.is_active ? "active" : "inactive"}
        </Badge>
      </div>

      <h3 className="font-mono text-sm text-foreground mb-1 truncate">
        {list.name}
      </h3>
      {list.description && (
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
          {list.description}
        </p>
      )}

      <div className="font-mono text-base mb-2">
        <span className="text-primary">{"▓".repeat(barFilled)}</span>
        <span className="text-muted-foreground/30">{"░".repeat(barEmpty)}</span>
        <span className="ml-3 text-foreground tabular-nums">{total}</span>
        <span className="text-muted-foreground ml-1 text-xs">subs</span>
      </div>

      <div className="space-y-1 font-mono text-[11px] text-muted-foreground">
        <div>
          &gt; today: <span className="text-success">+{today}</span>
        </div>
        <div>
          &gt; this_week: <span className="text-success">+{thisWeek}</span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
        <span>view_subscribers<BlinkingCursor /></span>
        <ChevronRight className="w-3.5 h-3.5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </motion.button>
  );
};

// ─────────────────────────── Per-list detail ───────────────────────────

interface ListDetailProps {
  summary: NewsletterListSummary;
  onClose: () => void;
}

const ListDetail = ({ summary, onClose: _onClose }: ListDetailProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<NewsletterSubscription | null>(null);

  const { data: subscriptions, isLoading } = useNewsletterSubscriptions(summary.list.id);
  const deleteMutation = useDeleteNewsletterSubscription();

  const filtered = useMemo(() => {
    if (!subscriptions) return [];
    if (!searchQuery) return subscriptions;
    const q = searchQuery.toLowerCase();
    return subscriptions.filter(
      (s) =>
        s.email.toLowerCase().includes(q) ||
        (s.full_name ?? "").toLowerCase().includes(q) ||
        (s.source ?? "").toLowerCase().includes(q),
    );
  }, [subscriptions, searchQuery]);

  const exportToCSV = () => {
    const rows = filtered.map((s) => ({
      email: s.email,
      full_name: s.full_name ?? "",
      source: s.source ?? "unknown",
      list_slug: summary.list.slug,
      subscribed_at: s.subscribed_at
        ? format(new Date(s.subscribed_at), "yyyy-MM-dd HH:mm")
        : "",
      unsubscribed_at: s.unsubscribed_at
        ? format(new Date(s.unsubscribed_at), "yyyy-MM-dd HH:mm")
        : "",
    }));
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${summary.list.slug}_subscribers_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-primary">
            &gt; search:
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="filter by email, name, or source..."
            className="w-full pl-20 pr-4 py-2.5 bg-surface-elevated border border-border rounded-sm font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
          />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        </div>
        <button
          onClick={exportToCSV}
          disabled={filtered.length === 0}
          className="flex items-center gap-2 px-3 py-2.5 font-mono text-xs bg-surface-elevated border border-border rounded-sm hover:border-primary/30 hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          <Download className="w-3.5 h-3.5" />
          Export CSV
        </button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <span className="font-mono text-sm text-muted-foreground animate-pulse">
            &gt; loading_subscribers...
          </span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <span className="font-mono text-sm text-muted-foreground">
            &gt; no_records_found
          </span>
        </div>
      ) : (
        <div className="border border-border rounded-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border bg-surface-elevated hover:bg-surface-elevated">
                <TableHead className="font-mono text-xs text-primary w-8"></TableHead>
                <TableHead className="font-mono text-xs text-primary">EMAIL</TableHead>
                <TableHead className="font-mono text-xs text-primary">NAME</TableHead>
                <TableHead className="font-mono text-xs text-primary">SOURCE</TableHead>
                <TableHead className="font-mono text-xs text-primary">STATUS</TableHead>
                <TableHead className="font-mono text-xs text-primary">DATE</TableHead>
                <TableHead className="font-mono text-xs text-primary w-12">ACT</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((sub) => (
                <SubscriptionRow
                  key={sub.id}
                  subscription={sub}
                  isExpanded={expandedId === sub.id}
                  onToggle={() =>
                    setExpandedId(expandedId === sub.id ? null : sub.id)
                  }
                  onDelete={() => setDeleteTarget(sub)}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
        targetEmail={deleteTarget?.email || ""}
        isDeleting={deleteMutation.isPending}
      />
    </motion.div>
  );
};

interface SubscriptionRowProps {
  subscription: NewsletterSubscription;
  isExpanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
}

const SubscriptionRow = ({
  subscription,
  isExpanded,
  onToggle,
  onDelete,
}: SubscriptionRowProps) => {
  const meta = subscription.metadata as
    | { variant?: string; captured_at?: string; user_agent?: string; entry_path?: string }
    | null;
  const hasMeta = !!(meta?.user_agent || meta?.entry_path || meta?.variant);
  const isActive = !subscription.unsubscribed_at;

  return (
    <>
      <TableRow
        className={cn(
          "border-border cursor-pointer transition-colors",
          isExpanded && "bg-surface-elevated",
        )}
        onClick={onToggle}
      >
        <TableCell className="py-3">
          <motion.div
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.15 }}
          >
            <ChevronRight
              className={cn(
                "w-4 h-4 text-muted-foreground",
                hasMeta ? "opacity-100" : "opacity-30",
              )}
            />
          </motion.div>
        </TableCell>
        <TableCell className="font-mono text-xs text-data py-3">
          <span className="truncate max-w-[220px] block" title={subscription.email}>
            {subscription.email}
          </span>
        </TableCell>
        <TableCell className="font-mono text-xs text-muted-foreground py-3">
          {subscription.full_name || "—"}
        </TableCell>
        <TableCell className="font-mono text-xs text-muted-foreground py-3">
          {subscription.source || "unknown"}
        </TableCell>
        <TableCell className="py-3">
          <Badge
            variant="outline"
            className={cn(
              "font-mono text-[10px]",
              isActive
                ? "bg-success/10 text-success border-success/30"
                : "bg-muted/10 text-muted-foreground border-border",
            )}
          >
            {isActive ? "active" : "unsubscribed"}
          </Badge>
        </TableCell>
        <TableCell className="font-mono text-xs text-muted-foreground py-3">
          {subscription.subscribed_at
            ? format(new Date(subscription.subscribed_at), "MMM dd")
            : "—"}
        </TableCell>
        <TableCell className="py-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1.5 rounded-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            title="Delete subscription"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </TableCell>
      </TableRow>

      <AnimatePresence>
        {isExpanded && meta && (
          <TableRow className="border-border bg-surface-elevated/50">
            <TableCell colSpan={7} className="py-0">
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="py-3 pl-8 space-y-1">
                  {meta.variant && (
                    <p className="font-mono text-[11px] text-muted-foreground">
                      <span className="text-primary/70">├─</span>{" "}
                      <span className="text-muted-foreground/70">variant:</span>{" "}
                      <span className="text-data/70">{meta.variant}</span>
                    </p>
                  )}
                  {meta.captured_at && (
                    <p className="font-mono text-[11px] text-muted-foreground">
                      <span className="text-primary/70">├─</span>{" "}
                      <span className="text-muted-foreground/70">captured_at:</span>{" "}
                      <span className="text-data/70">
                        {format(new Date(meta.captured_at), "yyyy-MM-dd HH:mm:ss")}
                      </span>
                    </p>
                  )}
                  {meta.user_agent && (
                    <p className="font-mono text-[11px] text-muted-foreground">
                      <span className="text-primary/70">└─</span>{" "}
                      <span className="text-muted-foreground/70">user_agent:</span>{" "}
                      <span
                        className="text-data/70 truncate inline-block max-w-[500px] align-bottom"
                        title={meta.user_agent}
                      >
                        {meta.user_agent}
                      </span>
                    </p>
                  )}
                </div>
              </motion.div>
            </TableCell>
          </TableRow>
        )}
      </AnimatePresence>
    </>
  );
};