import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

// Interface for data from whop_users_safe view (excludes tokens)
interface WhopUserSafe {
  id: string;
  user_id: string;
  whop_user_id: string;
  company_ids: string[] | null;
  plan_ids: string[] | null;
  username: string | null;
  email: string | null;
  profile_pic_url: string | null;
  metadata: {
    plan_ids?: string[];
    memberships?: Array<{
      company_id?: string;
      plan_id?: string;
      [key: string]: unknown;
    }>;
    last_synced?: string;
    expires_at?: string;
  } | null;
  created_at: string | null;
  updated_at: string | null;
}

interface WhopUser {
  whop_user_id: string;
  username: string | null;
  email: string | null;
  profile_pic_url: string | null;
  company_ids: string[];
  plan_ids: string[];
  metadata: {
    plan_ids?: string[];
    memberships?: Array<{
      company_id?: string;
      plan_id?: string;
      [key: string]: unknown;
    }>;
    last_synced?: string;
    expires_at?: string;
  } | null;
}

interface WhopUserState {
  whopUser: WhopUser | null;
  isLoading: boolean;
  isWhopAdmin: boolean;
  hasPlan: (planId: string) => boolean;
  error: Error | null;
}

// Public OAuth config values
const WHOP_CLIENT_ID = "app_ndC8gk4czaoeFG";
const WHOP_COMPANY_ID = "biz_LBZIL5SNocl6WR";

const getRedirectUri = () => {
  const origin = window.location.origin;
  // Dynamic handling for localhost and production (www and non-www)
  if (
    origin.includes("localhost") ||
    origin.includes("127.0.0.1") ||
    origin === "https://drebuilds.online" ||
    origin === "https://www.drebuilds.online"
  ) {
    return `${origin}/#/auth/whop/callback`;
  }
  // Fallback to non-www if unknown origin (e.g. preview deployment)
  return "https://drebuilds.online/#/auth/whop/callback";
};

