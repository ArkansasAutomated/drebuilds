import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface WhopPlan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  renewal_price: number | null;
  billing_period: string | null;
}

interface CheckoutResponse {
  checkout_url: string;
  session_id: string;
}

export const useWhopProducts = () => {
  // Fetch plans from the Edge Function
  const {
    data: plansData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["whop-plans"],
    queryFn: async (): Promise<WhopPlan[]> => {
      const { data, error } = await supabase.functions.invoke("whop-products/plans", {
        method: "GET",
      });

      if (error) {
        console.error("Error fetching Whop plans:", error);
        throw error;
      }

      return data?.plans || [];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 2,
  });

  // Mutation for creating checkout sessions
  const checkoutMutation = useMutation({
    mutationFn: async ({ planId, redirectUrl }: { planId: string; redirectUrl?: string }): Promise<CheckoutResponse> => {
      const { data, error } = await supabase.functions.invoke("whop-products/checkout", {
        method: "POST",
        body: {
          plan_id: planId,
          redirect_url: redirectUrl || window.location.origin + "/#/vault",
        },
      });

      if (error) {
        console.error("Error creating checkout:", error);
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      // Redirect to checkout URL
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      }
    },
  });

  const createCheckout = async (planId: string, redirectUrl?: string) => {
    return checkoutMutation.mutateAsync({ planId, redirectUrl });
  };

  return {
    plans: plansData || [],
    isLoading,
    error,
    refetch,
    createCheckout,
    isCheckoutLoading: checkoutMutation.isPending,
    checkoutError: checkoutMutation.error,
  };
};
