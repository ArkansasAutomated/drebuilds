import { motion } from "framer-motion";
import { Cpu, Users, Package, Video } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CornerAccent } from "@/components/decorative/CornerAccent";
import { TextSwapButton } from "@/components/ui/TextSwapButton";

const defaults = [
  { id: "consulting", title: "Automation Consulting", description: "Map the repetitive work, design the system, and implement automations around your real operations.", price: "Free audit", icon: Cpu, cta: "Get Your Free Audit", link: "/audit", external: false },
  { id: "community", title: "Builder Community", description: "The next community home is being evaluated. Join the newsletter and be first to know when it opens.", price: "Coming soon", icon: Users, cta: "Join the Newsletter", link: "#newsletter", external: false },
  { id: "store", title: "Automation Templates", description: "Production-ready templates are being rebuilt. Join the list for the first release.", price: "Coming soon", icon: Package, cta: "Get Updates", link: "#newsletter", external: false },
  { id: "learn", title: "Content & Education", description: "Practical tutorials, raw build sessions, and automation breakdowns for operators and builders.", price: "Free", icon: Video, cta: "Learn Automation", link: "https://youtube.com/@drebuilds", external: true },
];

export const LogicGatesSection = () => {
  const { data } = useQuery({
    queryKey: ["offer-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("offer_settings").select("*").eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  const offers = defaults.map((offer) => {
    const configured = data?.find((item) => item.id === offer.id);
    const unsafeLegacyLink = configured?.link?.startsWith("/");
    return {
      ...offer,
      title: configured?.title || offer.title,
      description: configured?.description || offer.description,
      price: configured?.price || offer.price,
      link: !unsafeLegacyLink && configured?.link ? configured.link : offer.link,
    };
  });

  const open = (link: string, external: boolean) => {
    if (link.startsWith("#")) return document.querySelector(link)?.scrollIntoView({ behavior: "smooth" });
    if (external) window.open(link, "_blank", "noopener,noreferrer");
    else window.location.assign(link);
  };

  return (
    <section id="logic-gates" className="relative py-24 md:py-32">
      <div className="container mx-auto max-w-6xl px-6">
        <div className="mb-12 max-w-2xl">
          <h2 className="text-3xl font-bold md:text-5xl">Choose the next <span className="text-primary">operation.</span></h2>
          <p className="mt-4 text-muted-foreground">Start with a free audit, then build only what removes real work from your week.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {offers.map((offer, index) => (
            <motion.article key={offer.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.08 }} className="relative border border-border bg-card p-7">
              <CornerAccent position="tl" size={18} />
              <offer.icon className="mb-6 text-primary" />
              <p className="font-mono text-xs text-primary">// {offer.price}</p>
              <h3 className="mt-2 text-xl font-bold">{offer.title}</h3>
              <p className="my-5 min-h-12 text-sm leading-relaxed text-muted-foreground">{offer.description}</p>
              <TextSwapButton defaultText={offer.cta} hoverText={`run ${offer.id}()`} variant={index === 0 ? "primary" : "outline"} size="md" onClick={() => open(offer.link, offer.external)} />
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};
