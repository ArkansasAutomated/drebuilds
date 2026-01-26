import { useEffect, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface RealtimeEvent {
  id: string;
  event_type: string;
  element_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  isRealtime?: boolean;
}

export const useAdminRealtime = () => {
  const [realtimeEvents, setRealtimeEvents] = useState<RealtimeEvent[]>([]);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleNewEvent = useCallback((event: RealtimeEvent) => {
    setRealtimeEvents((prev) => {
      // Prepend new event, keep max 20
      const updated = [{ ...event, isRealtime: true }, ...prev.slice(0, 19)];
      return updated;
    });

    // Invalidate relevant queries for revenue events
    if (event.event_type === "revenue" || event.event_type === "payment.succeeded") {
      queryClient.invalidateQueries({ queryKey: ["whop-revenue"] });
    }

    // Show toast for significant events
    if (event.event_type === "revenue" || event.event_type === "payment.succeeded") {
      const metadata = event.metadata as { amount?: number; currency?: string };
      toast({
        title: "💰 Payment Received",
        description: `$${((metadata?.amount || 0) / 100).toFixed(2)} ${metadata?.currency?.toUpperCase() || "USD"}`,
      });
    } else if (event.event_type === "membership.activated") {
      toast({
        title: "✅ New Member",
        description: "A new membership was activated",
      });
    }
  }, [queryClient, toast]);

  useEffect(() => {
    // Subscribe to broadcast channel for webhook events
    const broadcastChannel = supabase
      .channel("admin_updates")
      .on("broadcast", { event: "webhook_event" }, (payload) => {
        console.log("Received broadcast event:", payload);
        const eventData = payload.payload as RealtimeEvent;
        if (eventData) {
          handleNewEvent(eventData);
        }
      })
      .subscribe((status) => {
        console.log("Broadcast channel status:", status);
      });

    // Also subscribe to postgres changes on webhook_events table
    const dbChannel = supabase
      .channel("webhook_events_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "webhook_events",
        },
        (payload) => {
          console.log("New webhook event inserted:", payload);
          const newRecord = payload.new as {
            id: string;
            event_type: string;
            resource_id: string | null;
            payload: Record<string, unknown>;
            created_at: string;
          };
          
          handleNewEvent({
            id: newRecord.id,
            event_type: newRecord.event_type,
            element_id: newRecord.resource_id,
            metadata: newRecord.payload,
            created_at: newRecord.created_at,
            isRealtime: true,
          });
        }
      )
      .subscribe((status) => {
        console.log("DB channel status:", status);
      });

    return () => {
      supabase.removeChannel(broadcastChannel);
      supabase.removeChannel(dbChannel);
    };
  }, [handleNewEvent]);

  // Clear realtime flag after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setRealtimeEvents((prev) =>
        prev.map((e) => ({ ...e, isRealtime: false }))
      );
    }, 3000);

    return () => clearTimeout(timer);
  }, [realtimeEvents.length]);

  return { realtimeEvents };
};
