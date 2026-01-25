import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Twitter, Youtube, Github } from "lucide-react";
import logoPrimary from "@/assets/brand/dre-builds-logo-primary-transparent.svg";

const springConfig = {
  mass: 1,
  stiffness: 120,
  damping: 14,
};

const navLinks = [
  { path: "~/home", label: "Home", href: "/" },
  { path: "~/consulting", label: "Consulting", href: "#consulting" },
  { path: "~/community", label: "Community", href: "#community" },
  { path: "~/store", label: "Store", href: "#store" },
];

const socialLinks = [
  { name: "Twitter", icon: Twitter, href: "https://twitter.com/drebuilds", hoverText: "@drebuilds --follow" },
  { name: "YouTube", icon: Youtube, href: "https://youtube.com/@drebuilds", hoverText: "youtube --subscribe" },
  { name: "GitHub", icon: Github, href: "https://github.com/drebuilds", hoverText: "gh follow drebuilds" },
];

export const FooterSection = () => {
  const [hoveredSocial, setHoveredSocial] = useState<string | null>(null);

  return (
    <footer className="relative py-16 md:py-24 border-t border-border">
      {/* Background */}
      <div className="absolute inset-0 bg-grid opacity-20" />
      
      <div className="container mx-auto px-6 max-w-6xl relative z-10">
        {/* Section Label */}
        <motion.div
          className="section-label mb-8"
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          // ROOT_DIRECTORY
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          {/* Logo & Tagline */}
          <motion.div
            className="md:col-span-1"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ type: "spring", ...springConfig }}
          >
            <img
              src={logoPrimary}
              alt="Dre Builds"
              className="h-10 mb-4"
            />
            <p className="text-muted-foreground text-sm mb-4">
              Building intelligent systems that scale.
            </p>
            <p className="font-mono text-xs text-primary/60">
              Built with love & automation
            </p>
          </motion.div>

          {/* Navigation */}
          <motion.div
            className="md:col-span-1"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ type: "spring", ...springConfig, delay: 0.1 }}
          >
            <h3 className="font-mono text-sm text-muted-foreground mb-4">
              $ ls ./
            </h3>
            <nav className="space-y-3">
              {navLinks.map((link) => (
                <a
                  key={link.path}
                  href={link.href}
                  className="group flex items-center gap-2 text-sm hover:text-primary transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-primary/60 group-hover:text-primary transition-colors" />
                  <span className="font-mono">{link.path}</span>
                </a>
              ))}
            </nav>
          </motion.div>

          {/* Social Links */}
          <motion.div
            className="md:col-span-1"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ type: "spring", ...springConfig, delay: 0.2 }}
          >
            <h3 className="font-mono text-sm text-muted-foreground mb-4">
              $ whoami --socials
            </h3>
            <div className="space-y-3">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 text-sm hover:text-primary transition-colors"
                  onMouseEnter={() => setHoveredSocial(social.name)}
                  onMouseLeave={() => setHoveredSocial(null)}
                >
                  <social.icon className="w-5 h-5" />
                  <div className="relative h-5 overflow-hidden">
                    <AnimatePresence mode="wait">
                      {hoveredSocial !== social.name ? (
                        <motion.span
                          key="name"
                          initial={{ y: 0 }}
                          exit={{ y: -20, opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="block"
                        >
                          @DreBuilds
                        </motion.span>
                      ) : (
                        <motion.span
                          key="hover"
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: 20, opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="block font-mono text-xs text-primary"
                        >
                          {social.hoverText}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                </a>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <motion.div
          className="mt-16 pt-8 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          <p className="font-mono text-xs text-muted-foreground">
            © {new Date().getFullYear()} Dre Builds. All rights reserved.
          </p>
          <p className="font-mono text-xs text-muted-foreground">
            <span className="text-primary">&gt;_</span> exit 0
          </p>
        </motion.div>
      </div>
    </footer>
  );
};
