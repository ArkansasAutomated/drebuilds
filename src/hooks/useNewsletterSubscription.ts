import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type SubscriptionStatus = "idle" | "loading" | "success" | "duplicate" | "error";

interface SubscriptionResult {
  status: SubscriptionStatus;
  message: string;
}

export const useNewsletterSubscription = () => {
  const [status, setStatus] = useState<SubscriptionStatus>("idle");
  const [message, setMessage] = useState("");

  const subscribe = async (email: string): Promise<SubscriptionResult> => {
    setStatus("loading");
    setMessage("> writing_to_db...");

    try {
      const normalizedEmail = email.toLowerCase().trim();

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
