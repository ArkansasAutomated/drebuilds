import { motion } from "framer-motion";
import { TerminalPrompt } from "@/components/ui/TerminalPrompt";
import { NodeConnection } from "@/components/decorative/NodeConnection";

const springConfig = {
  mass: 1,
  stiffness: 120,
  damping: 14,
};

const testimonials = [
  {
    id: 1,
    quote: "Dre's architecture transformed our entire operations workflow. What took us weeks now happens in hours.",
    author: "Sarah Chen",
    role: "CTO",
    company: "TechFlow Inc",
    timestamp: "2024-01-15T10:23:00Z",
  },
  {
    id: 2,
    quote: "The community is incredible. Real builders solving real problems. No fluff, just execution.",
    author: "Marcus Johnson",
    role: "Automation Lead",
    company: "ScaleUp Labs",
    timestamp: "2024-02-08T14:45:00Z",
  },
  {
    id: 3,
    quote: "Finally someone who understands that automation isn't about replacing humans—it's about empowering them.",
    author: "Elena Rodriguez",
    role: "Founder",
    company: "Agentic Works",
    timestamp: "2024-03-02T09:12:00Z",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: "spring" as const, ...springConfig },
  },
};

export const TestimonialsSection = () => {
  return (
    <section className="relative py-24 md:py-32">
      <div className="container mx-auto px-6 max-w-4xl">
        {/* Section Label */}
        <motion.div
          className="section-label mb-4"
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          // SYSTEM_LOGS
        </motion.div>

        {/* Section Header */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ type: "spring", ...springConfig }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Verified <span className="text-primary">User Feedback</span>
          </h2>
          <p className="text-muted-foreground">
            Real signals from the community.
          </p>
        </motion.div>

        {/* Testimonials as Terminal Logs */}
        <motion.div
          className="relative"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {/* Vertical Line */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-primary/50 via-primary/20 to-transparent" />

          <div className="space-y-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.id}
                variants={itemVariants}
                className="relative pl-12"
              >
                {/* Node Connection Point */}
                <div className="absolute left-0 top-6">
                  <div className="w-8 h-8 flex items-center justify-center">
                    <div className="w-3 h-3 bg-primary rounded-full glow-amber" />
                  </div>
                </div>

                {/* Log Entry */}
                <div className="p-6 bg-card border border-border rounded-sm hover:border-primary/30 transition-colors">
                  {/* Timestamp Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <TerminalPrompt />
                    <span className="font-mono text-xs text-muted-foreground">
                      [LOG] {new Date(testimonial.timestamp).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Quote */}
                  <blockquote className="text-lg mb-4 leading-relaxed">
                    "{testimonial.quote}"
                  </blockquote>

                  {/* Author Info */}
                  <div className="font-mono text-sm">
                    <span className="text-primary">{testimonial.author}</span>
                    <span className="text-muted-foreground"> // {testimonial.role} @ </span>
                    <span className="text-foreground">{testimonial.company}</span>
                  </div>
                </div>

                {/* Connector to next */}
                {index < testimonials.length - 1 && (
                  <div className="absolute left-0 top-full flex justify-center w-8 py-2">
                    <NodeConnection vertical className="h-8" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
