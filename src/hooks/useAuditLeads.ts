import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AuditLeadStatus =
  | "new"
  | "reviewed"
  | "audited"
  | "booked"
  | "closed_won"
  | "closed_lost";

export const AUDIT_STATUS_LABELS: Record<AuditLeadStatus, string> = {
  new: "New",
  reviewed: "Reviewed",
  audited: "Audited",
  booked: "Booked",
  closed_won: "Closed (Won)",
  closed_lost: "Closed (Lost)",
};

export const AUDIT_STATUS_ORDER: AuditLeadStatus[] = [
  "new",
  "reviewed",
  "audited",
  "booked",
  "closed_won",
  "closed_lost",
];

export interface AuditLead {
  id: string;
  business_name: string;
  industry: string;
  team_size: string;
  current_tools: string[];
  biggest_bottleneck: string;
  full_name: string;
  email: string;
  phone: string;
  preferred_contact_method: string;
  status: string;
  source: string | null;
  user_agent: string | null;
  referrer: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// ============================================================
// List hook — audit_leads RLS denies client-side SELECT, so when
// running against Supabase this returns an empty list (and the
// panel renders a "needs backend wiring" hint). When a future
// server-side admin endpoint proxies the data, switch this hook
// to fetch that endpoint and the rest of the panel lights up
// without further changes.
// ============================================================
export const useAuditLeads = () => {
  return useQuery({
    queryKey: ["admin", "audit-leads"],
    queryFn: async (): Promise<AuditLead[]> => {
      const { data, error } = await supabase
        .from("audit_leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        const isRls =
          error.code === "PGRST301" ||
          /permission denied|row.level security/i.test(error.message);
        if (isRls) return [];
        throw error;
      }
      return (data || []) as AuditLead[];
    },
  });
};

export const useUpdateAuditLeadStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: AuditLeadStatus;
    }) => {
      const { error } = await supabase
        .from("audit_leads")
        .update({ status })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "audit-leads"] });
    },
  });
};

export interface AuditLeadStats {
  total: number;
  thisWeek: number;
  booked: number;
  conversionRate: number; // 0-100
}

export const computeAuditLeadStats = (
  leads: AuditLead[] | undefined,
): AuditLeadStats => {
  const list = leads ?? [];
  const total = list.length;
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const thisWeek = list.filter((l) =>
    l.created_at ? new Date(l.created_at).getTime() >= sevenDaysAgo : false,
  ).length;
  const booked = list.filter(
    (l) => l.status === "booked" || l.status === "closed_won",
  ).length;
  const conversionRate = total === 0 ? 0 : Math.round((booked / total) * 100);
  return { total, thisWeek, booked, conversionRate };
};

export const useAuditLeadStats = (
  leads: AuditLead[] | undefined,
): AuditLeadStats => {
  return useMemo(() => computeAuditLeadStats(leads), [leads]);
};