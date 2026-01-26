import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type TelemetryEvent = Tables<"telemetry_events">;

interface LogicGateClicks {
  consulting: number;
  community: number;
  store: number;
  learn: number;
}

export interface ConversionPipelineData {
  totalSessions: number;
  logicGateClicks: LogicGateClicks;
  totalLogicGateClicks: number;
  newsletterSignups: number;
  stripeRedirects: number;
  sessionToClickRate: number;
  clickToSignupRate: number;
  recentEvents: TelemetryEvent[];
}

export const useConversionPipeline = () => {
  return useQuery({
    queryKey: ["admin", "conversion-pipeline"],
    queryFn: async (): Promise<ConversionPipelineData> => {
      // Fetch all data in parallel
      const [
        sessionsResult,
        clicksResult,
        subscribersResult,
        stripeEventsResult,
        recentEventsResult,
      ] = await Promise.all([
        // Unique sessions from telemetry
        supabase
          .from("telemetry_events")
          .select("session_id"),
        
        // Button clicks by type
        supabase
          .from("button_clicks")
          .select("button_id"),
        
        // Total subscribers
        supabase
          .from("subscribers")
          .select("*", { count: "exact", head: true }),
        
        // Stripe redirect events
        supabase
          .from("telemetry_events")
          .select("*", { count: "exact", head: true })
          .or("element_id.eq.store,element_id.eq.stripe_redirect"),
        
        // Recent events (last 20)
        supabase
          .from("telemetry_events")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

      // Calculate unique sessions
      const uniqueSessions = new Set(
        (sessionsResult.data || [])
          .map(e => e.session_id)
          .filter(Boolean)
      );
      const totalSessions = uniqueSessions.size;

      // Aggregate button clicks
      const logicGateClicks: LogicGateClicks = {
        consulting: 0,
        community: 0,
        store: 0,
        learn: 0,
      };

      (clicksResult.data || []).forEach((click) => {
        const buttonId = click.button_id as keyof LogicGateClicks;
        if (buttonId in logicGateClicks) {
          logicGateClicks[buttonId]++;
        }
      });

      const totalLogicGateClicks = Object.values(logicGateClicks).reduce(
        (sum, count) => sum + count,
        0
      );

      const newsletterSignups = subscribersResult.count || 0;
      const stripeRedirects = stripeEventsResult.count || 0;

      // Calculate conversion rates
      const sessionToClickRate = totalSessions > 0
        ? (totalLogicGateClicks / totalSessions) * 100
        : 0;

      const clickToSignupRate = totalLogicGateClicks > 0
        ? (newsletterSignups / totalLogicGateClicks) * 100
        : 0;

      return {
        totalSessions,
        logicGateClicks,
        totalLogicGateClicks,
        newsletterSignups,
        stripeRedirects,
        sessionToClickRate: Math.round(sessionToClickRate * 10) / 10,
        clickToSignupRate: Math.round(clickToSignupRate * 10) / 10,
        recentEvents: recentEventsResult.data || [],
      };
    },
    refetchInterval: 10000, // Refresh every 10s
  });
};

export const useLiveEvents = () => {
  return useQuery({
    queryKey: ["admin", "live-events"],
    queryFn: async (): Promise<TelemetryEvent[]> => {
      const { data, error } = await supabase
        .from("telemetry_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 5000, // Refresh every 5s for live feel
  });
};
