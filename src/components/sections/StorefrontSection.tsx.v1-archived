import { motion } from "framer-motion";
import { CornerAccent } from "@/components/decorative/CornerAccent";
import { Terminal, Bot, Mail, ArrowUpRight } from "lucide-react";

const springConfig = {
  mass: 1,
  stiffness: 120,
  damping: 14,
};

const PRODUCTS = [
  {
    icon: Terminal,
    name: "Zero-Cost Local OS",
    price: "$79",
    cadence: "one-time",
    tagline:
      "The exact blueprint for running an autonomous AI operation on one 16GB Mac at $0/month in API fees.",
    features: [
      "Model routing doctrine",
      "MLX production setup on Apple Silicon",
      "Closed-loop agent architecture",
      "Experience flywheel: trajectories → LoRA → skill",
    ],
    href: "https://whop.com/checkout/plan_8AAJehNzeYpvA",
  },
  {
    icon: Mail,
    name: "Cold Email Automation Fleet",
    price: "$149",
    cadence: "one-time",
    tagline:
      "The programmatic multi-agent lead-gen pipeline: scrape, qualify, personalize, send, triage.",
    features: [
      "Multi-agent pipeline reference implementation",
      "Local-model personalization at scale",
      "Warmup schedules + deliverability playbook",
      "CAN-SPAM-honest copy standards built in",
    ],
    href: "https://whop.com/checkout/plan_Oy3G7odqQ3H6s",
  },
  {
    icon: Bot,
    name: "Local Business AI Concierge",
    price: "$197",
    cadence: "/month · founder tier",
    tagline:
      "An inbound agent that qualifies leads and books appointments while you sleep.",
    features: [
      "Answers every lead in seconds, 24/7",
      "Qualifies against your criteria",
      "Books straight to your calendar",
      "Nightly qualification report",
    ],
    href: "https://whop.com/checkout/plan_lqXy6pTVMyJUS",
  },
];

export const StorefrontSection = () => {
  return (
    <section className="relative py-24 md:py-32">
      <div className="absolute inset-0 bg-grid opacity-20" />

      <div className="container mx-auto px-6 max-w-6xl relative z-10">
        <motion.div
          className="section-label mb-4"
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          // STOREFRONT_CHANNEL
        </motion.div>

        <motion.h2
          className="text-3xl md:text-5xl font-bold tracking-tight mb-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.05 }}
        >
          Deploy the stack yourself
        </motion.h2>

        <motion.p
          className="text-muted-foreground max-w-2xl mb-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          The same systems running this operation — packaged, documented,
          and fulfilled instantly. No calls, no demos, no waiting.
        </motion.p>

        <div className="grid gap-6 md:grid-cols-3">
          {PRODUCTS.map((p, i) => (
            <motion.a
              key={p.name}
              href={p.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex flex-col p-8 bg-card border border-border rounded-sm hover:border-primary/60 transition-colors"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ type: "spring", ...springConfig, delay: i * 0.08 }}
            >
              <CornerAccent position="tl" size={22} />
              <CornerAccent position="br" size={22} />

              <div className="flex items-center justify-between mb-6">
                <p.icon className="w-8 h-8 text-primary" strokeWidth={1.5} />
                <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>

              <h3 className="text-lg font-semibold leading-snug mb-2">
                {p.name}
              </h3>
              <p className="text-sm text-muted-foreground mb-5">{p.tagline}</p>

              <ul className="space-y-2 mb-8">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <span className="text-primary mt-0.5">›</span>
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-4 border-t border-border flex items-baseline gap-2">
                <span className="text-3xl font-bold tracking-tight">
                  {p.price}
                </span>
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  {p.cadence}
                </span>
              </div>
            </motion.a>
          ))}
        </div>

        <motion.p
          className="text-xs text-muted-foreground mt-8 font-mono"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          $ instant delivery via Whop :: 30-day guarantee on one-time products ::
          cancel anytime on subscriptions
        </motion.p>
      </div>
    </section>
  );
};
