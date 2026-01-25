import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { TextSwapButton } from "@/components/ui/TextSwapButton";
import { CornerAccent } from "@/components/decorative/CornerAccent";
import { Cpu, Users, Package, Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const springConfig = {
  mass: 1,
  stiffness: 120,
  damping: 14,
};

const defaultOffers = [
  {
    id: "consulting",
    title: "Business Systems Architecture",
    description: "Custom automation frameworks designed for your unique business logic. From workflow mapping to full implementation.",
    icon: Cpu,
    price: "$500",
    defaultCTA: "Book Architecture Session",
    hoverCTA: "initialize_consult()",
    accent: "Consulting",
  },
  {
    id: "community",
    title: "Agentic Engineering Hub",
    description: "Join a community of builders creating the next generation of intelligent automation systems.",
    icon: Users,
    price: "Free",
    defaultCTA: "Join the Builders",
    hoverCTA: "git clone community",
    accent: "Community",
  },
  {
    id: "store",
    title: "Plug-and-Play Logic",
    description: "Pre-built automation templates and digital products ready to deploy in your workflow stack.",
    icon: Package,
    price: "From $29",
    defaultCTA: "Enter Store",
    hoverCTA: "cat ./inventory",
    accent: "Store",
  },
  {
    id: "learn",
    title: "Content & Education",
    description: "Deep-dive tutorials, raw code sessions, and weekly automation breakdowns to level up your skills.",
    icon: Video,
    price: "Free",
    defaultCTA: "Learn Automation",
    hoverCTA: "man automation",
    accent: "Learn",
  },
];

const iconMap: Record<string, typeof Cpu> = {
  consulting: Cpu,
  community: Users,
  store: Package,
  learn: Video,
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, ...springConfig },
  },
};

export const LogicGatesSection = () => {
  const { data: dbOffers } = useQuery({
    queryKey: ["offer-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("offer_settings")
        .select("*")
        .eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  const offers = defaultOffers.map((defaultOffer) => {
    const dbOffer = dbOffers?.find((o) => o.id === defaultOffer.id);
    return {
      ...defaultOffer,
      title: dbOffer?.title || defaultOffer.title,
      description: dbOffer?.description || defaultOffer.description,
      price: dbOffer?.price || defaultOffer.price,
      icon: iconMap[defaultOffer.id] || Cpu,
    };
  });

  return (
    <section className="relative py-24 md:py-32">
      <div className="container mx-auto px-6 max-w-6xl">
        <motion.div
          className="section-label mb-4"
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          // LOGIC_GATES
        </motion.div>

        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ type: "spring", ...springConfig }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Four Ways to <span className="text-primary">Build With Dre</span>
          </h2>
          <p className="text-muted-foreground max-w-xl">
            Choose your entry point into the world of agentic engineering.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {offers.map((offer) => (
            <motion.div
              key={offer.id}
              variants={cardVariants}
              className="relative group"
            >
              <div className="relative h-full p-8 bg-card border border-border rounded-sm overflow-hidden transition-all duration-300 hover:border-primary/50 hover:glow-amber-box">
                <CornerAccent position="tl" size={20} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                <CornerAccent position="br" size={20} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="absolute top-4 right-4">
                  <span className="font-mono text-xs px-2 py-1 bg-primary/10 text-primary rounded-sm">
                    {offer.accent}
                  </span>
                </div>

                <div className="mb-6">
                  <div className="w-12 h-12 flex items-center justify-center bg-surface-elevated rounded-sm border border-border group-hover:border-primary/50 transition-colors">
                    <offer.icon className="w-6 h-6 text-primary" />
                  </div>
                </div>

                <h3 className="text-xl font-semibold mb-3">{offer.title}</h3>
                <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                  {offer.description}
                </p>

                <div className="flex items-center justify-between">
                  <span className="font-mono text-lg text-primary">{offer.price}</span>
                  <TextSwapButton
                    defaultText={offer.defaultCTA}
                    hoverText={offer.hoverCTA}
                    variant="secondary"
                    size="sm"
                    trackingId={offer.id}
                  />
                </div>

                <div className="absolute -bottom-4 -right-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <offer.icon className="w-32 h-32" />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
