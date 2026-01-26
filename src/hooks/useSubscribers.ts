import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SubscriberMetadata {
  user_agent?: string;
  entry_path?: string;
  referrer?: string;
}

export interface Subscriber {
  id: string;
  email: string;
  source: string | null;
  subscribed_at: string | null;
  metadata: SubscriberMetadata | null;
}

export const useSubscribers = () => {
  return useQuery({
    queryKey: ["admin", "subscribers"],
    queryFn: async (): Promise<Subscriber[]> => {
      const { data, error } = await supabase
        .from("subscribers")
        .select("*")
        .order("subscribed_at", { ascending: false });

      if (error) throw error;
      return (data || []) as Subscriber[];
    },
  });
};

export const useDeleteSubscriber = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("subscribers")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "subscribers"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "subscriber-stats"] });
    },
  });
};
