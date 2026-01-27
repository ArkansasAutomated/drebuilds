import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

/**
 * Generate a hashed session ID for telemetry tracking.
 * Uses SHA-256 to hash the raw session ID for tamper detection.
 */
const getSessionId = async (): Promise<string> => {
  const storageKey = "dre_session_id";
  const hashKey = "dre_session_hash";

  let sessionId = sessionStorage.getItem(storageKey);
  let sessionHash = sessionStorage.getItem(hashKey);

  // Generate new session if not exists
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem(storageKey, sessionId);

    // Generate and store hash
    const encoder = new TextEncoder();
    const data = encoder.encode(sessionId);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    sessionHash = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
    sessionStorage.setItem(hashKey, sessionHash);
  } else if (sessionHash) {
    // Verify hash integrity
    const encoder = new TextEncoder();
    const data = encoder.encode(sessionId);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const expectedHash = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");

    if (expectedHash !== sessionHash) {
      console.warn("Session ID tamper detected, regenerating");
      sessionId = crypto.randomUUID();
      sessionStorage.setItem(storageKey, sessionId);

      const newHashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(sessionId));
      sessionHash = Array.from(new Uint8Array(newHashBuffer))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
      sessionStorage.setItem(hashKey, sessionHash);
    }
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
      const sessionId = await getSessionId();
      await supabase.from("telemetry_events").insert([{
        event_type: eventType,
        element_id: elementId || null,
        metadata: metadata || {},
        session_id: sessionId,
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
