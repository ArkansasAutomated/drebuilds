import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useWhopUser } from "@/hooks/useWhopUser";
import { BlinkingCursor } from "@/components/ui/BlinkingCursor";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const { user, isLoading: authLoading, isAdmin: isSupabaseAdmin } = useAuth();
  const { isWhopAdmin, isLoading: whopLoading } = useWhopUser();
  const navigate = useNavigate();

  const isLoading = authLoading || whopLoading;
  // Admin access granted by either Supabase role OR Whop company membership
  const isAdmin = isSupabaseAdmin || isWhopAdmin;

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        navigate("/auth");
      } else if (requireAdmin && !isAdmin) {
        navigate("/");
      }
    }
  }, [user, isLoading, isAdmin, requireAdmin, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="font-mono text-primary flex items-center gap-2">
          <span>&gt; authenticating</span>
          <BlinkingCursor />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (requireAdmin && !isAdmin) {
    return null;
  }

  return <>{children}</>;
};
