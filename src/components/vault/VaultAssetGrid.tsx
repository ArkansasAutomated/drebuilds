import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { VaultAssetCard } from "./VaultAssetCard";
import { Skeleton } from "@/components/ui/skeleton";
import { FileCode, FileText, Package, AlertCircle } from "lucide-react";

interface VaultAsset {
  id: string;
  title: string;
  description: string | null;
  category: string;
  file_url: string;
  file_type: string | null;
  display_order: number;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const categoryFilters = [
  { id: "all", label: "All Assets", icon: Package },
  { id: "blueprint", label: "Blueprints", icon: FileText },
  { id: "code", label: "Code Snippets", icon: FileCode },
  { id: "template", label: "Templates", icon: Package },
];

export const VaultAssetGrid = () => {
  const { data: assets, isLoading, error } = useQuery({
    queryKey: ["vault-assets"],
    queryFn: async (): Promise<VaultAsset[]> => {
      const { data, error } = await supabase
        .from("vault_assets")
        .select("id, title, description, category, file_url, file_type, display_order")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-sm" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <p className="text-muted-foreground font-mono text-sm">
          // error: failed to load assets
        </p>
      </div>
    );
  }

  if (!assets || assets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Package className="w-12 h-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground font-mono text-sm">
          // vault is empty - assets coming soon
        </p>
      </div>
    );
  }

  // Group assets by category
  const groupedAssets = assets.reduce((acc, asset) => {
    if (!acc[asset.category]) {
      acc[asset.category] = [];
    }
    acc[asset.category].push(asset);
    return acc;
  }, {} as Record<string, VaultAsset[]>);

  return (
    <div className="space-y-8">
      {/* Stats bar */}
      <div className="flex items-center gap-6 font-mono text-xs text-muted-foreground border-b border-border pb-4">
        <span className="text-primary">{assets.length} assets</span>
        <span>•</span>
        <span>{groupedAssets["blueprint"]?.length || 0} blueprints</span>
        <span>•</span>
        <span>{groupedAssets["code"]?.length || 0} code snippets</span>
        <span>•</span>
        <span>{groupedAssets["template"]?.length || 0} templates</span>
      </div>

      {/* Asset Grid */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {assets.map((asset) => (
          <VaultAssetCard key={asset.id} asset={asset} />
        ))}
      </motion.div>
    </div>
  );
};
