import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SubscriberStats {
  total: number;
  today: number;
  thisWeek: number;
  growthPercent: number;
}

interface ClickStats {
  buttonId: string;
  clicks: number;
  percentage: number;
}

/**
 * Fetch subscriber stats using Supabase RPC for better performance.
 * Computation is offloaded to the database instead of client-side.
 */
export const useSubscriberStats = () => {
  return useQuery({
    queryKey: ["admin", "subscriber-stats"],
    queryFn: async (): Promise<SubscriberStats> => {
      const { data, error } = await supabase.rpc("get_subscriber_stats");

      if (error) {
        console.error("Failed to fetch subscriber stats:", error);
        throw error;
      }

      return data as SubscriberStats;
    },
    staleTime: 60 * 1000, // Cache for 1 minute
    retry: 2,
  });
};

/**
 * Fetch click stats using Supabase RPC for better performance.
 */
export const useClickStats = () => {
  return useQuery({
    queryKey: ["admin", "click-stats"],
    queryFn: async (): Promise<ClickStats[]> => {
      const { data, error } = await supabase.rpc("get_click_stats");

      if (error) {
        console.error("Failed to fetch click stats:", error);
        throw error;
      }

      // Ensure all expected buttons are represented
      const buttons = ["consulting", "community", "store", "learn"];
      const statsMap = new Map((data as ClickStats[] || []).map(s => [s.buttonId, s]));

      return buttons.map(buttonId =>
        statsMap.get(buttonId) || { buttonId, clicks: 0, percentage: 0 }
      );
    },
    staleTime: 60 * 1000, // Cache for 1 minute
    retry: 2,
  });
};

export const useContentItems = () => {
  return useQuery({
    queryKey: ["admin", "content-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_items")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data;
    },
    staleTime: 60 * 1000, // Cache for 1 minute
  });
};

export const useOfferSettings = () => {
  return useQuery({
    queryKey: ["admin", "offer-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("offer_settings")
        .select("*");

      if (error) throw error;
      return data;
    },
    staleTime: 60 * 1000, // Cache for 1 minute
  });
};
