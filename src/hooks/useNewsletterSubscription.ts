import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { z } from "zod";

type SubscriptionStatus = "idle" | "loading" | "success" | "duplicate" | "error" | "rate_limited";

interface SubscriptionResult {
  status: SubscriptionStatus;
  message: string;
}

export interface SubscribeInput {
  email: string;
  fullName?: string;
  source?: string;
  metadata?: Record<string, unknown>;
}

export interface UseNewsletterSubscriptionOptions {
  /** Slug of the newsletter list to subscribe the lead to. Defaults to the hub list. */
  listSlug?: string;
  /** Default source recorded when the caller doesn't pass one. */
  defaultSource?: string;
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

const DEFAULT_LIST_SLUG = "drebuilds_main";

export const useNewsletterSubscription = (options: UseNewsletterSubscriptionOptions = {}) => {
  const { listSlug = DEFAULT_LIST_SLUG, defaultSource = "landing_page" } = options;
  const [status, setStatus] = useState<SubscriptionStatus>("idle");
  const [message, setMessage] = useState("");
  const attemptsRef = useRef<number[]>([]);
  // Caches list_id lookups so repeat submissions don't hit the DB.
  const listIdCacheRef = useRef<Map<string, string>>(new Map());

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

  const resolveListId = async (slug: string): Promise<string | null> => {
    const cached = listIdCacheRef.current.get(slug);
    if (cached) return cached;

    const { data, error } = await supabase
      .from("newsletter_lists")
      .select("id")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();

    if (error || !data) {
      console.error("Failed to resolve newsletter list slug:", slug, error);
      return null;
    }

    listIdCacheRef.current.set(slug, data.id);
    return data.id;
  };

  const subscribe = async (input: string | SubscribeInput): Promise<SubscriptionResult> => {
    // Check rate limit first
    if (!checkRateLimit()) {
      setStatus("rate_limited");
      setMessage("> rate_limit.exceeded");
      return { status: "rate_limited", message: "> rate_limit.exceeded" };
    }

    setStatus("loading");
    setMessage("> validating_input...");

    // Normalize input
    const normalized: SubscribeInput =
      typeof input === "string"
        ? { email: input }
        : input;

    // Validate email format
    const validationResult = emailSchema.safeParse(normalized.email);
    if (!validationResult.success) {
      setStatus("error");
      const errorMsg = "> invalid_email_format";
      setMessage(errorMsg);
      return { status: "error", message: errorMsg };
    }

    const normalizedEmail = validationResult.data;

    // Optional name validation
    const fullName = normalized.fullName?.trim() || null;
    if (fullName && fullName.length > 200) {
      setStatus("error");
      const errorMsg = "> name.too_long";
      setMessage(errorMsg);
      return { status: "error", message: errorMsg };
    }

    setMessage("> resolving_list...");

    const listId = await resolveListId(listSlug);
    if (!listId) {
      setStatus("error");
      const errorMsg = "> list.not_found";
      setMessage(errorMsg);
      return { status: "error", message: errorMsg };
    }

    setMessage("> writing_to_db...");

    try {
      // Check if email already exists in this list
      const { data: existing, error: checkError } = await supabase
        .from("newsletter_subscriptions")
        .select("id")
        .eq("list_id", listId)
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

      // Insert new subscription
      const { error: insertError } = await supabase
        .from("newsletter_subscriptions")
        .insert({
          email: normalizedEmail,
          list_id: listId,
          full_name: fullName,
          source: normalized.source ?? defaultSource,
          metadata: (normalized.metadata ?? null) as Json,
        });

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

  return { subscribe, status, message, reset, listSlug };
};