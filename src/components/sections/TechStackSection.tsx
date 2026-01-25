import { motion } from "framer-motion";
import { DataFlow } from "@/components/decorative/DataFlow";

const springConfig = {
  mass: 1,
  stiffness: 120,
  damping: 14,
};

const tools = [
  {
    name: "Make.com",
    description: "Visual automation platform",
    category: "Orchestration",
  },
  {
    name: "Replit",
    description: "Cloud development environment",
    category: "Development",
  },
  {
    name: "Cursor",
    description: "AI-powered code editor",
    category: "Development",
  },
  {
    name: "OpenAI",
    description: "GPT models & embeddings",
    category: "AI/ML",
  },
  {
    name: "Supabase",
    description: "Backend infrastructure",
    category: "Database",
  },
  {
    name: "n8n",
    description: "Workflow automation",
    category: "Orchestration",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring" as const, ...springConfig },
  },
};

export const TechStackSection = () => {
  return (
    <section className="relative py-24 md:py-32">
      <div className="container mx-auto px-6 max-w-5xl">
        {/* Section Label */}
        <motion.div
          className="section-label mb-4"
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          // TECH_STACK
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
            The Builder's <span className="text-primary">Toolkit</span>
          </h2>
          <p className="text-muted-foreground max-w-xl">
            A curated stack of tools that power intelligent automation systems.
          </p>
        </motion.div>

        {/* Tools Grid */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {tools.map((tool, index) => (
            <motion.div
              key={tool.name}
              variants={itemVariants}
              className="group relative"
            >
              <div className="relative p-6 bg-card border border-border rounded-sm overflow-hidden transition-all duration-300 hover:border-primary/50 hover:bg-surface-elevated">
                {/* Category Badge */}
                <div className="absolute top-3 right-3">
                  <span className="font-mono text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary/70 rounded-sm uppercase">
                    {tool.category}
                  </span>
                </div>

                {/* Tool Name */}
                <h3 className="font-mono text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                  {tool.name}
                </h3>
                
                {/* Description */}
                <p className="text-sm text-muted-foreground">
                  {tool.description}
                </p>

                {/* Hover Arrow */}
                <motion.div
                  className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
                  initial={false}
                >
                  <DataFlow className="w-6 h-6" />
                </motion.div>
              </div>

              {/* Connector to next item */}
              {index < tools.length - 1 && index % 3 !== 2 && (
                <div className="hidden md:block absolute top-1/2 -right-3 -translate-y-1/2 z-10">
                  <DataFlow className="text-primary/30" />
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* Flow Visualization */}
        <motion.div
          className="mt-12 flex items-center justify-center gap-4 text-muted-foreground"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          <span className="font-mono text-sm">Input</span>
          <DataFlow />
          <span className="font-mono text-sm text-primary">Process</span>
          <DataFlow />
          <span className="font-mono text-sm">Output</span>
        </motion.div>
      </div>
    </section>
  );
};
