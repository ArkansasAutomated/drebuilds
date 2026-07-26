import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import Papa from "papaparse";
import { Search, Download, Trash2, ChevronRight, Users } from "lucide-react";
import { useSubscribers, useDeleteSubscriber, Subscriber } from "@/hooks/useSubscribers";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { CornerAccent } from "@/components/decorative/CornerAccent";
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

export const SubscribersLog = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Subscriber | null>(null);

  const { data: subscribers, isLoading } = useSubscribers();
  const deleteMutation = useDeleteSubscriber();

  // Client-side filtering for instant search
  const filteredSubscribers = useMemo(() => {
    if (!subscribers) return [];
    if (!searchQuery) return subscribers;
    
    const query = searchQuery.toLowerCase();
    return subscribers.filter(
      (sub) =>
        sub.email.toLowerCase().includes(query) ||
        sub.source?.toLowerCase().includes(query)
    );
  }, [subscribers, searchQuery]);

  // CSV Export using PapaParse
  const exportToCSV = () => {
    const csvData = filteredSubscribers.map((sub) => ({
      email: sub.email,
      source: sub.source || "unknown",
      signup_date: sub.subscribed_at
        ? format(new Date(sub.subscribed_at), "yyyy-MM-dd HH:mm")
        : "",
      user_agent: typeof sub.metadata === "object" && sub.metadata && !Array.isArray(sub.metadata) ? sub.metadata.user_agent || "" : "",
      entry_path: typeof sub.metadata === "object" && sub.metadata && !Array.isArray(sub.metadata) ? sub.metadata.entry_path || "" : "",
    }));

    const csv = Papa.unparse(csvData);

    // Trigger download
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `subscribers_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    
    await deleteMutation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="relative p-6 bg-card border border-border rounded-sm">
      <CornerAccent position="tl" size={20} />
      <CornerAccent position="br" size={20} />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center bg-surface-elevated rounded-sm border border-primary/30">
            <Users className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="font-mono text-sm text-primary">
              &gt; SUBSCRIBER_LOG
            </h2>
            <p className="font-mono text-xs text-muted-foreground">
              {filteredSubscribers.length} records
            </p>
          </div>
        </div>

        <button
          onClick={exportToCSV}
          disabled={filteredSubscribers.length === 0}
          className="flex items-center gap-2 px-3 py-1.5 font-mono text-xs bg-surface-elevated border border-border rounded-sm hover:border-primary/30 hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-3.5 h-3.5" />
          Export CSV
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-4">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-primary">
          &gt; search:
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="filter by email or source..."
          className="w-full pl-20 pr-4 py-2.5 bg-surface-elevated border border-border rounded-sm font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
        />
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      </div>

      {/* Data Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <span className="font-mono text-sm text-muted-foreground animate-pulse">
            &gt; loading_subscribers...
          </span>
        </div>
      ) : filteredSubscribers.length === 0 ? (
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
                <TableHead className="font-mono text-xs text-primary">SOURCE</TableHead>
                <TableHead className="font-mono text-xs text-primary">STATUS</TableHead>
                <TableHead className="font-mono text-xs text-primary">DATE</TableHead>
                <TableHead className="font-mono text-xs text-primary w-12">ACT</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubscribers.map((subscriber) => (
                <SubscriberRow
                  key={subscriber.id}
                  subscriber={subscriber}
                  isExpanded={expandedId === subscriber.id}
                  onToggle={() => toggleExpand(subscriber.id)}
                  onDelete={() => setDeleteTarget(subscriber)}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
        targetEmail={deleteTarget?.email || ""}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
};

// Subscriber Row Component
interface SubscriberRowProps {
  subscriber: Subscriber;
  isExpanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
}

const SubscriberRow = ({
  subscriber,
  isExpanded,
  onToggle,
  onDelete,
}: SubscriberRowProps) => {
  const metadata = subscriber.metadata as { user_agent?: string; entry_path?: string } | null;
  const hasMetadata = metadata?.user_agent || metadata?.entry_path;

  return (
    <>
      <TableRow
        className={cn(
          "border-border cursor-pointer transition-colors",
          isExpanded && "bg-surface-elevated"
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
                hasMetadata ? "opacity-100" : "opacity-30"
              )}
            />
          </motion.div>
        </TableCell>
        <TableCell className="font-mono text-xs text-data py-3">
          <span className="truncate max-w-[200px] block" title={subscriber.email}>
            {subscriber.email}
          </span>
        </TableCell>
        <TableCell className="font-mono text-xs text-muted-foreground py-3">
          {subscriber.source || "unknown"}
        </TableCell>
        <TableCell className="py-3">
          <Badge
            variant="outline"
            className="font-mono text-[10px] bg-success/10 text-success border-success/30"
          >
            active
          </Badge>
        </TableCell>
        <TableCell className="font-mono text-xs text-muted-foreground py-3">
          {subscriber.subscribed_at
            ? format(new Date(subscriber.subscribed_at), "MMM dd")
            : "—"}
        </TableCell>
        <TableCell className="py-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1.5 rounded-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            title="Delete subscriber"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </TableCell>
      </TableRow>

      {/* Expanded Metadata Row */}
      <AnimatePresence>
        {isExpanded && hasMetadata && (
          <TableRow className="border-border bg-surface-elevated/50">
            <TableCell colSpan={6} className="py-0">
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="py-3 pl-8 space-y-1">
                  {metadata?.user_agent && (
                    <p className="font-mono text-[11px] text-muted-foreground">
                      <span className="text-primary/70">├─</span>{" "}
                      <span className="text-muted-foreground/70">user_agent:</span>{" "}
                      <span className="text-data/70 truncate inline-block max-w-[500px] align-bottom" title={metadata.user_agent}>
                        {metadata.user_agent}
                      </span>
                    </p>
                  )}
                  {metadata?.entry_path && (
                    <p className="font-mono text-[11px] text-muted-foreground">
                      <span className="text-primary/70">└─</span>{" "}
                      <span className="text-muted-foreground/70">entry_path:</span>{" "}
                      <span className="text-data/70">{metadata.entry_path}</span>
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
