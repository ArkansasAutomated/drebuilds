import { motion } from "framer-motion";
import { Download, FileCode, FileText, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CornerAccent } from "@/components/decorative/CornerAccent";
import { useTelemetry } from "@/hooks/useTelemetry";

interface VaultAsset {
  id: string;
  title: string;
  description: string | null;
  category: string;
  file_url: string;
  file_type: string | null;
  display_order: number;
}

interface VaultAssetCardProps {
  asset: VaultAsset;
}

const categoryIcons: Record<string, typeof FileCode> = {
  code: FileCode,
  blueprint: FileText,
  template: Package,
};

const categoryColors: Record<string, string> = {
  code: "text-cyan-400",
  blueprint: "text-primary",
  template: "text-emerald-400",
};

export const VaultAssetCard = ({ asset }: VaultAssetCardProps) => {
  const { trackClick } = useTelemetry();
  const Icon = categoryIcons[asset.category] || FileText;
  const colorClass = categoryColors[asset.category] || "text-primary";

  const handleDownload = () => {
    trackClick(`vault_download_${asset.id}`, { 
      category: asset.category,
      title: asset.title,
      file_type: asset.file_type,
    });
    
    // Open file URL in new tab
    window.open(asset.file_url, "_blank", "noopener,noreferrer");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group relative"
    >
      <div className="relative h-full p-5 bg-card border border-border rounded-sm overflow-hidden transition-all duration-300 hover:border-primary/50 hover:glow-amber-box">
        <CornerAccent position="tl" size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
        <CornerAccent position="br" size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 flex items-center justify-center bg-surface-elevated rounded-sm border border-border group-hover:border-primary/50 transition-colors`}>
            <Icon className={`w-5 h-5 ${colorClass}`} />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] px-2 py-0.5 bg-muted/50 text-muted-foreground rounded-sm uppercase">
              {asset.file_type || "file"}
            </span>
            <span className="font-mono text-[10px] px-2 py-0.5 bg-primary/10 text-primary rounded-sm capitalize">
              {asset.category}
            </span>
          </div>
        </div>

        {/* Content */}
        <h3 className="font-semibold text-sm mb-2 line-clamp-1">{asset.title}</h3>
        {asset.description && (
          <p className="text-muted-foreground text-xs mb-4 line-clamp-2 leading-relaxed">
            {asset.description}
          </p>
        )}

        {/* Download Button */}
        <Button
          variant="secondary"
          size="sm"
          className="w-full font-mono text-xs gap-2 mt-auto"
          onClick={handleDownload}
        >
          <Download size={14} />
          download --asset
        </Button>

        {/* Background decoration */}
        <div className="absolute -bottom-4 -right-4 opacity-5 group-hover:opacity-10 transition-opacity">
          <Icon className="w-24 h-24" />
        </div>
      </div>
    </motion.div>
  );
};
