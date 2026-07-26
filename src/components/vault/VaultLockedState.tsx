import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Lock, Terminal } from "lucide-react";
import { CornerAccent } from "@/components/decorative/CornerAccent";
import { BlinkingCursor } from "@/components/ui/BlinkingCursor";

export const VaultLockedState = ({ vaultPlanName = "Admin Vault Access" }: { vaultPlanName?: string }) => (
  <div className="relative flex min-h-[60vh] items-center justify-center">
    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10 mx-4 w-full max-w-md border border-border bg-card">
      <CornerAccent position="tl" size={24} />
      <CornerAccent position="br" size={24} />
      <div className="flex items-center gap-2 border-b border-border bg-surface-elevated px-4 py-2">
        <Terminal size={14} className="text-primary" /><span className="font-mono text-xs text-muted-foreground">vault.access</span>
      </div>
      <div className="p-8 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center border border-primary/30 bg-primary/10"><Lock className="text-primary" /></div>
        <div className="mb-6 border border-border bg-background/50 p-4 text-left font-mono text-sm">
          <p className="text-primary">&gt; ACCESS_RESTRICTED<BlinkingCursor /></p>
          <p className="mt-2 text-xs text-muted-foreground">// role required: {vaultPlanName}</p>
        </div>
        <p className="mb-6 text-sm text-muted-foreground">The Builder’s Vault is currently restricted to approved administrators while the access model is rebuilt.</p>
        <Link to="/auth" className="inline-flex w-full justify-center bg-primary px-5 py-3 font-mono font-bold text-primary-foreground">Sign In</Link>
      </div>
    </motion.div>
  </div>
);
