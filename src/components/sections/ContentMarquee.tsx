import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { NodeConnection } from "@/components/decorative/NodeConnection";
import { supabase } from "@/integrations/supabase/client";

const defaultContentItems = [
  "Real-time Builds",
  "Weekly Automation Breakdowns",
  "Raw Code Sessions",
  "AI Strategy Deep-Dives",
  "System Architecture Reviews",
  "Agentic Workflow Tutorials",
];

export const ContentMarquee = () => {
  // Fetch dynamic content from database
  const { data: dbItems } = useQuery({
    queryKey: ["content-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_items")
        .select("text")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data?.map(item => item.text) || [];
    },
  });

  const contentItems = dbItems && dbItems.length > 0 ? dbItems : defaultContentItems;

  // Double the content for seamless loop
  const doubledContent = [...contentItems, ...contentItems];

  return (
    <section className="relative py-16 overflow-hidden border-y border-border/50">
      {/* Background */}
      <div className="absolute inset-0 bg-surface-elevated/50" />
      
      {/* Section Label */}
      <motion.div
        className="container mx-auto px-6 mb-8"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <span className="section-label">// CURRENT_CONTENT_STREAM</span>
      </motion.div>

      {/* Marquee Container */}
      <div className="relative">
        {/* Gradient Masks */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-background to-transparent z-10" />

        {/* Marquee Track */}
        <motion.div
          className="flex items-center gap-8 animate-marquee hover:[animation-play-state:paused]"
          style={{ width: "fit-content" }}
        >
          {doubledContent.map((item, index) => (
            <div key={index} className="flex items-center gap-8 shrink-0">
              <span className="font-mono text-lg md:text-xl text-foreground whitespace-nowrap hover:text-primary transition-colors cursor-default">
                {item}
              </span>
              <NodeConnection className="shrink-0" />
            </div>
          ))}
        </motion.div>
      </div>

      {/* Decorative Line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
    </section>
  );
};
