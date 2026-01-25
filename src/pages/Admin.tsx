import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { SystemStatusPanel } from "@/components/admin/SystemStatusPanel";
import { SubscriberPanel } from "@/components/admin/SubscriberPanel";
import { ClickTrackingPanel } from "@/components/admin/ClickTrackingPanel";
import { ContentEditor } from "@/components/admin/ContentEditor";
import { OfferEditor } from "@/components/admin/OfferEditor";
import { TextSwapButton } from "@/components/ui/TextSwapButton";
import { ArrowLeft, LogOut } from "lucide-react";

const AdminDashboard = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-mono text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>&gt; cd ..</span>
          </button>

          <TextSwapButton
            defaultText="Sign Out"
            hoverText="auth.signOut()"
            variant="outline"
            size="sm"
            icon={<LogOut className="w-4 h-4" />}
            onClick={handleSignOut}
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 max-w-6xl">
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {/* System Status */}
          <SystemStatusPanel />

          {/* Analytics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SubscriberPanel />
            <ClickTrackingPanel />
          </div>

          {/* Content Management Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ContentEditor />
            <OfferEditor />
          </div>
        </motion.div>
      </main>
    </div>
  );
};

const Admin = () => {
  return (
    <ProtectedRoute requireAdmin>
      <AdminDashboard />
    </ProtectedRoute>
  );
};

export default Admin;
