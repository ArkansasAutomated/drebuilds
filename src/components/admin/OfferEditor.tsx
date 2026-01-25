import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CornerAccent } from "@/components/decorative/CornerAccent";
import { useOfferSettings } from "@/hooks/useAdminStats";
import { supabase } from "@/integrations/supabase/client";
import { BlinkingCursor } from "@/components/ui/BlinkingCursor";
import { TextSwapButton } from "@/components/ui/TextSwapButton";
import { StatusDot } from "@/components/ui/StatusDot";

const springConfig = {
  mass: 1,
  stiffness: 120,
  damping: 14,
};

export const OfferEditor = () => {
  const queryClient = useQueryClient();
  const { data: offers, isLoading } = useOfferSettings();
  
  const consultingOffer = offers?.find(o => o.id === "consulting");
  
  const [price, setPrice] = useState("");
  const [link, setLink] = useState("");
  const [title, setTitle] = useState("");
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (consultingOffer) {
      setPrice(consultingOffer.price || "");
      setLink(consultingOffer.link || "");
      setTitle(consultingOffer.title || "");
    }
  }, [consultingOffer]);

  useEffect(() => {
    if (consultingOffer) {
      const hasChanges = 
        price !== consultingOffer.price ||
        link !== (consultingOffer.link || "") ||
        title !== consultingOffer.title;
      setIsDirty(hasChanges);
    }
  }, [price, link, title, consultingOffer]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("offer_settings")
        .update({ price, link, title })
        .eq("id", "consulting");
      if (error) throw error;
    },
    onSuccess: () => {
      setIsDirty(false);
      queryClient.invalidateQueries({ queryKey: ["admin", "offer-settings"] });
      queryClient.invalidateQueries({ queryKey: ["offer-settings"] });
    },
  });

  return (
    <motion.div
      className="relative p-6 bg-card border border-border rounded-sm group hover:border-primary/30 transition-colors"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", ...springConfig, delay: 0.4 }}
    >
      <CornerAccent position="tl" size={16} className="opacity-50 group-hover:opacity-100 transition-opacity" />
      <CornerAccent position="br" size={16} className="opacity-50 group-hover:opacity-100 transition-opacity" />

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-mono text-sm text-muted-foreground">
          // EDIT_CONSULTING_OFFER
        </h2>
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-muted-foreground">preview:</span>
          <StatusDot status={isDirty ? "warning" : "online"} />
        </div>
      </div>

      {isLoading ? (
        <div className="font-mono text-sm text-primary flex items-center gap-2">
          <span>&gt; fetching_data</span>
          <BlinkingCursor />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Title Field */}
          <div className="space-y-1">
            <label className="font-mono text-xs text-muted-foreground">
              &gt; title:
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-surface-elevated border border-border rounded-sm px-3 py-2 font-mono text-sm text-foreground focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>

          {/* Price Field */}
          <div className="space-y-1">
            <label className="font-mono text-xs text-muted-foreground">
              &gt; price:
            </label>
            <input
              type="text"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full bg-surface-elevated border border-border rounded-sm px-3 py-2 font-mono text-sm text-foreground focus:outline-none focus:border-primary/50 transition-colors"
              placeholder="$500"
            />
          </div>

          {/* Link Field */}
          <div className="space-y-1">
            <label className="font-mono text-xs text-muted-foreground">
              &gt; link:
            </label>
            <input
              type="text"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              className="w-full bg-surface-elevated border border-border rounded-sm px-3 py-2 font-mono text-sm text-foreground focus:outline-none focus:border-primary/50 transition-colors"
              placeholder="/consulting"
            />
          </div>

          {/* Update Button */}
          <div className="pt-2">
            <TextSwapButton
              defaultText={updateMutation.isPending ? "Updating..." : "Update Offer"}
              hoverText={updateMutation.isPending ? "> writing..." : "db.update()"}
              variant={isDirty ? "primary" : "secondary"}
              size="sm"
              onClick={() => updateMutation.mutate()}
              className={!isDirty ? "opacity-50" : ""}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
};
