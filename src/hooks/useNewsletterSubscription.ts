import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

type SubscriptionStatus = "idle" | "loading" | "success" | "duplicate" | "error" | "rate_limited";

interface SubscriptionResult {
  status: SubscriptionStatus;
  message: string;
}

// Email validation schema
const emailSchema = z.string()
  .min(5, "Email too short")
  .max(255, "Email too long")
  .email("Invalid email format")
  .transform(val => val.toLowerCase().trim());

// Rate limiting: max 3 attempts per minute
const RATE_LIMIT_WINDOW_MS = 60000;
const RATE_LIMIT_MAX_ATTEMPTS = 3;

export const useNewsletterSubscription = () => {
  const [status, setStatus] = useState<SubscriptionStatus>("idle");
  const [message, setMessage] = useState("");
  const attemptsRef = useRef<number[]>([]);

  const checkRateLimit = (): boolean => {
    const now = Date.now();
    // Remove attempts older than the window
    attemptsRef.current = attemptsRef.current.filter(
      timestamp => now - timestamp < RATE_LIMIT_WINDOW_MS
    );
    
    if (attemptsRef.current.length >= RATE_LIMIT_MAX_ATTEMPTS) {
      return false;
    }
    
    attemptsRef.current.push(now);
    return true;
  };

  const subscribe = async (email: string): Promise<SubscriptionResult> => {
    // Check rate limit first
    if (!checkRateLimit()) {
      setStatus("rate_limited");
      setMessage("> rate_limit.exceeded");
      return { status: "rate_limited", message: "> rate_limit.exceeded" };
    }

    setStatus("loading");
    setMessage("> validating_input...");

    // Validate email format
    const validationResult = emailSchema.safeParse(email);
    if (!validationResult.success) {
      setStatus("error");
      const errorMsg = "> invalid_email_format";
      setMessage(errorMsg);
      return { status: "error", message: errorMsg };
    }

    const normalizedEmail = validationResult.data;
    setMessage("> writing_to_db...");

    try {
      // Check if email already exists
      const { data: existing, error: checkError } = await supabase
        .from("subscribers")
        .select("id")
        .eq("email", normalizedEmail)
        .maybeSingle();

      if (checkError) {
        throw checkError;
      }

      if (existing) {
        setStatus("duplicate");
        setMessage("> user.already_logged ✓");
        return { status: "duplicate", message: "> user.already_logged ✓" };
      }

      // Insert new subscriber
      const { error: insertError } = await supabase
        .from("subscribers")
        .insert({ email: normalizedEmail, source: "landing_page" });

      if (insertError) {
        // Handle unique constraint violation (race condition)
        if (insertError.code === "23505") {
          setStatus("duplicate");
          setMessage("> user.already_logged ✓");
          return { status: "duplicate", message: "> user.already_logged ✓" };
        }
        // Handle validation constraint violation
        if (insertError.code === "23514") {
          setStatus("error");
          setMessage("> validation.failed");
          return { status: "error", message: "> validation.failed" };
        }
        throw insertError;
      }

      setStatus("success");
      setMessage("> subscription.confirmed ✓");
      return { status: "success", message: "> subscription.confirmed ✓" };
    } catch (error) {
      console.error("Newsletter subscription error:", error);
      setStatus("error");
      setMessage("> connection.failed");
      return { status: "error", message: "> connection.failed" };
    }
  };

  const reset = () => {
    setStatus("idle");
    setMessage("");
  };

  return { subscribe, status, message, reset };
};
