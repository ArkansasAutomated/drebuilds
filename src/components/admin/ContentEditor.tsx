import { useState } from "react";
import { motion } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CornerAccent } from "@/components/decorative/CornerAccent";
import { useContentItems } from "@/hooks/useAdminStats";
import { supabase } from "@/integrations/supabase/client";
import { BlinkingCursor } from "@/components/ui/BlinkingCursor";
import { TextSwapButton } from "@/components/ui/TextSwapButton";
import { ArrowUp, ArrowDown, X, Plus } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

// Validation schema matching DB constraints
const contentTextSchema = z.string().min(1, "Text required").max(500, "Text too long (max 500 chars)");
const springConfig = {
  mass: 1,
  stiffness: 120,
  damping: 14,
};

export const ContentEditor = () => {
  const queryClient = useQueryClient();
  const { data: items, isLoading } = useContentItems();
  const [newItemText, setNewItemText] = useState("");

  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, newOrder }: { id: string; newOrder: number }) => {
      const { error } = await supabase
        .from("content_items")
        .update({ display_order: newOrder })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "content-items"] });
      queryClient.invalidateQueries({ queryKey: ["content-items"] });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("content_items")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "content-items"] });
      queryClient.invalidateQueries({ queryKey: ["content-items"] });
    },
  });

  const addItemMutation = useMutation({
    mutationFn: async (text: string) => {
      // Validate before sending to DB
      const validation = contentTextSchema.safeParse(text);
      if (!validation.success) {
        throw new Error(validation.error.errors[0].message);
      }
      
      const maxOrder = items ? Math.max(...items.map(i => i.display_order), 0) : 0;
      const { error } = await supabase
        .from("content_items")
        .insert({ text: validation.data, display_order: maxOrder + 1 });
      if (error) {
        if (error.code === "23514") throw new Error("Validation failed - check text length");
        throw error;
      }
    },
    onSuccess: () => {
      setNewItemText("");
      queryClient.invalidateQueries({ queryKey: ["admin", "content-items"] });
      queryClient.invalidateQueries({ queryKey: ["content-items"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add item");
    },
  });

  const moveItem = (index: number, direction: "up" | "down") => {
    if (!items) return;
    
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const currentItem = items[index];
    const targetItem = items[targetIndex];

    // Swap orders
    updateOrderMutation.mutate({ id: currentItem.id, newOrder: targetItem.display_order });
    updateOrderMutation.mutate({ id: targetItem.id, newOrder: currentItem.display_order });
  };

  return (
    <motion.div
      className="relative p-6 bg-card border border-border rounded-sm group hover:border-primary/30 transition-colors"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", ...springConfig, delay: 0.3 }}
    >
      <CornerAccent position="tl" size={16} className="opacity-50 group-hover:opacity-100 transition-opacity" />
      <CornerAccent position="br" size={16} className="opacity-50 group-hover:opacity-100 transition-opacity" />

      <h2 className="font-mono text-sm text-muted-foreground mb-4">
        // EDIT_CONTENT_STREAM
      </h2>

      {isLoading ? (
        <div className="font-mono text-sm text-primary flex items-center gap-2">
          <span>&gt; fetching_data</span>
          <BlinkingCursor />
        </div>
      ) : (
        <div className="space-y-2">
          {items?.map((item, index) => (
            <div
              key={item.id}
              className="flex items-center gap-2 font-mono text-sm group/item"
            >
              <span className="text-muted-foreground w-6">[{index + 1}]</span>
              <span className="flex-1 text-foreground truncate">{item.text}</span>
              <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                <button
                  onClick={() => moveItem(index, "up")}
                  disabled={index === 0}
                  className="p-1 hover:bg-surface-elevated rounded disabled:opacity-30"
                >
                  <ArrowUp className="w-3 h-3 text-muted-foreground" />
                </button>
                <button
                  onClick={() => moveItem(index, "down")}
                  disabled={index === items.length - 1}
                  className="p-1 hover:bg-surface-elevated rounded disabled:opacity-30"
                >
                  <ArrowDown className="w-3 h-3 text-muted-foreground" />
                </button>
                <button
                  onClick={() => deleteItemMutation.mutate(item.id)}
                  className="p-1 hover:bg-destructive/20 rounded"
                >
                  <X className="w-3 h-3 text-destructive" />
                </button>
              </div>
            </div>
          ))}

          {/* Add New Item */}
          <div className="pt-4 mt-4 border-t border-border">
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                placeholder="Add new item..."
                className="flex-1 bg-transparent border-none outline-none font-mono text-sm text-foreground placeholder:text-muted-foreground/50"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newItemText.trim()) {
                    addItemMutation.mutate(newItemText.trim());
                  }
                }}
              />
              {newItemText.trim() && (
                <TextSwapButton
                  defaultText="Add"
                  hoverText="insert()"
                  variant="secondary"
                  size="sm"
                  onClick={() => addItemMutation.mutate(newItemText.trim())}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
