import { motion } from "framer-motion";
import { Vault as VaultIcon, Shield, Loader2 } from "lucide-react";
import { VaultAssetGrid } from "@/components/vault/VaultAssetGrid";
import { VaultLockedState } from "@/components/vault/VaultLockedState";
import { useWhopUser } from "@/hooks/useWhopUser";
import { useAuth } from "@/hooks/useAuth";
import { CornerAccent } from "@/components/decorative/CornerAccent";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

// Configure your Vault Plan ID here
// This is the Whop Plan ID that grants access to The Builder's Vault
const VAULT_PLAN_ID = "plan_Os2m8UuDrE3w5"; // Vault Membership plan
const VAULT_PLAN_NAME = "Builder's Vault Access";

const Vault = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { hasPlan, isLoading: whopLoading, whopUser } = useWhopUser();

  const isLoading = authLoading || whopLoading;
  const hasVaultAccess = hasPlan(VAULT_PLAN_ID);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="font-mono text-sm text-muted-foreground">
            // initializing vault...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center bg-primary/10 border border-primary/30 rounded-sm">
                <VaultIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="font-bold text-lg">The Builder's Vault</h1>
                <p className="font-mono text-xs text-muted-foreground">
                  // exclusive automation assets
                </p>
              </div>
            </Link>

            <div className="flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-2 font-mono text-xs">
                  <Shield size={14} className={hasVaultAccess ? "text-green-400" : "text-muted-foreground"} />
                  <span className={hasVaultAccess ? "text-green-400" : "text-muted-foreground"}>
                    {hasVaultAccess ? "ACCESS_GRANTED" : "ACCESS_RESTRICTED"}
                  </span>
                </div>
              ) : (
                <Button asChild variant="outline" size="sm">
                  <Link to="/auth">Sign In</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-12"
        >
          <div className="relative inline-block">
            <CornerAccent position="tl" size={16} />
            <span className="font-mono text-xs text-primary px-3 py-1">
              // BUILDER_VAULT
            </span>
          </div>

          <h2 className="text-3xl md:text-4xl font-bold mt-4 mb-4">
            Exclusive <span className="text-primary">Automation Assets</span>
          </h2>
          <p className="text-muted-foreground max-w-xl">
            Blueprints, code snippets, and templates to accelerate your automation journey. 
            Members-only access to production-ready assets.
          </p>
        </motion.div>

        {/* Content based on access */}
        {!user ? (
          // Not logged in - show locked state with auth prompt
          <VaultLockedState 
            vaultPlanId={VAULT_PLAN_ID} 
            vaultPlanName={VAULT_PLAN_NAME} 
          />
        ) : hasVaultAccess ? (
          // Has access - show asset grid
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <VaultAssetGrid />
          </motion.div>
        ) : (
          // Logged in but no access - show locked state
          <VaultLockedState 
            vaultPlanId={VAULT_PLAN_ID} 
            vaultPlanName={VAULT_PLAN_NAME} 
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 mt-12">
        <div className="container mx-auto px-6 text-center">
          <p className="font-mono text-xs text-muted-foreground">
            // © {new Date().getFullYear()} Dre Builds • The Builder's Vault
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Vault;
