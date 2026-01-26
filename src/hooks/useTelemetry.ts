import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

const getSessionId = (): string => {
  const storageKey = "dre_session_id";
  let sessionId = sessionStorage.getItem(storageKey);
  
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem(storageKey, sessionId);
  }
  
  return sessionId;
};

export const useTelemetry = () => {
  const trackEvent = useCallback(async (
    eventType: string,
    elementId?: string,
    metadata?: Json
  ) => {
    try {
      await supabase.from("telemetry_events").insert([{
        event_type: eventType,
        element_id: elementId || null,
        metadata: metadata || {},
        session_id: getSessionId(),
        user_agent: navigator.userAgent,
      }]);
    } catch (error) {
      // Silently fail - telemetry should not break the app
      console.warn("Telemetry tracking failed:", error);
    }
  }, []);

  const trackClick = useCallback((elementId: string, metadata?: Json) => {
    return trackEvent("click", elementId, metadata);
  }, [trackEvent]);

  const trackScrollMilestone = useCallback((percentage: number) => {
    return trackEvent("scroll_milestone", `scroll_${percentage}`, { percentage });
  }, [trackEvent]);

  const trackSectionView = useCallback((sectionId: string) => {
    return trackEvent("section_view", sectionId);
  }, [trackEvent]);

  const trackExitIntent = useCallback(() => {
    return trackEvent("exit_intent");
  }, [trackEvent]);

  return {
    trackEvent,
    trackClick,
    trackScrollMilestone,
    trackSectionView,
    trackExitIntent,
  };
};
