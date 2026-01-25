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

export const useSubscriberStats = () => {
  return useQuery({
    queryKey: ["admin", "subscriber-stats"],
    queryFn: async (): Promise<SubscriberStats> => {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeek = new Date(startOfDay);
      startOfWeek.setDate(startOfWeek.getDate() - 7);
      const startOfLastWeek = new Date(startOfWeek);
      startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

      // Get total count
      const { count: total } = await supabase
        .from("subscribers")
        .select("*", { count: "exact", head: true });

      // Get today's count
      const { count: today } = await supabase
        .from("subscribers")
        .select("*", { count: "exact", head: true })
        .gte("subscribed_at", startOfDay.toISOString());

      // Get this week's count
      const { count: thisWeek } = await supabase
        .from("subscribers")
        .select("*", { count: "exact", head: true })
        .gte("subscribed_at", startOfWeek.toISOString());

      // Get last week's count for growth calculation
      const { count: lastWeek } = await supabase
        .from("subscribers")
        .select("*", { count: "exact", head: true })
        .gte("subscribed_at", startOfLastWeek.toISOString())
        .lt("subscribed_at", startOfWeek.toISOString());

      const growthPercent = lastWeek && lastWeek > 0 
        ? ((thisWeek || 0) - lastWeek) / lastWeek * 100 
        : 0;

      return {
        total: total || 0,
        today: today || 0,
        thisWeek: thisWeek || 0,
        growthPercent: Math.round(growthPercent * 10) / 10,
      };
    },
  });
};

export const useClickStats = () => {
  return useQuery({
    queryKey: ["admin", "click-stats"],
    queryFn: async (): Promise<ClickStats[]> => {
      const { data, error } = await supabase
        .from("button_clicks")
        .select("button_id");

      if (error) throw error;

      // Count clicks per button
      const clickCounts: Record<string, number> = {};
      let totalClicks = 0;

      (data || []).forEach((click) => {
        clickCounts[click.button_id] = (clickCounts[click.button_id] || 0) + 1;
        totalClicks++;
      });

      // Convert to array with percentages
      const buttons = ["consulting", "community", "store", "learn"];
      return buttons.map((buttonId) => ({
        buttonId,
        clicks: clickCounts[buttonId] || 0,
        percentage: totalClicks > 0 
          ? Math.round((clickCounts[buttonId] || 0) / totalClicks * 1000) / 10 
          : 0,
      }));
    },
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
  });
};
