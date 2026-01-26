import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  BarChart3, 
  FileText, 
  Settings, 
  Power,
  Terminal
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
  variant?: "default" | "danger";
}

const NavItem = ({ icon, label, isActive, onClick, variant = "default" }: NavItemProps) => {
  return (
    <motion.button
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-center p-3 rounded-sm transition-colors relative group",
        isActive 
          ? "bg-data/10 text-data" 
          : variant === "danger"
            ? "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={label}
    >
      {/* Active indicator */}
      {isActive && (
        <motion.div
          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-data rounded-r"
          layoutId="activeIndicator"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}
      {icon}
      
      {/* Tooltip */}
      <div className="absolute left-full ml-2 px-2 py-1 bg-card border border-border rounded text-xs font-mono opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
        {label}
      </div>
    </motion.button>
  );
};

export const AdminSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const navItems = [
    { icon: <LayoutDashboard size={20} />, label: "Dashboard", path: "/admin" },
    { icon: <BarChart3 size={20} />, label: "Analytics", path: "/admin/analytics" },
    { icon: <FileText size={20} />, label: "Content", path: "/admin/content" },
    { icon: <Settings size={20} />, label: "Settings", path: "/admin/settings" },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-16 bg-surface-deep border-r border-border flex flex-col z-50">
      {/* Logo */}
      <div className="p-3 border-b border-border">
        <motion.button
          onClick={() => navigate("/")}
          className="w-full flex items-center justify-center p-2 text-primary hover:text-primary-glow transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          aria-label="Back to home"
        >
          <Terminal size={24} className="glow-amber" />
        </motion.button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 space-y-2 px-2">
        {navItems.map((item) => (
          <NavItem
            key={item.path}
            icon={item.icon}
            label={item.label}
            isActive={location.pathname === item.path}
            onClick={() => navigate(item.path)}
          />
        ))}
      </nav>

      {/* Sign Out */}
      <div className="p-2 border-t border-border">
        <NavItem
          icon={<Power size={20} />}
          label="Sign Out"
          onClick={handleSignOut}
          variant="danger"
        />
      </div>
    </aside>
  );
};
