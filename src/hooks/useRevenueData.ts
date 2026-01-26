import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface DailyRevenue {
  date: string;
  amount: number;
  count: number;
}

interface RevenueData {
  dailyRevenue: DailyRevenue[];
  totalRevenue: number;
  averageDaily: number;
  peakDay: { date: string | null; amount: number };
  paymentCount: number;
}

export const useRevenueData = () => {
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["whop-revenue"],
    queryFn: async (): Promise<RevenueData> => {
      const { data, error } = await supabase.functions.invoke("whop-revenue", {
        method: "GET",
      });

      if (error) {
        console.error("Error fetching revenue data:", error);
        throw error;
      }

      return data;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 2,
  });

  return {
    dailyRevenue: data?.dailyRevenue || [],
    totalRevenue: data?.totalRevenue || 0,
    averageDaily: data?.averageDaily || 0,
    peakDay: data?.peakDay || { date: null, amount: 0 },
    paymentCount: data?.paymentCount || 0,
    isLoading,
    error,
    refetch,
  };
};
