import { motion } from "framer-motion";
import { Lock, Terminal, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CornerAccent } from "@/components/decorative/CornerAccent";
import { BlinkingCursor } from "@/components/ui/BlinkingCursor";
import { useWhopProducts } from "@/hooks/useWhopProducts";
import { useWhopUser } from "@/hooks/useWhopUser";

interface VaultLockedStateProps {
  vaultPlanId?: string;
  vaultPlanName?: string;
}

export const VaultLockedState = ({ 
  vaultPlanId, 
  vaultPlanName = "Builder's Vault Access" 
}: VaultLockedStateProps) => {
  const { createCheckout, isCheckoutLoading } = useWhopProducts();
  const { initiateWhopOAuth } = useWhopUser();

  const handleUpgrade = async () => {
    if (vaultPlanId) {
      try {
        await createCheckout(vaultPlanId);
      } catch (error) {
        console.error("Checkout error:", error);
        // Fallback to OAuth if checkout fails
        initiateWhopOAuth();
      }
    } else {
      // No specific plan - initiate OAuth flow
      initiateWhopOAuth();
    }
  };

  return (
    <div className="relative min-h-[60vh] flex items-center justify-center">
      {/* Blurred background teaser */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 opacity-20 blur-sm pointer-events-none p-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-48 bg-card border border-border rounded-sm"
            />
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
      </div>

      {/* Lock Overlay */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 max-w-md w-full mx-4"
      >
        <div className="relative bg-card border border-border rounded-sm overflow-hidden">
          <CornerAccent position="tl" size={24} />
          <CornerAccent position="tr" size={24} />
          <CornerAccent position="bl" size={24} />
          <CornerAccent position="br" size={24} />

          {/* Terminal Header */}
          <div className="bg-surface-elevated border-b border-border px-4 py-2 flex items-center gap-2">
            <Terminal size={14} className="text-primary" />
            <span className="font-mono text-xs text-muted-foreground">vault.access</span>
            <div className="ml-auto flex gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500/50" />
              <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
              <div className="w-2 h-2 rounded-full bg-green-500/50" />
            </div>
          </div>

          {/* Content */}
          <div className="p-8 text-center">
            {/* Lock Icon */}
            <motion.div
              initial={{ y: -10 }}
              animate={{ y: 0 }}
              transition={{ repeat: Infinity, repeatType: "reverse", duration: 2 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border border-primary/30 mb-6"
            >
              <Lock className="w-8 h-8 text-primary" />
            </motion.div>

            {/* Terminal Message */}
            <div className="font-mono text-left bg-background/50 rounded-sm p-4 mb-6 border border-border">
              <div className="text-primary text-sm mb-2">
                &gt; ACCESS_RESTRICTED
                <BlinkingCursor />
              </div>
              <div className="text-muted-foreground text-xs leading-relaxed">
                <p className="mb-2">// authentication required</p>
                <p className="mb-2">// membership tier: <span className="text-cyan-400">{vaultPlanName}</span></p>
                <p>// status: <span className="text-red-400">LOCKED</span></p>
              </div>
            </div>

            {/* Description */}
            <p className="text-muted-foreground text-sm mb-6">
              Upgrade to <span className="text-primary font-semibold">{vaultPlanName}</span> to unlock exclusive access to automation blueprints, code snippets, and templates.
            </p>

            {/* CTA Button */}
            <Button
              onClick={handleUpgrade}
              disabled={isCheckoutLoading}
              className="w-full font-mono gap-2"
              size="lg"
            >
              <Zap size={16} />
              {isCheckoutLoading ? "Processing..." : "Upgrade Now"}
            </Button>

            {/* Footer hint */}
            <p className="text-muted-foreground/60 text-xs mt-4 font-mono">
              // instant access after payment
            </p>
          </div>

          {/* Decorative glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
          </div>
        </div>
      </motion.div>
    </div>
  );
};
