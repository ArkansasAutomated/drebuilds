import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface NewsletterList {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface NewsletterSubscription {
  id: string;
  email: string;
  list_id: string;
  full_name: string | null;
  source: string | null;
  metadata: Record<string, unknown> | null;
  subscribed_at: string | null;
  unsubscribed_at: string | null;
}

export interface NewsletterListSummary {
  list: NewsletterList;
  total: number;
  today: number;
  thisWeek: number;
}

/**
 * Fetch every newsletter list along with a quick count summary for the
 * admin overview. Counts come straight from the DB so the card stays
 * cheap to render.
 */
export const useNewsletterLists = () => {
  return useQuery({
    queryKey: ["admin", "newsletter-lists"],
    queryFn: async (): Promise<NewsletterListSummary[]> => {
      const { data: lists, error: listsErr } = await supabase
        .from("newsletter_lists")
        .select("*")
        .order("created_at", { ascending: true });

      if (listsErr) throw listsErr;
      if (!lists || lists.length === 0) return [];

      // Single query for all subscriber counts per list.
      const { data: counts, error: countsErr } = await supabase
        .from("newsletter_subscriptions")
        .select("list_id, subscribed_at");

      if (countsErr) throw countsErr;

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);

      const summaryMap = new Map<string, { total: number; today: number; thisWeek: number }>();
      for (const row of counts ?? []) {
        const entry = summaryMap.get(row.list_id) ?? { total: 0, today: 0, thisWeek: 0 };
        entry.total += 1;
        const ts = row.subscribed_at ? new Date(row.subscribed_at) : null;
        if (ts) {
          if (ts >= todayStart) entry.today += 1;
          if (ts >= weekStart) entry.thisWeek += 1;
        }
        summaryMap.set(row.list_id, entry);
      }

      return lists.map((list) => ({
        list: list as NewsletterList,
        total: summaryMap.get(list.id)?.total ?? 0,
        today: summaryMap.get(list.id)?.today ?? 0,
        thisWeek: summaryMap.get(list.id)?.thisWeek ?? 0,
      }));
    },
    staleTime: 30 * 1000,
  });
};

/**
 * Fetch every subscription for one list (used by the per-list table).
 */
export const useNewsletterSubscriptions = (listId: string | null) => {
  return useQuery({
    queryKey: ["admin", "newsletter-subscriptions", listId],
    queryFn: async (): Promise<NewsletterSubscription[]> => {
      if (!listId) return [];
      const { data, error } = await supabase
        .from("newsletter_subscriptions")
        .select("*")
        .eq("list_id", listId)
        .order("subscribed_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as NewsletterSubscription[];
    },
    enabled: !!listId,
    staleTime: 30 * 1000,
  });
};

export const useDeleteNewsletterSubscription = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("newsletter_subscriptions")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "newsletter-subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "newsletter-lists"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "subscriber-stats"] });
    },
  });
};