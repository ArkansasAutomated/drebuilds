import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

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
const REDIRECT_URI = "https://drebuilds.online/auth/whop/callback";

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
      const { data, error } = await supabase
        .from("whop_users")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching Whop user:", error);
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error as unknown as Error,
        }));
        return;
      }

      // Check if user has admin company access
      const hasAdminAccess = data?.company_ids?.includes(WHOP_COMPANY_ID) || false;

      // Helper function to check plan access
      const hasPlan = (planId: string): boolean => {
        if (!data) return false;
        return data.plan_ids?.includes(planId) || false;
      };

      setState({
        whopUser: data as WhopUser | null,
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

  // OAuth initiation function
  const initiateWhopOAuth = useCallback(() => {
    if (!WHOP_CLIENT_ID) {
      console.error("WHOP_CLIENT_ID not configured");
      return;
    }

    const authUrl = `https://whop.com/oauth?client_id=${WHOP_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
    window.location.href = authUrl;
  }, []);

  // Refresh Whop user data
  const refreshWhopUser = useCallback(() => {
    setState(prev => ({ ...prev, isLoading: true }));
    fetchWhopUser();
  }, [fetchWhopUser]);

  return {
    ...state,
    initiateWhopOAuth,
    refreshWhopUser,
  };
};
