import { motion } from "framer-motion";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { CommandCenterLayout } from "@/components/admin/CommandCenterLayout";
import { SubscriberPanel } from "@/components/admin/SubscriberPanel";
import { ClickTrackingPanel } from "@/components/admin/ClickTrackingPanel";
import { SubscribersLog } from "@/components/admin/SubscribersLog";
import { NewsletterListsPanel } from "@/components/admin/NewsletterListsPanel";
import { ContentEditor } from "@/components/admin/ContentEditor";
import { OfferEditor } from "@/components/admin/OfferEditor";
import { TelemetryPanel } from "@/components/admin/TelemetryPanel";
import { QuickStatCard } from "@/components/admin/QuickStatCard";
import { ConversionFunnel } from "@/components/admin/ConversionFunnel";
import { LiveEventLog } from "@/components/admin/LiveEventLog";
import { AuditLeadsPanel } from "@/components/admin/AuditLeadsPanel";
import { SourceAnalyticsPanel } from "@/components/admin/SourceAnalyticsPanel";
import { useSubscriberStats, useClickStats } from "@/hooks/useAdminStats";
import { useAdminRealtime } from "@/hooks/useAdminRealtime";
import { Users, MousePointer, Zap } from "lucide-react";

const springConfig = {
  mass: 1,
  stiffness: 120,
  damping: 14,
};

const AdminDashboard = () => {
  const { data: subscriberStats } = useSubscriberStats();
  const { data: clickStats } = useClickStats();
  const { realtimeEvents } = useAdminRealtime();

  const totalClicks = clickStats?.reduce((sum, stat) => sum + stat.clicks, 0) || 0;

  return (
    <CommandCenterLayout>
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Row 1: Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickStatCard
            label="Subscribers"
            value={subscriberStats?.total || 0}
            trend={subscriberStats?.growthPercent ? `${subscriberStats.growthPercent > 0 ? '+' : ''}${subscriberStats.growthPercent}%` : undefined}
            icon={<Users size={18} />}
          />
          <QuickStatCard
            label="Today's Signups"
            value={subscriberStats?.today || 0}
            icon={<Zap size={18} />}
          />
          <QuickStatCard
            label="Total Clicks"
            value={totalClicks}
            icon={<MousePointer size={18} />}
          />
        </div>

        {/* Row 2: Conversion Pipeline & Live Events */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <LiveEventLog realtimeEvents={realtimeEvents} />
          </div>
        </div>

        {/* Row 3: Conversion Funnel */}
        <ConversionFunnel />

        {/* Row 3: Analytics Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SubscriberPanel />
          <TelemetryPanel />
        </div>

        {/* Row 4: Click Tracking */}
        <ClickTrackingPanel />

        {/* Row 5: Subscribers Log (legacy) */}
        <SubscribersLog />

        {/* Row 5b: Newsletter Lists (hub + spokes) */}
        <NewsletterListsPanel />

        {/* Row 6: Content Management */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ContentEditor />
          <OfferEditor />
        </div>

        {/* Row 7: Audit Leads Funnel */}
        <AuditLeadsPanel />

        {/* Row 8: Source Analytics (UTM / referrer attribution) */}
        <SourceAnalyticsPanel />
      </motion.div>
    </CommandCenterLayout>
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