export const useWhopUser = () => {
  const { user } = useAuth();
  const [state, setState] = useState<WhopUserState>({
    whopUser: null,
    isLoading: true,
    isWhopAdmin: false,
    hasPlan: () => false,
    error: null,
  });

  const fetchWhopUser = useCallback(async () => {
    if (!user) {
      setState({
        whopUser: null,
        isLoading: false,
        isWhopAdmin: false,
        hasPlan: () => false,
        error: null,
      });
      return;
    }

    try {
      // Use the safe view that excludes tokens
      // Cast to any since view isn't in generated types
      const { data: rawData, error } = await supabase
        .from("whop_users_safe" as any)
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle() as { data: WhopUserSafe | null; error: any };

      if (error) {
        console.error("Error fetching Whop user:", error);
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error as Error,
        }));
        return;
      }

      // Transform to WhopUser interface
      const whopUserData: WhopUser | null = rawData ? {
        whop_user_id: rawData.whop_user_id,
        username: rawData.username,
        email: rawData.email,
        profile_pic_url: rawData.profile_pic_url,
        company_ids: rawData.company_ids || [],
        plan_ids: rawData.plan_ids || [],
        metadata: rawData.metadata,
      } : null;

      // Check if user has admin company access
      const hasAdminAccess = whopUserData?.company_ids?.includes(WHOP_COMPANY_ID) || false;

      // Helper function to check plan access
      const hasPlan = (planId: string): boolean => {
        if (!whopUserData) return false;
        return whopUserData.plan_ids?.includes(planId) || false;
      };

      setState({
        whopUser: whopUserData,
        isLoading: false,
        isWhopAdmin: hasAdminAccess,
        hasPlan,
        error: null,
      });
    } catch (err) {
      console.error("Error in fetchWhopUser:", err);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err as Error,
      }));
    }
  }, [user]);

  useEffect(() => {
    fetchWhopUser();
  }, [fetchWhopUser]);

  // Token Auto-Refresh Logic
  const refreshWhopToken = useCallback(async () => {
    try {
      console.log("Refreshing Whop token...");
      const { data, error } = await supabase.functions.invoke("whop-oauth", {
        body: { grant_type: "refresh_token" }
      });

      if (error || !data?.success) {
        console.error("Failed to auto-refresh token:", error || data?.error);
        return false;
      }

      console.log("Token refreshed successfully. New expiry:", data.expires_at);
      fetchWhopUser(); // Reload user data to get new metadata
      return true;
    } catch (err) {
      console.error("Error invoking refresh function:", err);
      return false;
    }
  }, [fetchWhopUser]);

  useEffect(() => {
    if (!state.whopUser?.metadata?.expires_at) return;

    const expiresAt = new Date(state.whopUser.metadata.expires_at).getTime();
    const now = Date.now();
    const timeUntilExpiry = expiresAt - now;

    // Refresh 5 minutes before expiry
    const REFRESH_BUFFER = 5 * 60 * 1000;

    if (timeUntilExpiry < REFRESH_BUFFER) {
      // Token is already expired or close to it
      refreshWhopToken();
    } else {
      // Schedule refresh
      const timeoutId = setTimeout(() => {
        refreshWhopToken();
      }, timeUntilExpiry - REFRESH_BUFFER);

      return () => clearTimeout(timeoutId);
    }
  }, [state.whopUser, refreshWhopToken]);


  // OAuth initiation function
  const initiateWhopOAuth = useCallback(async () => {
    if (!WHOP_CLIENT_ID) {
      console.error("WHOP_CLIENT_ID not configured");
      return;
    }

    // Generate PKCE values
    const generateRandomString = (length: number) => {
      const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
      let text = "";
      for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
      }
      return text;
    };

    const generateCodeChallenge = async (codeVerifier: string) => {
      const encoder = new TextEncoder();
      const data = encoder.encode(codeVerifier);
      const digest = await window.crypto.subtle.digest("SHA-256", data);
      return btoa(String.fromCharCode(...new Uint8Array(digest)))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
    };

    try {
      const codeVerifier = generateRandomString(128);
      const codeChallenge = await generateCodeChallenge(codeVerifier);

      // Store verifier for callback handling
      window.sessionStorage.setItem("whop_code_verifier", codeVerifier);

      const redirectUri = getRedirectUri();

      const scopes = [
        "chat:message:create",
        "chat:read",
        "dms:read",
        "dms:message:manage",
        "dms:channel:manage",
        "company:balance:read",
        "forum:post:create",
        "forum:read",
        "livestream:chat:read",
        "livestream:chat:write",
        "openid",
        "profile",
        "email",
        "payout:create_destination",
        "payout:delete_destination",
        "payout:destination:read",
        "payout:transfer:read",
        "payout:transfer:export",
        "payout:update_destination",
        "payout:withdraw_funds",
        "payout:withdrawal:read",
        "payout:account:read",
        "payout:account:update",
        "support_chat:read",
        "support_chat:message:create",
        "user:balance:read",
        "ai_chat:read",
        "ai_chat:create",
        "ai_chat:delete",
        "ai_chat:update",
        "memberships.read", // Preserving this to ensure access checks still work
        "memberships.manage",
        "affiliates.read"
      ];

      const authUrl = new URL("https://whop.com/oauth");
      authUrl.searchParams.append("client_id", WHOP_CLIENT_ID);
      authUrl.searchParams.append("redirect_uri", redirectUri);
      authUrl.searchParams.append("code_challenge", codeChallenge);
      authUrl.searchParams.append("code_challenge_method", "S256");
      authUrl.searchParams.append("scope", scopes.join(" "));

      window.location.href = authUrl.toString();
    } catch (err) {
      console.error("Failed to initiate OAuth:", err);
    }
  }, []);

  // Refresh Whop user data (manual)
  const refreshWhopUser = useCallback(() => {
    setState(prev => ({ ...prev, isLoading: true }));
    fetchWhopUser();
  }, [fetchWhopUser]);

  return {
    ...state,
    initiateWhopOAuth,
    refreshWhopUser,
    refreshWhopToken, // Exported for manual testing
  };
};
