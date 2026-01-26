import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { TextSwapButton } from "@/components/ui/TextSwapButton";
import { CornerAccent } from "@/components/decorative/CornerAccent";
import { Cpu, Users, Package, Video, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useWhopProducts } from "@/hooks/useWhopProducts";
import { Button } from "@/components/ui/button";

const springConfig = {
  mass: 1,
  stiffness: 120,
  damping: 14,
};

// Mapping of offer IDs to Whop plan IDs (configure these based on your Whop plans)
const offerToPlanMapping: Record<string, string> = {
  consulting: "", // Add Whop plan ID for consulting
  community: "", // Add Whop plan ID for community
  store: "", // Add Whop plan ID for store
  learn: "", // Add Whop plan ID for learn
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
    link: "https://cal.com/drebuilds",
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
    link: "https://whop.com/drebuilds/",
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
    link: "https://whop.com/drebuilds/",
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
    link: "https://youtube.com/@drebuilds",
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
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  
  // Fetch Whop plans
  const { plans: whopPlans, isLoading: whopLoading, createCheckout, isCheckoutLoading } = useWhopProducts();
  
  // Fetch local offer settings
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

  // Merge Whop plans with local offers
  const offers = defaultOffers.map((defaultOffer) => {
    const dbOffer = dbOffers?.find((o) => o.id === defaultOffer.id);
    const whopPlanId = offerToPlanMapping[defaultOffer.id];
    const whopPlan = whopPlans.find((p) => p.id === whopPlanId);
    
    // Prioritize Whop API data, then DB data, then defaults
    return {
      ...defaultOffer,
      title: dbOffer?.title || defaultOffer.title,
      description: whopPlan?.description || dbOffer?.description || defaultOffer.description,
      price: whopPlan ? `$${whopPlan.price}` : (dbOffer?.price || defaultOffer.price),
      icon: iconMap[defaultOffer.id] || Cpu,
      whopPlanId: whopPlanId || null,
      link: dbOffer?.link || defaultOffer.link,
    };
  });

  const handleOfferClick = async (offer: typeof offers[0]) => {
    // If there's a Whop plan ID, create checkout session
    if (offer.whopPlanId) {
      setLoadingPlanId(offer.id);
      try {
        await createCheckout(offer.whopPlanId);
      } catch (error) {
        console.error("Checkout error:", error);
      } finally {
        setLoadingPlanId(null);
      }
    } else if (offer.link) {
      // Fallback to static link
      window.open(offer.link, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <section id="logic-gates" className="relative py-24 md:py-32">
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
                  {loadingPlanId === offer.id || (isCheckoutLoading && loadingPlanId === offer.id) ? (
                    <Button variant="secondary" size="sm" disabled className="gap-2">
                      <Loader2 size={14} className="animate-spin" />
                      Processing...
                    </Button>
                  ) : (
                    <TextSwapButton
                      defaultText={offer.defaultCTA}
                      hoverText={offer.hoverCTA}
                      variant="secondary"
                      size="sm"
                      trackingId={offer.id}
                      onClick={() => handleOfferClick(offer)}
                    />
                  )}
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
