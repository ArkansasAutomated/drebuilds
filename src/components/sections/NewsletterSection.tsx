import { motion } from "framer-motion";
import { NewsletterCapture } from "@/components/newsletter/NewsletterCapture";

const springConfig = {
  mass: 1,
  stiffness: 120,
  damping: 14,
};

/**
 * Landing-page newsletter section. Renders the full NewsletterCapture
 * variant (name + email, terminal aesthetic) wired to the hub list
 * (drebuilds_main). The actual form/validation/DB logic lives in the
 * capture component + useNewsletterSubscription — this file only owns
 * the section chrome and copy.
 */
export const NewsletterSection = () => {
  return (
    <section className="relative py-24 md:py-32 bg-surface-elevated/30">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-grid opacity-30" />

      <div className="container mx-auto px-6 max-w-3xl relative z-10">
        {/* Section Label */}
        <motion.div
          className="section-label mb-4"
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          // ALPHA_CHANNEL
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ type: "spring", ...springConfig }}
        >
          <NewsletterCapture
            variant="full"
            listSlug="drebuilds_main"
            source="landing_page"
            title={
              <>
                Test the <span className="text-primary glow-amber">Waters</span>
              </>
            }
            subtitle="Get exclusive builds, automation breakdowns, and early access to new systems. No spam, just signal."
            successMessage="Welcome to the build log. Check your inbox."
          />
        </motion.div>
      </div>
    </section>
  );
};